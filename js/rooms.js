/* 字房间主链、三层交互与创建流程。 */
function customBgHTML(r){
  const h=[...(r.word||'梦')].reduce((a,c)=>a+c.charCodeAt(0),0)%360, h2=(h+72)%360;
  return `<div class="ink-scene" style="--h:${h};--h2:${h2}">
    <i class="ink-blob b1"></i><i class="ink-blob b2"></i><i class="ink-blob b3"></i><i class="ink-mountain"></i>
    <div class="bz serif">${esc(r.word)}</div><div class="ai-badge"><b>AI 画师</b> · 即时生成 · 「${esc(r.word)}」专属意境</div></div>`;
}
function renderRoom(id){
  const r=ROOMS[id]; if(!r){ goHome(); return; } curRoom=id;
  $('room-title').innerHTML=`「${esc(r.word)}」字局<div class="sub">${r.players} 人 · 异步进行中 · 已解锁 ${r.unlocked} 首</div>`;
  const board=$('bgboard');
  if(r.custom&&!r.generated){
    board.className='bgboard custom'; board.innerHTML=`<div class="bz serif">${esc(r.word)}</div><div class="gen"><span class="spark">✨</span><span>AI 正在生成「${esc(r.word)}」的水墨背景板…</span></div><div class="ai-badge"><b>AI 画师</b> · 文生图</div>`;
    setTimeout(()=>{ if(curRoom===id&&!r.generated){ r.generated=true; persistUserRoom(id); const b=$('bgboard'); if(b&&b.classList.contains('custom')){ b.className='bgboard'; b.innerHTML=customBgHTML(r); } } },DEMO_MODE?900:2600);
  } else if(r.custom){ board.className='bgboard'; board.innerHTML=customBgHTML(r); }
  else { board.className='bgboard'; board.innerHTML=`<img src="${esc(r.img||'assets/bg/yue.jpg')}" alt="「${esc(r.word)}」字房间意境背景板"><div class="wash"></div><div class="bz serif">${esc(r.word)}</div><div class="ai-badge"><b>AI 画师</b> · ${esc(r.genre||'水墨')}意境</div>`; }
  $('rulebar').innerHTML=`规则：唱任意一句带 <span class="k">「${esc(r.word)}」</span> 字的歌词即可，无需同时在线，<span class="k">花传到你后 24 小时内</span>接上；相同歌词自动归并到首位，首唱 2 分、跟唱 1 分。`;
  $('playlist-txt').innerHTML=`房间共享歌单 · 本房已解锁 <b>${r.unlocked} 首歌</b>，可一起听`;
  $('feed').innerHTML=(r.cards||[]).length?r.cards.map(c=>cardHTML(c)).join(''):`<div class="empty-room"><div class="big-zi serif">${esc(r.word)}</div>房间刚开，花传到你——<br>唱第一句带「${esc(r.word)}」的歌词吧<div class="cmt-row" style="padding:14px 16px 0"><input class="cmt-input" id="first-post" placeholder="也可以先留一句文字发言…" maxlength="60"><button class="cmt-send" onclick="postFirstText()">发送</button></div></div>`;
  $('rec-hint').innerHTML=`🎙 点红色按钮开唱：一句带 <b>「${esc(r.word)}」</b> 的歌词即可，AI 自动识别判分`;
  show('view-room');
  if(!sessionStorage.getItem('feihua_guide')){ sessionStorage.setItem('feihua_guide','1'); setTimeout(()=>toast('🎙 玩法：点底部红色按钮，唱一句带「'+r.word+'」的歌词，AI 判官自动计分'),650); }
}
function cardHTML(c){
  if(c.type==='text') return `${cardHeadHTML(c)}<div class="txt-body">${esc(c.text)}</div>${commentsHTML(c)}${actionsHTML(c)}</article>`;
  const s=SONG_POOL[c.song]||{name:'演示曲目',artist:'曲库匹配',lyric:'暂无歌词',story:'正式版将从 TME 曲库获取创作背景'};
  const kw=keywordForRoom(curRoom);
  const voice=c.audio?`<div class="voice-bar real-audio" data-audio="${esc(c.audio)}"><button class="vb-play" onclick="toggleVoiceAudio(this)">▶</button><div class="wave">${waveBars()}</div><div class="dur">${esc(c.dur||'0:06')}</div><div class="lyr">${highlightLyric(s.lyric,kw)}</div></div>`:`<div class="voice-bar"><div class="wave">${waveBars()}</div><div class="dur">${esc(c.dur||'0:06')}</div><div class="lyr">${highlightLyric(s.lyric,kw)}</div></div>`;
  const dups=(c.dups||[]).length?`<div class="dups"><div class="dup-title">相同歌词跟唱 · ${c.dups.length} 人</div>${c.dups.slice(0,c.dupsOpen?99:2).map(d=>`<div class="dup" data-audio="${esc(d.audio||'')}"><div class="avatar" style="background:${esc(d.grad||'#999')}">${esc((d.user||'友')[0])}</div>${d.audio?`<button class="dlisten" onclick="toggleVoiceAudio(this)" aria-label="回放">▶</button>`:`<div class="mini-wave">${miniWave()}</div>`}<div class="dlyr">${highlightLyric(s.lyric,kw)}</div><div class="who">${esc(d.user)} · ${esc(d.time||'刚刚')}${d.audio?' · 可回放':''}</div><button class="dlisten" onclick="openPlayer('${c.song}')" aria-label="一起听">♫</button></div>`).join('')}${c.dups.length>2?`<button class="expand" onclick="toggleDupList('${c.id}')">${c.dupsOpen?'收起跟唱 ▴':'展开全部 '+c.dups.length+' 条跟唱 ▾'}</button>`:''}</div>`:'';
  return `${cardHeadHTML(c)}${voice}<button class="listen" onclick="openPlayer('${c.song}')">♫ 一起听《${esc(s.name)}》</button><div class="story-line">🎵 AI 故事卡：${esc(s.story)}</div>${dups}${commentsHTML(c)}${actionsHTML(c)}</article>`;
}
function cardHeadHTML(c){
  const score=c.type==='text'?'发言':(c.score||'+1');
  return `<article class="voice-card" data-card-id="${esc(c.id)}"><div class="vc-head"><div class="avatar" style="background:${esc(c.grad||'#999')}" ondblclick="dblAdd('${esc(c.user)}')" title="双击加好友">${esc((c.user||'友')[0])}</div><div class="nm">${esc(c.user)}</div><div class="tm">${esc(c.time||'刚刚')}</div><span class="score-tag ${String(score).startsWith('+2')?'score-first':'score-dup'}">${esc(score)}</span></div>`;
}
function commentsHTML(c){
  const count=(c.comments||[]).length;
  const inner=c.comments.map(cmtHTML).join('');
  return `<div class="comments"><div class="collapsed-more" id="more-${esc(c.id)}">${inner}</div><button class="expand comment-toggle" onclick="toggleCommentPanel('${c.id}',this)">${count?'查看 '+count+' 条评论 ▾':'写第一条评论'}</button><div class="cmt-row"><input class="cmt-input" placeholder="说点什么…" maxlength="60" onkeydown="if(event.key==='Enter')addComment('${c.id}',this)"><button class="cmt-send" onclick="addComment('${c.id}',this)">发送</button><button class="emoji-btn" onclick="quickReaction('${c.id}','👏')">👏</button><button class="emoji-btn" onclick="quickReaction('${c.id}','🔥')">🔥</button></div></div>`;
}
function cmtHTML(c){ return `<div class="cmt"><div class="avatar" style="background:${esc(c.grad||'#999')}">${esc((c.user||'友')[0])}</div><div><div class="cb"><b>${esc(c.user)}</b> ${esc(c.text)}</div><div class="cmt-time">${esc(c.time||'刚刚')}</div></div></div>`; }
function actionsHTML(c){ return `<div class="vc-actions"><button class="act ${c.liked?'liked':''}" onclick="like('${c.id}',this)"><svg width="16" height="16" viewBox="0 0 24 24" fill="${c.liked?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.6-10-9.2C.4 8.6 2 5 5.4 5c2 0 3.4 1.2 4.6 2.8C11.2 6.2 12.6 5 14.6 5 18 5 19.6 8.6 22 11.8 19.5 16.4 12 21 12 21Z"/></svg><span class="n">${c.likes||0}</span></button><button class="act" onclick="toggleCommentPanel('${c.id}',this)"><span class="n">${(c.comments||[]).length} 条评论</span></button><button class="act" onclick="shareRoomCard('${esc(c.id)}')">分享</button></div></article>`; }
function waveBars(){ return '<i style="height:8px"></i><i style="height:14px"></i><i style="height:20px"></i><i style="height:12px"></i><i style="height:22px"></i><i style="height:16px"></i><i style="height:10px"></i><i style="height:18px"></i><i style="height:13px"></i><i style="height:7px"></i>'; }
function miniWave(){ return '<i style="height:6px"></i><i style="height:12px"></i><i style="height:9px"></i><i style="height:14px"></i><i style="height:7px"></i>'; }
function toggleDupList(cardId){ const c=findCard(curRoom,cardId); if(!c)return; c.dupsOpen=!c.dupsOpen; renderRoom(curRoom); }
function toggleCommentPanel(cardId,btn){ const el=$('more-'+cardId); if(!el)return; const open=el.classList.toggle('open'); if(btn){const orig=btn.dataset.more||btn.textContent;btn.dataset.more=orig;btn.textContent=open?'收起评论 ▴':orig;} }
function addComment(cardId,input){
  const field=input&&input.classList.contains('cmt-input')?input:(input&&input.parentElement?input.parentElement.querySelector('.cmt-input'):null); const text=field?field.value.trim():'';
  if(!text){ toast('写点什么再发送'); return; } const card=findCard(curRoom,cardId); if(!card)return;
  const cmt={id:uid('cmt'),user:PROFILE.nick,ac:'#a85a44',grad:'linear-gradient(135deg,#c98a6a,#a85a44)',text,time:'刚刚'}; card.comments.unshift(cmt); recordContribution(curRoom,'comment',cardId,cmt); renderRoom(curRoom); toast('评论已发布');
}
function quickReaction(cardId,emoji){
  const card=findCard(curRoom,cardId); if(!card)return; const cmt={id:uid('cmt'),user:PROFILE.nick,ac:'#a85a44',grad:'linear-gradient(135deg,#c98a6a,#a85a44)',text:emoji,time:'刚刚'}; card.comments.unshift(cmt); recordContribution(curRoom,'comment',cardId,cmt); renderRoom(curRoom); toast('已发送 '+emoji);
}
function postFirstText(){
  const input=$('first-post'),text=input?input.value.trim():''; if(!text){toast('写点什么再发送');return;} const card={id:uid('card'),user:PROFILE.nick,ac:'#a85a44',grad:'linear-gradient(135deg,#c98a6a,#a85a44)',time:'刚刚',type:'text',text,dups:[],comments:[],likes:0}; ROOMS[curRoom].cards.unshift(card); recordUserCard(curRoom,card); renderRoom(curRoom); toast('发言成功');
}
function shareRoomCard(cardId){ const c=findCard(curRoom,cardId); if(!c)return; const text=c.type==='text'?c.text:SONG_POOL[c.song].name+'：'+SONG_POOL[c.song].lyric; if(navigator.clipboard) navigator.clipboard.writeText(text).then(()=>toast('精彩一句已复制，可分享到微信/QQ')).catch(()=>toast('分享内容：'+text)); else toast('分享内容：'+text); }

