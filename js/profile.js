/**
 * profile.js — 「我」Tab + 设置 + 资料 + 人设管理
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
    if (profile.nickname) {
      var nick = document.createElement('div');
      nick.className = 'profile-region';
      nick.textContent = '小名：' + profile.nickname;
      info.appendChild(nick);
    }
    if (profile.birthday) {
      var bday = document.createElement('div');
      bday.className = 'profile-region';
      bday.textContent = '生日：' + profile.birthday;
      info.appendChild(bday);
    }
    info.appendChild(region);
    info.appendChild(whatsUp);

    card.appendChild(avatar);
    card.appendChild(info);
    card.addEventListener('click', function () {
      MI.Router.navigateTo('player-profile');
    });
    container.appendChild(card);

    var self = this;
    var menus = [
      { icon: 'user-pen', label: '人设管理', sublabel: '按世界观设定你的人设', onClick: function () { MI.Router.navigateTo('player-persona-list'); } },
      { icon: 'plug', label: 'API 配置', sublabel: '统一管理多个模型商', onClick: function () { MI.Router.navigateTo('api-profiles-list'); } },
      { icon: 'globe', label: '世界观设定', onClick: function () { MI.Router.navigateTo('worldview-list'); } },
      { icon: 'robot', label: 'AI 助手设置', sublabel: '系统机器人会话', onClick: function () { MI.Router.navigateTo('settings'); } },
      { icon: 'database', label: '存储管理', onClick: function () { self._showStorageInfo(); } }
    ];

    for (var i = 0; i < menus.length; i++) {
      var menu = menus[i];
      container.appendChild(MI.Components.createDivider());
      var row = MI.Components.createMenuRow(menu.icon, menu.label, menu.sublabel || '', true, menu.onClick);
      container.appendChild(row);
    }
  },

  renderPlayerProfile: function (container) {
    var profile = MI.Storage.getProfile();
    var persona = profile.personas ? profile.personas.default : {};

    container.classList.add('app-screen');
    container.appendChild(MI.Components.createNavBar('我的资料', {
      showBack: true,
      onBack: function () { MI.Router.goBack(); },
      rightIcon: 'pen',
      onRight: function () { MI.Router.navigateTo('profile-edit'); }
    }));

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('settings-scroll');

    scroll.appendChild(MI.Components.createProfileHeader(profile.avatar, profile.name, profile.whatsUp || ''));

    scroll.appendChild(MI.Components.createDetailRow('昵称', profile.name));
    scroll.appendChild(MI.Components.createDetailRow('小名/昵称', profile.nickname || persona.nickname));
    scroll.appendChild(MI.Components.createDetailRow('称呼', profile.callName || persona.callName));
    scroll.appendChild(MI.Components.createDetailRow('微信号', profile.wechatId));
    scroll.appendChild(MI.Components.createDetailRow('地区', profile.region));
    scroll.appendChild(MI.Components.createDetailRow('生日', profile.birthday || persona.birthday));
    scroll.appendChild(MI.Components.createDetailRow('喜好', profile.likes || persona.likes));
    scroll.appendChild(MI.Components.createDetailRow('个性签名', profile.whatsUp));

    var section = document.createElement('div');
    section.className = 'form-section-title';
    section.textContent = '默认人设';
    scroll.appendChild(section);
    scroll.appendChild(MI.Components.createDetailRow('外貌', persona.appearance));
    scroll.appendChild(MI.Components.createDetailRow('性格', persona.personality));
    scroll.appendChild(MI.Components.createDetailRow('背景', persona.background));

    var personaBtn = document.createElement('button');
    personaBtn.type = 'button';
    personaBtn.className = 'btn-glass btn-glass-secondary';
    personaBtn.appendChild(MI.Components.buttonContent('user-pen', '管理世界观人设'));
    personaBtn.addEventListener('click', function () {
      MI.Router.navigateTo('player-persona-list');
    });
    scroll.appendChild(personaBtn);

    container.appendChild(scroll);
  },

  renderEdit: function (container) {
    var profile = MI.Storage.getProfile();
    container.classList.add('app-screen');

    container.appendChild(MI.Components.createNavBar('编辑资料', {
      showBack: true,
      onBack: function () { MI.Router.goBack(); }
    }));

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('settings-scroll');

    scroll.appendChild(MI.Components.createInputField('昵称', 'prof-name', profile.name, '', false, false));
    scroll.appendChild(MI.Components.createInputField('小名/昵称', 'prof-nickname', profile.nickname || '', '日常称呼', false, false));
    scroll.appendChild(MI.Components.createInputField('称呼', 'prof-call-name', profile.callName || '', '希望别人怎么叫你', false, false));
    scroll.appendChild(MI.Components.createInputField('微信号', 'prof-wechat-id', profile.wechatId, '', false, false));
    scroll.appendChild(MI.Components.createAvatarPickerField('prof-avatar', profile.avatar));
    scroll.appendChild(MI.Components.createInputField('地区', 'prof-region', profile.region, '', false, false));
    scroll.appendChild(MI.Components.createInputField('生日', 'prof-birthday', profile.birthday || '', '如：5月20日', false, false));
    scroll.appendChild(MI.Components.createInputField('喜好', 'prof-likes', profile.likes || '', '爱好、喜欢的事物', false, true));
    scroll.appendChild(MI.Components.createInputField('个性签名', 'prof-whatsup', profile.whatsUp || '', '', false, true));

    var hint = document.createElement('div');
    hint.className = 'form-hint';
    hint.textContent = '详细人设（外貌、性格等）请在「人设管理」中按世界观设定。';
    scroll.appendChild(hint);

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn-glass btn-glass-primary';
    saveBtn.appendChild(MI.Components.buttonContent('floppy-disk', '保存资料'));
    saveBtn.addEventListener('click', function () { MI.Profile._saveProfile(); });
    scroll.appendChild(saveBtn);

    container.appendChild(scroll);
  },

  renderPersonaList: function (container) {
    container.classList.add('app-screen');
    container.appendChild(MI.Components.createNavBar('人设管理', {
      showBack: true,
      onBack: function () { MI.Router.goBack(); }
    }));

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('settings-scroll');

    var hint = document.createElement('div');
    hint.className = 'form-hint';
    hint.textContent = '为不同世界观设定你的人设。角色开启「使用我的人设」后将读取对应世界观下的设定。';
    scroll.appendChild(hint);

    var defaultRow = this._createPersonaRow('默认人设', '所有世界观的回退设定', null);
    defaultRow.addEventListener('click', function () {
      MI.Router.navigateTo('player-persona-edit', { worldviewId: null });
    });
    scroll.appendChild(defaultRow);
    scroll.appendChild(MI.Components.createDivider());

    var worldviews = MI.Storage.getWorldviews();
    if (worldviews.length === 0) {
      scroll.appendChild(MI.Components.createEmptyState('请先创建世界观\n才能设定专属人设'));
    } else {
      for (var i = 0; i < worldviews.length; i++) {
        (function (wv) {
          var row = MI.Profile._createPersonaRow(wv.name, '该世界观下的专属人设', wv.id);
          row.addEventListener('click', function () {
            MI.Router.navigateTo('player-persona-edit', { worldviewId: wv.id });
          });
          scroll.appendChild(row);
          if (i < worldviews.length - 1) scroll.appendChild(MI.Components.createDivider());
        })(worldviews[i]);
      }
    }

    container.appendChild(scroll);
  },

  _createPersonaRow: function (title, sub, worldviewId) {
    var profile = MI.Storage.getProfile();
    var personas = profile.personas || { default: {}, byWorldview: {} };
    var persona = worldviewId
      ? (personas.byWorldview && personas.byWorldview[worldviewId]) || {}
      : (personas.default || {});
    var hasContent = persona.appearance || persona.personality || persona.background ||
      persona.nickname || persona.callName || persona.birthday || persona.likes;

    var row = document.createElement('div');
    row.className = 'persona-list-row';

    var info = document.createElement('div');
    info.className = 'persona-list-info';

    var nameEl = document.createElement('div');
    nameEl.className = 'persona-list-name';
    nameEl.textContent = title;

    var subEl = document.createElement('div');
    subEl.className = 'persona-list-sub';
    subEl.textContent = hasContent ? '已设定' : sub;

    info.appendChild(nameEl);
    info.appendChild(subEl);
    row.appendChild(info);
    row.appendChild(MI.Components.icon('chevron-right', 'menu-arrow-icon'));
    return row;
  },

  renderPersonaEdit: function (container) {
    var params = MI.Router.currentParams || {};
    var worldviewId = params.worldviewId || null;
    var profile = MI.Storage.getProfile();
    var personas = profile.personas || { default: {}, byWorldview: {} };
    var persona = worldviewId
      ? (personas.byWorldview && personas.byWorldview[worldviewId]) || {}
      : (personas.default || {});

    var title = '默认人设';
    if (worldviewId) {
      var wv = MI.Storage.getWorldviewById(worldviewId);
      title = wv ? wv.name + ' · 人设' : '世界观人设';
    }

    container.classList.add('app-screen');
    container.appendChild(MI.Components.createNavBar(title, {
      showBack: true,
      onBack: function () { MI.Router.goBack(); }
    }));

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('settings-scroll');

    scroll.appendChild(MI.Components.createInputField('小名/昵称', 'pp-nickname', persona.nickname || '', '在该世界观下的称呼', false, false));
    scroll.appendChild(MI.Components.createInputField('称呼', 'pp-call-name', persona.callName || '', '希望角色怎么叫你', false, false));
    scroll.appendChild(MI.Components.createInputField('生日', 'pp-birthday', persona.birthday || '', '如：5月20日', false, false));
    scroll.appendChild(MI.Components.createInputField('喜好', 'pp-likes', persona.likes || '', '爱好、喜欢的事物', false, true));
    scroll.appendChild(MI.Components.createInputField('外貌', 'pp-appearance', persona.appearance || '', '你的外貌描述', false, true));
    scroll.appendChild(MI.Components.createInputField('性格', 'pp-personality', persona.personality || '', '性格、说话方式', false, true));
    scroll.appendChild(MI.Components.createInputField('个人背景', 'pp-background', persona.background || '', '在该世界观下的身份与经历', false, true));

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn-glass btn-glass-primary';
    saveBtn.appendChild(MI.Components.buttonContent('floppy-disk', '保存人设'));
    saveBtn.addEventListener('click', function () {
      MI.Profile._savePersona(worldviewId);
    });
    scroll.appendChild(saveBtn);

    container.appendChild(scroll);
  },

  renderSettings: function (container) {
    var self = this;
    var config = MI.Storage.getConfig();

    container.classList.add('app-screen');
    container.appendChild(MI.Components.createNavBar('AI 助手设置', {
      showBack: true,
      onBack: function () { MI.Router.goBack(); }
    }));

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('settings-scroll');

    var hint = document.createElement('div');
    hint.className = 'form-hint';
    hint.textContent = 'AI 助手会话使用下方 API 配置。角色与服务号在各自编辑页选择 API。';
    scroll.appendChild(hint);

    scroll.appendChild(MI.Components.createProviderModelPicker(
      'cfg',
      config.aiApiProfileId || '',
      config.aiApiModel || ''
    ));

    var linkBtn = document.createElement('button');
    linkBtn.type = 'button';
    linkBtn.className = 'btn-glass btn-glass-secondary';
    linkBtn.appendChild(MI.Components.buttonContent('plug', '管理 API 配置库'));
    linkBtn.addEventListener('click', function () {
      MI.Router.navigateTo('api-profiles-list');
    });
    scroll.appendChild(linkBtn);

    scroll.appendChild(MI.Components.createInputField(
      'AI 助手人设', 'cfg-system-prompt',
      config.systemPrompt || '',
      '设定 AI 助手的行为', false, true
    ));

    scroll.appendChild(MI.Components.createDivider());

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn-glass btn-glass-primary';
    saveBtn.appendChild(MI.Components.buttonContent('floppy-disk', '保存设置'));
    saveBtn.addEventListener('click', function () { self._saveSettings(); });
    scroll.appendChild(saveBtn);

    var clearBtn = document.createElement('button');
    clearBtn.className = 'btn-glass btn-glass-danger';
    clearBtn.appendChild(MI.Components.buttonContent('trash', '清空所有数据'));
    clearBtn.addEventListener('click', function () {
      MI.Components.showConfirmDialog('清空所有数据', '确定要清空所有数据吗？此操作不可恢复！', function () {
        MI.Storage.clearAll();
        MI.Components.showAlertDialog('已清空', '数据已清空。页面将重新加载。', function () {
          location.reload();
        });
      }, null, { danger: true, confirmText: '清空' });
    });
    scroll.appendChild(clearBtn);

    container.appendChild(scroll);
  },

  _saveProfile: function () {
    var old = MI.Storage.getProfile();
    var profile = {
      name: document.getElementById('prof-name').value.trim() || '我',
      wechatId: document.getElementById('prof-wechat-id').value.trim() || 'my_wechat_id',
      avatar: document.getElementById('prof-avatar').value.trim() || '😊',
      region: document.getElementById('prof-region').value.trim() || '中国',
      whatsUp: document.getElementById('prof-whatsup').value.trim(),
      nickname: document.getElementById('prof-nickname').value.trim(),
      callName: document.getElementById('prof-call-name').value.trim(),
      birthday: document.getElementById('prof-birthday').value.trim(),
      likes: document.getElementById('prof-likes').value.trim(),
      personas: old.personas || {
        default: {
          appearance: '', personality: '', background: '',
          nickname: '', callName: '', birthday: '', likes: ''
        },
        byWorldview: {}
      }
    };
    MI.Storage.setProfile(profile);
    MI.Router.goBack();
  },

  _savePersona: function (worldviewId) {
    var data = {
      nickname: document.getElementById('pp-nickname').value.trim(),
      callName: document.getElementById('pp-call-name').value.trim(),
      birthday: document.getElementById('pp-birthday').value.trim(),
      likes: document.getElementById('pp-likes').value.trim(),
      appearance: document.getElementById('pp-appearance').value.trim(),
      personality: document.getElementById('pp-personality').value.trim(),
      background: document.getElementById('pp-background').value.trim()
    };

    var profile = MI.Storage.getProfile();
    if (!profile.personas) {
      profile.personas = { default: {}, byWorldview: {} };
    }
    if (!profile.personas.byWorldview) profile.personas.byWorldview = {};

    if (worldviewId) {
      profile.personas.byWorldview[worldviewId] = data;
    } else {
      profile.personas.default = data;
    }

    MI.Storage.setProfile(profile);
    MI.Router.goBack();
  },

  _saveSettings: function () {
    var profileId = document.getElementById('cfg-api-profile').value;
    var model = document.getElementById('cfg-api-model').value;
    if (!profileId) {
      MI.Components.showToast('请选择模型商 API');
      return;
    }
    if (!model) {
      MI.Components.showToast('请选择具体模型');
      return;
    }
    MI.Storage.setConfig({
      systemPrompt: document.getElementById('cfg-system-prompt').value.trim(),
      aiApiProfileId: profileId,
      aiApiModel: model
    });
    this._showToast('设置已保存');
  },

  _showStorageInfo: function () {
    var chats = MI.Storage.getChats();
    var contacts = MI.Storage.getContacts();
    var moments = MI.Storage.getMoments();
    var worldviews = MI.Storage.getWorldviews();
    var apiProfiles = MI.Storage.getApiProfiles();
    var totalChatMessages = 0;
    for (var i = 0; i < chats.length; i++) {
      totalChatMessages += chats[i].messages ? chats[i].messages.length : 0;
    }
    MI.Components.showAlertDialog('存储统计',
      '会话数：' + chats.length +
      '\n聊天消息：' + totalChatMessages +
      '\n联系人：' + contacts.length +
      '\nAPI 配置：' + apiProfiles.length +
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
