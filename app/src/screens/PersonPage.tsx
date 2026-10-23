import { addDays, fmt } from '../core/dates';
import { patchPerson, tick } from '../core/actions';
import { dispName, doneSet, prayWithReady, readyOn, SVC_NAME, TASKS } from '../core/rules';
import type { Kind, Owner, Person, PersonView } from '../core/types';
import { attShort, helperStats } from '../derive';
import { useStore } from '../store';
import { C, OWN, ownerOf, statusOf } from '../theme';
import { Av, Pill, Seg, TickBox } from '../ui';

export default function PersonPage({ p }: { p: PersonView }) {
  const { data, c, today, set, commit, flash } = useStore();
  const { svcs, sets } = c;
  const o = ownerOf(p);
  const s = statusOf(p);
  const isF = p.kind === 'first' && p.held != null;
  const isLeader = p.kind === 'leader';
  const patch = (x: Partial<Person>) => commit(patchPerson(data, p.id, x));
  const helpers = c.people.filter(h => h.helper);
  const curHelper = p.helperId && c.byId[p.helperId]?.helper ? p.helperId : null;
  const name = dispName(p);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 30, background: C.canvas, display: 'flex', flexDirection: 'column' }}>
      <div className="top-space" />
      <div style={{ flex: 'none', padding: '4px 16px' }}>
        <div onClick={() => set({ personId: null })} className="tap"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', borderRadius: 10, background: '#FFF', border: `1px solid ${C.line}`, fontSize: 14, fontWeight: 500 }}>← Back</div>
      </div>
      <div className="noscroll" style={{ flex: 1, overflowY: 'auto', padding: '10px 16px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 2px' }}>
          <div className="title" style={{ lineHeight: 1.1 }}>{name}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Pill bg={o.bg} fg={o.fg}>{p.owner ? OWN[p.owner].label + ' people' : p.role}</Pill>
            <Pill bg={s.bg} fg={s.fg}>{isLeader ? 'Not a member' : p.label}</Pill>
          </div>
        </div>

        <div className="card list pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {isF ? `${p.attended} of ${p.held}` : `${p.visits.length} of ${svcs.length}`}
            </div>
            <div className="sub">{isF ? 'services since first visit' : 'services so far'}</div>
          </div>
          {p.key === 'new' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,minmax(0,1fr))', gap: 3 }}>
                {Array.from({ length: 8 }, (_, i) => {
                  const on = i < (p.week || 0);
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                      <div style={{ width: '100%', height: 6, borderRadius: 3, background: on ? C.accent : C.track }} />
                      <div className="mono" style={{ fontSize: 10, color: on ? C.ink : C.muted }}>W{i + 1}</div>
                    </div>
                  );
                })}
              </div>
              <div className="small">Week {p.week} of 8 · ends {fmt(addDays(p.firstVisit!, 55))}</div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: `1px solid ${C.divider}`, paddingTop: 12 }}>
            <div><div className="label">FIRST VISIT</div><div style={{ fontSize: 13, fontWeight: 500, marginTop: 3 }}>{p.firstSvc ? `${SVC_NAME[p.firstSvc.type]} · ${fmt(p.firstSvc.date)}` : 'Not yet'}</div></div>
            <div><div className="label">LAST SEEN</div><div style={{ fontSize: 13, fontWeight: 500, marginTop: 3 }}>
              {p.lastSeen ? fmt(p.lastSeen) + (p.since === 0 ? ' · today' : ` · ${p.since} ${p.since === 1 ? 'day' : 'days'} ago`) : 'Not yet'}
            </div></div>
          </div>
        </div>

        {!isLeader && p.left && (
          <div style={{ background: C.track, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Stopped coming with us</div>
              <div className="small">Marked on {fmt(p.left)}. They no longer show in attendance or care.</div>
            </div>
            <div onClick={() => { patch({ left: null }); flash(p.name + ' is back on the list'); }} className="pill-btn" style={{ background: '#FFF', border: '1px solid #D8D5CD' }}>They're back</div>
          </div>
        )}

        {!isLeader && p.helper && <HelperCard p={p} />}

        {!isLeader && !p.helper && !p.left && (
          <div className="card list" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Looked after by</div>
            {helpers.length > 0 ? (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[{ id: null as string | null, label: 'Nobody' }, ...helpers.filter(h => h.id !== p.id).map(h => ({ id: h.id as string | null, label: h.name }))].map(ch => {
                  const sel = curHelper === ch.id;
                  return (
                    <div key={ch.id ?? 'none'} onClick={() => patch({ helperId: ch.id })} className="tap"
                      style={{ height: 34, padding: '0 12px', borderRadius: 9, background: sel ? C.ink : '#FFF', color: sel ? '#FFF' : C.ink, border: `1px solid ${sel ? C.ink : C.line}`, display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 500, boxSizing: 'border-box' }}>{ch.label}</div>
                  );
                })}
              </div>
            ) : (
              <div className="sub" style={{ lineHeight: 1.45 }}>No helpers yet. You can make an old member a helper from their page, or from People › Helpers.</div>
            )}
          </div>
        )}

        {p.kind === 'old' && !p.helper && !p.left && (
          <div onClick={() => { patch({ helper: true }); flash(p.name + ' is now a helper'); }} className="tap"
            style={{ height: 48, borderRadius: 14, background: C.ink, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>Make {name} a helper</div>
        )}

        {!isLeader && (
          <div className="card list" style={{ padding: '4px 16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 15, fontWeight: 600, padding: '12px 0 6px' }}>Care this week</div>
            {TASKS.map(t => {
              const locked = t.k === 'prayWith' && !prayWithReady(p, today);
              const on = doneSet(data, t.k, today).has(p.id);
              const weeks = t.k === 'plan' ? 0 : Object.values(data.care?.[t.k] || {}).filter(l => l.includes(p.id)).length;
              const sub = locked ? 'Ready from ' + fmt(readyOn(p)!)
                : t.k === 'plan' ? (on ? 'Reading together' : 'Not started')
                : `${on ? 'Done this week' : 'Not yet this week'} · ${weeks} ${weeks === 1 ? 'week' : 'weeks'} so far`;
              return (
                <div key={t.k} className="row" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 54 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: locked ? C.muted : C.ink }}>{t.label}</div>
                    <div className="small">{sub}</div>
                  </div>
                  <TickBox on={on} locked={locked} onTick={() => commit(tick(data, t.k, p.id, today))} />
                </div>
              );
            })}
          </div>
        )}

        <div className="card list pad" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 15, fontWeight: 600, paddingBottom: 12 }}>Attendance history</div>
          {[...svcs].reverse().map((sv, i, arr) => {
            const on = sets[sv.id].has(p.id);
            return (
              <div key={sv.id} style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 12, flex: 'none' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 6, background: on ? o.solid : C.track, flex: 'none' }} />
                  <span style={{ width: 2, flex: 1, minHeight: 26, background: i === arr.length - 1 ? 'transparent' : C.line }} />
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', paddingBottom: 14, marginTop: -3 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{SVC_NAME[sv.type]}</div>
                    <div className="mono" style={{ fontSize: 11, color: C.muted }}>{fmt(sv.date)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: on ? C.up : C.faintText }}>{on ? 'Here' : 'Not here'}</div>
                    <div className="mono" style={{ fontSize: 10, color: C.link }}>{p.firstSvc?.id === sv.id ? 'First visit' : ''}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!isLeader && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
            <div className="label">FIX A MISTAKE</div>
            <Seg<Owner> fill value={p.owner!} onChange={owner => patch({ owner })} options={[['Nelson', "Nelson's people"], ['Ella', "Ella's people"]]} />
            <Seg<Kind> fill value={p.kind} onChange={kind => patch({ kind })} options={[['first', 'First-timer'], ['old', 'Old member']]} />
          </div>
        )}
        {!isLeader && !p.left && (
          <div onClick={() => { patch({ left: today, helper: false }); flash(p.name + ' marked as stopped coming'); }} className="tap"
            style={{ height: 46, borderRadius: 12, border: `1px solid ${C.line}`, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: C.down }}>They won't be coming anymore</div>
        )}
      </div>
    </div>
  );
}

