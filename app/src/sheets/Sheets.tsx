import { useEffect, useRef, useState } from 'react';
import { addDays, fmt, fmtLong, fmtShort } from '../core/dates';
import { addPerson, deleteMeeting, patchPerson, shiftMeeting, toggleMeeting } from '../core/actions';
import { dispName, meetingPeople, reportText, SVC_NAME } from '../core/rules';
import type { Owner } from '../core/types';
import { useStore } from '../store';
import { C, OWN, ownerOf } from '../theme';
import { Av, Sheet, Switch, TickBox } from '../ui';

export function AddSheet() {
  const { data, c, today, slots, ui, set, commit, flash } = useStore();
  const [name, setName] = useState('');
  const [old, setOld] = useState(false);
  const lastSvc = c.svcs[c.svcs.length - 1];
  // Default: the latest service if it was in the last 3 days, otherwise the next one.
  const [svcId, setSvcId] = useState(ui.add?.svcId ?? (lastSvc && lastSvc.date >= addDays(today, -3) ? lastSvc.id : slots[slots.length - 1].id));
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);
  const close = () => set({ add: null });
  const canAdd = !!name.trim();

  const add = (owner: Owner) => {
    if (!canAdd) return;
    const slot = svcId === 'none' ? null : slots.find(s => s.id === svcId) || null;
    const { data: d, person } = addPerson(data, name, owner, old, slot);
    commit(d);
    close();
    flash(`${person.name} added to ${owner}'s people` + (slot ? ` · marked at ${SVC_NAME[slot.type]} ${fmtShort(slot.date)}` : ''));
  };

  const chips = [
    ...slots.slice(-4).reverse().map(s => ({ id: s.id, top: s.isNew ? 'Next · ' + SVC_NAME[s.type] : SVC_NAME[s.type], label: fmt(s.date) })),
    { id: 'none', top: 'Not yet', label: 'Hasn’t come' },
  ];
  const ownerBtn = (o: Owner) => (
    <button onClick={() => add(o)}
      style={{ height: 54, borderRadius: 14, border: 'none', background: canAdd ? OWN[o].solid : C.switchOff, color: canAdd ? OWN[o].onSolid : C.muted, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
      {o}'s person
    </button>
  );

  return (
    <Sheet onClose={close} gap={14}>
      <div>
        <div className="sheet-title">Add someone new</div>
        <div className="sub">Type their name, then pick whose person they are.</div>
      </div>
      <input ref={inputRef} value={name} onChange={e => setName(e.target.value)} placeholder="Their name" autoComplete="off" autoCapitalize="words"
        style={{ height: 52, borderRadius: 14, border: `1px solid ${C.line}`, background: C.canvas, padding: '0 14px', fontFamily: 'inherit', fontSize: 17, color: C.ink, outline: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="label">MARK THEM AS HERE AT</div>
        <div className="chips noscroll" style={{ margin: '0 -16px', padding: '0 16px' }}>
          {chips.map(ch => (
            <div key={ch.id} onClick={() => setSvcId(ch.id)} className={'chip' + (ch.id === svcId ? ' on' : '')}>
              <div className="top">{ch.top}</div>
              <div className="lbl">{ch.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div onClick={() => setOld(!old)} className="tap" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 22, height: 22, boxSizing: 'border-box', borderRadius: 6, background: old ? C.ink : '#FFF', border: `2px solid ${old ? C.ink : C.dashed}`, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{old ? '✓' : ''}</div>
        <div style={{ fontSize: 14 }}>Old member coming back (not a first-timer)</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {ownerBtn('Nelson')}
        {ownerBtn('Ella')}
      </div>
      <div onClick={close} className="link-btn">Cancel</div>
    </Sheet>
  );
}

export function ReportSheet({ svcId }: { svcId: string }) {
  const { data, slots, set } = useStore();
  const [copied, setCopied] = useState(false);
  const slot = slots.find(s => s.id === svcId);
  if (!slot) return null;
  const r = reportText(data, slot);
  const close = () => set({ reportId: null });
  const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1800); };
  const copy = () => {
    const fallback = () => {
      const a = document.createElement('textarea');
      a.value = r.text;
      document.body.appendChild(a);
      a.select();
      try { document.execCommand('copy'); } catch { /* nothing else to try */ }
      a.remove();
      done();
    };
    if (navigator.clipboard) navigator.clipboard.writeText(r.text).then(done, fallback);
    else fallback();
  };
  return (
    <Sheet onClose={close} z={40} gap={14}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="sheet-title">Report</div>
          <div className="sub">{SVC_NAME[slot.type]} · {fmtLong(slot.date)}</div>
        </div>
        <div className="badge">{r.count} here</div>
      </div>
      <div className="noscroll mono" style={{ maxHeight: 420, overflowY: 'auto', background: C.canvas, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{r.text}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button onClick={copy} className="btn">{copied ? 'Copied ✓' : 'Copy'}</button>
        <a href={'https://wa.me/?text=' + encodeURIComponent(r.text)} target="_blank" rel="noreferrer"
          style={{ height: 50, borderRadius: 12, background: C.accent, color: C.ink, fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>Send on WhatsApp</a>
      </div>
      <div onClick={close} className="link-btn">Close</div>
    </Sheet>
  );
}

export function PickSheet() {
  const { data, c, set, commit, flash } = useStore();
  const close = () => set({ sheet: null });
  const rows = c.people.filter(p => p.kind === 'old' && !p.helper && !p.left);
  return (
    <Sheet onClose={close} z={46} topMin={120} maxHeight={640}>
      <div>
        <div className="sheet-title">Make a helper</div>
        <div className="sub">Pick an old member to help you look after new people.</div>
      </div>
      <div className="noscroll" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {rows.map(p => {
          const o = ownerOf(p);
          return (
            <div key={p.id} onClick={() => { commit(patchPerson(data, p.id, { helper: true })); close(); flash(p.name + ' is now a helper'); }}
              className="row tap" style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 56 }}>
              <Av name={p.name} o={o} size={34} radius={10} font={13} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{p.name}</div>
                <div className="small">{o.label} · {p.visits.length} of {c.svcs.length} services</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.link }}>Make helper</div>
            </div>
          );
        })}
        {rows.length === 0 && <div style={{ padding: '16px 0', fontSize: 14, color: C.muted }}>Every old member is already a helper.</div>}
      </div>
      <div onClick={close} className="link-btn">Close</div>
    </Sheet>
  );
}

export function AssignSheet({ helperId }: { helperId: string }) {
  const { data, c, set, commit } = useStore();
  const h = c.byId[helperId];
  if (!h) return null;
  const close = () => set({ sheet: null });
  const cand = c.people
    .filter(p => p.kind !== 'leader' && !p.left && !p.helper && p.id !== h.id)
    .sort((a, b) => (a.kind === 'first' ? 0 : 1) - (b.kind === 'first' ? 0 : 1));
  return (
    <Sheet onClose={close} z={46} maxHeight={700}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Who is {h.name} looking after?</div>
        <div className="badge">{cand.filter(p => p.helperId === h.id).length} picked</div>
      </div>
      <div className="noscroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {cand.map(p => {
          const on = p.helperId === h.id;
          const other = p.helperId && p.helperId !== h.id && c.byId[p.helperId]?.helper ? c.byId[p.helperId] : null;
          const o = ownerOf(p);
          const toggle = () => commit(patchPerson(data, p.id, { helperId: on ? null : h.id }));
          return (
            <div key={p.id} onClick={toggle} className="row tap" style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 54 }}>
              <Av name={p.name} o={o} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{p.name}</div>
                <div className="small">{other ? `With ${other.name} · tap to move` : `${o.label} · ${p.label}`}</div>
              </div>
              <TickBox on={on} size={32} onTick={toggle} />
            </div>
          );
        })}
      </div>
      <button onClick={close} className="btn" style={{ flex: 'none' }}>Done</button>
    </Sheet>
  );
}

