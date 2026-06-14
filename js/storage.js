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
        alert('存储空间不足！请清理一些旧数据。');
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
      apiUrl: 'https://api.deepseek.com/v1/chat/completions',
      apiKey: '',
      apiModel: 'deepseek-chat',
      systemPrompt: '你现在扮演一位贴心的朋友。请保持人设与我聊天。'
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
      whatsUp: '这个人很懒，什么都没写'
    });
  },

  setProfile: function (profile) {
    this.set('mi_profile', profile);
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
      if (all[i].worldviewId === worldviewId) filtered.push(all[i]);
    }
    return filtered;
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
