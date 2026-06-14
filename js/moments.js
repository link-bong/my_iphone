/**
 * moments.js — 朋友圈（按世界观隔离）
 */
window.MI = window.MI || {};

MI.Moments = {
  render: function (container) {
    container.classList.add('app-screen');

    var worldviews = MI.Storage.getWorldviews();
    if (worldviews.length === 0) {
      var navEmpty = MI.Components.createNavBar('朋友圈', {
        showBack: true,
        onBack: function () { MI.Router.goBack(); }
      });
      container.appendChild(navEmpty);
      var scrollEmpty = MI.Components.createScrollContainer();
      scrollEmpty.appendChild(MI.Components.createEmptyState('请先创建世界观设定'));
      container.appendChild(scrollEmpty);
      return;
    }

    var activeWvId = MI.Storage.getActiveWorldviewId();
    if (!activeWvId && worldviews.length > 0) {
      activeWvId = worldviews[0].id;
      MI.Storage.setActiveWorldviewId(activeWvId);
    }

    var navBar = MI.Components.createNavBar('朋友圈', {
      showBack: true,
      onBack: function () { MI.Router.goBack(); },
      rightText: '发表',
      onRight: function () {
        MI.Router.navigateTo('moment-compose', { worldviewId: activeWvId });
      }
    });
    container.appendChild(navBar);

    var wvBar = document.createElement('div');
    wvBar.className = 'worldview-switcher';
    var wvSelect = document.createElement('select');
    wvSelect.className = 'worldview-select';
    for (var w = 0; w < worldviews.length; w++) {
      var opt = document.createElement('option');
      opt.value = worldviews[w].id;
      opt.textContent = worldviews[w].name;
      if (worldviews[w].id === activeWvId) opt.selected = true;
      wvSelect.appendChild(opt);
    }
    wvSelect.addEventListener('change', function () {
      MI.Storage.setActiveWorldviewId(wvSelect.value);
      MI.Router.render();
    });
    wvBar.appendChild(wvSelect);
    container.appendChild(wvBar);

    var scroll = MI.Components.createScrollContainer();

    var cover = document.createElement('div');
    cover.className = 'moments-cover';

    var profileBlock = document.createElement('div');
    profileBlock.className = 'moments-profile';

    var profileName = document.createElement('div');
    profileName.className = 'moments-profile-name';
    profileName.textContent = MI.Storage.getProfile().name;

    var profileAvatar = MI.Components.createAvatar(MI.Storage.getProfile().avatar, 'large');
    profileAvatar.classList.add('avatar-glass-border');

    profileBlock.appendChild(profileName);
    profileBlock.appendChild(profileAvatar);
    cover.appendChild(profileBlock);
    scroll.appendChild(cover);

    var spacer = document.createElement('div');
    spacer.className = 'moments-spacer';
    scroll.appendChild(spacer);

    var moments = MI.Storage.getMomentsByWorldview(activeWvId);
    moments.sort(function (a, b) { return b.timestamp - a.timestamp; });

    if (moments.length === 0) {
      scroll.appendChild(MI.Components.createEmptyState('这个世界观下暂无朋友圈\n点击右上角「发表」'));
    } else {
      for (var i = 0; i < moments.length; i++) {
        var post = moments[i];
        var author = MI.Data.getAuthorById(post.authorId);
        var card = MI.Components.createMomentsPost(post, author);
        this._bindPostActions(card, post);
        scroll.appendChild(card);
      }
    }

    container.appendChild(scroll);
  },

  renderCompose: function (container) {
    var params = MI.Router.currentParams || {};
    var worldviews = MI.Storage.getWorldviews();

    container.classList.add('app-screen');

    var navBar = MI.Components.createNavBar('发表朋友圈', {
      showBack: true,
      onBack: function () { MI.Router.goBack(); }
    });
    container.appendChild(navBar);

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('settings-scroll');

    var wvGroup = document.createElement('div');
    wvGroup.className = 'setting-group';
    var wvLbl = document.createElement('label');
    wvLbl.className = 'setting-label';
    wvLbl.textContent = '世界观';
    wvGroup.appendChild(wvLbl);

    var wvSelect = document.createElement('select');
    wvSelect.id = 'moment-worldview';
    wvSelect.className = 'setting-input';
    for (var i = 0; i < worldviews.length; i++) {
      var opt = document.createElement('option');
      opt.value = worldviews[i].id;
      opt.textContent = worldviews[i].name;
      if (worldviews[i].id === (params.worldviewId || MI.Storage.getActiveWorldviewId())) {
        opt.selected = true;
      }
      wvSelect.appendChild(opt);
    }
    wvGroup.appendChild(wvSelect);
    scroll.appendChild(wvGroup);

    scroll.appendChild(MI.Components.createInputField('内容', 'moment-content', '', '分享你的想法...', false, true));
    scroll.appendChild(MI.Components.createInputField('图片（emoji，逗号分隔）', 'moment-images', '', '如：🌸,🍰,☕', false, false));

    var publishBtn = document.createElement('button');
    publishBtn.className = 'btn-glass btn-glass-primary';
    publishBtn.textContent = '发表';
    publishBtn.addEventListener('click', function () {
      MI.Moments._publish();
    });
    scroll.appendChild(publishBtn);

    container.appendChild(scroll);
  },

  _publish: function () {
    var worldviewId = document.getElementById('moment-worldview').value;
    var content = document.getElementById('moment-content').value.trim();
    var imagesRaw = document.getElementById('moment-images').value.trim();

    if (!content) {
      alert('请填写朋友圈内容');
      return;
    }

    var images = [];
    if (imagesRaw) {
      var parts = imagesRaw.split(/[,，]/);
      for (var i = 0; i < parts.length; i++) {
        var img = parts[i].trim();
        if (img) images.push(img);
      }
    }

    var moment = {
      id: MI.Data.genId('m'),
      authorId: 'player',
      worldviewId: worldviewId,
      content: content,
      images: images,
      timestamp: Date.now(),
      likes: [],
      comments: []
    };

    var moments = MI.Storage.getMoments();
    moments.unshift(moment);
    MI.Storage.setMoments(moments);
    MI.Storage.setActiveWorldviewId(worldviewId);
    MI.Router.goBack();
  },

  _bindPostActions: function (card, post) {
    var actionBar = document.createElement('div');
    actionBar.className = 'post-actions';

    var likeBtn = document.createElement('button');
    likeBtn.className = 'post-action-btn';
    likeBtn.textContent = '❤️ 赞';
    likeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      MI.Moments._toggleLike(post);
      MI.Router.render();
    });

    var commentBtn = document.createElement('button');
    commentBtn.className = 'post-action-btn';
    commentBtn.textContent = '💬 评论';
    commentBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var text = prompt('输入评论：');
      if (text && text.trim()) {
        MI.Moments._addComment(post, text.trim());
        MI.Router.render();
      }
    });

    actionBar.appendChild(likeBtn);
    actionBar.appendChild(commentBtn);
    card.appendChild(actionBar);
  },

  _toggleLike: function (post) {
    var moments = MI.Storage.getMoments();
    for (var i = 0; i < moments.length; i++) {
      if (moments[i].id === post.id) {
        if (!moments[i].likes) moments[i].likes = [];
        var idx = moments[i].likes.indexOf('player');
        if (idx >= 0) {
          moments[i].likes.splice(idx, 1);
        } else {
          moments[i].likes.push('player');
        }
        break;
      }
    }
    MI.Storage.setMoments(moments);
  },

  _addComment: function (post, content) {
    var moments = MI.Storage.getMoments();
    for (var i = 0; i < moments.length; i++) {
      if (moments[i].id === post.id) {
        if (!moments[i].comments) moments[i].comments = [];
        moments[i].comments.push({
          id: MI.Data.genId('cm'),
          authorId: 'player',
          content: content,
          timestamp: Date.now()
        });
        break;
      }
    }
    MI.Storage.setMoments(moments);
  }
};
