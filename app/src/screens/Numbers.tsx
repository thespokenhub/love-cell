// The cards that used to be on the Stats tab, now on Home. Each "?" explains its number with the real figures.
import { useState } from 'react';
import { addDays, fmt, fmtShort, weekStart } from '../core/dates';
import { SVC_NAME } from '../core/rules';
import type { Service, SvcType } from '../core/types';
import { cameBackOf, firstTimers, pctOf } from '../derive';
import { useStore } from '../store';
import { BUCKET, C, OWN } from '../theme';
import { Ask, ExplainSheet, type Explain } from '../ui';

const mean = (l: number[]) => (l.length ? Math.round((l.reduce((a, b) => a + b, 0) / l.length) * 10) / 10 : 0);
const plural = (n: number) => `${n} service${n === 1 ? '' : 's'}`;

function useExplain() {
  const [e, setE] = useState<Explain | null>(null);
  return { show: setE, sheet: e && <ExplainSheet e={e} onClose={() => setE(null)} /> };
}

const TitleRow = ({ title, sub, onAsk }: { title: string; sub?: React.ReactNode; onAsk: () => void }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="card-title">{title}</div>
      {sub}
    </div>
    <Ask label={title} onClick={onAsk} />
  </div>
);

/** Average per service, biggest service, and the MGS / LC Live averages. */
export function NumberTiles() {
  const { c, go } = useStore();
  const { svcs, sets } = c;
  const x = useExplain();
  const size = (s: Service) => sets[s.id].size;
  const counts = svcs.map(size);
  const typeAvg = (t: SvcType) => mean(svcs.filter(s => s.type === t).map(size));
  const nOf = (t: SvcType) => svcs.filter(s => s.type === t).length;
  const best = svcs.reduce<Service | null>((b, s) => (!b || size(s) > size(b) ? s : b), null);
  const worst = svcs.reduce<Service | null>((b, s) => (!b || size(s) < size(b) ? s : b), null);
  const list = (l: Service[]) => l.map(s => `${SVC_NAME[s.type]} ${fmtShort(s.date)}: ${size(s)}`).join(' · ');
  const firsts = firstTimers(c).length;
  const everyone = 'Everyone marked here counts: Fred, you, Ella and all your people.';
  const typeExplain = (t: SvcType, what: string): Explain => {
    const l = svcs.filter(s => s.type === t);
    return {
      title: `${SVC_NAME[t]} average`, value: String(typeAvg(t)),
      body: [`${SVC_NAME[t]} is ${what}. On average, ${typeAvg(t)} people came to each one.`, l.length ? `So far: ${list(l)}.` : `There hasn't been one yet.`, everyone],
    };
  };
  const tiles: [string, string | number, string, Explain][] = [
    ['Average per service', mean(counts), `people, over ${plural(svcs.length)}`, {
      title: 'Average per service', value: String(mean(counts)),
      body: [
        `On average, ${mean(counts)} people came to each service.`,
        `It adds up everyone at the ${plural(svcs.length)} (${counts.join(' + ')} = ${counts.reduce((a, b) => a + b, 0)}) and divides by ${svcs.length}.`,
        everyone,
      ],
    }],
    ['Biggest service', best ? size(best) : 0, best ? `${SVC_NAME[best.type]} · ${fmt(best.date)}` : '—', {
      title: 'Biggest service', value: best ? String(size(best)) : '0',
      body: best ? [
        `The most people at one service was ${size(best)}, at ${SVC_NAME[best.type]} on ${fmt(best.date)}.`,
        worst && worst.id !== best.id ? `The smallest was ${size(worst)}, at ${SVC_NAME[worst.type]} on ${fmt(worst.date)}.` : '',
        `This is different from the ${firsts} first-timers. That number counts everyone who has ever come for the first time. Not all of them come to every service.`,
      ].filter(Boolean) : ['No services yet.'],
      action: best ? { label: `Open ${SVC_NAME[best.type]} ${fmtShort(best.date)}`, onClick: () => go('mark', { svcId: best.id }) } : undefined,
    }],
    ['MGS average', typeAvg('MGS'), plural(nOf('MGS')), typeExplain('MGS', 'the Sunday service')],
    ['LC Live average', typeAvg('LC'), plural(nOf('LC')), typeExplain('LC', 'the Wednesday cell meeting')],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
      {tiles.map(([label, v, note, e]) => (
        <div key={label} onClick={() => x.show(e)} className="card tap" style={{ borderRadius: 16, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
            <div className="small">{label}</div>
            <Ask label={label} onClick={() => x.show(e)} />
          </div>
          <div className="big">{v}</div>
          <div className="mono" style={{ fontSize: 11, color: C.muted }}>{note}</div>
        </div>
      ))}
      {x.sheet}
    </div>
  );
}

/** How many times first-timers came, and whose came back. */
export function CameBackCard() {
  const { c, go } = useStore();
  const x = useExplain();
  const firsts = firstTimers(c);
  const cameBack = cameBackOf(firsts);
  const dist = [1, 2, 3, 4].map(n => ({
    label: n === 1 ? 'Came once' : n < 4 ? `Came ${n} times` : 'Came 4+ times',
    count: firsts.filter(p => (n < 4 ? p.visits.length === n : p.visits.length >= 4)).length,
  }));
  const dmx = Math.max(1, ...dist.map(d => d.count));
  const byOwner = (['Nelson', 'Ella'] as const).map(o => {
    const l = firsts.filter(p => p.owner === o);
    return { o, back: cameBackOf(l), of: l.length };
  });
  const onceThisWeek = firsts.filter(p => p.visits.length === 1 && weekStart(p.firstVisit!) === weekStart(c.today)).length;
  const showList = (pf: 'back' | 'once', po: 'all' | 'Nelson' | 'Ella' = 'all') => go('people', { pf, po, pq: '', pv: 'people' });
  const e: Explain = {
    title: 'Did first-timers come back?', value: `${cameBack} of ${firsts.length}`,
    body: [
      `A first-timer "came back" once they've been to 2 or more services. ${cameBack} of your ${firsts.length} first-timers have.`,
      `Your people: ${byOwner[0].back} of ${byOwner[0].of}. Ella's people: ${byOwner[1].back} of ${byOwner[1].of}.`,
      onceThisWeek ? `${onceThisWeek} of the ${dist[0].count} who came once only came for the first time this week, so they haven't had a chance to come back yet.` : '',
      'Tap a row to see the people.',
    ].filter(Boolean),
    action: { label: 'See who came once', onClick: () => showList('once') },
  };

  return (
    <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <TitleRow title="Did first-timers come back?" onAsk={() => x.show(e)}
        sub={<div className="sub">{cameBack} of {firsts.length} came again ({pctOf(cameBack, firsts.length)}%)</div>} />
      {dist.map((d, i) => (
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
          {onceThisWeek} of the {dist[0].count} who came once first came this week, so they haven't had a chance to come back yet.
        </div>
      )}
      {x.sheet}
    </div>
  );
}

/** Where first-timers ended up after their 8 weeks. */
export function AfterEightCard() {
  const { c, go } = useStore();
  const x = useExplain();
  const firsts = firstTimers(c);
  const ended = firsts.filter(p => p.key !== 'new');
  const firstEnd = firsts.length ? addDays(firsts.map(p => p.firstVisit!).sort()[0], 56) : null;
  const buckets = ([['new', 'New (first 8 weeks)'], ['regular', 'Coming regularly'], ['onoff', 'On and off'], ['followup', 'Needs a follow-up']] as const)
    .map(([key, label]) => ({ key, label, count: firsts.filter(p => p.key === key).length }));
  const e: Explain = {
    title: 'After their first 8 weeks',
    body: [
      'Each first-timer is followed for 8 weeks from their first visit. Then they get one of three labels:',
      'Coming regularly: came to 75% or more of the services held in their 8 weeks.',
      'On and off: 40% to 74%.',
      'Needs a follow-up: under 40%.',
      ended.length ? `${ended.length} have finished their 8 weeks so far.` : firstEnd ? `Nobody has finished yet. The first group finishes on ${fmt(firstEnd)}.` : '',
    ].filter(Boolean),
  };
  return (
    <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <TitleRow title="After their first 8 weeks" onAsk={() => x.show(e)} />
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
      {x.sheet}
    </div>
  );
}
