/**
 * characters.js — 角色（联系人）创建与编辑
 */
window.MI = window.MI || {};

MI.Characters = {
  EMOJI_OPTIONS: ['😊', '😎', '🌸', '🐱', '🐻', '🦊', '🦅', '🐰', '🐶', '🐼', '🦁', '🌻', '💫', '🎭', '👑', '⚔️', '🌙', '🔮'],

  renderCreate: function (container) {
    this._renderForm(container, null);
  },

  renderEdit: function (container) {
    var params = MI.Router.currentParams || {};
    var contactId = params.contactId;
    var contact = contactId ? MI.Data.getContactById(contactId) : null;
    if (!contact) {
      MI.Router.goBack();
      return;
    }
    this._renderForm(container, contact);
  },

  _renderForm: function (container, existing) {
    var isNew = !existing;
    container.classList.add('app-screen');

    var navBar = MI.Components.createNavBar(isNew ? '创建角色' : '编辑角色', {
      showBack: true,
      onBack: function () { MI.Router.goBack(); }
    });
    container.appendChild(navBar);

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('settings-scroll');

    var worldviews = MI.Storage.getWorldviews();
    if (worldviews.length === 0) {
      var warn = document.createElement('div');
      warn.className = 'form-hint form-hint-warn';
      warn.textContent = '请先创建世界观设定（我 → 世界观设定）';
      scroll.appendChild(warn);
    }

    scroll.appendChild(this._createSectionTitle('基础信息'));
    scroll.appendChild(MI.Components.createInputField('昵称', 'char-name', existing ? existing.name : '', '角色显示名称', false, false));
    scroll.appendChild(MI.Components.createInputField('微信号', 'char-wechat-id', existing ? existing.wechatId : '', '唯一标识', false, false));
    scroll.appendChild(MI.Components.createInputField('分类', 'char-category', existing ? (existing.category || '朋友') : '朋友', '如：朋友、恋人、同事', false, false));
    scroll.appendChild(this._createAvatarPicker(existing ? existing.avatar : '😊'));
    scroll.appendChild(this._createWorldviewSelect(worldviews, existing ? existing.worldviewId : ''));

    scroll.appendChild(this._createSectionTitle('角色人设'));
    var persona = existing && existing.persona ? existing.persona : {};
    scroll.appendChild(MI.Components.createInputField('外貌', 'char-appearance', persona.appearance || '', '描述外貌特征', false, true));
    scroll.appendChild(MI.Components.createInputField('发信息习惯', 'char-chat-style', persona.chatStyle || '', '如：爱用表情包、回复很快、喜欢发语音感的长文字', false, true));
    scroll.appendChild(MI.Components.createInputField('性格设定', 'char-personality', persona.personality || '', '性格、说话方式、情绪特点', false, true));
    scroll.appendChild(MI.Components.createInputField('个人背景', 'char-background', persona.background || '', '角色的身世、经历、与其他人的关系', false, true));

    scroll.appendChild(this._createSectionTitle('独立 API 配置'));
    var api = existing && existing.api ? existing.api : {};
    var providerBox = document.createElement('div');
    providerBox.id = 'char-provider-box';
    MI.Providers.renderSelector(providerBox, function (provider) {
      document.getElementById('char-api-url').value = provider.apiUrl;
      document.getElementById('char-api-model').value = provider.apiModel;
      if (document.getElementById('char-provider-id')) {
        document.getElementById('char-provider-id').value = provider.id;
      }
    });
    scroll.appendChild(providerBox);

    scroll.appendChild(MI.Components.createInputField('API URL', 'char-api-url', api.apiUrl || '', 'https://...', false, false));
    scroll.appendChild(MI.Components.createInputField('API Key', 'char-api-key', api.apiKey || '', 'sk-...', true, false));
    scroll.appendChild(MI.Components.createInputField('模型名称', 'char-api-model', api.apiModel || '', '如 deepseek-chat', false, false));

    var providerHidden = document.createElement('input');
    providerHidden.type = 'hidden';
    providerHidden.id = 'char-provider-id';
    providerHidden.value = api.providerId || '';
    scroll.appendChild(providerHidden);

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn-glass btn-glass-primary';
    saveBtn.textContent = isNew ? '✨ 创建角色' : '💾 保存修改';
    saveBtn.addEventListener('click', function () {
      MI.Characters._save(existing ? existing.id : null);
    });
    scroll.appendChild(saveBtn);

    if (!isNew) {
      var chatBtn = document.createElement('button');
      chatBtn.className = 'btn-glass btn-glass-secondary';
      chatBtn.textContent = '💬 开始聊天';
      chatBtn.addEventListener('click', function () {
        MI.Contacts.openChat(existing);
      });
      scroll.appendChild(chatBtn);

      var delBtn = document.createElement('button');
      delBtn.className = 'btn-glass btn-glass-danger';
      delBtn.textContent = '🗑️ 删除角色';
      delBtn.addEventListener('click', function () {
        if (confirm('确定删除该角色及其聊天记录？')) {
          MI.Characters._delete(existing.id);
        }
      });
      scroll.appendChild(delBtn);
    }

    container.appendChild(scroll);
  },

  _createSectionTitle: function (text) {
    var el = document.createElement('div');
    el.className = 'form-section-title';
    el.textContent = text;
    return el;
  },

  _createAvatarPicker: function (selected) {
    var group = document.createElement('div');
    group.className = 'setting-group';
    var lbl = document.createElement('label');
    lbl.className = 'setting-label';
    lbl.textContent = '头像';
    group.appendChild(lbl);

    var grid = document.createElement('div');
    grid.className = 'emoji-picker-grid';
    var hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.id = 'char-avatar';
    hidden.value = selected;

    for (var i = 0; i < this.EMOJI_OPTIONS.length; i++) {
      (function (emoji) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'emoji-picker-btn' + (emoji === selected ? ' selected' : '');
        btn.textContent = emoji;
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          hidden.value = emoji;
          var all = grid.querySelectorAll('.emoji-picker-btn');
          for (var j = 0; j < all.length; j++) all[j].classList.remove('selected');
          btn.classList.add('selected');
        });
        grid.appendChild(btn);
      })(this.EMOJI_OPTIONS[i]);
    }

    group.appendChild(grid);
    group.appendChild(hidden);
    return group;
  },

  _createWorldviewSelect: function (worldviews, selectedId) {
    var group = document.createElement('div');
    group.className = 'setting-group';
    var lbl = document.createElement('label');
    lbl.className = 'setting-label';
    lbl.textContent = '世界观';
    lbl.setAttribute('for', 'char-worldview');
    group.appendChild(lbl);

    var select = document.createElement('select');
    select.id = 'char-worldview';
    select.className = 'setting-input';

    var emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = '请选择世界观';
    select.appendChild(emptyOpt);

    for (var i = 0; i < worldviews.length; i++) {
      var opt = document.createElement('option');
      opt.value = worldviews[i].id;
      opt.textContent = worldviews[i].name;
      if (worldviews[i].id === selectedId) opt.selected = true;
      select.appendChild(opt);
    }

    group.appendChild(select);
    return group;
  },

  _collectForm: function () {
    return {
      name: document.getElementById('char-name').value.trim(),
      wechatId: document.getElementById('char-wechat-id').value.trim(),
      category: document.getElementById('char-category').value.trim() || '朋友',
      avatar: document.getElementById('char-avatar').value || '😊',
      worldviewId: document.getElementById('char-worldview').value,
      persona: {
        appearance: document.getElementById('char-appearance').value.trim(),
        chatStyle: document.getElementById('char-chat-style').value.trim(),
        personality: document.getElementById('char-personality').value.trim(),
        background: document.getElementById('char-background').value.trim()
      },
      api: {
        providerId: document.getElementById('char-provider-id').value,
        apiUrl: document.getElementById('char-api-url').value.trim(),
        apiKey: document.getElementById('char-api-key').value.trim(),
        apiModel: document.getElementById('char-api-model').value.trim()
      }
    };
  },

  _save: function (contactId) {
    var data = this._collectForm();
    if (!data.name) { alert('请填写昵称'); return; }
    if (!data.worldviewId) { alert('请选择世界观'); return; }
    if (!data.api.apiUrl || !data.api.apiKey || !data.api.apiModel) {
      alert('请完整填写该角色的 API 配置');
      return;
    }

    var contacts = MI.Storage.getContacts();

    if (contactId) {
      for (var i = 0; i < contacts.length; i++) {
        if (contacts[i].id === contactId) {
          contacts[i].name = data.name;
          contacts[i].wechatId = data.wechatId || contacts[i].wechatId;
          contacts[i].category = data.category;
          contacts[i].avatar = data.avatar;
          contacts[i].worldviewId = data.worldviewId;
          contacts[i].persona = data.persona;
          contacts[i].api = data.api;
          contacts[i].pinyin = MI.Data.toPinyin(data.name);
          break;
        }
      }
      MI.Storage.setContacts(contacts);
      this._syncChatMeta(contactId, data.name, data.avatar);
      MI.Router.goBack();
    } else {
      var newContact = {
        id: MI.Data.genId('char'),
        name: data.name,
        avatar: data.avatar,
        wechatId: data.wechatId || ('wx_' + Date.now()),
        pinyin: MI.Data.toPinyin(data.name),
        worldviewId: data.worldviewId,
        category: data.category,
        persona: data.persona,
        api: data.api
      };
      contacts.push(newContact);
      MI.Storage.setContacts(contacts);

      var chats = MI.Storage.getChats();
      chats.push({
        id: 'chat_' + newContact.id,
        contactId: newContact.id,
        messages: [],
        lastMessage: '',
        lastMessageTime: Date.now(),
        unreadCount: 0
      });
      MI.Storage.setChats(chats);
      MI.Router.goBack();
    }
  },

  _syncChatMeta: function (contactId, name, avatar) {
    var chats = MI.Storage.getChats();
    for (var i = 0; i < chats.length; i++) {
      if (chats[i].contactId === contactId) {
        chats[i].name = name;
        chats[i].avatar = avatar;
      }
    }
    MI.Storage.setChats(chats);
  },

  _delete: function (contactId) {
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

    var moments = MI.Storage.getMoments();
    var mFiltered = [];
    for (var k = 0; k < moments.length; k++) {
      if (moments[k].authorId !== contactId) mFiltered.push(moments[k]);
    }
    MI.Storage.setMoments(mFiltered);

    MI.Router.goBack();
  }
};