function HelperCard({ p }: { p: PersonView }) {
  const { data, c, set, commit } = useStore();
  const hs = helperStats(data, c, p);
  return (
    <div style={{ background: C.ink, color: '#FFF', borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '.08em', color: '#B8B6AE' }}>HELPER</div>
          <div className="card-title">{hs.looking}</div>
        </div>
        <div onClick={() => set({ sheet: 'assign', assignFor: p.id })} className="pill-btn" style={{ background: C.accent, color: C.ink, fontWeight: 600 }}>Assign people</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
        {[['Services', hs.svc], ['Meetings', hs.meet], ['Their people last time', hs.atLast]].map(([l, v]) => (
          <div key={l} style={{ background: '#1E1E1C', borderRadius: 12, padding: 10 }}>
            <div style={{ fontSize: 11, color: '#B8B6AE' }}>{l}</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{v}</div>
          </div>
        ))}
      </div>
      {hs.mine.length === 0 && <div style={{ fontSize: 13, color: '#B8B6AE' }}>Nobody assigned yet.</div>}
      {hs.mine.map(q => (
        <div key={q.id} onClick={() => set({ personId: q.id })} className="tap" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid #2A2A27' }}>
          <Av name={q.name} o={ownerOf(q)} size={28} radius={8} />
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 500 }}>{q.name}</div><div style={{ fontSize: 11, color: '#B8B6AE' }}>{q.label}</div></div>
          <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{attShort(q, c)}</div>
        </div>
      ))}
      <div onClick={() => commit(patchPerson(data, p.id, { helper: false }))} className="tap" style={{ fontSize: 12, color: '#B8B6AE', textDecoration: 'underline', alignSelf: 'flex-start' }}>No longer a helper</div>
    </div>
  );
}
