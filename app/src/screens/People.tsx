import { fmt, fmtShort } from '../core/dates';
import { newMeeting } from '../core/actions';
import { dispName, meetingPeople } from '../core/rules';
import type { PersonView } from '../core/types';
import { attShort, firstTimers, helperStats, members } from '../derive';
import { useStore, type PeopleFilter } from '../store';
import { C, ownerOf, statusOf } from '../theme';
import { Av, Header, Seg } from '../ui';

export default function People() {
  const { c, ui, set } = useStore();
  const m = members(c);
  const firsts = firstTimers(c);
  const olds = c.people.filter(p => p.kind === 'old' && !p.left);
  const helpers = c.people.filter(p => p.helper);
  return (
    <div className="page" style={{ gap: 10 }}>
      <Header eyebrow="LOVE CELL" title="People" sub={`${m.length} people · ${firsts.length} first-timers · ${olds.length} old members`} />
      <Seg fill value={ui.pv} onChange={pv => set({ pv })} options={[['people', 'Everyone'], ['helpers', `Helpers · ${helpers.length}`]]} />
      {ui.pv === 'helpers' ? <Helpers helpers={helpers} /> : <Everyone />}
    </div>
  );
}

function Everyone() {
  const { c, ui, set } = useStore();
  const firsts = firstTimers(c);
  const by = (k: string) => firsts.filter(p => p.key === k);
  const FD: [PeopleFilter, string, PersonView[]][] = [
    ['all', 'Everyone', members(c)],
    ['missing', 'Not seen 3+ weeks', c.people.filter(p => p.flagged)],
    ['back', 'Came back', firsts.filter(p => p.visits.length > 1)],
    ['once', 'Came once', firsts.filter(p => p.visits.length === 1)],
    ['new', 'New', by('new')],
    ['regular', 'Coming regularly', by('regular')],
    ['onoff', 'On and off', by('onoff')],
    ['followup', 'Needs a follow-up', by('followup')],
    ['none', 'Not seen yet', c.people.filter(p => p.key === 'none')],
    ['old', 'Old members', c.people.filter(p => p.kind === 'old' && !p.left)],
    ['leaders', 'Leaders', c.people.filter(p => p.kind === 'leader')],
    ['left', 'Stopped coming', c.people.filter(p => p.left && p.kind !== 'leader')],
  ];
  const active = FD.find(f => f[0] === ui.pf) || FD[0];
  const pq = ui.pq.trim().toLowerCase();
  const list = active[2].filter(p => (ui.po === 'all' || p.owner === ui.po) && (!pq || p.name.toLowerCase().includes(pq)));
  const cols = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 54px 56px', gap: 8 } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Seg style={{ flex: 'none' }} value={ui.po} onChange={po => set({ po })} options={[['all', 'Both'], ['Nelson', "Nelson's"], ['Ella', "Ella's"]]} />
        <input className="find" value={ui.pq} onChange={e => set({ pq: e.target.value })} placeholder="Find" />
      </div>
      <div className="chips noscroll" style={{ margin: '0 -16px', padding: '0 16px' }}>
        {/* A filter with nobody in it is hidden, unless it's the one picked. */}
        {FD.filter(f => f[0] === 'all' || f[0] === ui.pf || f[2].length).map(([k, l, arr]) => {
          const on = ui.pf === k;
          const red = k === 'missing';
          const bg = on ? (red ? C.down : C.ink) : '#FFF';
          return (
            <div key={k} onClick={() => set({ pf: k })} className="tap"
              style={{ flex: 'none', height: 32, padding: '0 10px', borderRadius: 8, background: bg, color: on ? '#FFF' : red ? C.down : C.ink, border: `1px solid ${on ? bg : C.line}`, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', boxSizing: 'border-box' }}>
              {l}<span className="mono" style={{ fontSize: 11 }}>{arr.length}</span>
            </div>
          );
        })}
      </div>
      <div className="card list" style={{ padding: '0 14px', display: 'flex', flexDirection: 'column' }}>
        <div className="label" style={{ ...cols, padding: '10px 0 8px' }}>
          <div>NAME · STATUS</div><div style={{ textAlign: 'right' }}>CAME</div><div style={{ textAlign: 'right' }}>SEEN</div>
        </div>
        {list.map(p => {
          const s = statusOf(p);
          return (
            <div key={p.id} onClick={() => set({ personId: p.id })} className="row tap" style={{ ...cols, alignItems: 'center', padding: '10px 0' }}>
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span className="sq" style={{ background: ownerOf(p).solid }} />
                  <span style={{ fontSize: 15, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dispName(p)}</span>
                  {p.flagged && <span className="mono" style={{ fontSize: 10, color: C.down, background: '#FFE0D9', borderRadius: 4, padding: '1px 5px', whiteSpace: 'nowrap' }}>3+ weeks</span>}
                  {p.helper && <span className="mono" style={{ fontSize: 10, color: '#FFF', background: C.ink, borderRadius: 4, padding: '1px 5px', whiteSpace: 'nowrap' }}>Helper</span>}
                </div>
                <div><span style={{ fontSize: 11, fontWeight: 500, padding: '2px 7px', borderRadius: 5, background: s.bg, color: s.fg }}>{p.label}</span></div>
              </div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{attShort(p, c)}</div>
              <div className="mono" style={{ fontSize: 11, color: C.muted, textAlign: 'right' }}>{p.lastSeen ? fmtShort(p.lastSeen) : '—'}</div>
            </div>
          );
        })}
        {list.length === 0 && <div className="row" style={{ padding: '30px 10px', textAlign: 'center', color: C.muted, fontSize: 14 }}>Nobody here.</div>}
      </div>
    </div>
  );
}

function Helpers({ helpers }: { helpers: PersonView[] }) {
  const { data, c, today, set, commit } = useStore();
  const meetings = [...(data.meetings || [])].sort((a, b) => (a.date < b.date ? 1 : -1));
  const mp = meetingPeople(c.people);
  const add = () => {
    const { data: d, id } = newMeeting(data, today);
    commit(d);
    set({ sheet: 'meeting', meetingId: id });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45, padding: '0 2px' }}>
        Old members who help you look after new people. See who they look after, how they are doing themselves, and who comes to shepherds' meetings.
      </div>
      <div className="card list" style={{ padding: '4px 14px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
          <div className="card-title">Shepherds' meetings</div>
          <div onClick={add} className="pill-btn dark"><span style={{ fontSize: 17, lineHeight: 1 }}>+</span>New</div>
        </div>
        {meetings.length === 0 && <div className="row" style={{ padding: '12px 0 14px', fontSize: 13, color: C.muted, lineHeight: 1.45 }}>No meetings yet. After a meeting, tap New and tick who came.</div>}
        {meetings.map(m => (
          <div key={m.id} onClick={() => set({ sheet: 'meeting', meetingId: m.id })} className="row tap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{fmt(m.date)}</div>
            <div className="mono" style={{ fontSize: 12, color: C.muted }}>{m.present.filter(id => mp.some(p => p.id === id)).length} of {mp.length} came →</div>
          </div>
        ))}
      </div>
      {helpers.map(h => {
        const hs = helperStats(data, c, h);
        return (
          <div key={h.id} className="card list" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div onClick={() => set({ personId: h.id })} className="tap" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Av name={h.name} o={ownerOf(h)} size={40} radius={12} font={15} />
                <div style={{ minWidth: 0 }}>
                  <div className="card-title">{h.name}</div>
                  <div className="small">{hs.looking}</div>
                </div>
              </div>
              <div onClick={() => set({ sheet: 'assign', assignFor: h.id })} className="pill-btn outline">Assign</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', borderTop: `1px solid ${C.divider}`, paddingTop: 10 }}>
              {[['Services', hs.svc], ['Meetings', hs.meet], ['Their people last time', hs.atLast]].map(([l, v]) => (
                <div key={l}><div style={{ fontSize: 11, color: C.muted }}>{l}</div><div className="mono" style={{ fontSize: 15, fontWeight: 600 }}>{v}</div></div>
              ))}
            </div>
            {hs.mine.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
                {hs.mine.slice(0, 5).map(p => {
                  const o = ownerOf(p);
                  return <div key={p.id} className="av" style={{ width: 28, height: 28, marginLeft: -6, borderRadius: 9, background: o.solid, color: o.onSolid, border: '2px solid #FFF', fontSize: 11 }}>{p.name[0]}</div>;
                })}
                <div className="mono" style={{ marginLeft: 6, fontSize: 11, color: C.muted }}>{hs.mine.length > 5 ? '+' + (hs.mine.length - 5) : ''}</div>
              </div>
            )}
          </div>
        );
      })}
      {helpers.length === 0 && (
        <div className="card list" style={{ padding: 18, fontSize: 14, color: '#3A3934', lineHeight: 1.5 }}>No helpers yet. Make an old member a helper, then assign new people to them.</div>
      )}
      <div onClick={() => set({ sheet: 'pick' })} className="dashed-btn"><span>+</span>Make an old member a helper</div>
    </div>
  );
}
