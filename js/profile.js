/**
 * profile.js — 「我」Tab 页面 + API 设置页
 */
window.MI = window.MI || {};

MI.Profile = {
  /**
   * 渲染「我」页面
   */
  render: function (container) {
    container.innerHTML = '';

    // 个人资料卡片
    var profile = MI.Storage.getProfile();
    var card = document.createElement('div');
    card.className = 'profile-card';

    var avatar = MI.Components.createAvatar(profile.avatar, 'large');

    var info = document.createElement('div');
    info.className = 'profile-info';

    var name = document.createElement('div');
    name.className = 'profile-name';
    name.textContent = profile.name;

    var wechatId = document.createElement('div');
    wechatId.className = 'profile-wechat-id';
    wechatId.textContent = '微信号：' + profile.wechatId;

    var region = document.createElement('div');
    region.className = 'profile-region';
    region.textContent = '地区：' + profile.region;

    info.appendChild(name);
    info.appendChild(wechatId);
    info.appendChild(region);

    card.appendChild(avatar);
    card.appendChild(info);
    container.appendChild(card);

    // 菜单列表
    var self = this;
    var menus = [
      { icon: '⚙️', label: 'API 设置', sublabel: '', onClick: function () { MI.Router.navigateTo('settings'); } },
      { icon: '💾', label: '存储管理', sublabel: '', onClick: function () { self._showStorageInfo(); } }
    ];

    for (var i = 0; i < menus.length; i++) {
      var menu = menus[i];
      var row = MI.Components.createMenuRow(menu.icon, menu.label, menu.sublabel, true, menu.onClick);
      container.appendChild(MI.Components.createDivider());
      container.appendChild(row);
    }
  },

  /**
   * 渲染 API 设置页
   */
  renderSettings: function (container) {
    var self = this;
    var config = MI.Storage.getConfig();

    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';
    container.style.background = '#F2F2F7';

    // 导航栏
    var navBar = MI.Components.createNavBar('API 设置', true, null, function () {
      MI.Router.goBack();
    }, null);
    container.appendChild(navBar);

    // 滚动区域
    var scroll = MI.Components.createScrollContainer();
    scroll.style.padding = '16px';

    // 表单字段
    scroll.appendChild(MI.Components.createInputField('API 转发链接 (URL)', 'cfg-api-url', config.apiUrl, 'https://api.deepseek.com/v1/chat/completions', false, false));
    scroll.appendChild(MI.Components.createInputField('API Key', 'cfg-api-key', config.apiKey, '在此处粘贴你的密钥 (sk-...)', true, false));
    scroll.appendChild(MI.Components.createInputField('模型名称 (Model)', 'cfg-api-model', config.apiModel, '如 deepseek-chat', false, false));
    scroll.appendChild(MI.Components.createInputField('角色卡设定 (System Prompt)', 'cfg-system-prompt', config.systemPrompt, '设定 AI 的行为和性格', false, true));

    // 保存按钮
    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = '💾 保存设置';
    saveBtn.style.cssText = 'width:100%;padding:14px;background:#07C160;color:white;border:none;border-radius:10px;font-size:16px;font-weight:600;margin-top:16px;cursor:pointer;';
    saveBtn.addEventListener('click', function () {
      self._saveSettings();
    });
    scroll.appendChild(saveBtn);

    // 清空数据按钮
    var clearBtn = document.createElement('button');
    clearBtn.className = 'btn btn-danger';
    clearBtn.textContent = '🗑️ 清空所有数据';
    clearBtn.style.cssText = 'width:100%;padding:14px;background:#FF3B30;color:white;border:none;border-radius:10px;font-size:16px;font-weight:600;margin-top:12px;cursor:pointer;';
    clearBtn.addEventListener('click', function () {
      if (confirm('确定要清空所有数据吗？包括聊天记录、联系人、朋友圈和设置。此操作不可恢复！')) {
        MI.Storage.clearAll();
        alert('数据已清空。页面将重新加载。');
        location.reload();
      }
    });
    scroll.appendChild(clearBtn);

    container.appendChild(scroll);
  },

  /**
   * 保存设置
   */
  _saveSettings: function () {
    var config = {
      apiUrl: document.getElementById('cfg-api-url').value.trim(),
      apiKey: document.getElementById('cfg-api-key').value.trim(),
      apiModel: document.getElementById('cfg-api-model').value.trim(),
      systemPrompt: document.getElementById('cfg-system-prompt').value.trim()
    };
    MI.Storage.setConfig(config);
    this._showToast('✅ 设置已保存');
  },

  /**
   * 显示存储信息
   */
  _showStorageInfo: function () {
    var chats = MI.Storage.getChats();
    var contacts = MI.Storage.getContacts();
    var moments = MI.Storage.getMoments();
    var totalChatMessages = 0;
    for (var i = 0; i < chats.length; i++) {
      totalChatMessages += chats[i].messages ? chats[i].messages.length : 0;
    }
    var info = '📊 存储统计\n\n' +
      '会话数：' + chats.length + '\n' +
      '聊天消息总数：' + totalChatMessages + '\n' +
      '联系人：' + contacts.length + '\n' +
      '朋友圈帖子：' + moments.length;
    alert(info);
  },

  _showToast: function (message) {
    var toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:white;padding:10px 24px;border-radius:20px;font-size:14px;z-index:9999;pointer-events:none;';
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