export function MeetingSheet({ meetingId }: { meetingId: string }) {
  const { data, c, set, commit } = useStore();
  const m = (data.meetings || []).find(x => x.id === meetingId);
  if (!m) return null;
  const close = () => set({ sheet: null });
  const mp = meetingPeople(c.people);
  const came = m.present.filter(id => mp.some(p => p.id === id)).length;
  const arrow = (glyph: string, n: number) => (
    <div onClick={() => commit(shiftMeeting(data, m.id, n))} className="tap"
      style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxSizing: 'border-box' }}>{glyph}</div>
  );
  return (
    <Sheet onClose={close} z={46} topMin={120}>
      <div>
        <div className="label" style={{ letterSpacing: '.08em' }}>SHEPHERDS' MEETING</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          {arrow('‹', -1)}
          <div style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 600 }}>{fmtLong(m.date)}</div>
          {arrow('›', 1)}
        </div>
      </div>
      <div className="sub">{came} of {mp.length} came · tap to mark</div>
      <div className="noscroll" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', minHeight: 0 }}>
        {mp.map(p => {
          const on = m.present.includes(p.id);
          return (
            <div key={p.id} onClick={() => commit(toggleMeeting(data, m.id, p.id))} className="row tap" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 52 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{dispName(p)}</div>
                <div className="small">{p.id === 'p3' ? 'Shepherd' : 'Helper'}</div>
              </div>
              <div className="mono" style={{ fontSize: 11, color: on ? C.ink : C.muted }}>{on ? 'Came' : 'Didn’t come'}</div>
              <Switch on={on} color={C.accent} />
            </div>
          );
        })}
      </div>
      <button onClick={close} className="btn" style={{ flex: 'none' }}>Done</button>
      <div onClick={() => { commit(deleteMeeting(data, m.id)); close(); }} className="tap" style={{ textAlign: 'center', fontSize: 13, color: C.down, padding: 2 }}>Remove this meeting</div>
    </Sheet>
  );
}
