import { addDays, fmt, fmtShort, weekStart } from '../core/dates';
import { tick } from '../core/actions';
import { doneSet, prayWithReady, readyOn } from '../core/rules';
import { careSummary, members } from '../derive';
import { useStore } from '../store';
import { C, ownerOf } from '../theme';
import { Av, Header, Progress, Seg, TickBox } from '../ui';

export const careWeek = (today: string) => {
  const w = weekStart(today);
  return `This week · ${fmtShort(w)} – ${fmtShort(addDays(w, 6))}`;
};

export default function Care() {
  const { data, c, today, ui, set, commit } = useStore();
  const tasks = careSummary(data, c);
  const tk = ui.careTask;
  const cur = tasks.find(t => t.k === tk)!;
  const done = doneSet(data, tk, today);
  const rows = members(c)
    .filter(p => ui.co === 'all' || p.owner === ui.co)
    .map(p => ({ p, locked: tk === 'prayWith' && !prayWithReady(p, today) }))
    .sort((a, b) => (a.locked ? 1 : 0) - (b.locked ? 1 : 0));

  return (
    <div className="page">
      <Header eyebrow="CARE" title="Helping them grow" sub={`${careWeek(today)} · tick what you've done`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
        {tasks.map(t => {
          const sel = t.k === tk;
          return (
            <div key={t.k} onClick={() => set({ careTask: t.k })} className="tap"
              style={{ background: sel ? C.ink : '#FFF', color: sel ? '#FFF' : C.ink, border: `1px solid ${C.line}`, borderRadius: 16, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{t.short}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.03em' }}>{t.frac}</span>
                <span className="mono" style={{ fontSize: 11, color: sel ? '#B8B6AE' : C.muted }}>{t.unit}</span>
              </div>
              <Progress pct={t.w} h={5} track={sel ? '#3A3936' : C.track} />
            </div>
          );
        })}
      </div>
      <div className="card list" style={{ padding: '0 14px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '14px 0 10px' }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{cur.label}</div>
          <div className="small">{cur.hint} · {cur.note}</div>
        </div>
        <Seg fill style={{ marginBottom: 8 }} value={ui.co} onChange={co => set({ co })} options={[['all', 'Both'], ['Nelson', "Nelson's"], ['Ella', "Ella's"]]} />
        {rows.map(({ p, locked }) => (
          <div key={p.id} className="row" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 54 }}>
            <div onClick={() => set({ personId: p.id })} className="tap" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Av name={p.name} o={ownerOf(p)} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: locked ? C.muted : C.ink }}>{p.name}</div>
                <div className="small">{locked ? 'Ready from ' + fmt(readyOn(p)!) : p.label}</div>
              </div>
            </div>
            <TickBox on={done.has(p.id)} locked={locked} onTick={() => commit(tick(data, tk, p.id, today))} />
          </div>
        ))}
      </div>
    </div>
  );
}
