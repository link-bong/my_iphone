/**
 * data.js — 种子数据与默认值
 * 首次使用时初始化联系人、朋友圈等数据
 */
window.MI = window.MI || {};

MI.Data = {
  /**
   * 种子联系人数据（15个中文联系人，含拼音用于排序）
   */
  seedContacts: [
    { id: 'c1',  name: '阿明',     avatar: '😎', wechatId: 'aming_wx',    phone: '13800001111', pinyin: 'aming' },
    { id: 'c2',  name: '白晓',     avatar: '🌸', wechatId: 'baixiao_wx',  phone: '13800002222', pinyin: 'baixiao' },
    { id: 'c3',  name: '陈晨',     avatar: '🐱', wechatId: 'chenchen_wx', phone: '13800003333', pinyin: 'chenchen' },
    { id: 'c4',  name: '大伟',     avatar: '🐻', wechatId: 'dawei_wx',    phone: '13800004444', pinyin: 'dawei' },
    { id: 'c5',  name: '菲菲',     avatar: '🦊', wechatId: 'feifei_wx',   phone: '13800005555', pinyin: 'feifei' },
    { id: 'c6',  name: '高远',     avatar: '🦅', wechatId: 'gaoyuan_wx',  phone: '13800006666', pinyin: 'gaoyuan' },
    { id: 'c7',  name: '韩梅梅',   avatar: '🐰', wechatId: 'hanmeimei_wx', phone: '13800007777', pinyin: 'hanmeimei' },
    { id: 'c8',  name: '李雷',     avatar: '🐶', wechatId: 'lilei_wx',    phone: '13800008888', pinyin: 'lilei' },
    { id: 'c9',  name: '林小玲',   avatar: '🐼', wechatId: 'linxl_wx',    phone: '13800009999', pinyin: 'linxiaoling' },
    { id: 'c10', name: '刘洋',     avatar: '🦁', wechatId: 'liuyang_wx',  phone: '13800010000', pinyin: 'liuyang' },
    { id: 'c11', name: '王芳',     avatar: '🌻', wechatId: 'wangfang_wx', phone: '13800011111', pinyin: 'wangfang' },
    { id: 'c12', name: '小明',     avatar: '😄', wechatId: 'xiaoming_wx', phone: '13800012222', pinyin: 'xiaoming' },
    { id: 'c13', name: '小红',     avatar: '😊', wechatId: 'xiaohong_wx', phone: '13800013333', pinyin: 'xiaohong' },
    { id: 'c14', name: '张伟',     avatar: '🐼', wechatId: 'zhangwei_wx', phone: '13800014444', pinyin: 'zhangwei' },
    { id: 'c15', name: '赵云',     avatar: '⚔️', wechatId: 'zhaoyun_wx',  phone: '13800015555', pinyin: 'zhaoyun' }
  ],

  /**
   * 种子朋友圈数据（8条朋友圈帖子）
   */
  seedMoments: [
    {
      id: 'm1',
      authorId: 'c12',
      content: '今天天气真好！出去走走感觉整个人都精神了 🌞',
      images: [],
      timestamp: 1716900000000,
      likes: ['c2', 'c3', 'c13'],
      comments: [
        { id: 'cm1', authorId: 'c13', content: '是呀是呀！下次一起~', timestamp: 1716901000000 },
        { id: 'cm2', authorId: 'c2', content: '羡慕！我今天加班 😭', timestamp: 1716902000000 }
      ]
    },
    {
      id: 'm2',
      authorId: 'c13',
      content: '分享一家超好吃的火锅店！🍲',
      images: ['🍲', '🥩', '🦐'],
      timestamp: 1716800000000,
      likes: ['c12', 'c7', 'c8', 'c1'],
      comments: [
        { id: 'cm3', authorId: 'c12', content: '地址发我！', timestamp: 1716801000000 }
      ]
    },
    {
      id: 'm3',
      authorId: 'c8',
      content: '新买了一本书，《三体》真的太好看了！强烈推荐 📚',
      images: ['📖'],
      timestamp: 1716700000000,
      likes: ['c7', 'c12', 'c3', 'c5', 'c14'],
      comments: [
        { id: 'cm4', authorId: 'c7', content: '我也在看！看到第二部了', timestamp: 1716701000000 },
        { id: 'cm5', authorId: 'c14', content: '刘慈欣的经典之作', timestamp: 1716702000000 },
        { id: 'cm6', authorId: 'c3', content: '改编的电视剧也不错', timestamp: 1716703000000 }
      ]
    },
    {
      id: 'm4',
      authorId: 'c2',
      content: '加班到深夜，终于把项目交付了 💪',
      images: [],
      timestamp: 1716600000000,
      likes: ['c1', 'c4', 'c8', 'c10'],
      comments: []
    },
    {
      id: 'm5',
      authorId: 'c5',
      content: '周末去爬山了！山顶的风景真的很美 ⛰️',
      images: ['🏔️', '🌄', '🥾'],
      timestamp: 1716500000000,
      likes: ['c2', 'c12', 'c13', 'c11', 'c6', 'c9'],
      comments: [
        { id: 'cm7', authorId: 'c11', content: '下次带我一个！', timestamp: 1716501000000 },
        { id: 'cm8', authorId: 'c5', content: '没问题！', timestamp: 1716502000000 }
      ]
    },
    {
      id: 'm6',
      authorId: 'c7',
      content: '学会了做蛋糕！虽然卖相一般但是很好吃 😋',
      images: ['🎂'],
      timestamp: 1716400000000,
      likes: ['c8', 'c12', 'c5', 'c13'],
      comments: [
        { id: 'cm9', authorId: 'c8', content: '什么时候给我尝尝？', timestamp: 1716401000000 }
      ]
    },
    {
      id: 'm7',
      authorId: 'c10',
      content: '今天公司团建，大家玩得很开心 🎉',
      images: ['🎯', '🏓', '🍻'],
      timestamp: 1716300000000,
      likes: ['c4', 'c14', 'c1', 'c2', 'c3', 'c5'],
      comments: [
        { id: 'cm10', authorId: 'c4', content: '团建活动组织得不错！', timestamp: 1716301000000 },
        { id: 'cm11', authorId: 'c1', content: '下次还来', timestamp: 1716302000000 },
        { id: 'cm12', authorId: 'c5', content: '照片拍得好好~', timestamp: 1716303000000 }
      ]
    },
    {
      id: 'm8',
      authorId: 'c15',
      content: '千里走单骑，不忘初心 ⚔️✨',
      images: [],
      timestamp: 1716200000000,
      likes: ['c12', 'c14', 'c10', 'c8', 'c4'],
      comments: [
        { id: 'cm13', authorId: 'c14', content: '赵兄豪气！', timestamp: 1716201000000 },
        { id: 'cm14', authorId: 'c12', content: '👍👍👍', timestamp: 1716202000000 }
      ]
    }
  ],

  /**
   * 初始化所有种子数据（如果首次使用）
   * 返回 true 表示是新用户（首次初始化）
   */
  initSeedData: function () {
    var contacts = MI.Storage.getContacts();
    var moments = MI.Storage.getMoments();
    var isNew = false;

    if (!contacts || contacts.length === 0) {
      MI.Storage.setContacts(this.seedContacts);
      contacts = this.seedContacts;
      isNew = true;
    }

    if (!moments || moments.length === 0) {
      MI.Storage.setMoments(this.seedMoments);
      moments = this.seedMoments;
      isNew = true;
    }

    // 确保有 AI 助手会话
    var chats = MI.Storage.getChats();
    var hasAiChat = false;
    for (var i = 0; i < chats.length; i++) {
      if (chats[i].id === 'chat_ai') {
        hasAiChat = true;
        break;
      }
    }
    if (!hasAiChat) {
      chats.unshift({
        id: 'chat_ai',
        contactId: null,
        name: 'AI 助手',
        avatar: '🤖',
        messages: [],
        lastMessage: '你好！我是AI助手，有什么可以帮你的？',
        lastMessageTime: Date.now(),
        unreadCount: 0
      });
      MI.Storage.setChats(chats);
    }

    return isNew;
  },

  /**
   * 根据 ID 查找联系人
   */
  getContactById: function (id) {
    var contacts = MI.Storage.getContacts();
    for (var i = 0; i < contacts.length; i++) {
      if (contacts[i].id === id) return contacts[i];
    }
    return null;
  },

  /**
   * 根据会话获取联系人信息（处理 AI 助手的特殊情况）
   */
  getContactForChat: function (chat) {
    if (!chat.contactId) {
      return { id: null, name: chat.name || 'AI 助手', avatar: chat.avatar || '🤖' };
    }
    return this.getContactById(chat.contactId) || { id: chat.contactId, name: '未知联系人', avatar: '❓' };
  }
};
