/**
 * router.js — 栈式导航系统
 */
window.MI = window.MI || {};

MI.Router = {
  stack: ['home'],
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
    this.render();
    this._updateClock();
  },

  navigateTo: function (page, params) {
    if (this._animating) return;
    if (params !== undefined) this.currentParams = params;
    this.stack.push(page);
    this._save();
    this._animatePush(page);
  },

  goBack: function () {
    if (this._animating) return;
    if (this.stack.length <= 1) return;
    this.stack.pop();
    this._save();
    this._animatePop();
  },

  goHome: function () {
    if (this._animating) return;
    this.stack = ['home'];
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
      wechatTab: this.wechatTab,
      activeWorldviewId: nav.activeWorldviewId || null
    });
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
      case 'moment-compose':
        MI.Moments.renderCompose(screen);
        break;
      case 'settings':
        MI.Profile.renderSettings(screen);
        break;
      case 'profile-edit':
        MI.Profile.renderEdit(screen);
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
    this._animating = true;

    var page = this.currentPage();
    var prevScreen = document.createElement('div');
    prevScreen.className = 'screen screen-back';

    this._renderPage(prevScreen, page);

    var oldScreen = app.firstChild;
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