function openCreateModal(){
  $('createInput').value='';
  if($('createGenre')) $('createGenre').value='流行';
  if($('createLang')) $('createLang').value='国语';
  if($('createEra')) $('createEra').value='10s';
  if($('createTags')) $('createTags').value='';
  hideThemeChoice();
  openModal('createModal'); setTimeout(()=>$('createInput').focus(),120);
}
function closeCreateModal(){ hideThemeChoice(); closeModal('createModal'); }
function hideThemeChoice(){ const box=$('create-conflict'); if(box){box.hidden=true;box.innerHTML='';} }
function createRoom(){
  const word=($('createInput').value||'').trim(); if(!word){toast('先输入一个字或词，如「梦」');return;}
  const normalized=word.slice(0,4);
  const existing=Object.entries(ROOMS).filter(([,r])=>normalizeText(r.word)===normalizeText(normalized)).sort((a,b)=>b[1].players-a[1].players);
  if(existing.length){ showThemeChoice(existing[0][0],normalized,existing.length); return; }
  createNewThemeRoom(normalized);
}
function showThemeChoice(existingId,word,matchCount){
  const r=ROOMS[existingId],box=$('create-conflict'); if(!r||!box)return;
  const rr=STATS.rooms[existingId]||{first:0,dups:0};
  box.hidden=false;
  box.innerHTML=`<div class="tc-kicker">发现已有同主题房间</div><div class="tc-room"><div class="zi g serif">${esc(r.word)}</div><div><b>「${esc(r.word)}」字局${r.custom?' · 自建':''}</b><span>${r.players} 人在玩 · 已解锁 ${r.unlocked} 首${(rr.first+rr.dups)?' · 你接过 '+((rr.first||0)+(rr.dups||0))+' 首':''}</span></div></div>${matchCount>1?`<div class="tc-note">当前共有 ${matchCount} 个同主题房间，这里优先展示参与人数最多的一个。</div>`:''}<div class="tc-actions"><button class="tc-option primary" onclick="enterExistingTheme('${existingId}')"><b>进入已有主题房</b><span>沿用现有歌单、战绩和互动</span></button><button class="tc-option" onclick="createNewThemeRoom()"><b>创建一个新的同名房间</b><span>拥有独立歌单、房主身份和成员数据</span></button></div><button class="tc-back" onclick="hideThemeChoice()">换一个主题词</button>`;
}
function enterExistingTheme(id){ if(!ROOMS[id])return; closeCreateModal(); goRoom(id); toast('已进入已有「'+ROOMS[id].word+'」主题房'); }
function createNewThemeRoom(word){
  const normalized=String(word||$('createInput').value||'').trim().slice(0,4); if(!normalized){toast('先输入一个字或词');return;}
  const id=uid('c'); const tags=($('createTags')&&$('createTags').value||'').split(/[，, ]+/).filter(Boolean).slice(0,3);
  ROOMS[id]={word:normalized,players:1,unlocked:0,hot:false,custom:true,img:null,generated:false,genre:($('createGenre')&&$('createGenre').value)||'流行',lang:($('createLang')&&$('createLang').value)||'国语',era:($('createEra')&&$('createEra').value)||'10s',modes:['异步接力','实时对战'],tags:tags.length?tags:['自建','好友局'],follows:0,newDups:0,pool:[],cards:[],mine:'房主'};
  persistUserRoom(id); closeCreateModal(); renderHome(); toast('新的「'+normalized+'」字局已创建，AI 正在生成背景板'); renderRoom(id);
}
function openRoomSet(){
  const r=ROOMS[curRoom]; if(!r)return; $('rset-title').textContent='「'+r.word+'」字局 · 设置'; $('rset-sub').textContent=r.players+' 人在玩 · 已解锁 '+r.unlocked+' 首 · '+(r.custom?'自建房间（房主）':'官方房间');
  const songs=(r.pool||[]).map(sid=>({sid,s:SONG_POOL[sid]})).filter(x=>x.s);
  $('rset-body').innerHTML=`<div class="set-row"><div class="sl">📖 当前玩法</div><div class="sv">异步接力 · ${esc((r.modes||[]).join(' / '))}</div></div>
    <div class="set-row" onclick="startBattlePreset('relay','${esc(r.word)}')"><div class="sl">⚡ 标准接力赛</div><div class="sv">立即开局 ›</div></div><div class="set-row" onclick="startBattlePreset('bomb','${esc(r.word)}')"><div class="sl">💣 炸弹歌对决</div><div class="sv">立即开局 ›</div></div><div class="set-row" onclick="startBattlePreset('reverse','${esc(r.word)}')"><div class="sl">🚫 反向禁字局</div><div class="sv">立即开局 ›</div></div><div class="set-row" onclick="startBattlePreset('aiq','${esc(r.word)}')"><div class="sl">🤖 AI 出题局</div><div class="sv">立即开局 ›</div></div><div class="set-row" onclick="startBattlePreset('multi','${esc(r.word)}')"><div class="sl">🌏 多语言关键词</div><div class="sv">立即开局 ›</div></div>
    <div class="set-row" onclick="openReport()"><div class="sl">📤 分享本局战报</div><div class="sv">生成 PNG ›</div></div><div class="set-row" onclick="startHighlightRecording()"><div class="sl">⏺ 录屏精彩集锦</div><div class="sv">浏览器录屏 ›</div></div>
    <div class="section-h"><h3>本房曲库（${songs.length} 首）</h3><span>点击试听</span></div><div class="sres" style="max-height:220px">${songs.map(x=>`<div class="sres-item" onclick="openPlayer('${x.sid}');closeRoomSet()"><div class="zi g serif">${esc(r.word)}</div><div class="info"><div class="t">${esc(x.s.name)}</div><div class="m">${esc(x.s.artist)}</div></div></div>`).join('')||'<div class="sres-empty">自建房曲库尚未解锁，唱第一首即可建立共享歌单</div>'}</div>${r.custom?`<div class="set-row" style="margin-top:12px" onclick="deleteRoom()"><div class="sl" style="color:var(--red)">🗑 删除这个房间</div><div class="sv">仅限房主</div></div>`:''}<div class="set-row" style="margin-top:${r.custom?'4px':'12px'}" onclick="closeRoomSet();goHome()"><div class="sl">🚪 离开房间</div><div class="sv">›</div></div>`;
  openModal('roomSetModal');
}
function closeRoomSet(){ closeModal('roomSetModal'); }
function deleteRoom(){ const r=ROOMS[curRoom]; if(!r)return; if(!confirm('确定删除「'+r.word+'」字局？'))return; delete ROOMS[curRoom]; delete USER_ROOMS[curRoom]; saveJSON(STORAGE.rooms,USER_ROOMS); closeRoomSet(); renderHome(); goHome(); toast('房间已删除'); }

