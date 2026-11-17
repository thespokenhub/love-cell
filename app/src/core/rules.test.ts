import { describe, expect, it } from 'vitest';
import { weekStart } from './dates';
import { addPerson, tick, toggleAttendance } from './actions';
import { compute, followUp, mgsReportText, nextSlot, reportText } from './rules';
import { applyUpdates } from './updates';
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
  it('writes the numbered list for LC Live 21 Oct', () => {
    const S = seed();
    const r = reportText(S, S.services[3]);
    const lines = r.text.split('\n');
    expect(lines.slice(0, 8)).toEqual([
      '*OASIS BACENTA ATTENDANCE*', '', '💻 *LC LIVE* - 21/10/2026', '', '*SS - Fred Adzah*', '', 'CS - Nelson Ansah', '1. Emmanuella Lithur',
    ]);
    expect(lines[8]).toBe('2. Josephine');
    expect(lines.at(-1)).toBe('13. Arnold');
    expect(r.count).toBe(15);
  });
});

describe('absent list', () => {
  it('lists who was missing, leaving out people who had not come yet', () => {
    const S = seed();
    const r = reportText(S, S.services[3], true);
    const lines = r.text.split('\n');
    const i = lines.indexOf('*ABSENT (32)*');
    expect(i).toBeGreaterThan(0);
    const absent = lines.slice(i + 1);
    expect(absent[0]).toBe('1. Kezia');
    expect(absent).toContain('22. Theresa');
    expect(absent.join('\n')).not.toMatch(/Joy|Arnold/); // both came for the first time at this service
    expect(r.absent).toBe(32);
  });

  it('counts only Ella absent at the very first service', () => {
    const S = seed();
    expect(reportText(S, S.services[0], true).absent).toBe(1);
  });

  it('leaves the report as it was unless asked', () => {
    const S = seed();
    expect(reportText(S, S.services[3]).text).not.toContain('ABSENT');
  });
});

