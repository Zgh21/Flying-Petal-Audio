/* 官方房间、技能卡与社群初始数据。 */
const DEFAULT_ROOMS = {
  yue:{
    word:'月', players:46, unlocked:4, hot:true, custom:false, img:'assets/bg/yue.jpg',
    genre:'流行', lang:'国语', era:'经典', modes:['异步接力','实时对战'], tags:['华语经典','抒情','怀旧'], follows:128, newDups:8,
    pool:['y1','y2','y3','y4'],
    cards:[
      {id:'yue-c1',user:'小红',ac:'#d98a9a',grad:'linear-gradient(135deg,#d98a9a,#b4556b)',time:'12 分钟前',song:'y1',score:'+2 首唱',dur:'0:08',dups:[
        {id:'yue-d1',user:'阿杰',ac:'#7aa3c9',grad:'linear-gradient(135deg,#7aa3c9,#45709e)',time:'8 分钟前'},{id:'yue-d2',user:'小美',ac:'#8fc0a3',grad:'linear-gradient(135deg,#8fc0a3,#4f9271)',time:'5 分钟前'}],comments:[
        {id:'yue-m1',user:'小明',ac:'#c9b07a',grad:'linear-gradient(135deg,#c9b07a,#9e8245)',text:'经典开场，一开口就暴露年代了哈哈',time:'9 分钟前'},{id:'yue-m2',user:'小美',ac:'#8fc0a3',grad:'linear-gradient(135deg,#8fc0a3,#4f9271)',text:'我妈最爱这首，全家都会唱',time:'6 分钟前'}],likes:5,liked:false},
      {id:'yue-c2',user:'小明',ac:'#c9b07a',grad:'linear-gradient(135deg,#c9b07a,#9e8245)',time:'1 分钟前',song:'y2',score:'+2 首唱',dur:'0:05',dups:[],comments:[{id:'yue-m3',user:'十七',ac:'#c9b07a',grad:'linear-gradient(135deg,#c9b07a,#9e8245)',text:'这句适合深夜接',time:'刚刚'}],likes:3,liked:false},
      {id:'yue-c3',user:'阿杰',ac:'#7aa3c9',grad:'linear-gradient(135deg,#7aa3c9,#45709e)',time:'刚刚',song:'y3',score:'+2 首唱',dur:'0:07',dups:[],comments:[],likes:4,liked:false}
    ]
  },
  yu:{
    word:'雨', players:32, unlocked:4, hot:true, custom:false, img:'assets/bg/yu.jpg',
    genre:'流行', lang:'国语', era:'10s', modes:['异步接力','反向禁字'], tags:['治愈','雨天','KTV'], follows:96, newDups:5,
    pool:['r1','r2','r3','r4'],
    cards:[
      {id:'yu-c1',user:'阿澈',ac:'#7aa3c9',grad:'linear-gradient(135deg,#7aa3c9,#45709e)',time:'5 分钟前',song:'r1',score:'+2 首唱',dur:'0:09',dups:[{id:'yu-d1',user:'小雨',ac:'#8fc0a3',grad:'linear-gradient(135deg,#8fc0a3,#4f9271)',time:'3 分钟前'}],comments:[{id:'yu-m1',user:'十七',ac:'#c9b07a',grad:'linear-gradient(135deg,#c9b07a,#9e8245)',text:'下雨天听这首，谁懂',time:'4 分钟前'}],likes:7,liked:false},
      {id:'yu-c2',user:'小雨',ac:'#8fc0a3',grad:'linear-gradient(135deg,#8fc0a3,#4f9271)',time:'刚刚',song:'r2',score:'+2 首唱',dur:'0:06',dups:[],comments:[],likes:2,liked:false}
    ]
  },
  feng:{
    word:'风', players:28, unlocked:4, hot:false, custom:false, img:'assets/bg/feng.jpg',
    genre:'民谣', lang:'国语', era:'10s', modes:['异步接力','多语言'], tags:['青春','夏天','怀旧'], follows:77, newDups:3,
    pool:['f1','f2','f3','f4'],
    cards:[
      {id:'feng-c1',user:'十七',ac:'#c9b07a',grad:'linear-gradient(135deg,#c9b07a,#9e8245)',time:'1 小时前',song:'f1',score:'+2 首唱',dur:'0:10',dups:[],comments:[{id:'feng-m1',user:'阿澈',ac:'#7aa3c9',grad:'linear-gradient(135deg,#7aa3c9,#45709e)',text:'副歌一出来鸡皮疙瘩起来了',time:'40 分钟前'}],likes:9,liked:false}
    ]
  },
  ye:{
    word:'夜', players:38, unlocked:4, hot:true, custom:false, img:'assets/bg/ye.jpg',
    genre:'流行', lang:'国语', era:'千禧', modes:['异步接力','炸弹歌'], tags:['深夜','治愈','考研'], follows:112, newDups:9,
    pool:['ye1','ye2','ye3','ye4'],
    cards:[
      {id:'ye-c1',user:'小林',ac:'#d98a9a',grad:'linear-gradient(135deg,#d98a9a,#b4556b)',time:'8 分钟前',song:'ye2',score:'+2 首唱',dur:'0:11',dups:[{id:'ye-d1',user:'星星',ac:'#c9b07a',grad:'linear-gradient(135deg,#c9b07a,#9e8245)',time:'4 分钟前'}],comments:[{id:'ye-m1',user:'十七',ac:'#c9b07a',grad:'linear-gradient(135deg,#c9b07a,#9e8245)',text:'考研人深夜破防专用',time:'6 分钟前'}],likes:11,liked:false},
      {id:'ye-c2',user:'星星',ac:'#c9b07a',grad:'linear-gradient(135deg,#c9b07a,#9e8245)',time:'刚刚',song:'ye1',score:'+2 首唱',dur:'0:07',dups:[],comments:[],likes:5,liked:false}
    ]
  },
  ai:{
    word:'爱', players:21, unlocked:3, hot:false, custom:false, img:'assets/bg/yue.jpg',
    genre:'流行', lang:'国语', era:'10s', modes:['异步接力','AI出题'], tags:['甜歌','表白','青春'], follows:63, newDups:2,
    pool:['ai1','ai2','ai3'],
    cards:[{id:'ai-c1',user:'小美',ac:'#8fc0a3',grad:'linear-gradient(135deg,#8fc0a3,#4f9271)',time:'15 分钟前',song:'ai1',score:'+2 首唱',dur:'0:08',dups:[],comments:[],likes:8,liked:false}]
  },
  qingchun:{
    word:'青春', players:18, unlocked:1, hot:false, custom:false, img:'assets/bg/feng.jpg',
    genre:'流行', lang:'国语', era:'10s', modes:['异步接力','AI出题'], tags:['毕业','校园','回忆'], follows:49, newDups:1,
    pool:['qc1'],
    cards:[{id:'qc-c1',user:'阿杰',ac:'#7aa3c9',grad:'linear-gradient(135deg,#7aa3c9,#45709e)',time:'2 小时前',song:'qc1',score:'+2 首唱',dur:'0:09',dups:[],comments:[{id:'qc-m1',user:'小雨',ac:'#8fc0a3',grad:'linear-gradient(135deg,#8fc0a3,#4f9271)',text:'毕业季听这句会哭',time:'1 小时前'}],likes:6,liked:false}]
  },
  love:{
    word:'love', players:15, unlocked:3, hot:false, custom:false, img:'assets/bg/yu.jpg',
    genre:'流行', lang:'英语', era:'经典', modes:['异步接力','多语言'], tags:['英文歌','欧美','表白'], follows:41, newDups:4,
    pool:['love1','love2','love3'],
    cards:[{id:'love-c1',user:'星星',ac:'#c9b07a',grad:'linear-gradient(135deg,#c9b07a,#9e8245)',time:'30 分钟前',song:'love1',score:'+2 首唱',dur:'0:07',dups:[],comments:[],likes:12,liked:false}]
  },
  meng:{
    word:'梦', players:12, unlocked:3, hot:false, custom:false, img:'assets/bg/ye.jpg',
    genre:'摇滚', lang:'国语', era:'经典', modes:['异步接力','反向禁字'], tags:['励志','摇滚','考研'], follows:35, newDups:2,
    pool:['meng1','meng2','meng3'],
    cards:[{id:'meng-c1',user:'小明',ac:'#c9b07a',grad:'linear-gradient(135deg,#c9b07a,#9e8245)',time:'1 小时前',song:'meng3',score:'+2 首唱',dur:'0:06',dups:[],comments:[],likes:4,liked:false}]
  }
};

