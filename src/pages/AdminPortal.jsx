import React, { useState, useEffect } from 'react';
import { sx } from '../lib/sx';
import { supabase } from '../lib/supabase';
import { useEventData, rankSquads, CLEARED } from '../hooks/useEventData';
import { EXPORTS, downloadCsv } from '../lib/csv';
import { useNavigate } from 'react-router-dom';
import './AdminPortal.css';

// ── Submission Timer Panel ────────────────────────────────────────────────────
// Standalone functional component so it can use React hooks.
function SubmissionTimerPanel() {
  const [deadline, setDeadline]     = useState('');
  const [open, setOpen]             = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [errMsg, setErrMsg]         = useState(null);
  const [loaded, setLoaded]         = useState(false);

  // Load current settings
  useEffect(() => {
    supabase
      .from('event_settings')
      .select('submission_deadline, submissions_open')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error('[AdminTimer] load error:', error); return; }
        if (data) {
          // Convert UTC timestamptz → local datetime-local value
          if (data.submission_deadline) {
            const d = new Date(data.submission_deadline);
            // datetime-local needs YYYY-MM-DDTHH:mm
            const pad = n => String(n).padStart(2, '0');
            const local = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            setDeadline(local);
          }
          setOpen(data.submissions_open ?? true);
        }
        setLoaded(true);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setErrMsg(null);
    const deadlineIso = deadline ? new Date(deadline).toISOString() : null;
    const { error } = await supabase
      .from('event_settings')
      .update({ submission_deadline: deadlineIso, submissions_open: open })
      .eq('id', 1);
    setSaving(false);
    if (error) { setErrMsg(error.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClear = async () => {
    setDeadline('');
    const { error } = await supabase
      .from('event_settings')
      .update({ submission_deadline: null })
      .eq('id', 1);
    if (error) setErrMsg(error.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  if (!loaded) return null;

  const MONO  = "font-family:'JetBrains Mono',monospace";
  const ICE   = '#B3E0F2', STEEL = '#5D91A6', DIM = '#56707B', TXT = '#E4EEF2';
  const CLAY  = '#C2564B', MOSS  = '#7FB27E';

  return (
    <div style={{ marginTop: 32, background: '#112026', border: '1px solid rgba(179,224,242,.14)', borderRadius: 3, overflow: 'hidden', animation: 'rise .45s ease-out .2s both' }}>
      {/* Header */}
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(179,224,242,.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: STEEL, marginBottom: 6 }}>SUBMISSION WINDOW</div>
          <div style={{ fontFamily: "'Clash Grotesk',sans-serif", fontWeight: 500, fontSize: 20, color: TXT }}>Timer Control</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, background: open ? MOSS : CLAY, borderRadius: '50%', display: 'inline-block', boxShadow: open ? `0 0 10px ${MOSS}88` : 'none' }} />
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: open ? MOSS : CLAY }}>
            {open ? 'Submissions open' : 'Submissions closed'}
          </span>
        </div>
      </div>

      <div style={{ padding: '20px 24px 24px', display: 'grid', gap: 20 }}>
        {/* Kill switch */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#0B1519', border: '1px solid rgba(179,224,242,.10)', borderRadius: 2 }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: DIM, marginBottom: 4 }}>KILL SWITCH</div>
            <div style={{ fontSize: 13, color: '#8AA5AE' }}>Force-close submissions regardless of deadline</div>
          </div>
          <button
            onClick={() => setOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 8px', background: 'transparent', cursor: 'pointer', transition: 'all .3s', borderRadius: 2, border: `1px solid ${open ? 'rgba(179,224,242,.4)' : 'rgba(194,86,75,.4)'}` }}
          >
            <span style={{ width: 20, height: 12, display: 'block', transition: 'all .3s cubic-bezier(.22,1,.36,1)', border: `1px solid ${open ? ICE : CLAY}`, background: open ? ICE : CLAY, boxShadow: open ? `0 0 12px rgba(179,224,242,.5)` : 'none' }} />
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.14em', transition: 'color .3s', color: open ? ICE : CLAY }}>{open ? 'OPEN' : 'CLOSED'}</span>
          </button>
        </div>

        {/* Deadline picker */}
        <div>
          <label style={{ display: 'block', fontFamily: MONO, fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: DIM, marginBottom: 8 }}>SUBMISSION DEADLINE</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="datetime-local"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              style={{ flex: 1, minWidth: 200, background: '#0B1519', border: '1px solid rgba(179,224,242,.15)', borderRadius: 2, padding: '11px 14px', fontFamily: MONO, fontSize: 13, color: TXT, outline: 'none', colorScheme: 'dark' }}
            />
            {deadline && (
              <button onClick={handleClear} style={{ padding: '11px 14px', background: 'transparent', border: `1px solid rgba(194,86,75,.35)`, borderRadius: 2, color: CLAY, fontFamily: MONO, fontSize: 10, letterSpacing: '.14em', cursor: 'pointer' }}>CLEAR</button>
            )}
          </div>
          <p style={{ fontFamily: MONO, fontSize: 9, color: '#2E4A54', letterSpacing: '.1em', marginTop: 6 }}>Set to local time — stored as UTC, synced in realtime to all hacker portals</p>
        </div>

        {/* Error */}
        {errMsg && (
          <div style={{ background: 'rgba(194,86,75,.1)', border: '1px solid rgba(194,86,75,.4)', borderLeft: `2px solid ${CLAY}`, borderRadius: 2, padding: '10px 14px' }}>
            <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: CLAY, marginBottom: 4 }}>Save failed</p>
            <p style={{ fontSize: 12.5, color: '#E6A79E', margin: 0 }}>{errMsg}</p>
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '13px 0', background: saved ? 'rgba(127,178,126,.15)' : ICE, color: saved ? MOSS : '#080D0C', border: `1px solid ${saved ? MOSS : ICE}`, borderRadius: 2, fontFamily: "'Satoshi',sans-serif", fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.65 : 1, transition: 'all .25s', letterSpacing: '.02em' }}
        >
          {saving ? 'Saving…' : saved ? '✓ Settings saved — hackers see this instantly' : 'Save timer settings'}
        </button>
      </div>
    </div>
  );
}

const ICE = '#B3E0F2', STEEL = '#5D91A6', MOSS_LT = '#7FB27E',
      CLAY = '#C2564B', TXT = '#E4EEF2', MUTE = '#8AA5AE', DIM = '#56707B';

const CHIP = {
  none:     {label:'Not submitted', c:DIM,     fill:'transparent', border:DIM},
  pending:  {label:'Pending',       c:STEEL,   fill:'transparent', border:STEEL},
  accepted: {label:'Accepted',      c:MOSS_LT, fill:MOSS_LT,       border:MOSS_LT},
  rejected: {label:'Rejected',      c:CLAY,    fill:CLAY,          border:CLAY},
  scored:   {label:'Scored',        c:ICE,     fill:ICE,           border:ICE}
};

