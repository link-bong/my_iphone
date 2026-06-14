/**
 * moments.js — 朋友圈（封面、角色互动、跳转定位）
 */
window.MI = window.MI || {};

MI.Moments = {
  _pollTimer: null,

  getById: function (id) {
    var moments = MI.Storage.getMoments();
    for (var i = 0; i < moments.length; i++) {
      if (moments[i].id === id) return moments[i];
    }
    return null;
  },

  getByAuthor: function (authorId) {
    var all = MI.Storage.normalizeMoments();
    var result = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].authorId === authorId) result.push(all[i]);
    }
    result.sort(function (a, b) { return b.timestamp - a.timestamp; });
    return result;
  },

  countByAuthor: function (authorId) {
    return this.getByAuthor(authorId).length;
  },

  getAuthorCover: function (authorId) {
    if (authorId === 'player') {
      return MI.Storage.getProfile().momentsCover || '';
    }
    var contact = MI.Data.getContactById(authorId);
    return contact && contact.momentsCover ? contact.momentsCover : '';
  },

  getAuthorInfo: function (authorId) {
    return MI.Data.getAuthorById(authorId);
  },

  render: function (container) {
    this._stopPoll();
    container.classList.add('app-screen');

    var params = MI.Router.currentParams || {};

    var worldviews = MI.Storage.getWorldviews();
    if (worldviews.length === 0) {
      container.appendChild(MI.Components.createNavBar('朋友圈', {
        showBack: true,
        onBack: function () { MI.Router.goBack(); }
      }));
      var scrollEmpty = MI.Components.createScrollContainer();
      scrollEmpty.appendChild(MI.Components.createEmptyState('请先创建世界观设定'));
      container.appendChild(scrollEmpty);
      return;
    }

    var navBar = MI.Components.createNavBar('朋友圈', {
      showBack: true,
      onBack: function () { MI.Router.goBack(); },
      rightIcon: 'pen-to-square',
      onRight: function () {
        MI.Router.navigateTo('moment-compose');
      }
    });
    container.appendChild(navBar);

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('moments-scroll');

    var profile = MI.Storage.getProfile();
    var cover = document.createElement('div');
    cover.className = 'moments-cover';
    if (profile.momentsCover && MI.Media && MI.Media.isImage(profile.momentsCover)) {
      cover.style.backgroundImage = 'url(' + profile.momentsCover + ')';
      cover.style.backgroundSize = 'cover';
      cover.style.backgroundPosition = 'center';
    }

    var coverBtn = document.createElement('button');
    coverBtn.type = 'button';
    coverBtn.className = 'moments-cover-change-btn';
    coverBtn.appendChild(MI.Components.buttonContent('image', '更换封面'));
    coverBtn.addEventListener('click', function (e) {
      e.preventDefault();
      MI.Moments._changeCover('player');
    });
    cover.appendChild(coverBtn);

    var profileBlock = document.createElement('div');
    profileBlock.className = 'moments-profile';

    var profileName = document.createElement('div');
    profileName.className = 'moments-profile-name';
    profileName.textContent = profile.name;

    var profileAvatar = MI.Components.createAvatar(profile.avatar, 'large');
    profileAvatar.classList.add('avatar-glass-border', 'moments-avatar-clickable');
    profileAvatar.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      MI.Router.navigateTo('moment-author', { authorId: 'player' });
    });

    profileBlock.appendChild(profileName);
    profileBlock.appendChild(profileAvatar);
    cover.appendChild(profileBlock);
    scroll.appendChild(cover);

    var spacer = document.createElement('div');
    spacer.className = 'moments-spacer';
    scroll.appendChild(spacer);

    var notifBar = this._createNotificationBar();
    if (notifBar) scroll.appendChild(notifBar);

    var moments = MI.Storage.normalizeMoments();
    moments.sort(function (a, b) { return b.timestamp - a.timestamp; });

    if (moments.length === 0) {
      scroll.appendChild(MI.Components.createEmptyState('暂无朋友圈\n点击右上角发表'));
    } else {
      for (var i = 0; i < moments.length; i++) {
        var post = moments[i];
        var card = this._buildPostCard(post, { bindAuthor: true, bindOpenDetail: true });
        scroll.appendChild(card);
      }
    }

    container.appendChild(scroll);

    this._startPoll(container);
  },

  /** 单条朋友圈详情页 */
  renderDetail: function (container) {
    this._stopPoll();
    container.classList.add('app-screen');

    var params = MI.Router.currentParams || {};
    var post = params.momentId ? this.getById(params.momentId) : null;
    if (!post) {
      container.appendChild(MI.Components.createNavBar('朋友圈详情', {
        showBack: true,
        onBack: function () { MI.Router.goBack(); }
      }));
      container.appendChild(MI.Components.createEmptyState('朋友圈不存在或已删除'));
      return;
    }

    var author = this.getAuthorInfo(post.authorId);
    container.appendChild(MI.Components.createNavBar(author ? author.name : '朋友圈详情', {
      showBack: true,
      onBack: function () { MI.Router.goBack(); },
      rightIcon: 'pen',
      onRight: function () {
        MI.Router.navigateTo('moment-edit', { momentId: post.id });
      }
    }));

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('moments-scroll', 'moment-detail-scroll');

    var card = this._buildPostCard(post, { bindAuthor: true, bindOpenDetail: false });
    scroll.appendChild(card);
    container.appendChild(scroll);

    if (params.commentId) {
      setTimeout(function () {
        var line = scroll.querySelector('[data-comment-id="' + params.commentId + '"]');
        if (line) line.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  },

  /** 作者朋友圈主页（自己或角色） */
  renderAuthor: function (container) {
    this._stopPoll();
    container.classList.add('app-screen');

    var params = MI.Router.currentParams || {};
    var authorId = params.authorId || 'player';
    var author = this.getAuthorInfo(authorId);
    if (!author) {
      container.appendChild(MI.Components.createNavBar('朋友圈', {
        showBack: true,
        onBack: function () { MI.Router.goBack(); }
      }));
      container.appendChild(MI.Components.createEmptyState('用户不存在'));
      return;
    }

    var isPlayer = authorId === 'player';
    var navBar = MI.Components.createNavBar(isPlayer ? '我的朋友圈' : (author.name + ' 的朋友圈'), {
      showBack: true,
      onBack: function () { MI.Router.goBack(); }
    });
    if (isPlayer) {
      navBar = MI.Components.createNavBar('我的朋友圈', {
        showBack: true,
        onBack: function () { MI.Router.goBack(); },
        rightIcon: 'pen-to-square',
        onRight: function () { MI.Router.navigateTo('moment-compose'); }
      });
    }
    container.appendChild(navBar);

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('moments-scroll');

    scroll.appendChild(this._createAuthorCover(authorId, author));
    scroll.appendChild(this._createAuthorSpacer());

    var posts = this.getByAuthor(authorId);
    var countEl = document.createElement('div');
    countEl.className = 'moments-author-count';
    countEl.textContent = '共 ' + posts.length + ' 条朋友圈';
    scroll.appendChild(countEl);

    if (posts.length === 0) {
      scroll.appendChild(MI.Components.createEmptyState(isPlayer ? '暂无朋友圈\n点击右上角发表' : '暂无朋友圈'));
    } else {
      for (var i = 0; i < posts.length; i++) {
        scroll.appendChild(this._buildPostCard(posts[i], { bindAuthor: false, bindOpenDetail: true }));
      }
    }

    container.appendChild(scroll);
  },

  _createAuthorCover: function (authorId, author) {
    var coverUrl = this.getAuthorCover(authorId);
    var wrap = document.createElement('div');
    wrap.className = 'moments-cover';

    if (coverUrl && MI.Media && MI.Media.isImage(coverUrl)) {
      wrap.style.backgroundImage = 'url(' + coverUrl + ')';
      wrap.style.backgroundSize = 'cover';
      wrap.style.backgroundPosition = 'center';
    }

    var coverBtn = document.createElement('button');
    coverBtn.type = 'button';
    coverBtn.className = 'moments-cover-change-btn';
    coverBtn.appendChild(MI.Components.buttonContent('image', '更换封面'));
    coverBtn.addEventListener('click', function (e) {
      e.preventDefault();
      MI.Moments._changeCover(authorId);
    });
    wrap.appendChild(coverBtn);

    var profileBlock = document.createElement('div');
    profileBlock.className = 'moments-profile';

    var profileName = document.createElement('div');
    profileName.className = 'moments-profile-name';
    profileName.textContent = author.name;

    var profileAvatar = MI.Components.createAvatar(author.avatar, 'large', author);
    profileAvatar.classList.add('avatar-glass-border');

    profileBlock.appendChild(profileName);
    profileBlock.appendChild(profileAvatar);
    wrap.appendChild(profileBlock);
    return wrap;
  },

  _createAuthorSpacer: function () {
    var spacer = document.createElement('div');
    spacer.className = 'moments-spacer';
    return spacer;
  },

  _buildPostCard: function (post, options) {
    options = options || {};
    var author = this.getAuthorInfo(post.authorId);
    var card = MI.Components.createMomentsPost(post, author);
    card.id = 'moment-' + post.id;

    if (options.bindAuthor) this._bindAuthorClick(card, post);
    if (options.bindOpenDetail) this._bindOpenDetail(card, post);

    this._bindPostActions(card, post);
    this._bindCommentActions(card, post);
    return card;
  },

  _bindAuthorClick: function (card, post) {
    var header = card.querySelector('.post-header');
    if (!header) return;
    var avatar = header.querySelector('.avatar');
    var nameEl = header.querySelector('.post-author-name');
    function go() {
      MI.Router.navigateTo('moment-author', { authorId: post.authorId });
    }
    if (avatar) {
      avatar.classList.add('moments-avatar-clickable');
      avatar.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        go();
      });
    }
    if (nameEl) {
      nameEl.classList.add('post-author-clickable');
      nameEl.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        go();
      });
    }
  },

  _bindOpenDetail: function (card, post) {
    var parts = card.querySelectorAll('.post-text, .post-images, .post-timestamp');
    for (var i = 0; i < parts.length; i++) {
      parts[i].classList.add('post-open-detail');
      parts[i].addEventListener('click', function (e) {
        e.preventDefault();
        MI.Router.navigateTo('moment-detail', { momentId: post.id });
      });
    }
  },

  /** 互动消息列表页（微信式：查看全部后点进对应朋友圈） */
  renderNotifications: function (container) {
    container.classList.add('app-screen');

    var unreadCount = MI.MomentNotifications ? MI.MomentNotifications.getUnreadCount() : 0;
    var navTitle = unreadCount > 0 ? ('消息 (' + unreadCount + ')') : '消息';

    container.appendChild(MI.Components.createNavBar(navTitle, {
      showBack: true,
      onBack: function () { MI.Router.goBack(); }
    }));

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('moment-notif-page');

    if (!MI.MomentNotifications) {
      scroll.appendChild(MI.Components.createEmptyState('暂无互动消息'));
      container.appendChild(scroll);
      return;
    }

    var list = MI.MomentNotifications.getAllSorted();
    if (list.length === 0) {
      scroll.appendChild(MI.Components.createEmptyState('暂无互动消息'));
    } else {
      for (var i = 0; i < list.length; i++) {
        scroll.appendChild(this._createNotificationItem(list[i]));
      }
    }

    container.appendChild(scroll);
  },

  /** 从互动消息跳转到朋友圈详情页 */
  openFromNotification: function (notification) {
    if (!notification) return;

    if (MI.MomentNotifications) {
      MI.MomentNotifications.markReadById(notification.id);
    }

    MI.Router.navigateTo('moment-detail', {
      momentId: notification.momentId,
      commentId: notification.commentId || null
    });
  },

  _createNotificationItem: function (n) {
    var self = this;
    var item = document.createElement('div');
    item.className = 'moments-notif-item' + (n.read ? ' moments-notif-read' : '');

    var actorInfo = MI.Data.getAuthorById(n.actorId);
    item.appendChild(MI.Components.createAvatar(actorInfo ? actorInfo.avatar : '😊', 'small', actorInfo));

    var body = document.createElement('div');
    body.className = 'moments-notif-item-body';

    var line = document.createElement('div');
    line.className = 'moments-notif-item-text';
    line.textContent = MI.MomentNotifications.formatText(n);

    var time = document.createElement('div');
    time.className = 'moments-notif-item-time';
    time.textContent = MI.Components._formatFullTime(n.timestamp);

    var preview = MI.Moments.getById(n.momentId);
    if (preview && preview.content) {
      var excerpt = document.createElement('div');
      excerpt.className = 'moments-notif-item-preview';
      var previewText = preview.content.slice(0, 48);
      if (preview.content.length > 48) previewText += '…';
      excerpt.textContent = previewText;
      body.appendChild(line);
      body.appendChild(excerpt);
    } else {
      body.appendChild(line);
    }
    body.appendChild(time);
    item.appendChild(body);

    if (!n.read) {
      var dot = document.createElement('span');
      dot.className = 'moments-notif-item-dot';
      item.appendChild(dot);
    }

    item.addEventListener('click', function (e) {
      e.preventDefault();
      self.openFromNotification(n);
    });

    return item;
  },

  refreshIfVisible: function () {
    var page = MI.Router.currentPage();
    if (page === 'moments' || page === 'moment-notifications' ||
        page === 'moment-detail' || page === 'moment-author') {
      MI.Router.render();
    }
  },

  _stopPoll: function () {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  },

  _startPoll: function (container) {
    var self = this;
    this._pollTimer = setInterval(function () {
      if (MI.Router.currentPage() !== 'moments') {
        self._stopPoll();
        return;
      }
      self._updateLive(container);
    }, 2500);
  },

  _updateLive: function (container) {
    var scroll = container.querySelector('.moments-scroll');
    if (!scroll) return;

    var oldBar = scroll.querySelector('.moments-notifications');
    var newBar = this._createNotificationBar();
    if (oldBar) {
      if (newBar) oldBar.parentNode.replaceChild(newBar, oldBar);
      else oldBar.parentNode.removeChild(oldBar);
    } else if (newBar) {
      var spacer = scroll.querySelector('.moments-spacer');
      if (spacer && spacer.nextSibling) {
        scroll.insertBefore(newBar, spacer.nextSibling);
      } else {
        scroll.appendChild(newBar);
      }
    }

    if (document.querySelector('.post-comment-composer')) return;

    var scrollTop = scroll.scrollTop;
    var moments = MI.Storage.normalizeMoments();
    moments.sort(function (a, b) { return b.timestamp - a.timestamp; });
    for (var i = 0; i < moments.length; i++) {
      var post = moments[i];
      var card = document.getElementById('moment-' + post.id);
      if (!card) continue;
      var author = MI.Data.getAuthorById(post.authorId);
      var fresh = this._buildPostCard(post, { bindAuthor: true, bindOpenDetail: true });
      fresh.id = 'moment-' + post.id;
      if (card.classList.contains('moment-highlight')) {
        fresh.classList.add('moment-highlight');
      }
      card.parentNode.replaceChild(fresh, card);
    }

    scroll.scrollTop = scrollTop;
  },

  _createNotificationBar: function () {
    if (!MI.MomentNotifications) return null;
    var unread = MI.MomentNotifications.getUnread();
    if (unread.length === 0) return null;

    var bar = document.createElement('div');
    bar.className = 'moments-notifications';

    var summary = document.createElement('div');
    summary.className = 'moments-notif-summary';

    var avatars = document.createElement('div');
    avatars.className = 'moments-notif-avatars';
    var seenActors = {};
    for (var a = 0; a < unread.length && avatars.childNodes.length < 3; a++) {
      if (seenActors[unread[a].actorId]) continue;
      seenActors[unread[a].actorId] = true;
      var actor = MI.Data.getAuthorById(unread[a].actorId);
      avatars.appendChild(MI.Components.createAvatar(actor ? actor.avatar : '😊', 'small', actor));
    }

    var text = document.createElement('div');
    text.className = 'moments-notif-text';
    text.textContent = unread.length + ' 条新消息';

    summary.appendChild(avatars);
    summary.appendChild(text);
    summary.appendChild(MI.Components.icon('chevron-right', 'moments-notif-chevron'));

    summary.addEventListener('click', function (e) {
      e.preventDefault();
      MI.Router.navigateTo('moment-notifications');
    });

    bar.appendChild(summary);
    return bar;
  },

  _changeCover: function (authorId) {
    authorId = authorId || 'player';
    if (!MI.Media || !MI.Media.pickImage) {
      MI.Components.showToast('当前环境不支持图片上传');
      return;
    }
    MI.Media.pickImage(function (dataUrl) {
      if (authorId === 'player') {
        var profile = MI.Storage.getProfile();
        profile.momentsCover = dataUrl;
        MI.Storage.setProfile(profile);
      } else {
        var contacts = MI.Storage.getContacts();
        for (var i = 0; i < contacts.length; i++) {
          if (contacts[i].id === authorId) {
            contacts[i].momentsCover = dataUrl;
            break;
          }
        }
        MI.Storage.setContacts(contacts);
      }
      MI.Router.render();
    }, function (err) {
      MI.Components.showToast(err || '上传失败');
    });
  },

  renderCompose: function (container) {
    this._renderForm(container, null);
  },

  renderEdit: function (container) {
    var params = MI.Router.currentParams || {};
    var post = params.momentId ? this.getById(params.momentId) : null;
    if (!post) {
      container.classList.add('app-screen');
      container.appendChild(MI.Components.createNavBar('编辑朋友圈', {
        showBack: true,
        onBack: function () { MI.Router.goBack(); }
      }));
      container.appendChild(MI.Components.createEmptyState('朋友圈不存在或已删除'));
      return;
    }
    this._renderForm(container, post);
  },

  _renderForm: function (container, existing) {
    var isEdit = !!existing;
    var isCharacterPost = isEdit && existing.authorId !== 'player';
    var author = isEdit ? MI.Data.getAuthorById(existing.authorId) : null;

    container.classList.add('app-screen');

    var navTitle = isEdit
      ? (isCharacterPost ? '编辑 · ' + (author ? author.name : '角色') : '编辑朋友圈')
      : '发表朋友圈';

    var navBar = MI.Components.createNavBar(navTitle, {
      showBack: true,
      onBack: function () { MI.Router.goBack(); }
    });
    container.appendChild(navBar);

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('settings-scroll');

    if (isCharacterPost) {
      var hint = document.createElement('div');
      hint.className = 'form-hint';
      hint.textContent = '你正在编辑角色「' + (author ? author.name : '') + '」的朋友圈内容。';
      scroll.appendChild(hint);
    }

    var selectedWv = existing
      ? (existing.worldviewIds || (existing.worldviewId ? [existing.worldviewId] : []))
      : [];
    scroll.appendChild(MI.Components.createWorldviewMultiSelect('moment-worldviews', selectedWv));
    scroll.appendChild(MI.Components.createInputField('内容', 'moment-content', existing ? existing.content : '', '分享你的想法...', false, true));
    scroll.appendChild(MI.Components.createImageUploadField('moment-images', existing ? existing.images : []));

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn-glass btn-glass-primary';
    saveBtn.appendChild(MI.Components.buttonContent('paper-plane', isEdit ? '保存修改' : '发表'));
    saveBtn.addEventListener('click', function () {
      if (isEdit) MI.Moments._update(existing.id);
      else MI.Moments._publish();
    });
    scroll.appendChild(saveBtn);

    if (isEdit) {
      var delBtn = document.createElement('button');
      delBtn.className = 'btn-glass btn-glass-danger';
      delBtn.appendChild(MI.Components.buttonContent('trash', '删除朋友圈'));
      delBtn.addEventListener('click', function () {
        MI.Moments._confirmDelete(existing.id, true);
      });
      scroll.appendChild(delBtn);
    }

    container.appendChild(scroll);
  },

  _collectForm: function () {
    var worldviewIds = MI.Components.getSelectedWorldviewIds('moment-worldviews');
    var content = document.getElementById('moment-content').value.trim();
    var images = [];
    try {
      images = JSON.parse(document.getElementById('moment-images').value || '[]');
    } catch (e) {
      images = [];
    }
    return { worldviewIds: worldviewIds, content: content, images: images };
  },

  _publish: function () {
    var data = this._collectForm();
    if (data.worldviewIds.length === 0) {
      MI.Components.showToast('请至少选择一个世界观');
      return;
    }
    if (!data.content) {
      MI.Components.showToast('请填写朋友圈内容');
      return;
    }

    var moment = {
      id: MI.Data.genId('m'),
      authorId: 'player',
      worldviewIds: data.worldviewIds,
      content: data.content,
      images: data.images,
      timestamp: Date.now(),
      likes: [],
      comments: []
    };

    var moments = MI.Storage.getMoments();
    moments.unshift(moment);
    MI.Storage.setMoments(moments);

    MI.Components.showToast('发表成功，好友们可能会来互动…');
    MI.Router.goBack();

    if (MI.MomentEngine) {
      MI.MomentEngine.reactToPlayerPost(moment.id, function () {
        MI.Components.showToast('朋友圈有新的点赞或评论');
      });
    }
  },

  _update: function (momentId) {
    var data = this._collectForm();
    if (data.worldviewIds.length === 0) {
      MI.Components.showToast('请至少选择一个世界观');
      return;
    }
    if (!data.content) {
      MI.Components.showToast('请填写朋友圈内容');
      return;
    }

    var moments = MI.Storage.getMoments();
    for (var i = 0; i < moments.length; i++) {
      if (moments[i].id === momentId) {
        moments[i].worldviewIds = data.worldviewIds;
        moments[i].content = data.content;
        moments[i].images = data.images;
        delete moments[i].worldviewId;
        break;
      }
    }
    MI.Storage.setMoments(moments);
    MI.Router.goBack();
  },

  _confirmDelete: function (momentId, goBackAfter) {
    var post = this.getById(momentId);
    var author = post ? MI.Data.getAuthorById(post.authorId) : null;
    var msg = post && post.authorId !== 'player'
      ? '确定删除「' + (author ? author.name : '角色') + '」的这条朋友圈？'
      : '确定删除这条朋友圈？';

    MI.Components.showConfirmDialog('删除朋友圈', msg, function () {
      MI.Moments._delete(momentId, goBackAfter);
    }, null, { danger: true, confirmText: '删除' });
  },

  _delete: function (momentId, goBackAfter) {
    var moments = MI.Storage.getMoments();
    var filtered = [];
    for (var i = 0; i < moments.length; i++) {
      if (moments[i].id !== momentId) filtered.push(moments[i]);
    }
    MI.Storage.setMoments(filtered);
    var page = MI.Router.currentPage();
    if (goBackAfter || page === 'moment-detail' || page === 'moment-edit') {
      MI.Router.goBack();
    } else {
      MI.Router.render();
    }
  },

  _bindPostActions: function (card, post) {
    var self = this;
    var actionBar = document.createElement('div');
    actionBar.className = 'post-actions';

    var likeBtn = document.createElement('button');
    likeBtn.className = 'post-action-btn';
    likeBtn.appendChild(MI.Components.buttonContent('heart', '赞'));
    likeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      MI.Moments._toggleLike(post);
      MI.Router.render();
    });

    var commentBtn = document.createElement('button');
    commentBtn.className = 'post-action-btn';
    commentBtn.appendChild(MI.Components.buttonContent('comment', '评论'));
    commentBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      self._toggleCommentComposer(card, post);
    });

    var editBtn = document.createElement('button');
    editBtn.className = 'post-action-btn';
    editBtn.appendChild(MI.Components.buttonContent('pen', '编辑'));
    editBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      MI.Router.navigateTo('moment-edit', { momentId: post.id });
    });

    var delBtn = document.createElement('button');
    delBtn.className = 'post-action-btn post-action-danger';
    delBtn.appendChild(MI.Components.buttonContent('trash', '删除'));
    delBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      MI.Moments._confirmDelete(post.id, false);
    });

    actionBar.appendChild(likeBtn);
    actionBar.appendChild(commentBtn);
    actionBar.appendChild(editBtn);
    actionBar.appendChild(delBtn);
    card.appendChild(actionBar);
  },

  _toggleCommentComposer: function (card, post, replyToCommentId) {
    var existing = card.querySelector('.post-comment-composer');
    if (existing && !replyToCommentId) {
      existing.parentNode.removeChild(existing);
      return;
    }

    var composers = document.querySelectorAll('.post-comment-composer');
    for (var c = 0; c < composers.length; c++) {
      if (composers[c].parentNode) composers[c].parentNode.removeChild(composers[c]);
    }

    var replyToName = '';
    if (replyToCommentId) {
      for (var i = 0; i < (post.comments || []).length; i++) {
        if (post.comments[i].id === replyToCommentId) {
          var replyAuthor = MI.Data.getAuthorById(post.comments[i].authorId);
          replyToName = replyAuthor ? replyAuthor.name : '';
          break;
        }
      }
    }

    var composer = document.createElement('div');
    composer.className = 'post-comment-composer';
    if (replyToCommentId) composer.setAttribute('data-reply-to', replyToCommentId);

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'post-comment-input';
    input.placeholder = replyToName ? ('回复 ' + replyToName + '…') : '写评论…';
    input.maxLength = 500;

    var sendBtn = document.createElement('button');
    sendBtn.type = 'button';
    sendBtn.className = 'post-comment-send';
    sendBtn.textContent = '发送';

    function submit() {
      var text = input.value.trim();
      if (!text) {
        MI.Components.showToast('请输入评论内容');
        return;
      }
      MI.Moments._addComment(post, text, replyToCommentId || null);
    }

    sendBtn.addEventListener('click', function (e) {
      e.preventDefault();
      submit();
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    });

    composer.appendChild(input);
    composer.appendChild(sendBtn);
    card.appendChild(composer);
    setTimeout(function () { input.focus(); }, 50);
  },

  _bindCommentActions: function (card, post) {
    var self = this;
    var lines = card.querySelectorAll('.comment-line[data-comment-id]');
    for (var i = 0; i < lines.length; i++) {
      (function (line) {
        var commentId = line.getAttribute('data-comment-id');
        line.addEventListener('click', function (e) {
          e.stopPropagation();
          self._showCommentMenu(card, post, commentId);
        });
      })(lines[i]);
    }
  },

  _findComment: function (post, commentId) {
    for (var i = 0; i < (post.comments || []).length; i++) {
      if (post.comments[i].id === commentId) return post.comments[i];
    }
    return null;
  },

  _showCommentMenu: function (card, post, commentId) {
    var self = this;
    var comment = this._findComment(post, commentId);
    if (!comment) return;

    var items = [{
      label: '回复',
      icon: 'reply',
      onClick: function () {
        self._toggleCommentComposer(card, post, commentId);
      }
    }, {
      label: '编辑',
      icon: 'pen',
      onClick: function () {
        self._editComment(post.id, commentId);
      }
    }, {
      label: '删除',
      icon: 'trash',
      danger: true,
      onClick: function () {
        self._confirmDeleteComment(post, commentId);
      }
    }];

    MI.Components.showActionSheet('评论', items);
  },

  _editComment: function (momentId, commentId) {
    var post = this.getById(momentId);
    if (!post) return;
    var comment = this._findComment(post, commentId);
    if (!comment) return;

    MI.Components.showPromptDialog('编辑评论', comment.content, function (text) {
      var moments = MI.Storage.getMoments();
      for (var i = 0; i < moments.length; i++) {
        if (moments[i].id !== momentId) continue;
        if (!moments[i].comments) break;
        for (var j = 0; j < moments[i].comments.length; j++) {
          if (moments[i].comments[j].id === commentId) {
            moments[i].comments[j].content = text;
            break;
          }
        }
        break;
      }
      MI.Storage.setMoments(moments);
      MI.Router.render();
    }, null, {
      validate: function (val) {
        if (!val || !val.trim()) return '评论不能为空';
        return null;
      }
    });
  },

  _confirmDeleteComment: function (post, commentId) {
    MI.Components.showConfirmDialog('删除评论', '确定删除这条评论？', function () {
      MI.Moments._deleteComment(post.id, commentId);
    }, null, { danger: true, confirmText: '删除' });
  },

  _deleteComment: function (momentId, commentId) {
    var moments = MI.Storage.getMoments();
    for (var i = 0; i < moments.length; i++) {
      if (moments[i].id !== momentId) continue;
      if (!moments[i].comments) break;

      var removeIds = {};
      removeIds[commentId] = true;
      var changed = true;
      while (changed) {
        changed = false;
        for (var j = 0; j < moments[i].comments.length; j++) {
          var cm = moments[i].comments[j];
          if (removeIds[cm.id]) continue;
          if (cm.replyTo && removeIds[cm.replyTo]) {
            removeIds[cm.id] = true;
            changed = true;
          }
        }
      }

      var kept = [];
      for (var k = 0; k < moments[i].comments.length; k++) {
        if (!removeIds[moments[i].comments[k].id]) {
          kept.push(moments[i].comments[k]);
        }
      }
      moments[i].comments = kept;
      break;
    }
    MI.Storage.setMoments(moments);
    MI.Router.render();
  },

  _toggleLike: function (post) {
    var moments = MI.Storage.getMoments();
    for (var i = 0; i < moments.length; i++) {
      if (moments[i].id === post.id) {
        if (!moments[i].likes) moments[i].likes = [];
        var idx = moments[i].likes.indexOf('player');
        if (idx >= 0) moments[i].likes.splice(idx, 1);
        else moments[i].likes.push('player');
        break;
      }
    }
    MI.Storage.setMoments(moments);
  },

  _addComment: function (post, content, replyToCommentId) {
    var commentId = MI.Data.genId('cm');
    var moments = MI.Storage.getMoments();
    var savedPost = null;
    var playerComment = null;

    for (var i = 0; i < moments.length; i++) {
      if (moments[i].id === post.id) {
        if (!moments[i].comments) moments[i].comments = [];
        playerComment = {
          id: commentId,
          authorId: 'player',
          content: content,
          timestamp: Date.now(),
          replyTo: replyToCommentId || null
        };
        moments[i].comments.push(playerComment);
        savedPost = moments[i];
        break;
      }
    }
    MI.Storage.setMoments(moments);
    MI.Router.render();

    if (savedPost && playerComment && MI.MomentEngine &&
        MI.MomentEngine.canReplyToPlayerComment(savedPost, commentId)) {
      MI.MomentEngine.replyToPlayerComment(post.id, commentId, function () {
        MI.Router.render();
      });
    }
  }
};
