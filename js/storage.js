/**
 * storage.js — localStorage 读写抽象层
 * 提供类型安全的读写方法，带默认值和错误处理
 */
window.MI = window.MI || {};

MI.Storage = {
  /**
   * 读取 localStorage 键值，自动 JSON.parse
   * @param {string} key
   * @param {*} defaultValue - 键不存在或解析失败时返回的默认值
   */
  get: function (key, defaultValue) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('MI.Storage.get(' + key + ') failed:', e);
      return defaultValue;
    }
  },

  /**
   * 写入 localStorage，自动 JSON.stringify
   * @param {string} key
   * @param {*} value
   */
  set: function (key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('MI.Storage.set(' + key + ') failed (quota exceeded?):', e);
      // 配额溢出时提示用户
      if (e.name === 'QuotaExceededError') {
        if (window.MI && MI.Components && MI.Components.showToast) {
          MI.Components.showToast('存储空间不足！请清理一些旧数据。', 3500);
        } else {
          alert('存储空间不足！请清理一些旧数据。');
        }
      }
    }
  },

  /**
   * 删除一个 localStorage 键
   */
  remove: function (key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('MI.Storage.remove(' + key + ') failed:', e);
    }
  },

  // ==================== 便捷方法 ====================

  getConfig: function () {
    return this.get('mi_config', {
      systemPrompt: '你是 AI 助手，请简洁友好地回答。',
      aiApiProfileId: null,
      aiApiModel: null
    });
  },

  setConfig: function (config) {
    this.set('mi_config', config);
  },

  getProfile: function () {
    return this.get('mi_profile', {
      name: '我',
      wechatId: 'my_wechat_id',
      avatar: '😊',
      region: '中国',
      whatsUp: '这个人很懒，什么都没写',
      nickname: '',
      callName: '',
      birthday: '',
      likes: '',
      momentsCover: '',
      personas: {
        default: {
          appearance: '',
          personality: '',
          background: '',
          nickname: '',
          callName: '',
          birthday: '',
          likes: ''
        },
        byWorldview: {}
      }
    });
  },

  setProfile: function (profile) {
    this.set('mi_profile', profile);
  },

  /** 获取某世界观下的玩家人设（无则回退默认） */
  getPlayerPersona: function (worldviewId) {
    var profile = this.getProfile();
    var personas = profile.personas || { default: {}, byWorldview: {} };
    if (worldviewId && personas.byWorldview && personas.byWorldview[worldviewId]) {
      return personas.byWorldview[worldviewId];
    }
    return personas.default || {};
  },

  getApiProfiles: function () {
    return this.get('mi_api_profiles', []);
  },

  setApiProfiles: function (profiles) {
    this.set('mi_api_profiles', profiles);
  },

  getApiProfileById: function (id) {
    if (!id) return null;
    var list = this.getApiProfiles();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  },

  /** 将 API 配置库条目解析为请求用 config */
  resolveApiProfile: function (profileId, modelName) {
    var profile = this.getApiProfileById(profileId);
    if (!profile) return null;

    var model = modelName || '';
    if (!model && profile.enabledModels && profile.enabledModels.length > 0) {
      model = profile.enabledModels[0];
    }
    if (!model && profile.apiModel) {
      model = profile.apiModel;
    }

    return {
      apiUrl: profile.apiUrl || '',
      apiKey: profile.apiKey || '',
      apiModel: model,
      profileName: profile.name || ''
    };
  },

  /** 获取某配置下已启用的模型列表 */
  getEnabledModels: function (profileId) {
    var profile = this.getApiProfileById(profileId);
    if (!profile) return [];
    if (profile.enabledModels && profile.enabledModels.length > 0) {
      return profile.enabledModels.slice();
    }
    if (profile.apiModel) return [profile.apiModel];
    return [];
  },

  /** 第一个已填写 Key 的配置（兜底） */
  getFirstUsableApiProfile: function () {
    var list = this.getApiProfiles();
    for (var i = 0; i < list.length; i++) {
      if (list[i].apiKey && list[i].apiUrl && list[i].apiModel) return list[i];
    }
    return list.length > 0 ? list[0] : null;
  },

  getContacts: function () {
    return this.get('mi_contacts', []);
  },

  setContacts: function (contacts) {
    this.set('mi_contacts', contacts);
  },

  getChats: function () {
    return this.get('mi_chats', []);
  },

  setChats: function (chats) {
    this.set('mi_chats', chats);
  },

  getMoments: function () {
    return this.get('mi_moments', []);
  },

  setMoments: function (moments) {
    this.set('mi_moments', moments);
  },

  getNavigation: function () {
    return this.get('mi_navigation', {
      stack: ['home'],
      wechatTab: 'chats',
      activeWorldviewId: null
    });
  },

  setNavigation: function (nav) {
    this.set('mi_navigation', nav);
  },

  getMeta: function () {
    return this.get('mi_meta', { schemaVersion: 1 });
  },

  setMeta: function (meta) {
    this.set('mi_meta', meta);
  },

  getWorldviews: function () {
    return this.get('mi_worldviews', []);
  },

  setWorldviews: function (worldviews) {
    this.set('mi_worldviews', worldviews);
  },

  getWorldviewById: function (id) {
    var list = this.getWorldviews();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  },

  getActiveWorldviewId: function () {
    var nav = this.getNavigation();
    if (nav.activeWorldviewId) return nav.activeWorldviewId;
    var wvs = this.getWorldviews();
    return wvs.length > 0 ? wvs[0].id : null;
  },

  setActiveWorldviewId: function (id) {
    var nav = this.getNavigation();
    nav.activeWorldviewId = id;
    this.setNavigation(nav);
  },

  getMomentsByWorldview: function (worldviewId) {
    var all = this.getMoments();
    if (!worldviewId) return all;
    var filtered = [];
    for (var i = 0; i < all.length; i++) {
      if (MI.Data.momentInWorldview(all[i], worldviewId)) filtered.push(all[i]);
    }
    return filtered;
  },

  /**
   * 规范化朋友圈数据（worldviewIds）
   */
  normalizeMoments: function () {
    var moments = this.getMoments();
    var changed = false;
    for (var i = 0; i < moments.length; i++) {
      var m = moments[i];
      if (!m.worldviewIds || !m.worldviewIds.length) {
        m.worldviewIds = m.worldviewId ? [m.worldviewId] : [];
        changed = true;
      }
    }
    if (changed) this.setMoments(moments);
    return moments;
  },

  /**
   * 清空所有 mi_ 前缀的数据
   */
  clearAll: function () {
    var keysToRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf('mi_') === 0) {
        keysToRemove.push(key);
      }
    }
    for (var j = 0; j < keysToRemove.length; j++) {
      this.remove(keysToRemove[j]);
    }
    // 同时清除旧格式数据
    var oldKeys = ['api-url', 'api-key', 'api-model', 'system-prompt', 'chat-history'];
    for (var k = 0; k < oldKeys.length; k++) {
      this.remove(oldKeys[k]);
    }
  }
};
