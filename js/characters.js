/**
 * characters.js — 角色（联系人）创建、编辑、资料页、聊天设置
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
    if (!contact || MI.Data.isTool(contact)) {
      container.classList.add('app-screen');
      container.appendChild(MI.Components.createNavBar('编辑角色', {
        showBack: true,
        onBack: function () { MI.Router.goBack(); }
      }));
      container.appendChild(MI.Components.createEmptyState('角色不存在或已删除'));
      return;
    }
    this._renderForm(container, contact);
  },

  renderProfile: function (container) {
    var params = MI.Router.currentParams || {};
    var contact = params.contactId ? MI.Data.getContactById(params.contactId) : null;
    if (!contact || !MI.Data.isCharacter(contact)) {
      container.classList.add('app-screen');
      container.appendChild(MI.Components.createNavBar('角色资料', {
        showBack: true,
        onBack: function () { MI.Router.goBack(); }
      }));
      container.appendChild(MI.Components.createEmptyState('角色不存在'));
      return;
    }

    var details = MI.ChatEngine.getContactDetails(contact);
    var settings = MI.ChatEngine.getChatSettings(contact);
    var persona = contact.persona || {};
    var wv = MI.Storage.getWorldviewById(contact.worldviewId);

    container.classList.add('app-screen');

    container.appendChild(MI.Components.createNavBar('详细资料', {
      showBack: true,
      onBack: function () { MI.Router.goBack(); },
      rightIcon: 'pen',
      onRight: function () {
        MI.Router.navigateTo('character-edit', {
          contactId: contact.id,
          chatId: params.chatId || null
        });
      }
    }));

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('settings-scroll');

    scroll.appendChild(MI.Components.createProfileHeader(
      contact.avatar,
      contact.name,
      wv ? wv.name : '未绑定世界观'
    ));

    scroll.appendChild(this._createSectionTitle('基本信息'));
    scroll.appendChild(MI.Components.createDetailRow('昵称', contact.name));
    scroll.appendChild(MI.Components.createDetailRow('小名/昵称', details.nickname));
    scroll.appendChild(MI.Components.createDetailRow('对我的称呼', details.callName));
    scroll.appendChild(MI.Components.createDetailRow('微信号', contact.wechatId));
    scroll.appendChild(MI.Components.createDetailRow('分类', contact.category || '朋友'));
    scroll.appendChild(MI.Components.createDetailRow('生日', details.birthday));
    scroll.appendChild(MI.Components.createDetailRow('喜好', details.likes));

    scroll.appendChild(this._createSectionTitle('角色人设'));
    scroll.appendChild(MI.Components.createDetailRow('外貌', persona.appearance));
    scroll.appendChild(MI.Components.createDetailRow('性格', persona.personality));
    scroll.appendChild(MI.Components.createDetailRow('发信息习惯', persona.chatStyle));
    scroll.appendChild(MI.Components.createDetailRow('个人背景', persona.background));

    scroll.appendChild(this._createSectionTitle('聊天设置'));
    scroll.appendChild(MI.Components.createDetailRow('关系', MI.ChatEngine.getRelationshipLabel(settings.relationship)));
    scroll.appendChild(MI.Components.createDetailRow('聊天模式', this._chatModeLabel(settings.chatMode)));
    scroll.appendChild(MI.Components.createDetailRow('聊天效果', this._chatEffectLabel(settings.chatEffect)));
    scroll.appendChild(MI.Components.createDetailRow('文字语言', this._languageLabel(settings.language)));

    var chatSettingsBtn = document.createElement('button');
    chatSettingsBtn.type = 'button';
    chatSettingsBtn.className = 'btn-glass btn-glass-secondary';
    chatSettingsBtn.appendChild(MI.Components.buttonContent('sliders', '修改聊天设置'));
    chatSettingsBtn.addEventListener('click', function () {
      MI.Router.navigateTo('character-chat-settings', {
        contactId: contact.id,
        chatId: params.chatId || null
      });
    });
    scroll.appendChild(chatSettingsBtn);

    var ms = MI.MomentEngine.getMomentSettings(contact);
    var momentCount = MI.Moments.countByAuthor(contact.id);
    scroll.appendChild(this._createSectionTitle('朋友圈'));
    scroll.appendChild(MI.Components.createDetailRow('已发布', momentCount + ' 条'));

    var viewMomentsBtn = document.createElement('button');
    viewMomentsBtn.type = 'button';
    viewMomentsBtn.className = 'btn-glass btn-glass-secondary';
    viewMomentsBtn.appendChild(MI.Components.buttonContent('images', '查看朋友圈'));
    viewMomentsBtn.addEventListener('click', function () {
      MI.Router.navigateTo('moment-author', {
        authorId: contact.id,
        contactId: contact.id,
        chatId: params.chatId || null
      });
    });
    scroll.appendChild(viewMomentsBtn);

    scroll.appendChild(this._createSectionTitle('朋友圈设置'));
    scroll.appendChild(MI.Components.createDetailRow('发布频率', MI.MomentEngine.getFrequencyLabel(ms.frequency)));
    scroll.appendChild(MI.Components.createDetailRow('内容来源', MI.MomentEngine.getSourceLabel(ms.source)));
    scroll.appendChild(MI.Components.createDetailRow('发布风格', ms.style || '未设置'));

    var momentSettingsBtn = document.createElement('button');
    momentSettingsBtn.type = 'button';
    momentSettingsBtn.className = 'btn-glass btn-glass-secondary';
    momentSettingsBtn.appendChild(MI.Components.buttonContent('images', '修改朋友圈设置'));
    momentSettingsBtn.addEventListener('click', function () {
      MI.Router.navigateTo('character-moment-settings', {
        contactId: contact.id,
        chatId: params.chatId || null
      });
    });
    scroll.appendChild(momentSettingsBtn);

    var chatBtn = document.createElement('button');
    chatBtn.className = 'btn-glass btn-glass-primary';
    chatBtn.appendChild(MI.Components.buttonContent('comment', '发消息'));
    chatBtn.addEventListener('click', function () {
      MI.Contacts.openChat(contact);
    });
    scroll.appendChild(chatBtn);

    container.appendChild(scroll);
  },

  renderChatSettings: function (container) {
    var params = MI.Router.currentParams || {};
    var contact = params.contactId ? MI.Data.getContactById(params.contactId) : null;
    if (!contact || !MI.Data.isCharacter(contact)) {
      container.classList.add('app-screen');
      container.appendChild(MI.Components.createNavBar('聊天设置', {
        showBack: true,
        onBack: function () { MI.Router.goBack(); }
      }));
      container.appendChild(MI.Components.createEmptyState('角色不存在'));
      return;
    }

    var settings = MI.ChatEngine.getChatSettings(contact);
    container.classList.add('app-screen');

    container.appendChild(MI.Components.createNavBar('聊天设置 · ' + contact.name, {
      showBack: true,
      onBack: function () { MI.Router.goBack(); }
    }));

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('settings-scroll');

    var hint = document.createElement('div');
    hint.className = 'form-hint';
    hint.textContent = '这些设置影响该角色的对话风格与消息展示方式。';
    scroll.appendChild(hint);

    scroll.appendChild(MI.Components.createSelectField(
      '关系', 'cs-relationship',
      MI.ChatEngine.RELATIONSHIP_OPTIONS,
      settings.relationship || 'friend'
    ));

    scroll.appendChild(MI.Components.createSelectField('聊天模式', 'cs-chat-mode', [
      { value: 'real', label: '真实模式（只输出对话，多段文字）' },
      { value: 'action', label: '动作描写模式（动作+对话，多段文字）' }
    ], settings.chatMode));

    scroll.appendChild(MI.Components.createSelectField('聊天效果', 'cs-chat-effect', [
      { value: 'sentence', label: '分句输出（多段气泡）' },
      { value: 'paragraph', label: '段落输出（整段一条）' },
      { value: 'immersive', label: '沉浸模式（每次仅一句话）' }
    ], settings.chatEffect));

    scroll.appendChild(MI.Components.createSelectField('文字语言', 'cs-language', [
      { value: 'zh', label: '简体中文' },
      { value: 'zh-tw', label: '繁体中文' },
      { value: 'en', label: 'English' },
      { value: 'ja', label: '日本語' },
      { value: 'ko', label: '한국어' },
      { value: 'auto', label: '跟随对话语言' }
    ], settings.language));

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn-glass btn-glass-primary';
    saveBtn.appendChild(MI.Components.buttonContent('floppy-disk', '保存聊天设置'));
    saveBtn.addEventListener('click', function () {
      MI.Characters._saveChatSettings(contact.id);
    });
    scroll.appendChild(saveBtn);

    container.appendChild(scroll);
  },

  renderMomentSettings: function (container) {
    var params = MI.Router.currentParams || {};
    var contact = params.contactId ? MI.Data.getContactById(params.contactId) : null;
    if (!contact || !MI.Data.isCharacter(contact)) {
      container.classList.add('app-screen');
      container.appendChild(MI.Components.createNavBar('朋友圈设置', {
        showBack: true,
        onBack: function () { MI.Router.goBack(); }
      }));
      container.appendChild(MI.Components.createEmptyState('角色不存在'));
      return;
    }

    var ms = MI.MomentEngine.getMomentSettings(contact);
    container.classList.add('app-screen');

    container.appendChild(MI.Components.createNavBar('朋友圈设置 · ' + contact.name, {
      showBack: true,
      onBack: function () { MI.Router.goBack(); }
    }));

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('settings-scroll');

    var hint = document.createElement('div');
    hint.className = 'form-hint';
    hint.textContent = '控制该角色发朋友圈的频率、风格与内容来源。对话中可用 <<MOMENT>> 标签同时发圈。';
    scroll.appendChild(hint);

    scroll.appendChild(MI.Components.createSelectField(
      '发布频率', 'ms-frequency',
      MI.MomentEngine.FREQUENCY_OPTIONS,
      ms.frequency
    ));

    scroll.appendChild(MI.Components.createSelectField(
      '内容来源', 'ms-source',
      MI.MomentEngine.SOURCE_OPTIONS,
      ms.source
    ));

    scroll.appendChild(MI.Components.createInputField(
      '发布风格', 'ms-style', ms.style,
      '如：文艺短句、沙雕日常、恋爱甜蜜、工作吐槽…', false, true
    ));

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn-glass btn-glass-primary';
    saveBtn.appendChild(MI.Components.buttonContent('floppy-disk', '保存朋友圈设置'));
    saveBtn.addEventListener('click', function () {
      MI.Characters._saveMomentSettings(contact.id);
    });
    scroll.appendChild(saveBtn);

    container.appendChild(scroll);
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

    var details = existing ? MI.ChatEngine.getContactDetails(existing) : MI.ChatEngine.getDefaultDetails();

    scroll.appendChild(this._createSectionTitle('基础信息'));
    scroll.appendChild(MI.Components.createInputField('昵称', 'char-name', existing ? existing.name : '', '角色显示名称', false, false));
    scroll.appendChild(MI.Components.createInputField('小名/昵称', 'char-nickname', details.nickname, '角色的日常称呼', false, false));
    scroll.appendChild(MI.Components.createInputField('对我的称呼', 'char-call-name', details.callName, '如：小明、哥哥', false, false));
    scroll.appendChild(MI.Components.createInputField('微信号', 'char-wechat-id', existing ? existing.wechatId : '', '唯一标识', false, false));
    scroll.appendChild(MI.Components.createInputField('分类', 'char-category', existing ? (existing.category || '朋友') : '朋友', '如：朋友、恋人、同事', false, false));
    scroll.appendChild(MI.Components.createInputField('生日', 'char-birthday', details.birthday, '如：3月15日', false, false));
    scroll.appendChild(MI.Components.createInputField('喜好', 'char-likes', details.likes, '爱好、喜欢的事物', false, true));
    scroll.appendChild(MI.Components.createAvatarPickerField('char-avatar', existing ? existing.avatar : '😊', this.EMOJI_OPTIONS));
    scroll.appendChild(this._createWorldviewSelect(worldviews, existing ? existing.worldviewId : ''));

    scroll.appendChild(this._createSectionTitle('角色人设'));
    var persona = existing && existing.persona ? existing.persona : {};
    scroll.appendChild(MI.Components.createInputField('外貌', 'char-appearance', persona.appearance || '', '描述外貌特征', false, true));
    scroll.appendChild(MI.Components.createInputField('发信息习惯', 'char-chat-style', persona.chatStyle || '', '如：爱用表情包、回复很快', false, true));
    scroll.appendChild(MI.Components.createInputField('性格设定', 'char-personality', persona.personality || '', '性格、说话方式、情绪特点', false, true));
    scroll.appendChild(MI.Components.createInputField('个人背景', 'char-background', persona.background || '', '角色的身世、经历、与其他人的关系', false, true));

    scroll.appendChild(this._createSectionTitle('对话 API'));
    scroll.appendChild(MI.Components.createProviderModelPicker(
      'char',
      existing ? existing.apiProfileId : '',
      existing ? existing.apiModel : ''
    ));
    scroll.appendChild(MI.Components.createCheckboxField(
      'char-use-player-persona',
      '在对话中注入「我的人设」（对应该角色世界观）',
      existing ? !!existing.usePlayerPersona : false
    ));
    var personaHint = document.createElement('div');
    personaHint.className = 'form-hint';
    personaHint.textContent = '开启后，角色将知晓你在该世界观下设定的人设。可在「我 → 人设管理」中编辑。';
    scroll.appendChild(personaHint);

    if (!isNew) {
      scroll.appendChild(this._createSectionTitle('聊天设置'));
      var chatLinkBtn = document.createElement('button');
      chatLinkBtn.type = 'button';
      chatLinkBtn.className = 'btn-glass btn-glass-secondary';
      chatLinkBtn.appendChild(MI.Components.buttonContent('sliders', '打开聊天设置'));
      chatLinkBtn.addEventListener('click', function () {
        MI.Router.navigateTo('character-chat-settings', {
          contactId: existing.id,
          chatId: (MI.Router.currentParams || {}).chatId || null
        });
      });
      scroll.appendChild(chatLinkBtn);

      var profileLinkBtn = document.createElement('button');
      profileLinkBtn.type = 'button';
      profileLinkBtn.className = 'btn-glass btn-glass-secondary';
      profileLinkBtn.appendChild(MI.Components.buttonContent('id-card', '查看详细资料'));
      profileLinkBtn.addEventListener('click', function () {
        MI.Router.navigateTo('character-profile', {
          contactId: existing.id,
          chatId: (MI.Router.currentParams || {}).chatId || null
        });
      });
      scroll.appendChild(profileLinkBtn);

      var momentLinkBtn = document.createElement('button');
      momentLinkBtn.type = 'button';
      momentLinkBtn.className = 'btn-glass btn-glass-secondary';
      momentLinkBtn.appendChild(MI.Components.buttonContent('images', '查看朋友圈'));
      momentLinkBtn.addEventListener('click', function () {
        MI.Router.navigateTo('moment-author', {
          authorId: existing.id,
          contactId: existing.id,
          chatId: (MI.Router.currentParams || {}).chatId || null
        });
      });
      scroll.appendChild(momentLinkBtn);

      var momentSettingsLinkBtn = document.createElement('button');
      momentSettingsLinkBtn.type = 'button';
      momentSettingsLinkBtn.className = 'btn-glass btn-glass-secondary';
      momentSettingsLinkBtn.appendChild(MI.Components.buttonContent('sliders', '朋友圈设置'));
      momentSettingsLinkBtn.addEventListener('click', function () {
        MI.Router.navigateTo('character-moment-settings', {
          contactId: existing.id,
          chatId: (MI.Router.currentParams || {}).chatId || null
        });
      });
      scroll.appendChild(momentSettingsLinkBtn);
    }

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn-glass btn-glass-primary';
    saveBtn.appendChild(MI.Components.buttonContent('wand-magic-sparkles', isNew ? '创建角色' : '保存修改'));
    saveBtn.addEventListener('click', function () {
      MI.Characters._save(existing ? existing.id : null);
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

      var delBtn = document.createElement('button');
      delBtn.className = 'btn-glass btn-glass-danger';
      delBtn.appendChild(MI.Components.buttonContent('trash', '删除角色'));
      delBtn.addEventListener('click', function () {
        MI.Components.showConfirmDialog('删除角色', '确定删除该角色及其聊天记录？', function () {
          MI.Characters._delete(existing.id);
        }, null, { danger: true, confirmText: '删除' });
      });
      scroll.appendChild(delBtn);
    }

    container.appendChild(scroll);
  },

  _chatModeLabel: function (mode) {
    if (mode === 'action') return '动作描写模式（多段）';
    return '真实模式（多段对话）';
  },

  _chatEffectLabel: function (effect) {
    if (effect === 'paragraph') return '段落输出';
    if (effect === 'immersive') return '沉浸模式（每次一句话）';
    return '分句输出';
  },

  _languageLabel: function (lang) {
    return MI.ChatEngine.LANGUAGE_LABELS[lang] || lang || '简体中文';
  },

  _createSectionTitle: function (text) {
    var el = document.createElement('div');
    el.className = 'form-section-title';
    el.textContent = text;
    return el;
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
      details: {
        nickname: document.getElementById('char-nickname').value.trim(),
        callName: document.getElementById('char-call-name').value.trim(),
        birthday: document.getElementById('char-birthday').value.trim(),
        likes: document.getElementById('char-likes').value.trim()
      },
      persona: {
        appearance: document.getElementById('char-appearance').value.trim(),
        chatStyle: document.getElementById('char-chat-style').value.trim(),
        personality: document.getElementById('char-personality').value.trim(),
        background: document.getElementById('char-background').value.trim()
      },
      apiProfileId: document.getElementById('char-api-profile').value,
      apiModel: document.getElementById('char-api-model').value,
      usePlayerPersona: document.getElementById('char-use-player-persona').checked
    };
  },

  _saveMomentSettings: function (contactId) {
    var contacts = MI.Storage.getContacts();
    for (var i = 0; i < contacts.length; i++) {
      if (contacts[i].id !== contactId) continue;
      contacts[i].momentSettings = {
        frequency: document.getElementById('ms-frequency').value,
        source: document.getElementById('ms-source').value,
        style: document.getElementById('ms-style').value.trim()
      };
      break;
    }
    MI.Storage.setContacts(contacts);
    MI.Router.goBack();
  },

  _saveChatSettings: function (contactId) {
    var contacts = MI.Storage.getContacts();
    for (var i = 0; i < contacts.length; i++) {
      if (contacts[i].id !== contactId) continue;
      contacts[i].chatSettings = {
        relationship: document.getElementById('cs-relationship').value || 'friend',
        chatMode: document.getElementById('cs-chat-mode').value,
        chatEffect: document.getElementById('cs-chat-effect').value,
        language: document.getElementById('cs-language').value
      };
      break;
    }
    MI.Storage.setContacts(contacts);
    MI.Router.goBack();
  },

  _save: function (contactId) {
    var data = this._collectForm();
    if (!data.name) { MI.Components.showToast('请填写昵称'); return; }
    if (!data.worldviewId) { MI.Components.showToast('请选择世界观'); return; }
    if (!data.apiProfileId) {
      MI.Components.showToast('请选择模型商 API（请先在「我 → API 配置」中添加）');
      return;
    }
    if (!data.apiModel) {
      MI.Components.showToast('请选择具体模型');
      return;
    }

    var contacts = MI.Storage.getContacts();

    if (contactId) {
      for (var i = 0; i < contacts.length; i++) {
        if (contacts[i].id === contactId) {
          contacts[i].type = 'character';
          contacts[i].name = data.name;
          contacts[i].wechatId = data.wechatId || contacts[i].wechatId;
          contacts[i].category = data.category;
          contacts[i].avatar = data.avatar;
          contacts[i].worldviewId = data.worldviewId;
          contacts[i].details = data.details;
          contacts[i].persona = data.persona;
          contacts[i].apiProfileId = data.apiProfileId;
          contacts[i].apiModel = data.apiModel;
          contacts[i].usePlayerPersona = data.usePlayerPersona;
          if (!contacts[i].chatSettings) {
            contacts[i].chatSettings = MI.ChatEngine.getDefaultChatSettings();
          }
          if (!contacts[i].momentSettings) {
            contacts[i].momentSettings = MI.MomentEngine.getDefaultMomentSettings();
          }
          contacts[i].pinyin = MI.Data.toPinyin(data.name);
          break;
        }
      }
      MI.Storage.setContacts(contacts);
      this._syncChatMeta(contactId, data.name, data.avatar);
      this._syncChatDetailParams(contactId);
      MI.Router.goBack();
    } else {
      var newContact = {
        id: MI.Data.genId('char'),
        type: 'character',
        name: data.name,
        avatar: data.avatar,
        wechatId: data.wechatId || ('wx_' + Date.now()),
        pinyin: MI.Data.toPinyin(data.name),
        worldviewId: data.worldviewId,
        category: data.category,
        details: data.details,
        persona: data.persona,
        apiProfileId: data.apiProfileId,
        apiModel: data.apiModel,
        usePlayerPersona: data.usePlayerPersona,
        chatSettings: MI.ChatEngine.getDefaultChatSettings(),
        momentSettings: MI.MomentEngine.getDefaultMomentSettings(),
        momentsCover: ''
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

  _syncChatDetailParams: function (contactId) {
    var params = MI.Router.currentParams || {};
    var chatId = params.chatId;
    if (!chatId) {
      chatId = MI.Router.resolveChatId({ contactId: contactId });
    }
    if (!chatId) return;

    var prevIdx = MI.Router.stack.length - 2;
    if (prevIdx >= 0 && MI.Router.stack[prevIdx] === 'chat-detail') {
      MI.Router.paramStack[prevIdx] = {
        chatId: chatId,
        contactId: contactId
      };
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

    var moments = MI.Storage.getMoments();
    var mFiltered = [];
    for (var k = 0; k < moments.length; k++) {
      if (moments[k].authorId !== contactId) mFiltered.push(moments[k]);
    }
    MI.Storage.setMoments(mFiltered);

    MI.Router.goBack();
  }
};
