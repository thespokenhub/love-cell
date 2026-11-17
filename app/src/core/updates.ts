// One-time updates to saved data. Each runs once on the phone (Data.v counts how many have run).
// They match people by name, so they work on whatever is already saved, including people added on the phone.
import type { Data, Kind, Owner, Person, SvcType } from './types';
import { ELLA, FRED, NELSON } from './seed';

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

interface Who {
  name: string;
  /** Other spellings used in reports, and the short names already in the app. */
  aka?: string[];
  owner?: Owner;
  kind?: Kind;
  helper?: boolean;
  /** Full name of the helper looking after them. */
  helperOf?: string;
}

/** Update 1 (17 Nov 2026): full names, the November services, the camp, and the helpers. */
const PEOPLE: Who[] = [
  // Full names for people already in the app
  { name: 'Precious Belley', aka: ['Precious'] },
  { name: 'Bibiana Awuma', aka: ['Bibiana'] },
  { name: 'Sheridan Naa Adjetey', aka: ['Sheridan'] },
  { name: 'Shelter Aba', aka: ['Shelter'] },
  { name: 'Matilda Noble', aka: ['Matilda'] },
  { name: 'Lilian Owusu', aka: ['Lilian'] },
  { name: 'Bridget Oppong', aka: ['Bridget'] },
  { name: 'Annabelle Yayra Adabrah', aka: ['Annabelle'] },
  { name: 'Eugenia Ellis', aka: ['Eugenia'] },
  { name: 'Linda Ansomah', aka: ['Linda'] },
  { name: 'Audrey Kuukua Damptsie', aka: ['Audrey'] },
  // New members who are becoming helpers straight away
  { name: 'Benedicta Dorvi', aka: ['Benedicta'], helper: true },
  { name: 'Deborah Amoakoah', aka: ['Debbie'], helper: true },
  // Old members who are helpers
  { name: 'Gloria Vieira', aka: ['Gloria Viera'], kind: 'old', helper: true },
  { name: 'Kate Atsu', kind: 'old', helper: true },
  { name: 'Karen Tinawura', kind: 'old', helper: true },
  { name: 'Tracy NeeQuaye', kind: 'old', helper: true },
  { name: 'Amariana Aggrey', aka: ['Amariana Agrrey'], owner: 'Nelson', kind: 'old', helper: true },
  { name: 'Abigail Ewusie', aka: ['Abigail Awusie'], owner: 'Nelson', kind: 'old', helper: true },
  { name: 'Gloria Ayoola', owner: 'Nelson', kind: 'old', helper: true },
  { name: 'Lois Larbi', owner: 'Nelson', kind: 'old', helper: true },
  { name: 'Saraphina Alluekeh', owner: 'Nelson', kind: 'old', helper: true },
  { name: 'Justine Sedi', owner: 'Nelson', kind: 'old', helper: true },
  // New first-timers
  { name: 'Gloria Boateng', owner: 'Nelson', kind: 'first' },
  { name: 'Vivian Tetteh', aka: ['Vivian Terreh'], owner: 'Nelson', kind: 'first' },
  { name: 'Judith Sowada', owner: 'Nelson', kind: 'first' },
  { name: 'Adelaide Mensah', owner: 'Nelson', kind: 'first' },
  { name: 'Derry Sodeke', owner: 'Nelson', kind: 'first' },
  { name: 'Emefa Agbemafle', owner: 'Nelson', kind: 'first' },
  { name: 'Henrietta Boateng', aka: ['Boateng Henrietta'], owner: 'Nelson', kind: 'first' },
  { name: 'Courage', owner: 'Nelson', kind: 'first', helperOf: 'Lois Larbi' },
  { name: 'Cecelia', owner: 'Nelson', kind: 'first', helperOf: 'Abigail Ewusie' },
];

/** Ella appears under other spellings in the reports. */
const ELLA_AKA = ['Emmanuella Lithur', 'Emmanuella Lither', 'Emmanuella Afedziwa', 'Ella'];

