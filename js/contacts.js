/**
 * contacts.js — 通讯录（服务号 + 角色分类）
 */
window.MI = window.MI || {};

MI.Contacts = {
  render: function (container) {
    container.innerHTML = '';

    var contacts = MI.Storage.getContacts();
    var tools = [];
    var characters = [];

    for (var i = 0; i < contacts.length; i++) {
      if (MI.Data.isTool(contacts[i])) {
        tools.push(contacts[i]);
      } else {
        characters.push(contacts[i]);
      }
    }

    if (tools.length === 0 && characters.length === 0) {
      container.appendChild(MI.Components.createEmptyState('暂无联系人\n点击右上角 ＋ 创建角色或服务号'));
      return;
    }

    var toolHeaderRow = document.createElement('div');
    toolHeaderRow.className = 'contact-section-header-row';

    var toolHeader = document.createElement('div');
    toolHeader.className = 'contact-section-header contact-section-header-tool';
    toolHeader.textContent = '服务号 (' + tools.length + ')';

    var addToolBtn = document.createElement('button');
    addToolBtn.type = 'button';
    addToolBtn.className = 'contact-section-add-btn';
    addToolBtn.appendChild(MI.Components.buttonContent('plus', '新建'));
    addToolBtn.addEventListener('click', function (e) {
      e.preventDefault();
      MI.Router.navigateTo('tool-create');
    });

    toolHeaderRow.appendChild(toolHeader);
    toolHeaderRow.appendChild(addToolBtn);
    container.appendChild(toolHeaderRow);

    if (tools.length === 0) {
      container.appendChild(MI.Components.createEmptyState('暂无服务号\n点击「新建」添加工具'));
    } else {
      tools.sort(function (a, b) {
        return (a.pinyin || a.name).localeCompare(b.pinyin || b.name, 'zh');
      });
      for (var t = 0; t < tools.length; t++) {
        container.appendChild(this._createToolRow(tools[t]));
      }
    }

    if (characters.length === 0) return;

    var groups = {};
    for (var j = 0; j < characters.length; j++) {
      var cat = characters[j].category || '未分类';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(characters[j]);
    }

    var catKeys = Object.keys(groups).sort();

    for (var g = 0; g < catKeys.length; g++) {
      var category = catKeys[g];
      var group = groups[category];

      group.sort(function (a, b) {
        return (a.pinyin || a.name).localeCompare(b.pinyin || b.name, 'zh');
      });

      var header = document.createElement('div');
      header.className = 'contact-section-header';
      header.textContent = category + ' (' + group.length + ')';
      container.appendChild(header);

      for (var k = 0; k < group.length; k++) {
        container.appendChild(this._createCharacterRow(group[k]));
      }
    }
  },

  _createToolRow: function (contact) {
    var row = document.createElement('div');
    row.className = 'contact-row contact-row-tool';

    var avatar = MI.Components.createAvatar(contact.avatar, 'normal', contact);

    var info = document.createElement('div');
    info.className = 'contact-info';

    var name = document.createElement('div');
    name.className = 'contact-name';
    name.textContent = contact.name;

    var sub = document.createElement('div');
    sub.className = 'contact-sub contact-sub-tool';
    if (MI.Data.isBuiltinTool(contact.id)) {
      sub.textContent = '内置工具';
    } else if (contact.apiProfileId) {
      var ap = MI.Storage.getApiProfileById(contact.apiProfileId);
      var modelLabel = contact.apiModel || (ap && ap.enabledModels && ap.enabledModels[0]) || '';
      sub.textContent = ap ? (ap.name + (modelLabel ? ' · ' + modelLabel : '')) : '自定义工具';
    } else {
      sub.textContent = '自定义 · 默认 API';
    }

    info.appendChild(name);
    info.appendChild(sub);

    var actions = document.createElement('div');
    actions.className = 'contact-row-actions';

    var editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'contact-action-btn';
    editBtn.appendChild(MI.Components.buttonContent('pen', '编辑'));
    editBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      MI.Router.navigateTo('tool-edit', { contactId: contact.id });
    });
    actions.appendChild(editBtn);

    row.appendChild(avatar);
    row.appendChild(info);
    row.appendChild(actions);

    row.addEventListener('click', function (e) {
      e.preventDefault();
      MI.Contacts.openChat(contact);
    });

    return row;
  },

  _createCharacterRow: function (contact) {
    var row = document.createElement('div');
    row.className = 'contact-row';

    var avatar = MI.Components.createAvatar(contact.avatar, 'normal', contact);

    var info = document.createElement('div');
    info.className = 'contact-info';

    var name = document.createElement('div');
    name.className = 'contact-name';
    name.textContent = contact.name;

    var wv = MI.Storage.getWorldviewById(contact.worldviewId);
    var sub = document.createElement('div');
    sub.className = 'contact-sub';
    sub.textContent = wv ? wv.name : '未绑定世界观';

    info.appendChild(name);
    info.appendChild(sub);

    var actions = document.createElement('div');
    actions.className = 'contact-row-actions';

    var profileBtn = document.createElement('button');
    profileBtn.type = 'button';
    profileBtn.className = 'contact-action-btn';
    profileBtn.appendChild(MI.Components.buttonContent('id-card', '资料'));
    profileBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      MI.Router.navigateTo('character-profile', { contactId: contact.id });
    });

    var editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'contact-action-btn';
    editBtn.appendChild(MI.Components.buttonContent('pen', '编辑'));
    editBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      MI.Router.navigateTo('character-edit', { contactId: contact.id });
    });

    actions.appendChild(profileBtn);
    actions.appendChild(editBtn);

    row.appendChild(avatar);
    row.appendChild(info);
    row.appendChild(actions);

    row.addEventListener('click', function (e) {
      e.preventDefault();
      MI.Contacts.openChat(contact);
    });

    return row;
  },

  openChat: function (contact) {
    var chats = MI.Storage.getChats();
    var existingChat = null;
    for (var i = 0; i < chats.length; i++) {
      if (chats[i].contactId === contact.id) {
        existingChat = chats[i];
        break;
      }
    }

    if (!existingChat) {
      existingChat = {
        id: 'chat_' + contact.id,
        contactId: contact.id,
        messages: [],
        lastMessage: '',
        lastMessageTime: Date.now(),
        unreadCount: 0
      };
      chats.push(existingChat);
      MI.Storage.setChats(chats);
    }

    MI.Router.navigateTo('chat-detail', { chatId: existingChat.id });
  }
};