describe('update 1: full names and November', () => {
  const S = applyUpdates(seed());
  const at = (date: string) => S.att[S.services.find(s => s.date === date)!.id];
  const named = (n: string) => S.people.filter(p => p.name === n);

  it('runs once', () => {
    expect(S.v).toBe(3);
    expect(applyUpdates(S)).toBe(S);
  });

  it('matches the November reports (plus Fred and Nelson)', () => {
    expect(at('2026-11-01')).toHaveLength(24);
    expect(at('2026-11-04')).toHaveLength(20);
    expect(at('2026-11-08')).toHaveLength(25);
    expect(at('2026-11-11')).toHaveLength(15);
    expect(at('2026-11-15')).toHaveLength(24);
  });

  it('keeps the October totals (L14 is 24 once the two Josephines are one person)', () => {
    expect(['M11', 'L14', 'M18', 'L21'].map(id => S.att[id].length)).toEqual([17, 24, 28, 15]);
  });

  it('gives full names without making copies', () => {
    expect(named('Deborah Amoakoah')).toHaveLength(1);
    expect(named('Debbie')).toHaveLength(0);
    expect(named('Abigail Ewusie')).toHaveLength(1);
    expect(named('Vivian Tetteh')).toHaveLength(1);
    expect(named('Gloria Vieira')[0].kind).toBe('old');
    expect(named('Linda Ansomah')[0].owner).toBe('Ella');
    expect(named('Judith Fafali')).toHaveLength(1);
    expect(named('Judith Sowada')).toHaveLength(1);
  });

  it('marks the helpers and who they look after', () => {
    const helpers = S.people.filter(p => p.helper).map(p => p.name);
    expect(helpers).toHaveLength(12);
    expect(helpers).toContain('Benedicta Dorvi');
    expect(named('Benedicta Dorvi')[0].kind).toBe('first');
    expect(named('Courage')[0].helperId).toBe(named('Lois Larbi')[0].id);
    expect(named('Cecelia')[0].helperId).toBe(named('Abigail Ewusie')[0].id);
  });

  it('merges people added under short names, and the two Josephines (update 3)', () => {
    // As on the phone: update 1 done, then people added by hand under short names on 25 Oct.
    const S1 = applyUpdates({ ...seed(), v: 0 });
    const base = { ...S1, v: 2 };
    const m25 = { id: 'M20261025', type: 'MGS' as const, date: '2026-10-25' };
    const extra = [
      { id: 'x1', name: 'Justine 300', owner: 'Nelson' as const, kind: 'first' as const },
      { id: 'x2', name: 'Vivian', owner: 'Nelson' as const, kind: 'first' as const },
      { id: 'x3', name: 'Amariana', owner: 'Nelson' as const, kind: 'first' as const, helperId: null },
    ];
    const lois = base.people.find(p => p.name === 'Lois Larbi')!.id;
    const phone = {
      ...base,
      people: [...base.people, ...extra, { id: 'x4', name: 'Kid', owner: 'Nelson' as const, kind: 'first' as const, helperId: 'x3' }],
      services: [...base.services, m25],
      att: { ...base.att, [m25.id]: ['p1', 'p2', 'x1', 'x2', 'x3', lois] },
      care: { pray: { '2026-10-25': ['x2'] }, plan: ['x1'] },
    };
    const T = applyUpdates(phone);
    const id = (n: string) => T.people.find(p => p.name === n)!.id;
    expect(T.people.map(p => p.name)).not.toEqual(expect.arrayContaining(['Justine 300']));
    expect(T.people.filter(p => /^(Vivian|Amariana|Justine)/.test(p.name)).map(p => p.name).sort()).toEqual(['Amariana Aggrey', 'Justine Sedi', 'Vivian Tetteh']);
    expect(T.att[m25.id]).toEqual(expect.arrayContaining([id('Justine Sedi'), id('Vivian Tetteh'), id('Amariana Aggrey')]));
    expect(T.care!.pray!['2026-10-25']).toEqual([id('Vivian Tetteh')]);
    expect(T.care!.plan).toEqual([id('Justine Sedi')]);
    expect(T.people.find(p => p.name === 'Kid')!.helperId).toBe(id('Amariana Aggrey'));
    expect(T.people.find(p => p.name === 'Amariana Aggrey')!.helper).toBe(true);

    // One Josephine Mamle, with both sets of visits; Ella's Josephine is untouched.
    expect(T.people.filter(p => p.name === 'Josephine' && p.owner === 'Nelson')).toHaveLength(0);
    expect(T.people.filter(p => p.name === 'Josephine' && p.owner === 'Ella')).toHaveLength(1);
    const jm = id('Josephine Mamle');
    expect(['M11', 'L14', 'M18', 'L21'].filter(s => T.att[s].includes(jm))).toEqual(['M11', 'L14', 'M18', 'L21']);
    expect(['M11', 'L14', 'M18', 'L21'].map(s => T.att[s].length)).toEqual([17, 24, 28, 15]);
  });

  it('puts Henrietta Boateng with Ella (update 2), also on phones that already had update 1', () => {
    expect(named('Henrietta Boateng')[0].owner).toBe('Ella');
    const S1 = { ...S, v: 1, people: S.people.map(p => (p.name === 'Henrietta Boateng' ? { ...p, owner: 'Nelson' as const } : p)) };
    expect(applyUpdates(S1).people.find(p => p.name === 'Henrietta Boateng')!.owner).toBe('Ella');
  });

  it('adds the camp-goers to 28 Oct when that day is saved', () => {
    const withCamp = applyUpdates({ ...seed(), services: [...seed().services, { id: 'L20261028', type: 'LC', date: '2026-10-28' }], att: { ...seed().att, L20261028: ['p2', 'p4'] } });
    const camp = withCamp.att.L20261028;
    expect(camp).toContain('p4');
    expect(camp).toHaveLength(8);
  });

  it('writes the MGS service report', () => {
    const m = S.services.find(s => s.date === '2026-11-08')!;
    const text = mgsReportText(S, { ...m, mgs: { mc: 'Lampo', bused: 17, buses: 1 } });
    expect(text).toContain('DATE: 08/11/2026');
    expect(text).toContain('MC: Lampo');
    expect(text).toContain('SHEPHERDS - 3');
    expect(text).toContain('FIRST TIMERS - 4'); // Adelaide, Derry, Emefa, Henrietta
    expect(text).toContain('MEMBERS - 18');
    expect(text).toContain('TOTAL ATTENDANCE - 25');
    expect(text).toContain('Num. THAT CAME ON THEIR OWN - 8');
  });
});

describe('follow up', () => {
  const names = (g: ReturnType<typeof followUp>[number]) => g.people.map(x => x.p.name);

  it('lists who came to the service before last but missed the last one', () => {
    const [missed, once, gone] = followUp(compute(seed(), TODAY));
    expect(names(missed)).toContain('Kezia'); // M18 yes, L21 no
    expect(names(missed)).not.toContain('Benedicta'); // came to both
    expect(names(missed)).not.toContain('Fred Adzah');
    expect(names(once)).toEqual(expect.arrayContaining(['Derrick', 'Lilian', 'Theresa']));
    expect(names(once)).not.toContain('Kwabena'); // first came 5 days ago
    expect(gone.people).toHaveLength(0);
  });

  it('moves people to "not seen" after 3 weeks, and lists each person once', () => {
    const groups = followUp(compute(seed(), '2026-11-08'));
    const all = groups.flatMap(names);
    expect(new Set(all).size).toBe(all.length);
    expect(names(groups[2])).toContain('Derrick');
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