/** The reports as sent. Fred and Nelson were at all of them. These lists replace what was marked. */
const SERVICES: { type: SvcType; date: string; names: string[] }[] = [
  { type: 'MGS', date: '2026-11-01', names: ['Chris Mondy', 'Gloria Ayoola', 'Linda Ansomah', 'Audrey Kuukua Damptsie', 'Gloria Boateng', 'Abigail Ewusie', 'Judith Sowada', 'Amariana Aggrey', 'Emmanuella Afedziwa', 'Vivian Tetteh', 'Annabelle Yayra Adabrah', 'Benedicta Dorvi', 'Bibiana Awuma', 'Deborah Amoakoah', 'Shelter Aba', 'Justine Sedi', 'Kate Atsu', 'Karen Tinawura', 'Lois Larbi', 'Tracy NeeQuaye', 'Saraphina Alluekeh', 'Gloria Vieira'] },
  { type: 'LC', date: '2026-11-04', names: ['Emmanuella Lithur', 'Precious', 'Shelter Aba', 'Matilda Noble', 'Deborah Amoakoah', 'Bridget Oppong', 'Annabelle Yayra Adabrah', 'Dela', 'Kwabena', 'Gloria Viera', 'Tracy NeeQuaye', 'Kate Atsu', 'Karen Tinawura', 'Linda Ansomah', 'Audrey Kuukua Damptsie', 'Amariana Aggrey', 'Abigail Ewusie', 'Vivian Tetteh'] },
  { type: 'MGS', date: '2026-11-08', names: ['Vivian Tetteh', 'Annabelle Yayra Adabrah', 'Bridget Oppong', 'Eugenia Ellis', 'Tracy NeeQuaye', 'Saraphina Alluekeh', 'Gloria Vieira', 'Justine Sedi', 'Benedicta Dorvi', 'Deborah Amoakoah', 'Lilian Owusu', 'Sheridan Naa Adjetey', 'Judith Sowada', 'Adelaide Mensah', 'Derry Sodeke', 'Emefa Agbemafle', 'Boateng Henrietta', 'Audrey Kuukua Damptsie', 'Gloria Ayoola', 'Abigail Awusie', 'Gloria Boateng', 'Amariana Aggrey', 'Emmanuella Lither'] },
  { type: 'LC', date: '2026-11-11', names: ['Abigail Awusie', 'Gloria Boateng', 'Emmanuella Lithur', 'Precious Belley', 'Shelter Aba', 'Deborah Amoakoah', 'Tracy NeeQuaye', 'Kate Atsu', 'Karen Tinawura', 'Vivian Terreh', 'Lois Larbi', 'Audrey Kuukua Damptsie', 'Courage'] },
  { type: 'MGS', date: '2026-11-15', names: ['Emmanuella Lithur', 'Shelter Aba', 'Benedicta Dorvi', 'Deborah Amoakoah', 'Lilian Owusu', 'Bridget Oppong', 'Annabelle Yayra Adabrah', 'Eugenia Ellis', 'Gloria Viera', 'Tracy NeeQuaye', 'Kate Atsu', 'Karen Tinawura', 'Justine Sedi', 'Vivian Tetteh', 'Lois Larbi', 'Abigail Ewusie', 'Gloria Ayoola', 'Henrietta Boateng', 'Audrey Kuukua Damptsie', 'Cecelia', 'Amariana Aggrey', 'Saraphina Alluekeh'] },
];

/** No service on 28 Oct: the cell was at camp. Those marked are who went; these went too. */
const CAMP = { date: '2026-10-28', add: ['Judith Sowada', 'Saraphina Alluekeh', 'Lois Larbi', 'Abigail Ewusie', 'Gloria Ayoola', 'Gloria Vieira'] };

