// Pure updates: each takes the saved Data and returns a new copy.
import { addDays, weekStart } from './dates';
import type { Data, Meeting, Owner, Person, Slot, Task } from './types';

const newId = (prefix: string) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Adds the slot to the recorded services if it isn't there yet. */
function withSvc(S: Data, slot: Slot): Data {
  const services = S.services.some(s => s.id === slot.id)
    ? S.services
    : [...S.services, { id: slot.id, type: slot.type, date: slot.date }];
  return { ...S, services, att: { ...S.att, [slot.id]: S.att[slot.id] || [] } };
}

export function toggleAttendance(S: Data, slot: Slot, pid: string): Data {
  const T = withSvc(S, slot);
  const l = T.att[slot.id];
  return { ...T, att: { ...T.att, [slot.id]: l.includes(pid) ? l.filter(x => x !== pid) : [...l, pid] } };
}

export function addPerson(S: Data, name: string, owner: Owner, old: boolean, slot: Slot | null): { data: Data; person: Person } {
  const person: Person = { id: newId('p'), name: name.trim(), owner, kind: old ? 'old' : 'first' };
  let T: Data = { ...S, people: [...S.people, person] };
  if (slot) {
    T = withSvc(T, slot);
    T = { ...T, att: { ...T.att, [slot.id]: [...T.att[slot.id], person.id] } };
  }
  return { data: T, person };
}

export const patchPerson = (S: Data, pid: string, patch: Partial<Person>): Data => ({
  ...S,
  people: S.people.map(p => (p.id === pid ? { ...p, ...patch } : p)),
});

const flip = (l: string[], id: string) => (l.includes(id) ? l.filter(x => x !== id) : [...l, id]);

export function tick(S: Data, task: Task, pid: string, today: string): Data {
  const care = { ...(S.care || {}) };
  if (task === 'plan') care.plan = flip(care.plan || [], pid);
  else {
    const week = weekStart(today);
    const m = { ...(care[task] || {}) };
    m[week] = flip(m[week] || [], pid);
    care[task] = m;
  }
  return { ...S, care };
}

export function newMeeting(S: Data, date: string): { data: Data; id: string } {
  const id = newId('sm');
  return { data: { ...S, meetings: [...(S.meetings || []), { id, date, present: [] }] }, id };
}

const patchMeeting = (S: Data, id: string, fn: (m: Meeting) => Meeting): Data => ({
  ...S,
  meetings: (S.meetings || []).map(m => (m.id === id ? fn(m) : m)),
});

export const toggleMeeting = (S: Data, id: string, pid: string) =>
  patchMeeting(S, id, m => ({ ...m, present: flip(m.present, pid) }));
export const shiftMeeting = (S: Data, id: string, n: number) =>
  patchMeeting(S, id, m => ({ ...m, date: addDays(m.date, n) }));
export const deleteMeeting = (S: Data, id: string): Data => ({
  ...S,
  meetings: (S.meetings || []).filter(m => m.id !== id),
});
