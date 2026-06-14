/**
 * homescreen.js — 手机主屏幕
 * iPhone 风格：状态栏 + 应用网格 + Dock
 */
window.MI = window.MI || {};

MI.HomeScreen = {
  // 应用列表（只有微信是功能性的）
  apps: [
    { id: 'wechat', emoji: '💬', label: '微信',   color: '#07C160' },
    { id: 'photos', emoji: '📷', label: '相册',   color: '#FF9500' },
    { id: 'calendar', emoji: '📅', label: '日历', color: '#FF3B30' },
    { id: 'settings_ios', emoji: '⚙️', label: '设置', color: '#8E8E93' },
    { id: 'music', emoji: '🎵', label: '音乐',   color: '#FC3C44' },
    { id: 'notes', emoji: '📝', label: '便签',   color: '#FFCC00' },
    { id: 'safari', emoji: '🌐', label: 'Safari', color: '#007AFF' },
    { id: 'calc', emoji: '🧮', label: '计算器',  color: '#5856D6' }
  ],

  // Dock 应用
  dockApps: [
    { id: 'phone', emoji: '📞', label: '电话',  color: '#34C759' },
    { id: 'safari_dock', emoji: '🌐', label: 'Safari', color: '#007AFF' },
    { id: 'wechat_dock', emoji: '💬', label: '微信',  color: '#07C160' },
    { id: 'music_dock', emoji: '🎵', label: '音乐',  color: '#FC3C44' }
  ],

  /**
   * 渲染主屏幕到指定容器
   */
  render: function (container) {
    container.classList.add('home-screen');

    // 状态栏
    var statusBar = MI.Components.createStatusBar();
    statusBar.classList.add('status-bar-glass');
    container.appendChild(statusBar);

    // 应用网格
    var grid = document.createElement('div');
    grid.className = 'app-grid';
    grid.style.paddingTop = '40px';

    for (var i = 0; i < this.apps.length; i++) {
      var app = this.apps[i];
      var icon = MI.Components.createAppIcon(
        app.emoji,
        app.label,
        app.id,
        (function (appId) {
          return function () {
            MI.HomeScreen.onAppClick(appId);
          };
        })(app.id),
        false
      );
      grid.appendChild(icon);
    }

    container.appendChild(grid);

    // 弹性空白
    var spacer = document.createElement('div');
    spacer.style.flex = '1';
    container.appendChild(spacer);

    // Dock
    var dock = document.createElement('div');
    dock.className = 'dock';

    for (var j = 0; j < this.dockApps.length; j++) {
      var dApp = this.dockApps[j];
      var dIcon = MI.Components.createAppIcon(
        dApp.emoji,
        dApp.label,
        dApp.id,
        (function (appId) {
          return function () {
            MI.HomeScreen.onAppClick(appId);
          };
        })(dApp.id),
        true
      );
      dock.appendChild(dIcon);
    }

    container.appendChild(dock);
  },

  /**
   * 应用点击处理
   */
  onAppClick: function (appId) {
    switch (appId) {
      case 'wechat':
      case 'wechat_dock':
        MI.Router.navigateTo('wechat');
        break;
      default:
        // 非微信应用显示提示
        var app = this._findApp(appId);
        var name = app ? app.label : '应用';
        this._showToast(name + ' 功能开发中...');
    }
  },

  _findApp: function (id) {
    for (var i = 0; i < this.apps.length; i++) {
      if (this.apps[i].id === id) return this.apps[i];
    }
    for (var i = 0; i < this.dockApps.length; i++) {
      if (this.dockApps[i].id === id) return this.dockApps[i];
    }
    return null;
  },

  _showToast: function (message) {
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.getElementById('app').appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 1500);
  }
};
