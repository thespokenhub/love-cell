import type { Owner, PersonView, StatusKey } from './core/types';

export const C = {
  ink: '#111111',
  muted: '#66655F',
  faintText: '#8A887F',
  canvas: '#F5F5F2',
  line: '#E6E4DE',
  divider: '#EFEDE8',
  track: '#ECEAE4',
  switchOff: '#E2DFD8',
  dashed: '#CFCCC4',
  accent: '#FF5B1F',
  ella: '#2D5BFF',
  link: '#C2410C',
  up: '#16663A',
  down: '#B42318',
};

export interface OwnerTheme { label: string; bg: string; fg: string; solid: string; onSolid: string }

export const OWN: Record<Owner, OwnerTheme> = {
  Nelson: { label: "Nelson's", bg: '#FFE6DA', fg: '#A33208', solid: '#FF5B1F', onSolid: '#111111' },
  Ella: { label: "Ella's", bg: '#E0E7FF', fg: '#1E3FB8', solid: '#2D5BFF', onSolid: '#FFFFFF' },
};
const LEAD: OwnerTheme = { label: 'Leader', bg: '#ECEAE4', fg: '#111111', solid: '#111111', onSolid: '#FFFFFF' };

export const ownerOf = (p: { owner: Owner | null }) => (p.owner ? OWN[p.owner] : LEAD);

const ST: Record<StatusKey, { bg: string; fg: string }> = {
  new: { bg: '#F0EFEA', fg: '#3A3934' },
  regular: { bg: '#DDF3E4', fg: '#16663A' },
  onoff: { bg: '#FFF0C9', fg: '#7A5300' },
  followup: { bg: '#FFE0D9', fg: '#B42318' },
  old: { bg: '#EEE6FA', fg: '#5B3A9E' },
  leader: { bg: '#111111', fg: '#FFFFFF' },
  none: { bg: '#F0EFEA', fg: '#66655F' },
  left: { bg: '#ECEAE4', fg: '#66655F' },
};
export const statusOf = (p: PersonView) => ST[p.key] || ST.none;

export const BUCKET: Record<string, string> = { new: '#C9C6BD', regular: '#16A34A', onoff: '#F5B83D', followup: '#E5484D' };
