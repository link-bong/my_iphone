/**
 * api-profiles.js — 统一 API 配置库管理
 */
window.MI = window.MI || {};

MI.ApiProfiles = {
  renderList: function (container) {
    container.classList.add('app-screen');

    var navBar = MI.Components.createNavBar('API 配置', {
      showBack: true,
      onBack: function () { MI.Router.goBack(); },
      rightIcon: 'plus',
      onRight: function () {
        MI.Router.navigateTo('api-profile-edit');
      }
    });
    container.appendChild(navBar);

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('settings-scroll');

    var hint = document.createElement('div');
    hint.className = 'form-hint';
    hint.textContent = '每个模型商可启用多个模型。角色/工具将分别选择模型商与具体模型。';
    scroll.appendChild(hint);

    var profiles = MI.Storage.getApiProfiles();
    if (profiles.length === 0) {
      scroll.appendChild(MI.Components.createEmptyState('暂无 API 配置\n点击右上角添加'));
    } else {
      for (var i = 0; i < profiles.length; i++) {
        scroll.appendChild(this._createProfileRow(profiles[i]));
      }
    }

    container.appendChild(scroll);
  },

  renderEdit: function (container) {
    var params = MI.Router.currentParams || {};
    var profile = params.profileId ? MI.Storage.getApiProfileById(params.profileId) : null;
    var isNew = !profile;
    container.classList.add('app-screen');

    var navBar = MI.Components.createNavBar(isNew ? '添加 API' : '编辑 API', {
      showBack: true,
      onBack: function () { MI.Router.goBack(); }
    });
    container.appendChild(navBar);

    var scroll = MI.Components.createScrollContainer();
    scroll.classList.add('settings-scroll');

    scroll.appendChild(MI.Components.createInputField(
      '配置名称', 'ap-name',
      profile ? profile.name : '',
      '如：DeepSeek、OpenAI 备用',
      false, false
    ));
    scroll.appendChild(MI.Components.createInputField(
      'API URL', 'ap-api-url',
      profile ? profile.apiUrl : '',
      'https://.../v1/chat/completions',
      false, false
    ));
    scroll.appendChild(MI.Components.createInputField(
      'API Key', 'ap-api-key',
      profile ? profile.apiKey : '',
      'sk-...',
      true, false
    ));

    var fetchRow = document.createElement('div');
    fetchRow.className = 'fetch-models-row';
    var fetchBtn = document.createElement('button');
    fetchBtn.type = 'button';
    fetchBtn.id = 'ap-fetch-btn';
    fetchBtn.className = 'btn-glass btn-glass-fetch';
    fetchBtn.appendChild(MI.Components.buttonContent('plug-circle-check', '检查连接 / 获取模型'));
    fetchRow.appendChild(fetchBtn);

    var statusEl = document.createElement('div');
    statusEl.id = 'ap-fetch-status';
    statusEl.className = 'fetch-status';
    fetchRow.appendChild(statusEl);
    scroll.appendChild(fetchRow);

    var allModels = profile && profile.models ? profile.models : [];
    var enabledModels = profile && profile.enabledModels ? profile.enabledModels : [];
    scroll.appendChild(MI.Components.createEnabledModelsEditor('ap-models', allModels, enabledModels));

    fetchBtn.addEventListener('click', function (e) {
      e.preventDefault();
      MI.ApiProfiles._fetchModels(fetchBtn, statusEl);
    });

    var securityHint = document.createElement('div');
    securityHint.className = 'form-hint form-hint-warn';
    securityHint.textContent = 'API Key 存储在本地浏览器中，请勿在公共设备上使用。';
    scroll.appendChild(securityHint);

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn-glass btn-glass-primary';
    saveBtn.appendChild(MI.Components.buttonContent('floppy-disk', isNew ? '添加配置' : '保存修改'));
    saveBtn.addEventListener('click', function () {
      MI.ApiProfiles._save(profile ? profile.id : null);
    });
    scroll.appendChild(saveBtn);

    if (!isNew) {
      var delBtn = document.createElement('button');
      delBtn.className = 'btn-glass btn-glass-danger';
      delBtn.appendChild(MI.Components.buttonContent('trash', '删除此配置'));
      delBtn.addEventListener('click', function () {
        MI.Components.showConfirmDialog('删除 API 配置', '确定删除该 API 配置？使用它的角色/服务号需重新选择。', function () {
          MI.ApiProfiles._delete(profile.id);
        }, null, { danger: true, confirmText: '删除' });
      });
      scroll.appendChild(delBtn);
    }

    container.appendChild(scroll);
  },

  _fetchModels: function (btn, statusEl) {
    var apiUrl = document.getElementById('ap-api-url').value.trim();
    var apiKey = document.getElementById('ap-api-key').value.trim();

    btn.disabled = true;
    btn.innerHTML = '';
    btn.appendChild(MI.Components.icon('spinner', 'fa-spin btn-icon'));
    var spinText = document.createElement('span');
    spinText.textContent = '正在获取...';
    btn.appendChild(spinText);
    if (statusEl) {
      statusEl.className = 'fetch-status';
      statusEl.textContent = '';
    }

    var prevEnabled = MI.Components.getEnabledModelsFromEditor('ap-models');

    MI.API.fetchModels(apiUrl, apiKey, {
      onSuccess: function (models) {
        var panel = document.getElementById('ap-models');
        var kept = [];
        for (var i = 0; i < prevEnabled.length; i++) {
          if (models.indexOf(prevEnabled[i]) >= 0) kept.push(prevEnabled[i]);
        }

        document.getElementById('ap-models-all').value = JSON.stringify(models);
        document.getElementById('ap-models-enabled').value = JSON.stringify(kept);

        if (panel) {
          MI.Components.renderEnabledModelsPanel(panel, models, kept, function (all, enabled) {
            document.getElementById('ap-models-all').value = JSON.stringify(all);
            document.getElementById('ap-models-enabled').value = JSON.stringify(enabled);
          });
        }

        if (statusEl) {
          statusEl.className = 'fetch-status fetch-status-ok';
          statusEl.textContent = '已获取 ' + models.length + ' 个模型，请点击 + 启用需要的模型';
        }
      },
      onError: function (msg) {
        if (statusEl) {
          statusEl.className = 'fetch-status fetch-status-err';
          statusEl.textContent = msg;
        }
        MI.Components.showToast('连接失败：' + msg, 3000);
      },
      onEnd: function () {
        btn.disabled = false;
        btn.innerHTML = '';
        btn.appendChild(MI.Components.buttonContent('plug-circle-check', '检查连接 / 获取模型'));
      }
    });
  },

  _createProfileRow: function (profile) {
    var row = document.createElement('div');
    row.className = 'api-profile-row';

    var info = document.createElement('div');
    info.className = 'api-profile-info';

    var name = document.createElement('div');
    name.className = 'api-profile-name';
    name.textContent = profile.name;

    var sub = document.createElement('div');
    sub.className = 'api-profile-sub';
    var enabled = profile.enabledModels ? profile.enabledModels.length : 0;
    if (enabled === 0 && profile.apiModel) enabled = 1;
    var keyOk = profile.apiKey ? '已配置 Key' : '未配置 Key';
    sub.textContent = enabled + ' 个已启用模型 · ' + keyOk;

    info.appendChild(name);
    info.appendChild(sub);

    row.appendChild(info);
    row.appendChild(MI.Components.icon('chevron-right', 'menu-arrow-icon'));

    row.addEventListener('click', function () {
      MI.Router.navigateTo('api-profile-edit', { profileId: profile.id });
    });
    return row;
  },

  _collectForm: function () {
    var allEl = document.getElementById('ap-models-all');
    var enabledEl = document.getElementById('ap-models-enabled');
    var models = [];
    var enabledModels = [];
    try { models = JSON.parse(allEl ? allEl.value : '[]'); } catch (e) { models = []; }
    try { enabledModels = JSON.parse(enabledEl ? enabledEl.value : '[]'); } catch (e) { enabledModels = []; }

    return {
      name: document.getElementById('ap-name').value.trim(),
      apiUrl: document.getElementById('ap-api-url').value.trim(),
      apiKey: document.getElementById('ap-api-key').value.trim(),
      models: models,
      enabledModels: enabledModels
    };
  },

  _save: function (profileId) {
    var data = this._collectForm();
    if (!data.name) { MI.Components.showToast('请填写配置名称'); return; }
    if (!data.apiUrl || !data.apiKey) {
      MI.Components.showToast('请填写 API URL 和 Key');
      return;
    }
    if (!data.enabledModels || data.enabledModels.length === 0) {
      MI.Components.showToast('请至少启用一个模型（获取模型后点击 + 启用）');
      return;
    }

    var profiles = MI.Storage.getApiProfiles();

    if (profileId) {
      for (var i = 0; i < profiles.length; i++) {
        if (profiles[i].id === profileId) {
          profiles[i].name = data.name;
          profiles[i].apiUrl = data.apiUrl;
          profiles[i].apiKey = data.apiKey;
          profiles[i].models = data.models;
          profiles[i].enabledModels = data.enabledModels;
          profiles[i].apiModel = data.enabledModels[0];
          break;
        }
      }
    } else {
      profiles.push({
        id: MI.Data.genId('api'),
        name: data.name,
        apiUrl: data.apiUrl,
        apiKey: data.apiKey,
        models: data.models,
        enabledModels: data.enabledModels,
        apiModel: data.enabledModels[0],
        builtin: false
      });
    }

    MI.Storage.setApiProfiles(profiles);
    MI.Router.goBack();
  },

  _delete: function (profileId) {
    var profiles = MI.Storage.getApiProfiles();
    var filtered = [];
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i].id !== profileId) filtered.push(profiles[i]);
    }
    MI.Storage.setApiProfiles(filtered);

    var config = MI.Storage.getConfig();
    if (config.aiApiProfileId === profileId) {
      config.aiApiProfileId = filtered.length > 0 ? filtered[0].id : null;
      config.aiApiModel = null;
      MI.Storage.setConfig(config);
    }

    var contacts = MI.Storage.getContacts();
    for (var j = 0; j < contacts.length; j++) {
      if (contacts[j].apiProfileId === profileId) {
        contacts[j].apiProfileId = filtered.length > 0 ? filtered[0].id : null;
        contacts[j].apiModel = null;
      }
    }
    MI.Storage.setContacts(contacts);
    MI.Router.goBack();
  }
};
