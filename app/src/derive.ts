// View numbers shared by several screens, all worked out from the saved data and today.
import { fmtShort } from './core/dates';
import { doneSet, prayWithReady, readyOn, TASKS, type Computed } from './core/rules';
import type { Data, PersonView, Task } from './core/types';

export const members = (c: Computed) => c.people.filter(p => p.kind !== 'leader' && !p.left);
export const firstTimers = (c: Computed) => c.people.filter(p => p.kind === 'first' && !!p.firstVisit);
export const cameBackOf = (firsts: PersonView[]) => firsts.filter(p => p.visits.length > 1).length;
export const pctOf = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);

export interface TaskSummary {
  k: Task; label: string; short: string; hint: string;
  done: number; total: number;
  /** "3/44", or just "3" for the Bible plan */
  frac: string; unit: string;
  /** progress bar width, 0–100 */
  w: number;
  note: string;
}

export function careSummary(S: Data, c: Computed): TaskSummary[] {
  const m = members(c);
  const readyDates = firstTimers(c).filter(p => !prayWithReady(p, c.today)).map(p => readyOn(p)!).sort();
  return TASKS.map(t => {
    const done = doneSet(S, t.k, c.today);
    const elig = t.k === 'prayWith' ? m.filter(p => prayWithReady(p, c.today)) : m;
    const d = elig.filter(p => done.has(p.id)).length;
    const pct = pctOf(d, elig.length);
    const plan = t.k === 'plan';
    return {
      ...t, done: d, total: elig.length,
      frac: plan ? String(d) : `${d}/${elig.length}`,
      unit: plan ? 'reading' : 'done',
      w: plan ? (m.length ? (d / m.length) * 100 : 0) : pct,
      note: t.k === 'prayWith'
        ? `${elig.length} ready now${readyDates.length ? ' · more from ' + fmtShort(readyDates[0]) : ''}`
        : plan ? `${d} reading with you` : `${elig.length - d} still to do`,
    };
  });
}

export interface HelperStats { mine: PersonView[]; svc: string; meet: string; atLast: string; looking: string }

export function helperStats(S: Data, c: Computed, h: PersonView): HelperStats {
  const mine = c.people.filter(p => p.helperId === h.id && !p.left && p.kind !== 'leader' && p.id !== h.id);
  const meetings = S.meetings || [];
  const mt = meetings.filter(m => m.present.includes(h.id)).length;
  const last4 = c.svcs.slice(-4);
  const came = last4.filter(s => c.sets[s.id].has(h.id)).length;
  const lastSv = c.svcs[c.svcs.length - 1];
  const atLast = lastSv ? mine.filter(p => c.sets[lastSv.id].has(p.id)).length : 0;
  return {
    mine,
    meet: `${mt}/${meetings.length}`,
    svc: `${came}/${last4.length}`,
    atLast: `${atLast}/${mine.length}`,
    looking: mine.length === 1 ? 'Looking after 1 person' : `Looking after ${mine.length} people`,
  };
}

/** "3/4": first-timers count their first 8 weeks; everyone else counts all services. */
export const attShort = (p: PersonView, c: Computed) =>
  p.kind === 'first' && p.held != null ? `${p.attended}/${p.held}` : `${p.visits.length}/${c.svcs.length}`;
