import React from 'react';
import { sx } from '../lib/sx';
import './AdminPortal.css';

const ICE = '#B3E0F2', STEEL = '#5D91A6', MOSS_LT = '#7FB27E',
      CLAY = '#C2564B', TXT = '#E4EEF2', MUTE = '#8AA5AE', DIM = '#56707B';

const CHIP = {
  none:     {label:'Not submitted', c:DIM,     fill:'transparent', border:DIM},
  pending:  {label:'Pending',       c:STEEL,   fill:'transparent', border:STEEL},
  accepted: {label:'Accepted',      c:MOSS_LT, fill:MOSS_LT,       border:MOSS_LT},
  rejected: {label:'Rejected',      c:CLAY,    fill:CLAY,          border:CLAY},
  scored:   {label:'Scored',        c:ICE,     fill:ICE,           border:ICE}
};

const SQUADS = [
  {name:'GHOST_IN_SHELL', lead:'bashful',   members:4, track:'T4 · Realtime',  w:['scored','scored','scored'],     score:94, judge:'a_menon', invite:'GH0ST-4X', reg:'19 Jul 2026', prs:14},
  {name:'SEGFAULT_SALLY', lead:'heapdump',  members:3, track:'T2 · Data',      w:['scored','scored','accepted'],   score:91, judge:'v_rao',   invite:'SEGF-7K2', reg:'18 Jul 2026', prs:11},
  {name:'NULL_POINTER',   lead:'ax0lotl',   members:4, track:'T5 · UI Kit',    w:['scored','accepted','pending'],  score:87, judge:'v_rao',   invite:'NULL-9QX', reg:'18 Jul 2026', prs:9},
  {name:'DEEP_THOUGHT',   lead:'fortytwo',  members:5, track:'T1 · CMS',       w:['scored','accepted','accepted'], score:82, judge:'',        invite:'DEEP-42A', reg:'20 Jul 2026', prs:7},
  {name:'KERNEL_PANIC',   lead:'siglost',   members:4, track:'T3 · Commerce',  w:['scored','accepted','none'],     score:78, judge:'k_iyer',  invite:'KRNL-1PZ', reg:'21 Jul 2026', prs:6},
  {name:'RUBBER_DUCKS',   lead:'quackd',    members:5, track:'T1 · CMS',       w:['scored','rejected','pending'],  score:64, judge:'k_iyer',  invite:'DUCK-3RR', reg:'21 Jul 2026', prs:5},
  {name:'TABS_OVER_SPACES',lead:'monospace',members:2, track:'T5 · UI Kit',    w:['scored','pending','none'],      score:55, judge:'',        invite:'TABS-8W1', reg:'22 Jul 2026', prs:3},
  {name:'FOUR_OH_FOUR',   lead:'notfound',  members:3, track:'T2 · Data',      w:['rejected','none','none'],       score:31, judge:'a_menon', invite:'F0UR-0X4', reg:'23 Jul 2026', prs:1}
];

const EMAIL = n => n.replace(/[^a-z0-9_]/gi,'').toLowerCase() + '@rvce.edu.in';

// Animation + viewport state lives at module scope so it survives instance churn.
const ANIM = {t:0, on:false, started:false, host:null, vw:0, bound:false};

function bumpHost(){
  const h = ANIM.host;
  if (h && h.setState) h.setState(st => ({tick:(st.tick || 0) + 1}));
}

function startAnim(){
  if (ANIM.started || typeof window === 'undefined') return;
  ANIM.started = true;
  ANIM.vw = window.innerWidth;
  if (!ANIM.bound){
    ANIM.bound = true;
    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { ANIM.vw = window.innerWidth; bumpHost(); }, 80);
    });
  }
  setTimeout(() => { ANIM.on = true; bumpHost(); }, 60);
  const start = Date.now(), dur = 1200;
  const step = () => {
    const p = Math.min(1, (Date.now() - start) / dur);
    ANIM.t = 1 - Math.pow(1 - p, 3);
    bumpHost();
    if (p < 1) setTimeout(step, 30);
  };
  setTimeout(step, 80);
  setTimeout(() => { if (ANIM.t < 1 || !ANIM.on){ ANIM.t = 1; ANIM.on = true; bumpHost(); } }, 2600);
}
const MONO = "font-family:'JetBrains Mono',monospace";
const PANEL = 'background:#112026;border:1px solid rgba(179,224,242,.10);border-radius:3px';

export default class AdminPortal extends React.Component {

  state = {
    section:'overview', stateOverride:null, expanded:'GHOST_IN_SHELL',
    modal:null, confirm:null, toast:null, toastTitle:'', banner:true,
    search:'', bodyLen:0, pinned:true, tick:0,
    picked:{'NULL_POINTER':true,'DEEP_THOUGHT':true,'TABS_OVER_SPACES':true},
    locks:{1:false,2:false,3:true}
  };

  componentDidMount(){ ANIM.host = this; startAnim(); }

  componentWillUnmount(){ clearTimeout(this._t); if (ANIM.host === this) ANIM.host = null; }

  toast(title, msg){
    clearTimeout(this._t);
    this.setState({toast:msg, toastTitle:title, modal:null, confirm:null});
    this._t = setTimeout(() => this.setState({toast:null}), 4600);
  }

  chip(k){
    const m = CHIP[k];
    return {
      label:m.label,
      dot:'width:7px;height:7px;flex:none;border:1px solid ' + m.border + ';background:' + m.fill,
      text:'font-size:12px;color:' + m.c
    };
  }

