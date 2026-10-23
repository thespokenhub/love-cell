import { addDays, fmt, fmtShort, weekStart } from '../core/dates';
import { SVC_NAME } from '../core/rules';
import type { SvcType } from '../core/types';
import { cameBackOf, careSummary, firstTimers, pctOf } from '../derive';
import { useStore } from '../store';
import { BUCKET, C, OWN } from '../theme';
import { useState } from 'react';
import { Ask, ExplainSheet, Header, type Explain } from '../ui';

const mean = (l: number[]) => (l.length ? Math.round((l.reduce((a, b) => a + b, 0) / l.length) * 10) / 10 : 0);

export default function Stats() {
  const { data, c, go, set } = useStore();
  const [explain, setExplain] = useState<Explain | null>(null);
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

  const kpi = (label: string, v: string | number, note: string, e: Explain) => (
    <div onClick={() => setExplain(e)} className="card tap" style={{ borderRadius: 16, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
        <div className="small">{label}</div>
        <Ask label={label} onClick={() => setExplain(e)} />
      </div>
      <div className="big">{v}</div>
      <div className="mono" style={{ fontSize: 11, color: C.muted }}>{note}</div>
    </div>
  );
  const best = svcs.reduce<(typeof svcs)[number] | null>((b, s) => (!b || sets[s.id].size > sets[b.id].size ? s : b), null);
  const nOf = (t: SvcType) => svcs.filter(s => s.type === t).length;
  const plural = (n: number) => `${n} service${n === 1 ? '' : 's'}`;
  const byOwner = (['Nelson', 'Ella'] as const).map(o => {
    const l = firsts.filter(p => p.owner === o);
    return { o, back: cameBackOf(l), of: l.length };
  });
  const onceThisWeek = firsts.filter(p => p.visits.length === 1 && weekStart(p.firstVisit!) === weekStart(c.today)).length;
  const list = (l: typeof svcs) =>
    l.map(s => `${SVC_NAME[s.type]} ${fmtShort(s.date)}: ${sets[s.id].size}`).join(' · ');
  const worst = svcs.reduce<(typeof svcs)[number] | null>((b, s) => (!b || sets[s.id].size < sets[b.id].size ? s : b), null);
  const typeExplain = (t: SvcType, what: string): Explain => {
    const l = svcs.filter(s => s.type === t);
    return {
      title: `${SVC_NAME[t]} average`, value: String(typeAvg(t)),
      body: [
        `${SVC_NAME[t]} is ${what}. On average, ${typeAvg(t)} people came to each one.`,
        l.length ? `So far: ${list(l)}.` : `There hasn't been one yet.`,
        'Everyone marked here counts: Fred, you, Ella and all your people.',
      ],
    };
  };
  const E: Record<string, Explain> = {
    avg: {
      title: 'Average per service', value: String(mean(counts)),
      body: [
        `On average, ${mean(counts)} people came to each service.`,
        `It adds up everyone marked here at the ${plural(svcs.length)} (${counts.join(' + ')} = ${counts.reduce((a, b) => a + b, 0)}) and divides by ${svcs.length}.`,
        'Everyone marked here counts: Fred, you, Ella and all your people.',
      ],
    },
    best: {
      title: 'Biggest service', value: best ? String(sets[best.id].size) : '0',
      body: best ? [
        `The most people at one service was ${sets[best.id].size}, at ${SVC_NAME[best.type]} on ${fmt(best.date)}.`,
        worst && worst.id !== best.id ? `The smallest was ${sets[worst.id].size}, at ${SVC_NAME[worst.type]} on ${fmt(worst.date)}.` : '',
        `This is different from the ${firsts.length} first-timers on Home. That number counts everyone who has ever come for the first time. Not all of them come to every service.`,
      ].filter(Boolean) : ['No services yet.'],
      action: best ? { label: `Open ${SVC_NAME[best.type]} ${fmtShort(best.date)}`, onClick: () => go('mark', { svcId: best.id }) } : undefined,
    },
    mgs: typeExplain('MGS', 'the Sunday service'),
    lc: typeExplain('LC', 'the Wednesday cell meeting'),
    bars: {
      title: 'People at each service',
      body: [
        'Each bar is one service, with the number of people marked here on top.',
        'Black is the leaders (Fred, you and Ella), orange is your people and blue is Ella’s people.',
        `The last ${bars.length} services: ${list(bars.map(b => b.s))}.`,
        'Tap a bar to open that service’s attendance.',
      ],
    },
    back: {
      title: 'Did first-timers come back?', value: `${cameBack} of ${firsts.length}`,
      body: [
        `A first-timer "came back" once they've been to 2 or more services. ${cameBack} of your ${firsts.length} first-timers have.`,
        `Your people: ${byOwner[0].back} of ${byOwner[0].of}. Ella's people: ${byOwner[1].back} of ${byOwner[1].of}.`,
        onceThisWeek ? `${onceThisWeek} of the ${distRaw[0].count} who came once only came for the first time this week, so they haven't had a chance to come back yet.` : '',
        'Tap a row, or a name below, to see the people.',
      ].filter(Boolean),
      action: { label: 'See who came once', onClick: () => showList('once') },
    },
    after: {
      title: 'After their first 8 weeks',
      body: [
        'Each first-timer is followed for 8 weeks from their first visit. Then they get one of three labels:',
        'Coming regularly: came to 75% or more of the services held in their 8 weeks.',
        'On and off: 40% to 74%.',
        'Needs a follow-up: under 40%.',
        ended.length ? `${ended.length} have finished their 8 weeks so far.` : firstEnd ? `Nobody has finished yet. The first group finishes on ${fmt(firstEnd)}.` : '',
      ].filter(Boolean),
    },
    care: {
      title: 'Care this week',
      body: [
        'How many ticks you’ve made in Care this week (Sunday to Saturday). The ticks start again each Sunday.',
        'Pray with them only counts people who are ready: 1½ months after their first visit. Old members are ready straight away.',
        'Bible plan is not weekly. It counts who is reading a plan with you.',
        'Tap a row to open it in Care.',
      ],
    },
    missing: {
      title: 'Not seen for 3+ weeks', value: String(flagged.length),
      body: [
        'Anyone who hasn’t been marked here for 21 days or more. You’re never counted, and neither is anyone who stopped coming.',
        flagged.length ? `Right now: ${flagged.map(p => p.name).join(', ')}.` : 'Right now that’s nobody. Everyone has been seen in the last 3 weeks.',
      ],
    },
    stopped: {
      title: 'Stopped coming', value: String(stopped.length),
      body: [
        'People you’ve marked "They won’t be coming anymore" on their page.',
        'They’re hidden from attendance and care, and not counted as not seen. Open their page and tap "They’re back" if they return.',
      ],
    },
    helpers: {
      title: 'Helpers and meetings',
      body: [
        `Helpers are old members who help you look after new people. You have ${helpers}.`,
        `Shepherds' meetings counts the meetings you've added under People › Helpers: ${(data.meetings || []).length} so far.`,
      ],
      action: { label: 'Open Helpers', onClick: () => go('people', { pv: 'helpers' }) },
    },
  };
  const titleRow = (title: string, e: Explain, sub?: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="card-title">{title}</div>
        {sub}
      </div>
      <Ask label={title} onClick={() => setExplain(e)} />
    </div>
  );
  const showList = (pf: 'back' | 'once', po: 'all' | 'Nelson' | 'Ella' = 'all') => go('people', { pf, po, pq: '', pv: 'people' });
  const countCard = (title: string, n: number, names: string, e: Explain, onClick?: () => void) => (
    <div onClick={onClick} className={'card pad' + (onClick ? ' tap' : '')} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="card-title" style={{ flex: 1 }}>{title}</div>
        <div style={{ fontSize: 22, fontWeight: 600 }}>{n}</div>
        <Ask label={title} onClick={() => setExplain(e)} />
      </div>
      <div className="sub" style={{ lineHeight: 1.45 }}>{names}</div>
    </div>
  );

  return (
    <div className="page">
      <Header eyebrow="STATS" title="At a glance" sub={`Since ${svcs.length ? fmt(svcs[0].date) : ''} · ${svcs.length} services`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
        {kpi('Average per service', mean(counts), `people, over ${plural(svcs.length)}`, E.avg)}
        {kpi('Biggest service', best ? sets[best.id].size : 0, best ? `${SVC_NAME[best.type]} · ${fmt(best.date)}` : '—', E.best)}
        {kpi('MGS average', typeAvg('MGS'), plural(nOf('MGS')), E.mgs)}
        {kpi('LC Live average', typeAvg('LC'), plural(nOf('LC')), E.lc)}
      </div>

      <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {titleRow('People at each service', E.bars)}
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
        {titleRow('Did first-timers come back?', E.back, <div className="sub">{cameBack} of {firsts.length} came again ({pctOf(cameBack, firsts.length)}%)</div>)}
        {distRaw.map((d, i) => (
          <div key={d.label} onClick={() => showList(i === 0 ? 'once' : 'back')} className="tap" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 104, flex: 'none', fontSize: 13 }}>{d.label}</span>
            <div style={{ flex: 1, height: 14, borderRadius: 4, background: '#F0EFEA', overflow: 'hidden' }}>
              <div style={{ height: 14, borderRadius: 4, background: i === 0 ? C.dashed : C.accent, width: (d.count / dmx) * 100 + '%' }} />
            </div>
            <span className="mono" style={{ width: 24, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{d.count}</span>
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, borderTop: `1px solid ${C.divider}`, paddingTop: 12 }}>
          {byOwner.map(b => (
            <div key={b.o} onClick={() => showList('back', b.o)} className="tap">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}><span className="sq" style={{ background: OWN[b.o].solid }} />{OWN[b.o].label} people</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{b.back} <span style={{ fontSize: 13, fontWeight: 500, color: C.muted }}>of {b.of} came back</span></div>
            </div>
          ))}
        </div>
        {onceThisWeek > 0 && (
          <div className="small" style={{ lineHeight: 1.45 }}>
            {onceThisWeek} of the {distRaw[0].count} who came once first came this week, so they haven't had a chance to come back yet.
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <div onClick={() => showList('back')} className="pill-btn outline">See who came back →</div>
          <div onClick={() => showList('once')} className="pill-btn outline">See who came once →</div>
        </div>
      </div>

      <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {titleRow('After their first 8 weeks', E.after)}
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
        <div style={{ padding: '10px 0 4px' }}>{titleRow('Care this week', E.care)}</div>
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
        E.missing, () => go('people', { pf: 'missing', po: 'all', pq: '', pv: 'people' }))}
      {countCard('Stopped coming', stopped.length, stopped.length ? stopped.map(p => p.name).join(', ') : 'Nobody so far.', E.stopped,
        stopped.length ? () => go('people', { pf: 'left', po: 'all', pq: '', pv: 'people' }) : undefined)}
      <div className="card pad" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
        <div><div className="small">Helpers</div><div style={{ fontSize: 26, fontWeight: 600 }}>{helpers}</div></div>
        <div><div className="small">Shepherds' meetings</div><div style={{ fontSize: 26, fontWeight: 600 }}>{(data.meetings || []).length}</div></div>
        <Ask label="Helpers and meetings" onClick={() => setExplain(E.helpers)} />
      </div>
      <div onClick={() => set({ feedback: true })} className="dashed-btn"><span>✎</span>Something unclear? Send feedback</div>
      {explain && <ExplainSheet e={explain} onClose={() => setExplain(null)} />}
    </div>
  );
}
