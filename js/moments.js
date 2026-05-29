/**
 * moments.js — 朋友圈页面
 * 封面 + 帖子列表（文字、图片、点赞、评论）
 */
window.MI = window.MI || {};

MI.Moments = {
  render: function (container) {
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';
    container.style.background = '#F2F2F7';

    // 顶部导航
    var navBar = MI.Components.createNavBar('朋友圈', true, null, function () {
      MI.Router.goBack();
    }, null);
    navBar.style.background = '#EDEDED';
    container.appendChild(navBar);

    // 可滚动内容
    var scroll = MI.Components.createScrollContainer();

    // 封面区
    var cover = document.createElement('div');
    cover.className = 'moments-cover';
    cover.style.cssText = 'height:260px;background:linear-gradient(135deg,#667eea,#764ba2);position:relative;flex-shrink:0;';

    // 用户头像和名字（绝对定位在封面底部）
    var profileBlock = document.createElement('div');
    profileBlock.className = 'moments-profile';
    profileBlock.style.cssText = 'position:absolute;bottom:-30px;right:16px;display:flex;align-items:center;gap:8px;';

    var profileName = document.createElement('div');
    profileName.textContent = MI.Storage.getProfile().name;
    profileName.style.cssText = 'color:white;font-size:16px;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,0.5);';

    var profileAvatar = MI.Components.createAvatar(MI.Storage.getProfile().avatar, 'large');
    profileAvatar.style.cssText += 'border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);';

    profileBlock.appendChild(profileName);
    profileBlock.appendChild(profileAvatar);
    cover.appendChild(profileBlock);
    scroll.appendChild(cover);

    // 间距
    var spacer = document.createElement('div');
    spacer.style.height = '40px';
    scroll.appendChild(spacer);

    // 帖子列表
    var moments = MI.Storage.getMoments();
    moments.sort(function (a, b) { return b.timestamp - a.timestamp; });

    if (moments.length === 0) {
      var empty = MI.Components.createEmptyState('暂无朋友圈内容');
      empty.style.cssText += 'text-align:center;padding:60px 20px;color:#8E8E93;font-size:15px;';
      scroll.appendChild(empty);
    } else {
      for (var i = 0; i < moments.length; i++) {
        var post = moments[i];
        var author = MI.Data.getContactById(post.authorId);
        if (!author) {
          author = { name: '未知用户', avatar: '❓' };
        }
        var card = MI.Components.createMomentsPost(post, author);
        scroll.appendChild(card);
      }
    }

    container.appendChild(scroll);
  }
};
