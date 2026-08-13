import React from 'react';
import { useJudgeData } from '../hooks/useJudgeData';
import { useEventData } from '../hooks/useEventData';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { sx } from '../lib/sx';
import './JudgePortal.css';

const ICE = '#B3E0F2', STEEL = '#5D91A6', MOSS_LT = '#7FB27E',
      CLAY = '#C2564B', TXT = '#E4EEF2', MUTE = '#8AA5AE', DIM = '#56707B';
const MONO = "font-family:'JetBrains Mono',monospace";
const PANEL = 'background:#112026;border:1px solid rgba(179,224,242,.10);border-radius:3px';

const CRIT = [
  {k:'cq', name:'Code Quality & Architecture', max:20, hint:'Clear module boundaries, honest naming, tests that run, no dead legacy code left behind.'},
  {k:'fc', name:'Feature Completeness', max:25, hint:'Every requirement in the challenge brief works end to end, not just the happy path.'},
  {k:'ux', name:'UI/UX & Design', max:20, hint:'A consistent visual system, keyboard and mobile support, sensible empty and error states.'},
  {k:'dd', name:'Deployment & Documentation', max:15, hint:'Live URL reachable, README covers setup, environment variables documented.'},
  {k:'iv', name:'Innovation & Going Beyond', max:20, hint:'Anything past the brief the squad chose to build and can justify in review.'}
];



const PRS = [
  {title:'Fix collision detection after canvas resize', num:212, author:'fortytwo', state:'Merged', files:6,  merged:'04 Aug · 18:22', pts:8},
  {title:'Restore undo stack after tool switch',        num:198, author:'nulldiv',  state:'Merged', files:3,  merged:'02 Aug · 12:07', pts:5},
  {title:'Remove jQuery from toolbar init',             num:187, author:'tracelog', state:'Merged', files:9,  merged:'31 Jul · 21:44', pts:6},
  {title:'Add pointer events for stylus input',         num:221, author:'fortytwo', state:'Open',   files:11, merged:'—', pts:null},
  {title:'Rewrite PNG export as a worker',              num:230, author:'nulldiv',  state:'Closed', files:4,  merged:'—', pts:0}
];

const ANIM = {t:0, on:false, started:false, host:null, vw:0, bound:false};
function bumpHost(){ const h = ANIM.host; if (h && h.setState) h.setState(st => ({tick:(st.tick||0)+1})); }
function startAnim(){
  if (ANIM.started || typeof window === 'undefined') return;
  ANIM.started = true;
  ANIM.vw = window.innerWidth;
  if (!ANIM.bound){
    ANIM.bound = true;
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { ANIM.vw = window.innerWidth; bumpHost(); }, 80); });
  }
  setTimeout(() => { ANIM.on = true; bumpHost(); }, 60);
  const start = Date.now(), dur = 1100;
  const step = () => {
    const p = Math.min(1, (Date.now() - start) / dur);
    ANIM.t = 1 - Math.pow(1 - p, 3);
    bumpHost();
    if (p < 1) setTimeout(step, 30);
  };
  setTimeout(step, 80);
  setTimeout(() => { if (ANIM.t < 1 || !ANIM.on){ ANIM.t = 1; ANIM.on = true; bumpHost(); } }, 2600);
}

const STATUS = {
  scored:{label:'Scored',      c:MOSS_LT, fill:MOSS_LT,       border:MOSS_LT},
  draft: {label:'Draft saved', c:STEEL,   fill:'transparent', border:STEEL},
  none:  {label:'Not started', c:DIM,     fill:'transparent', border:DIM}
};

class JudgePortalView extends React.Component {

  state = {
    view:null, idx:3, tick:0, search:'', tab:'All', sort:'status',
    scores:{}, feedback:{}, comments:{}, attempted:{}, locked:{}, hydrated:false,
    prState:null, modal:false, toast:null, toastTitle:''
  };

  componentDidMount(){ ANIM.host = this; startAnim(); }
  componentWillUnmount(){ clearTimeout(this._t); if (ANIM.host === this) ANIM.host = null; }

  toast(title, msg){
    clearTimeout(this._t);
    this.setState({toast:msg, toastTitle:title, modal:false});
    this._t = setTimeout(() => this.setState({toast:null}), 4600);
  }

  componentDidUpdate(prev){
    // Fold saved scores into the editable state the rubric works against.
    if (!this.state.hydrated && this.props.squads && this.props.squads.length){
      const scores = {}, feedback = {}, comments = {}, locked = {};
      for (const sq of this.props.squads){
        const sc = sq.score;
        if (!sc) continue;
        scores[sq.name] = {
          cq: sc.code_quality ?? '', fc: sc.completeness ?? '', ux: sc.ux_design ?? '',
          dd: sc.deployment ?? '',   iv: sc.innovation ?? '',
        };
        feedback[sq.name] = sc.feedback || '';
        comments[sq.name] = sc.comments || {};
        if (sc.status === 'final'){
          locked[sq.name] = new Date(sc.updated_at || sc.created_at)
            .toLocaleString('en-GB', {day:'2-digit', month:'short', year:'numeric',
                                      hour:'2-digit', minute:'2-digit'});
        }
      }
      this.setState({scores, feedback, comments, locked, hydrated:true});
    }
  }

  /** Live squads mapped onto the shape this design renders. */
  /** Display name: real name, else the email local part, else 'Judge'. */
  judgeName(){
    const me = this.props.me;
    if (me?.full_name && me.full_name.trim()) return me.full_name.trim();
    if (me?.email) return String(me.email).split('@')[0];
    return 'Judge';
  }

  squadList(){
    const live = this.props.squads;
    // Live squads from useJudgeData, mapped onto the shape this design renders.
    return (live && live.length)
      ? live.map((q) => ({
          name: q.name,
          track: q.subs[0]?.track_id || '\u2014',
          subs: q.subs.length,
          status: q.score?.status === 'final' ? 'scored'
                : q.score ? 'draft' : 'none',
          updated: q.updated
            ? new Date(q.updated).toLocaleDateString('en-GB',
                { day:'2-digit', month:'short' }).toUpperCase()
            : '\u2014',
          prPts: 0, prMerged: 0, prTotal: q.subs.length,
          members: q.members.length ? q.members : [['operative','LEAD']],
          late: [0, 0, 0],
          _subs: q.subs,
          _submissionId: q.latestSubmissionId,
        }))
      : [];
  }

  sq(){
    const L = this.squadList();
    // Placeholder must be shape-complete: the detail view reads members[0][0].
    return L[this.state.idx] || L[0] || {
      name:'', track:'—', subs:0, status:'none', updated:'—',
      prPts:0, prMerged:0, prTotal:0,
      members:[['operative','LEAD']], late:[0,0,0], _subs:[], _submissionId:null,
    };
  }
  vals(name){ return this.state.scores[name] || {}; }

  setScore(name, k, v){
    this.setState(s => {
      const sc = Object.assign({}, s.scores);
      sc[name] = Object.assign({}, sc[name] || {});
      sc[name][k] = v === '' ? '' : Math.max(-999, Math.min(999, Number(v)));
      return {scores:sc};
    });
  }
  setComment(name, k, v){
    this.setState(s => {
      const c = Object.assign({}, s.comments);
      c[name] = Object.assign({}, c[name] || {});
      c[name][k] = v;
      return {comments:c};
    });
  }

