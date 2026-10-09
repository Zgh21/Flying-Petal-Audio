/* 分享海报、录屏与长期社群。 */
function downloadBlob(blob,filename){ const a=document.createElement('a'),url=URL.createObjectURL(blob); a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000); }
function posterData(kind,roomId){
  const room=ROOMS[roomId||curRoom],lv=levelOf(STATS.total); if(kind==='room'&&room){const rr=STATS.rooms[roomId||curRoom]||{score:0,first:0,dups:0};return {kind,title:'飞花音 · 「'+room.word+'」字局战报',word:room.word,score:rr.score||0,line:'首唱 '+(rr.first||0)+' · 跟唱 '+(rr.dups||0)+' · 本房 '+room.players+' 人在玩',footer:'扫码进「'+room.word+'」字局接令 · AI 战绩画师生成',songs:(room.pool||[]).slice(0,4).map(sid=>SONG_POOL[sid]).filter(Boolean),seed:room.word}; }
  return {kind:'personal',title:'飞花音 · 个人战绩',word:'飞',score:STATS.total,line:lv.name+' · 接歌 '+STATS.songs+' 首 · 首唱 '+STATS.first+' 首 · 连对 '+STATS.bestStreak+' 首',footer:'扫码加入我的常玩房间 · AI 战绩画师生成',songs:FAVS.slice(0,4).map(sid=>SONG_POOL[sid]).filter(Boolean),seed:PROFILE.nick+STATS.total};
}
function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines){ const chars=String(text||'').split('');let line='',n=0;for(const ch of chars){const test=line+ch;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);y+=lineHeight;line=ch;n++;if(maxLines&&n>=maxLines){line='…';break;}}else line=test;}if(line)ctx.fillText(line,x,y);return y+lineHeight; }
function createPosterCanvas(kind,roomId){
  const data=posterData(kind,roomId),canvas=document.createElement('canvas');canvas.width=900;canvas.height=1350;const ctx=canvas.getContext('2d');
  const bg=ctx.createLinearGradient(0,0,900,1350);bg.addColorStop(0,'#f8f2e8');bg.addColorStop(1,'#e7dccb');ctx.fillStyle=bg;ctx.fillRect(0,0,900,1350);
  ctx.globalAlpha=.12;ctx.fillStyle='#b5372e';ctx.beginPath();ctx.arc(720,170,170,0,Math.PI*2);ctx.fill();ctx.fillStyle='#2c6e63';ctx.beginPath();ctx.arc(130,1190,220,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle='#b5372e';ctx.font='900 190px "Noto Serif SC",serif';ctx.textAlign='center';ctx.fillText(data.word,450,330);
  ctx.fillStyle='#211c16';ctx.font='700 42px "Noto Sans SC",sans-serif';ctx.fillText(data.title,450,430);
  ctx.font='900 108px "Noto Serif SC",serif';ctx.fillText(String(data.score)+' 分',450,610);
  ctx.font='32px "Noto Sans SC",sans-serif';ctx.fillStyle='#5f5648';ctx.textAlign='left';wrapCanvasText(ctx,data.line,120,710,660,48,3);
  if(data.songs.length){ctx.font='700 30px "Noto Sans SC",sans-serif';ctx.fillStyle='#211c16';ctx.fillText('本局歌单',120,850);ctx.font='28px "Noto Sans SC",sans-serif';ctx.fillStyle='#5f5648';data.songs.forEach((s,i)=>ctx.fillText((i+1)+'. '+s.name+' · '+s.artist,120,910+i*48));}
  drawPosterQR(ctx,data.seed,590,900,190);
  ctx.fillStyle='#8c8272';ctx.font='24px "Noto Sans SC",sans-serif';ctx.textAlign='center';wrapCanvasText(ctx,data.footer,450,1190,680,38,2);
  ctx.strokeStyle='#b5372e';ctx.lineWidth=6;ctx.strokeRect(38,38,824,1274);
  return canvas;
}
function drawPosterQR(ctx,seed,x,y,size){ let h=0;for(const ch of String(seed||'fly'))h=(h*31+ch.charCodeAt(0))>>>0;const n=21,cell=size/n;ctx.fillStyle='#fff';ctx.fillRect(x,y,size,size);ctx.fillStyle='#211c16';for(let r=0;r<n;r++)for(let c=0;c<n;c++){h=(h*1664525+1013904223)>>>0;const finder=(r<7&&c<7)||(r<7&&c>=n-7)||(r>=n-7&&c<7);const on=finder?((r===0||r===6||c===0||c===6||r===2||r===4||c===2||c===4)&&!(r===3&&(c===3||c===4))):h%2===0;if(on)ctx.fillRect(x+c*cell,y+r*cell,cell-.6,cell-.6);}}
function posterBlob(kind,roomId,callback){ const canvas=createPosterCanvas(kind,roomId); if(canvas.toBlob)canvas.toBlob(blob=>callback(blob),'image/png');else{const a=document.createElement('a');a.href=canvas.toDataURL('image/png');callback(null,a.href);} }
function downloadPoster(kind,roomId){ posterBlob(kind,roomId,(blob,url)=>{ if(blob)downloadBlob(blob,'feihua-'+(kind==='room'?(ROOMS[roomId||curRoom]||{}).word||'room':'personal')+'.png');else if(url){const a=document.createElement('a');a.href=url;a.download='feihua-poster.png';a.click();} toast('战绩海报已生成并保存'); }); }
function sharePoster(kind,roomId){
  posterBlob(kind,roomId,async(blob,url)=>{ if(!blob){if(url){window.open(url,'_blank');}return;} const file=new File([blob],'feihua-poster.png',{type:'image/png'}); try{ if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({title:'飞花音战绩',text:'来飞花音接一句',files:[file]});toast('分享面板已打开');return;} }catch(e){} downloadBlob(blob,'feihua-poster.png');toast('当前浏览器不支持直接分享，已下载 PNG'); });
}
function openReport(){
  const r=ROOMS[curRoom]; if(!r)return; const rr=STATS.rooms[curRoom]||{score:0,first:0,dups:0};
  $('report-body').innerHTML=posterPreviewHTML('room',curRoom)+`<p class="poster-actions"><button class="listen" onclick="downloadPoster('room','${curRoom}')">⬇ 保存 PNG</button><button class="listen" onclick="sharePoster('room','${curRoom}')">📤 分享战报</button><button class="listen" onclick="startHighlightRecording()">⏺ 录屏集锦</button></p><p class="report-note">真实生成 900×1350 PNG；录屏使用浏览器屏幕捕获，结束后自动下载 WebM。</p>`;
  openModal('reportModal');
}
function closeReport(){ closeModal('reportModal'); }
let highlightRec={recorder:null,stream:null,chunks:[],active:false};
async function startHighlightRecording(){
  if(highlightRec.active){ stopHighlightRecording(); return; }
  if(AUTOTEST_MODE||!navigator.mediaDevices||!navigator.mediaDevices.getDisplayMedia||!window.MediaRecorder){ toast('当前环境不支持屏幕录制，已提供海报保存作为替代'); downloadPoster('room',curRoom); return; }
  try{ const stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:30},audio:false}); const rec=new MediaRecorder(stream); highlightRec={recorder:rec,stream,chunks:[],active:true}; rec.ondataavailable=e=>{if(e.data.size)highlightRec.chunks.push(e.data);}; rec.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(highlightRec.chunks,{type:rec.mimeType||'video/webm'});downloadBlob(blob,'feihua-highlights-'+Date.now()+'.webm');highlightRec.active=false;toast('精彩集锦已录制并下载');}; rec.start(); toast('录屏中…再次点击红色录制按钮可结束',3200); }catch(e){ toast('未获得录屏权限，已改为保存战报图片');downloadPoster('room',curRoom); }
}
function stopHighlightRecording(){ if(highlightRec.recorder&&highlightRec.recorder.state!=='inactive')highlightRec.recorder.stop(); }

