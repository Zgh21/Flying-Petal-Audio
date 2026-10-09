/* 启动与内置自动验收。 */
function initApp(){
  ensureStats(); buildRoomState(); renderHome();
  document.addEventListener('keydown',e=>{ if(e.key==='Escape')closeAllModals(); });
  const report=$('autotest-report'); if(report&&!AUTOTEST_MODE)report.style.display='none';
  if(AUTOTEST_MODE)setTimeout(runAutotest,300);
}
async function runAutotest(){
  const report=$('autotest-report'),lines=[],t=(name,ok,extra='')=>lines.push((ok?'PASS ':'FAIL ')+name+(extra?' | '+extra:'')),wait=ms=>new Promise(r=>setTimeout(r,ms)),click=el=>{if(!el)throw new Error('not found');el.click();};
  report.style.display='block';
  try{
    localStorage.removeItem(STORAGE.stats);localStorage.removeItem(STORAGE.profile);localStorage.removeItem(STORAGE.favs);localStorage.removeItem(STORAGE.rooms);localStorage.removeItem(STORAGE.roomMutations);localStorage.removeItem(STORAGE.groups);
    STATS=clone(BASELINE_STATS);PROFILE={nick:'你',sign:'爱唱歌的生活观察家'};FAVS=[];USER_ROOMS={};ROOM_MUTATIONS={};GROUP_STATE={};FRIENDS=[];buildRoomState();renderHome();await wait(80);
    t('启动完成',!!$('view-home')); t('官方字房间完整',document.querySelectorAll('.room-card').length===Object.keys(DEFAULT_ROOMS).length); t('榜单 TOP3 徽标',document.querySelectorAll('.rank-badge').length===3); t('AI 推荐官已生成',document.querySelector('#ai-note .inline-link'));
    cycleFilter('genre');await wait(30);t('曲风筛选生效',document.querySelectorAll('.room-card').length>0&&document.querySelectorAll('.room-card').length<Object.keys(DEFAULT_ROOMS).length);resetFilter();await wait(30);t('筛选可清除',document.querySelectorAll('.room-card').length===Object.keys(DEFAULT_ROOMS).length);openFilterModal();t('多维筛选弹层',document.querySelectorAll('#filter-body .fopt').length>=15);closeFilterModal();
    goRoom('yu');await wait(50);t('进入字房间', $('view-room').classList.contains('active'));t('AI 水墨背景板存在',!!document.querySelector('#bgboard img, #bgboard .ink-scene'));t('主链语音卡渲染',document.querySelectorAll('.voice-card').length>=2);t('三层评论默认折叠',!!document.querySelector('.collapsed-more')&&!document.querySelector('.collapsed-more').classList.contains('open'));
    const before=ROOMS.yu.cards.length;click($('recBtn'));await wait(1500);t('录音进入 AI 判官', $('judgeModal').classList.contains('open'));t('AI 判官给候选',document.querySelectorAll('.judge-candidate').length>=2);selectJudgeCandidate('r3');publishJudge();await wait(80);t('首唱真实上链 +2',ROOMS.yu.cards.length===before+1&&ROOMS.yu.cards[0].song==='r3'&&ROOMS.yu.cards[0].score==='+2 首唱');
    openJudgeModal(null,'0:05','');selectJudgeCandidate('r1');publishJudge();await wait(60);t('重复歌词自动归并 +1',findCard('yu','yu-c1').dups.length>=2);t('战绩实时累计',STATS.total>BASELINE_STATS.total&&STATS.songs>BASELINE_STATS.songs);
    const cardId=ROOMS.yu.cards[0].id;const cmtInput=document.querySelector('[data-card-id="'+cardId+'"] .cmt-input');cmtInput.value='自检评论：这句我接了';addComment(cardId,cmtInput);await wait(40);t('评论写入并持久化',findCard('yu',cardId).comments.some(c=>c.text.includes('自检评论')));
    const likeBefore=findCard('yu',cardId).likes;like(cardId);await wait(30);t('点赞真实改变状态',findCard('yu',cardId).likes===likeBefore+1&&findCard('yu',cardId).liked===true);
    const snapshot=clone(ROOM_MUTATIONS.yu);buildRoomState();t('刷新恢复用户互动',ROOM_MUTATIONS.yu&&findCard('yu',cardId).comments.some(c=>c.text.includes('自检评论')));
    openPlayer(ROOMS.yu.pool[0]);await wait(30);t('一起听播放器打开', $('playerOverlay').classList.contains('open'));togglePlay();await wait(300);t('合成试听真实走动',pPct>0||!SYNTH.available);closePlayer();
    openSearch();searchFilter('风继续吹');t('搜索命中歌曲', $('searchResults').textContent.includes('风继续吹'));searchFilter('love');t('搜索支持多语言', $('searchResults').textContent.includes('Love Story'));closeSearch();
    openCreateModal();$('createInput').value='月';createRoom();await wait(30);t('同主题显示进入/新建双路径',!$('create-conflict').hidden&&$('create-conflict').textContent.includes('进入已有')&&$('create-conflict').textContent.includes('创建一个新的'));click(document.querySelector('#create-conflict [onclick*="enterExistingTheme"]'));await wait(40);t('可选择进入已有主题房',curRoom==='yue'&&$('view-room').classList.contains('active'));goHome();openCreateModal();$('createInput').value='梦';$('createTags').value='宿舍夜聊 周杰伦专场';createRoom();await wait(30);t('同主题仍保留新建入口',!$('create-conflict').hidden);click(document.querySelector('#create-conflict [onclick*="createNewThemeRoom"]'));await wait(100);t('可创建同名新房间',ROOMS[curRoom].custom&&ROOMS[curRoom].word==='梦'&&curRoom!=='meng');t('自建房元数据保存',!!USER_ROOMS[Object.keys(USER_ROOMS)[0]]);await wait(1000);t('AI 意境背景生成', $('bgboard').textContent.includes('AI 画师'));const customId=Object.keys(USER_ROOMS)[0];goHome();t('自建房进入发现页',document.querySelectorAll('.room-card').length===Object.keys(DEFAULT_ROOMS).length+1);
    goRecords();t('战绩页渲染', $('view-records').classList.contains('active'));t('战绩海报预览',document.querySelectorAll('#records-body .poster').length>=1);t('Canvas 海报可生成',createPosterCanvas('personal').width===900);goMe();t('我的页渲染', $('view-me').classList.contains('active'));t('社群入口渲染', $('me-body').textContent.includes('歌友社群'));
    openGroup('g2');await wait(30);joinGroup('g2');t('社群加入状态生效',groupData('g2').joined);$('group-message').value='今晚十点接一句';postGroupMessage('g2');await wait(30);t('社群消息发布',groupData('g2').messages.some(m=>m.text.includes('今晚十点')));closeGroup();
    startBattle();await wait(30);t('五种对战模式',document.querySelectorAll('.mode-card').length>=5);click(document.querySelector('.mode-card'));await wait(30);t('关键字可选择',document.querySelectorAll('.kw-chip').length>=5);setupBattle('月');await wait(40);t('对战回合渲染',!!document.querySelector('.vs-bar')&&document.querySelectorAll('#option-list .opt').length===3);const valid=[...document.querySelectorAll('#option-list .opt')].find(o=>o.querySelector('.opt-tag')&&!o.querySelector('.opt-tag').classList.contains('warn'));click(valid);await wait(100);t('AI 判官通过接歌',BATTLE.myScore===1);await wait(1600);t('对手回合自动完成',BATTLE.oppScore===1&&BATTLE.turn==='me');
    STATS.cards.push('jinqu');renderBattleTurn();await wait(20);click([...document.querySelectorAll('.card-slot')].find(x=>x.textContent.includes('禁句卡')));t('禁句卡打开目标选择', $('choiceModal').classList.contains('open'));if($('choice-body').querySelector('.choice-option'))chooseChoice(0);t('禁句卡设置禁用歌曲',!!BATTLE.banSid);exitBattle();
    goRoom('yu');const roomCardsBefore=ROOMS.yu.cards.length;openJudgeModal(null,'0:06','');selectJudgeCandidate('r4');publishJudge();await wait(50);t('自建/官方房间曲库扩展',ROOMS.yu.cards.length===roomCardsBefore+1);
    t('演示数据完整导出对象',!!(STATS&&PROFILE&&ROOM_MUTATIONS));
  }catch(e){t('异常中断',false,e&&e.stack?e.stack:e.message);}
  report.textContent='AUTOTEST\n'+lines.join('\n')+'\nRESULT: '+(lines.some(l=>l.startsWith('FAIL'))?'HAS FAILURES':'ALL PASS');
}
initApp();