  renderVals(){
    const SQUADS = this.squadList();

    ANIM.host = this;
    startAnim();
    const s = this.state, t = ANIM.t, on = ANIM.on;
    const vw = ANIM.vw || (typeof window !== 'undefined' ? window.innerWidth : 1440);
    const phone = vw < 760, narrow = vw < 1140;
    const view = s.view || this.props.view || 'list';
    const prState = s.prState || this.props.prEvaluatorState || 'ready';
    const emptyAssignments = !!this.props.assignmentsEmpty;
    const count = n => String(Math.round(n * t));

    const listCols = phone ? '1fr 104px 64px' : narrow ? '1fr 96px 120px 84px 104px' : '1.5fr 150px 96px 136px 96px 128px 116px';
    const prCols = phone ? '1fr 90px 60px' : narrow ? '1fr 96px 70px 70px' : '1fr 110px 100px 66px 130px 70px';

    const L = {
      headTop:'max-width:1580px;margin:0 auto;display:flex;align-items:center;' + (phone ? 'flex-wrap:wrap;row-gap:10px;' : '') + 'gap:' + (phone ? '12px' : '26px') + ';padding:' + (phone ? '12px 16px' : '16px 32px'),
      wordmark:"font-family:'Clash Grotesk',sans-serif;font-weight:600;letter-spacing:.14em;white-space:nowrap;color:" + ICE + ';line-height:1;font-size:' + (phone ? '15px' : '19px'),
      logoRvce:'height:' + (phone ? '34px' : '52px') + ';width:auto;flex:none',
      logoClub:'height:' + (phone ? '56px' : '84px') + ';width:auto;flex:none;margin-left:' +
        (phone ? '10px' : '16px'),
      hidePhone:'display:flex;align-items:center',
      hideNarrow: narrow ? 'display:none' : 'display:flex;align-items:center',
      headPhoneProgress: narrow ? 'padding:' + (phone ? '0 16px 12px' : '0 32px 14px') + ';max-width:1580px;margin:0 auto' : 'display:none',
      main:'position:relative;z-index:5;max-width:1580px;margin:0 auto;padding:' + (phone ? '22px 16px 96px' : '30px 32px 110px'),
      hero: narrow ? 'display:flex;flex-direction:column;align-items:flex-start;gap:20px;margin-bottom:30px'
                   : 'display:grid;grid-template-columns:1fr auto;gap:40px;align-items:end;margin-bottom:34px',
      heroTitle:"font-family:'Clash Grotesk',sans-serif;font-weight:500;letter-spacing:-.01em;line-height:1.12;margin:14px 0 0;color:" + TXT +
        ';max-width:620px;text-wrap:pretty;animation:rise .5s ease-out .08s both;font-size:' + (phone ? '28px' : narrow ? '36px' : '44px'),
      statStrip:'border-top:1px solid rgba(179,224,242,.12);border-bottom:1px solid rgba(179,224,242,.12);display:grid;grid-template-columns:' + (phone ? 'repeat(2,1fr)' : 'repeat(4,1fr)'),
      scopeNote:'display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:' + (phone ? '22px' : '26px') +
        ';padding:14px 18px;border:1px solid rgba(93,145,166,.28);background:linear-gradient(90deg,rgba(93,145,166,.10),rgba(93,145,166,.02));border-radius:2px;animation:rise .45s ease-out .28s both',
      panel:PANEL + ';padding:' + (phone ? '20px 18px' : '26px 28px'),
      panelFlush:PANEL + ';margin-top:20px;overflow:hidden;animation:rise .5s ease-out .34s both',
      filterBar:'padding:' + (phone ? '14px 16px' : '18px 20px') + ';border-bottom:1px solid rgba(179,224,242,.08);display:' +
        (phone ? 'grid;grid-template-columns:1fr;gap:14px' : 'flex;flex-wrap:wrap;gap:14px;align-items:flex-end'),
      searchCell: phone ? '' : 'flex:1;min-width:230px',
      tabsCell: phone ? '' : 'flex:none',
      sortCell: phone ? '' : 'width:150px',
      tableMin: phone ? 'min-width:520px' : '',
      rowHead:'display:grid;grid-template-columns:' + listCols + ';padding:0 ' + (phone ? '14px' : '20px') + ';border-bottom:1px solid rgba(179,224,242,.08)',
      subLine:MONO + ';font-size:10px;letter-spacing:.1em;color:' + DIM + ';margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap',
      cellTrack: narrow ? 'display:none' : MONO + ';font-size:11px;color:' + MUTE + ';padding:15px 8px;display:flex;align-items:center',
      cellSubs: phone ? 'display:none' : 'padding:15px 8px;display:flex;align-items:center',
      cellUpdated: narrow ? 'display:none' : MONO + ';font-size:11px;color:' + DIM + ';padding:15px 8px;display:flex;align-items:center',
      cellAction: phone ? 'display:none' : 'padding:15px 8px;display:flex;align-items:center;justify-content:flex-end',
      pager:'padding:15px 20px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;border-top:1px solid rgba(179,224,242,.08)',
      detailTop:'display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:' + (phone ? '20px' : '26px'),
      detailHead: narrow ? 'display:flex;flex-direction:column;gap:22px;margin-bottom:34px' : 'display:grid;grid-template-columns:1fr 260px;gap:36px;align-items:end;margin-bottom:38px',
      detailTitle:"font-family:'Clash Grotesk',sans-serif;font-weight:500;letter-spacing:.01em;line-height:1.1;margin:12px 0 0;color:" + TXT + ';font-size:' + (phone ? '30px' : narrow ? '38px' : '46px'),
      detailStatus:PANEL + ';padding:18px 20px;animation:rise .45s ease-out .1s both',
      sectionHead:'display:flex;align-items:' + (phone ? 'flex-start' : 'flex-end') + ';justify-content:space-between;gap:16px;margin-bottom:20px;flex-wrap:wrap',
      h2:"font-family:'Clash Grotesk',sans-serif;font-weight:500;margin:10px 0 0;color:" + TXT + ';font-size:' + (phone ? '24px' : '30px'),
      weekGrid:'display:grid;gap:' + (phone ? '14px' : '18px') + ';grid-template-columns:' + (narrow ? '1fr' : 'repeat(2,1fr)'),
      prPanel:PANEL + ';position:relative;overflow:hidden;margin-top:' + (phone ? '30px' : '40px') + ';padding:' + (phone ? '20px 18px' : '26px 28px'),
      prHead:'display:grid;grid-template-columns:' + prCols + ';' + MONO + ';font-size:10px;letter-spacing:.16em;color:' + DIM + ';border-bottom:1px solid rgba(179,224,242,.08)',
      prHeadAuthor: narrow ? 'display:none' : 'padding:0 0 12px',
      prHeadFiles: phone ? 'display:none' : 'padding:0 0 12px;text-align:right',
      prHeadMerged: narrow ? 'display:none' : 'padding:0 0 12px',
      prCellAuthor: narrow ? 'display:none' : MONO + ';font-size:12px;color:' + MUTE + ';padding:13px 0;display:flex;align-items:center',
      prCellFiles: phone ? 'display:none' : MONO + ';font-size:12px;color:' + DIM + ';padding:13px 0;display:flex;align-items:center;justify-content:flex-end',
      prCellMerged: narrow ? 'display:none' : MONO + ';font-size:11px;color:' + DIM + ';padding:13px 0;display:flex;align-items:center',
      prSubtotal:'display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:18px;padding:18px 20px;border:1px solid rgba(127,178,126,.28);background:linear-gradient(90deg,rgba(127,178,126,.10),rgba(127,178,126,.01));border-radius:2px',
      rubricHead:'margin-top:' + (phone ? '34px' : '48px') + ';display:flex;align-items:' +
        (phone ? 'flex-start' : 'flex-end') + ';justify-content:space-between;gap:16px;margin-bottom:20px;flex-wrap:wrap',
      rubricGrid:'display:grid;gap:' + (phone ? '16px' : '20px') + ';align-items:start;grid-template-columns:' + (narrow ? '1fr' : '1fr 330px'),
      critRow: phone ? 'display:flex;flex-direction:column;gap:14px' : 'display:flex;align-items:flex-start;justify-content:space-between;gap:24px',
      textarea:'width:100%;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:' + TXT + ';padding:14px;font-size:13.5px;line-height:1.65;outline:none;border-radius:2px;resize:vertical;transition:border-color .25s',
      totalsCol: narrow ? 'display:grid;gap:16px;grid-template-columns:' + (phone ? '1fr' : '1fr 1fr') + ';align-items:start' : 'position:sticky;top:120px;display:grid;gap:16px',
      totalsPanel:PANEL + ';position:relative;overflow:hidden;padding:' + (phone ? '22px 20px' : '26px 24px'),
      actionsBox:PANEL + ';display:grid;gap:10px;padding:' + (phone ? '20px' : '22px 24px'),
      overlay:'position:fixed;inset:0;z-index:80;background:rgba(8,13,12,.82);backdrop-filter:blur(6px);display:grid;place-items:' + (phone ? 'end center' : 'center') + ';padding:' + (phone ? '0' : '24px') + ';animation:fade .2s ease-out both',
      modal:'width:' + (phone ? '100%' : '520px') + ';max-width:100%;background:#112026;position:relative;overflow:hidden;border:1px solid rgba(179,224,242,.2);border-radius:' + (phone ? '3px 3px 0 0' : '3px') + ';animation:' + (phone ? 'rise .3s' : 'pop .28s') + ' ease-out both',
      modalPad:'position:relative;padding:' + (phone ? '22px 18px 26px' : '28px'),
      modalTitle:"font-family:'Clash Grotesk',sans-serif;font-weight:500;color:" + TXT + ';line-height:1.25;margin:12px 0 0;font-size:' + (phone ? '21px' : '26px'),
      toast:'position:fixed;z-index:90;display:flex;align-items:center;gap:14px;border:1px solid rgba(127,178,126,.4);border-left:3px solid ' + MOSS_LT +
        ';background:#112026;padding:15px 18px;border-radius:2px;box-shadow:0 12px 40px rgba(0,0,0,.55);overflow:hidden;animation:rise .3s ease-out both;' +
        (phone ? 'left:12px;right:12px;bottom:64px' : 'right:28px;bottom:64px;max-width:400px'),
      deniedWrap:'position:relative;z-index:5;min-height:calc(100vh - 74px);display:grid;place-items:center;padding:' + (phone ? '40px 16px 90px' : '60px 32px 100px'),
      deniedCard:PANEL + ';position:relative;overflow:hidden;width:100%;max-width:600px;animation:pop .4s ease-out both;padding:' + (phone ? '28px 22px' : '40px'),
      deniedTitle:"font-family:'Clash Grotesk',sans-serif;font-weight:500;letter-spacing:.01em;line-height:1.1;margin:20px 0 0;color:" + TXT + ';font-size:' + (phone ? '32px' : '46px'),
      demoBar:'position:fixed;left:0;right:0;bottom:0;z-index:70;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px ' + (phone ? '12px' : '20px') +
        ';background:rgba(8,13,12,.94);backdrop-filter:blur(10px);border-top:1px solid rgba(179,224,242,.08)'
    };

    // ── list ──────────────────────────────────────────────
    const totalOf = n => CRIT.reduce((a,c) => a + (Number(this.vals(n)[c.k]) || 0), 0);
    const statFor = q => (s.locked[q.name] ? 'scored' : (CRIT.some(c => this.vals(q.name)[c.k] !== undefined && this.vals(q.name)[c.k] !== '') ? 'draft' : 'none'));

    let list = SQUADS.map((q, i) => ({q, i, st:statFor(q), total:totalOf(q.name)}));
    if (s.search) list = list.filter(r => r.q.name.toLowerCase().indexOf(s.search.toLowerCase()) > -1);
    if (s.tab === 'Unscored') list = list.filter(r => r.st === 'none');
    if (s.tab === 'Draft') list = list.filter(r => r.st === 'draft');
    if (s.tab === 'Scored') list = list.filter(r => r.st === 'scored');
    const order = {none:0, draft:1, scored:2};
    list = list.slice().sort((a,b) =>
      s.sort === 'score' ? b.total - a.total :
      s.sort === 'updated' ? b.q.updated.localeCompare(a.q.updated) :
      order[a.st] - order[b.st]);
    if (emptyAssignments) list = [];

    const tabCount = k => SQUADS.filter(q => k === 'All' || statFor(q) === {Unscored:'none', Draft:'draft', Scored:'scored'}[k]).length;

    const rows = list.map((r, idx) => {
      const m = STATUS[r.st];
      const sc = r.st === 'none' ? '—' : String(r.total);
      return {
        name:r.q.name, track:r.q.track, subs:r.q.subs + ' of 2', updated:r.q.updated,
        subLine:(narrow ? r.q.track + ' · ' : '') + r.q.subs + '/2 SUBMITTED' + (narrow ? ' · ' + r.q.updated : ''),
        subsColor: r.q.subs >= 2 ? MUTE : CLAY,
        chipLabel:m.label,
        chipDot:'width:7px;height:7px;flex:none;border:1px solid ' + m.border + ';background:' + m.fill,
        chipText:'font-size:12px;white-space:nowrap;color:' + m.c,
        score:sc, scoreSuffix: r.st === 'none' ? '' : '/100',
        scoreColor: r.st === 'none' ? DIM : r.st === 'draft' ? STEEL : TXT,
        action: r.st === 'scored' ? 'View' : r.st === 'draft' ? 'Resume' : 'Score',
        actionStyle:'padding:8px 14px;font-size:12px;font-weight:500;white-space:nowrap;background:transparent;cursor:pointer;transition:all .25s;border-radius:2px;border:1px solid ' +
          (r.st === 'scored' ? 'rgba(179,224,242,.16)' : 'rgba(179,224,242,.3)') + ';color:' + (r.st === 'scored' ? MUTE : ICE),
        rowStyle:'display:grid;grid-template-columns:' + listCols + ';padding:0 ' + (phone ? '14px' : '20px') +
          ';border-bottom:1px solid rgba(179,224,242,.06);cursor:pointer;transition:background .2s;animation:rise .4s ease-out ' + (idx*0.04) + 's both',
        open: () => this.setState({view:'detail', idx:r.i, modal:false})
      };
    });

    const statDefs = [
      {label:'Assigned to you', n:this.props.progress?.assigned || 0, unit:'squads', note:'Assigned for review'},
      {label:'Scored', n:this.props.progress?.scored || 0, unit:'final', note:'Locked and visible to admins'},
      {label:'In progress', n:this.props.progress?.drafts || 0, unit:'drafts', note:'Not yet submitted'},
      {label:'Not started', n:Math.max(0, (this.props.progress?.assigned || 0) - ((this.props.progress?.scored || 0) + (this.props.progress?.drafts || 0))), unit:'squads', note:'No rubric entered'}
    ];

    // ── detail ────────────────────────────────────────────
    const q = this.sq();
    const name = q.name;
    const vals = this.vals(name);
    const locked = !!s.locked[name];
    const attempted = !!s.attempted[name];
    const prPts = q.prPts;

    const errFor = c => {
      const v = vals[c.k];
      if (v !== '' && v !== undefined && Number(v) > c.max) return 'Above the maximum — ' + c.max + ' is the highest score for this criterion.';
      if (v !== '' && v !== undefined && Number(v) < 0) return 'Cannot be negative.';
      if (attempted && (v === '' || v === undefined)) return 'Required before a final score can be submitted.';
      return '';
    };
    const overMax = CRIT.some(c => vals[c.k] !== '' && vals[c.k] !== undefined && Number(vals[c.k]) > c.max);
    const blanks = CRIT.filter(c => vals[c.k] === '' || vals[c.k] === undefined).length;

    const criteria = CRIT.map((c, i) => {
      const raw = vals[c.k];
      const v = raw === undefined ? '' : String(raw);
      const err = errFor(c);
      const pct = Math.max(0, Math.min(100, (Number(raw) || 0) / c.max * 100));
      return {
        key:c.k, name:c.name, hint:c.hint, max:String(c.max), value:v,
        hasError:!!err, error:err,
        comment:(s.comments[name] || {})[c.k] || '',
        commentPlaceholder:'Optional note on ' + c.name.split(' ')[0].toLowerCase() + ' — shared with the squad',
        wrapStyle:'padding:' + (i === 0 ? '0' : '24px') + ' 0 24px;border-bottom:' + (i === CRIT.length-1 ? 'none' : '1px solid rgba(179,224,242,.07)') +
          ';animation:rise .4s ease-out ' + (i*0.05) + 's both',
        inputStyle:'width:88px;text-align:right;background:' + (locked ? 'rgba(11,21,25,.5)' : '#0B1519') + ';border:1px solid ' +
          (err ? 'rgba(194,86,75,.6)' : 'rgba(179,224,242,.16)') + ';color:' + (locked ? MUTE : TXT) +
          ";padding:12px 13px;font-size:16px;font-family:'JetBrains Mono',monospace;outline:none;border-radius:2px;transition:border-color .25s" + (locked ? ';cursor:default' : ''),
        meterStyle:'height:100%;background:' + (err ? CLAY : STEEL) + ';transition:width .5s cubic-bezier(.22,1,.36,1);width:' + (on ? pct : 0) + '%',
        commentStyle:'width:100%;margin-top:14px;background:' + (locked ? 'rgba(11,21,25,.5)' : '#0B1519') + ';border:1px solid rgba(179,224,242,.10);color:' +
          (locked ? MUTE : TXT) + ';padding:11px 13px;font-size:12.5px;outline:none;border-radius:2px;transition:border-color .25s',
        onScore: e => this.setScore(name, c.k, e.target.value),
        onComment: e => this.setComment(name, c.k, e.target.value)
      };
    });

    const total = CRIT.reduce((a,c) => a + (Number(vals[c.k]) || 0), 0);
    const filled = 5 - blanks;
    const fb = s.feedback[name] || '';
    const prOk = prState === 'ready';

    const subsArray = (q._subs && q._subs.length > 0) ? q._subs : [null];
    const weeks = subsArray.map((sub, i) => {
      const submitted = !!sub;
      const late = false;
      const chipByStatus = {
        pending:  {label:'Pending',  c:STEEL,   fill:'transparent', border:STEEL},
        accepted: {label:'Accepted', c:MOSS_LT, fill:MOSS_LT,       border:MOSS_LT},
        scored:   {label:'Scored',   c:ICE,     fill:ICE,           border:ICE},
        rejected: {label:'Rejected', c:CLAY,    fill:'transparent', border:CLAY},
      };
      const chip = !submitted
        ? {label:'Not submitted', c:DIM, fill:'transparent', border:DIM}
        : (chipByStatus[sub.status] || chipByStatus.pending);
        
      const demoUrl = sub?.deployed_url || '';
      const demoHost = demoUrl ? demoUrl.replace(/^https?:\/\//, '') : '';
      const repoUrl = sub?.pr_url || '';
      const repoHost = repoUrl ? repoUrl.replace(/^https?:\/\//, '') : '';

      return {
        label:'SUBMISSION', title:sub?.track_id || q.track || 'Submission', submitted, missing:!submitted,
        repo:repoHost,
        repoUrl:repoUrl,
        demo:demoHost,
        demoUrl:demoUrl,
        notes:sub?.app_notes || '', 
        at: sub ? new Date(sub.created_at).toLocaleString('en-GB', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'}) : 'PENDING', 
        lateBy:'',
        lateStyle: 'display:none',
        chipLabel:chip.label,
        chipDot:'width:7px;height:7px;flex:none;border:1px solid ' + chip.border + ';background:' + chip.fill,
        chipText:'font-size:12px;white-space:nowrap;color:' + chip.c,
        cardStyle:PANEL + ';display:flex;flex-direction:column;transition:border-color .3s,transform .3s;animation:rise .45s ease-out ' + (0.06 + i*0.07) +
          's both;padding:' + (phone ? '20px 18px' : '24px 22px') + (submitted ? '' : ';border-style:solid')
      };
    });

    const prRows = PRS.slice(0, q.prTotal).map((p, i) => {
      const col = p.state === 'Merged' ? MOSS_LT : p.state === 'Open' ? ICE : DIM;
      return {
        title:p.title, author:p.author, state:p.state, files:p.files + ' files', merged:p.merged,
        subLine:'#' + p.num + (narrow ? ' · ' + p.author.toUpperCase() : '') + (phone ? ' · ' + p.files + ' FILES' : ''),
        points: p.pts === null ? '—' : '+' + p.pts,
        ptsColor: p.pts ? MOSS_LT : DIM,
        stateDot:'width:7px;height:7px;flex:none;border:1px solid ' + col + ';background:' + (p.state === 'Merged' ? col : 'transparent'),
        stateText:'font-size:12px;color:' + col,
        rowStyle:'display:grid;grid-template-columns:' + prCols + ';gap:0;border-bottom:1px solid rgba(179,224,242,.06);transition:background .2s;animation:rise .4s ease-out ' + (i*0.05) + 's both'
      };
    });

    const validate = () => {
      if (overMax || blanks > 0 || fb.trim().length < 40){
        const a = Object.assign({}, s.attempted); a[name] = true;
        this.setState({attempted:a});
        this.toast('Cannot submit yet', 'Fix the highlighted fields, then submit again.');
        return false;
      }
      return true;
    };

    return {
      heroTitle: (() => {
        const total = this.props.progress?.assigned || 0;
        const left = Math.max(0, total - (this.props.progress?.scored || 0));
        if (!total) return 'No squads in your queue yet.';
        return left === 0
          ? 'Every squad in your queue is scored.'
          : left + (left === 1 ? ' squad still needs' : ' squads still need') + ' a final score.';
      })(),
      heroBody: 'Drafts stay private to you. Submitting a final score locks the rubric and makes it visible to admins.',
      scopeNote: (this.props.progress?.assigned || 0) + ' squads are in your review queue.',
      signOut: () => this.props.onSignOut && this.props.onSignOut(),
      L, isPhone:phone,
      isList: view === 'list', isDetail: view === 'detail', isDenied: view === 'denied', notDenied: view !== 'denied',
      progressStyle:'height:100%;background:' + ICE + ';box-shadow:0 0 12px rgba(179,224,242,.5);transition:width 1.1s cubic-bezier(.22,1,.36,1) .2s;width:' + (on ? `${this.props.progress?.assigned ? Math.round(((this.props.progress.scored || 0) / this.props.progress.assigned) * 100) : 0}%` : '0%'),

      stats:statDefs.map((d, i) => ({
        label:d.label, value:count(d.n), unit:d.unit, note:d.note,
        numStyle:"font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:" + (phone ? '32px' : '40px') + ';line-height:1;color:' +
          (i === 1 ? MOSS_LT : i === 3 ? CLAY : TXT) + ';font-variant-numeric:tabular-nums',
        cellStyle:'padding:' + (phone ? '18px 16px' : '22px 24px') + ';transition:background .25s;border-right:' +
          ((phone && i % 2 === 1) || i === 3 ? 'none' : '1px solid rgba(179,224,242,.12)') +
          (phone && i < 2 ? ';border-bottom:1px solid rgba(179,224,242,.12)' : '') + ';animation:rise .45s ease-out ' + (0.1 + i*0.06) + 's both'
      })),

      search:s.search,
      onSearch: e => this.setState({search:e.target.value}),
      sort:s.sort,
      onSort: e => this.setState({sort:e.target.value}),
      tabs:['All','Unscored','Draft','Scored'].map(k => ({
        label:k, count:String(tabCount(k)),
        go: () => this.setState({tab:k}),
        style:'display:flex;align-items:center;gap:7px;padding:11px ' + (phone ? '11px' : '15px') + ';font-size:12.5px;font-weight:500;white-space:nowrap;border:none;cursor:pointer;transition:all .25s;background:' +
          (s.tab === k ? 'rgba(179,224,242,.12)' : 'transparent') + ';color:' + (s.tab === k ? ICE : DIM) + ';flex:' + (phone ? '1' : 'none'),
        countStyle:MONO + ';font-size:10px;color:' + (s.tab === k ? ICE : '#3d5560')
      })),
      cols:[['Squad','left'],['Track','left'],['Subs','left'],['Status','left'],['Your score','right'],['Last updated','left'],['Action','right']].map(([label, al], i) => ({
        label,
        style:MONO + ';font-size:10px;letter-spacing:.16em;color:' + DIM + ';padding:14px 8px;text-align:' + al +
          (al === 'right' ? ';justify-self:end' : '') +
          (((narrow && (i === 1 || i === 5)) || (phone && (i === 2 || i === 6))) ? ';display:none' : '')
      })),
      rows, hasRows: rows.length > 0, showEmpty: rows.length === 0,
      emptyTitle: emptyAssignments ? 'No squads assigned yet' : 'Nothing matches this filter',
      emptyBody: emptyAssignments
        ? 'No squads assigned yet — contact an admin. Assignments are made from the admin console and appear here immediately.'
        : 'No squad in your assignment list matches “' + (s.search || s.tab) + '”. Clear the filters to see all 20.',
      emptyBtn: emptyAssignments ? 'Contact an admin' : 'Clear filters',
      emptyBtnStyle:'margin-top:22px;padding:11px 20px;font-size:13px;font-weight:500;background:transparent;border:1px solid rgba(179,224,242,.24);color:' + MUTE + ';cursor:pointer;border-radius:2px;transition:all .25s',
      clearFilters: () => this.setState({search:'', tab:'All'}),
      pagerText:'SHOWING ' + rows.length + ' OF ' + (this.props.progress?.assigned || 0) + ' ASSIGNED',
      openNextUnscored: () => {
        const i = SQUADS.findIndex(x => statFor(x) === 'none');
        this.setState({view:'detail', idx: i < 0 ? 0 : i});
      },

      backToList: () => this.setState({view:'list'}),
      prevSquad: () => this.setState({idx:(s.idx + SQUADS.length - 1) % SQUADS.length, modal:false}),
      nextSquad: () => this.setState({idx:(s.idx + 1) % SQUADS.length, modal:false}),

      detail:{
        name, track:q.track, teamId:'t_' + (1040 + s.idx),
        position:String(s.idx + 1).padStart(2,'0') + ' / ' + (this.props.progress?.assigned || 0),
        subsMeta:q.subs + ' SUBMISSION(S)',
        statusMeta: locked ? 'FINAL · ' + s.locked[name] : (statFor(q) === 'draft' ? 'DRAFT SAVED ' + q.updated : 'NO RUBRIC ENTERED'),
        chipLabel:STATUS[statFor(q)].label,
        chipColor:STATUS[statFor(q)].c,
        chipDot:'width:9px;height:9px;flex:none;border:1px solid ' + STATUS[statFor(q)].border + ';background:' + STATUS[statFor(q)].fill,
        members:q.members.map(([n, role]) => ({
          name:n, role: role ? ' · ' + role : '',
          roleStyle:MONO + ';font-size:9px;letter-spacing:.12em;color:' + ICE,
          style:MONO + ';font-size:11.5px;padding:5px 10px;border:1px solid rgba(179,224,242,.14);color:' + (role ? TXT : MUTE) + ';border-radius:2px;background:rgba(11,21,25,.6)'
        })),
        weeks
      },

      prStates:['ready','loading','error'].map(k => ({
        label:k.toUpperCase(),
        go: () => this.setState({prState:k}),
        style:MONO + ';font-size:9px;letter-spacing:.12em;padding:5px 9px;cursor:pointer;background:transparent;transition:all .25s;border:1px solid ' +
          (prState === k ? 'rgba(179,224,242,.45)' : 'rgba(179,224,242,.12)') + ';color:' + (prState === k ? ICE : '#3d5560')
      })),
      prReady:prOk, prLoading:prState === 'loading', prError:prState === 'error',
      prRows, prPoints:String(prPts), prMergedCount:String(q.prMerged), prTotalCount:String(q.prTotal),
      prRetry: () => { this.setState({prState:'loading'}); setTimeout(() => this.setState({prState:'ready'}), 1600); },
      skeletons:[0,1,2,3].map(i => ({
        w1:(58 - i*6) + '%',
        style:'display:flex;align-items:center;justify-content:space-between;gap:20px;padding:15px 0;border-bottom:1px solid rgba(179,224,242,.06);animation:shimmer 1.5s ease-in-out ' + (i*0.15) + 's infinite'
      })),

      locked, lockedAt: s.locked[name] || '',
      requestUnlock: () => this.toast('Unlock requested', name + ' stays locked until an admin approves.'),
      criteria,
      total:String(total), filledCount:String(filled),
      totalColor: total >= 80 ? MOSS_LT : total >= 50 ? TXT : STEEL,
      totalBarStyle:'height:100%;background:linear-gradient(90deg,' + STEEL + ',' + ICE + ');transition:width .5s cubic-bezier(.22,1,.36,1);width:' + (on ? Math.min(100, total) : 0) + '%',
      prPointsDisplay: prOk ? '+' + prPts : '—',
      prPtsColor: prOk ? MOSS_LT : DIM,
      prNote: prOk ? 'READ-ONLY · FROM PREVALUATOR' : prState === 'loading' ? 'WAITING ON PREVALUATOR' : 'UNAVAILABLE · GITHUB UNREACHABLE',
      combined:String(total + (prOk ? prPts : 0)),
      feedback:fb,
      onFeedback: e => { const f = Object.assign({}, s.feedback); f[name] = e.target.value; this.setState({feedback:f}); },
      fbCount:fb.trim().length + ' / 40',
      fbColor: fb.trim().length >= 40 ? MOSS_LT : attempted ? CLAY : DIM,

      showValidation: !locked && attempted && (overMax || blanks > 0 || fb.trim().length < 40),
      validationTitle: overMax ? 'One criterion is above its maximum' : blanks > 0 ? blanks + ' of 5 criteria are still blank' : 'Overall feedback is too short',
      validationBody: (overMax ? 'A criterion cannot exceed its cap. ' : '') + (blanks > 0 ? 'Every criterion needs a value before the score can be final. ' : '') +
        (fb.trim().length < 40 ? 'Overall feedback needs at least 40 characters. ' : '') + 'A draft can still be saved with any of these unresolved.',

      submitLabel: locked ? 'Score submitted' : 'Submit final score',
      submitStyle:'padding:14px 20px;font-size:13.5px;font-weight:500;border-radius:2px;transition:all .25s;border:1px solid ' +
        (locked ? 'rgba(179,224,242,.14)' : ICE) + ';background:' + (locked ? 'transparent' : ICE) + ';color:' + (locked ? DIM : '#080D0C') +
        ';cursor:' + (locked ? 'not-allowed' : 'pointer'),
      submitHover: locked ? '' : 'box-shadow:0 8px 24px rgba(179,224,242,.25);transform:translateY(-2px)',
      draftStyle:'padding:13px 20px;font-size:13px;font-weight:500;background:transparent;border:1px solid rgba(179,224,242,.24);color:' +
        (locked ? DIM : MUTE) + ';cursor:' + (locked ? 'not-allowed' : 'pointer') + ';border-radius:2px;transition:all .25s',
      resetStyle:'padding:13px 20px;font-size:13px;font-weight:500;background:transparent;border:1px solid rgba(179,224,242,.12);color:' +
        (locked ? DIM : '#7d8f95') + ';cursor:' + (locked ? 'not-allowed' : 'pointer') + ';border-radius:2px;transition:all .25s',
      actionNote: locked
        ? 'LOCKED · EDITS REQUIRE AN ADMIN UNLOCK'
        : 'DRAFTS ARE PRIVATE TO YOU · FINAL SCORES ARE VISIBLE TO ADMINS AND CANNOT BE EDITED',
      saveDraft: async () => {
        if (locked) return;
        const res = await this.props.onSaveScore({
          teamName: name, submissionId: q._submissionId, values: vals,
          comments: s.comments[name] || {}, feedback: fb, finalise: false,
        });
        if (!res.ok) return this.toast('Could not save draft', res.error);
        this.toast('Draft saved', name + ' · ' + total + '/100 · only you can see this.');
      },
      resetForm: () => {
        if (locked) return;
        const sc = Object.assign({}, s.scores), f = Object.assign({}, s.feedback), a = Object.assign({}, s.attempted);
        sc[name] = {}; f[name] = ''; a[name] = false;
        this.setState({scores:sc, feedback:f, attempted:a});
        this.toast('Form reset', 'All five criteria and the feedback field were cleared.');
      },
      submitFinal: () => { if (locked) return; if (validate()) this.setState({modal:true}); },

      modal:s.modal,
      closeModal: () => this.setState({modal:false}),
      modalKicker:'IRREVERSIBLE',
      modalTitle:'Submit a final score for ' + name + '?',
      modalBody:'Once submitted, every field on this rubric locks. The score becomes visible to admins and counts toward the leaderboard immediately. Reopening it requires an admin unlock, which is logged against your callsign.',
      modalRows:[
        {k:'RUBRIC TOTAL', v:total + ' / 100', color:TXT},
        {k:'MERGED PR POINTS', v: prOk ? '+' + prPts : 'unavailable', color: prOk ? MOSS_LT : DIM},
        {k:'COMBINED', v:String(total + (prOk ? prPts : 0)), color:ICE}
      ],
      confirmSubmit: async () => {
        const res = await this.props.onSaveScore({
          teamName: name, submissionId: q._submissionId, values: vals,
          comments: s.comments[name] || {}, feedback: fb, finalise: true,
        });
        if (!res.ok) { this.setState({modal:false}); return this.toast('Could not submit', res.error); }
        const lk = Object.assign({}, s.locked);
        lk[name] = new Date().toLocaleString('en-GB', {day:'2-digit', month:'short',
          year:'numeric', hour:'2-digit', minute:'2-digit'});
        this.setState({locked:lk, modal:false});
        this.toast('Score submitted', name + ' · ' + total + '/100 · locked and sent to admins.');
      },

      goDashboard: () => this.setState({view:'list'}),
      toast:s.toast, toastTitle:s.toastTitle,
      screens:[['list','Assigned list'],['detail','Squad detail'],['denied','Access denied']].map(([k, label]) => ({
        label,
        go: () => this.setState({view:k}),
        style:MONO + ';font-size:9px;letter-spacing:.12em;padding:5px 10px;cursor:pointer;background:transparent;transition:all .25s;border:1px solid ' +
          (view === k ? 'rgba(179,224,242,.4)' : 'rgba(179,224,242,.1)') + ';color:' + (view === k ? ICE : '#3d5560')
      }))
    };
  }

  render() {
    const V = this.renderVals();
    return (
      <div style={sx("min-height:100vh;background:#080D0C;color:#E4EEF2;position:relative;overflow-x:hidden")}>

        <div style={sx("position:fixed;inset:0;pointer-events:none;z-index:0;background-image:radial-gradient(rgba(93,145,166,.16) 1px,transparent 1px);background-size:26px 26px;opacity:.5")}></div>
        <div style={sx("position:fixed;top:-260px;left:-160px;width:820px;height:620px;pointer-events:none;z-index:0;background:radial-gradient(closest-side,rgba(93,145,166,.20),transparent);filter:blur(20px);animation:driftA 26s ease-in-out infinite")}></div>
        <div style={sx("position:fixed;top:-180px;right:-200px;width:720px;height:560px;pointer-events:none;z-index:0;background:radial-gradient(closest-side,rgba(71,115,70,.20),transparent);filter:blur(20px);animation:driftB 32s ease-in-out infinite")}></div>

        {(V.notDenied) ? <>
        <header style={sx("position:sticky;top:0;z-index:40;backdrop-filter:blur(14px);background:rgba(8,13,12,.88);border-bottom:1px solid rgba(179,224,242,.10);overflow:hidden")}>
          <div style={sx(V.L.headTop)}>
            <div style={sx("display:flex;align-items:center;gap:14px")}>
              <div style={sx("display:flex;align-items:center")}>
                <img src="/assets/rvce-transparent.png" alt="RVCE" style={sx(V.L.logoRvce)} />
                <img src="/assets/cc-transparent.png" alt="Coding Club" style={sx(V.L.logoClub)} />
              </div>
              <div style={sx("width:1px;height:30px;background:rgba(179,224,242,.14)")}></div>
              <div>
                <div style={sx(V.L.wordmark)}>CLONEFEST 2.0</div>
                <div style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.24em;color:#56707B;margin-top:5px")}>JUDGING CONSOLE</div>
              </div>
            </div>

            <div style={sx("flex:1")}></div>

            <div style={sx(V.L.hideNarrow)}>
              <div style={sx("min-width:230px;padding-right:22px;border-right:1px solid rgba(179,224,242,.14);margin-right:4px")}>
                <div style={sx("display:flex;align-items:baseline;justify-content:space-between;gap:10px")}>
                  <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.16em;color:#56707B")}>SCORING PROGRESS</span>
                  <span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#B3E0F2")}>{this.props.progress?.assigned ? Math.round(((this.props.progress.scored || 0) / this.props.progress.assigned) * 100) : 0}%</span>
                </div>
                <div style={sx("height:4px;background:rgba(179,224,242,.10);margin:8px 0 6px;overflow:hidden")}>
                  <div style={sx(V.progressStyle)}></div>
                </div>
                <div style={sx("font-size:11px;color:#8AA5AE")}>{this.props.progress?.scored || 0} of {this.props.progress?.assigned || 0} squads scored</div>
              </div>
            </div>

            <div style={sx("display:flex;align-items:center;gap:11px")}>
              <div style={sx(V.L.hidePhone)}>
                <div style={sx("text-align:right;line-height:1.35")}>
                  <div style={sx("display:flex;align-items:center;gap:8px;justify-content:flex-end")}>
                    <span style={sx("font-size:13px;font-weight:500;color:#E4EEF2")}>{this.judgeName()}</span>
                    <span style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.16em;padding:3px 7px;border:1px solid rgba(179,224,242,.45);color:#B3E0F2")}>JUDGE</span>
                  </div>
                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.16em;color:#56707B;margin-top:4px")}>ASSIGNED SQUADS ONLY</div>
                </div>
              </div>
              <div style={sx("width:34px;height:34px;background:#B3E0F2;color:#080D0C;display:grid;place-items:center;font-family:'Clash Grotesk',sans-serif;font-weight:600;font-size:13px;transition:transform .3s")} data-s="jp3">{this.judgeName().substring(0, 2).toUpperCase()}</div>
              <div style={sx(V.L.hidePhone)}>
                <button onClick={V.signOut} style={sx("padding:9px 16px;font-size:12px;font-weight:500;white-space:nowrap;background:transparent;cursor:pointer;transition:all .25s;border:1px solid rgba(179,224,242,.16);color:#8AA5AE;border-radius:2px")} data-s="jp4">Sign out</button>
              </div>
            </div>
          </div>

          <div style={sx(V.L.headPhoneProgress)}>
            <div style={sx("display:flex;align-items:baseline;justify-content:space-between;gap:10px")}>
              <span style={sx("font-size:11px;color:#8AA5AE")}>{this.props.progress?.scored || 0} of {this.props.progress?.assigned || 0} squads scored</span>
              <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;color:#B3E0F2")}>{this.props.progress?.assigned ? Math.round(((this.props.progress.scored || 0) / this.props.progress.assigned) * 100) : 0}%</span>
            </div>
            <div style={sx("height:4px;background:rgba(179,224,242,.10);margin-top:7px;overflow:hidden")}>
              <div style={sx(V.progressStyle)}></div>
            </div>
          </div>
          <div style={sx("position:absolute;bottom:0;left:0;height:1px;width:120px;background:linear-gradient(90deg,transparent,#B3E0F2,transparent);animation:sweep 9s ease-in-out infinite 2s")}></div>
        </header>
        </> : null}

  
        {(V.isList) ? <>
        <div style={sx(V.L.main)}>

          <div style={sx(V.L.hero)}>
            <div>
              <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.26em;color:#5D91A6;animation:rise .5s ease-out both")}>YOUR QUEUE · REVIEW WINDOW</div>
              <h1 style={sx(V.L.heroTitle)}>{V.heroTitle}</h1>
              <p style={sx("font-size:14px;line-height:1.7;color:#8AA5AE;margin:14px 0 0;max-width:540px;text-wrap:pretty;animation:rise .5s ease-out .16s both")}>Final scores lock on {this.props.settings?.submission_deadline ? new Date(this.props.settings.submission_deadline).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' IST' : '10 August at 18:00 IST'}. {V.heroBody}</p>
            </div>
            <div style={sx("display:flex;gap:10px;flex-wrap:wrap;animation:rise .5s ease-out .22s both")}>
              <button onClick={V.openNextUnscored} style={sx("padding:12px 20px;font-size:13px;font-weight:500;white-space:nowrap;background:#B3E0F2;border:1px solid #B3E0F2;color:#080D0C;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="jp5">Score next unscored squad</button>
            </div>
          </div>

          <div style={sx(V.L.statStrip)}>
            {(V.stats || []).map((s, _i1) => <React.Fragment key={_i1}>
              <div style={sx(s.cellStyle)} data-s="jp6">
                <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B;text-transform:uppercase")}>{s.label}</div>
                <div style={sx("display:flex;align-items:baseline;gap:6px;margin:16px 0 10px")}>
                  <span style={sx(s.numStyle)}>{s.value}</span>
                  <span style={sx("font-family:'Clash Grotesk',sans-serif;font-size:15px;color:#56707B")}>{s.unit}</span>
                </div>
                <div style={sx("font-size:12px;color:#8AA5AE")}>{s.note}</div>
              </div>
            </React.Fragment>)}
          </div>

          <div style={sx(V.L.scopeNote)}>
            <span style={sx("width:22px;height:22px;flex:none;border:1px solid rgba(93,145,166,.5);color:#5D91A6;display:grid;place-items:center;font-size:11px")}>⌷</span>
            <div style={sx("flex:1;min-width:220px")}>
              <span style={sx("font-size:13px;color:#E4EEF2")}>{V.scopeNote}</span>
              <span style={sx("font-size:13px;color:#8AA5AE")}> Squads outside your assignment list, other judges' scores, and the combined leaderboard are not visible from this console.</span>
            </div>
            <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#56707B;white-space:nowrap")}>judge_assignment · {this.judgeName()}</span>
          </div>

          <div style={sx(V.L.panelFlush)}>
            <div style={sx(V.L.filterBar)}>
              <div style={sx(V.L.searchCell)}>
                <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>SEARCH</label>
                <input value={V.search} onChange={V.onSearch} placeholder="Squad name" style={sx("width:100%;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:11px 13px;font-size:13px;outline:none;border-radius:2px;transition:border-color .25s")} data-s="jp7" />
              </div>
              <div style={sx(V.L.tabsCell)}>
                <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>FILTER</label>
                <div style={sx("display:flex;gap:0;border:1px solid rgba(179,224,242,.14);border-radius:2px;overflow:hidden")}>
                  {(V.tabs || []).map((t, _i1) => <React.Fragment key={_i1}>
                    <button onClick={t.go} style={sx(t.style)}>{t.label}<span style={sx(t.countStyle)}>{t.count}</span></button>
                  </React.Fragment>)}
                </div>
              </div>
              <div style={sx(V.L.sortCell)}>
                <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>SORT</label>
                <div style={sx("position:relative")}>
                  <select value={V.sort} onChange={V.onSort} style={sx("width:100%;appearance:none;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:11px 28px 11px 13px;font-size:13px;outline:none;cursor:pointer;border-radius:2px")}>
                    <option value="status">Status</option>
                    <option value="score">Score</option>
                    <option value="updated">Last updated</option>
                  </select>
                  <span style={sx("position:absolute;right:11px;top:50%;transform:translateY(-50%);pointer-events:none;color:#56707B;font-size:9px")}>▼</span>
                </div>
              </div>
            </div>

            {(V.hasRows) ? <>
              <div style={sx("overflow-x:auto")}>
                <div style={sx(V.L.tableMin)}>
                  <div style={sx(V.L.rowHead)}>
                    {(V.cols || []).map((c, _i2) => <React.Fragment key={_i2}>
                      <div style={sx(c.style)}>{c.label}</div>
                    </React.Fragment>)}
                  </div>
                  {(V.rows || []).map((r, _i2) => <React.Fragment key={_i2}>
                    <div style={sx(r.rowStyle)} onClick={r.open} data-s="jp8">
                      <div style={sx("padding:15px 8px;min-width:0")}>
                        <div style={sx("font-family:'JetBrains Mono',monospace;font-size:13px;color:#E4EEF2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{r.name}</div>
                        <div style={sx(V.L.subLine)}>{r.subLine}</div>
                      </div>
                      <div style={sx(V.L.cellTrack)}>{r.track}</div>
                      <div style={sx(V.L.cellSubs)}>
                        <span style={sx(`font-family:'JetBrains Mono',monospace;font-size:12px;color:${r.subsColor}`)}>{r.subs}</span>
                      </div>
                      <div style={sx("padding:15px 8px;display:flex;align-items:center;gap:8px;min-width:0")}>
                        <span style={sx(r.chipDot)}></span>
                        <span style={sx(r.chipText)}>{r.chipLabel}</span>
                      </div>
                      <div style={sx("padding:15px 8px;display:flex;align-items:center;justify-content:flex-end;gap:3px")}>
                        <span style={sx(`font-family:'Clash Grotesk',sans-serif;font-size:17px;color:${r.scoreColor};font-variant-numeric:tabular-nums`)}>{r.score}</span>
                        <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;color:#56707B")}>{r.scoreSuffix}</span>
                      </div>
                      <div style={sx(V.L.cellUpdated)}>{r.updated}</div>
                      <div style={sx(V.L.cellAction)}>
                        <button onClick={r.open} style={sx(r.actionStyle)} data-s="jp9">{r.action}</button>
                      </div>
                    </div>
                  </React.Fragment>)}
                </div>
              </div>
              <div style={sx(V.L.pager)}>
                <span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56707B")}>{V.pagerText}</span>
                <div style={sx("display:flex;gap:8px")}>
                </div>
              </div>
            </> : null}

            {(V.showEmpty) ? <>
              <div style={sx("padding:70px 24px;text-align:center;animation:fade .4s ease-out both")}>
                <div style={sx("width:46px;height:46px;margin:0 auto;border:1px solid rgba(179,224,242,.22);display:grid;place-items:center;color:#56707B;font-size:16px")}>∅</div>
                <div style={sx("font-family:'Clash Grotesk',sans-serif;font-size:19px;color:#E4EEF2;margin-top:20px")}>{V.emptyTitle}</div>
                <div style={sx("font-size:13px;color:#8AA5AE;margin-top:8px;max-width:360px;margin-left:auto;margin-right:auto;text-wrap:pretty")}>{V.emptyBody}</div>
                <button onClick={V.clearFilters} style={sx(V.emptyBtnStyle)} data-s="jp11">{V.emptyBtn}</button>
              </div>
            </> : null}
          </div>
        </div>
        </> : null}

  
        {(V.isDetail) ? <>
        <div style={sx(V.L.main)}>

          <div style={sx(V.L.detailTop)}>
            <button onClick={V.backToList} style={sx("background:transparent;border:none;padding:0;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.16em;color:#5D91A6;transition:color .25s")} data-s="jp12">← BACK TO LIST</button>
            <div style={sx("flex:1")}></div>
            <div style={sx("display:flex;align-items:center;gap:8px")}>
              <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#56707B")}>{V.detail.position}</span>
              <button onClick={V.prevSquad} style={sx("padding:9px 15px;font-size:12px;font-weight:500;white-space:nowrap;background:transparent;border:1px solid rgba(179,224,242,.2);color:#8AA5AE;cursor:pointer;border-radius:2px;transition:all .25s")} data-s="jp13">← Previous squad</button>
              <button onClick={V.nextSquad} style={sx("padding:9px 15px;font-size:12px;font-weight:500;white-space:nowrap;background:transparent;border:1px solid rgba(179,224,242,.2);color:#8AA5AE;cursor:pointer;border-radius:2px;transition:all .25s")} data-s="jp14">Next squad →</button>
            </div>
          </div>

          <div style={sx(V.L.detailHead)}>
            <div>
              <div style={sx("display:flex;align-items:center;gap:12px;flex-wrap:wrap")}>
                <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.22em;color:#5D91A6")}>{V.detail.track}</span>
                <span style={sx("width:4px;height:4px;background:#2c4f5d")}></span>
                <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#56707B")}>ASSIGNED TO YOU</span>
              </div>
              <h1 style={sx(V.L.detailTitle)}>{V.detail.name}</h1>
              <div style={sx("display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:14px")}>
                <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.16em;color:#56707B;margin-right:2px")}>CALLSIGNS</span>
                {(V.detail.members || []).map((m, _i1) => <React.Fragment key={_i1}>
                  <span style={sx(m.style)}>{m.name}<span style={sx(m.roleStyle)}>{m.role}</span></span>
                </React.Fragment>)}
              </div>
            </div>
            <div style={sx(V.L.detailStatus)}>
              <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.16em;color:#56707B")}>YOUR STATUS</div>
              <div style={sx("display:flex;align-items:center;gap:9px;margin-top:12px")}>
                <span style={sx(V.detail.chipDot)}></span>
                <span style={sx(`font-family:'Clash Grotesk',sans-serif;font-size:18px;color:${V.detail.chipColor}`)}>{V.detail.chipLabel}</span>
              </div>
              <div style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56707B;margin-top:8px")}>{V.detail.statusMeta}</div>
            </div>
          </div>

          <div style={sx(V.L.sectionHead)}>
            <div>
              
              <h2 style={sx(V.L.h2)}>Submissions</h2>
            </div>
            <span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56707B")}>{V.detail.subsMeta}</span>
          </div>

          <div style={sx(V.L.weekGrid)}>
            {(V.detail.weeks || []).map((w, _i1) => <React.Fragment key={_i1}>
              <div style={sx(w.cardStyle)} data-s="jp15">
                <div style={sx("display:flex;align-items:center;justify-content:space-between;gap:10px")}>
                  <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.22em;color:#5D91A6")}>{w.label}</span>
                  <div style={sx("display:flex;align-items:center;gap:7px")}>
                    <span style={sx(w.chipDot)}></span>
                    <span style={sx(w.chipText)}>{w.chipLabel}</span>
                  </div>
                </div>
                <div style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:18px;color:#E4EEF2;margin-top:12px;line-height:1.3")}>{w.title}</div>

                {(w.submitted) ? <>
                  <div style={sx("display:flex;flex-direction:column;gap:8px;margin-top:18px")}>
                    <a href={w.repoUrl} target="_blank" rel="noopener noreferrer" style={sx("display:flex;align-items:center;gap:10px;padding:11px 13px;border:1px solid rgba(179,224,242,.14);background:#0B1519;border-radius:2px;transition:all .25s")} data-s="jp16">
                      <span style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;color:#56707B;width:46px;flex:none")}>REPO</span>
                      <span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#B3E0F2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1")}>{w.repo}</span>
                      <span style={sx("font-size:11px;color:#56707B;flex:none")}>↗</span>
                    </a>
                    <a href={w.demoUrl} target="_blank" rel="noopener noreferrer" style={sx("display:flex;align-items:center;gap:10px;padding:11px 13px;border:1px solid rgba(179,224,242,.14);background:#0B1519;border-radius:2px;transition:all .25s")} data-s="jp17">
                      <span style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;color:#56707B;width:46px;flex:none")}>DEMO</span>
                      <span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#B3E0F2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1")}>{w.demo}</span>
                      <span style={sx("font-size:11px;color:#56707B;flex:none")}>↗</span>
                    </a>
                  </div>
                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.16em;color:#56707B;margin:18px 0 7px")}>SQUAD NOTES</div>
                  <p style={sx("font-size:13px;line-height:1.65;color:#8AA5AE;margin:0;text-wrap:pretty")}>{w.notes}</p>
                  <div style={sx("flex:1")}></div>
                  <div style={sx("display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:20px;padding-top:14px;border-top:1px solid rgba(179,224,242,.08)")}>
                    <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;color:#56707B")}>SUBMITTED {w.at}</span>
                    <span style={sx(w.lateStyle)}>LATE · {w.lateBy}</span>
                  </div>
                </> : null}

                {(w.missing) ? <>
                  <div style={sx("margin-top:18px;border:1px dashed rgba(179,224,242,.20);background:rgba(8,13,12,.5);padding:22px 16px;text-align:center;border-radius:2px")}>
                    <div style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.2em;color:#56707B")}>NOT SUBMITTED</div>
                    <p style={sx("font-size:12px;line-height:1.6;color:#8AA5AE;margin:10px 0 0;text-wrap:pretty")}>Nothing was pushed before the deadline. Score this challenge on the rubric as delivered, or raise it with an admin if you believe an extension applies.</p>
                  </div>
                  <div style={sx("flex:1")}></div>
                  
                </> : null}
              </div>
            </React.Fragment>)}
          </div>

    
          <div style={sx(V.L.prPanel)}>
            <div style={sx("position:absolute;inset:0;background:linear-gradient(115deg,rgba(93,145,166,.12),transparent 55%);pointer-events:none")}></div>
            <div style={sx("position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap")}>
              <div>
                <div style={sx("display:flex;align-items:center;gap:10px")}>
                  <span style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:17px;letter-spacing:.04em;color:#E4EEF2")}>PREvaluator</span>
                  <span style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;padding:3px 7px;border:1px solid rgba(93,145,166,.45);color:#5D91A6")}>MOUNTED COMPONENT</span>
                </div>
                
              </div>
        
            </div>

            {(V.prReady) ? <>
              <div style={sx("position:relative;margin-top:22px")}>
                <div style={sx(V.L.prHead)}>
                  <div style={sx("padding:0 0 12px")}>PULL REQUEST</div>
                  <div style={sx(V.L.prHeadAuthor)}>AUTHOR</div>
                  <div style={sx("padding:0 0 12px")}>STATE</div>
                  <div style={sx(V.L.prHeadFiles)}>FILES</div>
                  <div style={sx(V.L.prHeadMerged)}>MERGED</div>
                  <div style={sx("padding:0 0 12px;text-align:right")}>POINTS</div>
                </div>
                {(V.prRows || []).map((p, _i2) => <React.Fragment key={_i2}>
                  <div style={sx(p.rowStyle)} data-s="jp18">
                    <div style={sx("padding:13px 0;min-width:0")}>
                      <div style={sx("font-size:13px;color:#E4EEF2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{p.title}</div>
                      <div style={sx(V.L.subLine)}>{p.subLine}</div>
                    </div>
                    <div style={sx(V.L.prCellAuthor)}>{p.author}</div>
                    <div style={sx("padding:13px 0;display:flex;align-items:center;gap:7px;min-width:0")}>
                      <span style={sx(p.stateDot)}></span>
                      <span style={sx(p.stateText)}>{p.state}</span>
                    </div>
                    <div style={sx(V.L.prCellFiles)}>{p.files}</div>
                    <div style={sx(V.L.prCellMerged)}>{p.merged}</div>
                    <div style={sx(`padding:13px 0;text-align:right;font-family:'Clash Grotesk',sans-serif;font-size:16px;color:${p.ptsColor};font-variant-numeric:tabular-nums`)}>{p.points}</div>
                  </div>
                </React.Fragment>)}
                <div style={sx(V.L.prSubtotal)}>
                  <div>
                    <div style={sx("font-size:13px;color:#E4EEF2")}>Merged PR subtotal</div>
                    <div style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56707B;margin-top:5px")}>{V.prMergedCount} merged of {V.prTotalCount} · carried into the rubric read-only</div>
                  </div>
                  <div style={sx("display:flex;align-items:baseline;gap:5px")}>
                    <span style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:32px;color:#7FB27E;font-variant-numeric:tabular-nums")}>{V.prPoints}</span>
                    <span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56707B")}>PTS</span>
                  </div>
                </div>
              </div>
            </> : null}

            {(V.prLoading) ? <>
              <div style={sx("position:relative;margin-top:22px")}>
                <div style={sx("display:flex;align-items:center;gap:12px;padding-bottom:18px")}>
                  <span style={sx("width:15px;height:15px;border:2px solid rgba(179,224,242,.2);border-top-color:#B3E0F2;border-radius:50%;animation:spin .8s linear infinite;flex:none")}></span>
                  <span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.14em;color:#8AA5AE")}>QUERYING GITHUB · rvce-cc/broken-canvas</span>
                </div>
                {(V.skeletons || []).map((k, _i2) => <React.Fragment key={_i2}>
                  <div style={sx(k.style)}>
                    <div style={sx(`height:11px;background:rgba(93,145,166,.22);width:${k.w1}`)}></div>
                    <div style={sx("height:11px;background:rgba(93,145,166,.14);width:60px")}></div>
                    <div style={sx("height:11px;background:rgba(93,145,166,.14);width:44px")}></div>
                  </div>
                </React.Fragment>)}
              </div>
            </> : null}

            {(V.prError) ? <>
              <div style={sx("position:relative;margin-top:22px;border:1px solid rgba(194,86,75,.35);background:linear-gradient(90deg,rgba(194,86,75,.12),rgba(194,86,75,.02));padding:26px;border-radius:2px;animation:fade .3s ease-out both")}>
                <div style={sx("display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap")}>
                  <span style={sx("width:24px;height:24px;flex:none;border:1px solid rgba(194,86,75,.6);color:#C2564B;display:grid;place-items:center;font-size:12px;animation:breathe 2.6s infinite")}>!</span>
                  <div style={sx("flex:1;min-width:220px")}>
                    <div style={sx("font-family:'Clash Grotesk',sans-serif;font-size:17px;color:#E6A79E")}>Could not reach GitHub</div>
                    <p style={sx("font-size:13px;line-height:1.65;color:#8AA5AE;margin:8px 0 0;max-width:520px;text-wrap:pretty")}>The pull request list for this squad could not be fetched. Merged PR points are unavailable, so the combined total below shows the rubric score only. You can still save a draft or submit the rubric — PR points are recalculated server-side when the fetch succeeds.</p>
                    <div style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56707B;margin-top:12px")}>GET /repos/rvce-cc/broken-canvas/pulls → 503 · retried 3× · 14:07 IST</div>
                  </div>
                  <button onClick={V.prRetry} style={sx("padding:10px 16px;font-size:12px;font-weight:500;white-space:nowrap;background:transparent;border:1px solid rgba(194,86,75,.5);color:#C2564B;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="jp19">Retry fetch</button>
                </div>
              </div>
            </> : null}
          </div>

    
          <div style={sx(V.L.rubricHead)}>
            <div>
              <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.26em;color:#5D91A6")}>RUBRIC</div>
              <h2 style={sx(V.L.h2)}>Score {V.detail.name}</h2>
            </div>
            <span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56707B")}>5 CRITERIA · 100 POINTS</span>
          </div>

          {(V.locked) ? <>
            <div style={sx("border:1px solid rgba(127,178,126,.4);border-left:3px solid #7FB27E;background:linear-gradient(90deg,rgba(127,178,126,.12),rgba(127,178,126,.02));padding:18px 22px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;border-radius:2px;margin-bottom:20px;animation:rise .4s ease-out both")}>
              <span style={sx("width:26px;height:26px;flex:none;border:1px solid rgba(127,178,126,.6);color:#7FB27E;display:grid;place-items:center;font-size:13px")}>✓</span>
              <div style={sx("flex:1;min-width:230px")}>
                <div style={sx("font-family:'Clash Grotesk',sans-serif;font-size:17px;letter-spacing:.02em;color:#7FB27E")}>SCORED — this submission is locked</div>
                <div style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#8AA5AE;margin-top:6px")}>FINAL {V.lockedAt} · VISIBLE TO ADMINS · score.status = final</div>
              </div>
              <button onClick={V.requestUnlock} style={sx("padding:10px 17px;font-size:12px;font-weight:500;white-space:nowrap;background:transparent;border:1px solid rgba(179,224,242,.28);color:#B3E0F2;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="jp20">Request unlock</button>
            </div>
          </> : null}

          {(V.showValidation) ? <>
            <div style={sx("border:1px solid rgba(194,86,75,.35);border-left:3px solid #C2564B;background:linear-gradient(90deg,rgba(194,86,75,.13),rgba(194,86,75,.02));padding:16px 20px;display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap;border-radius:2px;margin-bottom:20px;animation:rise .3s ease-out both")}>
              <span style={sx("width:22px;height:22px;flex:none;border:1px solid rgba(194,86,75,.6);color:#C2564B;display:grid;place-items:center;font-size:11px")}>!</span>
              <div style={sx("flex:1;min-width:220px")}>
                <div style={sx("font-size:13px;font-weight:500;color:#E6A79E")}>{V.validationTitle}</div>
                <div style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#8AA5AE;margin-top:5px")}>{V.validationBody}</div>
              </div>
            </div>
          </> : null}

          <div style={sx(V.L.rubricGrid)}>
            <div style={sx(V.L.panel)}>
              {(V.criteria || []).map((c, _i1) => <React.Fragment key={_i1}>
                <div style={sx(c.wrapStyle)}>
                  <div style={sx(V.L.critRow)}>
                    <div style={sx("min-width:0")}>
                      <div style={sx("font-size:15px;font-weight:500;color:#E4EEF2")}>{c.name}</div>
                      <div style={sx("font-size:12.5px;line-height:1.6;color:#8AA5AE;margin-top:6px;max-width:520px;text-wrap:pretty")}>{c.hint}</div>
                    </div>
                    <div style={sx("display:flex;align-items:center;gap:9px")}>
                      <input type="number" value={c.value} onChange={c.onScore} readOnly={V.locked} placeholder="—" min="0" max={c.max} style={sx(c.inputStyle)} data-s="jp21" />
                      <span style={sx("font-family:'JetBrains Mono',monospace;font-size:12px;color:#56707B;white-space:nowrap")}>/ {c.max}</span>
                    </div>
                  </div>
                  <div style={sx("height:3px;background:rgba(179,224,242,.08);margin-top:14px;overflow:hidden")}>
                    <div style={sx(c.meterStyle)}></div>
                  </div>
                  {(c.hasError) ? <>
                    <div style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#C2564B;margin-top:10px")}>{c.error}</div>
                  </> : null}
                  <input value={c.comment} onChange={c.onComment} readOnly={V.locked} placeholder={c.commentPlaceholder} style={sx(c.commentStyle)} data-s="jp22" />
                </div>
              </React.Fragment>)}

              <div style={sx("margin-top:26px")}>
                <label style={sx("display:block;margin-bottom:9px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>OVERALL FEEDBACK</label>
                <textarea value={V.feedback} onChange={V.onFeedback} readOnly={V.locked} placeholder="What should this squad take away from the marathon? Shared with the squad after results are published." rows="5" style={sx(V.L.textarea)} data-s="jp23"></textarea>
                <div style={sx("display:flex;justify-content:space-between;gap:12px;margin-top:8px")}>
                  <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;color:#56707B")}>MIN 40 CHARACTERS FOR A FINAL SCORE</span>
                  <span style={sx(`font-family:'JetBrains Mono',monospace;font-size:10px;color:${V.fbColor}`)}>{V.fbCount}</span>
                </div>
              </div>
            </div>

            <div style={sx(V.L.totalsCol)}>
              <div style={sx(V.L.totalsPanel)}>
                <div style={sx("position:absolute;inset:0;background:linear-gradient(160deg,rgba(93,145,166,.16),transparent 60%);pointer-events:none")}></div>
                <div style={sx("position:relative")}>
                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>RUBRIC TOTAL</div>
                  <div style={sx("display:flex;align-items:baseline;gap:6px;margin:14px 0 12px")}>
                    <span style={sx(`font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:52px;line-height:1;color:${V.totalColor};font-variant-numeric:tabular-nums`)}>{V.total}</span>
                    <span style={sx("font-family:'Clash Grotesk',sans-serif;font-size:20px;color:#56707B")}>/ 100</span>
                  </div>
                  <div style={sx("height:8px;background:rgba(179,224,242,.08);overflow:hidden")}>
                    <div style={sx(V.totalBarStyle)}></div>
                  </div>
                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#56707B;margin-top:10px")}>{V.filledCount} OF 5 CRITERIA ENTERED</div>

                  <div style={sx("display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:22px;padding:14px 0;border-top:1px solid rgba(179,224,242,.10);border-bottom:1px solid rgba(179,224,242,.10)")}>
                    <div>
                      <div style={sx("font-size:12.5px;color:#8AA5AE")}>Merged PR points</div>
                      <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;color:#56707B;margin-top:4px")}>{V.prNote}</div>
                    </div>
                    <span style={sx(`font-family:'Clash Grotesk',sans-serif;font-size:24px;color:${V.prPtsColor};font-variant-numeric:tabular-nums`)}>{V.prPointsDisplay}</span>
                  </div>

                  <div style={sx("display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-top:16px")}>
                    <div>
                      <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>COMBINED TOTAL</div>
                      <div style={sx("font-size:12px;color:#8AA5AE;margin-top:6px")}>Rubric + canvas repo</div>
                    </div>
                    <span style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:34px;color:#B3E0F2;font-variant-numeric:tabular-nums")}>{V.combined}</span>
                  </div>
                </div>
              </div>

              <div style={sx(V.L.actionsBox)}>
                <button onClick={V.submitFinal} style={sx(V.submitStyle)} data-s="jp24">{V.submitLabel}</button>
                {!V.locked ? <><button onClick={V.saveDraft} style={sx(V.draftStyle)} data-s="jp25">Save draft</button>
                <button onClick={V.resetForm} style={sx(V.resetStyle)} data-s="jp26">Reset form</button></> : null}
                <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.7;color:#56707B;margin-top:4px")}>{V.actionNote}</div>
              </div>
            </div>
          </div>
        </div>
        </> : null}

  
        {(V.isDenied) ? <>
        <div style={sx(V.L.deniedWrap)}>
          <div style={sx(V.L.deniedCard)}>
            <div style={sx("position:absolute;inset:0;background:linear-gradient(150deg,rgba(194,86,75,.12),transparent 60%);pointer-events:none")}></div>
            <div style={sx("position:relative")}>
              <div style={sx("display:flex;align-items:center;gap:12px")}>
                <span style={sx("width:30px;height:30px;flex:none;border:1px solid rgba(194,86,75,.55);color:#C2564B;display:grid;place-items:center;font-size:13px;animation:breathe 2.8s infinite")}>⊘</span>
                <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.26em;color:#C2564B")}>403 · ROLE MISMATCH</span>
              </div>
              <h1 style={sx(V.L.deniedTitle)}>Access denied.</h1>
              <p style={sx("font-size:14px;line-height:1.75;color:#8AA5AE;margin:16px 0 0;max-width:440px;text-wrap:pretty")}>The judging console is limited to accounts carrying the judge role. Your account is signed in as a hacker, so scoring, assigned squads, and rubric data are not available to you.</p>
              <div style={sx("margin-top:24px;padding:16px 18px;border:1px solid rgba(179,224,242,.10);background:#0B1519;border-radius:2px;display:grid;gap:9px")}>
                <div style={sx("display:flex;justify-content:space-between;gap:14px")}><span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#56707B")}>SIGNED IN AS</span><span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#E4EEF2")}>ax0lotl</span></div>
                <div style={sx("display:flex;justify-content:space-between;gap:14px")}><span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#56707B")}>ROLE</span><span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#8AA5AE")}>hacker · member</span></div>
                <div style={sx("display:flex;justify-content:space-between;gap:14px")}><span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#56707B")}>SQUAD</span><span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#8AA5AE")}>NULL_POINTER</span></div>
              </div>
              <div style={sx("display:flex;gap:10px;flex-wrap:wrap;margin-top:26px")}>
                <button onClick={V.goDashboard} style={sx("padding:13px 22px;font-size:13px;font-weight:500;white-space:nowrap;background:#B3E0F2;border:1px solid #B3E0F2;color:#080D0C;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="jp27">Return to dashboard</button>
              </div>
              <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;color:#56707B;margin-top:22px")}>IF THIS IS WRONG, ASK AN ADMIN TO GRANT THE JUDGE ROLE · REF 7F2A-403</div>
            </div>
          </div>
        </div>
        </> : null}

  
        {(V.modal) ? <>
          <div style={sx(V.L.overlay)} onClick={V.closeModal}>
            <div style={sx(V.L.modal)}>
              <div style={sx("position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#B3E0F2,rgba(179,224,242,0))")}></div>
              <div style={sx(V.L.modalPad)}>
                <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.24em;color:#B3E0F2")}>{V.modalKicker}</div>
                <h3 style={sx(V.L.modalTitle)}>{V.modalTitle}</h3>
                <p style={sx("font-size:13.5px;line-height:1.7;color:#8AA5AE;margin:14px 0 0;text-wrap:pretty")}>{V.modalBody}</p>
                <div style={sx("margin-top:20px;padding:16px 18px;border:1px solid rgba(179,224,242,.12);background:#0B1519;border-radius:2px;display:grid;gap:10px")}>
                  {(V.modalRows || []).map((m, _i1) => <React.Fragment key={_i1}>
                    <div style={sx("display:flex;align-items:center;justify-content:space-between;gap:14px")}>
                      <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#56707B")}>{m.k}</span>
                      <span style={sx(`font-family:'Clash Grotesk',sans-serif;font-size:16px;color:${m.color}`)}>{m.v}</span>
                    </div>
                  </React.Fragment>)}
                </div>
                <div style={sx("display:flex;gap:10px;flex-wrap:wrap;margin-top:24px")}>
                  <button onClick={V.confirmSubmit} style={sx("flex:1;min-width:150px;padding:13px 20px;font-size:13px;font-weight:500;background:#B3E0F2;border:1px solid #B3E0F2;color:#080D0C;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="jp28">Lock and submit</button>
                  <button onClick={V.closeModal} style={sx("padding:13px 20px;font-size:13px;font-weight:500;background:transparent;border:1px solid rgba(179,224,242,.2);color:#8AA5AE;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="jp29">Keep editing</button>
                </div>
              </div>
            </div>
          </div>
        </> : null}

        {(V.toast) ? <>
          <div style={sx(V.L.toast)}>
            <span style={sx("width:8px;height:8px;background:#7FB27E;flex:none")}></span>
            <div style={sx("flex:1")}>
              <div style={sx("font-size:13px;font-weight:500;color:#E4EEF2")}>{V.toastTitle}</div>
              <div style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#8AA5AE;margin-top:4px")}>{V.toast}</div>
            </div>
            <div style={sx("position:absolute;bottom:0;left:0;right:0;height:2px;background:#7FB27E;transform-origin:left;animation:sweepBar 4.6s linear both")}></div>
          </div>
        </> : null}

  
      </div>
    );
  }
}

/**
 * Live-data wrapper. The view above is the imported design; its squads, saved
 * rubrics and lock state now come from Supabase, and Save draft / Submit final
 * write to public.scores.
 */
export default function JudgePortal(props) {
  const { me, squads, progress, status, error, migrationMissing, saveScore, refetch } = useJudgeData();
  const { settings } = useEventData();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <>
      {migrationMissing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          background: 'rgba(194,86,75,.14)', borderBottom: '1px solid rgba(194,86,75,.5)',
          color: '#E6A79E', font: "500 11px/1.6 'JetBrains Mono', monospace",
          letterSpacing: '.14em', textTransform: 'uppercase', padding: '10px 16px',
          textAlign: 'center',
        }}>
          Scoring tables missing — apply supabase/patch_008_judging.sql to enable saving
        </div>
      )}
      <JudgePortalView
        {...props}
        me={me}
        onSignOut={handleSignOut}
        squads={squads}
        progress={progress}
        loading={status === 'loading'}
        error={status === 'error' ? error : null}
        onSaveScore={saveScore}
        onRefetch={refetch}
        me={me}
        settings={settings}
      />
    </>
  );
}

// Exported for the binding audit in scratch; not used by the app.
export { JudgePortalView };
