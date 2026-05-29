/**
 * router.js — 栈式导航系统
 * 模拟 iOS UINavigationController 的 push/pop 机制
 */
window.MI = window.MI || {};

MI.Router = {
  // 当前导航栈
  stack: ['home'],
  // 微信当前 tab
  wechatTab: 'chats',
  // 当前页面的额外参数
  currentParams: null,
  // 过渡动画中标志
  _animating: false,

  /**
   * 初始化：从 localStorage 恢复导航状态
   */
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

  /**
   * 推入新页面
   * @param {string} page - 页面标识
   * @param {*} params - 可选参数
   */
  navigateTo: function (page, params) {
    if (this._animating) return;
    if (params !== undefined) this.currentParams = params;
    this.stack.push(page);
    this._save();
    this._animatePush(page);
  },

  /**
   * 返回上一页
   */
  goBack: function () {
    if (this._animating) return;
    if (this.stack.length <= 1) return;
    this.stack.pop();
    this._save();
    this._animatePop();
  },

  /**
   * 回到主屏幕
   */
  goHome: function () {
    if (this._animating) return;
    this.stack = ['home'];
    this.currentParams = null;
    this._save();
    this.render();
  },

  /**
   * 切换微信 Tab
   */
  switchWechatTab: function (tabId) {
    this.wechatTab = tabId;
    this._save();
    this.render();
  },

  /**
   * 获取当前页面
   */
  currentPage: function () {
    return this.stack[this.stack.length - 1];
  },

  /**
   * 保存导航状态
   */
  _save: function () {
    MI.Storage.setNavigation({
      stack: this.stack.slice(),
      wechatTab: this.wechatTab
    });
  },

  /**
   * 渲染当前页面
   */
  render: function () {
    var app = document.getElementById('app');
    if (!app) return;

    // 清空
    app.innerHTML = '';

    var page = this.currentPage();

    // 创建页面容器
    var screen = document.createElement('div');
    screen.className = 'screen';
    screen.id = 'screen-' + page;

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
      case 'settings':
        MI.Profile.renderSettings(screen);
        break;
      default:
        screen.textContent = '页面未找到: ' + page;
    }

    app.appendChild(screen);
  },

  /**
   * 带动画的推入
   */
  _animatePush: function (page) {
    var app = document.getElementById('app');
    if (!app) return;
    this._animating = true;

    // 先渲染新页面到临时位置获取高度
    var newScreen = document.createElement('div');
    newScreen.className = 'screen screen-enter';
    newScreen.id = 'screen-' + page;

    switch (page) {
      case 'home':
        MI.HomeScreen.render(newScreen);
        break;
      case 'wechat':
        MI.WeChat.render(newScreen);
        break;
      case 'chat-detail':
        MI.WeChat.renderChatDetail(newScreen);
        break;
      case 'moments':
        MI.Moments.render(newScreen);
        break;
      case 'settings':
        MI.Profile.renderSettings(newScreen);
        break;
    }

    // 给旧页面加退出动画
    var oldScreen = app.firstChild;
    if (oldScreen) {
      oldScreen.classList.add('screen-exit');
    }

    app.appendChild(newScreen);

    // 强制回流
    newScreen.offsetHeight;
    newScreen.classList.add('screen-active');

    var self = this;
    setTimeout(function () {
      if (oldScreen && oldScreen.parentNode) {
        oldScreen.parentNode.removeChild(oldScreen);
      }
      newScreen.classList.remove('screen-enter', 'screen-active');
      self._animating = false;
    }, 300);
  },

  /**
   * 带动画的弹出
   */
  _animatePop: function () {
    var app = document.getElementById('app');
    if (!app) return;
    this._animating = true;

    var page = this.currentPage();

    // 渲染上一页
    var prevScreen = document.createElement('div');
    prevScreen.className = 'screen screen-back';

    switch (page) {
      case 'home':
        MI.HomeScreen.render(prevScreen);
        break;
      case 'wechat':
        MI.WeChat.render(prevScreen);
        break;
      case 'chat-detail':
        MI.WeChat.renderChatDetail(prevScreen);
        break;
      case 'moments':
        MI.Moments.render(prevScreen);
        break;
      case 'settings':
        MI.Profile.renderSettings(prevScreen);
        break;
    }

    var oldScreen = app.firstChild;
    app.insertBefore(prevScreen, oldScreen);

    // 强制回流
    prevScreen.offsetHeight;
    prevScreen.classList.add('screen-active');
    oldScreen.classList.add('screen-exit-right');

    var self = this;
    setTimeout(function () {
      if (oldScreen && oldScreen.parentNode) {
        oldScreen.parentNode.removeChild(oldScreen);
      }
      prevScreen.classList.remove('screen-back', 'screen-active');
      self._animating = false;
    }, 300);
  },

  /**
   * 更新状态栏时间
   */
  _updateClock: function () {
    var self = this;
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
