/**
 * data.js — 数据初始化与工具方法
 */
window.MI = window.MI || {};

MI.Data = {
  /**
   * 示例世界观（仅迁移时可选写入一条参考）
   */
  sampleWorldview: {
    id: 'wv_sample',
    name: '现代都市',
    description: '故事发生在当代中国城市。科技发达，生活节奏快，人们使用微信日常交流。请在此补充更详细的世界观背景。',
    createdAt: 0
  },

  /**
   * 确保 AI 助手会话存在
   */
  ensureAiChat: function () {
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
  },

  /**
   * 初始化数据（不再写入种子联系人和朋友圈）
   */
  initSeedData: function () {
    this.ensureAiChat();
    return false;
  },

  /**
   * schema v2 一次性迁移
   */
  migrateToV2: function () {
    var meta = MI.Storage.getMeta();
    if (meta.schemaVersion >= 2) return;

    MI.Storage.setContacts([]);
    MI.Storage.setMoments([]);

    var chats = MI.Storage.getChats();
    var aiChat = null;
    for (var i = 0; i < chats.length; i++) {
      if (chats[i].id === 'chat_ai') {
        aiChat = chats[i];
        break;
      }
    }
    if (aiChat) {
      MI.Storage.setChats([aiChat]);
    } else {
      MI.Storage.setChats([]);
      this.ensureAiChat();
    }

    var worldviews = MI.Storage.getWorldviews();
    if (!worldviews || worldviews.length === 0) {
      var sample = {
        id: 'wv_sample',
        name: this.sampleWorldview.name,
        description: this.sampleWorldview.description,
        createdAt: Date.now()
      };
      MI.Storage.setWorldviews([sample]);
    }

    MI.Storage.setMeta({ schemaVersion: 2 });
    console.log('✅ 已迁移到 schema v2：清空种子联系人和朋友圈');
  },

  /**
   * 根据 ID 查找联系人（角色）
   */
  getContactById: function (id) {
    var contacts = MI.Storage.getContacts();
    for (var i = 0; i < contacts.length; i++) {
      if (contacts[i].id === id) return contacts[i];
    }
    return null;
  },

  /**
   * 根据会话获取联系人信息
   */
  getContactForChat: function (chat) {
    if (!chat.contactId) {
      return { id: null, name: chat.name || 'AI 助手', avatar: chat.avatar || '🤖' };
    }
    return this.getContactById(chat.contactId) || { id: chat.contactId, name: '未知联系人', avatar: '❓' };
  },

  /**
   * 获取作者信息（玩家或角色）
   */
  getAuthorById: function (authorId) {
    if (authorId === 'player') {
      var profile = MI.Storage.getProfile();
      return { id: 'player', name: profile.name, avatar: profile.avatar };
    }
    return this.getContactById(authorId) || { id: authorId, name: '未知用户', avatar: '❓' };
  },

  /**
   * 生成简单拼音（用于通讯录排序）
   */
  toPinyin: function (name) {
    if (!name) return 'unknown';
    return name.toLowerCase().replace(/\s/g, '');
  },

  /**
   * 生成唯一 ID
   */
  genId: function (prefix) {
    return prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  }
};
