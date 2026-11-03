import { tick } from '../core/actions';
import { doneSet, followUp } from '../core/rules';
import { useStore } from '../store';
import { C, ownerOf } from '../theme';
import { Av, Header, Progress, Seg, TickBox } from '../ui';
import { careWeek } from './Care';

/** Count of people to reach this week, and how many are ticked: used on Home too. */
export function useFollowCount() {
  const { data, c, today } = useStore();
  const all = followUp(c).flatMap(g => g.people);
  const done = doneSet(data, 'reach', today);
  return { total: all.length, done: all.filter(x => done.has(x.p.id)).length };
}

export default function FollowUp() {
  const { data, c, today, ui, set, go, commit } = useStore();
  const done = doneSet(data, 'reach', today);
  const groups = followUp(c).map(g => ({ ...g, people: g.people.filter(x => ui.co === 'all' || x.p.owner === ui.co) }));
  const all = groups.flatMap(g => g.people);
  const reached = all.filter(x => done.has(x.p.id)).length;
  const stopped = c.people.filter(p => p.left && p.kind !== 'leader').length;

  return (
    <div className="page">
      <Header eyebrow="FOLLOW UP" title="Reach out this week" sub={`${careWeek(today)} · tick when you've called or messaged`} />

      <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div className="big">{reached}</div>
          <div className="sub">of {all.length} reached this week</div>
        </div>
        <Progress pct={all.length ? (reached / all.length) * 100 : 0} />
        <Seg fill value={ui.co} onChange={co => set({ co })} options={[['all', 'Both'], ['Nelson', "Nelson's"], ['Ella', "Ella's"]]} />
      </div>

      {all.length === 0 && (
        <div className="card pad" style={{ fontSize: 14, color: '#3A3934', lineHeight: 1.5 }}>
          Nobody to reach out to right now. Everyone has been coming.
        </div>
      )}

      {groups.filter(g => g.people.length).map(g => (
        <div key={g.key} className="card list" style={{ padding: '0 14px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 0 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div className="card-title" style={{ flex: 1, color: g.key === 'gone' ? C.down : C.ink }}>{g.title}</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>{g.people.length}</div>
            </div>
            <div className="small">{g.rule}</div>
          </div>
          {g.people.map(({ p, reason }) => {
            const on = done.has(p.id);
            return (
              <div key={p.id} className="row" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56 }}>
                <div onClick={() => set({ personId: p.id })} className="tap" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Av name={p.name} o={ownerOf(p)} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: on ? C.muted : C.ink, textDecoration: on ? 'line-through' : 'none' }}>{p.name}</div>
                    <div className="small">{reason}</div>
                  </div>
                </div>
                <TickBox on={on} onTick={() => commit(tick(data, 'reach', p.id, today))} />
              </div>
            );
          })}
        </div>
      ))}

      {stopped > 0 && (
        <div onClick={() => go('people', { pf: 'left', po: 'all', pq: '', pv: 'people' })} className="tap" style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: 4 }}>
          {stopped} stopped coming · see who →
        </div>
      )}
    </div>
  );
}
