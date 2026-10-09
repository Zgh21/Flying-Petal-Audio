/* 核心状态、持久化、路由与首页。 */
const BASELINE_STATS = {
  total:21,songs:9,first:6,dups:3,streak:3,bestStreak:4,
  rooms:{yue:{first:3,score:6,dups:0},ye:{first:2,score:4,dups:0},yu:{first:1,score:2,dups:0}},
  cards:['tiaoguo'],cardsEarned:3,battles:0,wins:0,history:[]
};
let STATS = loadJSON(STORAGE.stats, null) || clone(BASELINE_STATS);
let PROFILE = loadJSON(STORAGE.profile, {nick:'你',sign:'爱唱歌的生活观察家'});
let FAVS = loadJSON(STORAGE.favs, []);
let USER_ROOMS = loadJSON(STORAGE.rooms, {});
let ROOM_MUTATIONS = loadJSON(STORAGE.roomMutations, {});
let GROUP_STATE = loadJSON(STORAGE.groups, {});
let FRIENDS = loadJSON(STORAGE.friends, []);
let ACTIVITY = loadJSON(STORAGE.activity, []);
let ROOMS = {};
let curRoom = null;
let FILTERS = {keyword:'',genre:null,lang:null,era:null,mode:null,tag:null,rank:'players'};
const FILTER_DEFS = {
  genre:{label:'曲风',opts:['流行','古风','民谣','摇滚','说唱','电子','R&B']},
  lang:{label:'语种',opts:['国语','粤语','英语','日语','韩语']},
  era:{label:'年代',opts:['经典','千禧','10s','20s']},
  mode:{label:'玩法',opts:['异步接力','实时对战','炸弹歌','反向禁字','AI出题','多语言']}
};
const RANK_DEFS = {players:'参与人数',unlocked:'接歌条数',newDups:'新增跟唱',follows:'收藏热度'};