function groupData(id){
  const base=clone(DEFAULT_GROUPS.find(g=>g.id===id)||DEFAULT_GROUPS[0]); const state=GROUP_STATE[id]||{};
  return Object.assign(base,state,{messages:state.messages||[]});
}
function openGroup(id){
  const g=groupData(id); const joined=!!g.joined; const ranking=[
    {name:'阿杰',score:72,me:false},{name:PROFILE.nick,score:groupContribution(id),me:true},{name:'十七',score:58,me:false},{name:'小雨',score:44,me:false}
  ].sort((a,b)=>b.score-a.score);
  $('group-title').textContent=g.name; $('group-sub').textContent=g.members+' 人 · '+g.desc;
  $('group-body').innerHTML=`<div class="gm-list">${GROUP_MEMBERS.slice(0,6).map(m=>`<div class="gm" ondblclick="dblAdd('${esc(m)}')"><div class="avatar" style="background:linear-gradient(135deg,#c98a6a,#a85a44)">${esc(m[0])}</div><span>${esc(m)}</span></div>`).join('')}<div class="gm more">+${Math.max(0,g.members-6)}</div></div><p class="sres-empty" style="padding:8px 0 4px">双击成员头像可加好友 · 已加好友 ${FRIENDS.length} 人</p>
    <div class="group-stats"><div><b>${groupContribution(id)}</b><span>我的贡献</span></div><div><b>${g.rank}</b><span>社群排名</span></div><div><b>${g.messages.length}</b><span>群内消息</span></div></div>
    <div class="section-h" style="padding-left:0;padding-right:0"><h3>群贡献榜</h3><span>本周</span></div><div class="rank-list">${ranking.map((x,i)=>`<div class="${x.me?'me':''}"><em>${i+1}</em><b>${esc(x.name)}</b><span>${x.score}</span></div>`).join('')}</div>
    <div class="section-h" style="padding-left:0;padding-right:0"><h3>群动态</h3><span>最新在前</span></div><div class="group-messages" id="group-messages">${g.messages.slice(0,5).map(m=>`<div class="group-msg"><b>${esc(m.user)}</b><span>${esc(m.text)}</span><em>${esc(m.time)}</em></div>`).join('')||(g.activity||[]).map(t=>`<div class="group-msg"><b>系统</b><span>${esc(t)}</span><em>刚刚</em></div>`).join('')}</div>
    <div class="cmt-row" style="padding:10px 0"><input class="cmt-input" id="group-message" maxlength="80" placeholder="在社群里约一句…"><button class="cmt-send" onclick="postGroupMessage('${id}')">发送</button></div>
    <div class="modal-btns"><button class="cancel" onclick="${joined?`leaveGroup('${id}')`:`joinGroup('${id}')`}">${joined?'退出社群':'加入社群'}</button><button class="ok" onclick="startGroupBattle('${id}')">⚡ 发起约战</button></div>`;
  openModal('groupModal');
}
function closeGroup(){ closeModal('groupModal'); }
function joinGroup(id){ const g=groupData(id); GROUP_STATE[id]=Object.assign({},GROUP_STATE[id],{joined:true,contribution:(GROUP_STATE[id]&&GROUP_STATE[id].contribution)||0,messages:g.messages||[]}); saveJSON(STORAGE.groups,GROUP_STATE); toast('已加入 '+g.name); openGroup(id); renderMe(); }
function leaveGroup(id){ const g=groupData(id); GROUP_STATE[id]=Object.assign({},GROUP_STATE[id],{joined:false,messages:g.messages||[]}); saveJSON(STORAGE.groups,GROUP_STATE); toast('已退出 '+g.name); openGroup(id); }
function postGroupMessage(id){ const input=$('group-message'),text=input&&input.value.trim(); if(!text){toast('先写一句约歌内容');return;} const g=groupData(id); const messages=(g.messages||[]).slice(); messages.unshift({id:uid('msg'),user:PROFILE.nick,text,time:'刚刚'}); GROUP_STATE[id]=Object.assign({},GROUP_STATE[id],{messages,joined:true,contribution:((GROUP_STATE[id]&&GROUP_STATE[id].contribution)||0)+1}); saveJSON(STORAGE.groups,GROUP_STATE); logActivity('在'+g.name+'发言：'+text); toast('已发送到社群'); openGroup(id); }
function startGroupBattle(id){ const g=groupData(id); openChoiceModal('选择约战模式',BATTLE_MODES.map(m=>({label:m.icon+' '+m.name,value:m.id})),()=>{}); CHOICE_STATE.handler=value=>{GROUP_STATE[id]=Object.assign({},GROUP_STATE[id],{joined:true,contribution:((GROUP_STATE[id]&&GROUP_STATE[id].contribution)||0)+2});saveJSON(STORAGE.groups,GROUP_STATE);closeGroup();startBattlePreset(value,null);}; }
function shareGroupInvite(id){ const g=groupData(id),text='我在飞花音「'+g.name+'」等你，双击头像加好友，随时开一局'+location.href; if(navigator.clipboard)navigator.clipboard.writeText(text).then(()=>toast('社群邀请已复制')).catch(()=>toast(text));else toast(text); }
