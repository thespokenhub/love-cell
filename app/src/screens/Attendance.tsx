import { useState } from 'react';
import { fmt, fmtLong } from '../core/dates';
import { dispName, SVC_NAME } from '../core/rules';
import { toggleAttendance } from '../core/actions';
import type { PersonView } from '../core/types';
import { useCurrentSlot, useStore } from '../store';
import { C, ownerOf } from '../theme';
import { Header, Seg, Switch } from '../ui';

export default function Attendance() {
  const { data, c, slots, ui, set, commit } = useStore();
  const cur = useCurrentSlot();
  const curSet = new Set(data.att[cur.id] || []);
  const q = ui.q.trim().toLowerCase();
  const match = (p: PersonView) => !q || p.name.toLowerCase().includes(q) || (p.id === 'p3' && 'ella'.includes(q));

  const toggle = (pid: string) => {
    commit(toggleAttendance(data, cur, pid));
    // Marking at the next service records it; stay on it.
    if (ui.svcId !== cur.id) set({ svcId: cur.id });
  };

  // The list is sorted into Here / Not here when you open a service. People you tap stay where
  // they are until you open the list again (or tap "Sort again"), so rows don't jump while marking.
  const [order, setOrder] = useState(() => ({ id: cur.id, here: new Set(curSet) }));
  if (order.id !== cur.id) setOrder({ id: cur.id, here: new Set(curSet) });
  const moved = [...curSet].some(id => !order.here.has(id)) || [...order.here].some(id => !curSet.has(id));

  const groups = ([
    ['Leaders', c.people.filter(p => p.kind === 'leader'), 'all'],
    ["Nelson's people", c.people.filter(p => p.owner === 'Nelson' && !p.left), 'Nelson'],
    ["Ella's people", c.people.filter(p => p.owner === 'Ella' && !p.left), 'Ella'],
  ] as const)
    .filter(g => ui.mf === 'all' || ui.mf === g[2])
    .map(([title, l]) => ({ title, rows: l.filter(match) }));
  const shown = groups.flatMap(g => g.rows);
  const sections = [
    { key: 'here', title: 'Here', here: true },
    { key: 'away', title: 'Not here', here: false },
  ].map(sec => ({
    ...sec,
    groups: groups.map(g => ({ ...g, rows: g.rows.filter(p => order.here.has(p.id) === sec.here) })).filter(g => g.rows.length),
  }));
  const hereNow = shown.filter(p => curSet.has(p.id)).length;

  const row = (p: PersonView) => {
    const on = curSet.has(p.id);
    return (
      <div key={p.id} onClick={() => toggle(p.id)} className="row tap" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 52 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: on ? C.ink : '#3A3934' }}>{dispName(p)}</div>
          <div className="small">{p.label}</div>
        </div>
        <div className="mono" style={{ fontSize: 11, color: on ? C.ink : C.muted }}>{on ? 'Here' : 'Not here'}</div>
        <Switch on={on} color={ownerOf(p).solid} />
      </div>
    );
  };

  return (
    <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: '0 16px' }}>
        <Header eyebrow="ATTENDANCE" title={SVC_NAME[cur.type]} sub={fmtLong(cur.date) + (cur.isNew ? ' · not taken yet' : '')}
          right={<div className="mono" style={{ fontSize: 13, color: C.muted, paddingBottom: 4 }}>
            <b style={{ fontFamily: 'Geist, sans-serif', fontSize: 32, color: C.ink, letterSpacing: '-0.03em' }}>{curSet.size}</b>/{c.people.length}
          </div>} />
      </div>
      <div className="chips noscroll" style={{ padding: '0 16px' }}>
        {[...slots].reverse().map(s => (
          <div key={s.id} onClick={() => set({ svcId: s.id })} className={'chip' + (s.id === cur.id ? ' on' : '') + (s.isNew ? ' next' : '')}>
            <div className="top">{s.isNew ? 'Next · ' + SVC_NAME[s.type] : SVC_NAME[s.type]}</div>
            <div className="lbl">{fmt(s.date)}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '0 16px', display: 'flex', gap: 8 }}>
        <Seg style={{ flex: 'none' }} value={ui.mf} onChange={mf => set({ mf })} options={[['all', 'Everyone'], ['Nelson', "Nelson's"], ['Ella', "Ella's"]]} />
        <input className="find" value={ui.q} onChange={e => set({ q: e.target.value })} placeholder="Find" />
      </div>
      <div onClick={() => set({ add: { svcId: cur.id } })} className="dashed-btn" style={{ margin: '0 16px' }}>
        <span>+</span>Someone new? Add and mark them here
      </div>
      {moved && (
        <div onClick={() => setOrder({ id: cur.id, here: new Set(curSet) })} className="tap"
          style={{ margin: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', borderRadius: 12, background: C.track, fontSize: 13 }}>
          <span style={{ color: '#3A3934' }}>People you just marked stay in place.</span>
          <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Sort again ↑</span>
        </div>
      )}
      {sections.map(sec => {
        const n = sec.here ? hereNow : shown.length - hereNow;
        return (
          <div key={sec.key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ margin: '4px 18px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 5, flex: 'none', boxSizing: 'border-box', background: sec.here ? C.up : 'transparent', border: sec.here ? 'none' : `2px solid ${C.dashed}` }} />
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', flex: 1 }}>{sec.title}</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: sec.here ? C.up : C.muted }}>{n}</div>
            </div>
            {sec.groups.length === 0 ? (
              <div className="card list" style={{ margin: '0 16px', padding: '16px 14px', fontSize: 14, color: C.muted }}>
                {sec.here ? 'Nobody marked yet. Tap a name below when they come in.' : 'Everyone on this list is here.'}
              </div>
            ) : sec.groups.map(g => (
              <div key={g.title} className="card list" style={{ margin: '0 16px', padding: '0 14px', display: 'flex', flexDirection: 'column', background: sec.here ? '#FFFFFF' : '#FBFBF9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '12px 0 8px' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{g.title}</div>
                  <div className="mono" style={{ fontSize: 11, color: C.muted }}>{g.rows.length}</div>
                </div>
                {g.rows.map(row)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function MarkBar() {
  const { data, c, set } = useStore();
  const cur = useCurrentSlot();
  const curSet = new Set(data.att[cur.id] || []);
  const cnt = (f: (p: PersonView) => boolean) => c.people.filter(p => curSet.has(p.id) && f(p)).length;
  return (
    <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#FFF', borderTop: `1px solid ${C.line}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{curSet.size} here</div>
        <div className="mono" style={{ fontSize: 11, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {cnt(p => p.kind === 'leader')} leaders · {cnt(p => p.owner === 'Nelson')} Nelson's · {cnt(p => p.owner === 'Ella')} Ella's
        </div>
      </div>
      <button onClick={() => set({ reportId: cur.id })} style={{ height: 46, padding: '0 18px', borderRadius: 12, border: 'none', background: C.ink, color: '#FFF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Generate report</button>
    </div>
  );
}
