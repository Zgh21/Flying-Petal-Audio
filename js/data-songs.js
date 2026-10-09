/* 飞花音数据层：所有歌词均为短句演示片段，正式产品由 TME 曲库 API 返回。 */
const APP_VERSION = 'v4.0-interactive';
const STORAGE = {
  stats: 'feihua_stats_v4',
  profile: 'feihua_profile_v4',
  favs: 'feihua_favs_v4',
  rooms: 'feihua_rooms_v4',
  roomMutations: 'feihua_room_mutations_v4',
  groups: 'feihua_groups_v4',
  friends: 'feihua_friends_v4',
  activity: 'feihua_activity_v4'
};

const SONG_POOL = {
  y1:{name:'月亮代表我的心',artist:'邓丽君',lyric:'你问我爱你有多深，月亮代表我的心',genre:'流行',lang:'国语',era:'经典',story:'1973 年陈芬兰首唱，邓丽君翻唱后成为华人世界最熟悉的旋律之一'},
  y2:{name:'城里的月光',artist:'许美静',lyric:'城里的月光把梦照亮，请温暖他心房',genre:'流行',lang:'国语',era:'千禧',story:'许美静 1996 年代表作，新加坡音乐人陈佳明为她量身打造'},
  y3:{name:'月半小夜曲',artist:'李克勤',lyric:'仍然在听，月半小夜曲',genre:'流行',lang:'粤语',era:'经典',story:'改编自日本歌手河合奈保子的《Half Moon Serenade》'},
  y4:{name:'但愿人长久',artist:'王菲',lyric:'明月几时有，把酒问青天',genre:'古风',lang:'国语',era:'经典',story:'苏轼《水调歌头》作词、梁弘志谱曲，邓丽君原唱、王菲翻唱'},
  r1:{name:'听见下雨的声音',artist:'周杰伦',lyric:'而我听见雨的声音，想起你用唇语说爱情',genre:'流行',lang:'国语',era:'10s',story:'周杰伦、方文山 2013 年为同名电影创作的主题曲'},
  r2:{name:'下雨天',artist:'南拳妈妈',lyric:'雨天了怎么办，我好想你',genre:'流行',lang:'国语',era:'千禧',story:'南拳妈妈 Lara 主唱，2008 年雨天 KTV 必点曲目'},
  r3:{name:'雨爱',artist:'杨丞琳',lyric:'雨爱的秘密，能一直延续',genre:'流行',lang:'国语',era:'10s',story:'杨丞琳 2010 年代表作，电视剧《海派甜心》片尾曲'},
  r4:{name:'雨天',artist:'孙燕姿',lyric:'谁能体谅我的雨天，所以情愿回你身边',genre:'流行',lang:'国语',era:'千禧',story:'孙燕姿 2006 年专辑《逆光》中的抒情代表作'},
  f1:{name:'起风了',artist:'买辣椒也用券',lyric:'晚风吹起你鬓间的白发，抚平回忆留下的疤',genre:'民谣',lang:'国语',era:'10s',story:'翻唱自高桥优《ヤキモチ》，买辣椒也用券填词后全网爆红'},
  f2:{name:'夏天的风',artist:'温岚',lyric:'夏天的风我永远记得，清清楚楚地说你爱我',genre:'流行',lang:'国语',era:'千禧',story:'周杰伦作曲、温岚演唱，2004 年的夏日标配'},
  f3:{name:'东风破',artist:'周杰伦',lyric:'谁在用琵琶弹奏一曲东风破，岁月在墙上剥落看见小时候',genre:'古风',lang:'国语',era:'千禧',story:'周杰伦 2003 年作品，公认华语中国风的开山之作'},
  f4:{name:'风继续吹',artist:'张国荣',lyric:'风继续吹，不忍远离，心里极渴望希望留下伴着你',genre:'流行',lang:'粤语',era:'经典',story:'张国荣 1983 年代表作，改编自山口百惠《さよならの向う側》'},
  ye1:{name:'夜曲',artist:'周杰伦',lyric:'为你弹奏肖邦的夜曲，纪念我死去的爱情',genre:'流行',lang:'国语',era:'千禧',story:'周杰伦 2005 年专辑《十一月的萧邦》主打歌'},
  ye2:{name:'夜空中最亮的星',artist:'逃跑计划',lyric:'夜空中最亮的星，能否听清',genre:'摇滚',lang:'国语',era:'10s',story:'逃跑计划 2011 年作品，校园夜晚的常驻 BGM'},
  ye3:{name:'白天不懂夜的黑',artist:'那英',lyric:'你永远不懂我伤悲，像白天不懂夜的黑',genre:'流行',lang:'国语',era:'经典',story:'那英 1995 年代表作，林隆璇词曲'},
  ye4:{name:'晚安',artist:'颜人中',lyric:'晚安，愿长夜无梦，在所有夜晚安眠',genre:'民谣',lang:'国语',era:'20s',story:'颜人中在短视频时代被大量翻唱的深夜治愈曲'},
  love1:{name:'Love Story',artist:'Taylor Swift',lyric:"It\'s a love story, baby, just say yes",genre:'流行',lang:'英语',era:'千禧',story:'Taylor Swift 2008 年成名曲，用罗密欧与朱丽叶改写了一个圆满结局'},
  love2:{name:'Yesterday',artist:'The Beatles',lyric:'Now I long for yesterday, love was such an easy game to play',genre:'摇滚',lang:'英语',era:'经典',story:'披头士 1965 年作品，历史上被翻唱次数最多的歌之一'},
  love3:{name:'My Heart Will Go On',artist:'Céline Dion',lyric:'Love can touch us one time and last for a lifetime',genre:'流行',lang:'英语',era:'经典',story:'电影《泰坦尼克号》主题曲，1997 年响彻全世界'},
  jp1:{name:'さくら（独唱）',artist:'森山直太朗',lyric:'さくら さくら 今、咲き誇る',genre:'民谣',lang:'日语',era:'千禧',story:'森山直太朗 2003 年的毕业季代表曲'},
  ai1:{name:'爱你',artist:'王心凌',lyric:'爱你 爱你 爱你 随时都要一起',genre:'流行',lang:'国语',era:'千禧',story:'王心凌 2004 年甜心代表作，2022 年舞台再度翻红'},
  ai2:{name:'后来',artist:'刘若英',lyric:'后来，我总算学会了如何去爱',genre:'流行',lang:'国语',era:'经典',story:'刘若英 1999 年代表作，翻唱自 Kiroro《未来へ》'},
  ai3:{name:'小幸运',artist:'田馥甄',lyric:'爱上你的时候还不懂感情',genre:'流行',lang:'国语',era:'10s',story:'电影《我的少女时代》主题曲，2015 年红遍华语校园'},
  meng1:{name:'最初的梦想',artist:'范玮琪',lyric:'最初的梦想紧握在手上',genre:'流行',lang:'国语',era:'千禧',story:'范玮琪 2004 年代表作，翻唱自中岛美雪《银の龙の背に乗って》'},
  meng2:{name:'梦想天空分外蓝',artist:'陈奕迅',lyric:'梦想天空分外蓝',genre:'流行',lang:'国语',era:'10s',story:'陈奕迅为励志节目演唱的主题曲，适合毕业与启程时刻'},
  meng3:{name:'我的未来不是梦',artist:'张雨生',lyric:'我的未来不是梦，我认真地过每一分钟',genre:'摇滚',lang:'国语',era:'经典',story:'张雨生 1988 年代表作，一代人的青春宣言'},
  qc1:{name:'青春修炼手册',artist:'TFBOYS',lyric:'青春有太多未知的猜测，成长的烦恼算什么',genre:'流行',lang:'国语',era:'10s',story:'TFBOYS 2014 年国民级青春单曲'}
};

