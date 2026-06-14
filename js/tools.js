/**
 * tools.js — 服务号（工具）创建与编辑
 */
window.MI = window.MI || {};

MI.Tools = {
  ICON_OPTIONS: [
    'language', 'code', 'robot', 'wand-magic-sparkles', 'book',
    'pen', 'calculator', 'magnifying-glass', 'brain', 'screwdriver-wrench',
    'chart-line', 'file-lines', 'microchip', 'comments', 'lightbulb'
  ],

  renderCreate: function (container) {
    this._renderForm(container, null);
  },

  renderEdit: function (container) {
    var params = MI.Router.currentParams || {};
    var contactId = params.contactId;
    var contact = contactId ? MI.Data.getContactById(contactId) : null;
    if (!contact || !MI.Data.isTool(contact)) {
      container.classList.add('app-screen');
      container.appendChild(MI.Components.createNavBar('编辑服务号', {
        showBack: true,
        onBack: function () { MI.Router.goBack(); }
      }));
      container.appendChild(MI.Components.createEmptyState('服务号不存在或已删除'));
      return;
    }
    this._renderForm(container, contact);
  },

  _renderForm: function (container, existing) {
    var isNew = !existing;
    var isBuiltin = existing && MI.Data.isBuiltinTool(existing.id);
    container.classList.add('app-screen');

    var navBar = MI.Components.createNavBar(isNew ? '创建服务号' : '编辑服务号', {
      showBack: true,
      onBack: function () { MI.Router.goBack(); }
    });
    container.appendChild(navBar);

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('settings-scroll');

    if (isBuiltin) {
      var hint = document.createElement('div');
      hint.className = 'form-hint';
      hint.textContent = '内置服务号可修改提示词和 API，不可删除。';
      scroll.appendChild(hint);
    }

    scroll.appendChild(this._createSectionTitle('基础信息'));
    scroll.appendChild(MI.Components.createInputField('名称', 'tool-name', existing ? existing.name : '', '如：AI 翻译官', false, false));
    scroll.appendChild(MI.Components.createInputField('微信号', 'tool-wechat-id', existing ? existing.wechatId : '', '唯一标识', false, false));
    scroll.appendChild(this._createAvatarSection(existing));

    scroll.appendChild(this._createSectionTitle('系统提示词'));
    scroll.appendChild(MI.Components.createInputField(
      'System Prompt',
      'tool-system-prompt',
      existing ? (existing.systemPrompt || '') : '',
      '定义该工具的人设、语气与任务指令…',
      false,
      true
    ));

    scroll.appendChild(this._createSectionTitle('API 配置'));
    var apiHint = document.createElement('div');
    apiHint.className = 'form-hint';
    apiHint.textContent = '从「我 → API 配置」中选择；未选则使用 AI 助手默认配置。';
    scroll.appendChild(apiHint);
    scroll.appendChild(MI.Components.createProviderModelPicker(
      'tool',
      existing ? existing.apiProfileId : '',
      existing ? existing.apiModel : '',
      '模型商 API（可选）',
      '模型（可选）'
    ));

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn-glass btn-glass-primary';
    saveBtn.appendChild(MI.Components.buttonContent('screwdriver-wrench', isNew ? '创建服务号' : '保存修改'));
    saveBtn.addEventListener('click', function () {
      MI.Tools._save(existing ? existing.id : null);
    });
    scroll.appendChild(saveBtn);

    if (!isNew) {
      var chatBtn = document.createElement('button');
      chatBtn.className = 'btn-glass btn-glass-secondary';
      chatBtn.appendChild(MI.Components.buttonContent('comment', '开始聊天'));
      chatBtn.addEventListener('click', function () {
        MI.Contacts.openChat(existing);
      });
      scroll.appendChild(chatBtn);

      if (!isBuiltin) {
        var delBtn = document.createElement('button');
        delBtn.className = 'btn-glass btn-glass-danger';
        delBtn.appendChild(MI.Components.buttonContent('trash', '删除服务号'));
        delBtn.addEventListener('click', function () {
          MI.Components.showConfirmDialog('删除服务号', '确定删除该服务号及其聊天记录？', function () {
            MI.Tools._delete(existing.id);
          }, null, { danger: true, confirmText: '删除' });
        });
        scroll.appendChild(delBtn);
      }
    }

    container.appendChild(scroll);
  },

  _createSectionTitle: function (text) {
    var el = document.createElement('div');
    el.className = 'form-section-title';
    el.textContent = text;
    return el;
  },

  _createAvatarSection: function (existing) {
    var wrap = document.createElement('div');
    var avatarVal = existing && existing.avatarMode === 'custom' ? existing.avatar : '🔧';
    wrap.appendChild(MI.Components.createAvatarPickerField('tool-avatar', avatarVal, ['🔧', '🌐', '💻', '📎', '✨', '🎯', '📊', '🛠️']));

    var modeHidden = document.createElement('input');
    modeHidden.type = 'hidden';
    modeHidden.id = 'tool-avatar-mode';
    modeHidden.value = existing && existing.avatarMode === 'custom' ? 'custom' : 'icon';
    wrap.appendChild(modeHidden);

    wrap.appendChild(this._createIconPicker(existing ? existing.avatarIcon : 'robot'));
    return wrap;
  },

  _createIconPicker: function (selectedIcon) {
    var self = this;
    var group = document.createElement('div');
    group.className = 'setting-group';

    var lbl = document.createElement('label');
    lbl.className = 'setting-label';
    lbl.textContent = '工具图标（未上传头像时使用）';
    group.appendChild(lbl);

    var preview = document.createElement('div');
    preview.className = 'avatar-picker-preview';
    preview.id = 'tool-icon-preview';
    group.appendChild(preview);

    var hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.id = 'tool-avatar-icon';
    hidden.value = selectedIcon || 'robot';
    group.appendChild(hidden);

    function refreshPreview() {
      preview.innerHTML = '';
      preview.appendChild(MI.Components.createToolAvatar(hidden.value, 'large'));
    }
    refreshPreview();

    var grid = document.createElement('div');
    grid.className = 'tool-icon-grid';
    for (var i = 0; i < this.ICON_OPTIONS.length; i++) {
      (function (iconName) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tool-icon-btn';
        if (iconName === hidden.value) btn.classList.add('selected');
        btn.appendChild(MI.Components.icon(iconName, 'tool-icon-btn-icon'));
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          hidden.value = iconName;
          var modeEl = document.getElementById('tool-avatar-mode');
          if (modeEl) modeEl.value = 'icon';
          refreshPreview();
          var all = grid.querySelectorAll('.tool-icon-btn');
          for (var j = 0; j < all.length; j++) all[j].classList.remove('selected');
          btn.classList.add('selected');
        });
        grid.appendChild(btn);
      })(this.ICON_OPTIONS[i]);
    }
    group.appendChild(grid);
    return group;
  },

  _resolveAvatarMode: function (avatar) {
    if (MI.Media && MI.Media.isImage(avatar)) return 'custom';
    if (avatar && avatar !== '🔧') return 'custom';
    var modeEl = document.getElementById('tool-avatar-mode');
    return modeEl && modeEl.value === 'icon' ? 'icon' : 'custom';
  },

  _collectForm: function () {
    var avatar = document.getElementById('tool-avatar').value || '🔧';
    return {
      name: document.getElementById('tool-name').value.trim(),
      wechatId: document.getElementById('tool-wechat-id').value.trim(),
      avatar: avatar,
      avatarMode: this._resolveAvatarMode(avatar),
      avatarIcon: document.getElementById('tool-avatar-icon').value || 'robot',
      systemPrompt: document.getElementById('tool-system-prompt').value.trim(),
      apiProfileId: document.getElementById('tool-api-profile').value || null,
      apiModel: document.getElementById('tool-api-model').value || null
    };
  },

  _save: function (contactId) {
    var data = this._collectForm();
    if (!data.name) { MI.Components.showToast('请填写名称'); return; }
    if (!data.systemPrompt) { MI.Components.showToast('请填写系统提示词'); return; }

    var contacts = MI.Storage.getContacts();

    if (contactId) {
      for (var i = 0; i < contacts.length; i++) {
        if (contacts[i].id === contactId) {
          contacts[i].type = 'tool';
          contacts[i].name = data.name;
          if (!MI.Data.isBuiltinTool(contactId)) {
            contacts[i].wechatId = data.wechatId || contacts[i].wechatId;
          }
          contacts[i].avatar = data.avatar;
          contacts[i].avatarMode = data.avatarMode;
          contacts[i].avatarIcon = data.avatarIcon;
          contacts[i].systemPrompt = data.systemPrompt;
          contacts[i].apiProfileId = data.apiProfileId;
          contacts[i].apiModel = data.apiModel;
          contacts[i].pinyin = MI.Data.toPinyin(data.name);
          break;
        }
      }
      MI.Storage.setContacts(contacts);
      this._syncChatMeta(contactId, data.name);
      this._syncChatDetailParams(contactId);
      MI.Router.goBack();
    } else {
      var newTool = {
        id: MI.Data.genId('tool'),
        type: 'tool',
        name: data.name,
        avatarIcon: data.avatarIcon,
        avatar: data.avatar,
        avatarMode: data.avatarMode,
        wechatId: data.wechatId || ('tool_' + Date.now()),
        pinyin: MI.Data.toPinyin(data.name),
        systemPrompt: data.systemPrompt,
        apiProfileId: data.apiProfileId,
        apiModel: data.apiModel,
        builtin: false
      };
      contacts.push(newTool);
      MI.Storage.setContacts(contacts);

      var chats = MI.Storage.getChats();
      chats.unshift({
        id: 'chat_' + newTool.id,
        contactId: newTool.id,
        messages: [],
        lastMessage: '你好，有什么可以帮你的？',
        lastMessageTime: Date.now(),
        unreadCount: 0
      });
      MI.Storage.setChats(chats);
      MI.Router.goBack();
    }
  },

  _syncChatMeta: function (contactId, name) {
    var contact = MI.Data.getContactById(contactId);
    var chats = MI.Storage.getChats();
    for (var i = 0; i < chats.length; i++) {
      if (chats[i].contactId === contactId) {
        chats[i].name = name;
      }
    }
    MI.Storage.setChats(chats);
  },

  _syncChatDetailParams: function (contactId) {
    var params = MI.Router.currentParams || {};
    var chatId = params.chatId;
    if (!chatId) chatId = MI.Router.resolveChatId({ contactId: contactId });
    if (!chatId) return;

    var prevIdx = MI.Router.stack.length - 2;
    if (prevIdx >= 0 && MI.Router.stack[prevIdx] === 'chat-detail') {
      MI.Router.paramStack[prevIdx] = { chatId: chatId, contactId: contactId };
    }
  },

  _delete: function (contactId) {
    if (MI.Data.isBuiltinTool(contactId)) {
      MI.Components.showToast('内置服务号不可删除');
      return;
    }

    var contacts = MI.Storage.getContacts();
    var filtered = [];
    for (var i = 0; i < contacts.length; i++) {
      if (contacts[i].id !== contactId) filtered.push(contacts[i]);
    }
    MI.Storage.setContacts(filtered);

    var chats = MI.Storage.getChats();
    var cFiltered = [];
    for (var j = 0; j < chats.length; j++) {
      if (chats[j].contactId !== contactId) cFiltered.push(chats[j]);
    }
    MI.Storage.setChats(cFiltered);
    MI.Router.goBack();
  }
};
