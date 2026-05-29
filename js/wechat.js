/**
 * wechat.js — 微信应用核心
 * 包含：Tab 切换框架、聊天列表、聊天详情（含 API 集成）、发现页
 */
window.MI = window.MI || {};

MI.WeChat = {
  /**
   * 渲染微信主界面（Tab 框架）
   */
  render: function (container) {
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';
    container.style.background = '#EDEDED';

    // 导航栏
    var navBar = MI.Components.createNavBar('微信', false, '＋', null, function () {
      MI.WeChat._showToast('添加联系人功能开发中...');
    });
    container.appendChild(navBar);

    // Tab 内容区域
    var tabContent = document.createElement('div');
    tabContent.className = 'wechat-tab-content';
    tabContent.id = 'wechat-tab-content';
    tabContent.style.cssText = 'flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;';

    var tab = MI.Router.wechatTab || 'chats';
    this._renderTabContent(tabContent, tab);

    container.appendChild(tabContent);

    // 底部 Tab 栏
    var self = this;
    var tabBar = MI.Components.createTabBar(tab, function (tabId) {
      MI.Router.switchWechatTab(tabId);
    });
    container.appendChild(tabBar);
  },

  /**
   * 渲染 Tab 内容
   */
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

  // ==================== 聊天列表 ====================

  _renderChatsList: function (container) {
    var chats = MI.Storage.getChats();

    if (chats.length === 0) {
      var empty = MI.Components.createEmptyState('暂无聊天记录\n点击右上角 ＋ 开始新对话');
      empty.style.cssText += 'text-align:center;padding:60px 20px;color:#8E8E93;font-size:15px;white-space:pre-line;';
      container.appendChild(empty);
      return;
    }

    // 按时间排序
    chats.sort(function (a, b) {
      return (b.lastMessageTime || 0) - (a.lastMessageTime || 0);
    });

    for (var i = 0; i < chats.length; i++) {
      var chat = chats[i];
      var contact = MI.Data.getContactForChat(chat);
      var self = this;
      var item = MI.Components.createChatListItem(chat, contact, function (c) {
        MI.Router.navigateTo('chat-detail', { chatId: c.id });
      });

      // 分隔线
      if (i < chats.length - 1) {
        item.appendChild(MI.Components.createDivider());
      }

      container.appendChild(item);
    }
  },

  // ==================== 聊天详情（核心） ====================

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

    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';
    container.style.background = '#EDEDED';

    // 导航栏（带返回按钮）
    var self = this;
    var navBar = MI.Components.createNavBar(
      contact.name,
      true,
      null,
      function () { MI.Router.goBack(); },
      null
    );
    container.appendChild(navBar);

    // 消息列表
    var msgList = document.createElement('div');
    msgList.className = 'msg-list';
    msgList.id = 'chat-msg-list';
    container.appendChild(msgList);

    // 渲染消息
    this._renderMessages(msgList, chat.messages);

    // 滚动到底部
    setTimeout(function () {
      msgList.scrollTop = msgList.scrollHeight;
    }, 100);

    // 输入栏
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

    // 事件绑定
    this._bindChatEvents(chat, chatId);
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

  _bindChatEvents: function (chat, chatId) {
    var input = document.getElementById('chat-text-input');
    var sendBtn = document.getElementById('chat-send-btn');
    var msgList = document.getElementById('chat-msg-list');
    var inputBar = document.getElementById('chat-input-bar');
    var self = this;

    if (!input || !sendBtn || !msgList) return;

    // 发送消息函数
    var doSend = function () {
      var text = input.value.trim();
      if (!text) return;

      // 检查发送状态
      if (sendBtn.disabled) return;

      // 再次检查 API Key
      var config = MI.Storage.getConfig();
      if (!config.apiKey || config.apiKey.trim() === '') {
        alert('请先在「我 → API 设置」中填写你的 API Key 才能聊天哦！');
        return;
      }

      input.value = '';

      // 1. 添加用户消息到 UI 和 chat
      var userBubble = MI.Components.createMessageBubble(text, 'user');
      msgList.appendChild(userBubble);
      msgList.scrollTop = msgList.scrollHeight;

      var userMsg = { role: 'user', content: text, timestamp: Date.now() };
      chat.messages.push(userMsg);
      chat.lastMessage = text;
      chat.lastMessageTime = Date.now();
      self._saveChat(chat);

      // 2. 显示打字动画
      var typingBubble = MI.Components.createTypingBubble();
      msgList.appendChild(typingBubble);
      msgList.scrollTop = msgList.scrollHeight;

      // 3. 禁用输入（Bug 修复 3）
      sendBtn.disabled = true;
      sendBtn.textContent = '...';
      input.disabled = true;

      // 4. 构建消息历史（仅此 chat 的消息）
      var chatMessages = chat.messages.slice();
      // Bug 修复 6：截断到最近 40 条
      if (chatMessages.length > 40) {
        chatMessages.splice(0, chatMessages.length - 40);
      }

      // 5. 调用 API
      MI.API.sendChat(chatMessages, {
        onStart: function () {
          // typing 动画已显示
        },
        onSuccess: function (reply) {
          // 移除打字动画
          if (typingBubble.parentNode) typingBubble.parentNode.removeChild(typingBubble);

          // 添加 AI 回复
          var aiBubble = MI.Components.createMessageBubble(reply, 'assistant');
          msgList.appendChild(aiBubble);
          msgList.scrollTop = msgList.scrollHeight;

          var aiMsg = { role: 'assistant', content: reply, timestamp: Date.now() };
          chat.messages.push(aiMsg);
          chat.lastMessage = reply;
          chat.lastMessageTime = Date.now();
          self._saveChat(chat);
        },
        onError: function (errorMsg) {
          // 移除打字动画
          if (typingBubble.parentNode) typingBubble.parentNode.removeChild(typingBubble);

          // 显示错误
          var errBubble = document.createElement('div');
          errBubble.className = 'msg-bubble msg-error';
          errBubble.textContent = '⚠️ ' + errorMsg;
          msgList.appendChild(errBubble);
          msgList.scrollTop = msgList.scrollHeight;
        },
        onEnd: function () {
          // 恢复输入
          sendBtn.disabled = false;
          sendBtn.textContent = '发送';
          input.disabled = false;
          input.focus();
        }
      });
    };

    // Bug 修复 7：Enter 发送、Shift+Enter 换行
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

  /**
   * 保存 chat 到 localStorage
   */
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
    if (!found) {
      chats.push(chat);
    }
    MI.Storage.setChats(chats);
  },

  // ==================== 发现页 ====================

  _renderDiscover: function (container) {
    var self = this;

    // 朋友圈入口
    var momentsRow = MI.Components.createMenuRow('🔵', '朋友圈', '', true, function () {
      MI.Router.navigateTo('moments');
    });
    // 检查是否有朋友圈内容，有则显示红点
    var moments = MI.Storage.getMoments();
    if (moments.length > 0) {
      var badge = document.createElement('span');
      badge.className = 'unread-badge';
      badge.textContent = '';
      badge.style.cssText = 'display:inline-block;width:8px;height:8px;background:#FF3B30;border-radius:50%;margin-right:6px;';
      var right = momentsRow.querySelector('.menu-row-right');
      if (right) {
        right.insertBefore(badge, right.firstChild);
      }
    }
    container.appendChild(momentsRow);
    container.appendChild(MI.Components.createDivider());

    // 装饰性菜单项
    var items = ['扫一扫', '摇一摇', '小程序'];
    for (var i = 0; i < items.length; i++) {
      var item = MI.Components.createMenuRow('', items[i], '', true, function (name) {
        return function () {
          self._showToast(name + ' 功能开发中...');
        };
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