  renderVals(){
    ANIM.host = this;
    startAnim();
    const s = this.state;
    const vw = ANIM.vw || (typeof window !== 'undefined' ? window.innerWidth : 1440);
    const phone = vw < 760, narrow = vw < 1140;
    const tableState = s.stateOverride || this.props.tableState || 'ready';
    const day = Math.max(1, Math.min(21, this.props.eventDay ?? 9));
    const t = ANIM.t, on = ANIM.on;
    const count = n => String(Math.round(n * t));

    const judgeCols = phone ? '1fr 62px 62px' : narrow ? '190px 96px 96px 1fr' : '190px 250px 96px 96px 1fr';
    const L = {
      headTop:'max-width:1580px;margin:0 auto;display:flex;align-items:center;gap:' + (phone ? '12px' : '26px') +
        ';padding:' + (phone ? '12px 16px 0' : '16px 32px 0'),
      wordmark:"font-family:'Clash Grotesk',sans-serif;font-weight:600;letter-spacing:.14em;white-space:nowrap;color:" + ICE +
        ';line-height:1;font-size:' + (phone ? '15px' : '19px'),
      dayChip:'display:flex;align-items:center;gap:7px;' + MONO,
      hidePhone: phone ? 'display:none' : 'display:flex;align-items:center',
      hideNarrow: narrow ? 'display:none' : 'display:flex;align-items:center',
      navRow:'max-width:1580px;margin:8px auto 0;padding:0 ' + (phone ? '10px' : '32px') +
        ';display:flex;align-items:center;gap:2px;overflow-x:auto;-webkit-overflow-scrolling:touch',
      bannerWrap:'position:relative;z-index:5;max-width:1580px;margin:0 auto;padding:' + (phone ? '16px 16px 0' : '20px 32px 0'),
      bannerBox:'border:1px solid rgba(194,86,75,.35);background:linear-gradient(90deg,rgba(194,86,75,.14),rgba(194,86,75,.03));padding:14px 18px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;border-radius:2px;animation:rise .4s ease-out both',
      main:'position:relative;z-index:5;max-width:1580px;margin:0 auto;padding:' + (phone ? '22px 16px 80px' : '28px 32px 100px'),
      hero: narrow
        ? 'display:flex;flex-direction:column;align-items:flex-start;gap:22px;margin-bottom:30px'
        : 'display:grid;grid-template-columns:1fr auto;gap:40px;align-items:end;margin-bottom:34px',
      heroTitle:"font-family:'Clash Grotesk',sans-serif;font-weight:500;letter-spacing:-.01em;line-height:1.12;margin:14px 0 0;color:" + TXT +
        ';max-width:620px;text-wrap:pretty;animation:rise .5s ease-out .08s both;font-size:' + (phone ? '28px' : narrow ? '36px' : '44px'),
      statStrip:'border-top:1px solid rgba(179,224,242,.12);border-bottom:1px solid rgba(179,224,242,.12);display:grid;grid-template-columns:' +
        (phone ? 'repeat(2,1fr)' : narrow ? 'repeat(3,1fr)' : 'repeat(5,1fr)'),
      panel:PANEL + ';padding:' + (phone ? '20px 18px 16px' : '24px 26px 20px'),
      panelFlex:PANEL + ';display:flex;flex-direction:column;padding:' + (phone ? '20px 18px 16px' : '24px 26px 20px'),
      panelTimeline:PANEL + ';margin-top:' + (phone ? '26px' : '34px') + ';position:relative;overflow:hidden;animation:rise .5s ease-out .3s both;padding:' +
        (phone ? '20px 18px 16px' : '24px 26px 20px'),
      timelineGrid:'position:relative;display:grid;gap:' + (phone ? '20px' : '18px') + ';grid-template-columns:' + (phone ? '1fr' : 'repeat(3,1fr)'),
      overviewCols:'display:grid;gap:20px;margin-top:20px;grid-template-columns:' + (narrow ? '1fr' : '1.35fr 1fr'),
      sectionHead:'display:flex;align-items:' + (phone ? 'flex-start' : 'flex-end') + ';justify-content:space-between;gap:16px;margin-bottom:22px;flex-wrap:wrap',
      h2:"font-family:'Clash Grotesk',sans-serif;font-weight:500;margin:10px 0 0;color:" + TXT + ';font-size:' + (phone ? '24px' : '30px'),
      filterBar:'padding:' + (phone ? '14px 16px' : '18px 20px') + ';border-bottom:1px solid rgba(179,224,242,.08);display:' +
        (phone ? 'grid;grid-template-columns:1fr 1fr;gap:12px' : 'flex;flex-wrap:wrap;gap:12px;align-items:flex-end'),
      searchCell: phone ? 'grid-column:1/-1' : 'flex:1;min-width:250px',
      filterCell: phone ? '' : 'width:158px',
      rowsCell: phone ? '' : 'width:88px',
      drawer:'background:#0B1519;border-bottom:1px solid rgba(179,224,242,.08);padding:24px 26px;display:grid;gap:' +
        (phone ? '24px' : '34px') + ';animation:rise .3s ease-out both;grid-template-columns:' +
        (phone ? '1fr' : narrow ? '1fr 1fr' : '1.05fr .9fr 1.25fr'),
      pager:'padding:15px 20px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;border-top:1px solid rgba(179,224,242,.08)',
      annCols:'display:grid;gap:20px;align-items:start;grid-template-columns:' + (narrow ? '1fr' : '1fr 1fr'),
      composePad:'position:relative;padding:' + (phone ? '20px 18px' : '26px'),
      audienceRow:'display:grid;gap:18px;align-items:end;margin-top:20px;grid-template-columns:' + (phone ? '1fr' : '1fr auto'),
      judgeHead:'display:' + (phone ? 'none' : 'grid') + ';grid-template-columns:' + judgeCols + ';padding:0 22px;border-bottom:1px solid rgba(179,224,242,.08)',
      judgeEmailHead: narrow ? 'display:none' : MONO + ';font-size:10px;letter-spacing:.16em;color:' + DIM + ';padding:14px 8px',
      judgeProgHead: MONO + ';font-size:10px;letter-spacing:.16em;color:' + DIM + ';padding:14px 8px',
      chalGrid:'display:grid;gap:20px;grid-template-columns:' + (phone ? '1fr' : narrow ? 'repeat(2,1fr)' : 'repeat(3,1fr)'),
      overlay:'position:fixed;inset:0;z-index:80;background:rgba(8,13,12,.82);backdrop-filter:blur(6px);display:grid;place-items:' +
        (phone ? 'end center' : 'center') + ';padding:' + (phone ? '0' : '24px') + ';animation:fade .2s ease-out both',
      modalPad:'position:relative;padding:' + (phone ? '22px 18px 26px' : '28px'),
      modalTitle:"font-family:'Clash Grotesk',sans-serif;font-weight:500;color:" + TXT + ';line-height:1.25;font-size:' + (phone ? '21px' : '26px'),
      modalTitleSm:"font-family:'Clash Grotesk',sans-serif;font-weight:500;color:" + TXT + ';line-height:1.3;font-size:' + (phone ? '20px' : '24px'),
      pickList:'border:1px solid rgba(179,224,242,.10);background:#0B1519;overflow-y:auto;border-radius:2px;max-height:' + (phone ? '200px' : '236px'),
      toast:'position:fixed;z-index:90;display:flex;align-items:center;gap:14px;border:1px solid rgba(127,178,126,.4);border-left:3px solid ' + MOSS_LT +
        ';background:#112026;padding:15px 18px;border-radius:2px;box-shadow:0 12px 40px rgba(0,0,0,.55);overflow:hidden;animation:rise .3s ease-out both;' +
        (phone ? 'left:12px;right:12px;bottom:12px' : 'right:28px;bottom:28px;max-width:400px')
    };
    const modalShell = (w, extra) => 'width:' + (phone ? '100%' : w) + ';max-width:100%;background:#112026;position:relative;overflow:hidden;border-radius:' +
      (phone ? '3px 3px 0 0' : '3px') + ';animation:' + (phone ? 'rise .3s' : 'pop .28s') + ' ease-out both;border:1px solid ' + extra;
    L.modalWide = modalShell('520px', 'rgba(179,224,242,.2)');
    L.modalAssign = modalShell('640px', 'rgba(179,224,242,.2)');

    const rows = SQUADS.map((q, idx) => {
      const open = s.expanded === q.name;
      const roster = [{role:'LEAD', callsign:q.lead, email:EMAIL(q.lead)}]
        .concat(['pixelmoth','nulldiv','tracelog','kernelkid'].slice(0, q.members-1)
          .map(c => ({role:'MEMBER', callsign:c, email:EMAIL(c)})))
        .map((m, i) => Object.assign(m, {
          roleStyle: MONO + ';font-size:9px;letter-spacing:.12em;width:52px;flex:none;color:' + (m.role === 'LEAD' ? ICE : DIM),
          rowStyle:'display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid rgba(179,224,242,.06);animation:rise .3s ease-out ' + (i*0.05) + 's both'
        }));
      return {
        name:q.name, lead:q.lead, members:q.members, track:q.track, score:q.score,
        judge:q.judge || 'unassigned',
        judgeColor:q.judge ? TXT : DIM,
        w1:this.chip(q.w[0]), w2:this.chip(q.w[1]), w3:this.chip(q.w[2]),
        open, invite:q.invite, registered:q.reg, prs:q.prs, roster,
        meterStyle:'position:absolute;inset:0 auto 0 0;background:' + STEEL + ';transition:width .9s cubic-bezier(.22,1,.36,1) ' +
          (0.15 + idx*0.05) + 's;width:' + (on ? q.score + '%' : '0%'),
        links:q.w.map((st,i) => ({
          week:'WEEK ' + (i+1),
          repo: st === 'none' ? 'no repo' : 'github.com/' + q.lead + '/cf2-w' + (i+1),
          demo: st === 'none' ? 'no demo' : q.name.toLowerCase().replace(/_/g,'-') + '-w' + (i+1) + '.vercel.app',
          linkStyle: MONO + ';font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:' + (st === 'none' ? DIM : ICE)
        })),
        wrapStyle:'animation:rise .4s ease-out ' + (idx*0.045) + 's both;transition:border-color .3s;border-left:2px solid ' +
          (open ? ICE : 'transparent') + (open ? ';background:rgba(93,145,166,.06)' : ''),
        caretStyle:'background:transparent;border:none;cursor:pointer;font-size:16px;line-height:1;padding:6px 4px;transition:transform .3s cubic-bezier(.22,1,.36,1),color .25s;color:' +
          (open ? ICE : DIM) + ';transform:rotate(' + (open ? '90' : '0') + 'deg)',
        toggle: () => this.setState({expanded: open ? null : q.name}),
        copy: () => this.toast('Invite code copied', q.invite + ' is on your clipboard.'),
        dq: () => this.setState({modal:'confirm', confirm:{
          kicker:'DESTRUCTIVE', color:CLAY, title:'Disqualify ' + q.name + '?',
          body:'All three submissions and ' + q.score + ' rubric points are voided. The squad keeps read access but drops off the leaderboard. This cannot be undone from the portal.',
          cta:'Disqualify squad', kind:'danger'
        }})
      };
    });

    const cols = ['Squad','Lead','Mem','Track','Week 1','Week 2','Week 3','Total','Judge','Actions'];
    const trackColors = [ICE, '#8CBCD1', STEEL, '#41707F', '#5C8F5B'];

    const tracks = [
      {code:'T1', name:'CMS Revival', count:38, pct:'27%'},
      {code:'T2', name:'Data Pipeline', count:31, pct:'22%'},
      {code:'T3', name:'Commerce Rebuild', count:26, pct:'18%'},
      {code:'T4', name:'Realtime Rewrite', count:22, pct:'15%'},
      {code:'T5', name:'UI Kit Port', count:25, pct:'18%'}
    ].map((tr,i) => Object.assign(tr, {
      color: trackColors[i],
      barStyle:'background:' + trackColors[i] + ';opacity:.85;transition:flex 1s cubic-bezier(.22,1,.36,1) ' + (i*0.08) + 's;flex:' + (on ? tr.count : 0.001),
      rowStyle:'display:grid;grid-template-columns:12px 34px 1fr 52px 46px;align-items:center;gap:12px;padding:11px 0;border-top:1px solid rgba(179,224,242,.07);transition:background .2s;animation:rise .4s ease-out ' + (0.1 + i*0.06) + 's both'
    }));

    const weeks = [
      {label:'WEEK 1', count:142, pct:100, color:ICE},
      {label:'WEEK 2', count:131, pct:92, color:STEEL},
      {label:'WEEK 3', count:118, pct:83, color:MOSS_LT}
    ].map((w,i) => Object.assign(w, {
      barStyle:'width:100%;max-width:64px;background:linear-gradient(180deg,' + w.color + ',rgba(17,32,38,.15));transition:height 1s cubic-bezier(.22,1,.36,1) ' +
        (0.15 + i*0.12) + 's;height:' + (on ? w.pct + 'px' : '0px')
    }));

    const timeline = [
      {title:'Project Alpha', meta:'20–26 JUL', start:1},
      {title:'Project Beta', meta:'27 JUL–02 AUG', start:8},
      {title:'Project Gamma & Deployment', meta:'03–09 AUG', start:15}
    ].map((tl, wi) => {
      const days = [];
      for (let i = 0; i < 7; i++){
        const n = tl.start + i, past = n < day, now = n === day;
        days.push({style:'flex:1;border-radius:1px;transform-origin:bottom;animation:tickIn .5s cubic-bezier(.22,1,.36,1) ' +
          (0.25 + (wi*7 + i)*0.03) + 's both' + (now ? ',dayPulse 2.4s ease-in-out infinite 1s' : '') +
          ';height:' + (now ? '34px' : past ? '20px' : '12px') +
          ';background:' + (now ? ICE : past ? STEEL : 'rgba(179,224,242,.14)')});
      }
      return Object.assign(tl, {
        days,
        labelColor:(day >= tl.start && day < tl.start + 7) ? ICE : (day >= tl.start + 7 ? MUTE : DIM)
      });
    });

    const c = s.confirm || {};
    const isDanger = c.kind === 'danger';
    const pinOn = s.pinned;
    const swTrack = o => 'display:flex;align-items:center;gap:9px;padding:6px 12px 6px 7px;background:transparent;cursor:pointer;transition:all .3s;border-radius:2px;border:1px solid ' + (o ? 'rgba(179,224,242,.45)' : 'rgba(179,224,242,.14)');
    const swKnob = o => 'width:20px;height:12px;display:block;transition:all .3s cubic-bezier(.22,1,.36,1);transform:translateX(' + (o ? '0' : '-1px') + ');border:1px solid ' + (o ? ICE : 'rgba(179,224,242,.3)') + ';background:' + (o ? ICE : 'transparent') + ';box-shadow:' + (o ? '0 0 12px rgba(179,224,242,.5)' : 'none');
    const swLabel = o => MONO + ';font-size:10px;letter-spacing:.14em;transition:color .3s;color:' + (o ? ICE : DIM);

    return {
      L, isPhone:phone,
      eventDay:String(day).padStart(2,'0'),
      banner:(this.props.showErrorBanner ?? true) && s.banner,
      dismissBanner: () => this.setState({banner:false}),
      retry: () => { this.setState({stateOverride:'loading', modal:null}); setTimeout(() => this.setState({stateOverride:'ready'}), 1500); },

      nav:[['overview','Overview'],['squads','Squads'],['announcements','Announcements'],
           ['judges','Judges'],['challenges','Challenges'],['exports','Exports']].map(([id,label]) => ({
        label,
        go: () => this.setState({section:id}),
        style:'background:transparent;border:none;white-space:nowrap;border-bottom:2px solid ' + (s.section===id ? ICE : 'transparent') +
          ';color:' + (s.section===id ? ICE : DIM) + ';padding:10px ' + (phone ? '12px' : '16px') +
          " 12px;font-family:'Satoshi',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:color .25s,border-color .25s"
      })),

      isOverview:s.section==='overview', isSquads:s.section==='squads', isAnn:s.section==='announcements',
      isJudges:s.section==='judges', isChal:s.section==='challenges', isExports:s.section==='exports',
      goSquads: () => this.setState({section:'squads'}),
      goAnn: () => this.setState({section:'announcements'}),

      stats:[
        {label:'Total squads', value:count(142), unit:'', sub:'+18 this week', color:TXT},
        {label:'Total hackers', value:count(561), unit:'', sub:'142 leads / 419 members', color:TXT},
        {label:'Submissions this week', value:count(118), unit:'', sub:'118 of 142 squads', color:ICE},
        {label:'Scoring progress', value:count(68), unit:'%', sub:'96 of 142 squads scored', color:MOSS_LT},
        {label:'Registration closes', value:count(3), unit:'days', sub:'11 Aug 2026 · 23:59 IST', color:STEEL}
      ].map((st,i) => Object.assign(st, {
        cellStyle:'transition:background .3s;animation:rise .45s ease-out ' + (0.1 + i*0.07) + 's both;padding:' +
          (phone ? '18px 16px' : '22px 24px 20px') +
          (phone
            ? (i % 2 ? ';border-left:1px solid rgba(179,224,242,.10)' : '') + (i > 1 ? ';border-top:1px solid rgba(179,224,242,.10)' : '')
            : (i ? ';border-left:1px solid rgba(179,224,242,.10)' : '')),
        numStyle:"font-family:'Clash Grotesk',sans-serif;font-weight:500;line-height:.85;font-variant-numeric:tabular-nums;color:" + st.color +
          ';font-size:' + (phone ? '32px' : '42px')
      })),
      prOpened:count(318), prMerged:count(204),
      timeline, tracks, weeks,

      cols:cols.map((label,i) => ({
        label,
        style: MONO + ';font-size:10px;letter-spacing:.14em;padding:14px 8px;color:' + (label==='Total' ? STEEL : DIM) +
          (i === cols.length-1 ? ';text-align:right' : '')
      })),

      search:s.search,
      onSearch: e => this.setState({search:e.target.value}),
      isReady:tableState==='ready', isLoading:tableState==='loading',
      isEmpty:tableState==='empty', isError:tableState==='error',
      resetFilters: () => this.setState({stateOverride:'ready', search:''}),
      skeleton:[0,1,2,3,4,5].map(i => ({op:String(1 - i*0.13)})),
      rows,
      pages:[1,2,3,4,5,6].map(n => ({
        n:String(n),
        style:'padding:8px 12px;font-size:12px;background:' + (n===1 ? ICE : 'transparent') +
          ';border:1px solid ' + (n===1 ? ICE : 'rgba(179,224,242,.10)') + ';color:' + (n===1 ? '#080D0C' : DIM) +
          ';cursor:pointer;transition:all .25s;border-radius:2px'
      })),
      exportToast: () => this.toast('Export queued', 'CSV will download in a moment · 142 rows.'),

      bodyLen:s.bodyLen,
      countColor: s.bodyLen > 460 ? CLAY : DIM,
      countBar:'height:100%;transition:width .3s ease-out;width:' + Math.min(100, s.bodyLen/5) + '%;background:' + (s.bodyLen > 460 ? CLAY : STEEL),
      onBody: e => this.setState({bodyLen:e.target.value.length}),
      togglePin: () => this.setState({pinned:!pinOn}),
      pinText: pinOn ? 'PINNED' : 'OFF',
      pinTrack:swTrack(pinOn), pinKnob:swKnob(pinOn), pinLabel:swLabel(pinOn),
      openBroadcast: () => this.setState({modal:'broadcast'}),
      confirmBroadcast: () => this.toast('Broadcast sent', 'Delivered to 561 hackers · pinned to top.'),
      openDelete: () => this.setState({modal:'confirm', confirm:{
        kicker:'DESTRUCTIVE', color:CLAY, title:'Delete this announcement?',
        body:'It disappears from every hacker dashboard immediately. Delivery records are kept for the audit log.',
        cta:'Delete announcement', kind:'danger'
      }}),
      announcements:[
        {title:'Week 3 unlocks at 09:00 IST', excerpt:'Project Gamma & Deployment goes live Monday. Deploy URLs must resolve over HTTPS before the Wednesday cutoff.', audience:'ALL HACKERS', time:'08 AUG · 09:02', sender:'v_kulkarni', pinned:true},
        {title:'Canvas repo PR freeze in 48h', excerpt:'Merged-PR points lock on 10 Aug. Anything still in review after that counts for nothing.', audience:'ALL HACKERS', time:'07 AUG · 18:40', sender:'v_kulkarni', pinned:false},
        {title:'Leads: confirm your roster', excerpt:'Any member not accepted by Friday is dropped from the squad and cannot rejoin with the same invite code.', audience:'SQUAD LEADS', time:'05 AUG · 11:15', sender:'r_prasad', pinned:false},
        {title:'T5 problem statement amended', excerpt:'Clause 4b on component parity was ambiguous. Revised text is in the handbook; scoring follows the new version.', audience:'TRACK T5', time:'03 AUG · 20:27', sender:'r_prasad', pinned:false}
      ].map((a,i) => Object.assign(a, {
        wrapStyle:'padding:' + (phone ? '16px 18px' : '18px 24px') + ';border-bottom:1px solid rgba(179,224,242,.06);transition:background .25s;animation:rise .4s ease-out ' +
          (0.12 + i*0.07) + 's both;border-left:2px solid ' + (a.pinned ? ICE : 'transparent')
      })),

      judges:[
        {callsign:'a_menon', email:'a.menon@rvce.edu.in', assigned:22, scored:22},
        {callsign:'v_rao', email:'v.rao@rvce.edu.in', assigned:24, scored:21},
        {callsign:'b_nair', email:'b.nair@rvce.edu.in', assigned:20, scored:13},
        {callsign:'k_iyer', email:'k.iyer@rvce.edu.in', assigned:24, scored:9},
        {callsign:'s_deshpande', email:'s.deshpande@rvce.edu.in', assigned:18, scored:4}
      ].map((j, ji) => {
        const ratio = j.scored / j.assigned;
        const col = ratio >= .85 ? MOSS_LT : ratio >= .5 ? ICE : STEEL;
        const filled = Math.round(ratio * 14), ticks = [];
        for (let i = 0; i < 14; i++){
          ticks.push({style:'flex:1;transform-origin:center;animation:tickIn .45s cubic-bezier(.22,1,.36,1) ' + (0.15 + ji*0.06 + i*0.025) +
            's both;height:' + (i < filled ? '14px' : '6px') + ';background:' + (i < filled ? col : 'rgba(179,224,242,.12)')});
        }
        return Object.assign(j, {
          ticks, pct:Math.round(ratio*100) + '%', pctColor:col,
          initials:j.callsign.slice(0,1).toUpperCase() + j.callsign.split('_')[1].slice(0,1).toUpperCase(),
          avatar:'width:26px;height:26px;flex:none;display:grid;place-items:center;font-size:10px;font-weight:700;transition:transform .3s;color:' + col + ';border:1px solid ' + col + '55',
          rowStyle:'display:grid;align-items:center;padding:0 ' + (phone ? '16px' : '22px') +
            ';border-bottom:1px solid rgba(179,224,242,.06);transition:background .25s;animation:rise .4s ease-out ' + (0.1 + ji*0.07) +
            's both;grid-template-columns:' + judgeCols,
          emailStyle: (phone || narrow) ? 'display:none' : MONO + ';font-size:11px;color:' + DIM + ';padding:16px 8px',
          progStyle:'display:flex;align-items:center;gap:14px;padding:' + (phone ? '0 8px 16px' : '16px 8px') + (phone ? ';grid-column:1/-1' : '')
        });
      }),
      openAssign: () => this.setState({modal:'assign'}),
      openAuto: () => this.setState({modal:'confirm', confirm:{
        kicker:'BULK REASSIGNMENT', color:STEEL, title:'Redistribute 142 squads across 5 judges?',
        body:'Existing assignments are discarded and rebuilt at 28–29 squads per judge. Drafts stay attached to their submissions; 34 finalised scores are unaffected.',
        cta:'Auto-distribute', kind:'safe'
      }}),
      pickList:SQUADS.map(q => {
        const sel = !!s.picked[q.name];
        return {
          name:q.name, track:q.track, mark: sel ? '✓' : '',
          box:'width:16px;height:16px;flex:none;display:grid;place-items:center;font-size:10px;color:#080D0C;transition:all .2s;border:1px solid ' +
            (sel ? ICE : 'rgba(179,224,242,.25)') + ';background:' + (sel ? ICE : 'transparent'),
          toggle: () => this.setState(st => ({picked:Object.assign({}, st.picked, {[q.name]: !st.picked[q.name]})}))
        };
      }),
      pickedCount:String(Object.keys(s.picked).filter(k => s.picked[k]).length),
      confirmAssign: () => this.toast('Assignment saved', Object.keys(s.picked).filter(k => s.picked[k]).length + ' squads assigned to v_rao.'),

      challenges:[
        {week:1, title:'Project Alpha', points:100, opens:'20 Jul · 09:00', closes:'26 Jul · 23:59', subs:142, pct:100},
        {week:2, title:'Project Beta', points:100, opens:'27 Jul · 09:00', closes:'02 Aug · 23:59', subs:131, pct:92},
        {week:3, title:'Project Gamma & Deployment', points:100, opens:'03 Aug · 09:00', closes:'09 Aug · 23:59', subs:118, pct:83}
      ].map((w,i) => {
        const locked = !!s.locks[w.week];
        return {
          week:String(w.week), title:w.title, points:String(w.points),
          opens:w.opens, closes:w.closes, subs:String(w.subs),
          titleColor: locked ? MUTE : ICE,
          barStyle:'position:absolute;inset:0 auto 0 0;transition:width 1s cubic-bezier(.22,1,.36,1) ' + (0.2 + i*0.1) +
            's,background .3s;width:' + (on ? w.pct + '%' : '0%') + ';background:' + (locked ? STEEL : MOSS_LT),
          cardStyle:'position:relative;overflow:hidden;border-radius:3px;background:#112026;transition:transform .3s cubic-bezier(.22,1,.36,1),border-color .3s;animation:rise .45s ease-out ' +
            (0.08 + i*0.09) + 's both;border:1px solid ' + (locked ? 'rgba(179,224,242,.08)' : 'rgba(179,224,242,.22)'),
          washStyle:'position:absolute;inset:0;pointer-events:none;transition:opacity .3s;background:' +
            (locked ? 'none' : 'linear-gradient(155deg,rgba(93,145,166,.18),transparent 55%)'),
          lockText: locked ? 'LOCKED' : 'UNLOCKED',
          lockTrack:swTrack(!locked), lockKnob:swKnob(!locked), lockLabel:swLabel(!locked),
          toggleLock: () => this.setState(st => ({locks:Object.assign({}, st.locks, {[w.week]: !st.locks[w.week]})}))
        };
      }),

      exports:[
        {name:'Users', desc:'Profiles, callsigns, emails, roles, squad membership', rows:'561', last:'08 Aug 2026 · 11:40'},
        {name:'Submissions', desc:'Repo and demo links, status, timestamps, all three weeks', rows:'391', last:'08 Aug 2026 · 11:41'},
        {name:'Scores', desc:'Per-criterion rubric values, totals, judge comments', rows:'288', last:'07 Aug 2026 · 22:05'},
        {name:'Leaderboard', desc:'Ranked totals including merged-PR points from the canvas repo', rows:'142', last:'never exported'}
      ].map((e,i) => Object.assign(e, {
        lastColor: e.last === 'never exported' ? DIM : TXT,
        rowStyle:'display:grid;align-items:center;gap:' + (phone ? '12px' : '18px') + ';padding:' + (phone ? '18px 16px' : '22px 24px') +
          ';border-bottom:1px solid rgba(179,224,242,.06);transition:background .25s;animation:rise .4s ease-out ' + (0.1 + i*0.07) +
          's both;grid-template-columns:' + (phone ? '1fr auto' : narrow ? '40px 1fr 100px 150px' : '40px 1fr 120px 230px 170px'),
        iconStyle: phone ? 'display:none' : 'width:32px;height:32px;border:1px solid rgba(93,145,166,.4);display:grid;place-items:center;' + MONO + ';font-size:9px;color:' + STEEL,
        lastStyle: (phone || narrow) ? 'display:none' : MONO + ';font-size:11px;color:' + DIM
      })),

      modalBroadcast:s.modal==='broadcast', modalAssign:s.modal==='assign', modalConfirm:s.modal==='confirm',
      confirmKicker:c.kicker || '', confirmTitle:c.title || '', confirmBody:c.body || '',
      confirmCta:c.cta || '', confirmColor:c.color || ICE,
      confirmShell:modalShell('500px', isDanger ? 'rgba(194,86,75,.4)' : 'rgba(179,224,242,.2)'),
      confirmBtn:'flex:1.6;min-width:150px;padding:12px 18px;font-size:13px;font-weight:700;cursor:pointer;transition:all .25s;border-radius:2px;color:#080D0C;background:' +
        (isDanger ? CLAY : ICE) + ';border:1px solid ' + (isDanger ? CLAY : ICE),
      confirmGeneric: () => this.toast(isDanger ? 'Action completed' : 'Distribution complete',
        isDanger ? 'Record updated and written to the audit log.' : '142 squads spread across 5 judges.'),
      closeModal: () => this.setState({modal:null}),

      toast:s.toast, toastTitle:s.toastTitle,
      toastBar:'position:absolute;left:0;bottom:0;height:2px;background:' + MOSS_LT + ';width:100%;transform-origin:left;animation:sweepBar 4.6s linear forwards',
      hideToast: () => this.setState({toast:null})
    };
  }

