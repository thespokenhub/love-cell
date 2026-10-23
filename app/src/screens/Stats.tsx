import { addDays, fmt, fmtShort } from '../core/dates';
import { SVC_NAME } from '../core/rules';
import type { SvcType } from '../core/types';
import { cameBackOf, careSummary, firstTimers, pctOf } from '../derive';
import { useStore } from '../store';
import { BUCKET, C } from '../theme';
import { Header } from '../ui';

const mean = (l: number[]) => (l.length ? Math.round((l.reduce((a, b) => a + b, 0) / l.length) * 10) / 10 : 0);

export default function Stats() {
  const { data, c, go } = useStore();
  const { svcs, sets, people } = c;
  const counts = svcs.map(s => sets[s.id].size);
  const typeAvg = (t: SvcType) => mean(svcs.filter(s => s.type === t).map(s => sets[s.id].size));
  const firsts = firstTimers(c);
  const cameBack = cameBackOf(firsts);
  const tasks = careSummary(data, c);

  const maxC = Math.max(1, ...counts);
  const k = 100 / maxC;
  const bars = svcs.slice(-5).map(s => {
    const set = sets[s.id];
    const cnt = (f: (p: (typeof people)[number]) => boolean) => people.filter(p => set.has(p.id) && f(p)).length;
    return { s, count: set.size, l: cnt(p => p.kind === 'leader') * k, n: cnt(p => p.owner === 'Nelson') * k, e: cnt(p => p.owner === 'Ella') * k };
  });

  const distRaw = [1, 2, 3, 4].map(n => ({
    label: n === 1 ? 'Came once' : n < 4 ? `Came ${n} times` : 'Came 4+ times',
    count: firsts.filter(p => (n < 4 ? p.visits.length === n : p.visits.length >= 4)).length,
  }));
  const dmx = Math.max(1, ...distRaw.map(d => d.count));

  const ended = firsts.filter(p => p.key !== 'new');
  const firstEnd = firsts.length ? addDays(firsts.map(p => p.firstVisit!).sort()[0], 56) : null;
  const buckets = ([['new', 'New (first 8 weeks)'], ['regular', 'Coming regularly'], ['onoff', 'On and off'], ['followup', 'Needs a follow-up']] as const)
    .map(([key, label]) => ({ key, label, count: firsts.filter(p => p.key === key).length }));
  const flagged = people.filter(p => p.flagged);
  const stopped = people.filter(p => p.left && p.kind !== 'leader');
  const helpers = people.filter(p => p.helper).length;

  const kpi = (label: string, v: string | number) => (
    <div className="card" style={{ borderRadius: 16, padding: 14 }}><div className="small">{label}</div><div className="big">{v}</div></div>
  );
  const countCard = (title: string, n: number, names: string, onClick?: () => void) => (
    <div onClick={onClick} className={'card pad' + (onClick ? ' tap' : '')} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="card-title">{title}</div>
        <div style={{ fontSize: 22, fontWeight: 600 }}>{n}</div>
      </div>
      <div className="sub" style={{ lineHeight: 1.45 }}>{names}</div>
    </div>
  );

  return (
    <div className="page">
      <Header eyebrow="STATS" title="At a glance" sub={`Since ${svcs.length ? fmt(svcs[0].date) : ''} · ${svcs.length} services`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
        {kpi('Average per service', mean(counts))}
        {kpi('Biggest service', counts.length ? Math.max(...counts) : 0)}
        {kpi('MGS average', typeAvg('MGS'))}
        {kpi('LC Live average', typeAvg('LC'))}
      </div>

      <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card-title">People at each service</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, height: 150, borderBottom: `1px solid ${C.divider}` }}>
          {bars.map(b => (
            <div key={b.s.id} onClick={() => go('mark', { svcId: b.s.id })} className="tap" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{b.count}</div>
              <div style={{ width: '100%', maxWidth: 48, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ height: b.e, borderRadius: 6, background: C.ella }} />
                <div style={{ height: b.n, borderRadius: 6, background: C.accent }} />
                <div style={{ height: b.l, borderRadius: 6, background: C.ink }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: -6 }}>
          {bars.map(b => (
            <div key={b.s.id} style={{ flex: 1, textAlign: 'center', lineHeight: 1.3 }}>
              <div style={{ fontSize: 11, color: C.muted }}>{SVC_NAME[b.s.type]}</div>
              <div className="mono" style={{ fontSize: 11, fontWeight: 600 }}>{fmtShort(b.s.date)}</div>
            </div>
          ))}
        </div>
        <div className="legend">
          <span><span className="sq" style={{ background: C.ink }} />Leaders</span>
          <span><span className="sq" style={{ background: C.accent }} />Nelson's</span>
          <span><span className="sq" style={{ background: C.ella }} />Ella's</span>
        </div>
      </div>

      <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div className="card-title">Did first-timers come back?</div>
          <div className="sub">{cameBack} of {firsts.length} came again ({pctOf(cameBack, firsts.length)}%)</div>
        </div>
        {distRaw.map((d, i) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 104, flex: 'none', fontSize: 13 }}>{d.label}</span>
            <div style={{ flex: 1, height: 14, borderRadius: 4, background: '#F0EFEA', overflow: 'hidden' }}>
              <div style={{ height: 14, borderRadius: 4, background: i === 0 ? C.dashed : C.accent, width: (d.count / dmx) * 100 + '%' }} />
            </div>
            <span className="mono" style={{ width: 24, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{d.count}</span>
          </div>
        ))}
      </div>

      <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="card-title">After their first 8 weeks</div>
        {ended.length === 0 ? (
          <div className="sub" style={{ lineHeight: 1.45 }}>
            {firstEnd ? `Nobody has finished their 8 weeks yet. The first group finishes on ${fmt(firstEnd)}.` : ''}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {buckets.map(b => {
              const fg = b.count ? C.ink : C.muted;
              return (
                <div key={b.key} onClick={() => go('people', { pf: b.key, po: 'all', pq: '', pv: 'people' })} className="tap" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: BUCKET[b.key], flex: 'none' }} />
                  <span style={{ flex: 1, color: fg }}>{b.label}</span>
                  <span className="mono" style={{ fontWeight: 600, color: fg }}>{b.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '6px 16px', display: 'flex', flexDirection: 'column' }}>
        <div className="card-title" style={{ padding: '10px 0 4px' }}>Care this week</div>
        {tasks.map(t => (
          <div key={t.k} onClick={() => go('care', { careTask: t.k })} className="row tap" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
            <span style={{ width: 86, flex: 'none', fontSize: 13 }}>{t.short}</span>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#F0EFEA', overflow: 'hidden' }}>
              <div style={{ height: 8, borderRadius: 4, background: C.accent, width: t.w + '%' }} />
            </div>
            <span className="mono" style={{ width: 52, textAlign: 'right', fontSize: 12, fontWeight: 600 }}>{t.frac}</span>
          </div>
        ))}
      </div>

      {countCard('Not seen for 3+ weeks', flagged.length,
        flagged.length ? flagged.map(p => p.name).join(', ') : 'Nobody. Everyone has been seen in the last 3 weeks.',
        () => go('people', { pf: 'missing', po: 'all', pq: '', pv: 'people' }))}
      {countCard('Stopped coming', stopped.length, stopped.length ? stopped.map(p => p.name).join(', ') : 'Nobody so far.')}
      <div className="card pad" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><div className="small">Helpers</div><div style={{ fontSize: 26, fontWeight: 600 }}>{helpers}</div></div>
        <div><div className="small">Shepherds' meetings</div><div style={{ fontSize: 26, fontWeight: 600 }}>{(data.meetings || []).length}</div></div>
      </div>
    </div>
  );
}
