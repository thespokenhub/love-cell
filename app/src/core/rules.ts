import { addDays, days, fmtSlash, wd, weekStart } from './dates';
import { ELLA, FRED, NELSON } from './seed';
import type { Data, Person, PersonView, Service, Slot, SvcType, Task } from './types';

export const SVC_NAME: Record<SvcType, string> = { MGS: 'MGS', LC: 'LC Live' };

const WINDOW_DAYS = 56; // first 2 months = 8 weeks
const FLAG_DAYS = 21; // not seen for 3+ weeks
const PRAY_WITH_DAYS = 45; // 1½ months

export interface Computed {
  svcs: Service[];
  /** max(real today, latest recorded service) */
  today: string;
  people: PersonView[];
  sets: Record<string, Set<string>>;
  byId: Record<string, PersonView>;
}

export function compute(S: Data, todayIn: string): Computed {
  const svcs = [...S.services].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const lastDate = svcs.length ? svcs[svcs.length - 1].date : todayIn;
  const today = todayIn > lastDate ? todayIn : lastDate;
  const sets: Record<string, Set<string>> = {};
  svcs.forEach(s => (sets[s.id] = new Set(S.att[s.id] || [])));

  const people = S.people.map((p): PersonView => {
    const visits = svcs.filter(s => sets[s.id].has(p.id));
    const fv = visits.length ? visits[0].date : null;
    const ls = visits.length ? visits[visits.length - 1].date : null;
    const r: PersonView = {
      ...p, visits, firstVisit: fv, firstSvc: visits[0] || null, lastSeen: ls,
      since: ls ? days(ls, today) : null, key: 'none', label: 'Not seen yet', helper: false, flagged: false,
    };
    if (p.kind === 'leader') { r.key = 'leader'; r.label = p.role || 'Leader'; }
    else if (p.kind === 'old') { r.key = 'old'; r.label = 'Old member'; }
    else if (fv) {
      const end = addDays(fv, WINDOW_DAYS);
      const win = svcs.filter(s => s.date >= fv && s.date < end);
      r.held = win.length;
      r.attended = win.filter(s => sets[s.id].has(p.id)).length;
      if (today < end) {
        r.week = Math.min(8, Math.floor(days(fv, today) / 7) + 1);
        r.key = 'new';
        r.label = `New · week ${r.week} of 8`;
      } else {
        const pct = r.attended / r.held;
        r.key = pct >= 0.75 ? 'regular' : pct >= 0.4 ? 'onoff' : 'followup';
        r.label = STATUS_LABEL[r.key];
      }
    }
    if (p.left && p.kind !== 'leader') { r.key = 'left'; r.label = 'Stopped coming'; }
    r.helper = !!p.helper && !p.left && p.kind !== 'leader';
    r.flagged = p.id !== NELSON && !p.left && !!ls && (r.since ?? 0) >= FLAG_DAYS;
    return r;
  });
  const byId: Record<string, PersonView> = {};
  people.forEach(p => (byId[p.id] = p));
  return { svcs, today, people, sets, byId };
}

const STATUS_LABEL: Record<string, string> = {
  regular: 'Coming regularly',
  onoff: 'On and off',
  followup: 'Needs a follow-up',
};

/** The next Sunday (MGS) or Wednesday (LC Live) after the latest recorded service. */
export function nextSlot(svcs: Service[], today: string): Slot {
  let d = svcs.length ? addDays(svcs[svcs.length - 1].date, 1) : today;
  while (wd(d) !== 0 && wd(d) !== 3) d = addDays(d, 1);
  const type: SvcType = wd(d) === 0 ? 'MGS' : 'LC';
  return { id: (type === 'MGS' ? 'M' : 'L') + d.replace(/-/g, ''), type, date: d, isNew: true };
}

const LEADER_LINES: [string, string][] = [[FRED, '*SS - Fred Adzah'], [NELSON, '*CS - Nelson Ansah'], [ELLA, '*S - Emmanuella Lithur']];

/** Who was missing from a service: everyone who was already part of the cell by then and hadn't stopped coming. */
export function absentFrom(S: Data, slot: Service): Person[] {
  const set = new Set(S.att[slot.id] || []);
  const cameBefore = (id: string) => S.services.some(s => s.date < slot.date && (S.att[s.id] || []).includes(id));
  return S.people.filter(p => !set.has(p.id) && (p.kind === 'leader' ||
    ((!p.left || p.left > slot.date) && cameBefore(p.id))));
}

export function reportText(S: Data, slot: Service, withAbsent = false): { text: string; count: number; absent: number } {
  const set = new Set(S.att[slot.id] || []);
  const lines = (has: (id: string) => boolean, people: Person[]) => {
    const L: string[] = [];
    LEADER_LINES.forEach(([id, line]) => has(id) && L.push(line));
    people.filter(p => p.owner === 'Nelson' && has(p.id)).forEach(p => L.push('- ' + p.name));
    people.filter(p => p.owner === 'Ella' && has(p.id)).forEach(p => L.push(`- ${p.name} (from Ella)`));
    return L;
  };
  const L = ['*OASIS BACENTA ATTENDANCE*', `${slot.type === 'MGS' ? 'MGS' : 'LC LIVE'} - ${fmtSlash(slot.date)}`, ...lines(id => set.has(id), S.people)];
  const absent = absentFrom(S, slot);
  if (withAbsent && absent.length) {
    const ids = new Set(absent.map(p => p.id));
    L.push('', `*ABSENT (${absent.length})*`, ...lines(id => ids.has(id), absent));
  }
  return { text: L.join('\n'), count: set.size, absent: absent.length };
}

export const dispName = (p: Person) => (p.id === ELLA ? 'Emmanuella Lithur (Ella)' : p.name);

/** Date "Pray with them" opens, or null if it's open already for this kind of person. */
export const readyOn = (p: PersonView) =>
  p.kind === 'old' || !p.firstVisit ? null : addDays(p.firstVisit, PRAY_WITH_DAYS);
export const prayWithReady = (p: PersonView, today: string) =>
  p.kind === 'old' || (!!p.firstVisit && today >= addDays(p.firstVisit, PRAY_WITH_DAYS));

/** Who has a task done this week (plan is a single on/off, not weekly). */
export function doneSet(S: Data, task: Task, today: string): Set<string> {
  const care = S.care || {};
  if (task === 'plan') return new Set(care.plan || []);
  return new Set((care[task] || {})[weekStart(today)] || []);
}

export const TASKS: { k: Task; label: string; short: string; hint: string }[] = [
  { k: 'pray', label: 'Pray for them', short: 'Pray for', hint: 'Every week, for everyone' },
  { k: 'audio', label: 'Send an audio message', short: 'Audio', hint: 'Every week, for everyone' },
  { k: 'prayWith', label: 'Pray with them', short: 'Pray with', hint: 'Starts 1½ months after their first visit' },
  { k: 'plan', label: 'Read a Bible plan together', short: 'Bible plan', hint: 'Tick who is reading a plan with you' },
];

/** The people at Shepherds' meetings: Ella plus all helpers. */
export const meetingPeople = (people: PersonView[]) => people.filter(p => p.id === ELLA || p.helper);
