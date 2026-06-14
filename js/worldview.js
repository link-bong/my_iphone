/**
 * worldview.js — 世界观管理
 */
window.MI = window.MI || {};

MI.Worldview = {
  renderList: function (container) {
    container.classList.add('app-screen');

    var navBar = MI.Components.createNavBar('世界观设定', {
      showBack: true,
      onBack: function () { MI.Router.goBack(); },
      rightText: '＋',
      onRight: function () {
        MI.Router.navigateTo('worldview-edit', { worldviewId: null });
      }
    });
    container.appendChild(navBar);

    var scroll = MI.Components.createScrollContainer();
    var worldviews = MI.Storage.getWorldviews();

    if (worldviews.length === 0) {
      scroll.appendChild(MI.Components.createEmptyState('暂无世界观\n点击右上角 ＋ 创建'));
    } else {
      for (var i = 0; i < worldviews.length; i++) {
        (function (wv) {
          var row = MI.Components.createMenuRow('🌍', wv.name, '', true, function () {
            MI.Router.navigateTo('worldview-edit', { worldviewId: wv.id });
          });
          scroll.appendChild(row);
        })(worldviews[i]);
      }
    }

    container.appendChild(scroll);
  },

  renderEdit: function (container) {
    var params = MI.Router.currentParams || {};
    var worldviewId = params.worldviewId;
    var existing = worldviewId ? MI.Storage.getWorldviewById(worldviewId) : null;
    var isNew = !existing;

    container.classList.add('app-screen');

    var navBar = MI.Components.createNavBar(isNew ? '新建世界观' : '编辑世界观', {
      showBack: true,
      onBack: function () { MI.Router.goBack(); }
    });
    container.appendChild(navBar);

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('settings-scroll');

    scroll.appendChild(MI.Components.createInputField('世界观名称', 'wv-name', existing ? existing.name : '', '如：现代都市、仙侠世界', false, false));
    scroll.appendChild(MI.Components.createInputField('背景设定', 'wv-desc', existing ? existing.description : '', '描述这个世界的规则、时代、文化等', false, true));

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn-glass btn-glass-primary';
    saveBtn.textContent = '💾 保存';
    saveBtn.addEventListener('click', function () {
      MI.Worldview._save(worldviewId);
    });
    scroll.appendChild(saveBtn);

    if (!isNew) {
      var delBtn = document.createElement('button');
      delBtn.className = 'btn-glass btn-glass-danger';
      delBtn.textContent = '🗑️ 删除世界观';
      delBtn.addEventListener('click', function () {
        if (confirm('删除后，绑定此世界观的角色和朋友圈将失去关联。确定删除？')) {
          MI.Worldview._delete(worldviewId);
        }
      });
      scroll.appendChild(delBtn);
    }

    container.appendChild(scroll);
  },

  _save: function (worldviewId) {
    var name = document.getElementById('wv-name').value.trim();
    var description = document.getElementById('wv-desc').value.trim();
    if (!name) {
      alert('请填写世界观名称');
      return;
    }

    var list = MI.Storage.getWorldviews();
    if (worldviewId) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === worldviewId) {
          list[i].name = name;
          list[i].description = description;
          break;
        }
      }
    } else {
      list.push({
        id: MI.Data.genId('wv'),
        name: name,
        description: description,
        createdAt: Date.now()
      });
    }
    MI.Storage.setWorldviews(list);
    MI.Router.goBack();
  },

  _delete: function (worldviewId) {
    var list = MI.Storage.getWorldviews();
    var filtered = [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id !== worldviewId) filtered.push(list[i]);
    }
    MI.Storage.setWorldviews(filtered);

    var moments = MI.Storage.getMoments();
    var mFiltered = [];
    for (var j = 0; j < moments.length; j++) {
      if (moments[j].worldviewId !== worldviewId) mFiltered.push(moments[j]);
    }
    MI.Storage.setMoments(mFiltered);

    MI.Router.goBack();
  }
};
