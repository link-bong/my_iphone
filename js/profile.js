/**
 * profile.js — 「我」Tab + 设置页 + 资料编辑
 */
window.MI = window.MI || {};

MI.Profile = {
  render: function (container) {
    container.innerHTML = '';

    var profile = MI.Storage.getProfile();
    var card = document.createElement('div');
    card.className = 'profile-card profile-card-clickable';

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

    var whatsUp = document.createElement('div');
    whatsUp.className = 'profile-region';
    whatsUp.textContent = profile.whatsUp || '';

    info.appendChild(name);
    info.appendChild(wechatId);
    info.appendChild(region);
    info.appendChild(whatsUp);

    card.appendChild(avatar);
    card.appendChild(info);
    card.addEventListener('click', function () {
      MI.Router.navigateTo('profile-edit');
    });
    container.appendChild(card);

    var self = this;
    var menus = [
      { icon: '🌍', label: '世界观设定', onClick: function () { MI.Router.navigateTo('worldview-list'); } },
      { icon: '🤖', label: 'AI 助手设置', sublabel: '仅用于系统机器人', onClick: function () { MI.Router.navigateTo('settings'); } },
      { icon: '💾', label: '存储管理', onClick: function () { self._showStorageInfo(); } }
    ];

    for (var i = 0; i < menus.length; i++) {
      var menu = menus[i];
      container.appendChild(MI.Components.createDivider());
      var row = MI.Components.createMenuRow(menu.icon, menu.label, menu.sublabel || '', true, menu.onClick);
      container.appendChild(row);
    }
  },

  renderEdit: function (container) {
    var profile = MI.Storage.getProfile();
    container.classList.add('app-screen');

    var navBar = MI.Components.createNavBar('编辑资料', {
      showBack: true,
      onBack: function () { MI.Router.goBack(); }
    });
    container.appendChild(navBar);

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('settings-scroll');

    scroll.appendChild(MI.Components.createInputField('昵称', 'prof-name', profile.name, '', false, false));
    scroll.appendChild(MI.Components.createInputField('微信号', 'prof-wechat-id', profile.wechatId, '', false, false));
    scroll.appendChild(MI.Components.createInputField('头像（emoji）', 'prof-avatar', profile.avatar, '😊', false, false));
    scroll.appendChild(MI.Components.createInputField('地区', 'prof-region', profile.region, '', false, false));
    scroll.appendChild(MI.Components.createInputField('个性签名', 'prof-whatsup', profile.whatsUp || '', '', false, true));

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn-glass btn-glass-primary';
    saveBtn.textContent = '💾 保存资料';
    saveBtn.addEventListener('click', function () {
      MI.Profile._saveProfile();
    });
    scroll.appendChild(saveBtn);

    container.appendChild(scroll);
  },

  renderSettings: function (container) {
    var self = this;
    var config = MI.Storage.getConfig();

    container.classList.add('app-screen');

    var navBar = MI.Components.createNavBar('AI 助手设置', {
      showBack: true,
      onBack: function () { MI.Router.goBack(); }
    });
    container.appendChild(navBar);

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('settings-scroll');

    var hint = document.createElement('div');
    hint.className = 'form-hint';
    hint.textContent = '此配置仅用于「AI 助手」会话。每个角色有独立的 API 配置。';
    scroll.appendChild(hint);

    var providerBox = document.createElement('div');
    providerBox.className = 'setting-group';
    MI.Providers.renderSelector(providerBox, function (provider) {
      document.getElementById('cfg-api-url').value = provider.apiUrl;
      document.getElementById('cfg-api-model').value = provider.apiModel;
    });
    scroll.appendChild(providerBox);

    scroll.appendChild(MI.Components.createInputField('API 转发链接 (URL)', 'cfg-api-url', config.apiUrl, 'https://api.deepseek.com/v1/chat/completions', false, false));
    scroll.appendChild(MI.Components.createInputField('API Key', 'cfg-api-key', config.apiKey, 'sk-...', true, false));
    scroll.appendChild(MI.Components.createInputField('模型名称 (Model)', 'cfg-api-model', config.apiModel, '如 deepseek-chat', false, false));
    scroll.appendChild(MI.Components.createInputField('AI 助手人设', 'cfg-system-prompt', config.systemPrompt, '设定 AI 助手的行为', false, true));

    var securityHint = document.createElement('div');
    securityHint.className = 'form-hint form-hint-warn';
    securityHint.textContent = 'API Key 存储在本地浏览器中，请勿在公共设备上使用。';
    scroll.appendChild(securityHint);

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn-glass btn-glass-primary';
    saveBtn.textContent = '💾 保存设置';
    saveBtn.addEventListener('click', function () {
      self._saveSettings();
    });
    scroll.appendChild(saveBtn);

    var clearBtn = document.createElement('button');
    clearBtn.className = 'btn-glass btn-glass-danger';
    clearBtn.textContent = '🗑️ 清空所有数据';
    clearBtn.addEventListener('click', function () {
      if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
        MI.Storage.clearAll();
        alert('数据已清空。页面将重新加载。');
        location.reload();
      }
    });
    scroll.appendChild(clearBtn);

    container.appendChild(scroll);
  },

  _saveProfile: function () {
    var profile = {
      name: document.getElementById('prof-name').value.trim() || '我',
      wechatId: document.getElementById('prof-wechat-id').value.trim() || 'my_wechat_id',
      avatar: document.getElementById('prof-avatar').value.trim() || '😊',
      region: document.getElementById('prof-region').value.trim() || '中国',
      whatsUp: document.getElementById('prof-whatsup').value.trim()
    };
    MI.Storage.setProfile(profile);
    MI.Router.goBack();
  },

  _saveSettings: function () {
    var config = {
      apiUrl: document.getElementById('cfg-api-url').value.trim(),
      apiKey: document.getElementById('cfg-api-key').value.trim(),
      apiModel: document.getElementById('cfg-api-model').value.trim(),
      systemPrompt: document.getElementById('cfg-system-prompt').value.trim()
    };
    MI.Storage.setConfig(config);
    this._showToast('设置已保存');
  },

  _showStorageInfo: function () {
    var chats = MI.Storage.getChats();
    var contacts = MI.Storage.getContacts();
    var moments = MI.Storage.getMoments();
    var worldviews = MI.Storage.getWorldviews();
    var totalChatMessages = 0;
    for (var i = 0; i < chats.length; i++) {
      totalChatMessages += chats[i].messages ? chats[i].messages.length : 0;
    }
    alert('存储统计\n\n会话数：' + chats.length +
      '\n聊天消息：' + totalChatMessages +
      '\n角色数：' + contacts.length +
      '\n世界观：' + worldviews.length +
      '\n朋友圈：' + moments.length);
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