let rec=false,recStarting=false,mediaRec=null,chunks=[],recStream=null,recStart=0,recTimerInt=null,speechRec=null;
let REC={transcript:'',candidateIds:[],selected:null};
function toggleRec(){ if(rec){stopRec();return;} if(recStarting)return; if(AUTOTEST_MODE){startSimRec();return;} if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){ recStarting=true; navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{ recStream=stream; mediaRec=new MediaRecorder(stream); chunks=[]; REC.transcript=''; mediaRec.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);}; mediaRec.onstop=()=>{ if(recStream){recStream.getTracks().forEach(t=>t.stop());recStream=null;} const durSec=Math.max(1,Math.round((Date.now()-recStart)/1000)); const recorded=chunks.slice(); const mime=(mediaRec&&mediaRec.mimeType)||'audio/webm'; endRecUI(); if(recorded.length){const blob=new Blob(recorded,{type:mime});finishRec(URL.createObjectURL(blob),'0:'+String(durSec).padStart(2,'0'));}else{toast('没录到声音，已切换为演示判官');finishRec(null,'0:06');} }; try{mediaRec.start();}catch(e){endRecUI();startSimRec();return;} rec=true;recStart=Date.now();startRecUI();startSpeechRecognition();toast('录音中…再点一下结束');setTimeout(()=>{if(rec)stopRec();},20000); }).catch(()=>startSimRec()).finally(()=>{recStarting=false;}); } else startSimRec(); }
function stopRec(){ if(mediaRec&&mediaRec.state!=='inactive')mediaRec.stop(); else if(rec){endRecUI();finishRec(null,'0:06');} else {endRecUI();toast('已取消录音');} }
function startRecUI(){ $('recBtn').classList.add('rec'); $('rec-label').textContent='⏹ 结束'; const t=$('rec-timer'); if(t){t.classList.add('show');t.textContent='🎙 录音中 00:00';} recTimerInt=setInterval(()=>{const s=Math.floor((Date.now()-recStart)/1000);if($('rec-timer'))$('rec-timer').textContent='🎙 录音中 00:'+String(s).padStart(2,'0');},500); }
function endRecUI(){ rec=false;mediaRec=null;chunks=[];if(speechRec){try{speechRec.stop();}catch(e){}}speechRec=null;if($('recBtn'))$('recBtn').classList.remove('rec');if($('rec-label'))$('rec-label').textContent='🎤 接歌';if($('rec-timer'))$('rec-timer').classList.remove('show');clearInterval(recTimerInt); }
function startSpeechRecognition(){ const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR)return; try{ speechRec=new SR();speechRec.lang='zh-CN';speechRec.interimResults=true;speechRec.continuous=false;speechRec.onresult=e=>{let text='';for(let i=e.resultIndex;i<e.results.length;i++)text+=e.results[i][0].transcript;REC.transcript=text.trim();};speechRec.start(); }catch(e){speechRec=null;} }
function startSimRec(){ if(rec)return; rec=true;recStart=Date.now();startRecUI();toast('（演示模式）录音中…AI 正在识别歌词');setTimeout(()=>{if(!rec)return;endRecUI();finishRec(null,'0:06');},DEMO_MODE?1200:2200); }
function finishRec(audioUrl,dur){ openJudgeModal(audioUrl,dur,REC.transcript||''); }
function openJudgeModal(audioUrl,dur,transcript){
  const r=ROOMS[curRoom]; if(!r)return;
  const all=Object.keys(SONG_POOL), word=keywordForRoom(curRoom), roomSongs=(r.pool||[]).filter(sid=>r.custom?true:songMatch(sid,word));
  const transcriptHits=all.filter(sid=>transcript&&(SONG_POOL[sid].name.includes(transcript)||transcript.includes(SONG_POOL[sid].name)||lyricText(sid).includes(transcript)));
  const matches=all.filter(sid=>songMatch(sid,word));
  const pool=[...new Set([...transcriptHits,...roomSongs,...matches,...all.slice(0,3)])].slice(0,4);
  REC={audioUrl,dur,transcript,candidateIds:pool,selected:pool[0]||null}; renderJudgeModal(); openModal('judgeModal');
}
function renderJudgeModal(){
  const r=ROOMS[curRoom], word=keywordForRoom(curRoom); if(!r)return;
  $('judge-body').innerHTML=`<div class="judge-listening"><span class="pulse-dot"></span><b>AI 判官报告</b><div>${REC.transcript?'语音识别：『'+esc(REC.transcript)+'』':'未获取可用歌词文本，已从 TME 曲库候选中进行语义匹配。'}</div></div>${REC.candidateIds.map(sid=>{const s=SONG_POOL[sid],matched=songMatch(sid,word),already=isSongOnMainChain(r,sid);return `<button class="judge-candidate ${REC.selected===sid?'selected':''}" onclick="selectJudgeCandidate('${sid}')"><div class="jc-head"><b>${esc(s.name)}</b><span>${matched?'含「'+esc(word)+'」 ✓':'相似匹配'}</span></div><div class="jc-lyric">${highlightLyric(s.lyric,word)}</div><div class="jc-meta">${esc(s.artist)} · ${already?'已存在：发布后自动归并为跟唱 +1':'首次出现：发布为首唱 +2'}</div></button>`;}).join('')||'<div class="sres-empty">曲库中没有找到可判定片段，请换一个关键字或重录</div>'}<div class="judge-summary" id="judge-summary">${judgeSummaryHTML()}</div>`;
}
function judgeSummaryHTML(){ const sid=REC.selected; if(!sid)return ''; const matched=songMatch(sid,keywordForRoom(curRoom)),already=isSongOnMainChain(ROOMS[curRoom],sid); return `<b>判定：</b>${matched?'歌词通过关键字校验':'演示曲库扩展匹配（正式版交由 TME 曲库复核）'} · ${already?'将与首唱自动归并（+1）':'将成为新首唱（+2）'}`; }
function isSongOnMainChain(room,sid){ return !!(room&&(room.cards||[]).some(c=>c.song===sid)); }
function selectJudgeCandidate(sid){ REC.selected=sid; renderJudgeModal(); }
function closeJudgeModal(){ closeModal('judgeModal'); }
function cancelJudge(){ REC.audioUrl=null; REC.selected=null; REC.candidateIds=[]; closeJudgeModal(); toast('已取消发布，可以重新唱一句'); }
function publishJudge(){
  const sid=REC.selected,r=ROOMS[curRoom]; if(!sid||!r){toast('请选择一首识别结果');return;} const s=SONG_POOL[sid],matched=songMatch(sid,keywordForRoom(curRoom)),first=!isSongOnMainChain(r,sid); if(!matched&&!DEMO_MODE){toast('AI 判定未通过：片段不含房间关键字，请换一句重录');return;} const matchNote=matched?'':'（演示扩展匹配）';
  const base={user:PROFILE.nick,ac:'#a85a44',grad:'linear-gradient(135deg,#c98a6a,#a85a44)',time:'刚刚',song:sid,dur:REC.dur||'0:06'};
  if(first){ const card=Object.assign({},base,{id:uid('card'),score:'+2 首唱',audio:REC.audioUrl,dups:[],comments:[],likes:0}); r.cards.unshift(card); if(!r.pool.includes(sid)){r.pool.push(sid);r.unlocked=(r.unlocked||0)+1;} recordUserCard(curRoom,card); bumpStats(curRoom,true,2); toast('AI 判官：识别为《'+s.name+'》'+matchNote+' · 首唱 +2 分',3200); }
  else { const card=r.cards.find(c=>c.song===sid); const dup={id:uid('dup'),user:PROFILE.nick,ac:'#a85a44',grad:'linear-gradient(135deg,#c98a6a,#a85a44)',time:'刚刚',audio:REC.audioUrl,dur:REC.dur||'0:06'}; card.dups.unshift(dup); recordContribution(curRoom,'dup',card.id,dup); bumpStats(curRoom,false,1); toast('AI 判官：这句已有人唱过，自动归并 · 跟唱 +1 分',3200); }
  if(r.custom)persistUserRoom(curRoom); closeJudgeModal(); renderRoom(curRoom); showStamp(true);
}
function showStamp(win){ const el=$('stampOverlay'); if(!el)return; el.classList.toggle('lose',!win); el.classList.add('show'); el.innerHTML=win?'<div class="stamp-ring">接<br>令</div>':'<div class="stamp-ring">重<br>来</div>'; setTimeout(()=>el.classList.remove('show'),1100); }

let voiceAudio=null,voiceBarEl=null,voiceBtnEl=null;
function toggleVoiceAudio(btn){
  const bar=btn.closest('[data-audio]'),url=bar&&bar.dataset.audio; if(!url)return;
  if(voiceAudio&&voiceBarEl===bar&&!voiceAudio.paused){voiceAudio.pause();return;} if(voiceAudio)voiceAudio.pause(); if(voiceBtnEl)voiceBtnEl.textContent='▶'; if(voiceBarEl)voiceBarEl.classList.remove('playing');
  voiceAudio=new Audio(url);voiceBarEl=bar;voiceBtnEl=btn;voiceAudio.onplay=()=>{bar.classList.add('playing');btn.textContent='⏸';};voiceAudio.onended=()=>{bar.classList.remove('playing');btn.textContent='▶';};voiceAudio.onpause=()=>{bar.classList.remove('playing');btn.textContent='▶';};voiceAudio.play().catch(()=>toast('浏览器阻止了回放，请再点一次'));
}

function goRoom(id){ closePlayer(); renderRoom(id); }
