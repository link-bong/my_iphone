/**
 * components.js — 可复用的 UI 组件
 * 每个函数返回一个 DOM 元素
 */
window.MI = window.MI || {};

MI.Components = {
  /**
   * Font Awesome 图标
   */
  icon: function (name, extraClass) {
    var el = document.createElement('i');
    el.className = 'fa-solid fa-' + name + (extraClass ? ' ' + extraClass : '');
    el.setAttribute('aria-hidden', 'true');
    return el;
  },

  /**
   * 带图标的按钮内容
   */
  buttonContent: function (iconName, text) {
    var wrap = document.createElement('span');
    wrap.className = 'btn-content';
    if (iconName) wrap.appendChild(this.icon(iconName, 'btn-icon'));
    var span = document.createElement('span');
    span.textContent = text;
    wrap.appendChild(span);
    return wrap;
  },

  /**
   * 获取模型字段值（input 或 select）
   */
  getModelFieldValue: function (fieldId) {
    var el = document.getElementById(fieldId);
    return el ? el.value.trim() : '';
  },

  /**
   * 设置模型字段值
   */
  setModelFieldValue: function (fieldId, value) {
    var el = document.getElementById(fieldId);
    if (el) el.value = value || '';
  },

  /**
   * 将模型输入框替换为下拉选择
   */
  populateModelSelect: function (fieldId, models, selectedValue) {
    var fieldEl = document.getElementById(fieldId);
    if (!fieldEl) return;

    var group = fieldEl.closest('.setting-group');
    if (!group) return;

    var fieldWrap = group.querySelector('.model-field-wrap');
    if (!fieldWrap) return;

    fieldWrap.innerHTML = '';

    var select = document.createElement('select');
    select.id = fieldId;
    select.className = 'setting-input glass-input model-select';

    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '请选择模型';
    select.appendChild(placeholder);

    for (var i = 0; i < models.length; i++) {
      var opt = document.createElement('option');
      opt.value = models[i];
      opt.textContent = models[i];
      if (models[i] === selectedValue) opt.selected = true;
      select.appendChild(opt);
    }

    if (selectedValue && models.indexOf(selectedValue) < 0) {
      var custom = document.createElement('option');
      custom.value = selectedValue;
      custom.textContent = selectedValue + '（当前）';
      custom.selected = true;
      select.insertBefore(custom, select.firstChild.nextSibling);
    }

    fieldWrap.appendChild(select);
  },

  /**
   * 创建模型字段（初始为输入框，获取后可变为下拉）
   */
  createModelField: function (label, fieldId, value, placeholder) {
    var group = document.createElement('div');
    group.className = 'setting-group';

    var lbl = document.createElement('label');
    lbl.className = 'setting-label';
    lbl.textContent = label;
    lbl.setAttribute('for', fieldId);
    group.appendChild(lbl);

    var fieldWrap = document.createElement('div');
    fieldWrap.className = 'model-field-wrap';

    var input = document.createElement('input');
    input.type = 'text';
    input.id = fieldId;
    input.className = 'setting-input glass-input';
    input.value = value || '';
    if (placeholder) input.placeholder = placeholder;

    fieldWrap.appendChild(input);
    group.appendChild(fieldWrap);
    return group;
  },

  /**
   * 检查连接 / 获取模型按钮区
   */
  createFetchModelsRow: function (urlFieldId, keyFieldId, modelFieldId, statusId) {
    var row = document.createElement('div');
    row.className = 'fetch-models-row';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-glass btn-glass-fetch';
    btn.appendChild(this.buttonContent('plug-circle-check', '检查连接 / 获取模型'));
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var apiUrl = document.getElementById(urlFieldId).value.trim();
      var apiKey = document.getElementById(keyFieldId).value.trim();
      var statusEl = statusId ? document.getElementById(statusId) : null;
      var currentModel = MI.Components.getModelFieldValue(modelFieldId);

      btn.disabled = true;
      btn.innerHTML = '';
      var spinIcon = MI.Components.icon('spinner', 'fa-spin btn-icon');
      btn.appendChild(spinIcon);
      var spinText = document.createElement('span');
      spinText.textContent = '正在获取...';
      btn.appendChild(spinText);
      if (statusEl) {
        statusEl.className = 'fetch-status';
        statusEl.textContent = '';
      }

      MI.API.fetchModels(apiUrl, apiKey, {
        onSuccess: function (models) {
          MI.Components.populateModelSelect(modelFieldId, models, currentModel);
          if (statusEl) {
            statusEl.className = 'fetch-status fetch-status-ok';
            statusEl.textContent = '已获取 ' + models.length + ' 个可用模型';
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
    });

    row.appendChild(btn);

    if (statusId) {
      var status = document.createElement('div');
      status.id = statusId;
      status.className = 'fetch-status';
      row.appendChild(status);
    }

    return row;
  },

  /**
   * API 配置区块：URL + Key + 获取模型 + Model
   */
  createApiConfigBlock: function (prefix, apiData) {
    apiData = apiData || {};
    var frag = document.createDocumentFragment();

    frag.appendChild(this.createInputField('API URL', prefix + '-api-url', apiData.apiUrl || '', 'https://...', false, false));
    frag.appendChild(this.createInputField('API Key', prefix + '-api-key', apiData.apiKey || '', 'sk-...', true, false));
    frag.appendChild(this.createFetchModelsRow(prefix + '-api-url', prefix + '-api-key', prefix + '-api-model', prefix + '-fetch-status'));
    frag.appendChild(this.createModelField('模型 (Model)', prefix + '-api-model', apiData.apiModel || '', '获取模型后可下拉选择'));

    return frag;
  },
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

    var signal = this.icon('signal', 'status-fa-icon');
    var wifi = this.icon('wifi', 'status-fa-icon');
    var battery = this.icon('battery-full', 'status-fa-icon');

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
      homeBtn.title = '返回主屏幕';
      homeBtn.appendChild(this.icon('house', 'nav-fa-icon'));
      homeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (opts.onHome) opts.onHome();
      });
      bar.appendChild(homeBtn);
    }

    if (opts.showBack) {
      var backBtn = document.createElement('div');
      backBtn.className = 'nav-back-btn';
      if (opts.showHome) backBtn.classList.add('nav-back-with-home');
      backBtn.appendChild(this.icon('chevron-left', 'nav-fa-icon'));
      var backText = document.createElement('span');
      backText.textContent = '返回';
      backBtn.appendChild(backText);
      backBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (opts.onBack) opts.onBack();
      });
      bar.appendChild(backBtn);
    }

    var titleEl = document.createElement('div');
    titleEl.className = 'nav-title';
    if (opts.titleClickable) titleEl.classList.add('nav-title-clickable');
    titleEl.textContent = title;
    if (opts.onTitleClick) {
      titleEl.addEventListener('click', function (e) {
        e.preventDefault();
        opts.onTitleClick();
      });
    }
    bar.appendChild(titleEl);

    if (opts.rightIcon || opts.rightText) {
      var rightBtn = document.createElement('div');
      rightBtn.className = 'nav-right-btn';
      if (opts.rightIcon) {
        rightBtn.appendChild(this.icon(opts.rightIcon, 'nav-fa-icon'));
      } else {
        rightBtn.textContent = opts.rightText;
      }
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
  createTabBar: function (activeTab, onTabChange, badges) {
    badges = badges || {};
    var tabs = [
      { id: 'chats',    icon: 'comment',       label: '微信' },
      { id: 'contacts', icon: 'address-book',  label: '通讯录' },
      { id: 'discover', icon: 'compass',       label: '发现' },
      { id: 'me',       icon: 'user',          label: '我' }
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
      icon.appendChild(this.icon(tab.icon, 'tab-fa-icon'));

      if (badges[tab.id]) {
        var dot = document.createElement('span');
        dot.className = 'unread-dot tab-unread-dot';
        icon.appendChild(dot);
      }

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
   * 头像元素（支持 emoji、图片、服务号图标）
   */
  createAvatar: function (avatarValue, size, contact) {
    var useToolIcon = contact && contact.type === 'tool' && contact.avatarIcon &&
      contact.avatarMode !== 'custom' && !(MI.Media && MI.Media.isImage(avatarValue));

    if (useToolIcon) {
      return this.createToolAvatar(contact.avatarIcon, size);
    }

    var avatar = document.createElement('div');
    avatar.className = 'avatar';
    if (size === 'small') avatar.classList.add('avatar-sm');
    if (size === 'large') avatar.classList.add('avatar-lg');

    if (MI.Media && MI.Media.isImage(avatarValue)) {
      var img = document.createElement('img');
      img.className = 'avatar-img';
      img.src = avatarValue;
      img.alt = '';
      avatar.appendChild(img);
    } else {
      avatar.textContent = avatarValue || '😊';
    }
    return avatar;
  },

  /**
   * 服务号工具图标头像
   */
  createToolAvatar: function (iconName, size) {
    var avatar = document.createElement('div');
    avatar.className = 'avatar avatar-tool';
    if (size === 'small') avatar.classList.add('avatar-sm');
    if (size === 'large') avatar.classList.add('avatar-lg');
    avatar.appendChild(this.icon(iconName, 'avatar-tool-icon'));
    return avatar;
  },

  /**
   * API 配置库 + 模型双选（角色/工具/AI 助手）
   */
  createProviderModelPicker: function (prefix, selectedProfileId, selectedModel, profileLabel, modelLabel) {
    var self = this;
    var profiles = MI.Storage.getApiProfiles();
    var wrap = document.createElement('div');
    wrap.className = 'provider-model-picker';

    var profileGroup = document.createElement('div');
    profileGroup.className = 'setting-group';
    var profileLbl = document.createElement('label');
    profileLbl.className = 'setting-label';
    profileLbl.textContent = profileLabel || '模型商 API';
    profileLbl.setAttribute('for', prefix + '-api-profile');
    profileGroup.appendChild(profileLbl);

    var profileSelect = document.createElement('select');
    profileSelect.id = prefix + '-api-profile';
    profileSelect.className = 'setting-input';
    var emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = profiles.length === 0 ? '请先添加 API 配置' : '请选择模型商';
    profileSelect.appendChild(emptyOpt);
    for (var i = 0; i < profiles.length; i++) {
      var opt = document.createElement('option');
      opt.value = profiles[i].id;
      opt.textContent = profiles[i].name;
      if (profiles[i].id === selectedProfileId) opt.selected = true;
      profileSelect.appendChild(opt);
    }
    profileGroup.appendChild(profileSelect);
    wrap.appendChild(profileGroup);

    var modelGroup = document.createElement('div');
    modelGroup.className = 'setting-group';
    var modelLbl = document.createElement('label');
    modelLbl.className = 'setting-label';
    modelLbl.textContent = modelLabel || '模型';
    modelLbl.setAttribute('for', prefix + '-api-model');
    modelGroup.appendChild(modelLbl);

    var modelSelect = document.createElement('select');
    modelSelect.id = prefix + '-api-model';
    modelSelect.className = 'setting-input';
    modelGroup.appendChild(modelSelect);
    wrap.appendChild(modelGroup);

    function refreshModels() {
      var pid = profileSelect.value;
      var enabled = MI.Storage.getEnabledModels(pid);
      modelSelect.innerHTML = '';
      var ph = document.createElement('option');
      ph.value = '';
      ph.textContent = enabled.length === 0 ? '请先在 API 配置中启用模型' : '请选择模型';
      modelSelect.appendChild(ph);
      for (var j = 0; j < enabled.length; j++) {
        var mOpt = document.createElement('option');
        mOpt.value = enabled[j];
        mOpt.textContent = enabled[j];
        if (enabled[j] === selectedModel) mOpt.selected = true;
        modelSelect.appendChild(mOpt);
      }
      if (selectedModel && enabled.indexOf(selectedModel) < 0 && pid === selectedProfileId) {
        var legacy = document.createElement('option');
        legacy.value = selectedModel;
        legacy.textContent = selectedModel + '（当前）';
        legacy.selected = true;
        modelSelect.appendChild(legacy);
      }
    }

    profileSelect.addEventListener('change', function () {
      selectedModel = '';
      refreshModels();
    });
    refreshModels();
    return wrap;
  },

  /**
   * 已获取模型的启用/停用列表（+/-）
   */
  createEnabledModelsEditor: function (panelId, allModels, enabledModels) {
    var group = document.createElement('div');
    group.className = 'setting-group';

    var lbl = document.createElement('label');
    lbl.className = 'setting-label';
    lbl.textContent = '可用模型（点击 + 启用 / - 停用）';
    group.appendChild(lbl);

    var panel = document.createElement('div');
    panel.className = 'enabled-models-panel';
    panel.id = panelId;
    group.appendChild(panel);

    var allHidden = document.createElement('input');
    allHidden.type = 'hidden';
    allHidden.id = panelId + '-all';
    allHidden.value = JSON.stringify(allModels || []);
    group.appendChild(allHidden);

    var enabledHidden = document.createElement('input');
    enabledHidden.type = 'hidden';
    enabledHidden.id = panelId + '-enabled';
    enabledHidden.value = JSON.stringify(enabledModels || []);
    group.appendChild(enabledHidden);

    this.renderEnabledModelsPanel(panel, allModels || [], enabledModels || [], function (all, enabled) {
      allHidden.value = JSON.stringify(all);
      enabledHidden.value = JSON.stringify(enabled);
    });

    return group;
  },

  renderEnabledModelsPanel: function (panel, allModels, enabledModels, onUpdate) {
    panel.innerHTML = '';
    if (!allModels || allModels.length === 0) {
      panel.appendChild(MI.Components.createEmptyState('点击上方「获取模型」拉取列表'));
      return;
    }

    for (var i = 0; i < allModels.length; i++) {
      (function (modelName) {
        var isOn = enabledModels.indexOf(modelName) >= 0;
        var row = document.createElement('div');
        row.className = 'enabled-model-row' + (isOn ? ' enabled-model-row-on' : '');

        var nameEl = document.createElement('span');
        nameEl.className = 'enabled-model-name';
        nameEl.textContent = modelName;

        var statusEl = document.createElement('span');
        statusEl.className = 'enabled-model-status';
        statusEl.textContent = isOn ? '已启用' : '未启用';

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'enabled-model-toggle' + (isOn ? ' enabled-model-toggle-off' : ' enabled-model-toggle-on');
        btn.appendChild(MI.Components.icon(isOn ? 'minus' : 'plus', ''));

        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var idx = enabledModels.indexOf(modelName);
          if (idx >= 0) enabledModels.splice(idx, 1);
          else enabledModels.push(modelName);
          if (onUpdate) onUpdate(allModels, enabledModels);
          MI.Components.renderEnabledModelsPanel(panel, allModels, enabledModels, onUpdate);
        });

        row.appendChild(nameEl);
        row.appendChild(statusEl);
        row.appendChild(btn);
        panel.appendChild(row);
      })(allModels[i]);
    }
  },

  getEnabledModelsFromEditor: function (panelId) {
    var el = document.getElementById(panelId + '-enabled');
    if (!el) return [];
    try { return JSON.parse(el.value || '[]'); } catch (e) { return []; }
  },

  /**
   * API 配置库下拉选择（仅选模型商，保留兼容）
   */
  createApiProfileSelect: function (fieldId, selectedId, labelText) {
    var profiles = MI.Storage.getApiProfiles();
    var group = document.createElement('div');
    group.className = 'setting-group';

    var lbl = document.createElement('label');
    lbl.className = 'setting-label';
    lbl.textContent = labelText || '使用的 API 配置';
    lbl.setAttribute('for', fieldId);
    group.appendChild(lbl);

    var select = document.createElement('select');
    select.id = fieldId;
    select.className = 'setting-input';

    var emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = profiles.length === 0 ? '请先在设置中添加 API 配置' : '请选择 API 配置';
    select.appendChild(emptyOpt);

    for (var i = 0; i < profiles.length; i++) {
      var opt = document.createElement('option');
      opt.value = profiles[i].id;
      opt.textContent = profiles[i].name + ' (' + (profiles[i].apiModel || '未设模型') + ')';
      if (profiles[i].id === selectedId) opt.selected = true;
      select.appendChild(opt);
    }

    group.appendChild(select);
    return group;
  },

  /**
   * 复选框表单项
   */
  createCheckboxField: function (fieldId, labelText, checked) {
    var group = document.createElement('div');
    group.className = 'setting-group setting-group-checkbox';

    var label = document.createElement('label');
    label.className = 'checkbox-label';

    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = fieldId;
    cb.className = 'setting-checkbox';
    cb.checked = !!checked;

    var span = document.createElement('span');
    span.textContent = labelText;

    label.appendChild(cb);
    label.appendChild(span);
    group.appendChild(label);
    return group;
  },

  /**
   * 头像选择器：emoji + 照片上传
   */
  createAvatarPickerField: function (fieldId, value, emojiOptions) {
    emojiOptions = emojiOptions || ['😊', '😎', '🌸', '🐱', '🐻', '🦊', '🦅', '🐰', '🐶', '🐼', '🦁', '🌻', '💫', '🎭', '👑', '⚔️', '🌙', '🔮'];
    var group = document.createElement('div');
    group.className = 'setting-group';

    var lbl = document.createElement('label');
    lbl.className = 'setting-label';
    lbl.textContent = '头像';
    group.appendChild(lbl);

    var preview = document.createElement('div');
    preview.className = 'avatar-picker-preview';
    preview.id = fieldId + '-preview';
    group.appendChild(preview);

    var hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.id = fieldId;
    hidden.value = value || '😊';
    group.appendChild(hidden);

    function refreshPreview() {
      preview.innerHTML = '';
      preview.appendChild(MI.Components.createAvatar(hidden.value, 'large'));
    }
    refreshPreview();

    var grid = document.createElement('div');
    grid.className = 'emoji-picker-grid';
    for (var i = 0; i < emojiOptions.length; i++) {
      (function (emoji) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'emoji-picker-btn';
        btn.textContent = emoji;
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          hidden.value = emoji;
          refreshPreview();
          var all = grid.querySelectorAll('.emoji-picker-btn');
          for (var j = 0; j < all.length; j++) all[j].classList.remove('selected');
          btn.classList.add('selected');
        });
        if (emoji === value && !MI.Media.isImage(value)) btn.classList.add('selected');
        grid.appendChild(btn);
      })(emojiOptions[i]);
    }
    group.appendChild(grid);

    var uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.className = 'btn-glass btn-glass-fetch avatar-upload-btn';
    uploadBtn.appendChild(this.buttonContent('camera', '上传照片'));
    uploadBtn.addEventListener('click', function (e) {
      e.preventDefault();
      MI.Media.pickImage(function (dataUrl) {
        hidden.value = dataUrl;
        refreshPreview();
        var all = grid.querySelectorAll('.emoji-picker-btn');
        for (var j = 0; j < all.length; j++) all[j].classList.remove('selected');
      }, function (err) {
        MI.Components.showToast(err || '上传失败');
      });
    });
    group.appendChild(uploadBtn);

    return group;
  },

  /**
   * 朋友圈图片上传（多图）
   */
  createImageUploadField: function (fieldId, initialImages) {
    var group = document.createElement('div');
    group.className = 'setting-group';

    var lbl = document.createElement('label');
    lbl.className = 'setting-label';
    lbl.textContent = '图片';
    group.appendChild(lbl);

    var hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.id = fieldId;
    hidden.value = JSON.stringify(initialImages || []);
    group.appendChild(hidden);

    var grid = document.createElement('div');
    grid.className = 'image-upload-grid';
    grid.id = fieldId + '-grid';
    group.appendChild(grid);

    function getImages() {
      try { return JSON.parse(hidden.value || '[]'); } catch (e) { return []; }
    }

    function saveImages(arr) {
      hidden.value = JSON.stringify(arr);
    }

    function renderGrid() {
      grid.innerHTML = '';
      var images = getImages();

      for (var i = 0; i < images.length; i++) {
        (function (idx) {
          var cell = document.createElement('div');
          cell.className = 'image-upload-cell';
          if (MI.Media.isImage(images[idx])) {
            var img = document.createElement('img');
            img.src = images[idx];
            img.className = 'upload-preview-img';
            cell.appendChild(img);
          } else {
            cell.className += ' image-upload-emoji';
            cell.textContent = images[idx];
          }
          var del = document.createElement('button');
          del.type = 'button';
          del.className = 'image-upload-del';
          del.appendChild(MI.Components.icon('xmark', ''));
          del.addEventListener('click', function (e) {
            e.preventDefault();
            var arr = getImages();
            arr.splice(idx, 1);
            saveImages(arr);
            renderGrid();
          });
          cell.appendChild(del);
          grid.appendChild(cell);
        })(i);
      }

      if (images.length < 9) {
        var addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'image-upload-add';
        addBtn.appendChild(MI.Components.icon('plus', ''));
        addBtn.addEventListener('click', function (e) {
          e.preventDefault();
          MI.Media.pickImage(function (dataUrl) {
            var arr = getImages();
            arr.push(dataUrl);
            saveImages(arr);
            renderGrid();
          }, function (err) { MI.Components.showToast(err || '上传失败'); });
        });
        grid.appendChild(addBtn);
      }
    }

    renderGrid();
    return group;
  },

  /**
   * 世界观多选（至少选一个）
   */
  createWorldviewMultiSelect: function (fieldId, selectedIds) {
    selectedIds = selectedIds || [];
    var worldviews = MI.Storage.getWorldviews();
    var group = document.createElement('div');
    group.className = 'setting-group';

    var lbl = document.createElement('label');
    lbl.className = 'setting-label';
    lbl.textContent = '发布到世界观（可多选，至少一项）';
    group.appendChild(lbl);

    var box = document.createElement('div');
    box.className = 'worldview-multi-select';
    box.id = fieldId;

    for (var i = 0; i < worldviews.length; i++) {
      (function (wv) {
        var label = document.createElement('label');
        label.className = 'wv-checkbox-item';

        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = wv.id;
        cb.className = 'wv-checkbox';
        if (selectedIds.indexOf(wv.id) >= 0) cb.checked = true;

        var span = document.createElement('span');
        span.textContent = wv.name;

        label.appendChild(cb);
        label.appendChild(span);
        box.appendChild(label);
      })(worldviews[i]);
    }

    group.appendChild(box);
    return group;
  },

  getSelectedWorldviewIds: function (fieldId) {
    var box = document.getElementById(fieldId);
    if (!box) return [];
    var cbs = box.querySelectorAll('.wv-checkbox:checked');
    var ids = [];
    for (var i = 0; i < cbs.length; i++) ids.push(cbs[i].value);
    return ids;
  },

  renderPostImage: function (src) {
    var cell = document.createElement('div');
    cell.className = 'post-img-placeholder';
    if (MI.Media && MI.Media.isImage(src)) {
      var img = document.createElement('img');
      img.src = src;
      img.className = 'post-img-real';
      cell.appendChild(img);
    } else {
      cell.textContent = src;
    }
    return cell;
  },

  /**
   * 聊天列表项
   */
  createChatListItem: function (chat, contact, onClick) {
    var item = document.createElement('div');
    item.className = 'chat-item';

    var avatar = this.createAvatar(contact.avatar, 'normal', contact);

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
    this.setMessageBubbleContent(bubble, content);
    return bubble;
  },

  /**
   * 消息组（可含多个展示气泡，共享 msgId）
   */
  createMessageGroup: function (msg, parts, options) {
    options = options || {};
    var sender = msg.role === 'user' ? 'user' : 'assistant';
    var group = document.createElement('div');
    group.className = 'msg-group msg-group-' + sender;
    if (msg.id) group.setAttribute('data-msg-id', msg.id);

    for (var i = 0; i < parts.length; i++) {
      (function (partIndex, partText) {
        var bubble = MI.Components.createMessageBubble(partText, sender);
        group.appendChild(bubble);

        if (options.onPartAction && msg.id) {
          MI.Components.bindMessageLongPress(bubble, function () {
            options.onPartAction({
              msg: msg,
              partIndex: partIndex,
              text: partText
            });
          });
        }
      })(i, parts[i]);
    }

    return group;
  },

  bindMessageLongPress: function (el, callback) {
    var timer = null;
    var fired = false;

    function clearTimer() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    el.addEventListener('touchstart', function () {
      fired = false;
      clearTimer();
      timer = setTimeout(function () {
        fired = true;
        callback();
      }, 500);
    }, { passive: true });

    el.addEventListener('touchend', clearTimer);
    el.addEventListener('touchmove', clearTimer);
    el.addEventListener('touchcancel', clearTimer);

    el.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      callback();
    });
  },

  showActionSheet: function (title, items, onCancel) {
    var overlay = document.createElement('div');
    overlay.className = 'action-sheet-overlay';

    var sheet = document.createElement('div');
    sheet.className = 'action-sheet';

    if (title) {
      var titleEl = document.createElement('div');
      titleEl.className = 'action-sheet-title';
      titleEl.textContent = title;
      sheet.appendChild(titleEl);
    }

    for (var i = 0; i < items.length; i++) {
      (function (item) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'action-sheet-item' + (item.danger ? ' action-sheet-item-danger' : '');
        if (item.icon) {
          btn.appendChild(MI.Components.buttonContent(item.icon, item.label));
        } else {
          btn.textContent = item.label;
        }
        btn.addEventListener('click', function () {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          if (item.onClick) item.onClick();
        });
        sheet.appendChild(btn);
      })(items[i]);
    }

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'action-sheet-cancel';
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (onCancel) onCancel();
    });
    sheet.appendChild(cancelBtn);

    overlay.appendChild(sheet);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
        if (onCancel) onCancel();
      }
    });
    document.body.appendChild(overlay);
    return overlay;
  },

  showPromptDialog: function (title, defaultValue, onConfirm, onCancel, options) {
    options = options || {};
    var overlay = document.createElement('div');
    overlay.className = 'prompt-dialog-overlay';

    var dialog = document.createElement('div');
    dialog.className = 'prompt-dialog';

    var titleEl = document.createElement('div');
    titleEl.className = 'prompt-dialog-title';
    titleEl.textContent = title;
    dialog.appendChild(titleEl);

    var inputEl;
    if (options.singleLine) {
      inputEl = document.createElement('input');
      inputEl.type = 'text';
      inputEl.className = 'prompt-dialog-input prompt-dialog-input-single';
      inputEl.placeholder = options.placeholder || '';
    } else {
      inputEl = document.createElement('textarea');
      inputEl.className = 'prompt-dialog-input';
      inputEl.rows = options.rows || 5;
      inputEl.placeholder = options.placeholder || '';
    }
    inputEl.value = defaultValue || '';
    dialog.appendChild(inputEl);

    var errorEl = document.createElement('div');
    errorEl.className = 'prompt-dialog-error';
    dialog.appendChild(errorEl);

    var actions = document.createElement('div');
    actions.className = 'prompt-dialog-actions';

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'prompt-dialog-btn';
    cancelBtn.textContent = options.cancelText || '取消';
    cancelBtn.addEventListener('click', function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (onCancel) onCancel();
    });

    var okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = 'prompt-dialog-btn prompt-dialog-btn-primary';
    okBtn.textContent = options.confirmText || '确定';
    okBtn.addEventListener('click', function () {
      var val = inputEl.value;
      if (options.validate) {
        var err = options.validate(val);
        if (err) {
          errorEl.textContent = err;
          return;
        }
      }
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (onConfirm) onConfirm(val);
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    setTimeout(function () { inputEl.focus(); }, 50);
    return overlay;
  },

  showConfirmDialog: function (title, message, onConfirm, onCancel, options) {
    options = options || {};
    var overlay = document.createElement('div');
    overlay.className = 'prompt-dialog-overlay';

    var dialog = document.createElement('div');
    dialog.className = 'prompt-dialog';

    var titleEl = document.createElement('div');
    titleEl.className = 'prompt-dialog-title';
    titleEl.textContent = title;
    dialog.appendChild(titleEl);

    if (message) {
      var msgEl = document.createElement('div');
      msgEl.className = 'prompt-dialog-message';
      msgEl.textContent = message;
      dialog.appendChild(msgEl);
    }

    var actions = document.createElement('div');
    actions.className = 'prompt-dialog-actions';

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'prompt-dialog-btn';
    cancelBtn.textContent = options.cancelText || '取消';
    cancelBtn.addEventListener('click', function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (onCancel) onCancel();
    });

    var okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = 'prompt-dialog-btn' + (options.danger ? ' prompt-dialog-btn-danger' : ' prompt-dialog-btn-primary');
    okBtn.textContent = options.confirmText || '确定';
    okBtn.addEventListener('click', function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (onConfirm) onConfirm();
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    return overlay;
  },

  showAlertDialog: function (title, message, onOk, options) {
    options = options || {};
    var overlay = document.createElement('div');
    overlay.className = 'prompt-dialog-overlay';

    var dialog = document.createElement('div');
    dialog.className = 'prompt-dialog';

    var titleEl = document.createElement('div');
    titleEl.className = 'prompt-dialog-title';
    titleEl.textContent = title;
    dialog.appendChild(titleEl);

    if (message) {
      var msgEl = document.createElement('div');
      msgEl.className = 'prompt-dialog-message prompt-dialog-message-pre';
      msgEl.textContent = message;
      dialog.appendChild(msgEl);
    }

    var actions = document.createElement('div');
    actions.className = 'prompt-dialog-actions';

    var okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = 'prompt-dialog-btn prompt-dialog-btn-primary';
    okBtn.textContent = options.okText || '知道了';
    okBtn.addEventListener('click', function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (onOk) onOk();
    });

    actions.appendChild(okBtn);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    return overlay;
  },

  showToast: function (message, duration) {
    if (!message) return;
    duration = duration || 2000;
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    var app = document.getElementById('app');
    if (app) app.appendChild(toast);
    else document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  },

  createSelectField: function (label, id, options, selectedValue) {
    var group = document.createElement('div');
    group.className = 'setting-group';

    var lbl = document.createElement('label');
    lbl.className = 'setting-label';
    lbl.textContent = label;
    lbl.setAttribute('for', id);
    group.appendChild(lbl);

    var select = document.createElement('select');
    select.id = id;
    select.className = 'setting-input';

    for (var i = 0; i < options.length; i++) {
      var opt = document.createElement('option');
      opt.value = options[i].value;
      opt.textContent = options[i].label;
      if (options[i].value === selectedValue) opt.selected = true;
      select.appendChild(opt);
    }

    group.appendChild(select);
    return group;
  },

  createDetailRow: function (label, value) {
    var row = document.createElement('div');
    row.className = 'detail-row';

    var lbl = document.createElement('div');
    lbl.className = 'detail-label';
    lbl.textContent = label;

    var val = document.createElement('div');
    val.className = 'detail-value';
    val.textContent = value || '未设置';

    row.appendChild(lbl);
    row.appendChild(val);
    return row;
  },

  createMomentLinkBubble: function (moment, characterName) {
    var wrap = document.createElement('div');
    wrap.className = 'msg-moment-link';

    var icon = this.icon('images', 'msg-moment-link-icon');
    wrap.appendChild(icon);

    var text = document.createElement('span');
    text.className = 'msg-moment-link-text';
    var preview = moment.content ? moment.content.slice(0, 36) : '';
    if (moment.content && moment.content.length > 36) preview += '…';
    text.textContent = (characterName || '角色') + ' 发布了朋友圈：' + preview;
    wrap.appendChild(text);

    wrap.setAttribute('data-moment-id', moment.id);
    wrap.addEventListener('click', function (e) {
      e.preventDefault();
      MI.Router.navigateTo('moment-detail', { momentId: moment.id });
    });
    return wrap;
  },

  createProfileHeader: function (avatar, name, sub) {
    var header = document.createElement('div');
    header.className = 'profile-detail-header';

    header.appendChild(this.createAvatar(avatar, 'large'));

    var info = document.createElement('div');
    info.className = 'profile-detail-info';

    var nameEl = document.createElement('div');
    nameEl.className = 'profile-detail-name';
    nameEl.textContent = name;

    info.appendChild(nameEl);

    if (sub) {
      var subEl = document.createElement('div');
      subEl.className = 'profile-detail-sub';
      subEl.textContent = sub;
      info.appendChild(subEl);
    }

    header.appendChild(info);
    return header;
  },

  /** 更新气泡文本（保留换行） */
  setMessageBubbleContent: function (bubble, content) {
    if (!bubble) return;
    bubble.textContent = content == null ? '' : String(content);
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

    var avatar = this.createAvatar(contact.avatar, 'normal', contact);

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

    var avatar = this.createAvatar(author.avatar, 'small', author);

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
        imagesEl.appendChild(this.renderPostImage(post.images[i]));
      }
    }

    // 时间戳
    var timestamp = document.createElement('div');
    timestamp.className = 'post-timestamp';
    timestamp.textContent = this._formatFullTime(post.timestamp);

    var wvLabels = MI.Data.getMomentWorldviewLabels(post);
    if (wvLabels.length > 0) {
      var wvTag = document.createElement('div');
      wvTag.className = 'post-wv-tags';
      wvTag.textContent = wvLabels.join(' · ');
    }

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
        likesBar.innerHTML = '<i class="fa-solid fa-heart likes-heart-icon"></i> ' + likeNames.join(', ');
        interactionBar.appendChild(likesBar);
      }

      // 评论（含多级嵌套回复）
      if (hasComments) {
        var commentsEl = document.createElement('div');
        commentsEl.className = 'comments-bar';

        var commentMap = {};
        var repliesByParent = {};
        var topComments = [];

        for (var k = 0; k < post.comments.length; k++) {
          var c = post.comments[k];
          commentMap[c.id] = c;
        }

        for (var k2 = 0; k2 < post.comments.length; k2++) {
          var c2 = post.comments[k2];
          if (c2.replyTo) {
            if (commentMap[c2.replyTo]) {
              if (!repliesByParent[c2.replyTo]) repliesByParent[c2.replyTo] = [];
              repliesByParent[c2.replyTo].push(c2);
            } else {
              topComments.push(c2);
            }
          } else {
            topComments.push(c2);
          }
        }

        topComments.sort(function (a, b) { return a.timestamp - b.timestamp; });

        function appendCommentLine(parentEl, comment, commentMap) {
          var commentAuthor = MI.Data.getAuthorById(comment.authorId);
          var commentLine = document.createElement('div');
          commentLine.className = 'comment-line comment-line-clickable';
          commentLine.setAttribute('data-comment-id', comment.id);

          var commentName = document.createElement('span');
          commentName.className = 'comment-name';
          var nameText = (commentAuthor ? commentAuthor.name : '未知');
          if (comment.replyTo && commentMap[comment.replyTo]) {
            var parentAuthor = MI.Data.getAuthorById(commentMap[comment.replyTo].authorId);
            nameText += ' 回复 ' + (parentAuthor ? parentAuthor.name : '未知');
          }
          commentName.textContent = nameText + '：';

          var commentText = document.createElement('span');
          commentText.textContent = comment.content;

          commentLine.appendChild(commentName);
          commentLine.appendChild(commentText);
          parentEl.appendChild(commentLine);
        }

        function renderCommentSubtree(parentEl, comment) {
          appendCommentLine(parentEl, comment, commentMap);
          var children = repliesByParent[comment.id] || [];
          children.sort(function (a, b) { return a.timestamp - b.timestamp; });
          for (var ci = 0; ci < children.length; ci++) {
            renderCommentSubtree(parentEl, children[ci]);
          }
        }

        for (var t = 0; t < topComments.length; t++) {
          renderCommentSubtree(commentsEl, topComments[t]);
        }

        interactionBar.appendChild(commentsEl);
      }

      card.appendChild(header);
      card.appendChild(text);
      if (imagesEl) card.appendChild(imagesEl);
      card.appendChild(timestamp);
      if (wvLabels.length > 0) card.appendChild(wvTag);
      card.appendChild(interactionBar);
    } else {
      card.appendChild(header);
      card.appendChild(text);
      if (imagesEl) card.appendChild(imagesEl);
      card.appendChild(timestamp);
      if (wvLabels.length > 0) card.appendChild(wvTag);
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
    input.className = 'setting-input glass-input';
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
      iconEl.appendChild(this.icon(icon, 'menu-fa-icon'));
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
      arrow.appendChild(this.icon('chevron-right', 'menu-arrow-icon'));
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
