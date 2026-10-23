import { describe, expect, it } from 'vitest';
import { weekStart } from './dates';
import { addPerson, tick, toggleAttendance } from './actions';
import { compute, nextSlot, reportText } from './rules';
import { seed } from './seed';

const TODAY = '2026-10-23';

describe('seed data', () => {
  const S = seed();
  const c = compute(S, TODAY);
  const firsts = c.people.filter(p => p.kind === 'first' && p.firstVisit);

  it('has 47 people', () => expect(S.people).toHaveLength(47));

  it('matches the expected totals per service', () => {
    expect(Object.fromEntries(c.svcs.map(s => [s.id, c.sets[s.id].size]))).toEqual({ M11: 17, L14: 25, M18: 28, L21: 15 });
  });

  it('counts 40 first-timers: 26 Nelson, 14 Ella', () => {
    expect(firsts).toHaveLength(40);
    expect(firsts.filter(p => p.owner === 'Nelson')).toHaveLength(26);
    expect(firsts.filter(p => p.owner === 'Ella')).toHaveLength(14);
  });

  it('has 17 who came back', () => expect(firsts.filter(p => p.visits.length > 1)).toHaveLength(17));

  it('counts first-timers per week as people', () => {
    const by = (w: string) => firsts.filter(p => weekStart(p.firstVisit!) === w).length;
    expect(by('2026-10-11')).toBe(26);
    expect(by('2026-10-18')).toBe(14);
  });

  it('puts Vickybel with Ella', () => expect(S.people.find(p => p.name === 'Vickybel')!.owner).toBe('Ella'));

  it('shows new people in their week', () => {
    const kezia = c.people.find(p => p.name === 'Kezia')!;
    expect(kezia.label).toBe('New · week 2 of 8');
    expect([kezia.attended, kezia.held]).toEqual([3, 4]);
  });

  it('flags nobody yet', () => expect(c.people.filter(p => p.flagged)).toHaveLength(0));
});

describe('later dates', () => {
  it('flags people not seen for 3+ weeks', () => {
    const c = compute(seed(), '2026-11-01');
    const derrick = c.people.find(p => p.name === 'Derrick')!;
    expect(derrick.flagged).toBe(true);
    expect(c.people.find(p => p.name === 'Nelson Ansah')!.flagged).toBe(false);
  });

  it('gives after-8-weeks statuses', () => {
    const c = compute(seed(), '2026-12-13');
    expect(c.people.find(p => p.name === 'Benedicta')!.label).toBe('Coming regularly');
    expect(c.people.find(p => p.name === 'Kezia')!.label).toBe('Coming regularly');
    expect(c.people.find(p => p.name === 'Collins')!.label).toBe('Coming regularly');
    expect(c.people.find(p => p.name === 'Hannah')!.label).toBe('On and off');
    expect(c.people.find(p => p.name === 'Derrick')!.label).toBe('Needs a follow-up');
  });
});

describe('report', () => {
  it('writes the LC Live 21 Oct report', () => {
    const S = seed();
    const r = reportText(S, S.services[3]);
    const lines = r.text.split('\n');
    expect(lines.slice(0, 5)).toEqual([
      '*OASIS BACENTA ATTENDANCE*', 'LC LIVE - 21/10/26', '*SS - Fred Adzah', '*CS - Nelson Ansah', '*S - Emmanuella Lithur',
    ]);
    expect(lines[5]).toBe('- Josephine');
    expect(lines.at(-1)).toBe('- Arnold (from Ella)');
    expect(r.count).toBe(15);
  });
});

describe('actions', () => {
  it('creates the next service when marking someone there', () => {
    const S = seed();
    const next = nextSlot(compute(S, TODAY).svcs, TODAY);
    expect(next).toMatchObject({ type: 'MGS', date: '2026-10-25' });
    const T = toggleAttendance(S, next, 'p4');
    expect(T.services).toHaveLength(5);
    expect(T.att[next.id]).toEqual(['p4']);
    expect(toggleAttendance(T, next, 'p4').att[next.id]).toEqual([]);
  });

  it('adds a person in one step and marks them', () => {
    const S = seed();
    const { data, person } = addPerson(S, '  Ama ', 'Ella', false, S.services[3]);
    expect(person).toMatchObject({ name: 'Ama', owner: 'Ella', kind: 'first' });
    expect(data.att.L21).toContain(person.id);
  });

  it('stores weekly ticks by the week start', () => {
    const T = tick(seed(), 'pray', 'p4', TODAY);
    expect(T.care!.pray!['2026-10-18']).toEqual(['p4']);
  });
});
