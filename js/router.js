/**
 * router.js — 栈式导航系统（每页独立 params 栈）
 */
window.MI = window.MI || {};

MI.Router = {
  stack: ['home'],
  paramStack: [null],
  wechatTab: 'chats',
  currentParams: null,
  _animating: false,

  init: function () {
    var nav = MI.Storage.getNavigation();
    if (nav && nav.stack && nav.stack.length > 0) {
      this.stack = nav.stack;
    }
    if (nav && nav.wechatTab) {
      this.wechatTab = nav.wechatTab;
    }

    if (nav && nav.paramStack && nav.paramStack.length === this.stack.length) {
      this.paramStack = nav.paramStack;
    } else {
      this.paramStack = [];
      for (var i = 0; i < this.stack.length; i++) {
        this.paramStack.push(null);
      }
      if (nav && nav.currentParams) {
        this.paramStack[this.stack.length - 1] = nav.currentParams;
      }
    }

    this._repairParamStack();
    this.currentParams = this.paramStack[this.paramStack.length - 1] || null;
    this._sanitizeStack();
    this.render();
    this._updateClock();
  },

  navigateTo: function (page, params) {
    if (this._animating) return;
    this.stack.push(page);
    this.paramStack.push(params !== undefined ? params : null);
    this.currentParams = params !== undefined ? params : null;
    this._save();
    this._animatePush(page);
  },

  goBack: function () {
    if (this._animating) return;
    if (this.stack.length <= 1) return;

    var leavingPage = this.stack[this.stack.length - 1];
    var leavingParams = this.paramStack[this.paramStack.length - 1];
    var prevIdx = this.stack.length - 2;

    if (leavingPage === 'character-edit' && leavingParams && leavingParams.chatId) {
      if (this.stack[prevIdx] === 'chat-detail') {
        this.paramStack[prevIdx] = {
          chatId: leavingParams.chatId,
          contactId: leavingParams.contactId || null
        };
      }
    }

    if (leavingPage === 'tool-edit' && leavingParams && leavingParams.chatId) {
      if (this.stack[prevIdx] === 'chat-detail') {
        this.paramStack[prevIdx] = {
          chatId: leavingParams.chatId,
          contactId: leavingParams.contactId || null
        };
      }
    }

    this.stack.pop();
    this.paramStack.pop();
    this.currentParams = this.paramStack[this.paramStack.length - 1] || null;
    this._save();
    this._animatePop();
  },

  goHome: function () {
    if (this._animating) return;
    this.stack = ['home'];
    this.paramStack = [null];
    this.currentParams = null;
    this._save();
    this.render();
  },

  switchWechatTab: function (tabId) {
    this.wechatTab = tabId;
    this._save();
    this.render();
  },

  currentPage: function () {
    return this.stack[this.stack.length - 1];
  },

  _save: function () {
    var nav = MI.Storage.getNavigation();
    MI.Storage.setNavigation({
      stack: this.stack.slice(),
      paramStack: this.paramStack.slice(),
      wechatTab: this.wechatTab,
      activeWorldviewId: nav.activeWorldviewId || null,
      currentParams: this.currentParams
    });
  },

  resolveChatId: function (params) {
    if (!params) return null;
    if (params.chatId) return params.chatId;
    if (params.contactId) {
      var chats = MI.Storage.getChats();
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].contactId === params.contactId) return chats[i].id;
      }
    }
    return null;
  },

  /** 修复旧版导航数据中 chat-detail 丢失的 params */
  _repairParamStack: function () {
    for (var i = 0; i < this.stack.length; i++) {
      if (this.stack[i] !== 'chat-detail') continue;
      if (this.resolveChatId(this.paramStack[i])) continue;

      if (i + 1 < this.stack.length && this.paramStack[i + 1]) {
        var next = this.paramStack[i + 1];
        var chatId = this.resolveChatId(next);
        if (chatId) {
          this.paramStack[i] = {
            chatId: chatId,
            contactId: next.contactId || null
          };
        }
      }
    }
  },

  /** 获取当前 chat-detail 页的有效 params */
  getChatDetailParams: function () {
    var idx = this.stack.length - 1;
    if (this.stack[idx] !== 'chat-detail') return this.currentParams;

    if (this.resolveChatId(this.currentParams)) return this.currentParams;
    if (this.resolveChatId(this.paramStack[idx])) {
      this.currentParams = this.paramStack[idx];
      return this.currentParams;
    }
    return this.currentParams;
  },

  _sanitizeStack: function () {
    var page = this.currentPage();
    var invalid = false;

    if (page === 'chat-detail') {
      var chatId = this.resolveChatId(this.currentParams);
      if (!chatId) {
        invalid = true;
      } else {
        var chats = MI.Storage.getChats();
        var found = false;
        for (var i = 0; i < chats.length; i++) {
          if (chats[i].id === chatId) { found = true; break; }
        }
        if (!found) invalid = true;
      }
    }

    if (page === 'character-edit') {
      var contactId = this.currentParams && this.currentParams.contactId;
      var contact = contactId ? MI.Data.getContactById(contactId) : null;
      if (!contactId || !contact || MI.Data.isTool(contact)) invalid = true;
    }

    if (page === 'character-profile' || page === 'character-chat-settings' || page === 'character-moment-settings') {
      var charId = this.currentParams && this.currentParams.contactId;
      var charContact = charId ? MI.Data.getContactById(charId) : null;
      if (!charId || !charContact || !MI.Data.isCharacter(charContact)) invalid = true;
    }

    if (page === 'tool-edit') {
      var toolId = this.currentParams && this.currentParams.contactId;
      var tool = toolId ? MI.Data.getContactById(toolId) : null;
      if (!toolId || !tool || !MI.Data.isTool(tool)) invalid = true;
    }

    if (page === 'api-profile-edit' && this.currentParams && this.currentParams.profileId) {
      if (!MI.Storage.getApiProfileById(this.currentParams.profileId)) invalid = true;
    }

    if (page === 'player-persona-edit' && this.currentParams && this.currentParams.worldviewId) {
      if (!MI.Storage.getWorldviewById(this.currentParams.worldviewId)) invalid = true;
    }

    if (page === 'moment-edit') {
      var momentId = this.currentParams && this.currentParams.momentId;
      if (!momentId || !MI.Moments.getById(momentId)) invalid = true;
    }

    if (page === 'worldview-edit' && this.currentParams && this.currentParams.worldviewId) {
      if (!MI.Storage.getWorldviewById(this.currentParams.worldviewId)) invalid = true;
    }

    if (invalid) {
      while (this.stack.length > 1 && this.currentPage() !== 'wechat' && this.currentPage() !== 'home') {
        this.stack.pop();
        this.paramStack.pop();
      }
      if (this.currentPage() !== 'wechat' && this.currentPage() !== 'home') {
        this.stack = ['home', 'wechat'];
        this.paramStack = [null, null];
      }
      this.currentParams = this.paramStack[this.paramStack.length - 1] || null;
    }
  },

  _renderPage: function (screen, page) {
    switch (page) {
      case 'home':
        MI.HomeScreen.render(screen);
        break;
      case 'wechat':
        MI.WeChat.render(screen);
        break;
      case 'chat-detail':
        MI.WeChat.renderChatDetail(screen);
        break;
      case 'moments':
        MI.Moments.render(screen);
        break;
      case 'moment-detail':
        MI.Moments.renderDetail(screen);
        break;
      case 'moment-author':
        MI.Moments.renderAuthor(screen);
        break;
      case 'moment-notifications':
        MI.Moments.renderNotifications(screen);
        break;
      case 'moment-compose':
        MI.Moments.renderCompose(screen);
        break;
      case 'moment-edit':
        MI.Moments.renderEdit(screen);
        break;
      case 'settings':
        MI.Profile.renderSettings(screen);
        break;
      case 'profile-edit':
        MI.Profile.renderEdit(screen);
        break;
      case 'player-profile':
        MI.Profile.renderPlayerProfile(screen);
        break;
      case 'player-persona-list':
        MI.Profile.renderPersonaList(screen);
        break;
      case 'player-persona-edit':
        MI.Profile.renderPersonaEdit(screen);
        break;
      case 'api-profiles-list':
        MI.ApiProfiles.renderList(screen);
        break;
      case 'api-profile-edit':
        MI.ApiProfiles.renderEdit(screen);
        break;
      case 'worldview-list':
        MI.Worldview.renderList(screen);
        break;
      case 'worldview-edit':
        MI.Worldview.renderEdit(screen);
        break;
      case 'character-create':
        MI.Characters.renderCreate(screen);
        break;
      case 'character-edit':
        MI.Characters.renderEdit(screen);
        break;
      case 'character-profile':
        MI.Characters.renderProfile(screen);
        break;
      case 'character-chat-settings':
        MI.Characters.renderChatSettings(screen);
        break;
      case 'character-moment-settings':
        MI.Characters.renderMomentSettings(screen);
        break;
      case 'tool-create':
        MI.Tools.renderCreate(screen);
        break;
      case 'tool-edit':
        MI.Tools.renderEdit(screen);
        break;
      default:
        screen.textContent = '页面未找到: ' + page;
    }
  },

  render: function () {
    var app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = '';

    var page = this.currentPage();
    var screen = document.createElement('div');
    screen.className = 'screen';
    screen.id = 'screen-' + page;

    this._renderPage(screen, page);
    app.appendChild(screen);
  },

  _animatePush: function (page) {
    var app = document.getElementById('app');
    if (!app) return;
    this._animating = true;

    var newScreen = document.createElement('div');
    newScreen.className = 'screen screen-enter';
    newScreen.id = 'screen-' + page;

    this._renderPage(newScreen, page);

    var oldScreen = app.firstChild;
    if (oldScreen) oldScreen.classList.add('screen-exit');

    app.appendChild(newScreen);
    newScreen.offsetHeight;
    newScreen.classList.add('screen-active');

    var self = this;
    setTimeout(function () {
      if (oldScreen && oldScreen.parentNode) oldScreen.parentNode.removeChild(oldScreen);
      newScreen.classList.remove('screen-enter', 'screen-active');
      self._animating = false;
    }, 300);
  },

  _animatePop: function () {
    var app = document.getElementById('app');
    if (!app) return;

    var oldScreen = app.firstChild;
    if (!oldScreen) {
      this.render();
      return;
    }

    this._animating = true;

    var page = this.currentPage();
    var prevScreen = document.createElement('div');
    prevScreen.className = 'screen screen-back';

    this._renderPage(prevScreen, page);

    app.insertBefore(prevScreen, oldScreen);

    prevScreen.offsetHeight;
    prevScreen.classList.add('screen-active');
    oldScreen.classList.add('screen-exit-right');

    var self = this;
    setTimeout(function () {
      if (oldScreen && oldScreen.parentNode) oldScreen.parentNode.removeChild(oldScreen);
      prevScreen.classList.remove('screen-back', 'screen-active');
      self._animating = false;
    }, 300);
  },

  _updateClock: function () {
    setInterval(function () {
      var statusEls = document.querySelectorAll('.status-left');
      for (var i = 0; i < statusEls.length; i++) {
        var now = new Date();
        var h = now.getHours();
        var m = now.getMinutes();
        statusEls[i].textContent = (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
      }
    }, 30000);
  }
};
