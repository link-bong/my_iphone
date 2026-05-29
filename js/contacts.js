/**
 * contacts.js — 通讯录页面
 * 联系人按拼音首字母分组显示
 */
window.MI = window.MI || {};

MI.Contacts = {
  /**
   * 渲染通讯录
   */
  render: function (container) {
    container.innerHTML = '';

    var contacts = MI.Storage.getContacts();

    if (!contacts || contacts.length === 0) {
      var empty = MI.Components.createEmptyState('暂无联系人');
      empty.style.cssText += 'text-align:center;padding:60px 20px;color:#8E8E93;font-size:15px;';
      container.appendChild(empty);
      return;
    }

    // 按拼音排序
    contacts.sort(function (a, b) {
      return (a.pinyin || a.name).localeCompare(b.pinyin || b.name, 'zh');
    });

    // 按首字母分组
    var groups = {};
    for (var i = 0; i < contacts.length; i++) {
      var py = contacts[i].pinyin || contacts[i].name;
      var firstLetter = py.charAt(0).toUpperCase();
      // 非字母归入 #
      if (!/[A-Z]/.test(firstLetter)) {
        firstLetter = '#';
      }
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(contacts[i]);
    }

    // 排序分组键
    var groupKeys = Object.keys(groups).sort();
    // 把 # 放最后
    if (groupKeys.indexOf('#') >= 0) {
      groupKeys.splice(groupKeys.indexOf('#'), 1);
      groupKeys.push('#');
    }

    var self = this;

    for (var g = 0; g < groupKeys.length; g++) {
      var letter = groupKeys[g];
      var group = groups[letter];

      // 分组标题
      var header = document.createElement('div');
      header.className = 'contact-section-header';
      header.textContent = letter;
      container.appendChild(header);

      for (var j = 0; j < group.length; j++) {
        var contact = group[j];
        var row = MI.Components.createContactRow(contact, function (c) {
          MI.Contacts._onContactClick(c);
        });
        container.appendChild(row);
      }
    }
  },

  /**
   * 点击联系人：查找或创建对话
   */
  _onContactClick: function (contact) {
    var chats = MI.Storage.getChats();

    // 查找是否已有与该联系人的对话
    var existingChat = null;
    for (var i = 0; i < chats.length; i++) {
      if (chats[i].contactId === contact.id) {
        existingChat = chats[i];
        break;
      }
    }

    if (!existingChat) {
      // 创建新对话
      existingChat = {
        id: 'chat_' + contact.id + '_' + Date.now(),
        contactId: contact.id,
        messages: [],
        lastMessage: '',
        lastMessageTime: Date.now(),
        unreadCount: 0
      };
      chats.push(existingChat);
      MI.Storage.setChats(chats);
    }

    // 导航到聊天详情
    MI.Router.navigateTo('chat-detail', { chatId: existingChat.id });
  }
};