function lyricText(sid){ const s=SONG_POOL[sid]; return s ? s.lyric : ''; }
function songMatch(sid, keyword){
  const s=SONG_POOL[sid];
  if(!s || !keyword) return false;
  return lyricText(sid).toLocaleLowerCase().includes(String(keyword).toLocaleLowerCase());
}
function songMeta(sid, key, fallback=''){ return (SONG_POOL[sid] && SONG_POOL[sid][key]) || fallback; }

const MELODIES = {
  y1:{bpm:72,notes:[[5,4,1],[3,4,.5],[5,4,.5],[6,4,1],[5,4,1],[3,4,.5],[5,4,.5],[1,5,2]]},
  y2:{bpm:76,notes:[[3,4,1],[5,4,1],[6,4,1],[1,5,1],[6,4,.5],[5,4,.5],[3,4,1],[5,4,1],[2,4,2]]},
  y3:{bpm:80,notes:[[6,4,.5],[7,4,.5],[1,5,1],[7,4,.5],[6,4,.5],[5,4,1],[3,4,1],[2,4,2]]},
  y4:{bpm:66,notes:[[6,4,1],[1,5,1],[2,5,1],[3,5,1.5],[5,5,.5],[3,5,1],[2,5,1],[1,5,2]]},
  r1:{bpm:88,notes:[[3,4,.5],[3,4,.5],[2,4,1],[1,4,.5],[7,3,.5],[1,4,1],[2,4,1],[3,4,1],[5,4,2]]},
  r2:{bpm:82,notes:[[5,4,.5],[5,4,.5],[6,4,1],[1,5,1],[1,5,.5],[7,4,.5],[6,4,1],[5,4,1],[3,4,2]]},
  r3:{bpm:90,notes:[[3,4,.5],[5,4,.5],[6,4,1],[1,5,1],[2,5,1],[1,5,.5],[6,4,.5],[5,4,1],[3,4,2]]},
  f1:{bpm:96,notes:[[3,4,.5],[5,4,.5],[6,4,1],[1,5,1],[2,5,1],[3,5,1],[2,5,.5],[1,5,.5],[6,4,1],[3,4,2]]},
  f2:{bpm:92,notes:[[5,4,.5],[6,4,.5],[1,5,1],[2,5,1],[1,5,1],[6,4,.5],[5,4,.5],[3,4,1],[2,4,1],[1,4,2]]},
  f3:{bpm:86,notes:[[3,4,.5],[5,4,.5],[6,4,1],[1,5,1],[2,5,1],[3,5,1],[5,5,1],[3,5,.5],[2,5,.5],[1,5,1],[3,4,2]]},
  ye1:{bpm:84,notes:[[6,4,.5],[7,4,.5],[1,5,1],[7,4,1],[6,4,.5],[5,4,.5],[6,4,1],[3,4,1],[2,4,1],[1,4,2]]},
  ye2:{bpm:92,notes:[[5,4,1],[6,4,1],[1,5,1],[2,5,1],[3,5,1],[2,5,1],[1,5,1],[6,4,1],[5,4,1],[3,4,1],[5,4,1],[6,4,1],[5,4,2]]},
  ye3:{bpm:88,notes:[[6,4,.5],[7,4,.5],[1,5,1],[2,5,1],[1,5,.5],[7,4,.5],[6,4,1],[5,4,1],[3,4,1],[2,4,1],[3,4,2]]}
};
