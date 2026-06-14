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

  render: function (container) {
    this._stopPoll();
    container.classList.add('app-screen');

    var params = MI.Router.currentParams || {};
    var scrollToId = params.momentId || null;

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
      MI.Moments._changeCover();
    });
    cover.appendChild(coverBtn);

    var profileBlock = document.createElement('div');
    profileBlock.className = 'moments-profile';

    var profileName = document.createElement('div');
    profileName.className = 'moments-profile-name';
    profileName.textContent = profile.name;

    var profileAvatar = MI.Components.createAvatar(profile.avatar, 'large');
    profileAvatar.classList.add('avatar-glass-border');

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
        var author = MI.Data.getAuthorById(post.authorId);
        var card = MI.Components.createMomentsPost(post, author);
        card.id = 'moment-' + post.id;
        if (scrollToId === post.id) {
          card.classList.add('moment-highlight');
        }
        this._bindPostActions(card, post);
        this._bindCommentActions(card, post);
        scroll.appendChild(card);
      }
    }

    container.appendChild(scroll);

    this._startPoll(container);

    if (scrollToId) {
      setTimeout(function () {
        var el = document.getElementById('moment-' + scrollToId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  },

  refreshIfVisible: function () {
    if (MI.Router.currentPage() === 'moments') {
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
      var fresh = MI.Components.createMomentsPost(post, author);
      fresh.id = 'moment-' + post.id;
      if (card.classList.contains('moment-highlight')) {
        fresh.classList.add('moment-highlight');
      }
      this._bindPostActions(fresh, post);
      this._bindCommentActions(fresh, post);
      card.parentNode.replaceChild(fresh, card);
    }

    scroll.scrollTop = scrollTop;
  },

  _createNotificationBar: function () {
    if (!MI.MomentNotifications) return null;
    var unread = MI.MomentNotifications.getUnread();
    if (unread.length === 0) return null;

    var self = this;
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
    summary.appendChild(MI.Components.icon('chevron-down', 'moments-notif-chevron'));

    var list = document.createElement('div');
    list.className = 'moments-notif-list';

    for (var i = 0; i < unread.length; i++) {
      (function (n) {
        var item = document.createElement('div');
        item.className = 'moments-notif-item';

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

        body.appendChild(line);
        body.appendChild(time);
        item.appendChild(body);

        item.addEventListener('click', function (e) {
          e.preventDefault();
          MI.MomentNotifications.markReadByMoment(n.momentId);
          bar.classList.remove('expanded');
          var el = document.getElementById('moment-' + n.momentId);
          if (el) {
            el.classList.add('moment-highlight');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(function () { el.classList.remove('moment-highlight'); }, 2000);
          }
          self._updateLive(document.querySelector('.app-screen') || document.getElementById('app'));
        });

        list.appendChild(item);
      })(unread[i]);
    }

    summary.addEventListener('click', function (e) {
      e.preventDefault();
      bar.classList.toggle('expanded');
    });

    bar.appendChild(summary);
    bar.appendChild(list);
    return bar;
  },

  _changeCover: function () {
    if (!MI.Media || !MI.Media.pickImage) {
      MI.Components.showToast('当前环境不支持图片上传');
      return;
    }
    MI.Media.pickImage(function (dataUrl) {
      var profile = MI.Storage.getProfile();
      profile.momentsCover = dataUrl;
      MI.Storage.setProfile(profile);
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
    if (goBackAfter) {
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
    }];

    if (comment.authorId === 'player') {
      items.push({
        label: '删除',
        icon: 'trash',
        danger: true,
        onClick: function () {
          self._confirmDeleteComment(post, commentId);
        }
      });
    }

    MI.Components.showActionSheet('评论', items);
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