const CARDS = {
  jinqu:{name:'禁句卡',emoji:'🚫',desc:'选择一首歌，本轮双方都不能唱'},
  qiujiu:{name:'求救卡',emoji:'🆘',desc:'指定一位歌友帮唱，一起得分'},
  tiaoguo:{name:'跳过卡',emoji:'⏭',desc:'跳过本轮，但扣除 1 分'},
  shuangbei:{name:'双倍卡',emoji:'✖️2',desc:'本轮成功接歌得分翻倍'},
  fanzhuan:{name:'反转卡',emoji:'🔄',desc:'让对手连续接两轮'}
};

const BATTLE_MODES = [
  {id:'relay',name:'标准接力赛',icon:'🎤',desc:'轮流唱含关键字的歌词，8 秒接不上就输'},
  {id:'bomb',name:'炸弹歌对决',icon:'💣',desc:'各设一首炸弹歌，唱出对方的炸弹立刻引爆'},
  {id:'reverse',name:'反向禁字局',icon:'🚫',desc:'禁字不能唱，谁踩雷谁炸'},
  {id:'aiq',name:'AI 出题局',icon:'🤖',desc:'AI 根据听歌口味出关键字与歌词题'},
  {id:'multi',name:'多语言关键词',icon:'🌏',desc:'支持中文、英文、粤语、日语关键词接歌'}
];
const BATTLE_KWS = ['月','雨','风','夜','爱','梦','love','さくら'];
const OPPONENTS = [
  {name:'阿杰',avatar:'杰',color:'linear-gradient(135deg,#7aa3c9,#45709e)',level:'令士'},
  {name:'小雨',avatar:'雨',color:'linear-gradient(135deg,#8fc0a3,#4f9271)',level:'令徒'},
  {name:'十七',avatar:'七',color:'linear-gradient(135deg,#c9b07a,#9e8245)',level:'令主'}
];

const DEFAULT_GROUPS = [
  {id:'g1',name:'宿舍夜聊局',members:12,desc:'晚自习后的固定约歌据点',tag:'深夜',joined:true,contribution:26,rank:3,activity:['阿杰在「夜」字局接唱 +1','小明分享了本周歌单']},
  {id:'g2',name:'考研解压组',members:8,desc:'背不进去就吼两句',tag:'治愈',joined:false,contribution:0,rank:6,activity:['小雨发起了「梦」字局约战']},
  {id:'g3',name:'粤语歌友会',members:23,desc:'月半小夜曲常驻选手',tag:'粤语',joined:true,contribution:41,rank:2,activity:['十七唱了《风继续吹》']}
];
const GROUP_MEMBERS = ['阿杰','小雨','十七','阿澈','小美','小林','星星','小明'];
const TITLES = [
  {name:'令徒',min:0,desc:'初入飞花，敢开口就是赢'},
  {name:'令士',min:10,desc:'接歌十首，渐入佳境'},
  {name:'令主',min:30,desc:'一个房间的节奏由你把控'},
  {name:'诗仙',min:60,desc:'以歌为诗，天下谁人不识君'}
];
