/* 实时对战：五种模式、8 秒倒计时、炸弹动画与技能卡。 */
const AUTOTEST_MODE = new URLSearchParams(location.search).has('autotest');
let BATTLE={
  mode:null,kw:null,myBomb:null,oppBomb:null,round:0,myScore:0,oppScore:0,myDouble:false,banSid:null,doubleOpp:0,turn:'me',options:[],opp:clone(OPPONENTS[0]),outcome:null,resultMsg:'',timer:null,timer2:null,boomTimer:null,startedAt:0
};
let CHOICE_STATE={title:'',options:[],handler:null};
function startBattle(){ closePlayer(); clearBattleTimers(); BATTLE=Object.assign(BATTLE,{mode:null,kw:null,outcome:null,resultMsg:''}); setTab('home'); show('view-battle'); renderBattleMode(); }
function startBattlePreset(mode,kw){ closeRoomSet(); closePlayer(); clearBattleTimers(); setTab('home'); show('view-battle'); if(kw&&canJudgeKeyword(kw)){BATTLE.mode=mode;setupBattle(kw);}else{BATTLE.mode=mode;pickBattleKw(mode);} }
function exitBattle(){ clearBattleTimers(); show('view-home'); renderHome(); }
function clearBattleTimers(){ clearInterval(BATTLE.timer);clearTimeout(BATTLE.timer2);clearTimeout(BATTLE.boomTimer); }
function renderBattleMode(){
  BATTLE.opp=clone(OPPONENTS[Math.floor(Math.random()*OPPONENTS.length)]);
  $('battle-body').innerHTML=`<div class="battle-hint">和 <b>${esc(BATTLE.opp.name)}</b>（${BATTLE.opp.level}）开一局 · 每种模式都有真实的回合、倒计时与胜负判定</div>${BATTLE_MODES.map(m=>`<div class="mode-card" onclick="pickBattleKw('${m.id}')"><div class="mode-icon">${m.icon}</div><div class="mode-info"><b>${m.name}</b><span>${m.desc}</span></div><div class="mode-go">›</div></div>`).join('')}<div class="section-h"><h3>我的技能卡</h3><span>你的回合中点击使用</span></div><div class="battle-cards">${renderCardSlots(true)}</div>`;
}
function canJudgeKeyword(kw){ return Object.keys(SONG_POOL).some(sid=>songMatch(sid,kw)); }
function pickBattleKw(mode){
  BATTLE.mode=mode; const m=BATTLE_MODES.find(x=>x.id===mode)||BATTLE_MODES[0];
  const kws=mode==='multi'?['月','雨','love','さくら']:BATTLE_KWS;
  $('battle-body').innerHTML=`<div class="battle-hint">${m.icon} <b>${m.name}</b> · 选择关键字${mode==='multi'?'（多语言）':''}</div><div class="kw-grid">${kws.map(k=>`<div class="kw-chip" onclick="setupBattle('${esc(k)}')">${esc(k)}</div>`).join('')}</div>${mode==='aiq'?`<div class="ai-pick-row"><button class="listen" onclick="aiPickKw()">🤖 让 AI 出题官出题</button></div>`:''}<div class="ai-pick-row"><input class="cmt-input" id="custom-kw" placeholder="自定义关键字，如：梦 / love" maxlength="8"><button class="cmt-send" onclick="setupBattleCustom()">开局</button></div><button class="listen" style="margin-top:8px" onclick="renderBattleMode()">‹ 返回选模式</button>`;
}
function aiPickKw(){ const liked=FAVS.map(sid=>SONG_POOL[sid]&&SONG_POOL[sid].lyric||'').join(' '); const found=BATTLE_KWS.find(k=>liked.includes(k))||BATTLE_KWS[Math.floor(Math.random()*BATTLE_KWS.length)]; toast('🤖 AI 出题官：根据你的收藏与曲库热度，就出「'+found+'」！',3200); setTimeout(()=>setupBattle(found),300); }
function setupBattleCustom(){ const v=($('custom-kw').value||'').trim(); if(!v){toast('先输入关键字');return;} if(!canJudgeKeyword(v)){toast('本地演示曲库暂无含「'+v+'」的歌词，试试月/雨/爱/love');return;} setupBattle(v); }
function setupBattle(kw){
  BATTLE.kw=kw;BATTLE.round=0;BATTLE.myScore=0;BATTLE.oppScore=0;BATTLE.myDouble=false;BATTLE.myBomb=null;BATTLE.oppBomb=null;BATTLE.banSid=null;BATTLE.doubleOpp=0;BATTLE.outcome=null;BATTLE.resultMsg='';BATTLE.startedAt=Date.now();
  if(BATTLE.mode==='bomb'){renderBombPick();return;} startRound();
}
function renderBombPick(){
  const matches=Object.keys(SONG_POOL).filter(sid=>songMatch(sid,BATTLE.kw));
  $('battle-body').innerHTML=`<div class="battle-hint">💣 秘密选择你的炸弹歌（含「${esc(BATTLE.kw)}」）：对方一旦唱出它，对方引爆失败</div>${matches.map(sid=>{const s=SONG_POOL[sid];return `<div class="mode-card" onclick="pickMyBomb('${sid}')"><div class="mode-icon">🎵</div><div class="mode-info"><b>${esc(s.name)}</b><span>${esc(s.artist)}</span></div><div class="mode-go">设弹</div></div>`;}).join('')}<button class="listen" style="margin-top:8px" onclick="pickBattleKw('bomb')">‹ 返回</button>`;
}
function pickMyBomb(sid){ BATTLE.myBomb=sid; const others=Object.keys(SONG_POOL).filter(s=>songMatch(s,BATTLE.kw)&&s!==sid); BATTLE.oppBomb=others[Math.floor(Math.random()*others.length)]||sid; toast('你的炸弹已埋好，对方的炸弹也已就位'); startRound(); }
function startRound(){ if(BATTLE.outcome)return; BATTLE.round++;BATTLE.turn='me';BATTLE.options=genOptions();renderBattleTurn();startTimer(); }
function genOptions(){
  const all=Object.keys(SONG_POOL),matches=all.filter(s=>songMatch(s,BATTLE.kw)),non=all.filter(s=>!songMatch(s,BATTLE.kw)),pick=a=>a[Math.floor(Math.random()*a.length)];
  let picks=BATTLE.mode==='reverse'?[pick(matches),pick(non),pick(non)]:[pick(matches),pick(matches),pick(non)];
  picks=picks.filter(Boolean); const uniq=[...new Set(picks)]; while(uniq.length<3){const extra=pick(all);if(!uniq.includes(extra))uniq.push(extra);} return uniq.slice(0,3);
}
function renderBattleTurn(){
  const isMe=BATTLE.turn==='me', modeName=(BATTLE_MODES.find(m=>m.id===BATTLE.mode)||{}).name||'对战';
  const note=BATTLE.mode==='reverse'?`禁字「${esc(BATTLE.kw)}」：唱的歌里<b>不能</b>含它`:`关键字「${esc(BATTLE.kw)}」：唱的歌里必须含它`;
  $('battle-body').innerHTML=`<div class="vs-bar"><div class="vs-player"><div class="avatar" style="background:linear-gradient(135deg,#c98a6a,#a85a44)">你</div><b>你</b><span class="vs-score">${BATTLE.myScore}</span></div><div class="vs-mid">${esc(modeName)}<small>第 ${BATTLE.round} 回合</small></div><div class="vs-player"><div class="avatar" style="background:${BATTLE.opp.color}" ondblclick="dblAdd('${esc(BATTLE.opp.name)}')">${esc(BATTLE.opp.avatar)}</div><b>${esc(BATTLE.opp.name)}</b><span class="vs-score">${BATTLE.oppScore}</span></div></div><div class="turn-bar ${isMe?'':'opp'}">${isMe?`<div class="timer-track"><div class="timer-fill" id="timer-fill"></div></div><b id="timer-num">8</b><span>秒内选择一句歌词</span>`:`<div class="opp-thinking">${esc(BATTLE.opp.name)} 正在接歌…<span class="spark">🎵</span></div>`}</div><div class="battle-rule">${note}</div>${isMe?`<div class="option-list" id="option-list">${BATTLE.options.map(sid=>{const s=SONG_POOL[sid],match=songMatch(sid,BATTLE.kw);return `<div class="mode-card opt" onclick="myPick('${sid}')"><div class="mode-icon">🎵</div><div class="mode-info"><b>${esc(s.name)}</b><span>${esc(s.artist)} · ${highlightLyric(s.lyric,BATTLE.kw).replace(/<[^>]+>/g,'').slice(0,16)}…</span></div><span class="opt-tag ${match?'':'warn'}">${match?'含「'+esc(BATTLE.kw)+'」':'不含'}</span></div>`;}).join('')}</div>`:''}${BATTLE.mode==='bomb'?`<div class="bomb-status"><span>我的炸弹：${BATTLE.myBomb?'已设置':'未设置'}</span><span>对方炸弹：保密</span></div>`:''}<div class="section-h"><h3>技能卡</h3><span>你的回合中点击使用</span></div><div class="battle-cards">${renderCardSlots(true)}</div>`;
}
function startTimer(){
  clearInterval(BATTLE.timer); const end=Date.now()+8000,fill=$('timer-fill'),num=$('timer-num');
  BATTLE.timer=setInterval(()=>{ const left=Math.max(0,(end-Date.now())/1000),sec=Math.ceil(left); if(fill)fill.style.width=(left/8*100)+'%'; if(num)num.textContent=sec; if(left<=0){clearInterval(BATTLE.timer);if(BATTLE.turn==='me')boomLose('⏱ 8 秒没接上，「'+BATTLE.kw+'」局你输了');} },100);
}
function myPick(sid){
  if(BATTLE.turn!=='me'||BATTLE.outcome)return; clearInterval(BATTLE.timer); const s=SONG_POOL[sid],match=songMatch(sid,BATTLE.kw);
  if(BATTLE.mode==='bomb'&&sid===BATTLE.oppBomb){ boomLose('💣 你唱出了对方预设的炸弹歌《'+s.name+'》——你被引爆了！'); return; }
  if(BATTLE.mode==='reverse'&&match){ boomLose('🚫 《'+s.name+'》里藏着禁字「'+BATTLE.kw+'」——你踩雷了！'); return; }
  if(BATTLE.mode!=='reverse'&&!match){ boomLose('❌ 《'+s.name+'》不含「'+BATTLE.kw+'」——接令失败！'); return; }
  const gain=BATTLE.myDouble?2:1; BATTLE.myScore+=gain; BATTLE.myDouble=false; toast('✓ AI 判官：判定通过 +'+gain+' 分',2200); if(BATTLE.round>=6){finishRound();return;} oppTurn();
}
function oppTurn(){
  BATTLE.turn='opp'; renderBattleTurn();
  BATTLE.timer2=setTimeout(()=>{
    if(BATTLE.outcome)return; const allMatches=Object.keys(SONG_POOL).filter(s=>songMatch(s,BATTLE.kw)),non=Object.keys(SONG_POOL).filter(s=>!songMatch(s,BATTLE.kw));
    const safeMatches=allMatches.filter(s=>s!==BATTLE.banSid); const pick=a=>a[Math.floor(Math.random()*a.length)]; const banned=BATTLE.banSid;BATTLE.banSid=null;
    if(banned&&safeMatches.length===0&&allMatches.length===1){boomWin('🚫 禁句卡生效：'+BATTLE.opp.name+' 无歌可唱，你赢了！');return;}
    let oppSid;
    if(BATTLE.mode==='bomb'){ if(BATTLE.myBomb&&Math.random()<.28){boomWin('💥 '+BATTLE.opp.name+' 唱出了你的炸弹歌《'+SONG_POOL[BATTLE.myBomb].name+'》——对方引爆！');return;} oppSid=pick(safeMatches.length?safeMatches:allMatches); }
    else if(BATTLE.mode==='reverse'){ oppSid=Math.random()<.35?pick(allMatches):pick(non); if(songMatch(oppSid,BATTLE.kw)){boomWin('🚫 '+BATTLE.opp.name+' 唱出了禁字「'+BATTLE.kw+'」——《'+SONG_POOL[oppSid].name+'》踩雷！');return;} }
    else oppSid=pick(safeMatches.length?safeMatches:allMatches);
    BATTLE.oppScore++;BATTLE.oppLast=oppSid;toast(BATTLE.opp.name+' 接了《'+SONG_POOL[oppSid].name+'》（+1）',1800);
    if(BATTLE.doubleOpp>0){BATTLE.doubleOpp--;oppTurn();return;} if(BATTLE.round>=6){finishRound();return;} startRound();
  },BATTLE.opp.thinkMs||1500);
}

