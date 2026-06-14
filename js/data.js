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
    this.ensureToolChats();
    return false;
  },

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

  /** schema v3：朋友圈 worldviewIds 数组 */
  migrateToV3: function () {
    var meta = MI.Storage.getMeta();
    if (meta.schemaVersion >= 3) return;
    MI.Storage.normalizeMoments();
    MI.Storage.setMeta({ schemaVersion: 3 });
  },

  /** 内置服务号定义 */
  BUILTIN_TOOLS: [
    {
      id: 'tool_translator',
      type: 'tool',
      name: 'AI 翻译官',
      avatarIcon: 'language',
      avatar: '🌐',
      wechatId: 'ai_translator',
      pinyin: 'aifanyiguan',
      systemPrompt: '你是一个精通多国语言的专业翻译官。无论我发给你什么语言，你都只需要直接、优雅地将其翻译成英文和日文，不要有任何多余的客套话和解释。'
    },
    {
      id: 'tool_code_doctor',
      type: 'tool',
      name: '代码医生',
      avatarIcon: 'code',
      avatar: '🩺',
      wechatId: 'code_doctor',
      pinyin: 'daimayisheng',
      systemPrompt: '你是一个资深的前端开发专家。请帮我审查我发送给你的代码，直接指出其中的 Bug、隐患，并给出修改后的标准代码和简短的原因分析。'
    }
  ],

  /** schema v4：联系人 type 字段 + 内置服务号 */
  migrateToV4: function () {
    var meta = MI.Storage.getMeta();
    if (meta.schemaVersion >= 4) return;

    var contacts = MI.Storage.getContacts();
    for (var i = 0; i < contacts.length; i++) {
      if (!contacts[i].type) {
        contacts[i].type = 'character';
      }
    }

    for (var t = 0; t < this.BUILTIN_TOOLS.length; t++) {
      var tool = this.BUILTIN_TOOLS[t];
      var exists = false;
      for (var j = 0; j < contacts.length; j++) {
        if (contacts[j].id === tool.id) {
          exists = true;
          contacts[j].type = 'tool';
          contacts[j].builtin = true;
          if (!contacts[j].systemPrompt) contacts[j].systemPrompt = tool.systemPrompt;
          if (!contacts[j].avatarIcon) contacts[j].avatarIcon = tool.avatarIcon;
          break;
        }
      }
      if (!exists) {
        contacts.push({
          id: tool.id,
          type: 'tool',
          name: tool.name,
          avatar: tool.avatar,
          avatarIcon: tool.avatarIcon,
          wechatId: tool.wechatId,
          pinyin: tool.pinyin,
          systemPrompt: tool.systemPrompt,
          builtin: true
        });
      }
    }

    MI.Storage.setContacts(contacts);
    this.ensureToolChats();
    MI.Storage.setMeta({ schemaVersion: 4 });
    console.log('✅ 已迁移到 schema v4：联系人 type + 内置服务号');
  },

  /** schema v5：服务号 builtin 标记 */
  migrateToV5: function () {
    var meta = MI.Storage.getMeta();
    if (meta.schemaVersion >= 5) return;

    var contacts = MI.Storage.getContacts();
    for (var i = 0; i < contacts.length; i++) {
      if (contacts[i].type !== 'tool') continue;
      contacts[i].builtin = MI.Data.isBuiltinTool(contacts[i].id);
    }
    MI.Storage.setContacts(contacts);
    MI.Storage.setMeta({ schemaVersion: 5 });
  },

  /** schema v6：统一 API 配置库 + 玩家人设 + 联系人 apiProfileId */
  migrateToV6: function () {
    var meta = MI.Storage.getMeta();
    if (meta.schemaVersion >= 6) return;

    var profiles = MI.Storage.getApiProfiles();
    if (!profiles || profiles.length === 0) {
      profiles = this._buildInitialApiProfiles();
      MI.Storage.setApiProfiles(profiles);
    }

    var config = MI.Storage.getConfig();
    var defaultId = config.aiApiProfileId || config.defaultApiProfileId;
    if (!defaultId && profiles.length > 0) {
      defaultId = profiles[0].id;
    }

    var contacts = MI.Storage.getContacts();
    for (var i = 0; i < contacts.length; i++) {
      var c = contacts[i];
      if (!c.apiProfileId && c.api) {
        c.apiProfileId = this._findOrCreateApiProfile(profiles, c.api);
      }
      if (!c.apiProfileId && defaultId) {
        c.apiProfileId = defaultId;
      }
      if (c.type === 'character' && c.usePlayerPersona === undefined) {
        c.usePlayerPersona = false;
      }
      if (c.type === 'tool' && !c.avatarMode) {
        c.avatarMode = 'icon';
      }
    }
    MI.Storage.setContacts(contacts);

    var profile = MI.Storage.getProfile();
    if (!profile.personas) {
      profile.personas = {
        default: { appearance: '', personality: '', background: '' },
        byWorldview: {}
      };
      MI.Storage.setProfile(profile);
    }

    MI.Storage.setConfig({
      systemPrompt: config.systemPrompt || '你是 AI 助手，请简洁友好地回答。',
      aiApiProfileId: defaultId || null
    });

    MI.Storage.setMeta({ schemaVersion: 6 });
    console.log('✅ 已迁移到 schema v6：API 配置库 + 玩家人设');
  },

  /** schema v7：API 多模型启用 + 联系人 apiModel */
  migrateToV7: function () {
    var meta = MI.Storage.getMeta();
    if (meta.schemaVersion >= 7) return;

    var profiles = MI.Storage.getApiProfiles();
    for (var i = 0; i < profiles.length; i++) {
      var p = profiles[i];
      if (!p.models || !p.models.length) {
        p.models = p.apiModel ? [p.apiModel] : [];
      }
      if (!p.enabledModels || !p.enabledModels.length) {
        p.enabledModels = p.apiModel ? [p.apiModel] : (p.models.length ? [p.models[0]] : []);
      }
    }
    MI.Storage.setApiProfiles(profiles);

    var contacts = MI.Storage.getContacts();
    for (var j = 0; j < contacts.length; j++) {
      var c = contacts[j];
      if (!c.apiModel && c.apiProfileId) {
        var enabled = MI.Storage.getEnabledModels(c.apiProfileId);
        if (enabled.length > 0) c.apiModel = enabled[0];
      }
    }
    MI.Storage.setContacts(contacts);

    var config = MI.Storage.getConfig();
    if (!config.aiApiModel && config.aiApiProfileId) {
      var aiEnabled = MI.Storage.getEnabledModels(config.aiApiProfileId);
      if (aiEnabled.length > 0) config.aiApiModel = aiEnabled[0];
    }
    MI.Storage.setConfig(config);

    var userProfile = MI.Storage.getProfile();
    if (userProfile.personas) {
      if (userProfile.personas.default) delete userProfile.personas.default.chatStyle;
      var bw = userProfile.personas.byWorldview || {};
      var keys = Object.keys(bw);
      for (var k = 0; k < keys.length; k++) {
        if (bw[keys[k]]) delete bw[keys[k]].chatStyle;
      }
      MI.Storage.setProfile(userProfile);
    }

    MI.Storage.setMeta({ schemaVersion: 7 });
    console.log('✅ 已迁移到 schema v7：API 多模型启用');
  },

  /** schema v8：角色详细资料 + 聊天设置 + 消息 ID */
  migrateToV8: function () {
    var meta = MI.Storage.getMeta();
    if (meta.schemaVersion >= 8) return;

    var chats = MI.Storage.getChats();
    for (var i = 0; i < chats.length; i++) {
      var msgs = chats[i].messages || [];
      for (var j = 0; j < msgs.length; j++) {
        MI.ChatEngine.ensureMessageId(msgs[j]);
      }
    }
    MI.Storage.setChats(chats);

    var contacts = MI.Storage.getContacts();
    for (var k = 0; k < contacts.length; k++) {
      if (contacts[k].type !== 'character') continue;
      if (!contacts[k].details) {
        contacts[k].details = MI.ChatEngine.getDefaultDetails();
      }
      if (!contacts[k].chatSettings) {
        contacts[k].chatSettings = MI.ChatEngine.getDefaultChatSettings();
      }
    }
    MI.Storage.setContacts(contacts);

    var profile = MI.Storage.getProfile();
    if (profile.nickname == null) profile.nickname = '';
    if (profile.callName == null) profile.callName = '';
    if (profile.birthday == null) profile.birthday = '';
    if (profile.likes == null) profile.likes = '';

    if (profile.personas) {
      if (!profile.personas.default) profile.personas.default = {};
      var def = profile.personas.default;
      if (def.nickname == null) def.nickname = '';
      if (def.callName == null) def.callName = '';
      if (def.birthday == null) def.birthday = '';
      if (def.likes == null) def.likes = '';

      var bw = profile.personas.byWorldview || {};
      var keys = Object.keys(bw);
      for (var p = 0; p < keys.length; p++) {
        var persona = bw[keys[p]];
        if (!persona) continue;
        if (persona.nickname == null) persona.nickname = '';
        if (persona.callName == null) persona.callName = '';
        if (persona.birthday == null) persona.birthday = '';
        if (persona.likes == null) persona.likes = '';
      }
    }
    MI.Storage.setProfile(profile);

    MI.Storage.setMeta({ schemaVersion: 8 });
    console.log('✅ 已迁移到 schema v8：角色资料 + 聊天设置 + 消息 ID');
  },

  /** schema v9：消息分句 parts + 关系选项键 */
  migrateToV9: function () {
    var meta = MI.Storage.getMeta();
    if (meta.schemaVersion >= 9) return;

    var chats = MI.Storage.getChats();
    for (var i = 0; i < chats.length; i++) {
      var msgs = chats[i].messages || [];
      for (var j = 0; j < msgs.length; j++) {
        var msg = msgs[j];
        MI.ChatEngine.ensureMessageId(msg);
        if (msg.parts && msg.parts.length > 0) continue;

        if (!msg.content) {
          msg.parts = [];
          continue;
        }

        if (msg.role === 'user') {
          msg.parts = [String(msg.content).trim()];
        } else {
          var lines = String(msg.content).split('\n');
          var parts = [];
          for (var k = 0; k < lines.length; k++) {
            var line = lines[k].trim();
            if (line) parts.push(line);
          }
          msg.parts = parts.length > 0 ? parts : [String(msg.content).trim()];
        }
        msg.content = msg.parts.join('\n');
      }
    }
    MI.Storage.setChats(chats);

    var contacts = MI.Storage.getContacts();
    for (var c = 0; c < contacts.length; c++) {
      if (contacts[c].type !== 'character') continue;
      if (!contacts[c].chatSettings) {
        contacts[c].chatSettings = MI.ChatEngine.getDefaultChatSettings();
      }
      contacts[c].chatSettings.relationship = this._mapRelationshipKey(
        contacts[c].chatSettings.relationship
      );
    }
    MI.Storage.setContacts(contacts);

    MI.Storage.setMeta({ schemaVersion: 9 });
    console.log('✅ 已迁移到 schema v9：消息分句 + 关系选项');
  },

  /** schema v10：按句号重新拆分助手消息 parts */
  migrateToV10: function () {
    var meta = MI.Storage.getMeta();
    if (meta.schemaVersion >= 10) return;

    var chats = MI.Storage.getChats();
    for (var i = 0; i < chats.length; i++) {
      var msgs = chats[i].messages || [];
      var contact = chats[i].contactId ? MI.Data.getContactById(chats[i].contactId) : null;
      var chatEffect = 'sentence';
      if (contact && contact.chatSettings) {
        chatEffect = contact.chatSettings.chatEffect || 'sentence';
      }
      for (var j = 0; j < msgs.length; j++) {
        if (msgs[j].role !== 'assistant') continue;
        MI.ChatEngine.normalizeMessage(msgs[j], chatEffect);
      }
    }
    MI.Storage.setChats(chats);

    MI.Storage.setMeta({ schemaVersion: 10 });
    console.log('✅ 已迁移到 schema v10：助手消息按句拆分');
  },

  /** schema v11：朋友圈封面 + 角色朋友圈设置 + 评论 replyTo */
  migrateToV11: function () {
    var meta = MI.Storage.getMeta();
    if (meta.schemaVersion >= 11) return;

    var profile = MI.Storage.getProfile();
    if (profile.momentsCover == null) profile.momentsCover = '';
    MI.Storage.setProfile(profile);

    var contacts = MI.Storage.getContacts();
    for (var i = 0; i < contacts.length; i++) {
      if (contacts[i].type !== 'character') continue;
      if (!contacts[i].momentSettings) {
        contacts[i].momentSettings = MI.MomentEngine.getDefaultMomentSettings();
      }
    }
    MI.Storage.setContacts(contacts);

    var moments = MI.Storage.getMoments();
    for (var j = 0; j < moments.length; j++) {
      if (!moments[j].comments) continue;
      for (var k = 0; k < moments[j].comments.length; k++) {
        if (moments[j].comments[k].replyTo === undefined) {
          moments[j].comments[k].replyTo = null;
        }
      }
    }
    MI.Storage.setMoments(moments);

    MI.Storage.setMeta({ schemaVersion: 11 });
    console.log('✅ 已迁移到 schema v11：朋友圈增强');
  },

  /** schema v12：朋友圈互动通知 */
  migrateToV12: function () {
    var meta = MI.Storage.getMeta();
    if (meta.schemaVersion >= 12) return;

    if (MI.Storage.get('mi_moment_notifications') == null) {
      MI.Storage.set('mi_moment_notifications', []);
    }

    MI.Storage.setMeta({ schemaVersion: 12 });
    console.log('✅ 已迁移到 schema v12：朋友圈互动通知');
  },

  /** schema v13：角色朋友圈封面 */
  migrateToV13: function () {
    var meta = MI.Storage.getMeta();
    if (meta.schemaVersion >= 13) return;

    var contacts = MI.Storage.getContacts();
    for (var i = 0; i < contacts.length; i++) {
      if (contacts[i].type === 'character' && contacts[i].momentsCover == null) {
        contacts[i].momentsCover = '';
      }
    }
    MI.Storage.setContacts(contacts);

    MI.Storage.setMeta({ schemaVersion: 13 });
    console.log('✅ 已迁移到 schema v13：角色朋友圈封面');
  },

  _mapRelationshipKey: function (value) {
    if (!value) return 'friend';
    var prompts = MI.ChatEngine.RELATIONSHIP_PROMPTS;
    if (prompts[value]) return value;

    var textMap = {
      '朋友': 'friend',
      '挚友': 'close_friend',
      '恋人': 'lover',
      '爱人': 'spouse',
      '亲人': 'family',
      '同事': 'colleague',
      '认识的人': 'acquaintance',
      '陌生人': 'stranger'
    };
    if (textMap[value]) return textMap[value];
    return 'friend';
  },

  _buildInitialApiProfiles: function () {
    var profiles = [];
    var providers = MI.Providers.list;
    for (var i = 0; i < providers.length; i++) {
      var p = providers[i];
      profiles.push({
        id: 'api_' + p.id,
        name: p.name,
        apiUrl: p.apiUrl,
        apiKey: '',
        apiModel: p.apiModel,
        models: [p.apiModel],
        enabledModels: [p.apiModel],
        builtin: true
      });
    }

    var config = MI.Storage.getConfig();
    if (config.apiKey && config.apiUrl) {
      var fromCfg = this._findOrCreateApiProfile(profiles, {
        apiUrl: config.apiUrl,
        apiKey: config.apiKey,
        apiModel: config.apiModel,
        name: '原全局配置'
      });
      for (var j = 0; j < profiles.length; j++) {
        if (profiles[j].id === fromCfg) {
          profiles[j].name = '原全局配置';
          break;
        }
      }
    }
    return profiles;
  },

  _apiProfileKey: function (api) {
    return (api.apiUrl || '') + '|' + (api.apiModel || '');
  },

  _findOrCreateApiProfile: function (profiles, api) {
    if (!api || !api.apiUrl) return null;
    var key = this._apiProfileKey(api);
    for (var i = 0; i < profiles.length; i++) {
      if (this._apiProfileKey(profiles[i]) === key) {
        if (api.apiKey && !profiles[i].apiKey) profiles[i].apiKey = api.apiKey;
        return profiles[i].id;
      }
    }
    var id = this.genId('api');
    profiles.push({
      id: id,
      name: api.name || ('自定义 ' + (profiles.length + 1)),
      apiUrl: api.apiUrl,
      apiKey: api.apiKey || '',
      apiModel: api.apiModel || '',
      models: api.apiModel ? [api.apiModel] : [],
      enabledModels: api.apiModel ? [api.apiModel] : [],
      builtin: false
    });
    return id;
  },
  ensureToolChats: function () {
    var chats = MI.Storage.getChats();
    for (var i = 0; i < this.BUILTIN_TOOLS.length; i++) {
      var tool = this.BUILTIN_TOOLS[i];
      var hasChat = false;
      for (var j = 0; j < chats.length; j++) {
        if (chats[j].contactId === tool.id) {
          hasChat = true;
          break;
        }
      }
      if (!hasChat) {
        chats.unshift({
          id: 'chat_' + tool.id,
          contactId: tool.id,
          messages: [],
          lastMessage: '你好，有什么可以帮你的？',
          lastMessageTime: Date.now(),
          unreadCount: 0
        });
      }
    }
    MI.Storage.setChats(chats);
  },

  isTool: function (contact) {
    return contact && contact.type === 'tool';
  },

  isCharacter: function (contact) {
    return contact && (contact.type === 'character' || !contact.type);
  },

  isBuiltinTool: function (contactId) {
    for (var i = 0; i < this.BUILTIN_TOOLS.length; i++) {
      if (this.BUILTIN_TOOLS[i].id === contactId) return true;
    }
    return false;
  },

  /** 朋友圈是否属于某世界观 */
  momentInWorldview: function (moment, worldviewId) {
    if (!moment || !worldviewId) return false;
    if (moment.worldviewIds && moment.worldviewIds.length) {
      return moment.worldviewIds.indexOf(worldviewId) >= 0;
    }
    return moment.worldviewId === worldviewId;
  },

  /** 获取朋友圈关联的世界观名称 */
  getMomentWorldviewLabels: function (moment) {
    var ids = moment.worldviewIds && moment.worldviewIds.length
      ? moment.worldviewIds
      : (moment.worldviewId ? [moment.worldviewId] : []);
    var names = [];
    for (var i = 0; i < ids.length; i++) {
      var wv = MI.Storage.getWorldviewById(ids[i]);
      names.push(wv ? wv.name : '未知');
    }
    return names;
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
      return { id: null, type: 'ai', name: chat.name || 'AI 助手', avatar: chat.avatar || '🤖' };
    }
    var contact = this.getContactById(chat.contactId);
    if (contact) return contact;
    return { id: chat.contactId, type: 'character', name: '未知联系人', avatar: '❓' };
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
