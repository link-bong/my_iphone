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
      rightIcon: 'plus',
      onRight: function () {
        MI.WeChat.showCreateMenu();
      }
    });
    container.appendChild(navBar);

    var tabContent = document.createElement('div');
    tabContent.className = 'wechat-tab-content';
    tabContent.id = 'wechat-tab-content';

    var tab = MI.Router.wechatTab || 'chats';
    this._renderTabContent(tabContent, tab);

    container.appendChild(tabContent);

    var momentUnread = MI.MomentNotifications ? MI.MomentNotifications.getUnreadCount() : 0;
    var tabBar = MI.Components.createTabBar(tab, function (tabId) {
      MI.Router.switchWechatTab(tabId);
    }, { discover: momentUnread > 0 });
    container.appendChild(tabBar);
  },

  refreshIfVisible: function () {
    if (MI.Router.currentPage() === 'wechat') {
      MI.Router.render();
    }
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
    var params = MI.Router.getChatDetailParams();
    var chatId = MI.Router.resolveChatId(params);
    if (!chatId) {
      container.classList.add('app-screen');
      container.appendChild(MI.Components.createNavBar('聊天', {
        showBack: true,
        onBack: function () { MI.Router.goBack(); }
      }));
      container.appendChild(MI.Components.createEmptyState('会话不存在或已失效'));
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
      container.classList.add('app-screen');
      container.appendChild(MI.Components.createNavBar('聊天', {
        showBack: true,
        onBack: function () { MI.Router.goBack(); }
      }));
      container.appendChild(MI.Components.createEmptyState('会话不存在或已失效'));
      return;
    }

    var contact = MI.Data.getContactForChat(chat);
    var character = chat.contactId ? MI.Data.getContactById(chat.contactId) : null;
    var isTool = character && MI.Data.isTool(character);
    var isEditableCharacter = character && MI.Data.isCharacter(character);

    container.classList.add('app-screen');
    if (isTool) container.classList.add('chat-tool-session');

    var self = this;
    var navBar = MI.Components.createNavBar(contact.name, {
      showBack: true,
      onBack: function () { MI.Router.goBack(); },
      titleClickable: isEditableCharacter,
      onTitleClick: isEditableCharacter ? function () {
        MI.Router.navigateTo('character-profile', {
          contactId: character.id,
          chatId: chat.id
        });
      } : null,
      rightIcon: (isEditableCharacter || isTool) ? 'ellipsis' : null,
      onRight: (isEditableCharacter || isTool) ? function () {
        if (isTool) {
          MI.Router.navigateTo('tool-edit', { contactId: character.id, chatId: chat.id });
        } else {
          MI.Router.navigateTo('character-edit', { contactId: character.id, chatId: chat.id });
        }
      } : null
    });
    container.appendChild(navBar);

    var msgList = document.createElement('div');
    msgList.className = 'msg-list';
    msgList.id = 'chat-msg-list';
    container.appendChild(msgList);

    var chatSettings = isEditableCharacter
      ? MI.ChatEngine.getChatSettings(character)
      : { chatEffect: 'paragraph' };

    var renderOptions = {
      chatEffect: chatSettings.chatEffect,
      allowActions: isEditableCharacter,
      contact: character,
      onMessageAction: null
    };

    var handleMessageAction = function (partInfo) {
      self._showMessagePartActionSheet(chat, partInfo, msgList, renderOptions);
    };
    renderOptions.onMessageAction = handleMessageAction;

    for (var mi = 0; mi < chat.messages.length; mi++) {
      MI.ChatEngine.normalizeMessage(chat.messages[mi], chatSettings.chatEffect);
    }
    self._saveChat(chat);

    this._renderMessages(msgList, chat.messages, renderOptions);

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
    sendBtn.type = 'button';
    sendBtn.className = 'chat-send-btn';
    sendBtn.appendChild(MI.Components.buttonContent('paper-plane', '发送'));
    sendBtn.id = 'chat-send-btn';

    inputBar.appendChild(input);
    inputBar.appendChild(sendBtn);
    container.appendChild(inputBar);

    this._bindChatEvents(chat, character, input, sendBtn, msgList, renderOptions);
  },

  _renderMessages: function (container, messages, options) {
    options = options || {};
    container.innerHTML = '';
    var chatEffect = options.chatEffect || 'sentence';

    for (var i = 0; i < messages.length; i++) {
      var msg = MI.ChatEngine.normalizeMessage(messages[i], chatEffect);
      var parts = MI.ChatEngine.getMessageParts(msg, chatEffect);
      var group = MI.Components.createMessageGroup(msg, parts, {
        onPartAction: options.allowActions ? options.onMessageAction : null
      });
      container.appendChild(group);

      if (msg.linkedMomentId && MI.Moments) {
        var linked = MI.Moments.getById(msg.linkedMomentId);
        if (linked) {
          var charName = options.contact ? options.contact.name : '';
          container.appendChild(MI.Components.createMomentLinkBubble(linked, charName));
        }
      }
    }
  },

  _showMessagePartActionSheet: function (chat, partInfo, msgList, renderOptions) {
    var self = this;
    var msg = partInfo.msg;
    var partIndex = partInfo.partIndex;
    var partText = partInfo.text;
    var roleLabel = msg.role === 'user' ? '你的消息' : '角色消息';
    var parts = MI.ChatEngine.getMessageParts(msg, renderOptions.chatEffect);
    var isSinglePart = parts.length <= 1;

    MI.Components.showActionSheet(isSinglePart ? roleLabel : roleLabel + '（第 ' + (partIndex + 1) + ' 句）', [
      {
        icon: 'pen',
        label: isSinglePart ? '编辑' : '编辑此句',
        onClick: function () {
          MI.Components.showPromptDialog(
            isSinglePart ? '编辑消息' : '编辑此句',
            partText,
            function (newContent) {
              var text = String(newContent || '').trim();
              if (isSinglePart) {
                for (var i = 0; i < chat.messages.length; i++) {
                  if (chat.messages[i].id === msg.id) {
                    chat.messages[i].content = text;
                    chat.messages[i].parts = [text];
                    break;
                  }
                }
              } else {
                MI.ChatEngine.editMessagePart(chat.messages, msg.id, partIndex, text);
              }
              self._refreshChatMeta(chat);
              self._saveChat(chat);
              self._renderMessages(msgList, chat.messages, renderOptions);
              msgList.scrollTop = msgList.scrollHeight;
            },
            null,
            {
              validate: function (val) {
                if (!String(val || '').trim()) return '内容不能为空';
                return '';
              }
            }
          );
        }
      },
      {
        icon: 'trash',
        label: isSinglePart ? '删除' : '删除此句',
        danger: true,
        onClick: function () {
          var confirmMsg = isSinglePart
            ? '确定删除这条消息？后续对话将不再包含此内容。'
            : '确定删除这一句？其他分句会保留，AI 记忆也会同步更新。';

          MI.Components.showConfirmDialog(
            isSinglePart ? '删除消息' : '删除此句',
            confirmMsg,
            function () {
              if (isSinglePart) {
                var filtered = [];
                for (var j = 0; j < chat.messages.length; j++) {
                  if (chat.messages[j].id !== msg.id) filtered.push(chat.messages[j]);
                }
                chat.messages = filtered;
              } else {
                MI.ChatEngine.deleteMessagePart(chat.messages, msg.id, partIndex);
              }

              self._refreshChatMeta(chat);
              self._saveChat(chat);
              self._renderMessages(msgList, chat.messages, renderOptions);
              msgList.scrollTop = msgList.scrollHeight;
            },
            null,
            { danger: true, confirmText: '删除' }
          );
        }
      }
    ]);
  },

  _refreshChatMeta: function (chat) {
    if (!chat.messages || chat.messages.length === 0) {
      chat.lastMessage = '';
      chat.lastMessageTime = Date.now();
      return;
    }
    var last = chat.messages[chat.messages.length - 1];
    chat.lastMessage = last.content;
    chat.lastMessageTime = last.timestamp || Date.now();
  },

  _bindChatEvents: function (chat, character, input, sendBtn, msgList, renderOptions) {
    var self = this;
    renderOptions = renderOptions || { chatEffect: 'sentence', allowActions: false };

    if (!input || !sendBtn || !msgList) return;

    var getApiConfig = function () {
      if (character && character.id) {
        var fresh = MI.Data.getContactById(character.id);
        if (fresh) return MI.ChatEngine.getApiConfigForContact(fresh);
      }
      return MI.ChatEngine.getApiConfigForAi();
    };

    var getChatSettings = function () {
      if (character && character.id) {
        var freshChar = MI.Data.getContactById(character.id);
        if (freshChar) return MI.ChatEngine.getChatSettings(freshChar);
      }
      return { chatEffect: 'paragraph', chatMode: 'real', language: 'zh' };
    };

    var resetSendUi = function () {
      sendBtn.disabled = false;
      sendBtn.innerHTML = '';
      sendBtn.appendChild(MI.Components.buttonContent('paper-plane', '发送'));
      input.disabled = false;
      input.focus();
    };

    var doSend = function () {
      var text = input.value.trim();
      if (!text || sendBtn.disabled) return;

      var apiConfig = getApiConfig();
      if (!apiConfig || !apiConfig.apiKey) {
        var isToolChat = character && MI.Data.isTool(character);
        var isCharChat = character && MI.Data.isCharacter(character);
        if (isCharChat) {
          MI.Components.showToast('请先在角色编辑页选择 API 配置，并在「我 → API 配置」中填写 Key', 3500);
        } else if (isToolChat) {
          MI.Components.showToast('请先在「我 → API 配置」中添加并填写 API Key，或在服务号编辑页选择配置', 3500);
        } else {
          MI.Components.showToast('请先在「我 → API 配置」中添加 API，并在 AI 助手设置中选择', 3500);
        }
        return;
      }
      if (!apiConfig.apiModel) {
        MI.Components.showToast('请先选择或填写模型名称');
        return;
      }

      input.value = '';

      var userMsg = {
        id: MI.Data.genId('msg'),
        role: 'user',
        content: text,
        parts: [text],
        timestamp: Date.now()
      };
      var userGroup = MI.Components.createMessageGroup(userMsg, [text], {
        onPartAction: renderOptions.allowActions ? renderOptions.onMessageAction : null
      });
      msgList.appendChild(userGroup);
      msgList.scrollTop = msgList.scrollHeight;

      chat.messages.push(userMsg);
      chat.lastMessage = text;
      chat.lastMessageTime = Date.now();
      self._saveChat(chat);

      sendBtn.disabled = true;
      sendBtn.innerHTML = '';
      sendBtn.appendChild(MI.Components.icon('ellipsis', 'btn-icon'));
      input.disabled = true;

      var chatSettings = getChatSettings();
      var chatMessages = chat.messages.slice();
      if (chatMessages.length > 40) {
        chatMessages.splice(0, chatMessages.length - 40);
      }
      for (var cm = 0; cm < chatMessages.length; cm++) {
        MI.ChatEngine.syncMessageContent(chatMessages[cm], chatSettings.chatEffect);
      }

      var typingBubble = MI.Components.createTypingBubble();
      msgList.appendChild(typingBubble);
      msgList.scrollTop = msgList.scrollHeight;

      var streamBubble = null;
      var contactType = apiConfig.contactType || 'character';

      MI.API.sendChatStream(chatMessages, apiConfig, {
        onChunk: function (chunk, accumulated) {
          if (typingBubble.parentNode) typingBubble.parentNode.removeChild(typingBubble);

          var display = accumulated;
          if (contactType === 'character') {
            display = MI.ChatEngine.stripMomentForStream(accumulated);
          }

          if (!streamBubble) {
            streamBubble = MI.Components.createMessageBubble(display || ' ', 'assistant');
            streamBubble.classList.add('msg-streaming');
            msgList.appendChild(streamBubble);
          } else {
            MI.Components.setMessageBubbleContent(streamBubble, display || ' ');
          }
          msgList.scrollTop = msgList.scrollHeight;
        },
        onSuccess: function (reply) {
          if (typingBubble.parentNode) typingBubble.parentNode.removeChild(typingBubble);

          if (!reply || !String(reply).trim()) {
            if (streamBubble && streamBubble.parentNode) streamBubble.parentNode.removeChild(streamBubble);
            var emptyBubble = document.createElement('div');
            emptyBubble.className = 'msg-bubble msg-error';
            emptyBubble.textContent = '⚠️ API 返回了空内容，请检查模型名称或 API 配置';
            msgList.appendChild(emptyBubble);
            msgList.scrollTop = msgList.scrollHeight;
            resetSendUi();
            return;
          }

          var processed = MI.ChatEngine.processAssistantReply(reply, chatSettings);
          var finalText = processed.content;
          var moment = processed.moment != null ? processed.moment : MI.ChatEngine.extractMoment(reply, contactType);

          if (streamBubble && streamBubble.parentNode) {
            streamBubble.parentNode.removeChild(streamBubble);
            streamBubble = null;
          }

          var aiMsg = {
            id: MI.Data.genId('msg'),
            role: 'assistant',
            content: finalText,
            parts: processed.parts.slice(),
            timestamp: Date.now()
          };
          chat.messages.push(aiMsg);
          chat.lastMessage = finalText;
          chat.lastMessageTime = Date.now();
          self._saveChat(chat);

          if (contactType === 'character') {
            var parts = aiMsg.parts;
            var useSequential = parts.length > 1 &&
              chatSettings.chatEffect !== 'paragraph' &&
              chatSettings.chatEffect !== 'immersive';

            if (useSequential) {
              MI.ChatEngine.renderBubblesSequentially(msgList, parts, {
                msgId: aiMsg.id,
                msg: aiMsg,
                onPartAction: renderOptions.allowActions ? renderOptions.onMessageAction : null
              }, function () {
                msgList.scrollTop = msgList.scrollHeight;
              });
            } else {
              var group = MI.Components.createMessageGroup(aiMsg, parts, {
                onPartAction: renderOptions.allowActions ? renderOptions.onMessageAction : null
              });
              msgList.appendChild(group);
            }
          } else {
            var aiGroup = MI.Components.createMessageGroup(aiMsg, [finalText], {});
            msgList.appendChild(aiGroup);
          }

          if (moment && character && MI.Data.isCharacter(character)) {
            var freshChar = MI.Data.getContactById(character.id) || character;
            var createdMoment = MI.ChatEngine.createMomentFromChat(freshChar, moment);
            if (createdMoment) {
              aiMsg.linkedMomentId = createdMoment.id;
              for (var mi = chat.messages.length - 1; mi >= 0; mi--) {
                if (chat.messages[mi].id === aiMsg.id) {
                  chat.messages[mi].linkedMomentId = createdMoment.id;
                  break;
                }
              }
              self._saveChat(chat);
              msgList.appendChild(MI.Components.createMomentLinkBubble(createdMoment, freshChar.name));
              self._showToast(freshChar.name + ' 发了一条朋友圈，点击查看');
            }
          }

          msgList.scrollTop = msgList.scrollHeight;
          resetSendUi();
          return;
        },
        onError: function (errorMsg) {
          if (typingBubble.parentNode) typingBubble.parentNode.removeChild(typingBubble);
          if (streamBubble && streamBubble.parentNode && !streamBubble.textContent.trim()) {
            streamBubble.parentNode.removeChild(streamBubble);
          } else if (streamBubble) {
            streamBubble.classList.remove('msg-streaming');
          }

          var errBubble = document.createElement('div');
          errBubble.className = 'msg-bubble msg-error';
          errBubble.textContent = '⚠️ ' + errorMsg;
          msgList.appendChild(errBubble);
          msgList.scrollTop = msgList.scrollHeight;
          resetSendUi();
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

    var momentsRow = MI.Components.createMenuRow('images', '朋友圈', '', true, function () {
      MI.Router.navigateTo('moments');
    });

    var unreadCount = MI.MomentNotifications ? MI.MomentNotifications.getUnreadCount() : 0;
    if (unreadCount > 0) {
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
  },

  /** 右上角 ＋：创建角色 / 服务号 */
  showCreateMenu: function () {
    var overlay = document.createElement('div');
    overlay.className = 'action-sheet-overlay';

    var sheet = document.createElement('div');
    sheet.className = 'action-sheet';

    var title = document.createElement('div');
    title.className = 'action-sheet-title';
    title.textContent = '创建';
    sheet.appendChild(title);

    var options = [
      { icon: 'user-plus', label: '创建角色', page: 'character-create' },
      { icon: 'screwdriver-wrench', label: '创建服务号', page: 'tool-create' }
    ];

    for (var i = 0; i < options.length; i++) {
      (function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'action-sheet-item';
        btn.appendChild(MI.Components.buttonContent(opt.icon, opt.label));
        btn.addEventListener('click', function () {
          document.body.removeChild(overlay);
          MI.Router.navigateTo(opt.page);
        });
        sheet.appendChild(btn);
      })(options[i]);
    }

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'action-sheet-cancel';
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', function () {
      document.body.removeChild(overlay);
    });
    sheet.appendChild(cancelBtn);

    overlay.appendChild(sheet);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) document.body.removeChild(overlay);
    });
    document.body.appendChild(overlay);
  }
};
