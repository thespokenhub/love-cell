import type { Data, Person } from './types';

// Group | name | role or f(irst-timer)/o(ld member) | services present at
const SEED = `L|Fred Adzah|Senior Shepherd|M11 L14 M18 L21
L|Nelson Ansah|Cell Shepherd|M11 L14 M18 L21
L|Emmanuella Lithur|Shepherd|M18 L21
N|Kezia|f|M11 L14 M18
N|Precious|f|M11 L14 M18
N|Bibiana|f|M11 L14 M18
N|Sheridan|f|M11 L14 M18
N|Josephine|f|M11 L14 L21
N|Josephine B|f|M11
N|Josephine Mamle|f|L14 M18
N|Shelter|f|M11 L14
N|Benedicta|f|M11 L14 M18 L21
N|Matilda|f|M11 L14 M18 L21
N|Derrick|f|M11
N|Fatima|f|M11
N|Collins|f|M11 L14 L21
N|Debbie|f|M11 L14 L21
N|Hannah|f|M11 L14
N|Lilian|f|L14
N|Bridget|f|L14 M18
N|Annabelle|f|L14 M18
N|Dela|f|L14
N|Faustina|f|L14
N|Kwabena|f|M18
N|George|f|M18
N|Juliet|f|M18
N|Eugenia|f|M18
N|Ewurabena|f|M18
N|Joy|f|L21
N|Gloria Viera|o|M11 M18
N|Tracy NeeQuaye|o|M18 L21
N|Kate Atsu|o|L21
N|Karen Tinawura|o|L21
E|Theresa|f|L14
E|Linda|f|L14 M18
E|Audrey|f|L14 M18 L21
E|Caroline|f|L14 L21
E|Dzifa|f|L14
E|Zion|f|L14
E|Judith Fafali|f|M18
E|Chris Mondy|f|M18
E|Josephine|f|M18
E|Mabel|f|M18
E|Vickybel|f|M18
E|Jane|f|M18
E|Janet|f|M18
E|Arnold|f|L21`;

/** Fixed ids for the three leaders. */
export const FRED = 'p1';
export const NELSON = 'p2';
export const ELLA = 'p3';

export function seed(): Data {
  const services: Data['services'] = [
    { id: 'M11', type: 'MGS', date: '2026-10-11' },
    { id: 'L14', type: 'LC', date: '2026-10-14' },
    { id: 'M18', type: 'MGS', date: '2026-10-18' },
    { id: 'L21', type: 'LC', date: '2026-10-21' },
  ];
  const att: Data['att'] = { M11: [], L14: [], M18: [], L21: [] };
  const people = SEED.split('\n').map((line, i): Person => {
    const [g, name, k, codes] = line.split('|');
    const id = 'p' + (i + 1);
    codes.split(' ').forEach(c => att[c].push(id));
    if (g === 'L') return { id, name, owner: null, kind: 'leader', role: k };
    return { id, name, owner: g === 'N' ? 'Nelson' : 'Ella', kind: k === 'o' ? 'old' : 'first' };
  });
  return { people, services, att };
}
