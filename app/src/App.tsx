import Attendance, { MarkBar } from './screens/Attendance';
import Care from './screens/Care';
import Home from './screens/Home';
import People from './screens/People';
import PersonPage from './screens/PersonPage';
import Stats from './screens/Stats';
import { AddSheet, AssignSheet, MeetingSheet, PickSheet, ReportSheet } from './sheets/Sheets';
import { useStore, type Tab } from './store';

const TABS: [Tab, string][] = [['home', 'Home'], ['mark', 'Attendance'], ['care', 'Care'], ['people', 'People'], ['stats', 'Stats']];

export default function App() {
  const { c, ui, go, toast, scrollRef } = useStore();
  const person = ui.personId ? c.byId[ui.personId] : null;
  const Screen = { home: Home, mark: Attendance, care: Care, people: People, stats: Stats }[ui.tab];

  return (
    <div className="phone">
      <div className="top-space" />
      <div ref={scrollRef} className="scroll noscroll">
        <Screen />
      </div>
      {ui.tab === 'mark' && <MarkBar />}
      <div className="tabbar">
        {TABS.map(([k, l]) => (
          <div key={k} className={ui.tab === k ? 'on' : ''} onClick={() => go(k, k === 'people' ? { pf: 'all', po: 'all' } : {})}>
            <div className="ind" />
            <div className="t">{l}</div>
          </div>
        ))}
      </div>

      {person && <PersonPage key={person.id} p={person} />}
      {ui.sheet === 'pick' && <PickSheet />}
      {ui.sheet === 'assign' && ui.assignFor && <AssignSheet helperId={ui.assignFor} />}
      {ui.sheet === 'meeting' && ui.meetingId && <MeetingSheet meetingId={ui.meetingId} />}
      {ui.add && <AddSheet />}
      {ui.reportId && <ReportSheet svcId={ui.reportId} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