  render() {
    const V = this.renderVals();
    return (
      <div style={sx("min-height:100vh;background:#080D0C;color:#E4EEF2;position:relative;overflow-x:hidden")}>

        <div style={sx("position:fixed;inset:0;pointer-events:none;z-index:0;background-image:radial-gradient(rgba(93,145,166,.16) 1px,transparent 1px);background-size:26px 26px;opacity:.5")}></div>
        <div style={sx("position:fixed;top:-260px;left:-160px;width:820px;height:620px;pointer-events:none;z-index:0;background:radial-gradient(closest-side,rgba(93,145,166,.20),transparent);filter:blur(20px);animation:driftA 26s ease-in-out infinite")}></div>
        <div style={sx("position:fixed;top:-180px;right:-200px;width:720px;height:560px;pointer-events:none;z-index:0;background:radial-gradient(closest-side,rgba(71,115,70,.20),transparent);filter:blur(20px);animation:driftB 32s ease-in-out infinite")}></div>

        <header style={sx("position:sticky;top:0;z-index:40;backdrop-filter:blur(14px);background:rgba(8,13,12,.88);border-bottom:1px solid rgba(179,224,242,.10);overflow:hidden")}>
          <div style={sx("position:absolute;top:0;left:0;right:0;height:1px;overflow:hidden;pointer-events:none")}>
            <div style={sx("width:22%;height:100%;background:linear-gradient(90deg,transparent,#B3E0F2,transparent);animation:railScan 7s ease-in-out infinite")}></div>
          </div>
          <div style={sx(V.L.headTop)}>

            <div style={sx("display:flex;align-items:center;gap:14px")}>
              <div style={sx("display:flex;align-items:center")}>
                <div style={sx("width:34px;height:34px;border:1px solid rgba(179,224,242,.22);display:grid;place-items:center;font-family:'JetBrains Mono',monospace;font-size:8px;color:#8AA5AE;transition:all .3s")} data-s="ap1">RVCE</div>
                <div style={sx("width:34px;height:34px;border:1px solid rgba(179,224,242,.22);border-left:none;display:grid;place-items:center;font-family:'JetBrains Mono',monospace;font-size:7px;line-height:1.2;text-align:center;color:#8AA5AE;transition:all .3s")} data-s="ap2">CODE<br />CLUB</div>
              </div>
              <div style={sx("width:1px;height:30px;background:rgba(179,224,242,.14)")}></div>
              <div>
                <div style={sx(V.L.wordmark)}>CLONEFEST 2.0</div>
                <div style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.24em;color:#56707B;margin-top:5px")}>MASTER CONTROL</div>
              </div>
            </div>

            <div style={sx("flex:1")}></div>

            <div style={sx("display:flex;align-items:center;gap:14px")}>
              <div style={sx(V.L.dayChip)}>
                <span style={sx("width:6px;height:6px;background:#7FB27E;border-radius:50%;animation:breathe 2.4s infinite")}></span>
                <span style={sx("font-size:10px;letter-spacing:.18em;color:#56707B")}>DAY</span>
                <span style={sx("font-size:13px;color:#B3E0F2")}>{V.eventDay}</span>
                <span style={sx("font-size:10px;color:#56707B")}>/ 21</span>
              </div>
              <div style={sx(V.L.hideNarrow)}>
                <div style={sx("width:1px;height:26px;background:rgba(179,224,242,.14)")}></div>
              </div>
              <div style={sx("display:flex;align-items:center;gap:11px")}>
                <div style={sx(V.L.hidePhone)}>
                  <div style={sx("text-align:right;line-height:1.35")}>
                    <div style={sx("font-size:13px;font-weight:500;color:#E4EEF2")}>v_kulkarni</div>
                    <div style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.16em;color:#56707B")}>ADMIN · FULL ACCESS</div>
                  </div>
                </div>
                <div style={sx("width:34px;height:34px;background:#B3E0F2;color:#080D0C;display:grid;place-items:center;font-family:'Clash Grotesk',sans-serif;font-weight:600;font-size:13px;transition:transform .3s")} data-s="ap3">VK</div>
              </div>
              <div style={sx(V.L.hidePhone)}>
                <button style={sx("padding:9px 16px;font-size:12px;font-weight:500;white-space:nowrap;background:transparent;cursor:pointer;transition:all .25s;border:1px solid rgba(179,224,242,.16);color:#8AA5AE;border-radius:2px")} data-s="ap4">Sign out</button>
              </div>
            </div>
          </div>

          <div style={sx(V.L.navRow)}>
            {(V.nav || []).map((n, _i0) => <React.Fragment key={_i0}>
              <button onClick={n.go} style={sx(n.style)} data-s="ap5">{n.label}</button>
            </React.Fragment>)}
            <div style={sx("flex:1")}></div>
            <div style={sx(V.L.hideNarrow)}>
              <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#56707B;padding-bottom:12px")}>SYNCED 14:07 IST</div>
            </div>
          </div>
        </header>

        {(V.banner) ? <>
          <div style={sx(V.L.bannerWrap)}>
            <div style={sx(V.L.bannerBox)}>
              <span style={sx("width:22px;height:22px;border:1px solid rgba(194,86,75,.6);color:#C2564B;display:grid;place-items:center;font-size:12px;flex:none;animation:breathe 2.6s infinite")}>!</span>
              <div style={sx("flex:1;min-width:200px")}>
                <div style={sx("font-size:13px;font-weight:500;color:#E6A79E")}>Score sync failed for 3 submissions</div>
                <div style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#8AA5AE;margin-top:4px")}>judge_assignment · KERNEL_PANIC, FOUR_OH_FOUR, DEEP_THOUGHT → 409 CONFLICT · 14:02 IST</div>
              </div>
              <button onClick={V.retry} style={sx("padding:8px 14px;font-size:12px;font-weight:500;white-space:nowrap;background:transparent;border:1px solid rgba(194,86,75,.5);color:#C2564B;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap6">Retry sync</button>
              <button onClick={V.dismissBanner} style={sx("background:transparent;border:none;color:#56707B;cursor:pointer;font-size:14px;padding:4px")} data-s="ap7">✕</button>
            </div>
          </div>
        </> : null}

        <main style={sx(V.L.main)}>

          {(V.isOverview) ? <>
            <div style={sx("animation:fade .4s ease-out both")}>

              <div style={sx(V.L.hero)}>
                <div>
                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.26em;color:#5D91A6;animation:rise .5s ease-out both")}>WEEK 3 IN PROGRESS</div>
                  <h1 style={sx(V.L.heroTitle)}>Project Gamma &amp; Deployment closes in <span style={sx("color:#B3E0F2")}>2 days</span>.</h1>
                  <p style={sx("font-size:14px;line-height:1.7;color:#8AA5AE;margin:14px 0 0;max-width:520px;text-wrap:pretty;animation:rise .5s ease-out .16s both")}>118 of 142 squads have shipped a demo link. 46 squads are still unscored.</p>
                </div>
                <div style={sx("display:flex;gap:10px;flex-wrap:wrap;animation:rise .5s ease-out .24s both")}>
                  <button onClick={V.goAnn} style={sx("padding:12px 20px;font-size:13px;font-weight:500;white-space:nowrap;background:transparent;border:1px solid rgba(179,224,242,.24);color:#B3E0F2;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap8">Broadcast</button>
                  <button onClick={V.goSquads} style={sx("padding:12px 22px;font-size:13px;font-weight:700;white-space:nowrap;background:#B3E0F2;border:1px solid #B3E0F2;color:#080D0C;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap9">Open squads table</button>
                </div>
              </div>

              <div style={sx(V.L.statStrip)}>
                {(V.stats || []).map((s, _i1) => <React.Fragment key={_i1}>
                  <div style={sx(s.cellStyle)} data-s="ap10">
                    <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B;text-transform:uppercase")}>{s.label}</div>
                    <div style={sx("display:flex;align-items:baseline;gap:5px;margin:16px 0 10px")}>
                      <span style={sx(s.numStyle)}>{s.value}</span>
                      <span style={sx("font-family:'Clash Grotesk',sans-serif;font-size:15px;color:#56707B")}>{s.unit}</span>
                    </div>
                    <div style={sx("display:flex;align-items:center;gap:9px")}>
                      <span style={sx(`width:5px;height:5px;background:${s.color};flex:none`)}></span>
                      <span style={sx("font-size:12px;color:#8AA5AE")}>{s.sub}</span>
                    </div>
                  </div>
                </React.Fragment>)}
              </div>

              <div style={sx(V.L.panelTimeline)}>
                <div style={sx("position:absolute;inset:0;background:linear-gradient(115deg,rgba(93,145,166,.14),transparent 55%);pointer-events:none")}></div>
                <div style={sx("position:relative;display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:22px")}>
                  <div style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:16px;letter-spacing:.06em;color:#E4EEF2")}>Marathon timeline</div>
                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.16em;color:#56707B")}>20 JUL — 09 AUG 2026</div>
                </div>
                <div style={sx(V.L.timelineGrid)}>
                  {(V.timeline || []).map((t, _i1) => <React.Fragment key={_i1}>
                    <div>
                      <div style={sx("display:flex;align-items:baseline;justify-content:space-between;margin-bottom:11px")}>
                        <span style={sx(`font-family:'Clash Grotesk',sans-serif;font-size:13px;letter-spacing:.04em;color:${t.labelColor}`)}>{t.title}</span>
                        <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;color:#56707B")}>{t.meta}</span>
                      </div>
                      <div style={sx("display:flex;gap:4px;align-items:flex-end;height:34px")}>
                        {(t.days || []).map((d, _i2) => <React.Fragment key={_i2}>
                          <div style={sx(d.style)}></div>
                        </React.Fragment>)}
                      </div>
                    </div>
                  </React.Fragment>)}
                </div>
              </div>

              <div style={sx(V.L.overviewCols)}>

                <div style={sx(V.L.panel)}>
                  <div style={sx("display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:22px")}>
                    <div style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:16px;letter-spacing:.06em;color:#E4EEF2")}>Track distribution</div>
                    <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#56707B")}>142 SQUADS / 5 TRACKS</div>
                  </div>
                  <div style={sx("display:flex;height:12px;gap:3px;margin-bottom:22px;overflow:hidden")}>
                    {(V.tracks || []).map((t, _i1) => <React.Fragment key={_i1}>
                      <div style={sx(t.barStyle)}></div>
                    </React.Fragment>)}
                  </div>
                  {(V.tracks || []).map((t, _i1) => <React.Fragment key={_i1}>
                    <div style={sx(t.rowStyle)} data-s="ap11">
                      <span style={sx(`width:9px;height:9px;background:${t.color}`)}></span>
                      <span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56707B")}>{t.code}</span>
                      <span style={sx("font-size:13px;color:#E4EEF2")}>{t.name}</span>
                      <span style={sx("font-family:'Clash Grotesk',sans-serif;font-size:16px;color:#E4EEF2;text-align:right;font-variant-numeric:tabular-nums")}>{t.count}</span>
                      <span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#5D91A6;text-align:right")}>{t.pct}</span>
                    </div>
                  </React.Fragment>)}
                </div>

                <div style={sx(V.L.panelFlex)}>
                  <div style={sx("display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:26px")}>
                    <div style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:16px;letter-spacing:.06em;color:#E4EEF2")}>Submissions by week</div>
                    <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#56707B")}>OF 142</div>
                  </div>
                  <div style={sx("flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;align-items:end;min-height:170px")}>
                    {(V.weeks || []).map((w, _i1) => <React.Fragment key={_i1}>
                      <div style={sx("display:flex;flex-direction:column;align-items:center;gap:12px")}>
                        <span style={sx(`font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:22px;color:${w.color};font-variant-numeric:tabular-nums`)}>{w.count}</span>
                        <div style={sx(w.barStyle)}></div>
                        <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#56707B")}>{w.label}</span>
                      </div>
                    </React.Fragment>)}
                  </div>
                  <div style={sx("border-top:1px solid rgba(179,224,242,.07);margin-top:20px;padding-top:16px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap")}>
                    <div>
                      <div style={sx("font-size:12px;color:#8AA5AE")}>Canvas repo pull requests</div>
                      <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;color:#56707B;margin-top:4px")}>READ-ONLY · SCORED SEPARATELY</div>
                    </div>
                    <div style={sx("display:flex;gap:18px;text-align:right")}>
                      <div>
                        <div style={sx("font-family:'Clash Grotesk',sans-serif;font-size:20px;color:#E4EEF2")}>{V.prOpened}</div>
                        <div style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;color:#56707B")}>OPENED</div>
                      </div>
                      <div>
                        <div style={sx("font-family:'Clash Grotesk',sans-serif;font-size:20px;color:#7FB27E")}>{V.prMerged}</div>
                        <div style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;color:#56707B")}>MERGED</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </> : null}

          {(V.isSquads) ? <>
            <div style={sx("animation:fade .4s ease-out both")}>
              <div style={sx(V.L.sectionHead)}>
                <div>
                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.26em;color:#5D91A6")}>REGISTRY</div>
                  <h2 style={sx(V.L.h2)}>Squads</h2>
                </div>
                <div style={sx("display:flex;align-items:center;gap:10px")}>
                  <span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56707B")}>142 RECORDS</span>
                  <button onClick={V.exportToast} style={sx("padding:11px 18px;font-size:13px;font-weight:500;white-space:nowrap;background:transparent;border:1px solid rgba(179,224,242,.24);color:#B3E0F2;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap12">Export CSV</button>
                </div>
              </div>

              <div style={sx("background:#112026;border:1px solid rgba(179,224,242,.10);border-radius:3px;animation:rise .45s ease-out both")}>

                <div style={sx(V.L.filterBar)}>
                  <div style={sx(V.L.searchCell)}>
                    <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>SEARCH</label>
                    <input value={V.search} onChange={V.onSearch} placeholder="Squad name or lead callsign" style={sx("width:100%;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:11px 14px;font-size:13px;outline:none;transition:all .2s;border-radius:2px")} data-s="ap13" />
                  </div>
                  <div style={sx(V.L.filterCell)}>
                    <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>TRACK</label>
                    <div style={sx("position:relative")}>
                      <select style={sx("width:100%;appearance:none;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:11px 28px 11px 13px;font-size:13px;outline:none;cursor:pointer;border-radius:2px")} data-s="ap14">
                        <option>All tracks</option>
                        <option>T1 · CMS Revival</option>
                        <option>T2 · Data Pipeline</option>
                        <option>T3 · Commerce Rebuild</option>
                        <option>T4 · Realtime Rewrite</option>
                        <option>T5 · UI Kit Port</option>
                      </select>
                      <span style={sx("position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:#5D91A6;font-size:8px")}>▼</span>
                    </div>
                  </div>
                  <div style={sx(V.L.filterCell)}>
                    <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>STATUS</label>
                    <div style={sx("position:relative")}>
                      <select style={sx("width:100%;appearance:none;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:11px 28px 11px 13px;font-size:13px;outline:none;cursor:pointer;border-radius:2px")} data-s="ap15">
                        <option>Any status</option>
                        <option>Not submitted</option>
                        <option>Pending</option>
                        <option>Accepted</option>
                        <option>Rejected</option>
                        <option>Scored</option>
                      </select>
                      <span style={sx("position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:#5D91A6;font-size:8px")}>▼</span>
                    </div>
                  </div>
                  <div style={sx(V.L.filterCell)}>
                    <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>JUDGE</label>
                    <div style={sx("position:relative")}>
                      <select style={sx("width:100%;appearance:none;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:11px 28px 11px 13px;font-size:13px;outline:none;cursor:pointer;border-radius:2px")} data-s="ap16">
                        <option>All judges</option>
                        <option>Unassigned</option>
                        <option>v_rao</option>
                        <option>k_iyer</option>
                        <option>a_menon</option>
                      </select>
                      <span style={sx("position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:#5D91A6;font-size:8px")}>▼</span>
                    </div>
                  </div>
                  <div style={sx(V.L.filterCell)}>
                    <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>SORT</label>
                    <div style={sx("position:relative")}>
                      <select style={sx("width:100%;appearance:none;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:11px 28px 11px 13px;font-size:13px;outline:none;cursor:pointer;border-radius:2px")} data-s="ap17">
                        <option>Score · high to low</option>
                        <option>Name · A to Z</option>
                        <option>Date registered · newest</option>
                      </select>
                      <span style={sx("position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:#5D91A6;font-size:8px")}>▼</span>
                    </div>
                  </div>
                  <div style={sx(V.L.rowsCell)}>
                    <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>ROWS</label>
                    <div style={sx("position:relative")}>
                      <select style={sx("width:100%;appearance:none;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:11px 26px 11px 13px;font-size:13px;outline:none;cursor:pointer;border-radius:2px")} data-s="ap18">
                        <option>25</option>
                        <option>50</option>
                        <option>100</option>
                      </select>
                      <span style={sx("position:absolute;right:11px;top:50%;transform:translateY(-50%);pointer-events:none;color:#5D91A6;font-size:8px")}>▼</span>
                    </div>
                  </div>
                </div>

                {(V.isPhone) ? <>
                  <div style={sx("padding:10px 16px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#56707B;border-bottom:1px solid rgba(179,224,242,.06)")}>SWIPE THE TABLE SIDEWAYS →</div>
                </> : null}

                <div style={sx("overflow-x:auto;-webkit-overflow-scrolling:touch")}>
                  <div style={sx("min-width:1300px")}>
                    <div style={sx("display:grid;grid-template-columns:24px 196px 124px 62px 154px 118px 118px 118px 126px 116px 128px;align-items:center;padding:0 18px;border-bottom:1px solid rgba(179,224,242,.08)")}>
                      <div></div>
                      {(V.cols || []).map((c, _i1) => <React.Fragment key={_i1}>
                        <div style={sx(c.style)}>{c.label}</div>
                      </React.Fragment>)}
                    </div>

                    {(V.isReady) ? <>
                      <div>
                        {(V.rows || []).map((r, _i2) => <React.Fragment key={_i2}>
                          <div style={sx(r.wrapStyle)}>
                            <div style={sx("display:grid;grid-template-columns:24px 196px 124px 62px 154px 118px 118px 118px 126px 116px 128px;align-items:center;padding:0 18px;border-bottom:1px solid rgba(179,224,242,.06);transition:background .2s")} data-s="ap19">
                              <button onClick={r.toggle} style={sx(r.caretStyle)}>›</button>
                              <div style={sx("padding:15px 8px;font-size:14px;font-weight:500;color:#E4EEF2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{r.name}</div>
                              <div style={sx("padding:15px 8px;font-family:'JetBrains Mono',monospace;font-size:12px;color:#8AA5AE")}>{r.lead}</div>
                              <div style={sx("padding:15px 8px;font-family:'Clash Grotesk',sans-serif;font-size:15px;color:#E4EEF2")}>{r.members}</div>
                              <div style={sx("padding:15px 8px;font-size:12px;color:#8AA5AE")}>{r.track}</div>
                              <div style={sx("padding:15px 8px;display:flex;align-items:center;gap:7px")}><span style={sx(r.w1.dot)}></span><span style={sx(r.w1.text)}>{r.w1.label}</span></div>
                              <div style={sx("padding:15px 8px;display:flex;align-items:center;gap:7px")}><span style={sx(r.w2.dot)}></span><span style={sx(r.w2.text)}>{r.w2.label}</span></div>
                              <div style={sx("padding:15px 8px;display:flex;align-items:center;gap:7px")}><span style={sx(r.w3.dot)}></span><span style={sx(r.w3.text)}>{r.w3.label}</span></div>
                              <div style={sx("padding:15px 8px;display:flex;align-items:center;gap:10px")}>
                                <span style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:18px;color:#B3E0F2;font-variant-numeric:tabular-nums")}>{r.score}</span>
                                <span style={sx("flex:1;height:3px;background:rgba(179,224,242,.12);position:relative")}><span style={sx(r.meterStyle)}></span></span>
                              </div>
                              <div style={sx(`padding:15px 8px;font-family:'JetBrains Mono',monospace;font-size:11px;color:${r.judgeColor}`)}>{r.judge}</div>
                              <div style={sx("padding:10px 8px;display:flex;gap:6px;justify-content:flex-end")}>
                                <button style={sx("padding:7px 10px;font-size:11px;background:transparent;border:1px solid rgba(179,224,242,.16);color:#8AA5AE;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap20">View</button>
                                <button onClick={V.openAssign} style={sx("padding:7px 10px;font-size:11px;background:transparent;border:1px solid rgba(93,145,166,.45);color:#B3E0F2;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap21">Judge</button>
                                <button onClick={r.dq} style={sx("padding:7px 10px;font-size:11px;background:transparent;border:1px solid rgba(194,86,75,.35);color:#C2564B;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap22">DQ</button>
                              </div>
                            </div>

                            {(r.open) ? <>
                              <div style={sx(V.L.drawer)}>
                                <div>
                                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.2em;color:#5D91A6;margin-bottom:14px")}>ROSTER · {r.members}</div>
                                  {(r.roster || []).map((m, _i4) => <React.Fragment key={_i4}>
                                    <div style={sx(m.rowStyle)}>
                                      <span style={sx(m.roleStyle)}>{m.role}</span>
                                      <span style={sx("font-size:13px;color:#E4EEF2")}>{m.callsign}</span>
                                      <span style={sx("flex:1")}></span>
                                      <span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56707B")}>{m.email}</span>
                                    </div>
                                  </React.Fragment>)}
                                </div>
                                <div>
                                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.2em;color:#5D91A6;margin-bottom:14px")}>INVITE CODE</div>
                                  <div style={sx("display:flex;align-items:stretch;border:1px dashed rgba(179,224,242,.25);background:#112026;border-radius:2px")}>
                                    <div style={sx("flex:1;padding:13px 15px;font-family:'JetBrains Mono',monospace;font-size:16px;letter-spacing:.18em;color:#B3E0F2")}>{r.invite}</div>
                                    <button onClick={r.copy} style={sx("padding:0 15px;font-size:11px;font-weight:500;background:transparent;border:none;border-left:1px dashed rgba(179,224,242,.25);color:#8AA5AE;cursor:pointer;transition:all .25s")} data-s="ap23">Copy</button>
                                  </div>
                                  <div style={sx("display:flex;gap:26px;margin-top:18px")}>
                                    <div>
                                      <div style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.16em;color:#56707B")}>REGISTERED</div>
                                      <div style={sx("font-size:13px;color:#E4EEF2;margin-top:5px")}>{r.registered}</div>
                                    </div>
                                    <div>
                                      <div style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.16em;color:#56707B")}>PRs MERGED</div>
                                      <div style={sx("font-size:13px;color:#7FB27E;margin-top:5px")}>{r.prs}</div>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.2em;color:#5D91A6;margin-bottom:14px")}>SUBMISSIONS</div>
                                  {(r.links || []).map((l, _i4) => <React.Fragment key={_i4}>
                                    <div style={sx("display:grid;grid-template-columns:58px 1fr 1fr;gap:14px;align-items:center;padding:9px 0;border-bottom:1px solid rgba(179,224,242,.06)")}>
                                      <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;color:#56707B")}>{l.week}</span>
                                      <a href="#" style={sx(l.linkStyle)}>{l.repo}</a>
                                      <a href="#" style={sx(l.linkStyle)}>{l.demo}</a>
                                    </div>
                                  </React.Fragment>)}
                                </div>
                              </div>
                            </> : null}
                          </div>
                        </React.Fragment>)}
                      </div>
                    </> : null}

                    {(V.isLoading) ? <>
                      <div style={sx("padding:24px 22px")}>
                        <div style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.18em;color:#5D91A6;margin-bottom:20px")}>QUERYING TEAM REGISTRY…</div>
                        {(V.skeleton || []).map((k, _i2) => <React.Fragment key={_i2}>
                          <div style={sx(`display:grid;grid-template-columns:196px 124px 62px 154px 1fr 116px;gap:18px;align-items:center;padding:15px 0;border-bottom:1px solid rgba(179,224,242,.06);opacity:${k.op}`)}>
                            <div style={sx("height:10px;background:rgba(179,224,242,.10);position:relative;overflow:hidden")}><div style={sx("position:absolute;inset:0;width:24%;background:linear-gradient(90deg,transparent,rgba(179,224,242,.4),transparent);animation:sweep 1.6s infinite linear")}></div></div>
                            <div style={sx("height:10px;background:rgba(179,224,242,.08)")}></div>
                            <div style={sx("height:10px;background:rgba(179,224,242,.08)")}></div>
                            <div style={sx("height:10px;background:rgba(179,224,242,.08)")}></div>
                            <div style={sx("height:10px;background:rgba(179,224,242,.08)")}></div>
                            <div style={sx("height:10px;background:rgba(179,224,242,.08)")}></div>
                          </div>
                        </React.Fragment>)}
                      </div>
                    </> : null}

                    {(V.isEmpty) ? <>
                      <div style={sx("padding:80px 20px;text-align:center;animation:pop .35s ease-out both")}>
                        <div style={sx("width:54px;height:54px;margin:0 auto 20px;border:1px solid rgba(179,224,242,.18);display:grid;place-items:center;color:#56707B;font-family:'Clash Grotesk',sans-serif;font-size:20px")}>∅</div>
                        <div style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:20px;color:#E4EEF2")}>No squads match these filters</div>
                        <div style={sx("font-size:13px;color:#8AA5AE;margin-top:10px")}>0 of 142 records returned for the current query.</div>
                        <button onClick={V.resetFilters} style={sx("margin-top:22px;padding:11px 22px;font-size:13px;font-weight:500;white-space:nowrap;background:transparent;border:1px solid rgba(179,224,242,.24);color:#B3E0F2;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap24">Reset filters</button>
                      </div>
                    </> : null}

                    {(V.isError) ? <>
                      <div style={sx("padding:72px 20px;text-align:center;animation:pop .35s ease-out both")}>
                        <div style={sx("width:54px;height:54px;margin:0 auto 20px;border:1px solid rgba(194,86,75,.5);display:grid;place-items:center;color:#C2564B;font-size:20px;animation:breathe 2.4s infinite")}>!</div>
                        <div style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:20px;color:#E6A79E")}>Registry unreachable</div>
                        <div style={sx("font-family:'JetBrains Mono',monospace;font-size:12px;color:#8AA5AE;margin-top:10px")}>GET /api/teams → 503 SERVICE UNAVAILABLE · req 8f3c-2a91</div>
                        <button onClick={V.retry} style={sx("margin-top:22px;padding:11px 22px;font-size:13px;font-weight:500;background:transparent;border:1px solid rgba(194,86,75,.5);color:#C2564B;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap25">Retry query</button>
                      </div>
                    </> : null}
                  </div>
                </div>

                <div style={sx(V.L.pager)}>
                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56707B")}>SHOWING <span style={sx("color:#E4EEF2")}>1–25</span> OF <span style={sx("color:#E4EEF2")}>142</span></div>
                  <div style={sx("display:flex;align-items:center;gap:6px;flex-wrap:wrap")}>
                    <button style={sx("padding:8px 14px;font-size:12px;background:transparent;border:1px solid rgba(179,224,242,.10);color:#56707B;cursor:not-allowed;border-radius:2px")}>Previous</button>
                    {(V.pages || []).map((p, _i1) => <React.Fragment key={_i1}>
                      <button style={sx(p.style)}>{p.n}</button>
                    </React.Fragment>)}
                    <button style={sx("padding:8px 14px;font-size:12px;background:transparent;border:1px solid rgba(179,224,242,.24);color:#B3E0F2;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap26">Next</button>
                  </div>
                </div>
              </div>
            </div>
          </> : null}

          {(V.isAnn) ? <>
            <div style={sx("animation:fade .4s ease-out both")}>
              <div style={sx(V.L.sectionHead)}>
                <div>
                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.26em;color:#5D91A6")}>BROADCAST</div>
                  <h2 style={sx(V.L.h2)}>Announcements</h2>
                </div>
                <span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56707B")}>561 HACKERS REACHABLE</span>
              </div>

              <div style={sx(V.L.annCols)}>

                <div style={sx("background:#112026;border:1px solid rgba(179,224,242,.10);border-radius:3px;position:relative;overflow:hidden;animation:rise .45s ease-out both")}>
                  <div style={sx("position:absolute;inset:0;background:linear-gradient(150deg,rgba(93,145,166,.16),transparent 50%);pointer-events:none")}></div>
                  <div style={sx(V.L.composePad)}>
                    <div style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:20px;color:#E4EEF2;margin-bottom:22px")}>Compose</div>

                    <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>TITLE</label>
                    <input placeholder="Week 3 unlocks at 09:00 IST" style={sx("width:100%;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:12px 15px;font-size:14px;outline:none;transition:all .2s;margin-bottom:20px;border-radius:2px")} data-s="ap27" />

                    <div style={sx("display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px")}>
                      <label style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>BODY</label>
                      <span style={sx(`font-family:'JetBrains Mono',monospace;font-size:10px;color:${V.countColor}`)}>{V.bodyLen} / 500</span>
                    </div>
                    <textarea onChange={V.onBody} rows="6" placeholder="Plain text. Links are rendered but not tracked." style={sx("width:100%;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:13px 15px;font-size:13px;line-height:1.75;outline:none;resize:vertical;transition:all .2s;border-radius:2px")} data-s="ap28"></textarea>
                    <div style={sx("height:2px;background:rgba(179,224,242,.10);margin-top:2px")}><div style={sx(V.countBar)}></div></div>

                    <div style={sx(V.L.audienceRow)}>
                      <div>
                        <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>AUDIENCE</label>
                        <div style={sx("position:relative")}>
                          <select style={sx("width:100%;appearance:none;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:12px 30px 12px 14px;font-size:13px;outline:none;cursor:pointer;border-radius:2px")} data-s="ap29">
                            <option>All hackers · 561</option>
                            <option>Squad leads only · 142</option>
                            <option>Single track — T1 CMS Revival · 152</option>
                            <option>Single track — T2 Data Pipeline · 124</option>
                            <option>Single track — T5 UI Kit Port · 98</option>
                          </select>
                          <span style={sx("position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:#5D91A6;font-size:8px")}>▼</span>
                        </div>
                      </div>
                      <div>
                        <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B;margin-bottom:8px")}>PIN TO TOP</div>
                        <button onClick={V.togglePin} style={sx(V.pinTrack)}>
                          <span style={sx(V.pinKnob)}></span>
                          <span style={sx(V.pinLabel)}>{V.pinText}</span>
                        </button>
                      </div>
                    </div>

                    <div style={sx("display:flex;gap:12px;margin-top:26px;flex-wrap:wrap")}>
                      <button style={sx("flex:1;min-width:120px;padding:12px 20px;font-size:13px;font-weight:500;background:transparent;border:1px solid rgba(179,224,242,.16);color:#8AA5AE;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap30">Preview</button>
                      <button onClick={V.openBroadcast} style={sx("flex:1.5;min-width:150px;padding:12px 20px;font-size:13px;font-weight:700;white-space:nowrap;background:#B3E0F2;border:1px solid #B3E0F2;color:#080D0C;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap31">Broadcast</button>
                    </div>
                  </div>
                </div>

                <div style={sx("background:#112026;border:1px solid rgba(179,224,242,.10);border-radius:3px;animation:rise .45s ease-out .1s both")}>
                  <div style={sx("display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:20px 24px;border-bottom:1px solid rgba(179,224,242,.08)")}>
                    <div style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:16px;color:#E4EEF2")}>Sent history</div>
                    <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#56707B")}>LAST 30 DAYS · 14</div>
                  </div>
                  {(V.announcements || []).map((a, _i1) => <React.Fragment key={_i1}>
                    <div style={sx(a.wrapStyle)} data-s="ap32">
                      <div style={sx("display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap")}>
                        {(a.pinned) ? <>
                          <span style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;color:#080D0C;background:#B3E0F2;padding:3px 7px")}>PINNED</span>
                        </> : null}
                        <div style={sx("flex:1;min-width:160px;font-size:14px;font-weight:500;color:#E4EEF2")}>{a.title}</div>
                        <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;color:#56707B;white-space:nowrap")}>{a.time}</div>
                      </div>
                      <div style={sx("font-size:13px;color:#8AA5AE;line-height:1.7;margin-bottom:12px")}>{a.excerpt}</div>
                      <div style={sx("display:flex;align-items:center;gap:12px;flex-wrap:wrap")}>
                        <span style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.12em;color:#5D91A6;border:1px solid rgba(93,145,166,.35);padding:3px 7px")}>{a.audience}</span>
                        <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;color:#56707B")}>by {a.sender}</span>
                        <span style={sx("flex:1")}></span>
                        <button style={sx("padding:6px 11px;font-size:11px;background:transparent;border:1px solid rgba(179,224,242,.14);color:#8AA5AE;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap33">Edit</button>
                        <button onClick={V.openDelete} style={sx("padding:6px 11px;font-size:11px;background:transparent;border:1px solid rgba(194,86,75,.3);color:#C2564B;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap34">Delete</button>
                      </div>
                    </div>
                  </React.Fragment>)}
                </div>
              </div>
            </div>
          </> : null}

          {(V.isJudges) ? <>
            <div style={sx("animation:fade .4s ease-out both")}>
              <div style={sx(V.L.sectionHead)}>
                <div>
                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.26em;color:#5D91A6")}>EVALUATION</div>
                  <h2 style={sx(V.L.h2)}>Judges</h2>
                </div>
                <div style={sx("display:flex;gap:10px;flex-wrap:wrap")}>
                  <button onClick={V.openAuto} style={sx("padding:11px 18px;font-size:13px;font-weight:500;white-space:nowrap;background:transparent;border:1px solid rgba(179,224,242,.16);color:#8AA5AE;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap35">Auto-distribute evenly</button>
                  <button onClick={V.openAssign} style={sx("padding:11px 20px;font-size:13px;font-weight:700;white-space:nowrap;background:#B3E0F2;border:1px solid #B3E0F2;color:#080D0C;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap36">Assign squads</button>
                </div>
              </div>

              <div style={sx("background:#112026;border:1px solid rgba(179,224,242,.10);border-radius:3px;animation:rise .45s ease-out both")}>
                <div style={sx(V.L.judgeHead)}>
                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.16em;color:#56707B;padding:14px 8px")}>CALLSIGN</div>
                  <div style={sx(V.L.judgeEmailHead)}>EMAIL</div>
                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.16em;color:#56707B;padding:14px 8px")}>ASSIGNED</div>
                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.16em;color:#56707B;padding:14px 8px")}>SCORED</div>
                  <div style={sx(V.L.judgeProgHead)}>PROGRESS</div>
                </div>

                {(V.judges || []).map((j, _i1) => <React.Fragment key={_i1}>
                  <div style={sx(j.rowStyle)} data-s="ap37">
                    <div style={sx("padding:16px 8px;display:flex;align-items:center;gap:11px")}>
                      <span style={sx(j.avatar)}>{j.initials}</span>
                      <span style={sx("font-size:13px;font-weight:500;color:#E4EEF2")}>{j.callsign}</span>
                    </div>
                    <div style={sx(j.emailStyle)}>{j.email}</div>
                    <div style={sx("padding:16px 8px;font-family:'Clash Grotesk',sans-serif;font-size:17px;color:#E4EEF2")}>{j.assigned}</div>
                    <div style={sx("padding:16px 8px;font-family:'Clash Grotesk',sans-serif;font-size:17px;color:#B3E0F2")}>{j.scored}</div>
                    <div style={sx(j.progStyle)}>
                      <div style={sx("display:flex;gap:3px;flex:1;min-width:130px;height:16px;align-items:center")}>
                        {(j.ticks || []).map((k, _i2) => <React.Fragment key={_i2}>
                          <div style={sx(k.style)}></div>
                        </React.Fragment>)}
                      </div>
                      <span style={sx(`font-family:'JetBrains Mono',monospace;font-size:11px;color:${j.pctColor};width:42px;text-align:right`)}>{j.pct}</span>
                    </div>
                  </div>
                </React.Fragment>)}
              </div>
            </div>
          </> : null}

          {(V.isChal) ? <>
            <div style={sx("animation:fade .4s ease-out both")}>
              <div style={sx(V.L.sectionHead)}>
                <div>
                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.26em;color:#5D91A6")}>SCHEDULE</div>
                  <h2 style={sx(V.L.h2)}>Challenges</h2>
                </div>
                <span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56707B")}>3 WEEKS · 300 PTS</span>
              </div>

              <div style={sx(V.L.chalGrid)}>
                {(V.challenges || []).map((c, _i1) => <React.Fragment key={_i1}>
                  <div style={sx(c.cardStyle)} data-s="ap38">
                    <div style={sx(c.washStyle)}></div>
                    <div style={sx("position:relative;padding:26px")}>
                      <div style={sx("display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:20px")}>
                        <div>
                          <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.2em;color:#56707B")}>WEEK {c.week}</div>
                          <div style={sx(`font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:22px;color:${c.titleColor};margin-top:10px;line-height:1.25`)}>{c.title}</div>
                        </div>
                        <div style={sx("text-align:right")}>
                          <div style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:28px;color:#E4EEF2;line-height:1")}>{c.points}</div>
                          <div style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.16em;color:#56707B;margin-top:4px")}>POINTS</div>
                        </div>
                      </div>

                      <div style={sx("display:flex;align-items:center;gap:12px;padding:14px 0;border-top:1px solid rgba(179,224,242,.08);border-bottom:1px solid rgba(179,224,242,.08);margin-bottom:18px")}>
                        <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.16em;color:#56707B")}>ACCESS</span>
                        <span style={sx("flex:1")}></span>
                        <button onClick={c.toggleLock} style={sx(c.lockTrack)}>
                          <span style={sx(c.lockKnob)}></span>
                          <span style={sx(c.lockLabel)}>{c.lockText}</span>
                        </button>
                      </div>

                      <div style={sx("display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px")}>
                        <div>
                          <div style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.16em;color:#56707B;margin-bottom:7px")}>OPENS</div>
                          <div style={sx("font-size:13px;color:#E4EEF2;line-height:1.5")}>{c.opens}</div>
                        </div>
                        <div>
                          <div style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.16em;color:#56707B;margin-bottom:7px")}>CLOSES</div>
                          <div style={sx("font-size:13px;color:#E4EEF2;line-height:1.5")}>{c.closes}</div>
                        </div>
                      </div>

                      <div style={sx("margin-bottom:22px")}>
                        <div style={sx("display:flex;align-items:baseline;gap:8px;margin-bottom:8px")}>
                          <span style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:20px;color:#B3E0F2")}>{c.subs}</span>
                          <span style={sx("font-size:12px;color:#8AA5AE")}>of 142 squads submitted</span>
                        </div>
                        <div style={sx("height:4px;background:rgba(179,224,242,.10);position:relative;overflow:hidden")}><div style={sx(c.barStyle)}></div></div>
                      </div>

                      <button style={sx("width:100%;padding:11px 18px;font-size:13px;font-weight:500;white-space:nowrap;background:transparent;border:1px solid rgba(179,224,242,.24);color:#B3E0F2;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap39">Edit details</button>
                    </div>
                  </div>
                </React.Fragment>)}
              </div>
            </div>
          </> : null}

          {(V.isExports) ? <>
            <div style={sx("animation:fade .4s ease-out both")}>
              <div style={sx(V.L.sectionHead)}>
                <div>
                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.26em;color:#5D91A6")}>DATA</div>
                  <h2 style={sx(V.L.h2)}>Exports</h2>
                </div>
                <span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56707B")}>UTF-8 · COMMA DELIMITED</span>
              </div>

              <div style={sx("background:#112026;border:1px solid rgba(179,224,242,.10);border-radius:3px;animation:rise .45s ease-out both")}>
                {(V.exports || []).map((e, _i1) => <React.Fragment key={_i1}>
                  <div style={sx(e.rowStyle)} data-s="ap40">
                    <div style={sx(e.iconStyle)}>CSV</div>
                    <div>
                      <div style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:17px;color:#E4EEF2")}>{e.name}</div>
                      <div style={sx("font-size:12px;color:#8AA5AE;margin-top:5px")}>{e.desc}</div>
                    </div>
                    <div>
                      <div style={sx("font-family:'Clash Grotesk',sans-serif;font-size:19px;color:#E4EEF2")}>{e.rows}</div>
                      <div style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.16em;color:#56707B;margin-top:3px")}>ROWS</div>
                    </div>
                    <div style={sx(e.lastStyle)}>LAST · <span style={sx(`color:${e.lastColor}`)}>{e.last}</span></div>
                    <button onClick={V.exportToast} style={sx("padding:11px 18px;font-size:13px;font-weight:500;background:transparent;border:1px solid rgba(179,224,242,.24);color:#B3E0F2;cursor:pointer;transition:all .25s;border-radius:2px;white-space:nowrap")} data-s="ap41">Download CSV</button>
                  </div>
                </React.Fragment>)}
              </div>
            </div>
          </> : null}
        </main>

        {(V.modalBroadcast) ? <>
          <div style={sx(V.L.overlay)}>
            <div style={sx(V.L.modalWide)}>
              <div style={sx("position:absolute;inset:0;background:linear-gradient(150deg,rgba(93,145,166,.2),transparent 55%);pointer-events:none")}></div>
              <div style={sx(V.L.modalPad)}>
                <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.2em;color:#5D91A6;margin-bottom:12px")}>CONFIRM BROADCAST</div>
                <div style={sx(V.L.modalTitle)}>This will notify 561 hackers. Send?</div>
                <div style={sx("margin:22px 0;border:1px solid rgba(179,224,242,.10);background:#0B1519;padding:16px 18px;border-radius:2px")}>
                  <div style={sx("font-size:14px;font-weight:500;color:#E4EEF2;margin-bottom:7px")}>Week 3 unlocks at 09:00 IST</div>
                  <div style={sx("font-size:13px;color:#8AA5AE;line-height:1.7")}>Project Gamma &amp; Deployment goes live Monday. Deploy URLs must resolve over HTTPS before the Wednesday cutoff.</div>
                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#5D91A6;margin-top:12px")}>AUDIENCE: ALL HACKERS · PINNED</div>
                </div>
                <div style={sx("display:flex;gap:12px;flex-wrap:wrap")}>
                  <button onClick={V.closeModal} style={sx("flex:1;min-width:110px;padding:12px 18px;font-size:13px;font-weight:500;background:transparent;border:1px solid rgba(179,224,242,.16);color:#8AA5AE;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap42">Cancel</button>
                  <button onClick={V.confirmBroadcast} style={sx("flex:1.6;min-width:150px;padding:12px 18px;font-size:13px;font-weight:700;white-space:nowrap;background:#B3E0F2;border:1px solid #B3E0F2;color:#080D0C;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap43">Confirm broadcast</button>
                </div>
              </div>
            </div>
          </div>
        </> : null}

        {(V.modalAssign) ? <>
          <div style={sx(V.L.overlay)}>
            <div style={sx(V.L.modalAssign)}>
              <div style={sx(V.L.modalPad)}>
                <div style={sx("display:flex;justify-content:space-between;align-items:center;margin-bottom:22px")}>
                  <div style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:22px;color:#E4EEF2")}>Assign squads</div>
                  <button onClick={V.closeModal} style={sx("background:transparent;border:none;color:#56707B;cursor:pointer;font-size:15px")} data-s="ap44">✕</button>
                </div>

                <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>JUDGE</label>
                <div style={sx("position:relative;margin-bottom:20px")}>
                  <select style={sx("width:100%;appearance:none;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:12px 30px 12px 14px;font-size:13px;outline:none;cursor:pointer;border-radius:2px")} data-s="ap45">
                    <option>v_rao · 24 assigned</option>
                    <option>k_iyer · 24 assigned</option>
                    <option>a_menon · 22 assigned</option>
                    <option>s_deshpande · 18 assigned</option>
                    <option>b_nair · 20 assigned</option>
                  </select>
                  <span style={sx("position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:#5D91A6;font-size:8px")}>▼</span>
                </div>

                <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>SQUADS</label>
                <input placeholder="Filter squads" style={sx("width:100%;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:11px 14px;font-size:13px;outline:none;margin-bottom:12px;border-radius:2px")} data-s="ap46" />

                <div style={sx(V.L.pickList)}>
                  {(V.pickList || []).map((p, _i1) => <React.Fragment key={_i1}>
                    <div onClick={p.toggle} style={sx("display:flex;align-items:center;gap:13px;padding:12px 15px;border-bottom:1px solid rgba(179,224,242,.06);cursor:pointer;transition:background .2s")} data-s="ap47">
                      <span style={sx(p.box)}>{p.mark}</span>
                      <span style={sx("font-size:13px;color:#E4EEF2")}>{p.name}</span>
                      <span style={sx("flex:1")}></span>
                      <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;color:#56707B")}>{p.track}</span>
                    </div>
                  </React.Fragment>)}
                </div>

                <div style={sx("display:flex;align-items:center;gap:12px;margin-top:22px;flex-wrap:wrap")}>
                  <div style={sx("flex:1;min-width:150px;font-size:13px;color:#8AA5AE")}><span style={sx("font-family:'Clash Grotesk',sans-serif;font-size:17px;color:#B3E0F2")}>{V.pickedCount}</span> squads selected</div>
                  <button onClick={V.closeModal} style={sx("padding:12px 18px;font-size:13px;font-weight:500;background:transparent;border:1px solid rgba(179,224,242,.16);color:#8AA5AE;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap48">Cancel</button>
                  <button onClick={V.confirmAssign} style={sx("padding:12px 22px;font-size:13px;font-weight:700;white-space:nowrap;background:#B3E0F2;border:1px solid #B3E0F2;color:#080D0C;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap49">Save assignment</button>
                </div>
              </div>
            </div>
          </div>
        </> : null}

        {(V.modalConfirm) ? <>
          <div style={sx(V.L.overlay)}>
            <div style={sx(V.confirmShell)}>
              <div style={sx(V.L.modalPad)}>
                <div style={sx(`font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.2em;color:${V.confirmColor};margin-bottom:12px`)}>{V.confirmKicker}</div>
                <div style={sx(V.L.modalTitleSm)}>{V.confirmTitle}</div>
                <div style={sx("font-size:13px;color:#8AA5AE;line-height:1.8;margin:16px 0 24px")}>{V.confirmBody}</div>
                <div style={sx("display:flex;gap:12px;flex-wrap:wrap")}>
                  <button onClick={V.closeModal} style={sx("flex:1;min-width:110px;padding:12px 18px;font-size:13px;font-weight:500;background:transparent;border:1px solid rgba(179,224,242,.16);color:#8AA5AE;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap50">Cancel</button>
                  <button onClick={V.confirmGeneric} style={sx(V.confirmBtn)}>{V.confirmCta}</button>
                </div>
              </div>
            </div>
          </div>
        </> : null}

        {(V.toast) ? <>
          <div style={sx(V.L.toast)}>
            <span style={sx("width:20px;height:20px;flex:none;border:1px solid rgba(127,178,126,.5);color:#7FB27E;display:grid;place-items:center;font-size:11px")}>✓</span>
            <div style={sx("flex:1")}>
              <div style={sx("font-size:13px;font-weight:500;color:#E4EEF2")}>{V.toastTitle}</div>
              <div style={sx("font-size:12px;color:#8AA5AE;margin-top:3px")}>{V.toast}</div>
            </div>
            <button onClick={V.hideToast} style={sx("background:transparent;border:none;color:#56707B;cursor:pointer;font-size:13px")} data-s="ap51">✕</button>
            <div style={sx(V.toastBar)}></div>
          </div>
        </> : null}
      </div>
    );
  }
}
