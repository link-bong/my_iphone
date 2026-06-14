/**
 * wechat.js — 微信应用核心
 */
window.MI = window.MI || {};

MI.WeChat = {
  render: function (container) {
    container.classList.add('app-screen');

    var navBar = MI.Components.createNavBar('微信', {
      showHome: true,
      onHome: function () { MI.Router.goHome(); },
      rightText: '＋',
      onRight: function () {
        MI.Router.navigateTo('character-create');
      }
    });
    container.appendChild(navBar);

    var tabContent = document.createElement('div');
    tabContent.className = 'wechat-tab-content';
    tabContent.id = 'wechat-tab-content';

    var tab = MI.Router.wechatTab || 'chats';
    this._renderTabContent(tabContent, tab);

    container.appendChild(tabContent);

    var tabBar = MI.Components.createTabBar(tab, function (tabId) {
      MI.Router.switchWechatTab(tabId);
    });
    container.appendChild(tabBar);
  },

  _renderTabContent: function (container, tabId) {
    container.innerHTML = '';

    switch (tabId) {
      case 'chats':
        this._renderChatsList(container);
        break;
      case 'contacts':
        MI.Contacts.render(container);
        break;
      case 'discover':
        this._renderDiscover(container);
        break;
      case 'me':
        MI.Profile.render(container);
        break;
    }
  },

  _renderChatsList: function (container) {
    var chats = MI.Storage.getChats();

    if (chats.length === 0) {
      container.appendChild(MI.Components.createEmptyState('暂无聊天记录\n点击右上角 ＋ 创建角色'));
      return;
    }

    chats.sort(function (a, b) {
      return (b.lastMessageTime || 0) - (a.lastMessageTime || 0);
    });

    for (var i = 0; i < chats.length; i++) {
      var chat = chats[i];
      var contact = MI.Data.getContactForChat(chat);
      var item = MI.Components.createChatListItem(chat, contact, function (c) {
        MI.Router.navigateTo('chat-detail', { chatId: c.id });
      });

      if (i < chats.length - 1) {
        item.appendChild(MI.Components.createDivider());
      }

      container.appendChild(item);
    }
  },

  renderChatDetail: function (container) {
    var params = MI.Router.currentParams;
    var chatId = params ? params.chatId : null;
    if (!chatId) {
      MI.Router.goBack();
      return;
    }

    var chats = MI.Storage.getChats();
    var chat = null;
    for (var i = 0; i < chats.length; i++) {
      if (chats[i].id === chatId) {
        chat = chats[i];
        break;
      }
    }
    if (!chat) {
      MI.Router.goBack();
      return;
    }

    var contact = MI.Data.getContactForChat(chat);
    var character = chat.contactId ? MI.Data.getContactById(chat.contactId) : null;

    container.classList.add('app-screen');

    var self = this;
    var navBar = MI.Components.createNavBar(contact.name, {
      showBack: true,
      onBack: function () { MI.Router.goBack(); },
      rightText: character ? '⋯' : null,
      onRight: character ? function () {
        MI.Router.navigateTo('character-edit', { contactId: character.id });
      } : null
    });
    container.appendChild(navBar);

    var msgList = document.createElement('div');
    msgList.className = 'msg-list';
    msgList.id = 'chat-msg-list';
    container.appendChild(msgList);

    this._renderMessages(msgList, chat.messages);

    setTimeout(function () {
      msgList.scrollTop = msgList.scrollHeight;
    }, 100);

    var inputBar = document.createElement('div');
    inputBar.className = 'input-bar';
    inputBar.id = 'chat-input-bar';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'chat-input';
    input.placeholder = '发消息...';
    input.id = 'chat-text-input';

    var sendBtn = document.createElement('button');
    sendBtn.className = 'chat-send-btn';
    sendBtn.textContent = '发送';
    sendBtn.id = 'chat-send-btn';

    inputBar.appendChild(input);
    inputBar.appendChild(sendBtn);
    container.appendChild(inputBar);

    this._bindChatEvents(chat, character);
  },

  _renderMessages: function (container, messages) {
    container.innerHTML = '';
    for (var i = 0; i < messages.length; i++) {
      var msg = messages[i];
      var sender = msg.role === 'user' ? 'user' : 'assistant';
      var bubble = MI.Components.createMessageBubble(msg.content, sender);
      container.appendChild(bubble);
    }
  },

  _bindChatEvents: function (chat, character) {
    var input = document.getElementById('chat-text-input');
    var sendBtn = document.getElementById('chat-send-btn');
    var msgList = document.getElementById('chat-msg-list');
    var self = this;

    if (!input || !sendBtn || !msgList) return;

    var apiConfig = character
      ? MI.ChatEngine.getApiConfigForContact(character)
      : MI.ChatEngine.getApiConfigForAi();

    var doSend = function () {
      var text = input.value.trim();
      if (!text || sendBtn.disabled) return;

      if (!apiConfig || !apiConfig.apiKey) {
        alert(character
          ? '请先在角色编辑页填写该角色的 API Key'
          : '请先在「我 → AI 助手设置」中填写 API Key');
        return;
      }

      input.value = '';

      var userBubble = MI.Components.createMessageBubble(text, 'user');
      msgList.appendChild(userBubble);
      msgList.scrollTop = msgList.scrollHeight;

      var userMsg = { role: 'user', content: text, timestamp: Date.now() };
      chat.messages.push(userMsg);
      chat.lastMessage = text;
      chat.lastMessageTime = Date.now();
      self._saveChat(chat);

      sendBtn.disabled = true;
      sendBtn.textContent = '...';
      input.disabled = true;

      var chatMessages = chat.messages.slice();
      if (chatMessages.length > 40) {
        chatMessages.splice(0, chatMessages.length - 40);
      }

      MI.API.sendChat(chatMessages, apiConfig, {
        onSuccess: function (reply) {
          var parsed = MI.ChatEngine.parseAssistantReply(reply);
          var savedBubbles = [];

          MI.ChatEngine.renderBubblesSequentially(msgList, parsed.bubbles, function (bubbleText) {
            var aiMsg = { role: 'assistant', content: bubbleText, timestamp: Date.now() };
            chat.messages.push(aiMsg);
            savedBubbles.push(bubbleText);
            chat.lastMessage = bubbleText;
            chat.lastMessageTime = Date.now();
            self._saveChat(chat);
          }, function () {
            if (parsed.moment && character) {
              MI.ChatEngine.createMomentFromChat(character, parsed.moment);
              self._showToast('📷 ' + character.name + ' 发了一条朋友圈');
            }
            sendBtn.disabled = false;
            sendBtn.textContent = '发送';
            input.disabled = false;
            input.focus();
          });
        },
        onError: function (errorMsg) {
          var typing = msgList.querySelector('.msg-typing');
          if (typing && typing.parentNode) typing.parentNode.removeChild(typing);

          var errBubble = document.createElement('div');
          errBubble.className = 'msg-bubble msg-error';
          errBubble.textContent = '⚠️ ' + errorMsg;
          msgList.appendChild(errBubble);
          msgList.scrollTop = msgList.scrollHeight;

          sendBtn.disabled = false;
          sendBtn.textContent = '发送';
          input.disabled = false;
        },
        onEnd: function () {}
      });
    };

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        doSend();
      }
    });

    sendBtn.addEventListener('click', function (e) {
      e.preventDefault();
      doSend();
    });
  },

  _saveChat: function (chat) {
    var chats = MI.Storage.getChats();
    var found = false;
    for (var i = 0; i < chats.length; i++) {
      if (chats[i].id === chat.id) {
        chats[i] = chat;
        found = true;
        break;
      }
    }
    if (!found) chats.push(chat);
    MI.Storage.setChats(chats);
  },

  _renderDiscover: function (container) {
    var self = this;
    var worldviews = MI.Storage.getWorldviews();

    if (worldviews.length === 0) {
      container.appendChild(MI.Components.createEmptyState('请先创建世界观\n才能使用朋友圈'));
      return;
    }

    var momentsRow = MI.Components.createMenuRow('🔵', '朋友圈', '', true, function () {
      MI.Router.navigateTo('moments');
    });

    var wvMoments = MI.Storage.getMomentsByWorldview(MI.Storage.getActiveWorldviewId());
    if (wvMoments.length > 0) {
      var badge = document.createElement('span');
      badge.className = 'unread-dot';
      var right = momentsRow.querySelector('.menu-row-right');
      if (right) right.insertBefore(badge, right.firstChild);
    }

    container.appendChild(momentsRow);
    container.appendChild(MI.Components.createDivider());

    var items = ['扫一扫', '摇一摇', '小程序'];
    for (var i = 0; i < items.length; i++) {
      var item = MI.Components.createMenuRow('', items[i], '', true, function (name) {
        return function () { self._showToast(name + ' 功能开发中...'); };
      }(items[i]));
      container.appendChild(item);
      if (i < items.length - 1) {
        container.appendChild(MI.Components.createDivider());
      }
    }
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
