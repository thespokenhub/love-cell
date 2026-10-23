(function(){
const DAY=864e5;
const toMs=d=>Date.UTC(+d.slice(0,4),+d.slice(5,7)-1,+d.slice(8,10));
const toStr=ms=>new Date(ms).toISOString().slice(0,10);
const WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const WDL=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MOL=['January','February','March','April','May','June','July','August','September','October','November','December'];
const wd=d=>new Date(toMs(d)).getUTCDay();
const dn=d=>+d.slice(8,10);
const mo=d=>+d.slice(5,7)-1;
const fmt=d=>WD[wd(d)]+' '+dn(d)+' '+MO[mo(d)];
const fmtLong=d=>WDL[wd(d)]+' '+dn(d)+' '+MOL[mo(d)];
const fmtShort=d=>dn(d)+' '+MO[mo(d)];
const fmtSlash=d=>d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(2,4);
const days=(a,b)=>Math.round((toMs(b)-toMs(a))/DAY);
const addDays=(d,n)=>toStr(toMs(d)+n*DAY);
const weekStart=d=>addDays(d,-wd(d));
const SN={MGS:'MGS',LC:'LC Live'};
const svcName=s=>SN[s.type]+' · '+fmt(s.date);

const SEED=`L|Fred Adzah|Senior Shepherd|M11 L14 M18 L21
L|Nelson Ansah|Cell Shepherd|M11 L14 M18 L21
L|Emmanuella Lithur|Shepherd|M18 L21
N|Kezia|f|M11 L14 M18
N|Precious|f|M11 L14 M18
N|Bibiana|f|M11 L14 M18
N|Sheridan|f|M11 L14 M18
N|Josephine|f|M11 L14 L21
N|Josephine B|f|M11
N|Josephine Mamle|f|L14 M18
N|Shelter|f|M11 L14
N|Benedicta|f|M11 L14 M18 L21
N|Matilda|f|M11 L14 M18 L21
N|Derrick|f|M11
N|Fatima|f|M11
N|Collins|f|M11 L14 L21
N|Debbie|f|M11 L14 L21
N|Hannah|f|M11 L14
N|Lilian|f|L14
N|Bridget|f|L14 M18
N|Annabelle|f|L14 M18
N|Dela|f|L14
N|Faustina|f|L14
N|Kwabena|f|M18
N|George|f|M18
N|Juliet|f|M18
N|Eugenia|f|M18
N|Ewurabena|f|M18
N|Joy|f|L21
N|Gloria Viera|o|M11 M18
N|Tracy NeeQuaye|o|M18 L21
N|Kate Atsu|o|L21
N|Karen Tinawura|o|L21
E|Theresa|f|L14
E|Linda|f|L14 M18
E|Audrey|f|L14 M18 L21
E|Caroline|f|L14 L21
E|Dzifa|f|L14
E|Zion|f|L14
E|Judith Fafali|f|M18
E|Chris Mondy|f|M18
E|Josephine|f|M18
E|Mabel|f|M18
E|Vickybel|f|M18
E|Jane|f|M18
E|Janet|f|M18
E|Arnold|f|L21`;

function seed(){
  const services=[{id:'M11',type:'MGS',date:'2026-10-11'},{id:'L14',type:'LC',date:'2026-10-14'},{id:'M18',type:'MGS',date:'2026-10-18'},{id:'L21',type:'LC',date:'2026-10-21'}];
  const att={M11:[],L14:[],M18:[],L21:[]};
  const people=SEED.split('\n').map((line,i)=>{
    const [g,name,k,codes]=line.split('|');const id='p'+(i+1);
    codes.split(' ').forEach(c=>att[c].push(id));
    if(g==='L')return {id,name,owner:null,kind:'leader',role:k};
    return {id,name,owner:g==='N'?'Nelson':'Ella',kind:k==='o'?'old':'first'};
  });
  return {people,services,att};
}

function compute(S,todayIn){
  const svcs=[...S.services].sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  const lastDate=svcs.length?svcs[svcs.length-1].date:todayIn;
  const today=todayIn>lastDate?todayIn:lastDate;
  const sets={};svcs.forEach(s=>sets[s.id]=new Set(S.att[s.id]||[]));
  const last2=svcs.slice(-2);
  const people=S.people.map(p=>{
    const visits=svcs.filter(s=>sets[s.id].has(p.id));
    const fv=visits.length?visits[0].date:null, ls=visits.length?visits[visits.length-1].date:null;
    const r={...p,visits,firstVisit:fv,firstSvc:visits[0]||null,lastSeen:ls,since:ls?days(ls,today):null};
    if(p.kind==='leader'){r.key='leader';r.label=p.role;}
    else if(p.kind==='old'){r.key='old';r.label='Old member';}
    else if(!fv){r.key='none';r.label='Not seen yet';}
    else{
      const end=addDays(fv,56);
      const win=svcs.filter(s=>s.date>=fv&&s.date<end);
      r.held=win.length;r.attended=win.filter(s=>sets[s.id].has(p.id)).length;
      if(today<end){r.week=Math.min(8,Math.floor(days(fv,today)/7)+1);r.key='new';r.label='New · week '+r.week+' of 8';}
      else{const pct=r.attended/r.held;r.key=pct>=0.75?'regular':pct>=0.4?'onoff':'followup';r.label={regular:'Coming regularly',onoff:'On and off',followup:'Needs a follow-up'}[r.key];}
    }
    if(p.left&&p.kind!=='leader'){r.key='left';r.label='Stopped coming';}
    r.helper=!!p.helper&&!p.left&&p.kind!=='leader';
    r.flagged=p.id!=='p2'&&!p.left&&!!ls&&r.since>=21;
    r.missed2=!r.flagged&&!p.left&&p.id!=='p2'&&!!fv&&last2.length===2&&fv<last2[0].date&&last2.every(s=>!sets[s.id].has(p.id));
    r.call=r.flagged||r.missed2;
    r.callReason=r.flagged?'Not seen for '+Math.floor(r.since/7)+' weeks':'Missed the last 2';
    return r;
  });
  return {svcs,today,people,sets};
}

function nextSlot(svcs,today){
  let d=svcs.length?addDays(svcs[svcs.length-1].date,1):today;
  while(wd(d)!==0&&wd(d)!==3)d=addDays(d,1);
  const type=wd(d)===0?'MGS':'LC';
  return {id:(type==='MGS'?'M':'L')+d.replace(/-/g,''),type,date:d,isNew:true};
}

function reportText(S,slot){
  const set=new Set(S.att[slot.id]||[]);
  const L=['*OASIS BACENTA ATTENDANCE*',(slot.type==='MGS'?'MGS':'LC LIVE')+' - '+fmtSlash(slot.date)];
  if(set.has('p1'))L.push('*SS - Fred Adzah');
  if(set.has('p2'))L.push('*CS - Nelson Ansah');
  if(set.has('p3'))L.push('*S - Emmanuella Lithur');
  S.people.filter(p=>p.owner==='Nelson'&&set.has(p.id)).forEach(p=>L.push('- '+p.name));
  S.people.filter(p=>p.owner==='Ella'&&set.has(p.id)).forEach(p=>L.push('- '+p.name+' (from Ella)'));
  return {text:L.join('\n'),count:set.size};
}

const initialState=()=>({S:null,tab:'home',svcId:null,mf:'all',q:'',pq:'',pf:'all',po:'all',personId:null,reportId:null,newName:'',toast:null,copied:false,careTask:'pray',co:'all',pv:'people',sheet:null,assignFor:null,meetingId:null,ftMode:'week',addOpen:false,addName:'',addSvc:null,addOld:false});

const A={
  mount(self,key){
    self._key=key;let S=null;try{S=JSON.parse(localStorage.getItem(key)||'null')}catch(e){}
    if(!S||!S.people||!S.services||!S.att)S=seed();
    self.setState({S});
  },
  commit(self,S){self.setState({S});try{localStorage.setItem(self._key,JSON.stringify(S))}catch(e){}},
  flash(self,msg){clearTimeout(self._t);self.setState({toast:msg});self._t=setTimeout(()=>self.setState({toast:null}),2600);},
  go(self,tab,extra){self.setState({tab,personId:null,...(extra||{})});const el=self.scrollRef&&self.scrollRef.current;if(el)el.scrollTop=0;},
  withSvc(S,slot){
    if(!S.services.find(s=>s.id===slot.id))S.services=[...S.services,{id:slot.id,type:slot.type,date:slot.date}];
    if(!S.att[slot.id])S.att[slot.id]=[];
  },
  toggle(self,slot,pid){
    const S={...self.state.S,att:{...self.state.S.att}};A.withSvc(S,slot);
    const l=S.att[slot.id];S.att[slot.id]=l.includes(pid)?l.filter(x=>x!==pid):[...l,pid];
    A.commit(self,S);if(self.state.svcId!==slot.id)self.setState({svcId:slot.id});
  },
  add(self,owner,name,slot){
    name=(name||'').trim();if(!name)return;
    const id='p'+Date.now();
    const S={...self.state.S,att:{...self.state.S.att},people:[...self.state.S.people,{id,name,owner,kind:'first'}]};
    A.withSvc(S,slot);S.att[slot.id]=[...S.att[slot.id],id];
    A.commit(self,S);self.setState({newName:'',svcId:slot.id});
    A.flash(self,name+' added to '+owner+"'s people and marked here");
  },
  setPerson(self,pid,patch){A.commit(self,{...self.state.S,people:self.state.S.people.map(p=>p.id===pid?{...p,...patch}:p)});},
  reset(self){A.commit(self,seed());self.setState({svcId:null,personId:null,reportId:null});A.flash(self,'Back to the 4 real services');},
  copy(self,text){
    const done=()=>{self.setState({copied:true});setTimeout(()=>self.setState({copied:false}),1800);};
    const fb=()=>{const a=document.createElement('textarea');a.value=text;document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(e){}a.remove();done();};
    try{navigator.clipboard.writeText(text).then(done,fb)}catch(e){fb()}
  }
};

function vals(self,T){
  const st=self.state,S=st.S;
  const {svcs,today,people,sets}=compute(S,self.props.pretendToday||'2026-10-23');
  const ownerOf=p=>p.owner?T.own[p.owner]:T.lead;
  const stOf=p=>T.st[p.key]||T.st.none;
  const dispName=p=>p.id==='p3'?'Emmanuella Lithur (Ella)':p.name;
  const byId={};people.forEach(p=>byId[p.id]=p);
  const leaders=people.filter(p=>p.kind==='leader');
  const members=people.filter(p=>p.kind!=='leader'&&!p.left);
  const firsts=people.filter(p=>p.kind==='first'&&p.firstVisit);
  const olds=people.filter(p=>p.kind==='old'&&!p.left);
  const toCall=people.filter(p=>p.call).sort((a,b)=>(b.since||0)-(a.since||0));
  const next=nextSlot(svcs,today);
  const slots=[...svcs,next];
  const cur=slots.find(s=>s.id===st.svcId)||next;
  const curSet=new Set(S.att[cur.id]||[]);
  const open=pid=>()=>self.setState({personId:pid});
  const go=(t,x)=>A.go(self,t,x);
  const thisWeek=weekStart(today);
  const newWk=firsts.filter(p=>weekStart(p.firstVisit)===thisWeek);
  const lastWk=firsts.filter(p=>weekStart(p.firstVisit)===addDays(thisWeek,-7));
  const cameBack=firsts.filter(p=>p.visits.length>1).length;
  const cbPct=firsts.length?Math.round(cameBack/firsts.length*100):0;
  const start=svcs.length?svcs[0].date:today;
  const dNext=days(today,next.date);
  const nx={name:SN[next.type],long:fmtLong(next.date),short:fmt(next.date),day:WD[wd(next.date)],num:String(dn(next.date)),mon:MO[mo(next.date)],when:dNext<0?'Not taken yet':dNext===0?'Today':dNext===1?'Tomorrow':'In '+dNext+' days',onClick:()=>go('mark',{svcId:next.id})};
  const callAll=()=>go('people',{pf:'call',po:'all',pq:''});
  const attLine=p=>p.kind==='first'&&p.held!=null?p.attended+' of '+p.held+' since first visit':p.visits.length+' of '+svcs.length+' services';
  const av=p=>{const o=ownerOf(p);return {initial:p.name[0],bg:o.solid,fg:o.onSolid,ring:T.avRing};};
  const curCount=curSet.size;
  const cnt=f=>people.filter(p=>curSet.has(p.id)&&f(p)).length;
  const barSub=cnt(p=>p.kind==='leader')+' leaders · '+cnt(p=>p.owner==='Nelson')+" Nelson's · "+cnt(p=>p.owner==='Ella')+" Ella's";

  const maxC=Math.max(1,...svcs.map(s=>sets[s.id].size));
  const lastSvc=svcs[svcs.length-1];
  const recent=svcs.slice(-4).reverse().map(s=>{
    const n=firsts.filter(p=>p.firstSvc&&p.firstSvc.id===s.id).length;
    const prev=[...svcs].filter(x=>x.type===s.type&&x.date<s.date).pop();
    const d=prev?sets[s.id].size-sets[prev.id].size:null;
    return {name:svcName(s),type:SN[s.type],date:fmt(s.date),count:sets[s.id].size,w:Math.round(sets[s.id].size/maxC*100)+'%',newLine:n?n+' first-timers':'No first-timers',newN:n,delta:d===null?'First one':(d>0?'+'+d:d===0?'±0':String(d)),deltaFg:d===null?T.muted:d>0?T.up:d<0?T.down:T.muted,onOpen:()=>go('mark',{svcId:s.id}),onReport:()=>self.setState({reportId:s.id})};
  });
  let lastCard={name:'',date:'',count:0,delta:'',deltaFg:T.muted,nW:'0%',eW:'0%',lW:'0%',n:0,e:0,l:0};
  if(lastSvc){const set=sets[lastSvc.id];const c=f=>people.filter(p=>set.has(p.id)&&f(p)).length;const tot=Math.max(1,set.size);
    const prev=[...svcs].filter(x=>x.type===lastSvc.type&&x.date<lastSvc.date).pop();const d=prev?set.size-sets[prev.id].size:null;
    const l=c(p=>p.kind==='leader'),n=c(p=>p.owner==='Nelson'),e=c(p=>p.owner==='Ella');
    lastCard={name:SN[lastSvc.type],date:fmt(lastSvc.date),count:set.size,delta:d===null?'First '+SN[lastSvc.type]+' on record':(d>0?'+'+d:d)+' vs last '+SN[lastSvc.type],deltaFg:d===null?T.muted:d>0?T.up:d<0?T.down:T.muted,l,n,e,lW:l/tot*100+'%',nW:n/tot*100+'%',eW:e/tot*100+'%',onReport:()=>self.setState({reportId:lastSvc.id}),onOpen:()=>go('mark',{svcId:lastSvc.id})};}

  const weeks=[];for(let w=weekStart(start);w<=thisWeek;w=addDays(w,7))weeks.push(w);
  const wk=weeks.map(w=>{const l=firsts.filter(p=>weekStart(p.firstVisit)===w);return {w,n:l.filter(p=>p.owner==='Nelson').length,e:l.filter(p=>p.owner==='Ella').length};});
  const maxW=Math.max(1,...wk.map(x=>x.n+x.e));
  const weeksB=wk.slice(-4).map(x=>({label:x.w===thisWeek?'This week':'Week of '+fmtShort(x.w),short:x.w===thisWeek?'This wk':fmtShort(x.w),count:x.n+x.e,n:x.n,e:x.e,nW:(x.n/maxW*100)+'%',eW:(x.e/maxW*100)+'%',nH:Math.round(x.n/maxW*(T.weekH||90))+'px',eH:Math.round(x.e/maxW*(T.weekH||90))+'px'}));
  const BH=T.barH||130;
  const svcBars=svcs.slice(-5).map((s,i,arr)=>{const set=sets[s.id];const c=f=>people.filter(p=>set.has(p.id)&&f(p)).length;const k=BH/maxC;const isLast=i===arr.length-1;
    return {count:set.size,h:Math.round(set.size*k)+'px',hL:c(p=>p.kind==='leader')*k+'px',hN:c(p=>p.owner==='Nelson')*k+'px',hE:c(p=>p.owner==='Ella')*k+'px',top:SN[s.type],date:fmtShort(s.date),day:WD[wd(s.date)]+' '+dn(s.date),bg:isLast?T.barOn:T.barIdle,fg:isLast?T.barOnFg:T.barIdleFg,isLast,onClick:()=>go('mark',{svcId:s.id})};});
  const BK=[['new','New (first 8 weeks)'],['regular','Coming regularly'],['onoff','On and off'],['followup','Needs a follow-up']];
  const buckets=BK.map(([k,l])=>{const n=firsts.filter(p=>p.key===k).length;return {label:l,count:n,color:T.bucket[k],fg:n?T.ink:T.muted,w:(firsts.length?n/firsts.length*100:0)+'%',onClick:()=>go('people',{pf:k,po:'all',pq:''})};});
  const split=['Nelson','Ella'].map(o=>{const l=people.filter(p=>p.owner===o);return {label:T.own[o].label+' people',bg:T.own[o].bg,fg:T.own[o].fg,solid:T.own[o].solid,onSolid:T.own[o].onSolid,people:l.length,firsts:l.filter(p=>p.kind==='first').length,last:lastSvc?l.filter(p=>sets[lastSvc.id].has(p.id)).length:0,onClick:()=>go('people',{pf:'all',po:o,pq:''})};});
  const newPeople=firsts.filter(p=>p.key==='new');
  const pipeMax=Math.max(1,...[1,2,3,4,5,6,7,8].map(i=>newPeople.filter(p=>p.week===i).length));
  const pipeline=[1,2,3,4,5,6,7,8].map(i=>{const n=newPeople.filter(p=>p.week===i).length;return {label:'W'+i,count:n?String(n):'·',h:Math.max(4,Math.round(n/pipeMax*(T.pipeH||64)))+'px',bg:n?T.pipeOn:T.pipeOff,fg:n?T.ink:T.muted};});
  const jSorted=[...newPeople].sort((a,b)=>a.firstVisit<b.firstVisit?-1:a.firstVisit>b.firstVisit?1:(b.attended/b.held)-(a.attended/a.held));
  const journeys=jSorted.slice(0,5).map(p=>{const o=ownerOf(p);return {name:p.name,initial:p.name[0],ownerLabel:o.label,ownerBg:o.bg,ownerFg:o.fg,solid:o.solid,onSolid:o.onSolid,week:'Week '+p.week+' of 8',att:p.attended+'/'+p.held,since:'Since '+fmtShort(p.firstVisit),segs:Array.from({length:8},(_,i)=>({bg:i<p.week?T.segFill:T.segEmpty})),onClick:open(p.id)};});
  const callAv=toCall.slice(0,4).map(av);
  const newAv=[...firsts].sort((a,b)=>a.firstVisit>b.firstVisit?-1:1).slice(0,4).map(av);
  const callTop=toCall.slice(0,5).map(p=>{const o=ownerOf(p);return {name:dispName(p),initial:p.name[0],ownerBg:o.bg,ownerFg:o.fg,solid:o.solid,onSolid:o.onSolid,ownerLabel:o.label,reason:p.callReason,seen:p.lastSeen?'Since '+fmtShort(p.lastSeen):'',onClick:open(p.id)};});

  const chips=[...slots].reverse().map(s=>{const sel=s.id===cur.id;return {top:s.isNew?'Next · '+SN[s.type]:SN[s.type],label:fmt(s.date),day:WD[wd(s.date)],num:String(dn(s.date)),bg:sel?T.chipSelBg:T.chipBg,fg:sel?T.chipSelFg:T.ink,sub:sel?T.chipSelFg:T.muted,border:sel?'1px solid '+T.chipSelBg:s.isNew?'1.5px dashed '+T.chipNewBorder:'1px solid '+T.line,onClick:()=>self.setState({svcId:s.id})};});
  const q=st.q.trim().toLowerCase();
  const match=p=>!q||p.name.toLowerCase().includes(q)||(p.id==='p3'&&'ella'.includes(q));
  const mrow=p=>{const on=curSet.has(p.id);const o=ownerOf(p);return {name:dispName(p),sub:p.label,initial:p.name[0],check:on?'✓':'',dotBg:on?o.solid:'transparent',dotBorder:on?o.solid:T.dotOff,checkFg:o.onSolid,rowBg:on?T.rowOn:T.rowOff,rowBorder:on?T.rowOnBorder:T.rowOffBorder,stateText:on?'Here':'Not here',stateFg:on?T.ink:T.muted,stateBg:on?o.solid:'transparent',stateOnFg:on?o.onSolid:T.muted,justify:on?'flex-end':'flex-start',trackBg:on?o.solid:T.faint,onToggle:()=>A.toggle(self,cur,p.id)};};
  const markGroups=[['Leaders',leaders,'all'],["Nelson's people",people.filter(p=>p.owner==='Nelson'&&!p.left),'Nelson'],["Ella's people",people.filter(p=>p.owner==='Ella'&&!p.left),'Ella']]
    .filter(g=>st.mf==='all'||st.mf===g[2])
    .map(([t,l])=>{const rows=l.filter(match);return {title:t,here:rows.filter(p=>curSet.has(p.id)).length+' of '+rows.length+' here',rows:rows.map(mrow),n:rows.length};}).filter(g=>g.n);
  const segOpt=(k,l,curK,set)=>({label:l,bg:curK===k?T.segOn:'transparent',fg:curK===k?T.segOnFg:T.muted,onClick:set});
  const markFilters=[['all','Everyone'],['Nelson',"Nelson's"],['Ella',"Ella's"]].map(([k,l])=>segOpt(k,l,st.mf,()=>self.setState({mf:k})));
  const canAdd=!!st.newName.trim();

  const FD=[['all','Everyone',members],['call','To call',toCall],['missing','Not seen 3+ weeks',people.filter(p=>p.flagged)],['new','New',newPeople],['regular','Coming regularly',firsts.filter(p=>p.key==='regular')],['onoff','On and off',firsts.filter(p=>p.key==='onoff')],['followup','Needs a follow-up',firsts.filter(p=>p.key==='followup')],['none','Not seen yet',people.filter(p=>p.key==='none')],['old','Old members',olds],['leaders','Leaders',leaders],['left','Stopped coming',people.filter(p=>p.left&&p.kind!=='leader')]];
  const pfd=FD.find(f=>f[0]===st.pf)||FD[0];
  const pq=st.pq.trim().toLowerCase();
  const plist=pfd[2].filter(p=>(st.po==='all'||p.owner===st.po)&&(!pq||p.name.toLowerCase().includes(pq)));
  const prows=plist.map(p=>{const o=ownerOf(p);const s=stOf(p);return {name:dispName(p),initial:p.name[0],ownerBg:o.bg,ownerFg:o.fg,solid:o.solid,onSolid:o.onSolid,ownerLabel:o.label,label:p.label,stBg:s.bg,stFg:s.fg,att:attLine(p),attShort:p.kind==='first'&&p.held!=null?p.attended+'/'+p.held:p.visits.length+'/'+svcs.length,seen:p.lastSeen?fmtShort(p.lastSeen):'—',flag:p.call,flag3:p.flagged,helper:p.helper,flagText:p.flagged?'3+ weeks':'Missed 2',onClick:open(p.id)};});
  const peopleFilters=FD.filter(f=>f[0]==='all'||f[0]==='call'||f[0]===st.pf||f[2].length).map(([k,l,arr])=>{const a=st.pf===k;const red=k==='call'||k==='missing';return {k,label:l,count:arr.length,bg:a?(red?T.callBg:T.filterOnBg):T.filterOffBg,fg:a?(red?T.callFg:T.filterOnFg):(red?T.down:T.ink),border:a?(red?T.callBg:T.filterOnBg):T.line,onClick:()=>self.setState({pf:k})};});
  const ownerFilters=[['all','Both'],['Nelson',"Nelson's"],['Ella',"Ella's"]].map(([k,l])=>segOpt(k,l,st.po,()=>self.setState({po:k})));

  let person=null;const pp=st.personId&&byId[st.personId];
  if(pp){const o=ownerOf(pp);const s=stOf(pp);const isF=pp.kind==='first'&&pp.held!=null;
    const hist=[...svcs].reverse().map((sv,i,arr)=>{const on=sets[sv.id].has(pp.id);const isFirst=pp.firstSvc&&pp.firstSvc.id===sv.id;return {label:svcName(sv),type:SN[sv.type],date:fmt(sv.date),mark:on?'Here':'Not here',note:isFirst?'First visit':'',fg:on?T.histOn:T.histOff,dot:on?o.solid:T.segEmpty,line:i===arr.length-1?'transparent':T.line};});
    person={name:dispName(pp),initial:pp.name[0],solid:o.solid,onSolid:o.onSolid,ownerLabel:pp.owner?T.own[pp.owner].label+' people':pp.role,ownerBg:o.bg,ownerFg:o.fg,label:pp.kind==='leader'?'Not a member':pp.label,stBg:s.bg,stFg:s.fg,
      attBig:isF?pp.attended+' of '+pp.held:pp.visits.length+' of '+svcs.length,attSmall:isF?'services since first visit':'services so far',
      isNew:pp.key==='new',segs:Array.from({length:8},(_,i)=>({bg:i<(pp.week||0)?T.segFill:T.segEmpty,label:String(i+1),fg:i<(pp.week||0)?T.ink:T.muted})),weekText:pp.week?'Week '+pp.week+' of 8 · ends '+fmt(addDays(pp.firstVisit,55)):'',
      first:pp.firstSvc?svcName(pp.firstSvc):'Not yet',last:pp.lastSeen?fmt(pp.lastSeen)+(pp.since===0?' · today':' · '+pp.since+(pp.since===1?' day ago':' days ago')):'Not yet',
      flag:pp.call,flagText:pp.flagged?'Not seen for '+Math.floor(pp.since/7)+' weeks. Give them a call.':'Missed the last 2 services. Give them a call.',
      history:hist,canEdit:pp.kind!=='leader',
      ownerOpts:['Nelson','Ella'].map(k=>segOpt(k,T.own[k].label+' people',pp.owner,()=>A.setPerson(self,pp.id,{owner:k}))),
      kindOpts:[['first','First-timer'],['old','Old member']].map(([k,l])=>segOpt(k,l,pp.kind,()=>A.setPerson(self,pp.id,{kind:k})))};
  }
  let report=null;const rs=st.reportId&&slots.find(s=>s.id===st.reportId);
  if(rs){const r=reportText(S,rs);report={title:SN[rs.type]+' · '+fmtLong(rs.date),text:r.text,count:r.count,wa:'https://wa.me/?text='+encodeURIComponent(r.text)};}

  const tabs=[['home','Home'],['mark','Attendance'],['people','People']].map(([k,l])=>({label:l,bg:st.tab===k?T.tabOnBg:'transparent',bar:st.tab===k?T.tabOnBar:'transparent',fg:st.tab===k?T.tabOnFg:T.tabOff,onClick:()=>go(k,k==='people'?{pf:'all',po:'all'}:{})}));

  return {scrollRef:self.scrollRef,tabs,
    showHome:st.tab==='home',showMark:st.tab==='mark',showPeople:st.tab==='people',showMarkBar:st.tab==='mark',
    todayLong:fmtLong(today),todayShort:fmt(today),next:nx,
    callCount:toCall.length,callTop,callMore:toCall.length>5,noCall:toCall.length===0,hasCall:toCall.length>0,callAll,callAv,callExtra:toCall.length>4?'+'+(toCall.length-4):'',
    ftTotal:firsts.length,ftN:firsts.filter(p=>p.owner==='Nelson').length,ftE:firsts.filter(p=>p.owner==='Ella').length,
    startShort:fmtShort(start),startLong:fmtLong(start),
    newWeek:newWk.length,lastWeek:lastWk.length,newWeekN:newWk.filter(p=>p.owner==='Nelson').length,newWeekE:newWk.filter(p=>p.owner==='Ella').length,
    newAv,newExtra:firsts.length>4?'+'+(firsts.length-4):'',
    cameBack,cbPct:cbPct+'%',cameBackW:cbPct+'%',ringBg:'conic-gradient('+T.ring+' 0 '+cbPct+'%, '+T.ringTrack+' '+cbPct+'% 100%)',
    showNew:()=>go('people',{pf:'new',po:'all',pq:''}),
    recent,lastCard,weeksB,svcBars,buckets,split,pipeline,journeys,journeyCount:newPeople.length,journeyMore:newPeople.length>5,
    totalPeople:members.length,oldCount:olds.length,
    reset:()=>A.reset(self),
    cur:{name:SN[cur.type],long:fmtLong(cur.date)+(cur.isNew?' · not taken yet':''),short:fmt(cur.date)},chips,
    newName:st.newName,onNewName:e=>self.setState({newName:e.target.value}),
    addNelson:()=>A.add(self,'Nelson',st.newName,cur),addElla:()=>A.add(self,'Ella',st.newName,cur),
    addNBg:canAdd?T.own.Nelson.solid:T.faint,addEBg:canAdd?T.own.Ella.solid:T.faint,addNFg:canAdd?T.own.Nelson.onSolid:T.muted,addEFg:canAdd?T.own.Ella.onSolid:T.muted,
    markFilters,q:st.q,onQ:e=>self.setState({q:e.target.value}),markGroups,
    curCount,curTotal:people.length,barSub,openReport:()=>self.setState({reportId:cur.id}),
    peopleSub:members.length+' people · '+firsts.length+' first-timers · '+olds.length+' old members',
    pq:st.pq,onPQ:e=>self.setState({pq:e.target.value}),ownerFilters,peopleFilters,prows,noPeople:prows.length===0,listTitle:pfd[1],listCount:prows.length,
    hasPerson:!!person,person:person||{},closePerson:()=>self.setState({personId:null}),
    hasReport:!!report,report:report||{},closeReport:()=>self.setState({reportId:null,copied:false}),
    copyReport:()=>report&&A.copy(self,report.text),copyLabel:st.copied?'Copied ✓':'Copy',
    hasToast:!!st.toast,toast:st.toast};
}


const TASKDEF=[['pray','Pray for them','Pray for','Every week, for everyone'],['audio','Send an audio message','Audio','Every week, for everyone'],['prayWith','Pray with them','Pray with','Starts 1½ months after their first visit'],['plan','Read a Bible plan together','Bible plan','Tick who is reading a plan with you']];
A.tick=function(self,k,pid,week){const S={...self.state.S};const care={...(S.care||{})};
  if(k==='plan'){const l=care.plan||[];care.plan=l.includes(pid)?l.filter(x=>x!==pid):[...l,pid];}
  else{const m={...(care[k]||{})};const l=m[week]||[];m[week]=l.includes(pid)?l.filter(x=>x!==pid):[...l,pid];care[k]=m;}
  S.care=care;A.commit(self,S);};
A.newMeeting=function(self,date){const id='sm'+Date.now();A.commit(self,{...self.state.S,meetings:[...(self.state.S.meetings||[]),{id,date,present:[]}]});self.setState({sheet:'meeting',meetingId:id});};
A.meetPatch=function(self,id,fn){A.commit(self,{...self.state.S,meetings:(self.state.S.meetings||[]).map(m=>m.id===id?fn(m):m)});};
A.delMeeting=function(self,id){A.commit(self,{...self.state.S,meetings:(self.state.S.meetings||[]).filter(m=>m.id!==id)});self.setState({sheet:null});};
A.addFull=function(self,owner,slots,svcId){const st=self.state;const name=(st.addName||'').trim();if(!name)return;
  const id='p'+Date.now();const S={...st.S,att:{...st.S.att},people:[...st.S.people,{id,name,owner,kind:st.addOld?'old':'first'}]};
  const slot=svcId==='none'?null:slots.find(s=>s.id===svcId);
  if(slot){A.withSvc(S,slot);S.att[slot.id]=[...S.att[slot.id],id];}
  A.commit(self,S);self.setState({addOpen:false,addName:'',addOld:false,addSvc:null});
  A.flash(self,name+' added to '+owner+"'s people"+(slot?' · marked at '+SN[slot.type]+' '+fmtShort(slot.date):''));};

function vals2(self,T){
  const v=vals(self,T);const st=self.state,S=st.S;
  const {svcs,today,people,sets}=compute(S,self.props.pretendToday||'2026-10-23');
  const ownerOf=p=>p.owner?T.own[p.owner]:T.lead;
  const go=(t,x)=>A.go(self,t,x);
  const care=S.care||{};const week=weekStart(today);
  const members=people.filter(p=>p.kind!=='leader'&&!p.left);
  const firsts=people.filter(p=>p.kind==='first'&&p.firstVisit);
  const readyOn=p=>p.kind==='old'||!p.firstVisit?null:addDays(p.firstVisit,45);
  const ready=p=>p.kind==='old'||(!!p.firstVisit&&today>=addDays(p.firstVisit,45));
  const wset=k=>new Set((care[k]||{})[week]||[]);
  const done={pray:wset('pray'),audio:wset('audio'),prayWith:wset('prayWith'),plan:new Set(care.plan||[])};
  const tk=st.careTask||'pray';
  const readyDates=firsts.filter(p=>!ready(p)).map(readyOn).sort();
  const tasks=TASKDEF.map(([k,label,short,hint])=>{const elig=k==='prayWith'?members.filter(ready):members;const d=elig.filter(p=>done[k].has(p.id)).length;const pct=elig.length?Math.round(d/elig.length*100):0;const sel=tk===k;
    return {k,label,short,hint,done:d,total:elig.length,frac:k==='plan'?String(d):d+'/'+elig.length,unit:k==='plan'?'reading':'done',pct:pct+'%',w:(k==='plan'?(members.length?d/members.length*100:0):pct)+'%',
      note:k==='prayWith'?(elig.length+' ready now'+(readyDates.length?' · more from '+fmtShort(readyDates[0]):'')):k==='plan'?d+' reading with you':(elig.length-d)+' still to do',
      bg:sel?T.ink:'#FFFFFF',fg:sel?'#FFFFFF':T.ink,sub:sel?'#B8B6AE':T.muted,track:sel?'#3A3936':'#ECEAE4',
      onClick:()=>self.setState({careTask:k}),onOpen:()=>go('care',{careTask:k})};});
  const curTask=tasks.find(t=>t.k===tk);
  const list=members.filter(p=>st.co==='all'||p.owner===st.co);
  const careRows=list.map(p=>{const o=ownerOf(p);const locked=tk==='prayWith'&&!ready(p);const on=done[tk].has(p.id);
    return {name:p.name,initial:p.name[0],ownerBg:o.bg,ownerFg:o.fg,sub:locked?'Ready from '+fmt(readyOn(p)):p.label,boxBg:on?T.accent:'#FFFFFF',boxBorder:on?T.accent:locked?'#ECEAE4':'#CFCCC4',check:on?'✓':'',nameFg:locked?T.muted:T.ink,cursor:locked?'default':'pointer',locked,
      onTick:locked?(()=>{}):(()=>A.tick(self,tk,p.id,week)),onOpen:()=>self.setState({personId:p.id})};}).sort((a,b)=>(a.locked?1:0)-(b.locked?1:0));
  const coFilters=[['all','Both'],['Nelson',"Nelson's"],['Ella',"Ella's"]].map(([k,l])=>({label:l,bg:st.co===k?T.segOn:'transparent',fg:st.co===k?T.segOnFg:T.muted,onClick:()=>self.setState({co:k})}));
  const lastWeekPray=((care.pray||{})[addDays(week,-7)]||[]).length;

  const pp=st.personId&&people.find(p=>p.id===st.personId);
  if(pp&&pp.kind!=='leader'){v.person.hasCare=true;v.person.care=TASKDEF.map(([k,label])=>{const locked=k==='prayWith'&&!ready(pp);const on=done[k].has(pp.id);
    const weeks=k==='plan'?0:Object.values(care[k]||{}).filter(l=>l.includes(pp.id)).length;
    return {label,sub:locked?'Ready from '+fmt(readyOn(pp)):k==='plan'?(on?'Reading together':'Not started'):(on?'Done this week':'Not yet this week')+' · '+weeks+(weeks===1?' week':' weeks')+' so far',
      boxBg:on?T.accent:'#FFFFFF',boxBorder:on?T.accent:locked?'#ECEAE4':'#CFCCC4',check:on?'✓':'',fg:locked?T.muted:T.ink,onTick:locked?(()=>{}):(()=>A.tick(self,k,pp.id,week))};});}
  else if(v.person)v.person.hasCare=false;

  let bars;
  if(st.ftMode==='service'){bars=svcs.slice(-6).map(s=>{const l=firsts.filter(p=>p.firstSvc.id===s.id);return {top:SN[s.type],sub:fmtShort(s.date),n:l.filter(p=>p.owner==='Nelson').length,e:l.filter(p=>p.owner==='Ella').length};});}
  else{const start=svcs.length?svcs[0].date:today;const ws=[];for(let w=weekStart(start);w<=week;w=addDays(w,7))ws.push(w);
    bars=ws.slice(-6).map(w=>{const l=firsts.filter(p=>weekStart(p.firstVisit)===w);return {top:w===week?'This week':'Week of',sub:fmtShort(w),n:l.filter(p=>p.owner==='Nelson').length,e:l.filter(p=>p.owner==='Ella').length};});}
  const mx=Math.max(1,...bars.map(b=>b.n+b.e));
  const ftBars=bars.map(b=>({...b,count:b.n+b.e,nH:Math.round(b.n/mx*120)+'px',eH:Math.round(b.e/mx*120)+'px'}));
  const ftModes=[['week','By week'],['service','By service']].map(([k,l])=>({label:l,bg:(st.ftMode||'week')===k?'#FFFFFF':'transparent',fg:(st.ftMode||'week')===k?T.ink:T.muted,shadow:(st.ftMode||'week')===k?'0 1px 2px rgba(0,0,0,0.12)':'none',onClick:()=>self.setState({ftMode:k})}));

  const newP=firsts.filter(p=>p.key==='new').sort((a,b)=>a.firstVisit<b.firstVisit?-1:a.firstVisit>b.firstVisit?1:b.attended-a.attended);
  const journeys2=newP.slice(0,5).map(p=>{const o=ownerOf(p);const since=svcs.filter(s=>s.date>=p.firstVisit);
    return {name:p.name,initial:p.name[0],ownerBg:o.bg,ownerFg:o.fg,ownerLabel:o.label,week:'Week '+p.week+' of 8',att:p.attended+' of '+p.held,
      dots:since.map(s=>{const on=sets[s.id].has(p.id);return {bg:on?o.solid:'transparent',border:on?o.solid:'#CFCCC4'};}),onClick:()=>self.setState({personId:p.id})};});

  const counts=svcs.map(s=>sets[s.id].size);
  const mean=l=>l.length?Math.round(l.reduce((a,b)=>a+b,0)/l.length*10)/10:0;
  const typeAvg=t=>mean(svcs.filter(s=>s.type===t).map(s=>sets[s.id].size));
  const distRaw=[1,2,3,4].map(n=>({label:n===1?'Came once':n<4?'Came '+n+' times':'Came 4+ times',count:firsts.filter(p=>n<4?p.visits.length===n:p.visits.length>=4).length}));
  const dmx=Math.max(1,...distRaw.map(d=>d.count));
  const dist=distRaw.map((d,i)=>({...d,w:(d.count/dmx*100)+'%',bg:i===0?'#CFCCC4':T.accent}));
  const lastS=svcs[svcs.length-1];
  const owners=['Nelson','Ella'].map(o=>{const l=people.filter(p=>p.owner===o);const f=l.filter(p=>p.kind==='first'&&p.firstVisit);const cb=f.filter(p=>p.visits.length>1).length;
    return {label:T.own[o].label+' people',solid:T.own[o].solid,people:l.length,firsts:f.length,cameBack:f.length?Math.round(cb/f.length*100)+'%':'—',last:lastS?l.filter(p=>sets[lastS.id].has(p.id)).length:0,avg:String(mean(svcs.map(s=>l.filter(p=>sets[s.id].has(p.id)).length)))};});
  const ended=firsts.filter(p=>p.key!=='new');
  const firstEnd=firsts.length?addDays(firsts.map(p=>p.firstVisit).sort()[0],56):null;
  const flaggedP=people.filter(p=>p.flagged);
  const stats={avg:String(mean(counts)),mgsAvg:String(typeAvg('MGS')),lcAvg:String(typeAvg('LC')),svcCount:svcs.length,since:svcs.length?fmt(svcs[0].date):'',best:counts.length?String(Math.max(...counts)):'0',
    dist,owners,hasAfter:ended.length>0,noAfter:ended.length===0,afterNote:firstEnd?'Nobody has finished their 8 weeks yet. The first group finishes on '+fmt(firstEnd)+'.':'',
    flaggedCount:flaggedP.length,flaggedNames:flaggedP.length?flaggedP.map(p=>p.name).join(', '):'Nobody. Everyone has been seen in the last 3 weeks.'};

  const next=nextSlot(svcs,today);const slotsAll=[...svcs,next];
  const cur=slotsAll.find(s=>s.id===st.svcId)||next;
  const defSvc=st.addSvc||(svcs.length&&svcs[svcs.length-1].date>=addDays(today,-3)?svcs[svcs.length-1].id:next.id);
  const addChips=[...slotsAll.slice(-4).reverse().map(s=>({top:s.isNew?'Next · '+SN[s.type]:SN[s.type],label:fmt(s.date),id:s.id})),{top:'Not yet',label:'Hasn\u2019t come',id:'none'}]
    .map(c=>{const sel=c.id===defSvc;return {...c,bg:sel?T.ink:'#FFFFFF',fg:sel?'#FFFFFF':T.ink,sub:sel?'#B8B6AE':T.muted,border:sel?'1px solid '+T.ink:'1px solid '+T.line,onClick:()=>self.setState({addSvc:c.id})};});
  const canAdd=!!(st.addName||'').trim();


  const byId={};people.forEach(p=>byId[p.id]=p);
  const dispName=p=>p.id==='p3'?'Emmanuella Lithur (Ella)':p.name;
  const H=people.filter(p=>p.helper);
  const meetings=[...(S.meetings||[])].sort((a,b)=>a.date<b.date?1:-1);
  const lastSv=svcs[svcs.length-1];
  const helperStats=h=>{const mine=people.filter(p=>p.helperId===h.id&&!p.left&&p.kind!=='leader'&&p.id!==h.id);const mt=meetings.filter(m=>m.present.includes(h.id)).length;const last4=svcs.slice(-4);const came=last4.filter(s=>sets[s.id].has(h.id)).length;const atLast=lastSv?mine.filter(p=>sets[lastSv.id].has(p.id)).length:0;
    return {mine,meet:mt+'/'+meetings.length,svc:came+'/'+last4.length,atLast:atLast+'/'+mine.length,count:mine.length};};
  const helperCards=H.map(h=>{const o=ownerOf(h);const hs=helperStats(h);return {name:h.name,initial:h.name[0],ownerBg:o.bg,ownerFg:o.fg,ownerLabel:o.label,looking:hs.count===1?'Looking after 1 person':'Looking after '+hs.count+' people',svc:hs.svc,meet:hs.meet,atLast:hs.atLast,
    avs:hs.mine.slice(0,5).map(p=>{const po=ownerOf(p);return {initial:p.name[0],bg:po.solid,fg:po.onSolid};}),more:hs.count>5?'+'+(hs.count-5):'',
    onClick:()=>self.setState({personId:h.id}),onAssign:()=>self.setState({sheet:'assign',assignFor:h.id})};});
  const meetPeople=people.filter(p=>p.id==='p3'||p.helper);
  const meetRows=meetings.map(m=>{const c=m.present.filter(id=>meetPeople.some(p=>p.id===id)).length;return {date:fmt(m.date),count:c+' of '+meetPeople.length,onClick:()=>self.setState({sheet:'meeting',meetingId:m.id})};});
  const trk=on=>({trackBg:on?T.accent:T.faint,justify:on?'flex-end':'flex-start'});
  let meeting={};const mtg=st.sheet==='meeting'&&(S.meetings||[]).find(m=>m.id===st.meetingId);
  if(mtg){meeting={date:fmtLong(mtg.date),count:mtg.present.filter(id=>meetPeople.some(p=>p.id===id)).length+' of '+meetPeople.length+' came',
    rows:meetPeople.map(p=>{const on=mtg.present.includes(p.id);return {name:dispName(p),sub:p.id==='p3'?'Shepherd':'Helper',stateText:on?'Came':'Didn\u2019t come',stateFg:on?T.ink:T.muted,...trk(on),onToggle:()=>A.meetPatch(self,mtg.id,m=>({...m,present:on?m.present.filter(x=>x!==p.id):[...m.present,p.id]}))};}),
    noPeople:meetPeople.length===0,
    onPrev:()=>A.meetPatch(self,mtg.id,m=>({...m,date:addDays(m.date,-1)})),onNext:()=>A.meetPatch(self,mtg.id,m=>({...m,date:addDays(m.date,1)})),onDelete:()=>A.delMeeting(self,mtg.id)};}
  let assign={};const af=st.sheet==='assign'&&byId[st.assignFor];
  if(af){const cand=people.filter(p=>p.kind!=='leader'&&!p.left&&!p.helper&&p.id!==af.id).sort((a,b)=>(a.kind==='first'?0:1)-(b.kind==='first'?0:1));
    assign={title:'Who is '+af.name+' looking after?',count:cand.filter(p=>p.helperId===af.id).length,
      rows:cand.map(p=>{const on=p.helperId===af.id;const other=p.helperId&&p.helperId!==af.id&&byId[p.helperId]&&byId[p.helperId].helper?byId[p.helperId]:null;const o=ownerOf(p);
        return {name:p.name,initial:p.name[0],ownerBg:o.bg,ownerFg:o.fg,sub:other?'With '+other.name+' · tap to move':o.label+' · '+p.label,boxBg:on?T.accent:'#FFFFFF',boxBorder:on?T.accent:'#CFCCC4',check:on?'✓':'',onTick:()=>A.setPerson(self,p.id,{helperId:on?null:af.id})};})};}
  const pickRows=people.filter(p=>p.kind==='old'&&!p.helper&&!p.left).map(p=>{const o=ownerOf(p);return {name:p.name,initial:p.name[0],ownerBg:o.bg,ownerFg:o.fg,sub:o.label+' · '+p.visits.length+' of '+svcs.length+' services',onClick:()=>{A.setPerson(self,p.id,{helper:true});self.setState({sheet:null});A.flash(self,p.name+' is now a helper');}};});
  if(pp&&pp.kind!=='leader'){const P=v.person;
    P.isHelper=pp.helper;P.showLooked=!pp.helper&&!pp.left;P.canBeHelper=pp.kind==='old'&&!pp.helper&&!pp.left;
    P.makeHelper=()=>{A.setPerson(self,pp.id,{helper:true});A.flash(self,pp.name+' is now a helper');};
    if(pp.helper){const hs=helperStats(pp);P.helper={looking:hs.count===1?'Looking after 1 person':'Looking after '+hs.count+' people',svc:hs.svc,meet:hs.meet,atLast:hs.atLast,none:hs.count===0,
      people:hs.mine.map(p=>{const o=ownerOf(p);return {name:p.name,initial:p.name[0],ownerBg:o.bg,ownerFg:o.fg,sub:p.label,att:p.kind==='first'&&p.held!=null?p.attended+'/'+p.held:p.visits.length+'/'+svcs.length,onClick:()=>self.setState({personId:p.id})};}),
      onAssign:()=>self.setState({sheet:'assign',assignFor:pp.id}),onRemove:()=>A.setPerson(self,pp.id,{helper:false})};}
    else P.helper={people:[]};
    const curH=pp.helperId&&byId[pp.helperId]&&byId[pp.helperId].helper?pp.helperId:null;
    P.noHelpers=H.length===0;P.hasHelpers=H.length>0;
    P.lookChips=[{id:null,label:'Nobody'},...H.filter(h=>h.id!==pp.id).map(h=>({id:h.id,label:h.name}))].map(c=>{const sel=curH===c.id;return {label:c.label,bg:sel?T.ink:'#FFFFFF',fg:sel?'#FFFFFF':T.ink,border:sel?T.ink:T.line,onClick:()=>A.setPerson(self,pp.id,{helperId:c.id})};});
    P.isLeft=!!pp.left;P.notLeft=!pp.left;P.leftText=pp.left?'Marked on '+fmt(pp.left)+'. They no longer show in attendance or care.':'';
    P.markLeft=()=>{A.setPerson(self,pp.id,{left:today,helper:false});A.flash(self,pp.name+' marked as stopped coming');};
    P.undoLeft=()=>{A.setPerson(self,pp.id,{left:null});A.flash(self,pp.name+' is back on the list');};
  }
  const stopped=people.filter(p=>p.left&&p.kind!=='leader');
  Object.assign(v,{helperCards,hasHelpers:H.length>0,noHelpers:H.length===0,helperCount:H.length,meetRows,noMeetings:meetings.length===0,
    newMeeting:()=>A.newMeeting(self,today),meeting,hasMeeting:!!mtg,assign,hasAssign:!!af,pickRows,noPick:pickRows.length===0,hasPick:st.sheet==='pick',
    openPick:()=>self.setState({sheet:'pick'}),closeSheet:()=>self.setState({sheet:null}),
    showPeopleList:st.tab==='people'&&st.pv!=='helpers',showHelpers:st.tab==='people'&&st.pv==='helpers',
    peopleViews:[['people','Everyone'],['helpers','Helpers · '+H.length]].map(([k,l])=>({label:l,bg:(st.pv||'people')===k?T.segOn:'transparent',fg:(st.pv||'people')===k?T.segOnFg:T.muted,onClick:()=>self.setState({pv:k})})),
    stoppedCount:stopped.length,stoppedNames:stopped.length?stopped.map(p=>p.name).join(', '):'Nobody so far.',
    meetCount:meetings.length});
  Object.assign(v,{
    tabs:[['home','Home'],['mark','Attendance'],['care','Care'],['people','People'],['stats','Stats']].map(([k,l])=>({label:l,bar:st.tab===k?T.tabOnBar:'transparent',fg:st.tab===k?T.tabOnFg:T.tabOff,onClick:()=>go(k,k==='people'?{pf:'all',po:'all'}:{})})),
    showCare:st.tab==='care',showStats:st.tab==='stats',
    tasks,curTask:curTask,careRows,coFilters,careWeek:'This week · '+fmtShort(week)+' – '+fmtShort(addDays(week,6)),lastWeekPray,
    ftBars,ftModes,journeys2,stats,flaggedCount:flaggedP.length,showMissing:()=>go('people',{pf:'missing',po:'all',pq:''}),
    peopleFilters:v.peopleFilters.filter(f=>f.k!=='call'),
    addOpen:!!st.addOpen,addName:st.addName||'',onAddName:e=>self.setState({addName:e.target.value}),addChips,
    addOldBg:st.addOld?T.ink:'#FFFFFF',addOldBorder:st.addOld?T.ink:'#CFCCC4',addOldCheck:st.addOld?'✓':'',toggleOld:()=>self.setState({addOld:!st.addOld}),
    addAsNelson:()=>A.addFull(self,'Nelson',slotsAll,defSvc),addAsElla:()=>A.addFull(self,'Ella',slotsAll,defSvc),
    addNBg:canAdd?T.own.Nelson.solid:T.faint,addEBg:canAdd?T.own.Ella.solid:T.faint,addNFg:canAdd?T.own.Nelson.onSolid:T.muted,addEFg:canAdd?T.own.Ella.onSolid:T.muted,
    openAdd:()=>self.setState({addOpen:true,addName:'',addSvc:null,addOld:false}),
    openAddHere:()=>self.setState({addOpen:true,addName:'',addSvc:cur.id,addOld:false}),
    closeAdd:()=>self.setState({addOpen:false})
  });
  return v;
}

window.LoveCore={initialState,mount:A.mount,vals,vals2};
})();
