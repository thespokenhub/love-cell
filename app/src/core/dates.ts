// Dates are plain 'YYYY-MM-DD' strings, handled in UTC so no time zone can shift a day.
const DAY = 864e5;
export const toMs = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
export const toStr = (ms: number) => new Date(ms).toISOString().slice(0, 10);

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MOL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const wd = (d: string) => new Date(toMs(d)).getUTCDay();
export const dayNum = (d: string) => +d.slice(8, 10);
const mo = (d: string) => +d.slice(5, 7) - 1;

/** "Wed 21 Oct" */
export const fmt = (d: string) => `${WD[wd(d)]} ${dayNum(d)} ${MO[mo(d)]}`;
/** "Wednesday 21 October" */
export const fmtLong = (d: string) => `${WDL[wd(d)]} ${dayNum(d)} ${MOL[mo(d)]}`;
/** "21 Oct" */
export const fmtShort = (d: string) => `${dayNum(d)} ${MO[mo(d)]}`;
/** "21/10/26" */
export const fmtSlash = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(2, 4)}`;
export const weekdayShort = (d: string) => WD[wd(d)];

export const days = (a: string, b: string) => Math.round((toMs(b) - toMs(a)) / DAY);
export const addDays = (d: string, n: number) => toStr(toMs(d) + n * DAY);
/** The Sunday that starts the week containing d. */
export const weekStart = (d: string) => addDays(d, -wd(d));

export function localToday(): string {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}
