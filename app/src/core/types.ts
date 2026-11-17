export type Owner = 'Nelson' | 'Ella';
export type Kind = 'leader' | 'first' | 'old';
export type SvcType = 'MGS' | 'LC';

export interface Person {
  id: string;
  name: string;
  owner: Owner | null;
  kind: Kind;
  role?: string;
  helper?: boolean;
  helperId?: string | null;
  left?: string | null;
}

export interface Service {
  id: string;
  type: SvcType;
  date: string;
  /** MGS only: the figures for the Mega Gathering Service report that the app can't count. */
  mgs?: MgsExtra;
}

export interface MgsExtra {
  mc?: string;
  pastors?: number;
  teens?: number;
  bused?: number;
  buses?: number;
  cost?: string;
}

export interface Meeting {
  id: string;
  date: string;
  present: string[];
}

export type WeeklyTask = 'pray' | 'audio' | 'prayWith' | 'reach';
export type Task = WeeklyTask | 'plan';

export interface Care {
  pray?: Record<string, string[]>;
  audio?: Record<string, string[]>;
  prayWith?: Record<string, string[]>;
  /** Follow up: who you called or messaged, by week. */
  reach?: Record<string, string[]>;
  plan?: string[];
}

export interface Data {
  people: Person[];
  services: Service[];
  /** serviceId → ids of the people present */
  att: Record<string, string[]>;
  care?: Care;
  meetings?: Meeting[];
  /** How many one-time updates (core/updates.ts) this data has had. */
  v?: number;
}

/** A service that may not be recorded yet (the next one). */
export interface Slot extends Service {
  isNew?: boolean;
}

export type StatusKey = 'leader' | 'old' | 'none' | 'new' | 'regular' | 'onoff' | 'followup' | 'left';

export interface PersonView extends Person {
  visits: Service[];
  firstVisit: string | null;
  firstSvc: Service | null;
  lastSeen: string | null;
  since: number | null;
  key: StatusKey;
  label: string;
  /** Services held / attended inside the first 8 weeks (first-timers with a visit only). */
  held?: number;
  attended?: number;
  week?: number;
  helper: boolean;
  flagged: boolean;
}