function useCardInBattle(id){
  const c=CARDS[id]; if(!c)return;
  if(BATTLE.turn!=='me'||BATTLE.outcome){toast('在你的回合才能使用技能卡');return;}
  if(id==='shuangbei'){ if(useCard(id)){BATTLE.myDouble=true;toast('✖️2 双倍卡已使用：本轮得分翻倍');renderBattleTurn();} return; }
  if(id==='tiaoguo'){ if(useCard(id)){BATTLE.myScore=Math.max(0,BATTLE.myScore-1);toast('⏭ 跳过卡：本轮跳过并扣 1 分');mySkip();} return; }
  if(id==='qiujiu'){ const helpers=GROUP_MEMBERS.slice(0,4); openChoiceModal('选择帮唱队友',helpers.map(name=>({label:name,value:name})),()=>{ if(!useCard(id))return; const sid=BATTLE.options.find(s=>BATTLE.mode==='reverse'?!songMatch(s,BATTLE.kw):songMatch(s,BATTLE.kw)); if(sid){toast('🆘 队友帮唱成功');myPick(sid);}else{refundCard(id);toast('本轮没有合适的帮唱片段，卡已退回');} }); return; }
  if(id==='jinqu'){ const choices=(BATTLE.options||[]).filter(s=>songMatch(s,BATTLE.kw)); openChoiceModal('禁句卡：选择本轮禁唱歌曲',choices.map(sid=>({label:SONG_POOL[sid].name,value:sid})),()=>{}); CHOICE_STATE.handler=()=>{ if(!useCard(id))return; const sid=CHOICE_STATE.selected; BATTLE.banSid=sid;toast('🚫 '+SONG_POOL[sid].name+' 本轮禁唱');renderBattleTurn(); }; return; }
  if(id==='fanzhuan'){ if(useCard(id)){BATTLE.doubleOpp=2;toast('🔄 反转卡：对手必须连续接两轮');renderBattleTurn();} return; }
}
function openChoiceModal(title,options,handler){
  CHOICE_STATE={title,options,handler:draftHandler=>{},selected:null}; CHOICE_STATE.handler=handler||(()=>{});
  $('choice-title').textContent=title; $('choice-body').innerHTML=options.map((o,i)=>`<button class="choice-option" onclick="chooseChoice(${i})">${esc(o.label)}</button>`).join('')||'<div class="sres-empty">没有可选目标</div>'; openModal('choiceModal');
}
function chooseChoice(i){ const o=CHOICE_STATE.options[i]; if(!o)return; CHOICE_STATE.selected=o.value; closeModal('choiceModal'); const h=CHOICE_STATE.handler; h(o.value); }
function mySkip(){ BATTLE.turn='opp';renderBattleTurn();BATTLE.timer2=setTimeout(()=>{if(BATTLE.round>=6)finishRound();else startRound();},1100); }
function boomWin(msg){BATTLE.outcome='win';BATTLE.resultMsg=msg;showBoom(true);}
function boomLose(msg){BATTLE.outcome='lose';BATTLE.resultMsg=msg;showBoom(false);}
function showBoom(win){ const ov=$('boomOverlay'); if(!ov){finishRound();return;} ov.classList.toggle('win',win);ov.classList.add('show');ov.querySelector('.boom-text').textContent=win?'赢 了':'炸 了';clearBattleTimers();BATTLE.boomTimer=setTimeout(()=>{ov.classList.remove('show');finishRound();},1400); }
function finishRound(){ if(BATTLE.outcome)return; if(BATTLE.myScore>BATTLE.oppScore)BATTLE.outcome='win';else if(BATTLE.myScore<BATTLE.oppScore)BATTLE.outcome='lose';else BATTLE.outcome='draw'; BATTLE.resultMsg=BATTLE.outcome==='draw'?'六回合打满，棋逢对手':(BATTLE.outcome==='win'?'你带着领先优势拿下了这一局':'对手在最后阶段完成了反超'); battleResult(); }
function battleResult(){
  clearBattleTimers(); if(!BATTLE.outcome)BATTLE.outcome=BATTLE.myScore>=BATTLE.oppScore?'win':'lose';
  const win=BATTLE.outcome==='win',lose=BATTLE.outcome==='lose',title=win?'🎉 你赢了！':(lose?'💥 惜败':'🤝 平局收官');
  STATS.battles++;if(win)STATS.wins++;STATS.history.unshift({mode:BATTLE.mode,modeName:(BATTLE_MODES.find(m=>m.id===BATTLE.mode)||{}).name||'实时对战',kw:BATTLE.kw,myScore:BATTLE.myScore,oppScore:BATTLE.oppScore,win,time:new Date().toISOString()});STATS.history=STATS.history.slice(0,20);saveStats();
  const decisive=BATTLE.oppLast?SONG_POOL[BATTLE.oppLast]:null;
  $('battle-body').innerHTML=`<div class="result-box ${win?'win':(lose?'lose':'')}"><div class="result-title serif">${title}</div><div class="result-score">你 ${BATTLE.myScore} : ${BATTLE.oppScore} ${esc(BATTLE.opp.name)}</div><div class="result-msg">${esc(BATTLE.resultMsg||'六回合打满')}</div>${decisive?`<div class="story-line" style="margin-top:10px">🎵 AI 故事卡：${esc(decisive.story)}</div>`:''}<div class="result-actions"><button class="cancel" onclick="shareBattleResult()">分享战报</button><button class="ok" onclick="setupBattle('${esc(BATTLE.kw)}')">再来一局</button><button class="cancel" onclick="exitBattle()">返回首页</button></div></div>`;
}
function shareBattleResult(){ const text=`飞花音实时对战：${(BATTLE_MODES.find(m=>m.id===BATTLE.mode)||{}).name} · 关键字「${BATTLE.kw}」 · 我 ${BATTLE.myScore}:${BATTLE.oppScore} ${BATTLE.opp.name}`; if(navigator.clipboard)navigator.clipboard.writeText(text).then(()=>toast('战报已复制，可分享到微信/QQ')).catch(()=>toast(text));else toast(text); }
function closeChoiceModal(){ closeModal('choiceModal'); }
