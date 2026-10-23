import { useEffect, useState } from 'react';
import { addDays, dayNum, days, fmt, fmtShort, weekStart, weekdayShort } from '../core/dates';
import { SVC_NAME } from '../core/rules';
import type { Owner } from '../core/types';
import { cameBackOf, careSummary, firstTimers, pctOf } from '../derive';
import { useStore } from '../store';
import { C, OWN, ownerOf } from '../theme';
import { Av, Progress } from '../ui';
import { seed } from '../core/seed';
import { careWeek } from './Care';

export default function Home() {
  const { data, c, today, next, ui, set, go, commit, flash } = useStore();
  const { svcs, sets, people } = c;
  const firsts = firstTimers(c);
  const week = weekStart(today);
  const newWeek = firsts.filter(p => weekStart(p.firstVisit!) === week).length;
  const cameBack = cameBackOf(firsts);
  const flagged = people.filter(p => p.flagged).length;
  const dNext = days(today, next.date);
  const when = dNext === 0 ? 'Today' : dNext === 1 ? 'Tomorrow' : `In ${dNext} days`;
  const tasks = careSummary(data, c);
  const showNew = () => go('people', { pf: 'new', po: 'all', pq: '', pv: 'people' });
  const showMissing = () => go('people', { pf: 'missing', po: 'all', pq: '', pv: 'people' });

  // First-timers chart: by the week of their first visit, or by the service of their first visit.
  const split = (l: typeof firsts) => ({ n: l.filter(p => p.owner === 'Nelson').length, e: l.filter(p => p.owner === 'Ella').length });
  let bars: { top: string; sub: string; n: number; e: number }[];
  if (ui.ftMode === 'service') {
    bars = svcs.slice(-6).map(s => ({ top: SVC_NAME[s.type], sub: fmtShort(s.date), ...split(firsts.filter(p => p.firstSvc!.id === s.id)) }));
  } else {
    const ws: string[] = [];
    for (let w = weekStart(svcs.length ? svcs[0].date : today); w <= week; w = addDays(w, 7)) ws.push(w);
    bars = ws.slice(-6).map(w => ({ top: w === week ? 'This week' : 'Week of', sub: fmtShort(w), ...split(firsts.filter(p => weekStart(p.firstVisit!) === w)) }));
  }
  const mx = Math.max(1, ...bars.map(b => b.n + b.e));

  const lastSvc = svcs[svcs.length - 1];
  let last = null;
  if (lastSvc) {
    const set = sets[lastSvc.id];
    const cnt = (f: (p: (typeof people)[number]) => boolean) => people.filter(p => set.has(p.id) && f(p)).length;
    const tot = Math.max(1, set.size);
    const prev = svcs.filter(x => x.type === lastSvc.type && x.date < lastSvc.date).pop();
    const d = prev ? set.size - sets[prev.id].size : null;
    const name = SVC_NAME[lastSvc.type];
    last = {
      name, date: fmt(lastSvc.date), count: set.size,
      delta: d === null ? `First ${name} on record` : `${d > 0 ? '+' + d : d} vs last ${name}`,
      deltaFg: d === null || d === 0 ? C.muted : d > 0 ? C.up : C.down,
      l: cnt(p => p.kind === 'leader'), n: cnt(p => p.owner === 'Nelson'), e: cnt(p => p.owner === 'Ella'), tot,
    };
  }

  const newP = firsts.filter(p => p.key === 'new')
    .sort((a, b) => (a.firstVisit! < b.firstVisit! ? -1 : a.firstVisit! > b.firstVisit! ? 1 : b.attended! - a.attended!));

  // Wiping everything takes two taps: the first one asks.
  const [sure, setSure] = useState(false);
  useEffect(() => {
    if (!sure) return;
    const t = setTimeout(() => setSure(false), 4000);
    return () => clearTimeout(t);
  }, [sure]);
  const reset = () => {
    if (!sure) { setSure(true); return; }
    setSure(false);
    commit(seed());
    set({ svcId: null, personId: null, reportId: null });
    flash('Back to the 4 real services');
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 2px' }}>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">LOVE CELL · {fmt(today)}</div>
          <div className="title">Hi, Nelson</div>
        </div>
        <div onClick={() => set({ add: {} })} aria-label="Add someone new" role="button" className="tap"
          style={{ width: 48, height: 48, borderRadius: 24, background: C.ink, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, lineHeight: 1 }}>+</div>
      </div>

      <div style={{ background: C.ink, color: '#FFF', borderRadius: 22, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 54, height: 58, flex: 'none', borderRadius: 14, background: '#FFF', color: C.ink, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.05 }}>
          <div className="mono" style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase' }}>{weekdayShort(next.date)}</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{dayNum(next.date)}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '.08em', color: '#B8B6AE' }}>NEXT · {when}</div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{SVC_NAME[next.type]}</div>
        </div>
        <button onClick={() => go('mark', { svcId: next.id })}
          style={{ height: 44, padding: '0 16px', borderRadius: 12, border: 'none', background: C.accent, color: C.ink, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Attendance</button>
      </div>

      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
        <div onClick={showNew} className="tap" style={{ padding: 14, borderRight: `1px solid ${C.line}` }}>
          <div className="small">First-timers</div>
          <div className="big">{firsts.length}</div>
          <div className="mono" style={{ fontSize: 11, color: C.up }}>+{newWeek} this week</div>
        </div>
        <div style={{ padding: 14, borderRight: `1px solid ${C.line}` }}>
          <div className="small">Came back</div>
          <div className="big">{cameBack}</div>
          <div className="mono" style={{ fontSize: 11, color: C.muted }}>{pctOf(cameBack, firsts.length)}% of them</div>
        </div>
        <div onClick={showMissing} className="tap" style={{ padding: 14 }}>
          <div className="small">Not seen 3+ wks</div>
          <div className="big">{flagged}</div>
          <div className="mono" style={{ fontSize: 11, color: C.muted }}>see who →</div>
        </div>
      </div>

      <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div>
            <div className="card-title">First-timers</div>
            <div className="sub">People counted once, at their first visit</div>
          </div>
          <div style={{ flex: 'none', display: 'flex', background: C.track, borderRadius: 10, padding: 3 }}>
            {([['week', 'By week'], ['service', 'By service']] as const).map(([k, l]) => {
              const on = ui.ftMode === k;
              return (
                <div key={k} onClick={() => set({ ftMode: k })} className="tap"
                  style={{ height: 28, padding: '0 9px', borderRadius: 7, background: on ? '#FFF' : 'transparent', color: on ? C.ink : C.muted, boxShadow: on ? '0 1px 2px rgba(0,0,0,0.12)' : 'none', display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>{l}</div>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 10, height: 170, borderBottom: `1px solid ${C.divider}` }}>
          {bars.map((b, i) => (
            <div key={i} style={{ flex: 1, maxWidth: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{b.n + b.e}</div>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ height: Math.round((b.e / mx) * 120), borderRadius: 8, background: C.ella }} />
                <div style={{ height: Math.round((b.n / mx) * 120), borderRadius: 8, background: C.accent }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', gap: 10, marginTop: -6 }}>
          {bars.map((b, i) => (
            <div key={i} style={{ flex: 1, maxWidth: 70, textAlign: 'center', lineHeight: 1.3 }}>
              <div style={{ fontSize: 11, color: C.muted }}>{b.top}</div>
              <div className="mono" style={{ fontSize: 11, fontWeight: 600 }}>{b.sub}</div>
            </div>
          ))}
        </div>
        <div className="legend" style={{ gap: 16 }}>
          <span><span className="sq" style={{ background: C.accent }} />Nelson's · {firsts.filter(p => p.owner === 'Nelson').length}</span>
          <span><span className="sq" style={{ background: C.ella }} />Ella's · {firsts.filter(p => p.owner === 'Ella').length}</span>
        </div>
      </div>

      <div className="card" style={{ padding: '6px 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0 4px' }}>
          <div className="card-title">This week's care</div>
          <div className="mono" style={{ fontSize: 11, color: C.muted }}>{careWeek(today)}</div>
        </div>
        {tasks.map(t => (
          <div key={t.k} onClick={() => go('care', { careTask: t.k })} className="row tap" style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: '11px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{t.label}</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{t.frac} <span style={{ fontWeight: 400, color: C.muted, fontSize: 11 }}>{t.unit}</span></div>
            </div>
            <Progress pct={t.w} />
            <div style={{ fontSize: 11, color: C.muted }}>{t.note}</div>
          </div>
        ))}
      </div>

      {last && (
        <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="card-title">Last service</div>
              <div className="sub">{last.name} · {last.date}</div>
            </div>
            <div onClick={() => set({ reportId: lastSvc.id })} className="pill-btn dark">Report</div>
          </div>
          <div onClick={() => go('mark', { svcId: lastSvc.id })} className="tap" style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontSize: 40, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.04em' }}>{last.count}</div>
            <div className="mono" style={{ fontSize: 12, fontWeight: 600, color: last.deltaFg }}>{last.delta}</div>
          </div>
          <div style={{ display: 'flex', gap: 3, height: 10 }}>
            {[[last.l, C.ink], [last.n, C.accent], [last.e, C.ella]].map(([n, bg], i) => (
              <div key={i} style={{ height: 10, borderRadius: 3, background: bg as string, width: ((n as number) / last.tot) * 100 + '%' }} />
            ))}
          </div>
          <div className="legend">
            <span><span className="sq" style={{ background: C.ink }} />Leaders {last.l}</span>
            <span><span className="sq" style={{ background: C.accent }} />Nelson's {last.n}</span>
            <span><span className="sq" style={{ background: C.ella }} />Ella's {last.e}</span>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '6px 16px 4px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0 2px' }}>
          <div className="card-title">New people</div>
          <div onClick={showNew} className="tap" style={{ fontSize: 13, fontWeight: 500, color: C.link }}>All {newP.length} →</div>
        </div>
        <div className="small" style={{ paddingBottom: 8 }}>Each dot is a service since they first came. Filled means they came.</div>
        {newP.slice(0, 5).map(p => {
          const o = ownerOf(p);
          return (
            <div key={p.id} onClick={() => set({ personId: p.id })} className="row tap" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0' }}>
              <Av name={p.name} o={o} size={32} radius={10} font={13} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{p.name}</div>
                <div className="small">Week {p.week} of 8 · came {p.attended} of {p.held}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {svcs.filter(s => s.date >= p.firstVisit!).map(s => {
                  const on = sets[s.id].has(p.id);
                  return <span key={s.id} style={{ width: 12, height: 12, boxSizing: 'border-box', borderRadius: 6, background: on ? o.solid : 'transparent', border: `1.5px solid ${on ? o.solid : C.dashed}` }} />;
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
        {(['Nelson', 'Ella'] as Owner[]).map(o => {
          const l = people.filter(p => p.owner === o);
          return (
            <div key={o} onClick={() => go('people', { pf: 'all', po: o, pq: '', pv: 'people' })} className="card tap" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}><span className="sq" style={{ background: OWN[o].solid }} />{OWN[o].label} people</div>
              <div className="big">{l.length}</div>
              <div className="mono" style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
                {l.filter(p => p.kind === 'first').length} new · {lastSvc ? l.filter(p => sets[lastSvc.id].has(p.id)).length : 0} at last
              </div>
            </div>
          );
        })}
      </div>
      <div onClick={reset} className="tap" style={{ fontSize: 12, textAlign: 'center', padding: 8, textDecoration: 'underline', color: sure ? C.down : C.muted }}>
        {sure ? 'Tap again to clear everything you added' : 'Start again from the 4 real services'}
      </div>
    </div>
  );
}
