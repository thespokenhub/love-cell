import type { CSSProperties, ReactNode } from 'react';
import type { OwnerTheme } from './theme';

export function Seg<K extends string>({ options, value, onChange, fill, style }: {
  options: [K, string][]; value: K; onChange: (k: K) => void; fill?: boolean; style?: CSSProperties;
}) {
  return (
    <div className={'seg' + (fill ? ' fill' : '')} style={style}>
      {options.map(([k, l]) => (
        <div key={k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>{l}</div>
      ))}
    </div>
  );
}

/** iOS-style switch; the track takes the owner colour when on. */
export const Switch = ({ on, color }: { on: boolean; color: string }) => (
  <div className={'switch' + (on ? ' on' : '')} style={on ? { background: color } : undefined}><div /></div>
);

export const TickBox = ({ on, locked, onTick, size = 34 }: { on: boolean; locked?: boolean; onTick: () => void; size?: number }) => (
  <div
    className={'tickbox' + (on ? ' on' : locked ? ' locked' : '')}
    style={size !== 34 ? { width: size, height: size, fontSize: 15 } : undefined}
    onClick={e => { e.stopPropagation(); if (!locked) onTick(); }}
  >{on ? '✓' : ''}</div>
);

/** Owner-tinted initial tile. */
export const Av = ({ name, o, size = 30, radius = 9, font = 12, solid }: {
  name: string; o: OwnerTheme; size?: number; radius?: number; font?: number; solid?: boolean;
}) => (
  <div className="av" style={{ width: size, height: size, borderRadius: radius, fontSize: font, background: solid ? o.solid : o.bg, color: solid ? o.onSolid : o.fg }}>
    {name[0]}
  </div>
);

export const Pill = ({ bg, fg, children, style }: { bg: string; fg: string; children: ReactNode; style?: CSSProperties }) => (
  <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 8px', borderRadius: 6, background: bg, color: fg, ...style }}>{children}</span>
);

export const Header = ({ eyebrow, title, sub, right }: { eyebrow: string; title: string; sub?: ReactNode; right?: ReactNode }) => (
  <div style={{ padding: '0 2px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="eyebrow">{eyebrow}</div>
      <div className="title">{title}</div>
      {sub != null && <div className="sub">{sub}</div>}
    </div>
    {right}
  </div>
);

export function Sheet({ onClose, children, z = 45, gap = 12, maxHeight, topMin = 80 }: {
  onClose: () => void; children: ReactNode; z?: number; gap?: number; maxHeight?: number; topMin?: number;
}) {
  return (
    <div className="overlay" style={{ zIndex: z }}>
      <div onClick={onClose} style={{ flex: 1, minHeight: topMin }} />
      <div className="sheet" style={{ gap, maxHeight }}>
        <div className="grab" />
        {children}
      </div>
    </div>
  );
}

/** A thin progress bar. */
export const Progress = ({ pct, h = 6, track }: { pct: number; h?: number; track?: string }) => (
  <div className="bar-track" style={{ height: h, background: track }}>
    <div className="bar-fill" style={{ width: pct + '%' }} />
  </div>
);

/** Small round "?" that opens an explanation. Stops the tap reaching the card behind it. */
export const Ask = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <div role="button" aria-label={'What is ' + label + '?'} onClick={e => { e.stopPropagation(); onClick(); }} className="ask">?</div>
);

export interface Explain {
  title: string;
  value?: string;
  body: string[];
  action?: { label: string; onClick: () => void };
}

export function ExplainSheet({ e, onClose }: { e: Explain; onClose: () => void }) {
  return (
    <Sheet onClose={onClose} z={46} topMin={120} gap={14}>
      <div>
        <div className="label" style={{ letterSpacing: '.08em' }}>WHAT THIS MEANS</div>
        <div className="sheet-title" style={{ marginTop: 2 }}>{e.title}</div>
      </div>
      {e.value && <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1 }}>{e.value}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15, lineHeight: 1.5, color: '#3A3934' }}>
        {e.body.map((t, i) => <p key={i} style={{ margin: 0 }}>{t}</p>)}
      </div>
      {e.action && <button onClick={() => { onClose(); e.action!.onClick(); }} className="btn">{e.action.label}</button>}
      <div onClick={onClose} className="link-btn">Close</div>
    </Sheet>
  );
}
