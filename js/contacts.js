/**
 * contacts.js — 通讯录（按分类分组）
 */
window.MI = window.MI || {};

MI.Contacts = {
  render: function (container) {
    container.innerHTML = '';

    var contacts = MI.Storage.getContacts();

    if (!contacts || contacts.length === 0) {
      var empty = MI.Components.createEmptyState('暂无角色\n点击微信右上角 ＋ 创建角色');
      container.appendChild(empty);
      return;
    }

    var groups = {};
    for (var i = 0; i < contacts.length; i++) {
      var cat = contacts[i].category || '未分类';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(contacts[i]);
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

      for (var j = 0; j < group.length; j++) {
        var contact = group[j];
        var row = this._createContactRow(contact);
        container.appendChild(row);
      }
    }
  },

  _createContactRow: function (contact) {
    var row = document.createElement('div');
    row.className = 'contact-row';

    var avatar = MI.Components.createAvatar(contact.avatar, 'normal');

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

    var editBtn = document.createElement('button');
    editBtn.className = 'contact-action-btn';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      MI.Router.navigateTo('character-edit', { contactId: contact.id });
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