function update1(S: Data): Data {
  let people = S.people.map(p => ({ ...p }));
  const att: Data['att'] = { ...S.att };
  let services = [...S.services];

  const index = () => {
    const m = new Map<string, Person>();
    people.forEach(p => { if (!m.has(norm(p.name))) m.set(norm(p.name), p); });
    return m;
  };
  let byName = index();
  ELLA_AKA.forEach(n => byName.set(norm(n), people.find(p => p.id === ELLA)!));

  // Rename or add everyone, so each spelling points at one person.
  const idOf = new Map<string, string>();
  for (const w of PEOPLE) {
    const found = [w.name, ...(w.aka || [])].map(n => byName.get(norm(n))).find(Boolean);
    let p: Person;
    if (found) {
      p = found;
      p.name = w.name;
      if (w.kind && p.kind !== 'leader') p.kind = w.kind;
    } else {
      p = { id: 'p-' + norm(w.name).replace(/[^a-z0-9]+/g, '-'), name: w.name, owner: w.owner || 'Nelson', kind: w.kind || 'first' };
      people = [...people, p];
    }
    if (w.helper) p.helper = true;
    [w.name, ...(w.aka || [])].forEach(n => idOf.set(norm(n), p.id));
    byName = index();
    ELLA_AKA.forEach(n => byName.set(norm(n), people.find(x => x.id === ELLA)!));
  }
  for (const w of PEOPLE) {
    if (w.helperOf) people.find(p => p.id === idOf.get(norm(w.name)))!.helperId = idOf.get(norm(w.helperOf))!;
  }

  const resolve = (n: string) => {
    const id = idOf.get(norm(n)) || byName.get(norm(n))?.id;
    if (!id) throw new Error('Update 1: nobody called ' + n);
    return id;
  };

  for (const s of SERVICES) {
    let svc = services.find(x => x.date === s.date);
    if (!svc) {
      svc = { id: (s.type === 'MGS' ? 'M' : 'L') + s.date.replace(/-/g, ''), type: s.type, date: s.date };
      services = [...services, svc];
    }
    att[svc.id] = [...new Set([FRED, NELSON, ...s.names.map(resolve)])];
  }

  const camp = services.find(x => x.date === CAMP.date);
  if (camp) att[camp.id] = [...new Set([...(att[camp.id] || []), ...CAMP.add.map(resolve)])];

  return { ...S, people, services, att };
}

/** Update 2 (17 Nov 2026): Henrietta Boateng is one of Ella's people. */
function update2(S: Data): Data {
  return { ...S, people: S.people.map(p => (norm(p.name) === 'henrietta boateng' ? { ...p, owner: 'Ella' as Owner } : p)) };
}

/** Moves everything recorded for `from` onto `into` (attendance, care ticks, meetings, helpers), then removes `from`. */
function merge(S: Data, from: Person, into: Person): Data {
  const swap = (l: string[]) => [...new Set(l.map(id => (id === from.id ? into.id : id)))];
  const att: Data['att'] = {};
  for (const [k, l] of Object.entries(S.att)) att[k] = swap(l);
  const care: NonNullable<Data['care']> = {};
  for (const [k, v] of Object.entries(S.care || {})) {
    (care as Record<string, unknown>)[k] = Array.isArray(v) ? swap(v) : Object.fromEntries(Object.entries(v as Record<string, string[]>).map(([w, l]) => [w, swap(l)]));
  }
  const people = S.people.filter(p => p.id !== from.id).map(p => {
    let q = p.helperId === from.id ? { ...p, helperId: into.id } : p;
    if (q.id === into.id) q = { ...q, helper: q.helper || from.helper, helperId: q.helperId || (from.helperId !== into.id ? from.helperId : null) };
    return q;
  });
  const meetings = S.meetings?.map(m => ({ ...m, present: swap(m.present) }));
  return { ...S, people, att, care, ...(meetings ? { meetings } : {}) };
}

/** Merges every person `match` picks into the one called `into`. */
function mergeInto(S: Data, into: string, match: (p: Person) => boolean): Data {
  let T = S;
  const target = () => T.people.find(p => norm(p.name) === norm(into));
  for (const p of S.people.filter(p => match(p) && norm(p.name) !== norm(into))) {
    const t = target();
    if (t) T = merge(T, p, t);
  }
  return T;
}

/**
 * Update 3 (17 Nov 2026): people added on the phone under short names, and a double.
 * "Justine 300", "Vivian" and "Amariana" are Justine Sedi, Vivian Tetteh and Amariana Aggrey.
 * Nelson's "Josephine" is Josephine Mamle.
 */
function update3(S: Data): Data {
  // The first name alone, or followed only by numbers or brackets: "Justine", "Justine 300", "Justine (300)".
  const short = (first: string) => (p: Person) => p.kind !== 'leader' && new RegExp(`^${first}[^a-z]*$`).test(norm(p.name));
  let T = S;
  T = mergeInto(T, 'Justine Sedi', short('justine'));
  T = mergeInto(T, 'Vivian Tetteh', short('vivian'));
  T = mergeInto(T, 'Amariana Aggrey', short('amariana'));
  T = mergeInto(T, 'Josephine Mamle', p => p.owner === 'Nelson' && norm(p.name) === 'josephine');
  return T;
}

const UPDATES = [update1, update2, update3];

/** Runs any updates this data hasn't had yet. Returns the same object when there's nothing to do. */
export function applyUpdates(S: Data): Data {
  let v = S.v || 0;
  let T = S;
  while (v < UPDATES.length) T = { ...UPDATES[v](T), v: ++v };
  return T;
}
