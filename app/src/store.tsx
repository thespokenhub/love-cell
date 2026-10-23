import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { localToday } from './core/dates';
import { compute, nextSlot, type Computed } from './core/rules';
import { seed } from './core/seed';
import type { Data, Owner, Slot, Task } from './core/types';

const KEY = 'lovecell-data-v1';

function load(): Data {
  try {
    const S = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (S && S.people && S.services && S.att) return S;
  } catch { /* fall through to seed */ }
  return seed();
}

export type Tab = 'home' | 'mark' | 'care' | 'people' | 'stats';
export type PeopleFilter = 'all' | 'missing' | 'back' | 'once' | 'new' | 'regular' | 'onoff' | 'followup' | 'none' | 'old' | 'leaders' | 'left';
export type OwnerFilter = 'all' | Owner;

export interface UI {
  tab: Tab;
  svcId: string | null;
  mf: OwnerFilter;
  q: string;
  pf: PeopleFilter;
  po: OwnerFilter;
  pq: string;
  pv: 'people' | 'helpers';
  careTask: Task;
  co: OwnerFilter;
  ftMode: 'week' | 'service';
  personId: string | null;
  reportId: string | null;
  sheet: 'assign' | 'pick' | 'meeting' | null;
  assignFor: string | null;
  meetingId: string | null;
  /** null = closed; otherwise the service chosen up front (undefined = default). */
  add: { svcId?: string } | null;
  feedback: boolean;
}

const initialUI: UI = {
  tab: 'home', svcId: null, mf: 'all', q: '', pf: 'all', po: 'all', pq: '', pv: 'people', careTask: 'pray',
  co: 'all', ftMode: 'week', personId: null, reportId: null, sheet: null, assignFor: null, meetingId: null, add: null, feedback: false,
};

interface Store {
  data: Data;
  c: Computed;
  today: string;
  next: Slot;
  /** Recorded services plus the next one. */
  slots: Slot[];
  ui: UI;
  set: (patch: Partial<UI>) => void;
  commit: (data: Data) => void;
  go: (tab: Tab, extra?: Partial<UI>) => void;
  toast: string | null;
  flash: (msg: string) => void;
  scrollRef: RefObject<HTMLDivElement>;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => useContext(Ctx)!;

/** "?today=2026-12-13" lets you try later dates against the same data. */
const pretendToday = () => {
  const t = new URLSearchParams(location.search).get('today');
  return t && /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : localToday();
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(load);
  const [ui, setUi] = useState<UI>(initialUI);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number>();
  const scrollRef = useRef<HTMLDivElement>(null);

  const commit = useCallback((d: Data) => {
    setData(d);
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage full or blocked */ }
  }, []);
  const set = useCallback((patch: Partial<UI>) => setUi(u => ({ ...u, ...patch })), []);
  const go = useCallback((tab: Tab, extra?: Partial<UI>) => {
    setUi(u => ({ ...u, tab, personId: null, ...extra }));
    scrollRef.current?.scrollTo(0, 0);
  }, []);
  const flash = useCallback((msg: string) => {
    clearTimeout(timer.current);
    setToast(msg);
    timer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const value = useMemo(() => {
    const c = compute(data, pretendToday());
    const next = nextSlot(c.svcs, c.today);
    return { data, c, today: c.today, next, slots: [...c.svcs, next], ui, set, commit, go, toast, flash, scrollRef };
  }, [data, ui, toast, set, commit, go, flash]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** The service picked in Attendance, or the next one. */
export const useCurrentSlot = () => {
  const { slots, next, ui } = useStore();
  return slots.find(s => s.id === ui.svcId) || next;
};