function $(id){ return document.getElementById(id); }
function clone(value){ return JSON.parse(JSON.stringify(value)); }
function stripAudioDeep(value){ const copy=clone(value); const walk=obj=>{ if(!obj||typeof obj!=='object')return; if(Array.isArray(obj)){obj.forEach(walk);return;} delete obj.audio; Object.values(obj).forEach(walk); }; walk(copy); return copy; }
function esc(value){
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function uid(prefix){ return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7); }
function loadJSON(key, fallback){
  try{ const raw=localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }catch(e){ return fallback; }
}
function saveJSON(key, value){ try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){} }
function normalizeText(value){ return String(value || '').trim().toLocaleLowerCase(); }
function fmtSec(seconds){ seconds=Math.max(0,Math.round(seconds||0)); return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'); }
function nowLabel(){ const d=new Date(); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
function logActivity(text, groupId){
  ACTIVITY.unshift({id:uid('act'),text,time:'刚刚',groupId:groupId||null});
  ACTIVITY=ACTIVITY.slice(0,30); saveJSON(STORAGE.activity,ACTIVITY);
  if(groupId){
    const g=GROUP_STATE[groupId]||(GROUP_STATE[groupId]={messages:[]});
    g.messages= g.messages||[];
    g.messages.unshift({id:uid('msg'),user:PROFILE.nick,text,time:'刚刚'}); g.messages=g.messages.slice(0,30);
    saveJSON(STORAGE.groups,GROUP_STATE);
  }
}
function saveStats(){ saveJSON(STORAGE.stats, STATS); }
function saveProfile(){ saveJSON(STORAGE.profile, PROFILE); }
function saveFavs(){ saveJSON(STORAGE.favs, FAVS); }
function saveFriends(){ saveJSON(STORAGE.friends, FRIENDS); }
function ensureStats(){
  STATS = Object.assign(clone(BASELINE_STATS), STATS || {});
  STATS.rooms = Object.assign({}, BASELINE_STATS.rooms, STATS.rooms || {});
  STATS.cards = Array.isArray(STATS.cards) ? STATS.cards : [];
  STATS.history = Array.isArray(STATS.history) ? STATS.history : [];
  STATS.battles = Number(STATS.battles || 0); STATS.wins = Number(STATS.wins || 0);
  STATS.cardsEarned = Number(STATS.cardsEarned || Math.floor(STATS.songs/3));
}
function buildRoomState(){
  ROOMS = clone(DEFAULT_ROOMS);
  Object.entries(USER_ROOMS || {}).forEach(([id, room]) => { ROOMS[id] = stripAudioDeep(room); });
  Object.entries(ROOM_MUTATIONS || {}).forEach(([roomId, mutation]) => {
    const room = ROOMS[roomId]; if(!room) return;
    if(Number.isFinite(mutation.unlocked)) room.unlocked = Math.max(room.unlocked, mutation.unlocked);
    (mutation.cards || []).slice().reverse().forEach(card => {
      card = clone(card); delete card.audio;
      if(!card.id) card.id=uid('card');
      if(!room.cards.some(x=>x.id===card.id)) room.cards.unshift(card);
    });
    (mutation.contributions || []).forEach(item => {
      const card = room.cards.find(c=>c.id===item.cardId); if(!card) return;
      if(item.type==='dup' && !card.dups.some(d=>d.id===item.data.id)) card.dups.unshift(clone(item.data));
      if(item.type==='comment' && !card.comments.some(m=>m.id===item.data.id)) card.comments.unshift(clone(item.data));
      if(item.type==='like'){
        card.liked = !!item.data.liked;
        card.likes = Math.max(0, Number(card.likes || 0) + Number(item.data.delta || 0));
      }
    });
  });
}
function ensureMutation(roomId){ return ROOM_MUTATIONS[roomId] || (ROOM_MUTATIONS[roomId]={cards:[],contributions:[],unlocked:0}); }
function persistMutation(roomId){
  const room=ROOMS[roomId]; if(!room) return;
  const m=ensureMutation(roomId); m.unlocked=room.unlocked;
  saveJSON(STORAGE.roomMutations, ROOM_MUTATIONS);
}
function persistUserRoom(roomId){ const room=ROOMS[roomId]; if(!room) return; USER_ROOMS[roomId]=stripAudioDeep(room); saveJSON(STORAGE.rooms,USER_ROOMS); }
function findCard(roomId, cardId){ const room=ROOMS[roomId]; return room && room.cards.find(c=>c.id===cardId); }
function recordUserCard(roomId, card){
  const m=ensureMutation(roomId); const safe=clone(card); delete safe.audio; m.cards.push(safe); persistMutation(roomId);
}
function recordContribution(roomId, type, cardId, data){
  const m=ensureMutation(roomId); const safe=clone(data); delete safe.audio;
  m.contributions.push({type,cardId,data:safe}); persistMutation(roomId);
}
function levelOf(score){
  if(score>=60) return {name:'诗仙',next:null,nextName:null};
  if(score>=30) return {name:'令主',next:60,nextName:'诗仙'};
  if(score>=10) return {name:'令士',next:30,nextName:'令主'};
  return {name:'令徒',next:10,nextName:'令士'};
}
function maybeEarnCard(){
  const earned=Math.floor(STATS.songs/3);
  while(STATS.cardsEarned<earned){
    const ids=Object.keys(CARDS); const id=ids[Math.floor(Math.random()*ids.length)];
    STATS.cards.push(id); STATS.cardsEarned++; saveStats();
    toast('🎴 累计通过 3 首，获得技能卡「'+CARDS[id].name+'」！',3200);
  }
}
function bumpStats(roomId, first, points){
  const rr=STATS.rooms[roomId]||(STATS.rooms[roomId]={first:0,score:0,dups:0});
  const gain=points || (first?2:1);
  STATS.songs++; STATS.total+=gain;
  if(first){ STATS.first++; rr.first++; STATS.streak++; }
  else { STATS.dups++; rr.dups=(rr.dups||0)+1; STATS.streak=0; }
  rr.score=(rr.score||0)+gain; STATS.bestStreak=Math.max(STATS.bestStreak||0,STATS.streak||0);
  saveStats(); maybeEarnCard();
}
function useCard(id){
  const idx=STATS.cards.indexOf(id); if(idx<0){ toast('没有这张卡'); return false; }
  STATS.cards.splice(idx,1); saveStats(); return true;
}
function refundCard(id){ STATS.cards.push(id); saveStats(); }
function show(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  const view=$(id); if(view) view.classList.add('active');
  const p=document.querySelector('.phone'); if(p) p.classList.toggle('in-battle',id==='view-battle');
  window.scrollTo(0,0);
}
function setTab(name){ document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on')); const el=$('tab-'+name); if(el) el.classList.add('on'); }
function goHome(){ closePlayer(); setTab('home'); renderHome(); show('view-home'); }
function goRecords(){ closePlayer(); setTab('records'); renderRecords(); show('view-records'); }
function goMe(){ closePlayer(); setTab('me'); renderMe(); show('view-me'); }
function goSettings(){ closePlayer(); setTab('me'); renderSettings(); show('view-settings'); }
function renderFilter(){
  const active=Object.keys(FILTER_DEFS).filter(k=>FILTERS[k]).length + (FILTERS.keyword?1:0) + (FILTERS.tag?1:0);
  const bar=$('filter-bar'); if(!bar) return;
  bar.innerHTML = ['genre','lang','era','mode'].map(k=>`<button class="fchip ${FILTERS[k]?'on':''}" onclick="cycleFilter('${k}')">${FILTER_DEFS[k].label}${FILTERS[k]?' · '+esc(FILTERS[k]):''}</button>`).join('')
    + `<button class="fchip" onclick="openFilterModal()">全部筛选${active?' · '+active:''}</button>`
    + (active?`<button class="fchip dim" onclick="resetFilter()">清除</button>`:'');
}
function cycleFilter(key){
  const def=FILTER_DEFS[key]; if(!def) return;
  const cur=FILTERS[key]; const idx=cur?def.opts.indexOf(cur)+1:0;
  FILTERS[key]=idx>=def.opts.length?null:def.opts[idx]; renderHome();
}
function resetFilter(){ FILTERS={keyword:'',genre:null,lang:null,era:null,mode:null,tag:null,rank:FILTERS.rank||'players'}; renderHome(); }
function setRankMode(mode){ FILTERS.rank=mode; renderHome(); }
function roomHaystack(room){ return [room.word,room.genre,room.lang,room.era,...(room.tags||[]),...(room.modes||[])].join(' ').toLocaleLowerCase(); }
function roomPassesFilter(room){
  if(FILTERS.keyword && !roomHaystack(room).includes(normalizeText(FILTERS.keyword))) return false;
  if(FILTERS.genre && room.genre!==FILTERS.genre) return false;
  if(FILTERS.lang && room.lang!==FILTERS.lang) return false;
  if(FILTERS.era && room.era!==FILTERS.era) return false;
  if(FILTERS.mode && !(room.modes||[]).includes(FILTERS.mode)) return false;
  if(FILTERS.tag && !(room.tags||[]).includes(FILTERS.tag)) return false;
  return true;
}
function roomSortValue(room){ return Number(room[FILTERS.rank] || room.players || 0); }
function renderHome(){
  renderFilter();
  const list=$('room-list'); if(!list) return;
  const sorted=Object.entries(ROOMS).filter(([,r])=>roomPassesFilter(r)).sort((a,b)=>roomSortValue(b[1])-roomSortValue(a[1]) || b[1].players-a[1].players);
  const rankControls=`<div class="rank-controls"><span>榜单：</span>${Object.entries(RANK_DEFS).map(([k,v])=>`<button class="${FILTERS.rank===k?'on':''}" onclick="setRankMode('${k}')">${v}</button>`).join('')}</div>`;
  if(!sorted.length){ list.innerHTML=rankControls+'<p class="sres-empty" style="padding:24px 0">没有符合条件的房间，换个筛选或自建一个吧</p>'; return; }
  list.innerHTML=rankControls+sorted.map(([id,r],i)=>{
    const rank=i<3?`<span class="rank-badge rank-${i+1}">${i+1}</span>`:'';
    const ziCls=r.custom?'zi g':(i%2?'zi g':'zi'); const rr=STATS.rooms[id];
    const mine=rr&&(rr.first||rr.dups)?`你已接 ${rr.first+(rr.dups||0)} 首`:(r.mine?'房主 · 等你开唱':'未参与');
    const mode=(r.modes&&r.modes[0])||'异步接力';
    return `<div class="room-card" onclick="goRoom('${id}')">${rank}<div class="${ziCls} serif">${esc(r.word)}</div>
      <div class="info"><div class="t">「${esc(r.word)}」字局${r.hot?' · 热门':''}${r.custom?' · 自建':''}</div>
      <div class="m"><span class="pill">${r.players} 人在玩</span><span class="pill">已解锁 ${r.unlocked} 首</span><span class="pill">${esc(mode)}</span></div></div>
      <div class="mine">${mine}</div></div>`;
  }).join('');
  renderRecommendation();
}
function renderRecommendation(){
  const note=$('ai-note'); if(!note) return;
  const favored=FAVS.map(sid=>roomWordOf(sid)).filter(Boolean);
  const ranked=Object.entries(ROOMS).filter(([,r])=>!r.custom).sort((a,b)=>{
    const af=(favored.includes(a[1].word)?30:0)+a[1].players; const bf=(favored.includes(b[1].word)?30:0)+b[1].players; return bf-af;
  });
  const pick=ranked[0]; if(!pick) return;
  const reason=favored.length?`你收藏过「${favored[0]}」相关歌曲，`:'你常听华语抒情歌，';
  note.innerHTML=`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="1.8" stroke-linecap="round" style="flex:none;margin-top:1px"><path d="M12 3a4 4 0 0 0-4 4v1H7a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3a3 3 0 0 0-3-3h-1V7a4 4 0 0 0-4-4Z"/></svg><div><b>AI 推荐官：</b>${reason}「${esc(pick[1].word)}」字局里有 ${pick[1].unlocked} 首可接片段，当前 ${pick[1].players} 人在线接力。<button class="inline-link" onclick="goRoom('${pick[0]}')">去看看 ›</button></div>`;
}

function renderRecords(){
  const lv=levelOf(STATS.total), pct=lv.next?Math.min(100,Math.round(STATS.total/lv.next*100)):100;
  const roomRows=Object.entries(STATS.rooms).filter(([id])=>ROOMS[id]).sort((a,b)=>b[1].score-a[1].score).map(([id,rr])=>{
    const r=ROOMS[id]; return `<div class="rstat" onclick="goRoom('${id}')"><div class="zi serif">${esc(r.word)}</div><div class="info"><div class="t">「${esc(r.word)}」字局</div><div class="m">首唱 ${rr.first||0} · 跟唱 ${rr.dups||0} · 接歌 ${(rr.first||0)+(rr.dups||0)} 首</div></div><div class="sc">${rr.score||0} 分</div></div>`;
  }).join('');
  const recentBattle=STATS.history.slice(0,3).map(x=>`<div class="history-row"><span>${x.modeName||'实时对战'}</span><b>${x.myScore}:${x.oppScore}</b><em>${x.win?'胜':'负'}</em></div>`).join('');
  $('records-body').innerHTML=`
    <div class="level-banner" onclick="openTitles()"><div class="zi2 serif">${lv.name[0]}</div><div class="lv"><b>${lv.name} · ${STATS.total} 分</b><div class="pbar"><i style="width:${pct}%"></i></div><div class="pl">${lv.next?'距「'+lv.nextName+'」还差 '+(lv.next-STATS.total)+' 分':'已是最高的称号'} · 连对纪录 ${STATS.bestStreak} 首</div></div></div>
    <div class="stat-grid"><div class="stat-card"><div class="v">${STATS.total}</div><div class="l">总得分</div></div><div class="stat-card"><div class="v">${STATS.songs}</div><div class="l">接歌数</div></div><div class="stat-card"><div class="v">${STATS.first}</div><div class="l">首唱</div></div><div class="stat-card"><div class="v">${STATS.dups}</div><div class="l">跟唱</div></div><div class="stat-card"><div class="v">${STATS.bestStreak}</div><div class="l">连对纪录</div></div><div class="stat-card"><div class="v">${Object.keys(STATS.rooms).length}</div><div class="l">参与房间</div></div></div>
    <div class="section-h"><h3>房间战绩</h3><span>点击进入该房间</span></div><div class="room-stats">${roomRows||'<p class="muted" style="padding:10px 4px;font-size:12px">还没有战绩，去接一句吧</p>'}</div>
    ${recentBattle?`<div class="section-h"><h3>实时对战</h3><span>累计 ${STATS.battles} 局 · 胜率 ${STATS.battles?Math.round(STATS.wins/STATS.battles*100):0}%</span></div><div class="room-stats">${recentBattle}</div>`:''}
    <div class="section-h"><h3>AI 战绩海报</h3><span>Canvas 实时生成 · 可下载</span></div>
    <div class="poster-wrap" id="record-poster-preview">${posterPreviewHTML('personal')}</div>
    <p class="poster-actions"><button class="listen" onclick="downloadPoster('personal')">⬇ 保存海报 PNG</button><button class="listen" onclick="sharePoster('personal')">📤 分享战绩</button></p>`;
}
function posterPreviewHTML(kind, roomId){
  const lv=levelOf(STATS.total); const room=ROOMS[roomId||curRoom];
  if(kind==='room'&&room){ const rr=STATS.rooms[roomId||curRoom]||{score:0,first:0,dups:0}; return `<div class="poster"><div class="pz serif">${esc(room.word)}</div><div class="pt">飞花音 · 「${esc(room.word)}」字局战报</div><div class="pv serif">${rr.score||0} 分</div><div class="pl2">你的战绩：首唱 ${rr.first||0} · 跟唱 ${rr.dups||0} · 本房 ${room.players} 人在玩</div><div class="qr-map" aria-label="房间二维码">${qrGrid(room.word)}</div><div class="pfoot">扫码进「${esc(room.word)}」字局接令 · 本图由 AI 战绩画师生成</div></div>`; }
  return `<div class="poster"><div class="pz serif">飞</div><div class="pt">飞花音 · 个人战绩</div><div class="pv serif">${STATS.total} 分</div><div class="pl2">${lv.name} · 接歌 ${STATS.songs} 首 · 首唱 ${STATS.first} 首 · 连对 ${STATS.bestStreak} 首</div><div class="qr-map" aria-label="个人主页二维码">${qrGrid(PROFILE.nick+STATS.total)}</div><div class="pfoot">扫码加入我的常玩房间 · 本图由 AI 战绩画师生成</div></div>`;
}
function qrGrid(seed){
  let h=0; for(const ch of String(seed||'fly')) h=(h*31+ch.charCodeAt(0))>>>0;
  let cells=''; for(let i=0;i<49;i++){ h=(h*1664525+1013904223)>>>0; cells+=`<i class="${(i<7&&i%6===0)||h%3===0?'on':''}"></i>`; }
  return `<div class="qr-grid">${cells}</div>`;
}
function renderMe(){
  const lv=levelOf(STATS.total);
  const favSongs=FAVS.map(sid=>({sid,word:roomWordOf(sid),fav:true})).filter(x=>x.word);
  const poolSongs=Object.entries(ROOMS).filter(([,r])=>!r.custom).flatMap(([id,r])=>(r.pool||[]).slice(0,3).map(sid=>({sid,word:r.word,fav:false}))).filter(x=>!FAVS.includes(x.sid));
  const songs=favSongs.concat(poolSongs).slice(0,8);
  const recent=Object.keys(STATS.rooms).filter(id=>ROOMS[id]).slice(-3).reverse();
  $('me-body').innerHTML=`
    <div class="me-head"><div class="avatar">${esc(PROFILE.nick[0]||'你')}</div><div class="info"><b>${esc(PROFILE.nick)}</b><div class="sub2">${esc(PROFILE.sign)} · QQ 音乐账号已模拟同步</div><span class="lv-chip">${lv.name}</span></div></div>
    <div class="stat-grid" style="margin-top:14px"><div class="stat-card"><div class="v">${STATS.total}</div><div class="l">总得分</div></div><div class="stat-card"><div class="v">${STATS.songs}</div><div class="l">接歌数</div></div><div class="stat-card"><div class="v">${STATS.bestStreak}</div><div class="l">连对纪录</div></div></div>
    <div class="section-h"><h3>称号系统</h3></div><div class="set-row" style="margin:0 16px 4px" onclick="openTitles()"><div class="sl">🏅 称号图鉴</div><div class="sv">${lv.name} · ${STATS.total} 分 ›</div></div>
    <div class="section-h"><h3>我的共享歌单</h3><span>${FAVS.length} 首已收藏</span></div><div class="song-list">${songs.map((s,i)=>{const so=SONG_POOL[s.sid]; return `<div class="srow" onclick="openPlayer('${s.sid}')"><div class="no">${i+1}</div><div class="info"><div class="t">${esc(so.name)}</div><div class="m">${esc(so.artist)}</div></div><span class="tag">${s.fav?'★ 收藏':esc(s.word)+'局'}</span></div>`;}).join('')}</div>
    <div class="section-h"><h3>技能卡背包</h3><span>累计 3 次通过获得一张</span></div><div class="battle-cards" style="padding:0 16px">${renderCardSlots(false)}</div>
    <div class="section-h"><h3>歌友社群</h3><span>消息、贡献榜与约战</span></div><div class="room-stats">${DEFAULT_GROUPS.map(g=>{const joined=(GROUP_STATE[g.id]&&GROUP_STATE[g.id].joined)||g.joined; return `<div class="rstat" onclick="openGroup('${g.id}')"><div class="zi g serif" style="font-size:17px">${esc(g.tag[0])}</div><div class="info"><div class="t">${esc(g.name)}</div><div class="m">${g.members} 人 · ${joined?'已加入':'可加入'} · 贡献 ${groupContribution(g.id)}</div></div><div class="sc" style="font-size:12px;color:var(--sub)">›</div></div>`;}).join('')}</div>
    <div class="section-h"><h3>最近参与</h3><span>点击进入</span></div><div class="room-stats">${recent.map(id=>{const r=ROOMS[id]; return `<div class="rstat" onclick="goRoom('${id}')"><div class="zi serif">${esc(r.word)}</div><div class="info"><div class="t">「${esc(r.word)}」字局</div><div class="m">${r.players} 人在玩 · 已解锁 ${r.unlocked} 首</div></div><div class="sc">›</div></div>`;}).join('')||'<p style="padding:10px 4px;font-size:12px;color:var(--sub)">还没有参与过房间</p>'}</div>`;
}
function groupContribution(id){
  const base=(DEFAULT_GROUPS.find(g=>g.id===id)||{}).contribution||0; const delta=(GROUP_STATE[id]&&GROUP_STATE[id].contribution)||0; return base+delta;
}
function renderCardSlots(inBattle){
  if(!STATS.cards.length) return '<p class="sres-empty">暂无技能卡，去字房间接歌赚卡吧</p>';
  const count={}; STATS.cards.forEach(id=>count[id]=(count[id]||0)+1);
  return Object.keys(count).map(id=>{const c=CARDS[id]; return `<div class="card-slot" onclick="${inBattle?`useCardInBattle('${id}')`:`showCardInfo('${id}')`}"><div class="cs-emoji">${c.emoji}</div><b>${c.name}</b><span>×${count[id]} ${inBattle?'· 点击使用':'· 对战可用'}</span></div>`;}).join('');
}
function showCardInfo(id){ const c=CARDS[id]; openInfoModal(c.emoji+' '+c.name,c.desc+'。技能卡只会在实时对战你的回合中消耗。'); }
function renderSettings(){
  $('settings-body').innerHTML=`<div class="section-h"><h3>个人资料</h3><span>同步到战绩海报</span></div><div class="set-row" style="cursor:default;display:block"><div class="sl">昵称</div><input class="set-input" id="set-nick" maxlength="8" value="${esc(PROFILE.nick)}"><div class="sl" style="margin:10px 0 0">个性签名</div><input class="set-input" id="set-sign" maxlength="24" value="${esc(PROFILE.sign)}"><button class="listen" style="margin-top:12px" onclick="saveProfileFromSettings()">保存资料</button></div>
    <div class="section-h"><h3>称号系统</h3></div><div class="set-row" onclick="openTitles()"><div class="sl">🏅 称号图鉴</div><div class="sv">查看全部称号 ›</div></div>
    <div class="section-h"><h3>演示与数据</h3></div><div class="set-row" onclick="toggleDemoMode()"><div class="sl">🧪 演示模式</div><div class="sv" id="demo-mode-state">${DEMO_MODE?'开启':'关闭'} ›</div></div><div class="set-row" onclick="exportDemoData()"><div class="sl">📦 导出演示数据</div><div class="sv">下载 JSON ›</div></div><div class="set-row" onclick="resetStats()"><div class="sl" style="color:var(--red)">🗑 清除战绩数据</div><div class="sv">重置为演示基线</div></div>
    <div class="section-h"><h3>关于</h3></div><div class="set-row"><div class="sl">飞花音 Demo</div><div class="sv">${APP_VERSION}</div></div><div class="set-row"><div class="sl">AI / 曲库说明</div><div class="sv" style="max-width:62%">初赛使用本地模拟数据闭环，正式版接入 ASR + LLM + TME 曲库</div></div>`;
}
let DEMO_MODE=true;
function toggleDemoMode(){ DEMO_MODE=!DEMO_MODE; const el=$('demo-mode-state'); if(el) el.textContent=DEMO_MODE?'开启':'关闭'; toast('演示模式已'+(DEMO_MODE?'开启':'关闭')); }
function saveProfileFromSettings(){ const nick=$('set-nick').value.trim(), sign=$('set-sign').value.trim(); if(nick) PROFILE.nick=nick; PROFILE.sign=sign; saveProfile(); toast('资料已保存'); }
function resetStats(){ if(!confirm('确定清除战绩数据？')) return; STATS=clone(BASELINE_STATS); saveStats(); renderHome(); toast('战绩已重置'); }
function exportDemoData(){ const payload={stats:STATS,profile:PROFILE,favs:FAVS,customRooms:USER_ROOMS,roomMutations:ROOM_MUTATIONS,groups:GROUP_STATE,exportedAt:new Date().toISOString()}; downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),'feihua-demo-data.json'); toast('演示数据已导出'); }
function openTitles(){ const lv=levelOf(STATS.total); $('titles-cur').textContent=lv.name+' · '+STATS.total+' 分'; $('titlesList').innerHTML=TITLES.map(t=>{const cur=t.name===lv.name,got=STATS.total>=t.min; return `<div class="tl-row ${cur?'cur':''}"><div class="zi2 serif" style="${got?'background:var(--red);color:#FBEFEA':'background:var(--paper);color:var(--faint);border:1px solid var(--line)'}">${t.name[0]}</div><div class="info"><div class="t">${t.name}</div><div class="m">${t.desc} · 需 ${t.min} 分</div></div><div class="st ${got?'':'lock'}">${cur?'当前':(got?'已解锁':'未解锁')}</div></div>`;}).join(''); openModal('titlesModal'); }
function closeTitles(){ closeModal('titlesModal'); }
function openSearch(){ openModal('searchModal'); $('searchInput').value=''; searchFilter(''); setTimeout(()=>$('searchInput').focus(),120); }
function closeSearch(){ closeModal('searchModal'); }
function searchFilter(q){
  q=(q||'').trim(); const box=$('searchResults'); if(!box) return;
  if(!q){ box.innerHTML='<div class="sres-empty">输入字、歌名、歌手或标签开始搜索</div>'; return; }
  const ql=normalizeText(q);
  const rooms=Object.entries(ROOMS).filter(([,r])=>roomHaystack(r).includes(ql)).map(([id,r])=>`<div class="sres-item" onclick="closeSearch();goRoom('${id}')"><div class="zi serif">${esc(r.word)}</div><div class="info"><div class="t">「${esc(r.word)}」字局${r.custom?' · 自建':''}</div><div class="m">${r.players} 人在玩 · ${esc(r.genre)} · ${esc(r.lang)} · ${r.unlocked} 首</div></div></div>`);
  const songs=[]; Object.keys(SONG_POOL).forEach(sid=>{const s=SONG_POOL[sid]; if([s.name,s.artist,s.lyric,s.genre,s.lang].join(' ').toLocaleLowerCase().includes(ql)){ const room=Object.entries(ROOMS).find(([,r])=>(r.pool||[]).includes(sid)); songs.push(`<div class="sres-item" onclick="closeSearch();openPlayer('${sid}')"><div class="zi g serif">词</div><div class="info"><div class="t">${esc(s.name)}</div><div class="m">${esc(s.artist)}${room?' · 「'+esc(room[1].word)+'」字局':''} · ${esc(s.lyric.slice(0,16))}…</div></div></div>`); }});
  box.innerHTML=rooms.join('')+songs.join('')||`<div class="sres-empty">没有找到「${esc(q)}」相关的房间或歌曲</div>`;
}

function openModal(id){ const el=$(id); if(el) el.classList.add('open'); }
function closeModal(id){ const el=$(id); if(el) el.classList.remove('open'); }
function closeAllModals(){ document.querySelectorAll('.modal.open,.overlay.open').forEach(el=>el.classList.remove('open')); }
function openInfoModal(title,body){ $('info-title').textContent=title; $('info-body').textContent=body; openModal('infoModal'); }
function closeInfoModal(){ closeModal('infoModal'); }
function openFilterModal(){
  const body=$('filter-body'); if(!body) return;
  body.innerHTML=Object.entries(FILTER_DEFS).map(([key,def])=>`<div class="filter-group"><div class="fg-title">${def.label}</div><div class="fg-options">${def.opts.map(v=>`<button class="fopt ${FILTERS[key]===v?'on':''}" onclick="pickFilter('${key}','${esc(v)}')">${esc(v)}</button>`).join('')}</div></div>`).join('')
    +`<div class="filter-group"><div class="fg-title">自定义标签</div><div class="fg-options"><input class="set-input" id="filter-keyword" value="${esc(FILTERS.keyword)}" placeholder="如：周杰伦 / 宿舍夜聊"><button class="fopt" onclick="applyFilterKeyword()">搜索</button></div></div>`;
  openModal('filterModal');
}
function pickFilter(key,value){ FILTERS[key]=FILTERS[key]===value?null:value; openFilterModal(); }
function applyFilterKeyword(){ FILTERS.keyword=($('filter-keyword').value||'').trim(); closeModal('filterModal'); renderHome(); }
function closeFilterModal(){ closeModal('filterModal'); renderHome(); }
function savePosterFromFilter(){ closeModal('filterModal'); renderHome(); }

let toastTimer=null;
function toast(msg,duration){ const t=$('toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),duration||2500); }

const SYNTH={
  ctx:null,oscs:[],available:true,SM:{1:0,2:2,3:4,4:5,5:7,6:9,7:11},
  ensure(){ try{ if(!this.ctx){ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) throw new Error('no AudioContext'); this.ctx=new AC(); } if(this.ctx.state==='suspended') this.ctx.resume(); return this.ctx; }catch(e){ this.available=false; return null; } },
  stop(){ this.oscs.forEach(o=>{try{o.stop();}catch(e){}}); this.oscs=[]; },
  playSong(mel,onended){
    const ctx=this.ensure(); if(!ctx){ onended&&onended(); return; } this.stop();
    const t0=ctx.currentTime+.06, master=ctx.createGain(); master.gain.value=.72; master.connect(ctx.destination);
    const delay=ctx.createDelay(); delay.delayTime.value=.27; const fb=ctx.createGain(); fb.gain.value=.26; const wet=ctx.createGain(); wet.gain.value=.28;
    delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(ctx.destination); master.connect(delay);
    const beat=60/mel.bpm; let t=t0,total=0;
    for(const [deg,oct,beats] of mel.notes){ const midi=60+(oct-4)*12+this.SM[deg],freq=440*Math.pow(2,(midi-69)/12),dur=beats*beat; total+=dur;
      const o=ctx.createOscillator(),g=ctx.createGain(); o.type='triangle'; o.frequency.value=freq; g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(.34,t+.03); g.gain.setValueAtTime(.30,t+dur*.62); g.gain.linearRampToValueAtTime(.0001,t+dur*.95); o.connect(g); g.connect(master); o.start(t); o.stop(t+dur); this.oscs.push(o);
      if(deg>1){ const h=ctx.createOscillator(),hg=ctx.createGain(); h.type='sine'; h.frequency.value=freq/2; hg.gain.value=.06; h.connect(hg); hg.connect(master); h.start(t); h.stop(t+dur); this.oscs.push(h); }
      t+=dur;
    }
    setTimeout(()=>{ this.oscs=[]; onended&&onended(); },Math.ceil(total*1000)+80);
  }
};
let playing=false,openSongId=null,pTimer=null,pPct=0,audioMode='visual',pStart=0,pDur=180,playerQueue=[];
function openPlayer(sid){
  const s=SONG_POOL[sid]; if(!s) return;
  openSongId=sid; playerQueue=(ROOMS[curRoom]&&ROOMS[curRoom].pool)||Object.keys(SONG_POOL);
  $('pName').textContent=s.name; $('pArtist').textContent=s.artist; $('discWord').textContent=(ROOMS[curRoom]||{word:'飞'}).word; $('pLyric').innerHTML=highlightLyric(s.lyric,keywordForRoom(curRoom)||''); $('pStory').textContent=s.story?'🎵 AI 故事卡：'+s.story:''; $('ai-tag-txt').textContent=MELODIES[sid]?'AI 合成试听 · 正式版接入 TME 正版曲库':'试听示意 · 正式版接入 TME 正版曲库';
  const mel=MELODIES[sid]||makeMelody(sid); pDur=mel.notes.reduce((a,n)=>a+n[2],0)*60/mel.bpm; $('totTime').textContent=fmtSec(pDur); favBtnSync(); setPlay(false); pPct=0; updateProg(); openModal('playerOverlay');
}
function makeMelody(sid){ let h=0; for(const c of sid)h=(h*31+c.charCodeAt(0))>>>0; const notes=[]; for(let i=0;i<12;i++){h=(h*1664525+1013904223)>>>0; notes.push([2+(h%6),4+(h%2),.5+(h%3)*.25]);} return {bpm:82,notes}; }
function keywordForRoom(id){ const r=ROOMS[id]; if(!r) return ''; return r.word.toLocaleLowerCase()==='love'?'love':r.word; }
function highlightLyric(text,keyword){ let html=esc(text); if(keyword){ const re=new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig'); html=html.replace(re,m=>`<mark class="hl">${m}</mark>`); } return html; }
function closePlayer(){ const el=$('playerOverlay'); if(el)el.classList.remove('open'); setPlay(false); SYNTH.stop(); clearInterval(pTimer); }
function setPlay(v){
  playing=v; const disc=$('disc'),arm=$('arm'),ip=$('icPlay'),ia=$('icPause'); if(disc)disc.classList.toggle('playing',v); if(arm)arm.classList.toggle('on',v); if(ip)ip.style.display=v?'none':'block'; if(ia)ia.style.display=v?'block':'none'; clearInterval(pTimer);
  if(v){ audioMode=MELODIES[openSongId]?'synth':'visual'; const mel=MELODIES[openSongId]||makeMelody(openSongId); pStart=Date.now(); SYNTH.playSong(mel,()=>{ if(playing){pPct=100;updateProg();setPlay(false);} }); pTimer=setInterval(()=>{ pPct=Math.min(100,(Date.now()-pStart)/1000/pDur*100); updateProg(); if(pPct>=100)clearInterval(pTimer); },120); }
  else SYNTH.stop();
}
function updateProg(){ if(!openSongId)return; const fill=document.querySelector('.prog .fill'),knob=document.querySelector('.prog .knob'); if(fill)fill.style.width=pPct+'%'; if(knob)knob.style.left=pPct+'%'; $('curTime').textContent=fmtSec(pDur*pPct/100); }
function togglePlay(){ setPlay(!playing); }
function playAdjacent(dir){ const i=playerQueue.indexOf(openSongId); const next=playerQueue[(i+dir+playerQueue.length)%playerQueue.length]; openPlayer(next); }
function seekPlayer(event){ const track=event.currentTarget, rect=track.getBoundingClientRect(); pPct=Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100)); updateProg(); if(playing){ setPlay(false); setPlay(true); } }
function qqMusic(sid){ const s=SONG_POOL[sid]; if(!s)return; const url='https://y.qq.com/n/ryqq/search?w='+encodeURIComponent(s.name+' '+s.artist); window.open(url,'_blank','noopener'); toast('已打开 QQ 音乐搜索：'+s.name); }
function roomWordOf(sid){ for(const id in ROOMS){ if((ROOMS[id].pool||[]).includes(sid)) return ROOMS[id].word; } return null; }
function toggleFav(sid,btn){ const i=FAVS.indexOf(sid); if(i>=0){FAVS.splice(i,1); if(btn){btn.textContent='☆ 收藏';btn.classList.remove('fav-on');} toast('已取消收藏');} else {FAVS.push(sid); if(btn){btn.textContent='★ 已收藏';btn.classList.add('fav-on');} toast('★ 已加入我的共享歌单');} saveFavs(); favBtnSync(); }
function favBtnSync(){ const t=$('favBtnTxt'); if(t&&openSongId)t.textContent=FAVS.includes(openSongId)?'★ 已收藏到我的歌单':'加入共享歌单'; }
function favFromPlayer(){ toggleFav(openSongId,null); }
function openSongs(){
  const r=ROOMS[curRoom]; if(!r)return; $('songs-title').textContent='「'+r.word+'」字局 · 共享歌单'; $('songs-sub').textContent='本房已解锁 '+r.unlocked+' 首 · 接对的歌都在这里';
  $('songs-body').innerHTML=(r.pool||[]).map(sid=>({sid,s:SONG_POOL[sid]})).filter(x=>x.s).map(x=>`<div class="sres-item"><div class="zi g serif">${esc(r.word)}</div><div class="info"><div class="t">${esc(x.s.name)}</div><div class="m">${esc(x.s.artist)}</div></div><button class="mini-btn" style="--mc:var(--green)" onclick="openPlayer('${x.sid}');closeSongs()">▶ 试听</button><button class="fav-btn ${FAVS.includes(x.sid)?'fav-on':''}" onclick="toggleFav('${x.sid}',this)">${FAVS.includes(x.sid)?'★ 已收藏':'☆ 收藏'}</button></div>`).join('')||'<div class="sres-empty">本房曲库暂未收录，唱第一首就能解锁</div>';
  openModal('songsModal');
}
function closeSongs(){ closeModal('songsModal'); }
function toggleMore(id,btn){ const el=$(id); if(!el)return; const open=el.classList.toggle('open'); if(btn){ const orig=btn.dataset.more||btn.textContent; btn.dataset.more=orig; btn.textContent=open?'收起 ▴':orig; } }
function like(cardId,btn){
  const card=findCard(curRoom,cardId); if(!card)return; const liked=!card.liked; card.liked=liked; card.likes=Math.max(0,(card.likes||0)+(liked?1:-1));
  const m=ensureMutation(curRoom); m.contributions.push({type:'like',cardId,data:{liked,delta:liked?1:-1}}); persistMutation(curRoom); renderRoom(curRoom);
}
function dblAdd(user){ if(FRIENDS.includes(user)){ toast('你和 '+user+' 已经是好友'); return; } FRIENDS.push(user); saveFriends(); toast('已向 '+user+' 发送好友申请，双击破冰成功'); }