const SQUADS_FALLBACK = [
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

class AdminPortalView extends React.Component {

  state = {
    section:'overview', stateOverride:null, expanded:'GHOST_IN_SHELL',
    modal:null, confirm:null, toast:null, toastTitle:'', banner:true,
    search:'', bodyLen:0, pinned:true, tick:0,
    annTitle:'', annBody:'', annAudience:'all', judgeId:'', assignSquadName:'',
    picked:{},
    locks:{1:false,2:false},
    trackFilter:'all', statusFilter:'Any status', judgeFilter:'All judges', sortFilter:'Score · high to low',
    page: 1, pageSize: 25,
    trackEditId: null, trackEditTitle: '', trackEditDesc: '', trackEditDiff: 'Medium', trackEditRepo: '',
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

  async removeAnnouncement(id, title){
    const res = await this.props.onDeleteAnnouncement(id);
    if (!res.ok) return this.toast('Could not delete', res.error);
    this.toast('Announcement deleted', title);
  }

  async saveTrackEdit(){
    const { trackEditId, trackEditTitle, trackEditDesc, trackEditDiff, trackEditRepo } = this.state;
    if (!trackEditId) return;
    const res = await this.props.onUpdateTrack(trackEditId, {
      title: trackEditTitle,
      description: trackEditDesc,
      difficulty: trackEditDiff,
      repo_url: trackEditRepo
    });
    if (!res.ok) return this.toast('Update failed', res.error);
    this.setState({ modal: null, trackEditId: null });
    this.toast('Challenge updated', 'Details have been successfully saved.');
  }

  async moderate(id, next, squadName){
    const res = await this.props.onSetSubmissionStatus(id, next);
    if (!res || res.ok === false) {
      return this.toast('Could not update', (res && res.error) || 'Update failed.');
    }
    this.toast('Submission ' + next, squadName + ' \u00b7 now visible to the squad and the leaderboard.');
  }

  renderVals(){
    // Live data from useEventData, mapped onto the shape this design renders.
    // Falls back to the sample rows only until the first fetch resolves.
    const ST = this.props.stats || { squads:0, hackers:0, leads:0, members:0,
      unassigned:0, judges:0, submissions:0, cleared:0, pending:0, rejected:0, tracks:0,
      scoredSquads:0, totalPoints:0 };
    const EX = {
      users: (this.props.profiles || []).length,
      submissions: (this.props.submissions || []).length,
      squads: (this.props.squads || []).length,
    };
    const live = this.props.squads;
    const SQUADS = (live && live.length)
      ? live.map((q) => ({
          name: q.name,
          lead: q.lead || 'unassigned',
          members: q.members,
          track: q.track,
          w: [q.c1, q.c2],
          score: q.score,          // null until a points column exists
          judge: q.judge,
          invite: q.invite,
          reg: q.registered
            ? new Date(q.registered).toLocaleDateString('en-GB',
                { day: '2-digit', month: 'short', year: 'numeric' })
            : '—',
          prs: q.total,
          roster: q.roster,
          _subs: q.subs,
        }))
      : (this.props.loading ? [] : SQUADS_FALLBACK);

    ANIM.host = this;
    startAnim();
    const s = this.state;
    const vw = ANIM.vw || (typeof window !== 'undefined' ? window.innerWidth : 1440);
    const phone = vw < 760, narrow = vw < 1140;
    const tableState = s.stateOverride || this.props.tableState || 'ready';
    const computedDay = Math.floor((Date.now() - new Date('2026-08-20T00:00:00+05:30').getTime()) / 86400000) + 1;
    const day = Math.max(1, Math.min(11, this.props.eventDay ?? computedDay));
    const t = ANIM.t, on = ANIM.on;
    const count = n => String(Math.round(n * t));

    const judgeCols = phone ? '1fr 62px 62px' : narrow ? '190px 96px 96px 1fr' : '190px 250px 96px 96px 1fr';
    const L = {
      headTop:'max-width:1580px;margin:0 auto;display:flex;align-items:center;' + (phone ? 'flex-wrap:wrap;row-gap:10px;' : '') + 'gap:' + (phone ? '12px' : '26px') +
        ';padding:' + (phone ? '12px 16px 0' : '16px 32px 0'),
      wordmark:"font-family:'Clash Grotesk',sans-serif;font-weight:600;letter-spacing:.14em;white-space:nowrap;color:" + ICE +
        ';line-height:1;font-size:' + (phone ? '15px' : '19px'),
      dayChip:'display:flex;align-items:center;gap:7px;' + MONO,
      logoRvce:'height:' + (phone ? '34px' : '52px') + ';width:auto;flex:none',
      logoClub:'height:' + (phone ? '56px' : '84px') + ';width:auto;flex:none;margin-left:' +
        (phone ? '10px' : '16px'),
      hidePhone:'display:flex;align-items:center',
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
      timelineGrid:'position:relative;display:grid;gap:' + (phone ? '20px' : '18px') + ';grid-template-columns:' + (phone ? '1fr' : 'repeat(2,1fr)'),
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
      chalGrid:'display:grid;gap:20px;grid-template-columns:' + (phone ? '1fr' : narrow ? 'repeat(2,1fr)' : 'repeat(2,1fr)'),
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

    let squadList = this.props.squads && this.props.squads.length > 0 ? this.props.squads.slice() : SQUADS.slice();
    
    if (s.search) {
      const q = s.search.toLowerCase();
      squadList = squadList.filter(sq => sq.name.toLowerCase().includes(q) || (sq.lead && sq.lead.toLowerCase().includes(q)));
    }
    if (s.trackFilter !== 'all') {
      squadList = squadList.filter(sq => (sq.track || '').includes(s.trackFilter));
    }
    if (s.statusFilter !== 'Any status') {
      const target = s.statusFilter.toLowerCase();
      squadList = squadList.filter(sq => 
        (target === 'not submitted' && sq.c1 === 'none' && sq.c2 === 'none') || 
        sq.c1 === target || sq.c2 === target
      );
    }
    if (s.judgeFilter !== 'All judges') {
      const target = s.judgeFilter === 'Unassigned' ? '' : s.judgeFilter;
      squadList = squadList.filter(sq => (sq.judge || '') === target);
    }
    
    if (s.sortFilter.includes('Score')) {
      squadList.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (s.sortFilter.includes('Name')) {
      squadList.sort((a, b) => a.name.localeCompare(b.name));
    } else if (s.sortFilter.includes('Date')) {
      squadList.sort((a, b) => new Date(b.registered || 0).getTime() - new Date(a.registered || 0).getTime());
    }

    const totalFiltered = squadList.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / s.pageSize));
    const currentPage = Math.max(1, Math.min(s.page, totalPages));
    squadList = squadList.slice((currentPage - 1) * s.pageSize, currentPage * s.pageSize);

    const rows = squadList.map((q, idx) => {
      const open = s.expanded === q.name;
      // profiles has no email column, so show the USN when we have one and an
      // em dash otherwise. Deriving "callsign@rvce.edu.in" invented addresses
      // that do not exist, and produced a bare "@rvce.edu.in" for members with
      // no name recorded.
      const roster = ((q.roster && q.roster.length ? q.roster : [])
        .map(m => ({
          role: m.role,
          callsign: m.callsign || 'unnamed',
          email: m.usn || '\u2014',
        })))
        .map((m, i) => Object.assign(m, {
          roleStyle: MONO + ';font-size:9px;letter-spacing:.12em;width:52px;flex:none;color:' + (m.role === 'LEAD' ? ICE : DIM),
          rowStyle:'display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid rgba(179,224,242,.06);animation:rise .3s ease-out ' + (i*0.05) + 's both'
        }));
      return {
        name:q.name, lead:q.lead, members:q.members, track:q.track,
        score: q.score === null || q.score === undefined ? '\u2014' : q.score,
        hasScore: q.score !== null && q.score !== undefined,
        judge:q.judge || 'unassigned',
        judgeColor:q.judge ? TXT : DIM,
        w1:this.chip(q.c1 || (q.w && q.w[0]) || 'none'), w2:this.chip(q.c2 || (q.w && q.w[1]) || 'none'),
        open, invite:q.invite, registered:q.registered || q.reg, prs:q.total || q.prs || 0, roster,
        assignJudge: () => this.setState({
          modal:'assignOne', assignSquadName:q.name, judgeId:q.judgeId || '',
        }),
        meterStyle:'position:absolute;inset:0 auto 0 0;background:' + STEEL + ';transition:width .9s cubic-bezier(.22,1,.36,1) ' +
          (0.15 + idx*0.05) + 's;width:' + (on && q.score != null ? q.score + '%' : '0%'),
        links:(q.subs || q._subs || []).map((sub) => {
          const chip = this.chip(sub.status);
          const act = (ok, tone) => 'padding:5px 10px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;' +
            MONO + ';border-radius:2px;background:transparent;cursor:' + (ok ? 'pointer' : 'not-allowed') +
            ';transition:all .2s;border:1px solid ' + (ok ? tone + '66' : 'rgba(179,224,242,.10)') +
            ';color:' + (ok ? tone : '#3d5560');
          return {
            week: sub.track_id || '\u2014',
            repo: (sub.pr_url || 'no link').replace(/^https?:\/\//, ''),
            repoUrl: sub.pr_url || '#',
            statusLabel: chip.label,
            statusStyle: chip.text,
            statusDot: chip.dot,
            canAccept: sub.status !== 'accepted',
            canReject: sub.status !== 'rejected',
            acceptStyle: act(sub.status !== 'accepted', '#7FB27E'),
            rejectStyle: act(sub.status !== 'rejected', '#C2564B'),
            accept: () => this.moderate(sub.id, 'accepted', q.name),
            reject: () => this.moderate(sub.id, 'rejected', q.name),
            linkStyle: MONO + ';font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:' + (sub.pr_url ? ICE : DIM)
          };
        }),
        wrapStyle:'animation:rise .4s ease-out ' + (idx*0.045) + 's both;transition:border-color .3s;border-left:2px solid ' +
          (open ? ICE : 'transparent') + (open ? ';background:rgba(93,145,166,.06)' : ''),
        caretStyle:'background:transparent;border:none;cursor:pointer;font-size:16px;line-height:1;padding:6px 4px;transition:transform .3s cubic-bezier(.22,1,.36,1),color .25s;color:' +
          (open ? ICE : DIM) + ';transform:rotate(' + (open ? '90' : '0') + 'deg)',
        toggle: () => this.setState({expanded: open ? null : q.name}),
        copy: () => this.toast('Invite code copied', q.invite + ' is on your clipboard.'),
        dq: () => this.setState({modal:'confirm', confirm:{
          kicker:'DESTRUCTIVE', color:CLAY, title:'Disqualify ' + q.name + '?',
          body:'All submissions and ' + q.score + ' rubric points are voided. The squad keeps read access but drops off the leaderboard. This cannot be undone from the portal.',
          cta:'Disqualify squad', kind:'danger'
        }})
      };
    });

    const cols = ['Squad','Lead','Mem','Track','Ch 1','Ch 2','Total','Judge','Actions'];
    const trackColors = [ICE, '#8CBCD1', STEEL, '#41707F', '#5C8F5B'];

    const tracks = (this.props.trackDistribution && this.props.trackDistribution.length > 0
      ? this.props.trackDistribution.map(t => ({ code: t.id, name: t.title, count: t.count, pct: t.pct + '%' }))
      : this.props.tracks && this.props.tracks.length > 0
        ? this.props.tracks.map((t) => ({ code: t.id, name: t.title, count: 0, pct: '0%' }))
        : [
            {code:'T1', name:'Challenge 1', count:0, pct:'0%'},
            {code:'T2', name:'Challenge 2', count:0, pct:'0%'}
          ]).map((tr,i) => Object.assign(tr, {
      color: trackColors[i % trackColors.length],
      barStyle:'background:' + trackColors[i] + ';opacity:.85;transition:flex 1s cubic-bezier(.22,1,.36,1) ' + (i*0.08) + 's;flex:' + (on ? tr.count : 0.001),
      rowStyle:'display:grid;grid-template-columns:12px 34px 1fr 52px 46px;align-items:center;gap:12px;padding:11px 0;border-top:1px solid rgba(179,224,242,.07);transition:background .2s;animation:rise .4s ease-out ' + (0.1 + i*0.06) + 's both'
    }));

    const weeks = (this.props.tracks || []).map((tr, i) => {
      const c = this.props.submissions ? this.props.submissions.filter(sub => sub.track_id === tr.id).length : 0;
      return {
        label: tr.title.toUpperCase(),
        count: c,
        pct: Math.min(100, Math.round(c / Math.max(1, ST.squads) * 100)),
        color: i === 0 ? ICE : MOSS_LT
      };
    }).map((w,i) => Object.assign(w, {
      barStyle:'width:100%;max-width:64px;background:linear-gradient(180deg,' + w.color + ',rgba(17,32,38,.15));transition:height 1s cubic-bezier(.22,1,.36,1) ' +
        (0.15 + i*0.12) + 's;height:' + (on ? w.pct + 'px' : '0px')
    }));

    const tlData = this.props.tracks && this.props.tracks.length >= 2 ? [
      {title: this.props.tracks[0].title, meta:'20–25 AUG', start:1},
      {title: this.props.tracks[1].title, meta:'25–30 AUG', start:6}
    ] : [
      {title:'Challenge 01', meta:'20–25 AUG', start:1},
      {title:'Challenge 02', meta:'25–30 AUG', start:6}
    ];

    const timeline = tlData.map((tl, wi) => {
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
      // Wired from the wrapper below; without this the header button was a no-op.
      signOut: () => this.props.onSignOut && this.props.onSignOut(),
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

      tracks,
      isOverview:s.section==='overview', isSquads:s.section==='squads', isAnn:s.section==='announcements',
      isJudges:s.section==='judges', isChal:s.section==='challenges', isExports:s.section==='exports',
      goSquads: () => this.setState({section:'squads'}),
      goAnn: () => this.setState({section:'announcements'}),

      squadCount:String(ST.squads), trackCount:String(ST.tracks),
      hackerCount:String(ST.hackers), leadCount:String(ST.leads), judgeCount:String(ST.judges),
      stats:[
        {label:'Total squads', value:count(ST.squads), unit:'',
         sub: ST.unassigned + ' operatives without a squad', color:TXT},
        {label:'Total hackers', value:count(ST.hackers), unit:'',
         sub: ST.leads + ' leads / ' + ST.members + ' members', color:TXT},
        {label:'Submissions', value:count(ST.submissions), unit:'',
         sub: ST.pending + ' awaiting review', color:ICE},
        {label:'Points awarded', value:count(ST.totalPoints), unit:'',
         sub: ST.scoredSquads + ' of ' + ST.squads + ' squads scored', color:MOSS_LT},
        {label:'Tracks', value:count(ST.tracks), unit:'',
         sub: ST.judges + ' judges registered', color:STEEL}
      ].map((st,i) => Object.assign(st, {
        cellStyle:'transition:background .3s;animation:rise .45s ease-out ' + (0.1 + i*0.07) + 's both;padding:' +
          (phone ? '18px 16px' : '22px 24px 20px') +
          (phone
            ? (i % 2 ? ';border-left:1px solid rgba(179,224,242,.10)' : '') + (i > 1 ? ';border-top:1px solid rgba(179,224,242,.10)' : '')
            : (i ? ';border-left:1px solid rgba(179,224,242,.10)' : '')),
        numStyle:"font-family:'Clash Grotesk',sans-serif;font-weight:500;line-height:.85;font-variant-numeric:tabular-nums;color:" + st.color +
          ';font-size:' + (phone ? '32px' : '42px')
      })),
      prOpened:count(this.props.submissions ? this.props.submissions.length : 318),
      prMerged:count(this.props.submissions ? this.props.submissions.filter(sub => CLEARED.has(sub.status)).length : 204),
      timeline, weeks,

      cols:cols.map((label,i) => ({
        label,
        style: MONO + ';font-size:10px;letter-spacing:.14em;padding:14px 8px;color:' + (label==='Total' ? STEEL : DIM) +
          (i === cols.length-1 ? ';text-align:right' : '')
      })),

      search:s.search,
      onSearch: e => this.setState({search:e.target.value, page:1}),
      trackFilter: s.trackFilter, statusFilter: s.statusFilter, judgeFilter: s.judgeFilter, sortFilter: s.sortFilter, pageSize: s.pageSize,
      onFilterChange: (key, val) => this.setState({[key]: val, page: 1}),
      isReady:tableState==='ready', isLoading:tableState==='loading',
      isEmpty:totalFiltered === 0, isError:tableState==='error',
      totalFiltered, totalPages, currentPage,
      resetFilters: () => this.setState({stateOverride:'ready', search:'', trackFilter:'all', statusFilter:'Any status', judgeFilter:'All judges', sortFilter:'Score · high to low', page: 1}),
      skeleton:[0,1,2,3,4,5].map(i => ({op:String(1 - i*0.13)})),
      rows,
      pages:Array.from({length: totalPages}, (_, i) => i + 1).map(n => ({
        n:String(n),
        go: () => this.setState({page: n}),
        style:'padding:8px 12px;font-size:12px;background:' + (n===currentPage ? ICE : 'transparent') +
          ';border:1px solid ' + (n===currentPage ? ICE : 'rgba(179,224,242,.10)') + ';color:' + (n===currentPage ? '#080D0C' : DIM) +
          ';cursor:pointer;transition:all .25s;border-radius:2px'
      })),
      exportToast: (rowsCount) => this.toast('Export queued', `CSV will download in a moment · ${rowsCount} rows.`),

      bodyLen:s.bodyLen,
      countColor: s.bodyLen > 460 ? CLAY : DIM,
      countBar:'height:100%;transition:width .3s ease-out;width:' + Math.min(100, s.bodyLen/5) + '%;background:' + (s.bodyLen > 460 ? CLAY : STEEL),
      annTitle:s.annTitle, annBody:s.annBody, annAudience:s.annAudience,
      onTitle: e => this.setState({annTitle:e.target.value}),
      onBody: e => this.setState({annBody:e.target.value, bodyLen:e.target.value.length}),
      onAudience: e => this.setState({annAudience:e.target.value}),
      togglePin: () => this.setState({pinned:!pinOn}),
      pinText: pinOn ? 'PINNED' : 'OFF',
      pinTrack:swTrack(pinOn), pinKnob:swKnob(pinOn), pinLabel:swLabel(pinOn),
      openBroadcast: () => this.setState({modal:'broadcast'}),
      confirmBroadcast: async () => {
        const res = await this.props.onCreateAnnouncement({
          title:s.annTitle, body:s.annBody, audience:s.annAudience, isPinned:pinOn,
        });
        this.setState({modal:null});
        if (!res.ok) return this.toast('Could not broadcast', res.error);
        this.setState({annTitle:'', annBody:'', bodyLen:0});
        this.toast('Broadcast sent', 'Now visible on every hacker dashboard.');
      },
      openDelete: () => this.setState({modal:'confirm', confirm:{
        kicker:'DESTRUCTIVE', color:CLAY, title:'Delete this announcement?',
        body:'It disappears from every hacker dashboard immediately. Delivery records are kept for the audit log.',
        cta:'Delete announcement', kind:'danger'
      }}),
      announcements:(this.props.announcements || []).map(a => ({
        id:a.id,
        title:a.title,
        excerpt:a.body,
        audience:(a.audience === 'leads' ? 'SQUAD LEADS'
                : a.audience === 'judges' ? 'JUDGES' : 'ALL HACKERS'),
        time:new Date(a.created_at).toLocaleString('en-GB',
          {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'}).toUpperCase(),
        sender:'admin',
        pinned:!!a.is_pinned,
        remove: () => this.removeAnnouncement(a.id, a.title),
      })).map((a,i) => Object.assign(a, {
        wrapStyle:'padding:' + (phone ? '16px 18px' : '18px 24px') + ';border-bottom:1px solid rgba(179,224,242,.06);transition:background .25s;animation:rise .4s ease-out ' +
          (0.12 + i*0.07) + 's both;border-left:2px solid ' + (a.pinned ? ICE : 'transparent')
      })),

      judges:(this.props.judges || []).map(j => ({
        id:j.id,                       // needed for <option value>; dropping it
        callsign:j.callsign,           // made the browser submit the label text
        email:j.usn || '—',
        assigned:j.assigned,
        scored:j.scored,
      })).map((j, ji) => {
        const ratio = j.assigned ? j.scored / j.assigned : 0;
        const col = ratio >= .85 ? MOSS_LT : ratio >= .5 ? ICE : STEEL;
        const filled = Math.round(ratio * 14), ticks = [];
        for (let i = 0; i < 14; i++){
          ticks.push({style:'flex:1;transform-origin:center;animation:tickIn .45s cubic-bezier(.22,1,.36,1) ' + (0.15 + ji*0.06 + i*0.025) +
            's both;height:' + (i < filled ? '14px' : '6px') + ';background:' + (i < filled ? col : 'rgba(179,224,242,.12)')});
        }
        return Object.assign(j, {
          ticks, pct:Math.round(ratio*100) + '%', pctColor:col,
          initials: j.callsign ? (j.callsign.includes('_') ? (j.callsign.split('_')[0][0] + j.callsign.split('_')[1][0]) : j.callsign.includes(' ') ? (j.callsign.split(' ')[0][0] + j.callsign.split(' ')[1][0]) : j.callsign.substring(0, 2)).toUpperCase() : 'JU',
          avatar:'width:26px;height:26px;flex:none;display:grid;place-items:center;font-size:10px;font-weight:700;transition:transform .3s;color:' + col + ';border:1px solid ' + col + '55',
          rowStyle:'display:grid;align-items:center;padding:0 ' + (phone ? '16px' : '22px') +
            ';border-bottom:1px solid rgba(179,224,242,.06);transition:background .25s;animation:rise .4s ease-out ' + (0.1 + ji*0.07) +
            's both;grid-template-columns:' + judgeCols,
          emailStyle: (phone || narrow) ? 'display:none' : MONO + ';font-size:11px;color:' + DIM + ';padding:16px 8px',
          progStyle:'display:flex;align-items:center;gap:14px;padding:' + (phone ? '0 8px 16px' : '16px 8px') + (phone ? ';grid-column:1/-1' : '')
        });
      }),
      openAssign: () => this.setState({modal:'assign', judgeId:'', picked:{}}),
      openAuto: () => {
        const jCount = Math.max(1, ST.judges);
        const per = Math.floor(ST.squads / jCount);
        this.setState({modal:'confirm', confirm:{
        kicker:'BULK REASSIGNMENT', color:STEEL, title:`Redistribute ${ST.squads} squads across ${ST.judges} judges?`,
        body:`Existing assignments are discarded and rebuilt at ${per}–${per + 1} squads per judge. Drafts stay attached to their submissions; ${ST.scoredSquads} finalised scores are unaffected.`,
        cta:'Auto-distribute', kind:'safe'
      }})},
      pickList:SQUADS.map(q => {
        const sel = !!s.picked[q.name];
        return {
          name:q.name, track:q.track, mark: sel ? '✓' : '',
          box:'width:16px;height:16px;flex:none;display:grid;place-items:center;font-size:10px;color:#080D0C;transition:all .2s;border:1px solid ' +
            (sel ? ICE : 'rgba(179,224,242,.25)') + ';background:' + (sel ? ICE : 'transparent'),
          toggle: () => this.setState(st => ({picked:Object.assign({}, st.picked, {[q.name]: !st.picked[q.name]})}))
        };
      }),
      pickedCount:String(SQUADS.filter(q => s.picked[q.name]).length),
      judgeOptions:(this.props.judges || []).map(j => ({ id:j.id, label:j.callsign })),
      modalAssignOne: s.modal === 'assignOne',
      assignSquadName: s.assignSquadName || '',
      confirmAssignOne: async () => {
        const res = await this.props.onAssignJudgeToSquad(s.assignSquadName, s.judgeId);
        if (!res.ok) return this.toast('Could not assign', res.error);
        this.setState({modal:null});
        const who = (this.props.judges || []).find(j => j.id === s.judgeId);
        this.toast(
          s.judgeId ? 'Judge assigned' : 'Judge cleared',
          s.judgeId ? s.assignSquadName + ' -> ' + who.callsign
                    : s.assignSquadName + ' has no judge now.',
        );
      },
      judgeId:s.judgeId,
      onJudge: e => {
        const id = e.target.value;
        const j = (this.props.judges || []).find(x => x.id === id);
        const picked = {};
        for (const name of (j ? j.assignedTeams : [])) picked[name] = true;
        this.setState({judgeId:id, picked});
      },
      confirmAssign: async () => {
        const names = SQUADS.filter(q => s.picked[q.name]).map(q => q.name);
        const res = await this.props.onAssignSquads(s.judgeId, names);
        if (!res.ok) return this.toast('Could not save', res.error);
        this.setState({modal:null});
        this.toast('Assignment saved', names.length + ' squads assigned.');
      },

      challenges:(this.props.tracks || []).map((tr, i) => {
        const c = this.props.submissions ? this.props.submissions.filter(sub => sub.track_id === tr.id).length : 0;
        return {
          id: tr.id,
          week: i + 1, title: tr.title, desc: tr.description || '', diff: tr.difficulty || 'Medium', repo: tr.repo_url || '', points: 100, 
          opens: i === 0 ? (this.props.settings?.c1_opens || '20 Aug · 18:00') : (this.props.settings?.c2_opens || '25 Aug · 12:00 AM'), 
          closes: i === 0 ? (this.props.settings?.c1_closes || '25 Aug · 23:59') : (this.props.settings?.c2_closes || '30 Aug · 23:59'), 
          subs: c, pct: Math.min(100, Math.round(c / Math.max(1, ST.squads) * 100))
        };
      }).map((w,i) => {
        const locked = !!s.locks[w.week];
        return {
          id: w.id, week:String(w.week), title:w.title, points:String(w.points),
          opens:w.opens, closes:w.closes, subs:String(w.subs),
          openEditModal: () => this.setState({
            modal: 'editTrack',
            trackEditId: w.id,
            trackEditTitle: w.title,
            trackEditDesc: w.desc,
            trackEditDiff: w.diff,
            trackEditRepo: w.repo
          }),
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
        {name:'Users', desc:'Profiles, callsigns, USN, branch, roles, squad membership',
         rows:String(EX.users), last:'ready', go:() => { this.props.onExport('users'); this.toast('Export queued', `CSV will download in a moment · ${EX.users} rows.`); }},
        {name:'Submissions', desc:'PR links, track, status, timestamps',
         rows:String(EX.submissions), last:'ready', go:() => { this.props.onExport('submissions'); this.toast('Export queued', `CSV will download in a moment · ${EX.submissions} rows.`); }},
        {name:'Squads', desc:'Squad name, lead, members, invite code, submission counts',
         rows:String(EX.squads), last:'ready', go:() => { this.props.onExport('squads'); this.toast('Export queued', `CSV will download in a moment · ${EX.squads} rows.`); }},
        {name:'Leaderboard', desc:'Ranked standings by cleared submissions',
         rows:String(EX.squads), last:'ready', go:() => { this.props.onExport('leaderboard'); this.toast('Export queued', `CSV will download in a moment · ${EX.squads} rows.`); }}
      ].map((e,i) => Object.assign(e, {
        lastColor: e.last === 'never exported' ? DIM : TXT,
        rowStyle:'display:grid;align-items:center;gap:' + (phone ? '12px' : '18px') + ';padding:' + (phone ? '18px 16px' : '22px 24px') +
          ';border-bottom:1px solid rgba(179,224,242,.06);transition:background .25s;animation:rise .4s ease-out ' + (0.1 + i*0.07) +
          's both;grid-template-columns:' + (phone ? '1fr auto' : narrow ? '40px 1fr 100px 150px' : '40px 1fr 120px 230px 170px'),
        iconStyle: phone ? 'display:none' : 'width:32px;height:32px;border:1px solid rgba(93,145,166,.4);display:grid;place-items:center;' + MONO + ';font-size:9px;color:' + STEEL,
        lastStyle: (phone || narrow) ? 'display:none' : MONO + ';font-size:11px;color:' + DIM
      })),

      modalBroadcast:s.modal==='broadcast', modalAssign:s.modal==='assign', modalConfirm:s.modal==='confirm', modalEditTrack:s.modal==='editTrack',
      confirmKicker:c.kicker || '', confirmTitle:c.title || '', confirmBody:c.body || '',
      confirmCta:c.cta || '', confirmColor:c.color || ICE,
      confirmShell:modalShell('500px', isDanger ? 'rgba(194,86,75,.4)' : 'rgba(179,224,242,.2)'),
      confirmBtn:'flex:1.6;min-width:150px;padding:12px 18px;font-size:13px;font-weight:700;cursor:pointer;transition:all .25s;border-radius:2px;color:#080D0C;background:' +
        (isDanger ? CLAY : ICE) + ';border:1px solid ' + (isDanger ? CLAY : ICE),
      confirmGeneric: () => {
        this.setState({modal:null});
        this.toast(isDanger ? 'Action completed' : 'Distribution complete',
        isDanger ? 'Record updated and written to the audit log.' : `${ST.squads} squads spread across ${ST.judges} judges.`);
      },
      closeModal: () => this.setState({modal:null}),
      saveTrackEdit: () => this.saveTrackEdit(),

      toast:s.toast, toastTitle:s.toastTitle,
      toastBar:'position:absolute;left:0;bottom:0;height:2px;background:' + MOSS_LT + ';width:100%;transform-origin:left;animation:sweepBar 4.6s linear forwards',
      hideToast: () => this.setState({toast:null}),
      
      trackEditTitle: s.trackEditTitle,
      trackEditDesc: s.trackEditDesc,
      trackEditDiff: s.trackEditDiff,
      trackEditRepo: s.trackEditRepo,
      setTrackEditTitle: (e) => this.setState({ trackEditTitle: e.target.value }),
      setTrackEditDesc: (e) => this.setState({ trackEditDesc: e.target.value }),
      setTrackEditDiff: (e) => this.setState({ trackEditDiff: e.target.value }),
      setTrackEditRepo: (e) => this.setState({ trackEditRepo: e.target.value }),
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
                <img src="/assets/rvce-transparent.png" alt="RVCE" style={sx(V.L.logoRvce)} />
                <img src="/assets/cc-transparent.png" alt="Coding Club" style={sx(V.L.logoClub)} />
              </div>
              <div style={sx("width:1px;height:30px;background:rgba(179,224,242,.14)")}></div>
              <div>
                <div style={sx(V.L.wordmark)}>CLONEFEST 2.0</div>
                <div style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.24em;color:#56707B;margin-top:5px")}>MASTER CONTROL</div>
              </div>
            </div>

            <div style={sx("flex:1")}></div>

            <div style={sx("display:flex;align-items:center;gap:14px")}>
              <div style={sx("display:flex;align-items:center;gap:11px")}>
                <div style={sx(V.L.hidePhone)}>
                  <div style={sx("text-align:right;line-height:1.35")}>
                    <div style={sx("font-size:13px;font-weight:500;color:#E4EEF2")}>ADMIN</div>
                    <div style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.16em;color:#56707B")}>FULL ACCESS</div>
                  </div>
                </div>
                <div style={sx("width:34px;height:34px;background:#B3E0F2;color:#080D0C;display:grid;place-items:center;font-family:'Clash Grotesk',sans-serif;font-weight:600;font-size:13px;transition:transform .3s")} data-s="ap3">AM</div>
              </div>
              <div style={sx(V.L.hidePhone)}>
                <button onClick={V.signOut} style={sx("padding:9px 16px;font-size:12px;font-weight:500;white-space:nowrap;background:transparent;cursor:pointer;transition:all .25s;border:1px solid rgba(179,224,242,.16);color:#8AA5AE;border-radius:2px")} data-s="ap4">Sign out</button>
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



        <main style={sx(V.L.main)}>

          {(V.isOverview) ? <>
            <div style={sx("animation:fade .4s ease-out both")}>

              <div style={sx(V.L.hero)}>
                <div>
                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.26em;color:#5D91A6;animation:rise .5s ease-out both")}>EVENT IN PROGRESS</div>
                  <h1 style={sx(V.L.heroTitle)}>Tracking <span style={sx("color:#B3E0F2")}>{V.squadCount} squads</span> across {V.tracks ? V.tracks.length : 0} challenges.</h1>
                  <p style={sx("font-size:14px;line-height:1.7;color:#8AA5AE;margin:14px 0 0;max-width:520px;text-wrap:pretty;animation:rise .5s ease-out .16s both")}>{V.prMerged} of {V.squadCount} squads have cleared a submission. {V.squadCount - (this.props.stats ? this.props.stats.scoredSquads : 0)} squads are still unscored.</p>
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
                    <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#56707B")}>{V.squadCount} SQUADS / {V.trackCount} TRACKS</div>
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
                    <div style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:16px;letter-spacing:.06em;color:#E4EEF2")}>Submissions by challenge</div>
                    <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#56707B")}>OF {V.squadCount}</div>
                  </div>
                  <div style={sx(`flex:1;display:grid;grid-template-columns:repeat(${(V.weeks || []).length || 1},1fr);gap:20px;align-items:end;min-height:170px`)}>
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
                      <div style={sx("font-size:12px;color:#8AA5AE")}>Total submissions</div>
                      <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;color:#56707B;margin-top:4px")}>ACROSS ALL TRACKS</div>
                    </div>
                    <div style={sx("display:flex;gap:18px;text-align:right")}>
                      <div>
                        <div style={sx("font-family:'Clash Grotesk',sans-serif;font-size:20px;color:#E4EEF2")}>{V.prOpened}</div>
                        <div style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;color:#56707B")}>SUBMITTED</div>
                      </div>
                      <div>
                        <div style={sx("font-family:'Clash Grotesk',sans-serif;font-size:20px;color:#7FB27E")}>{V.prMerged}</div>
                        <div style={sx("font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;color:#56707B")}>CLEARED</div>
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
                  <span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56707B")}>{V.squadCount} RECORDS</span>
                  <button onClick={() => { this.props.onExport('squads'); V.exportToast(V.squadCount); }} style={sx("padding:11px 18px;font-size:13px;font-weight:500;white-space:nowrap;background:transparent;border:1px solid rgba(179,224,242,.24);color:#B3E0F2;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap12">Export CSV</button>
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
                      <select value={V.trackFilter} onChange={e => V.onFilterChange('trackFilter', e.target.value)} style={sx("width:100%;appearance:none;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:12px 30px 12px 14px;font-size:13px;outline:none;cursor:pointer;border-radius:2px")} data-s="ap29">
                            <option value="all">All tracks</option>
                            {(V.tracks || []).map(t => (
                              <option key={t.code} value={t.code}>{t.name}</option>
                            ))}
                          </select>
                      <span style={sx("position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:#5D91A6;font-size:8px")}>▼</span>
                    </div>
                  </div>
                  <div style={sx(V.L.filterCell)}>
                    <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>STATUS</label>
                    <div style={sx("position:relative")}>
                      <select value={V.statusFilter} onChange={e => V.onFilterChange('statusFilter', e.target.value)} style={sx("width:100%;appearance:none;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:11px 28px 11px 13px;font-size:13px;outline:none;cursor:pointer;border-radius:2px")} data-s="ap15">
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
                      <select value={V.judgeFilter} onChange={e => V.onFilterChange('judgeFilter', e.target.value)} style={sx("width:100%;appearance:none;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:11px 28px 11px 13px;font-size:13px;outline:none;cursor:pointer;border-radius:2px")} data-s="ap16">
                        <option>All judges</option>
                        <option>Unassigned</option>
                        {(V.judges || []).map(j => (
                          <option key={j.callsign} value={j.callsign}>{j.callsign}</option>
                        ))}
                      </select>
                      <span style={sx("position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:#5D91A6;font-size:8px")}>▼</span>
                    </div>
                  </div>
                  <div style={sx(V.L.filterCell)}>
                    <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>SORT</label>
                    <div style={sx("position:relative")}>
                      <select value={V.sortFilter} onChange={e => V.onFilterChange('sortFilter', e.target.value)} style={sx("width:100%;appearance:none;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:11px 28px 11px 13px;font-size:13px;outline:none;cursor:pointer;border-radius:2px")} data-s="ap17">
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
                      <select value={String(V.pageSize)} onChange={e => V.onFilterChange('pageSize', parseInt(e.target.value, 10))} style={sx("width:100%;appearance:none;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:11px 26px 11px 13px;font-size:13px;outline:none;cursor:pointer;border-radius:2px")} data-s="ap18">
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                      <span style={sx("position:absolute;right:11px;top:50%;transform:translateY(-50%);pointer-events:none;color:#5D91A6;font-size:8px")}>▼</span>
                    </div>
                  </div>
                </div>

                {(V.isPhone) ? <>
                  {(V.rows || []).map((r, _ip) => <React.Fragment key={_ip}>
                    <div style={sx("padding:16px;border-bottom:1px solid rgba(179,224,242,.06)")}>
                      <div style={sx("display:flex;align-items:baseline;justify-content:space-between;gap:12px")}>
                        <span style={sx("font-size:15px;font-weight:500;color:#E4EEF2;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{r.name}</span>
                        <span style={sx("font-family:'Clash Grotesk',sans-serif;font-size:17px;color:#B3E0F2;flex:none")}>{r.score}</span>
                      </div>

                      <div style={sx("margin-top:6px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.1em;color:#56707B")}>
                        {r.lead} &middot; {r.members} MEMBERS &middot; {r.track}
                      </div>

                      <div style={sx("display:flex;flex-wrap:wrap;gap:12px;margin-top:10px")}>
                        <span style={sx("display:flex;align-items:center;gap:6px")}>
                          <span style={sx(r.w1.dot)}></span><span style={sx(r.w1.text)}>{r.w1.label}</span>
                        </span>
                        <span style={sx("display:flex;align-items:center;gap:6px")}>
                          <span style={sx(r.w2.dot)}></span><span style={sx(r.w2.text)}>{r.w2.label}</span>
                        </span>
                      </div>

                      <div style={sx(`margin-top:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;color:${r.judgeColor}`)}>
                        JUDGE: {r.judge}
                      </div>

                      <div style={sx("display:flex;align-items:center;gap:8px;margin-top:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;color:#56707B")}>
                        <span>INVITE: {r.invite}</span>
                        <button onClick={r.copy} style={sx("background:transparent;border:1px solid rgba(93,145,166,.35);color:#5D91A6;padding:2px 7px;font-size:9px;letter-spacing:.12em;border-radius:2px;cursor:pointer")}>COPY</button>
                      </div>

                      <div style={sx("display:flex;gap:8px;margin-top:12px;flex-wrap:wrap")}>
                        <button onClick={r.assignJudge} style={sx("flex:1;min-width:120px;padding:8px 10px;font-size:11px;background:transparent;border:1px solid rgba(93,145,166,.45);color:#B3E0F2;border-radius:2px;cursor:pointer")}>Assign judge</button>
                        <button onClick={r.dq} style={sx("flex:1;min-width:100px;padding:8px 10px;font-size:11px;background:transparent;border:1px solid rgba(194,86,75,.35);color:#C2564B;border-radius:2px;cursor:pointer")}>Disqualify</button>
                      </div>
                    </div>
                  </React.Fragment>)}
                </> : null}

                {(V.isPhone) ? null : <>
                <div style={sx("overflow-x:auto;-webkit-overflow-scrolling:touch")}>
                  <div style={sx("min-width:1320px")}>
                    <div style={sx("display:grid;grid-template-columns:24px 196px 124px 62px 154px 118px 118px 126px 140px 200px;align-items:center;padding:0 18px;border-bottom:1px solid rgba(179,224,242,.08)")}>
                      <div></div>
                      {(V.cols || []).map((c, _i1) => <React.Fragment key={_i1}>
                        <div style={sx(c.style)}>{c.label}</div>
                      </React.Fragment>)}
                    </div>

                    {(V.isReady) ? <>
                      <div>
                        {(V.rows || []).map((r, _i2) => <React.Fragment key={_i2}>
                          <div style={sx(r.wrapStyle)}>
                            <div style={sx("display:grid;grid-template-columns:24px 196px 124px 62px 154px 118px 118px 126px 140px 200px;align-items:center;padding:0 18px;border-bottom:1px solid rgba(179,224,242,.06);transition:background .2s")} data-s="ap19">
                              <button onClick={r.toggle} style={sx(r.caretStyle)}>›</button>
                              <div style={sx("padding:15px 8px;font-size:14px;font-weight:500;color:#E4EEF2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{r.name}</div>
                              <div style={sx("padding:15px 8px;font-family:'JetBrains Mono',monospace;font-size:12px;color:#8AA5AE")}>{r.lead}</div>
                              <div style={sx("padding:15px 8px;font-family:'Clash Grotesk',sans-serif;font-size:15px;color:#E4EEF2")}>{r.members}</div>
                              <div style={sx("padding:15px 8px;font-size:12px;color:#8AA5AE")}>{r.track}</div>
                              <div style={sx("padding:15px 8px;display:flex;align-items:center;gap:7px")}><span style={sx(r.w1.dot)}></span><span style={sx(r.w1.text)}>{r.w1.label}</span></div>
                              <div style={sx("padding:15px 8px;display:flex;align-items:center;gap:7px")}><span style={sx(r.w2.dot)}></span><span style={sx(r.w2.text)}>{r.w2.label}</span></div>
                              <div style={sx("padding:15px 8px;display:flex;align-items:center;gap:10px")}>
                                <span style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:18px;color:#B3E0F2;font-variant-numeric:tabular-nums")}>{r.score}</span>
                                {r.hasScore ? <span style={sx("flex:1;height:3px;background:rgba(179,224,242,.12);position:relative")}><span style={sx(r.meterStyle)}></span></span> : null}
                              </div>
                              <div style={sx(`padding:15px 8px;font-family:'JetBrains Mono',monospace;font-size:11px;color:${r.judgeColor}`)}>{r.judge}</div>
                              <div style={sx("padding:10px 8px;display:flex;gap:6px;justify-content:flex-start")}>
                                
                                <button onClick={r.assignJudge} style={sx("padding:7px 10px;font-size:11px;background:transparent;border:1px solid rgba(93,145,166,.45);color:#B3E0F2;cursor:pointer;transition:all .25s;border-radius:2px;white-space:nowrap")} data-s="ap21">Assign judge</button>
                                <button onClick={r.dq} style={sx("padding:7px 10px;font-size:11px;background:transparent;border:1px solid rgba(194,86,75,.35);color:#C2564B;cursor:pointer;transition:all .25s;border-radius:2px;white-space:nowrap")} data-s="ap22">Disqualify</button>
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
                                    <div style={sx("display:grid;grid-template-columns:52px minmax(0,1fr) 108px 132px;gap:12px;align-items:center;padding:9px 0;border-bottom:1px solid rgba(179,224,242,.06)")}>
                                      <span style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;color:#56707B")}>{l.week}</span>
                                      <a href={l.repoUrl} target="_blank" rel="noreferrer" style={sx(l.linkStyle)}>{l.repo}</a>
                                      <span style={sx("display:flex;align-items:center;gap:6px")}>
                                        <span style={sx(l.statusDot)}></span>
                                        <span style={sx(l.statusStyle)}>{l.statusLabel}</span>
                                      </span>
                                      <span style={sx("display:flex;gap:6px;justify-content:flex-end")}>
                                        <button onClick={l.accept} disabled={!l.canAccept} style={sx(l.acceptStyle)}>Accept</button>
                                        <button onClick={l.reject} disabled={!l.canReject} style={sx(l.rejectStyle)}>Reject</button>
                                      </span>
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
                        <div style={sx("font-size:13px;color:#8AA5AE;margin-top:10px")}>0 of {V.squadCount} records returned for the current query.</div>
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
                </>}

                <div style={sx(V.L.pager)}>
                  <div style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56707B")}>SHOWING <span style={sx("color:#E4EEF2")}>{Math.min(V.totalFiltered, (V.currentPage - 1) * V.pageSize + 1)}–{Math.min(V.totalFiltered, V.currentPage * V.pageSize)}</span> OF <span style={sx("color:#E4EEF2")}>{V.totalFiltered}</span></div>
                  <div style={sx("display:flex;align-items:center;gap:6px;flex-wrap:wrap")}>
                    <button onClick={() => V.onFilterChange('page', Math.max(1, V.currentPage - 1))} disabled={V.currentPage <= 1} style={sx("padding:8px 14px;font-size:12px;background:transparent;border:1px solid rgba(179,224,242,.10);color:#56707B;cursor:" + (V.currentPage <= 1 ? "not-allowed" : "pointer") + ";border-radius:2px")}>Previous</button>
                    {(V.pages || []).map((p, _i1) => <React.Fragment key={_i1}>
                      <button onClick={p.go} style={sx(p.style)}>{p.n}</button>
                    </React.Fragment>)}
                    <button onClick={() => V.onFilterChange('page', Math.min(V.totalPages, V.currentPage + 1))} disabled={V.currentPage >= V.totalPages} style={sx("padding:8px 14px;font-size:12px;background:transparent;border:1px solid rgba(179,224,242,.24);color:#B3E0F2;cursor:" + (V.currentPage >= V.totalPages ? "not-allowed" : "pointer") + ";transition:all .25s;border-radius:2px")} data-s="ap26">Next</button>
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
                <span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56707B")}>{V.hackerCount} HACKERS REACHABLE</span>
              </div>

              <div style={sx(V.L.annCols)}>

                <div style={sx("background:#112026;border:1px solid rgba(179,224,242,.10);border-radius:3px;position:relative;overflow:hidden;animation:rise .45s ease-out both")}>
                  <div style={sx("position:absolute;inset:0;background:linear-gradient(150deg,rgba(93,145,166,.16),transparent 50%);pointer-events:none")}></div>
                  <div style={sx(V.L.composePad)}>
                    <div style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:20px;color:#E4EEF2;margin-bottom:22px")}>Compose</div>

                    <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>TITLE</label>
                    <input value={V.annTitle} onChange={V.onTitle} placeholder="Challenge 02 unlocks at 23:59 IST" style={sx("width:100%;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:12px 14px;font-size:13.5px;outline:none;transition:all .2s;border-radius:2px")} data-s="ap27" />

                    <div style={sx("display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px")}>
                      <label style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>BODY</label>
                      <span style={sx(`font-family:'JetBrains Mono',monospace;font-size:10px;color:${V.countColor}`)}>{V.bodyLen} / 500</span>
                    </div>
                    <textarea value={V.annBody} onChange={V.onBody} rows="6" placeholder="Plain text. Links are rendered but not tracked." style={sx("width:100%;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:13px 15px;font-size:13px;line-height:1.75;outline:none;resize:vertical;transition:all .2s;border-radius:2px")} data-s="ap28"></textarea>
                    <div style={sx("height:2px;background:rgba(179,224,242,.10);margin-top:2px")}><div style={sx(V.countBar)}></div></div>

                    <div style={sx(V.L.audienceRow)}>
                      <div>
                        <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>AUDIENCE</label>
                        <div style={sx("position:relative")}>
                          <select value={V.annAudience} onChange={V.onAudience} style={sx("width:100%;appearance:none;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:12px 30px 12px 14px;font-size:13px;outline:none;cursor:pointer;border-radius:2px")} data-s="ap29">
                            <option value="all">All hackers · {V.hackerCount}</option>
                            <option value="leads">Squad leads only · {V.leadCount}</option>
                            {(V.tracks || []).map(t => (
                              <option key={t.code} value={t.code}>Single track — {t.code} {t.name} · {t.count}</option>
                            ))}
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
                      <button onClick={V.openBroadcast} style={sx("flex:1.5;min-width:150px;padding:12px 20px;font-size:13px;font-weight:700;white-space:nowrap;background:#B3E0F2;border:1px solid #B3E0F2;color:#080D0C;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap31">Broadcast</button>
                    </div>
                  </div>
                </div>

                <div style={sx("background:#112026;border:1px solid rgba(179,224,242,.10);border-radius:3px;animation:rise .45s ease-out .1s both")}>
                  <div style={sx("display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:20px 24px;border-bottom:1px solid rgba(179,224,242,.08)")}>
                    <div style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:16px;color:#E4EEF2")}>Sent history</div>
                    <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#56707B")}>ALL TIME · {V.announcements ? V.announcements.length : 0}</div>
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
                        <button onClick={a.remove} style={sx("padding:6px 11px;font-size:11px;background:transparent;border:1px solid rgba(194,86,75,.3);color:#C2564B;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap34">Delete</button>
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
                <span style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56707B")}>{(V.tracks || []).length} WEEKS · {(V.tracks || []).length * 100} PTS</span>
              </div>

              <div style={sx(V.L.chalGrid)}>
                {(V.challenges || []).map((c, _i1) => <React.Fragment key={_i1}>
                  <div style={sx(c.cardStyle)} data-s="ap38">
                    <div style={sx(c.washStyle)}></div>
                    <div style={sx("position:relative;padding:26px")}>
                      <div style={sx("display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:20px")}>
                        <div>
                          <div style={sx("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.2em;color:#56707B")}>CHALLENGE 0{c.week}</div>
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
                          <span style={sx("font-size:12px;color:#8AA5AE")}>of {V.squadCount} squads submitted</span>
                        </div>
                        <div style={sx("height:4px;background:rgba(179,224,242,.10);position:relative;overflow:hidden")}><div style={sx(c.barStyle)}></div></div>
                      </div>

                      <button onClick={c.openEditModal} style={sx("width:100%;padding:11px 18px;font-size:13px;font-weight:500;white-space:nowrap;background:transparent;border:1px solid rgba(179,224,242,.24);color:#B3E0F2;cursor:pointer;transition:all .25s;border-radius:2px")} data-s="ap39">Edit details</button>
                    </div>
                  </div>
                </React.Fragment>)}
              </div>
              <SubmissionTimerPanel />
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
                    <button onClick={e.go} style={sx("padding:11px 18px;font-size:13px;font-weight:500;background:transparent;border:1px solid rgba(179,224,242,.24);color:#B3E0F2;cursor:pointer;transition:all .25s;border-radius:2px;white-space:nowrap")} data-s="ap41">Download CSV</button>
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
                <div style={sx(V.L.modalTitle)}>Send this announcement?</div>
                <div style={sx("margin:22px 0;border:1px solid rgba(179,224,242,.10);background:#0B1519;padding:16px 18px;border-radius:2px")}>
                  <div style={sx("font-size:14px;font-weight:500;color:#E4EEF2;margin-bottom:7px")}>{V.annTitle || "Untitled"}</div>
                  <div style={sx("font-size:13px;color:#8AA5AE;line-height:1.7")}>{V.annBody || "No body yet."}</div>
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

        {(V.modalAssignOne) ? <>
          <div style={sx(V.L.overlay)}>
            <div style={sx(V.L.modalAssign)}>
              <div style={sx(V.L.modalPad)}>
                <div style={sx("display:flex;justify-content:space-between;align-items:center;margin-bottom:8px")}>
                  <div style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:22px;color:#E4EEF2")}>Assign judge</div>
                  <button onClick={V.closeModal} style={sx("background:transparent;border:none;color:#56707B;cursor:pointer;font-size:15px")}>&#10005;</button>
                </div>
                <div style={sx("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.14em;color:#5D91A6;margin-bottom:22px")}>{V.assignSquadName}</div>

                <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>JUDGE</label>
                <select value={V.judgeId} onChange={V.onJudge} style={sx("width:100%;appearance:none;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:12px 14px;font-size:13px;outline:none;cursor:pointer;border-radius:2px")}>
                  <option value="">No judge assigned</option>
                  {(V.judgeOptions || []).map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>

                <div style={sx("display:flex;gap:12px;flex-wrap:wrap;margin-top:26px")}>
                  <button onClick={V.closeModal} style={sx("flex:1;min-width:110px;padding:12px 18px;font-size:13px;font-weight:500;background:transparent;border:1px solid rgba(179,224,242,.24);color:#8AA5AE;cursor:pointer;border-radius:2px")}>Cancel</button>
                  <button onClick={V.confirmAssignOne} style={sx("flex:1.6;min-width:150px;padding:12px 18px;font-size:13px;font-weight:700;background:#B3E0F2;border:1px solid #B3E0F2;color:#080D0C;cursor:pointer;border-radius:2px")}>Save</button>
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
                  <select value={V.judgeId} onChange={V.onJudge} style={sx("width:100%;appearance:none;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:12px 30px 12px 14px;font-size:13px;outline:none;cursor:pointer;border-radius:2px")} data-s="ap45">
                    <option value="">Overview (Select a judge below to re-assign)</option>
                    {(V.judges || []).map(j => (
                      <option key={j.id} value={j.id}>{j.callsign} · {j.assigned} assigned</option>
                    ))}
                  </select>
                  <span style={sx("position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:#5D91A6;font-size:8px")}>▼</span>
                </div>

                <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>SQUADS</label>

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

        {(V.modalEditTrack) ? <>
          <div style={sx(V.L.overlay)}>
            <div style={sx(V.L.modalWide)}>
              <div style={sx("position:absolute;inset:0;background:linear-gradient(150deg,rgba(93,145,166,.2),transparent 55%);pointer-events:none")}></div>
              <div style={sx(V.L.modalPad)}>
                <div style={sx("display:flex;justify-content:space-between;align-items:center;margin-bottom:22px")}>
                  <div style={sx("font-family:'Clash Grotesk',sans-serif;font-weight:500;font-size:22px;color:#E4EEF2")}>Edit Challenge</div>
                  <button onClick={V.closeModal} style={sx("background:transparent;border:none;color:#56707B;cursor:pointer;font-size:15px")}>✕</button>
                </div>

                <div style={sx("display:grid;gap:16px;margin-bottom:24px")}>
                  <div>
                    <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>TITLE</label>
                    <input value={V.trackEditTitle} onChange={V.setTrackEditTitle} placeholder="Challenge Title" style={sx("width:100%;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:11px 14px;font-size:13px;outline:none;border-radius:2px")} />
                  </div>
                  <div>
                    <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>DESCRIPTION</label>
                    <textarea value={V.trackEditDesc} onChange={V.setTrackEditDesc} rows="3" placeholder="Challenge Description" style={sx("width:100%;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:11px 14px;font-size:13px;outline:none;border-radius:2px;resize:vertical")}></textarea>
                  </div>
                  <div style={sx("display:grid;grid-template-columns:1fr 1fr;gap:16px")}>
                    <div>
                      <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>DIFFICULTY</label>
                      <div style={sx("position:relative")}>
                        <select value={V.trackEditDiff} onChange={V.setTrackEditDiff} style={sx("width:100%;appearance:none;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:11px 30px 11px 14px;font-size:13px;outline:none;cursor:pointer;border-radius:2px")}>
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                        <span style={sx("position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:#5D91A6;font-size:8px")}>▼</span>
                      </div>
                    </div>
                    <div>
                      <label style={sx("display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;color:#56707B")}>GITHUB REPO URL</label>
                      <input value={V.trackEditRepo} onChange={V.setTrackEditRepo} placeholder="https://github.com/..." style={sx("width:100%;background:#0B1519;border:1px solid rgba(179,224,242,.14);color:#E4EEF2;padding:11px 14px;font-size:13px;outline:none;border-radius:2px")} />
                    </div>
                  </div>
                </div>

                <div style={sx("display:flex;gap:12px;flex-wrap:wrap")}>
                  <button onClick={V.closeModal} style={sx("flex:1;min-width:110px;padding:12px 18px;font-size:13px;font-weight:500;background:transparent;border:1px solid rgba(179,224,242,.16);color:#8AA5AE;cursor:pointer;transition:all .25s;border-radius:2px")}>Cancel</button>
                  <button onClick={V.saveTrackEdit} style={sx("flex:1.6;min-width:150px;padding:12px 18px;font-size:13px;font-weight:700;white-space:nowrap;background:#B3E0F2;border:1px solid #B3E0F2;color:#080D0C;cursor:pointer;transition:all .25s;border-radius:2px")}>Save Changes</button>
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

/**
 * Live-data wrapper. The view above is the imported design; everything it
 * renders now comes from useEventData, which the leaderboard and hacker
 * portal read from too, so the three stay in step.
 */
export default function AdminPortal() {
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
  };
  const { squads, stats, trackDistribution, tracks, settings, profiles, submissions,
          announcements, judges, status, error, fetchedAt, refetch, setSubmissionStatus,
          createAnnouncement, deleteAnnouncement, assignSquads, updateTrack,
          assignJudgeToSquad } = useEventData();

  // Exports are built from data already in memory — no server round trip.
  const handleExport = (kind) => {
    const build = EXPORTS[kind];
    if (!build) return;
    const { filename, csv } = build({
      profiles, submissions, squads, ranked: rankSquads(squads),
    });
    downloadCsv(filename, csv);
  };

  return (
    <AdminPortalView
      profiles={profiles}
      submissions={submissions}
      onSignOut={handleSignOut}
      announcements={announcements}
      judges={judges}
      onCreateAnnouncement={createAnnouncement}
      onDeleteAnnouncement={deleteAnnouncement}
      onAssignSquads={assignSquads}
      onAssignJudgeToSquad={assignJudgeToSquad}
      onExport={handleExport}
      squads={squads}
      stats={stats}
      trackDistribution={trackDistribution}
      tracks={tracks}
      settings={settings}
      loading={status === 'loading'}
      error={status === 'error' ? error : null}
      fetchedAt={fetchedAt}
      onRefetch={refetch}
      onSetSubmissionStatus={setSubmissionStatus}
      onUpdateTrack={updateTrack}
    />
  );
}

// Exported for the binding audit in scratch; not used by the app.
export { AdminPortalView };
