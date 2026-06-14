/**
 * components.js — 可复用的 UI 组件
 * 每个函数返回一个 DOM 元素
 */
window.MI = window.MI || {};

MI.Components = {
  /**
   * 状态栏 — 显示时间、信号、电量
   */
  createStatusBar: function () {
    var bar = document.createElement('div');
    bar.className = 'status-bar';

    var left = document.createElement('div');
    left.className = 'status-left';
    left.textContent = this._getTimeString();

    var right = document.createElement('div');
    right.className = 'status-right';

    var signal = document.createElement('div');
    signal.className = 'status-icon status-icon-signal';
    for (var s = 0; s < 4; s++) {
      signal.appendChild(document.createElement('span'));
    }

    var wifi = document.createElement('div');
    wifi.className = 'status-icon status-icon-wifi';

    var battery = document.createElement('div');
    battery.className = 'status-icon status-icon-battery';

    right.appendChild(signal);
    right.appendChild(wifi);
    right.appendChild(battery);

    bar.appendChild(left);
    bar.appendChild(right);
    return bar;
  },

  /**
   * 获取当前时间字符串 "HH:MM"
   */
  _getTimeString: function () {
    var now = new Date();
    var h = now.getHours();
    var m = now.getMinutes();
    return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
  },

  /**
   * 导航栏
   * @param {string} title
   * @param {Object} opts - { showBack, showHome, rightText, onBack, onHome, onRight }
   */
  createNavBar: function (title, opts) {
    opts = opts || {};
    var bar = document.createElement('div');
    bar.className = 'nav-bar';

    if (opts.showHome) {
      var homeBtn = document.createElement('div');
      homeBtn.className = 'nav-home-btn';
      homeBtn.textContent = '⌂';
      homeBtn.title = '返回主屏幕';
      homeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (opts.onHome) opts.onHome();
      });
      bar.appendChild(homeBtn);
    }

    if (opts.showBack) {
      var backBtn = document.createElement('div');
      backBtn.className = 'nav-back-btn';
      if (opts.showHome) backBtn.style.left = '44px';
      backBtn.textContent = '← 返回';
      backBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (opts.onBack) opts.onBack();
      });
      bar.appendChild(backBtn);
    }

    var titleEl = document.createElement('div');
    titleEl.className = 'nav-title';
    titleEl.textContent = title;
    bar.appendChild(titleEl);

    if (opts.rightText) {
      var rightBtn = document.createElement('div');
      rightBtn.className = 'nav-right-btn';
      rightBtn.textContent = opts.rightText;
      rightBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (opts.onRight) opts.onRight();
      });
      bar.appendChild(rightBtn);
    }

    return bar;
  },

  /**
   * 底部 Tab 栏（微信风格）
   * @param {string} activeTab - 当前激活的 tab ID
   * @param {Function} onTabChange - (tabId: string) => void
   */
  createTabBar: function (activeTab, onTabChange) {
    var tabs = [
      { id: 'chats',    icon: '💬', label: '微信' },
      { id: 'contacts', icon: '👥', label: '通讯录' },
      { id: 'discover', icon: '🔍', label: '发现' },
      { id: 'me',       icon: '👤', label: '我' }
    ];

    var bar = document.createElement('div');
    bar.className = 'tab-bar';

    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      var item = document.createElement('div');
      item.className = 'tab-item' + (tab.id === activeTab ? ' active' : '');
      item.setAttribute('data-tab', tab.id);

      var icon = document.createElement('div');
      icon.className = 'tab-icon';
      icon.textContent = tab.icon;

      var label = document.createElement('div');
      label.className = 'tab-label';
      label.textContent = tab.label;

      item.appendChild(icon);
      item.appendChild(label);

      item.addEventListener('click', (function (tabId) {
        return function (e) {
          e.preventDefault();
          if (onTabChange) onTabChange(tabId);
        };
      })(tab.id));

      bar.appendChild(item);
    }

    return bar;
  },

  /**
   * 头像元素
   */
  createAvatar: function (emoji, size) {
    var avatar = document.createElement('div');
    avatar.className = 'avatar';
    if (size === 'small') avatar.classList.add('avatar-sm');
    if (size === 'large') avatar.classList.add('avatar-lg');
    avatar.textContent = emoji;
    return avatar;
  },

  /**
   * 聊天列表项
   */
  createChatListItem: function (chat, contact, onClick) {
    var item = document.createElement('div');
    item.className = 'chat-item';

    var avatar = this.createAvatar(contact.avatar, 'normal');

    var info = document.createElement('div');
    info.className = 'chat-item-info';

    var topRow = document.createElement('div');
    topRow.className = 'chat-item-top';

    var name = document.createElement('div');
    name.className = 'chat-item-name';
    name.textContent = contact.name;

    var time = document.createElement('div');
    time.className = 'chat-item-time';
    time.textContent = this._formatTime(chat.lastMessageTime);

    topRow.appendChild(name);
    topRow.appendChild(time);

    var bottomRow = document.createElement('div');
    bottomRow.className = 'chat-item-bottom';

    var lastMsg = document.createElement('div');
    lastMsg.className = 'chat-item-lastmsg';
    lastMsg.textContent = chat.lastMessage || '';

    bottomRow.appendChild(lastMsg);

    // 未读红点
    if (chat.unreadCount && chat.unreadCount > 0) {
      var badge = document.createElement('div');
      badge.className = 'unread-badge';
      badge.textContent = chat.unreadCount > 99 ? '99+' : chat.unreadCount;
      bottomRow.appendChild(badge);
    }

    info.appendChild(topRow);
    info.appendChild(bottomRow);

    item.appendChild(avatar);
    item.appendChild(info);

    item.addEventListener('click', function (e) {
      e.preventDefault();
      if (onClick) onClick(chat);
    });

    return item;
  },

  /**
   * 聊天气泡
   * @param {string} content - 消息内容
   * @param {string} sender - 'user' 或 'assistant'
   */
  createMessageBubble: function (content, sender) {
    var bubble = document.createElement('div');
    bubble.className = 'msg-bubble' + (sender === 'user' ? ' msg-sent' : ' msg-received');
    // Bug 修复 5：使用 textContent 保留换行
    bubble.textContent = content;
    return bubble;
  },

  /**
   * 打字动画气泡
   */
  createTypingBubble: function () {
    var bubble = document.createElement('div');
    bubble.className = 'msg-bubble msg-received msg-typing';

    var dots = document.createElement('div');
    dots.className = 'typing-dots';

    for (var i = 0; i < 3; i++) {
      var dot = document.createElement('span');
      dots.appendChild(dot);
    }

    bubble.appendChild(dots);
    return bubble;
  },

  /**
   * 联系人行
   */
  createContactRow: function (contact, onClick) {
    var row = document.createElement('div');
    row.className = 'contact-row';

    var avatar = this.createAvatar(contact.avatar, 'normal');

    var info = document.createElement('div');
    info.className = 'contact-info';

    var name = document.createElement('div');
    name.className = 'contact-name';
    name.textContent = contact.name;

    info.appendChild(name);

    row.appendChild(avatar);
    row.appendChild(info);

    row.addEventListener('click', function (e) {
      e.preventDefault();
      if (onClick) onClick(contact);
    });

    return row;
  },

  /**
   * 朋友圈帖子卡片
   */
  createMomentsPost: function (post, author) {
    var card = document.createElement('div');
    card.className = 'moments-post';

    // 头部：头像 + 昵称
    var header = document.createElement('div');
    header.className = 'post-header';

    var avatar = this.createAvatar(author.avatar, 'small');

    var authorName = document.createElement('div');
    authorName.className = 'post-author-name';
    authorName.textContent = author.name;

    header.appendChild(avatar);
    header.appendChild(authorName);

    // 文字内容
    var text = document.createElement('div');
    text.className = 'post-text';
    text.textContent = post.content;

    // 图片区域（使用 emoji 模拟图片）
    var imagesEl = null;
    if (post.images && post.images.length > 0) {
      imagesEl = document.createElement('div');
      var imgCount = post.images.length;
      imagesEl.className = 'post-images';
      if (imgCount === 1) imagesEl.classList.add('single');
      if (imgCount === 2) imagesEl.classList.add('two');
      if (imgCount >= 3) imagesEl.classList.add('grid');

      for (var i = 0; i < post.images.length; i++) {
        var imgPlaceholder = document.createElement('div');
        imgPlaceholder.className = 'post-img-placeholder';
        imgPlaceholder.textContent = post.images[i];
        imagesEl.appendChild(imgPlaceholder);
      }
    }

    // 时间戳
    var timestamp = document.createElement('div');
    timestamp.className = 'post-timestamp';
    timestamp.textContent = this._formatFullTime(post.timestamp);

    // 点赞和评论栏
    var hasLikes = post.likes && post.likes.length > 0;
    var hasComments = post.comments && post.comments.length > 0;

    if (hasLikes || hasComments) {
      var interactionBar = document.createElement('div');
      interactionBar.className = 'post-interactions';

      // 点赞
      if (hasLikes) {
        var likesBar = document.createElement('div');
        likesBar.className = 'likes-bar';
        var likeNames = [];
        for (var j = 0; j < post.likes.length; j++) {
          var likeAuthor = MI.Data.getAuthorById(post.likes[j]);
          likeNames.push(likeAuthor ? likeAuthor.name : '未知');
        }
        likesBar.textContent = '❤️ ' + likeNames.join(', ');
        interactionBar.appendChild(likesBar);
      }

      // 评论
      if (hasComments) {
        var commentsEl = document.createElement('div');
        commentsEl.className = 'comments-bar';
        for (var k = 0; k < post.comments.length; k++) {
          var comment = post.comments[k];
          var commentAuthor = MI.Data.getAuthorById(comment.authorId);
          var commentLine = document.createElement('div');
          commentLine.className = 'comment-line';

          var commentName = document.createElement('span');
          commentName.className = 'comment-name';
          commentName.textContent = (commentAuthor ? commentAuthor.name : '未知') + '：';

          var commentText = document.createElement('span');
          commentText.textContent = comment.content;

          commentLine.appendChild(commentName);
          commentLine.appendChild(commentText);
          commentsEl.appendChild(commentLine);
        }
        interactionBar.appendChild(commentsEl);
      }

      card.appendChild(header);
      card.appendChild(text);
      if (imagesEl) card.appendChild(imagesEl);
      card.appendChild(timestamp);
      card.appendChild(interactionBar);
    } else {
      card.appendChild(header);
      card.appendChild(text);
      if (imagesEl) card.appendChild(imagesEl);
      card.appendChild(timestamp);
    }

    return card;
  },

  /**
   * 主屏幕应用图标
   */
  createAppIcon: function (emoji, label, appId, onClick, isDock) {
    var icon = document.createElement('div');
    icon.className = 'app-icon';

    var img = document.createElement('div');
    img.className = 'app-icon-img app-glass app-glass--' + (appId || 'default');
    if (isDock) img.classList.add('app-glass-sm');

    // 微信图标：额外虹彩层
    if (appId === 'wechat' || appId === 'wechat_dock') {
      var sheen = document.createElement('div');
      sheen.className = 'app-glass-sheen';
      img.appendChild(sheen);
      var depth = document.createElement('div');
      depth.className = 'app-glass-depth';
      img.appendChild(depth);
    }

    var inner = document.createElement('div');
    inner.className = 'app-glass-inner';

    var emojiEl = document.createElement('span');
    emojiEl.className = 'app-glass-emoji';
    emojiEl.textContent = emoji;
    inner.appendChild(emojiEl);
    img.appendChild(inner);

    var lbl = document.createElement('div');
    lbl.className = 'app-icon-label';
    lbl.textContent = label;

    icon.appendChild(img);
    icon.appendChild(lbl);

    icon.addEventListener('click', function (e) {
      e.preventDefault();
      if (onClick) onClick();
    });

    return icon;
  },

  /**
   * 设置页的输入字段
   */
  createInputField: function (label, id, value, placeholder, isPassword, isTextarea) {
    var group = document.createElement('div');
    group.className = 'setting-group';

    var lbl = document.createElement('label');
    lbl.className = 'setting-label';
    lbl.textContent = label;
    lbl.setAttribute('for', id);

    var input;
    if (isTextarea) {
      input = document.createElement('textarea');
      input.rows = 3;
    } else {
      input = document.createElement('input');
      input.type = isPassword ? 'password' : 'text';
    }
    input.id = id;
    input.className = 'setting-input';
    input.value = value || '';
    if (placeholder) input.placeholder = placeholder;

    group.appendChild(lbl);
    group.appendChild(input);
    return group;
  },

  /**
   * 格式化时间（聊天列表用）
   */
  _formatTime: function (timestamp) {
    if (!timestamp) return '';
    var date = new Date(timestamp);
    var now = new Date();
    var diff = now - date;

    // 一分钟内
    if (diff < 60000) return '刚刚';
    // 一小时内
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    // 今天
    if (date.toDateString() === now.toDateString()) {
      return this._pad(date.getHours()) + ':' + this._pad(date.getMinutes());
    }
    // 昨天
    var yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    }
    // 本年内
    if (date.getFullYear() === now.getFullYear()) {
      return (date.getMonth() + 1) + '/' + date.getDate();
    }
    return date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
  },

  /**
   * 完整时间格式（朋友圈用）
   */
  _formatFullTime: function (timestamp) {
    if (!timestamp) return '';
    var date = new Date(timestamp);
    var now = new Date();
    var diff = now - date;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) {
      if (date.toDateString() === now.toDateString()) {
        return '今天 ' + this._pad(date.getHours()) + ':' + this._pad(date.getMinutes());
      }
      var yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return '昨天 ' + this._pad(date.getHours()) + ':' + this._pad(date.getMinutes());
      }
    }
    return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日 ' + this._pad(date.getHours()) + ':' + this._pad(date.getMinutes());
  },

  _pad: function (n) {
    return n < 10 ? '0' + n : '' + n;
  },

  /**
   * 分割线
   */
  createDivider: function () {
    var div = document.createElement('div');
    div.className = 'divider';
    return div;
  },

  /**
   * 空状态提示
   */
  createEmptyState: function (message) {
    var el = document.createElement('div');
    el.className = 'empty-state';
    el.textContent = message;
    return el;
  },

  /**
   * 菜单行（用于发现页、我页）
   */
  createMenuRow: function (icon, label, sublabel, showArrow, onClick) {
    var row = document.createElement('div');
    row.className = 'menu-row';

    var left = document.createElement('div');
    left.className = 'menu-row-left';

    if (icon) {
      var iconEl = document.createElement('span');
      iconEl.className = 'menu-row-icon';
      iconEl.textContent = icon;
      left.appendChild(iconEl);
    }

    var labelEl = document.createElement('span');
    labelEl.className = 'menu-row-label';
    labelEl.textContent = label;
    left.appendChild(labelEl);

    row.appendChild(left);

    var right = document.createElement('div');
    right.className = 'menu-row-right';

    if (sublabel) {
      var sub = document.createElement('span');
      sub.className = 'menu-row-sublabel';
      sub.textContent = sublabel;
      right.appendChild(sub);
    }

    if (showArrow) {
      var arrow = document.createElement('span');
      arrow.className = 'menu-row-arrow';
      arrow.textContent = '›';
      right.appendChild(arrow);
    }

    row.appendChild(right);

    row.addEventListener('click', function (e) {
      e.preventDefault();
      if (onClick) onClick();
    });

    return row;
  },

  /**
   * 滚动容器
   */
  createScrollContainer: function () {
    var el = document.createElement('div');
    el.className = 'scroll-container';
    return el;
  }
};
