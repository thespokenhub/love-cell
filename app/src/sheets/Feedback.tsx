import { useEffect, useRef, useState } from 'react';
import { fmt } from '../core/dates';
import { useStore, type Tab } from '../store';
import { C } from '../theme';
import { Sheet } from '../ui';

const REPO = 'https://github.com/thespokenhub/love-cell';
const PARTS: [Tab | 'other', string][] = [['home', 'Home'], ['mark', 'Attendance'], ['care', 'Care'], ['people', 'People'], ['stats', 'Stats'], ['other', 'Something else']];

/** Feedback becomes a GitHub issue that mentions @claude, which starts Claude Code on it. */
export function issueUrl(text: string, part: string, today: string) {
  const first = text.trim().split('\n')[0];
  const title = 'Feedback: ' + (first.length > 60 ? first.slice(0, 57) + '…' : first);
  const body = [
    '@claude please make this change to the Love Cell app.',
    '',
    '### Feedback',
    text.trim(),
    '',
    `**Part of the app:** ${part}`,
    `**Sent:** ${fmt(today)} from app version \`${__APP_VERSION__}\``,
  ].join('\n');
  return `${REPO}/issues/new?${new URLSearchParams({ title, body, labels: 'feedback' })}`;
}

export default function FeedbackSheet() {
  const { ui, today, set, flash } = useStore();
  const [text, setText] = useState('');
  const [part, setPart] = useState<Tab | 'other'>(ui.personId ? 'people' : ui.tab);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const close = () => set({ feedback: false });
  const ok = !!text.trim();
  const url = ok ? issueUrl(text, PARTS.find(p => p[0] === part)![1], today) : '#';

  return (
    <Sheet onClose={close} z={46} gap={14}>
      <div>
        <div className="sheet-title">Send feedback</div>
        <div className="sub">Say what to fix or add, in your own words. Claude will make the change and send it back for you to check.</div>
      </div>
      <textarea id="feedback-text" ref={ref} value={text} onChange={e => setText(e.target.value)} rows={5}
        placeholder="e.g. On Stats, I'd like to see who came to every service"
        style={{ borderRadius: 14, border: `1px solid ${C.line}`, background: C.canvas, padding: '12px 14px', fontFamily: 'inherit', fontSize: 16, lineHeight: 1.45, color: C.ink, outline: 'none', resize: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="label">WHICH PART IS IT ABOUT?</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PARTS.map(([k, l]) => (
            <div key={k} onClick={() => setPart(k)} className="tap"
              style={{ height: 34, padding: '0 12px', borderRadius: 9, boxSizing: 'border-box', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 500, background: part === k ? C.ink : '#FFF', color: part === k ? '#FFF' : C.ink, border: `1px solid ${part === k ? C.ink : C.line}` }}>{l}</div>
          ))}
        </div>
      </div>
      <a href={url} target="_blank" rel="noreferrer"
        onClick={e => { if (!ok) { e.preventDefault(); return; } close(); flash('Opening GitHub. Tap “Create” there to send it.'); }}
        style={{ height: 54, borderRadius: 14, background: ok ? C.accent : C.switchOff, color: ok ? C.ink : C.muted, fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
        Send to Claude
      </a>
      <div className="small" style={{ lineHeight: 1.45, marginTop: -4 }}>
        This opens GitHub with your note filled in. You need to be signed in to GitHub as the owner of the app.
      </div>
      <div onClick={close} className="link-btn">Cancel</div>
    </Sheet>
  );
}
