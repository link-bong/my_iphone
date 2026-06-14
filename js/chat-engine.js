/**
 * chat-engine.js — 对话引擎：prompt 组装、分段输出、朋友圈解析
 */
window.MI = window.MI || {};

MI.ChatEngine = {
  BUBBLE_DELAY_MIN: 400,
  BUBBLE_DELAY_MAX: 900,

  LANGUAGE_LABELS: {
    zh: '简体中文',
    'zh-tw': '繁体中文',
    en: 'English',
    ja: '日本語',
    ko: '한국어',
    auto: '跟随对话语言'
  },

  RELATIONSHIP_OPTIONS: [
    { value: 'friend', label: '朋友' },
    { value: 'close_friend', label: '挚友' },
    { value: 'lover', label: '恋人' },
    { value: 'spouse', label: '爱人' },
    { value: 'family', label: '亲人' },
    { value: 'colleague', label: '同事' },
    { value: 'acquaintance', label: '认识的人' },
    { value: 'stranger', label: '陌生人' }
  ],

  RELATIONSHIP_PROMPTS: {
    friend: '你们是朋友。语气自然、轻松，可以闲聊玩笑，保持友好但不过度亲密。称呼、关心程度要符合普通朋友分寸。',
    close_friend: '你们是挚友，彼此非常信任。可以互怼、深聊、分享秘密，语气亲近热络，但仍要符合角色性格，不要脱离人设。',
    lover: '你们是恋人。回复必须体现恋爱关系：亲密、在意、牵挂，可适度撒娇、调情、吃醋或温柔关心。称呼要亲昵自然，情感表达要符合角色性格，不要像普通朋友那样疏离。',
    spouse: '你们是爱人/伴侣，关系稳定而亲密。表达深沉的依赖与爱意，说话像长期在一起的另一半，关心日常、情绪与彼此的未来。',
    family: '你们是亲人。语气亲切、包容，可以唠叨、叮嘱、无顾忌地关心，像家人一样自然，不要像对陌生人那样客气。',
    colleague: '你们是同事。保持职场分寸，礼貌专业；若角色性格较熟，可略放松，但不要越过同事关系边界。',
    acquaintance: '你们刚认识或不太熟。语气客气、有距离感，不要过分热情或亲密，符合初识阶段的交流方式。',
    stranger: '你们几乎不认识或仅有浅层交集。保持礼貌、简短、克制，不要自来熟，除非角色性格本身如此。'
  },

  getDefaultDetails: function () {
    return {
      nickname: '',
      callName: '',
      birthday: '',
      likes: ''
    };
  },

  getDefaultChatSettings: function () {
    return {
      relationship: 'friend',
      chatMode: 'real',
      chatEffect: 'sentence',
      language: 'zh'
    };
  },

  getRelationshipLabel: function (key) {
    var options = this.RELATIONSHIP_OPTIONS;
    for (var i = 0; i < options.length; i++) {
      if (options[i].value === key) return options[i].label;
    }
    return key || '朋友';
  },

  getRelationshipPrompt: function (key) {
    return this.RELATIONSHIP_PROMPTS[key] || this.RELATIONSHIP_PROMPTS.friend;
  },

  getChatSettings: function (contact) {
    var defaults = this.getDefaultChatSettings();
    if (!contact || !contact.chatSettings) return defaults;
    return {
      relationship: contact.chatSettings.relationship != null ? contact.chatSettings.relationship : defaults.relationship,
      chatMode: contact.chatSettings.chatMode || defaults.chatMode,
      chatEffect: contact.chatSettings.chatEffect || defaults.chatEffect,
      language: contact.chatSettings.language || defaults.language
    };
  },

  getContactDetails: function (contact) {
    var defaults = this.getDefaultDetails();
    if (!contact || !contact.details) return defaults;
    return {
      nickname: contact.details.nickname || '',
      callName: contact.details.callName || '',
      birthday: contact.details.birthday || '',
      likes: contact.details.likes || ''
    };
  },

  ensureMessageId: function (msg) {
    if (!msg.id) {
      msg.id = MI.Data.genId('msg');
    }
    return msg;
  },

  /**
   * 为角色构建 system prompt
   */
  buildSystemPrompt: function (contact, worldview) {
    var profile = MI.Storage.getProfile();
    var settings = this.getChatSettings(contact);
    var details = this.getContactDetails(contact);
    var persona = contact.persona || {};
    var parts = [];

    parts.push('【核心指令】');
    parts.push('你现在要完全扮演以下角色，用第一人称与我（' + profile.name + '）在微信上聊天。');
    parts.push('绝对不要跳出角色，不要提及你是 AI 或系统提示。');
    parts.push('必须严格遵循角色性格、关系定位与聊天设置；性格是最优先的约束。');
    parts.push('你要把自己当作一个真实活着的人：有情绪、记忆、立场与细节。言行必须立体、有血有肉，完全从角色自身出发，而非机械完成任务。');
    parts.push('请牢记并延续已有对话内容，保持前后一致。前后逻辑必须连贯，不要出现断层。');

    parts.push('\n【当前时间】' + this.formatContextTime(Date.now()) + '（对话与朋友圈的时间感知请以此为参考）');

    if (worldview && worldview.description) {
      parts.push('\n【世界观背景】\n' + worldview.description);
    }

    var relKey = settings.relationship || 'friend';
    parts.push('\n【关系定位：' + this.getRelationshipLabel(relKey) + '】');
    parts.push(this.getRelationshipPrompt(relKey));

    if (persona.personality) {
      parts.push('\n【性格（最重要，必须贯穿每条回复）】\n' + persona.personality);
    }
    if (persona.chatStyle) {
      parts.push('\n【发信息习惯】\n' + persona.chatStyle);
    }

    var detailLines = [];
    if (details.nickname) detailLines.push('昵称/小名：' + details.nickname);
    if (details.callName) detailLines.push('对我的称呼：' + details.callName);
    if (details.birthday) detailLines.push('生日：' + details.birthday);
    if (details.likes) detailLines.push('喜好：' + details.likes);
    if (detailLines.length > 0) {
      parts.push('\n【角色详细资料】\n' + detailLines.join('\n'));
    }

    if (contact.usePlayerPersona && contact.worldviewId) {
      var playerPersona = MI.Storage.getPlayerPersona(contact.worldviewId);
      var hasPlayerPersona = playerPersona && (
        playerPersona.appearance || playerPersona.personality || playerPersona.background ||
        playerPersona.nickname || playerPersona.callName || playerPersona.birthday || playerPersona.likes
      );
      if (hasPlayerPersona) {
        parts.push('\n【对话对象「' + profile.name + '」在本世界观中的人设】');
        if (playerPersona.nickname) parts.push('昵称：' + playerPersona.nickname);
        if (playerPersona.callName) parts.push('称呼：' + playerPersona.callName);
        if (playerPersona.birthday) parts.push('生日：' + playerPersona.birthday);
        if (playerPersona.likes) parts.push('喜好：' + playerPersona.likes);
        if (playerPersona.appearance) parts.push('外貌：' + playerPersona.appearance);
        if (playerPersona.personality) parts.push('性格：' + playerPersona.personality);
        if (playerPersona.background) parts.push('背景：' + playerPersona.background);
      }
    }

    if (persona.appearance) parts.push('\n【外貌】\n' + persona.appearance);
    if (persona.background) parts.push('\n【个人背景】\n' + persona.background);

    parts.push('\n【聊天模式】');
    if (settings.chatMode === 'action') {
      parts.push('- 动作描写模式：可以输出动作描写（用*动作*或（动作）表示）与对话；每次回复可包含多段内容。');
    } else {
      parts.push('- 真实模式：只输出对话文字，不要动作描写、旁白或括号内的动作说明；每次回复输出多段对话（见下方格式）。');
    }

    parts.push('\n【输出格式（必须遵守）】');
    if (settings.chatEffect === 'immersive') {
      parts.push('1. 沉浸模式：每次回复只能输出一句话，不要换行，不要分多条，尽量简短自然，像实时打出的一条微信。');
    } else if (settings.chatEffect === 'paragraph') {
      parts.push('1. 段落模式：每次回复输出一个完整段落，不要换行分条。');
    } else {
      parts.push('1. 分句/真实模式：每次回复必须拆成多段，每段一条微信消息。优先用换行分隔；若在同一段内有多句话，每句用 。！？ 等结束符分开。每段1-3句，不要编号。');
    }
    parts.push('2. 语气、用词、亲密度必须符合【性格】与【关系定位】，恋人/爱人不得像普通朋友一样冷淡。');

    var langLabel = this.LANGUAGE_LABELS[settings.language] || settings.language;
    if (settings.language && settings.language !== 'auto') {
      parts.push('3. 请使用「' + langLabel + '」进行回复。');
    } else {
      parts.push('3. 回复语言跟随我的对话语言。');
    }
    parts.push('4. 若此刻想发朋友圈，在回复最末尾单独一行附加：<<MOMENT>>朋友圈内容<</MOMENT>>（玩家看不到该标记）。可与对话同时出现。');

    if (MI.MomentEngine) {
      parts.push('\n' + MI.MomentEngine.buildChatMomentGuidance(contact));
    }

    var momentCtx = this._getMomentsContext(contact.worldviewId, contact.id);
    if (momentCtx) {
      parts.push('\n【同世界观近期朋友圈（你可以看到并引用）】\n' + momentCtx);
    }

    return parts.join('\n');
  },

  /**
   * AI 助手简化 prompt
   */
  buildAiAssistantPrompt: function () {
    var config = MI.Storage.getConfig();
    return config.systemPrompt || '你是 AI 助手，请简洁友好地回答。用换行分隔多条短消息。';
  },

  formatContextTime: function (timestamp) {
    if (!timestamp) return '';
    var date = new Date(timestamp);
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日 ' +
      pad(date.getHours()) + ':' + pad(date.getMinutes());
  },

  _getMomentsContext: function (worldviewId, excludeContactId) {
    if (!worldviewId) return '';
    var moments = MI.Storage.getMomentsByWorldview(worldviewId);
    moments.sort(function (a, b) { return b.timestamp - a.timestamp; });

    var lines = [];
    var count = 0;
    for (var i = 0; i < moments.length && count < 8; i++) {
      var m = moments[i];
      var author = MI.Data.getAuthorById(m.authorId);
      var time = this.formatContextTime(m.timestamp);
      var line = '- ' + author.name + '（' + time + '）：' + m.content;
      if (m.comments && m.comments.length > 0) {
        var shown = 0;
        for (var c = 0; c < m.comments.length && shown < 2; c++) {
          var cm = m.comments[c];
          var ca = MI.Data.getAuthorById(cm.authorId);
          line += '\n  └ ' + (ca ? ca.name : '?') + '：' + cm.content;
          shown++;
        }
      }
      lines.push(line);
      count++;
    }
    return lines.join('\n');
  },

  /**
   * 解析 AI 回复
   */
  parseAssistantReply: function (raw) {
    var moment = null;
    var text = raw;

    var momentMatch = text.match(/<<MOMENT>>([\s\S]*?)<\/MOMENT>>/);
    if (momentMatch) {
      moment = momentMatch[1].trim();
      text = text.replace(/<<MOMENT>>[\s\S]*?<\/MOMENT>>/, '').trim();
    }

    var lines = text.split('\n');
    var bubbles = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line) bubbles.push(line);
    }

    if (bubbles.length === 0 && text.trim()) {
      bubbles = [text.trim()];
    }

    return { bubbles: bubbles, moment: moment, raw: raw };
  },

  /**
   * 逐条渲染气泡（可选包裹在 msg-group 内）
   */
  renderBubblesSequentially: function (msgList, bubbles, options, onComplete) {
    options = options || {};
    var wrapper = document.createElement('div');
    wrapper.className = 'msg-group msg-group-assistant';
    if (options.msgId) wrapper.setAttribute('data-msg-id', options.msgId);
    msgList.appendChild(wrapper);

    var index = 0;
    var typingBubble = MI.Components.createTypingBubble();
    wrapper.appendChild(typingBubble);
    msgList.scrollTop = msgList.scrollHeight;

    function showNext() {
      if (index >= bubbles.length) {
        if (typingBubble.parentNode) typingBubble.parentNode.removeChild(typingBubble);
        if (onComplete) onComplete(wrapper);
        return;
      }

      if (typingBubble.parentNode) typingBubble.parentNode.removeChild(typingBubble);

      var partIndex = index;
      var partText = bubbles[partIndex];
      var bubble = MI.Components.createMessageBubble(partText, 'assistant');
      wrapper.appendChild(bubble);

      if (options.onPartAction && options.msg) {
        MI.Components.bindMessageLongPress(bubble, function () {
          options.onPartAction({
            msg: options.msg,
            partIndex: partIndex,
            text: partText
          });
        });
      }

      msgList.scrollTop = msgList.scrollHeight;

      index++;
      if (index < bubbles.length) {
        wrapper.appendChild(typingBubble);
        msgList.scrollTop = msgList.scrollHeight;
        var delay = MI.ChatEngine.BUBBLE_DELAY_MIN +
          Math.floor(Math.random() * (MI.ChatEngine.BUBBLE_DELAY_MAX - MI.ChatEngine.BUBBLE_DELAY_MIN));
        setTimeout(showNext, delay);
      } else {
        if (typingBubble.parentNode) typingBubble.parentNode.removeChild(typingBubble);
        if (onComplete) onComplete(wrapper);
      }
    }

    setTimeout(showNext, 500);
  },

  /**
   * 角色发朋友圈
   */
  createMomentFromChat: function (contact, content) {
    if (!content || !contact.worldviewId) return null;
    var moment = {
      id: MI.Data.genId('m'),
      authorId: contact.id,
      worldviewIds: [contact.worldviewId],
      content: content,
      images: [],
      timestamp: Date.now(),
      likes: [],
      comments: []
    };
    var moments = MI.Storage.getMoments();
    moments.unshift(moment);
    MI.Storage.setMoments(moments);
    return moment;
  },

  /**
   * 获取联系人 API 配置（角色 / 服务号 / AI 助手）
   */
  getApiConfigForContact: function (contact) {
    if (!contact) return null;

    if (contact.type === 'tool') {
      var toolProfileId = contact.apiProfileId;
      var cfg = MI.Storage.getConfig();
      var toolModel = contact.apiModel;
      if (!toolProfileId) {
        toolProfileId = cfg.aiApiProfileId;
        if (!toolModel) toolModel = cfg.aiApiModel;
      }
      if (!toolProfileId) {
        var fallback = MI.Storage.getFirstUsableApiProfile();
        toolProfileId = fallback ? fallback.id : null;
      }
      var toolResolved = MI.Storage.resolveApiProfile(toolProfileId, toolModel);
      if (!toolResolved || !toolResolved.apiKey) return null;
      return {
        apiUrl: toolResolved.apiUrl,
        apiKey: toolResolved.apiKey,
        apiModel: toolResolved.apiModel,
        systemPrompt: contact.systemPrompt || '',
        contactType: 'tool'
      };
    }

    var profileId = contact.apiProfileId;
    if (!profileId) return null;
    var resolved = MI.Storage.resolveApiProfile(profileId, contact.apiModel);
    if (!resolved || !resolved.apiKey) return null;

    var worldview = MI.Storage.getWorldviewById(contact.worldviewId);
    return {
      apiUrl: resolved.apiUrl,
      apiKey: resolved.apiKey,
      apiModel: resolved.apiModel,
      systemPrompt: this.buildSystemPrompt(contact, worldview),
      contactType: 'character'
    };
  },

  /**
   * AI 助手 API 配置
   */
  getApiConfigForAi: function () {
    var config = MI.Storage.getConfig();
    var profileId = config.aiApiProfileId;
    if (!profileId) {
      var fb = MI.Storage.getFirstUsableApiProfile();
      profileId = fb ? fb.id : null;
    }
    var resolved = MI.Storage.resolveApiProfile(profileId, config.aiApiModel);
    if (!resolved) {
      return {
        apiUrl: '',
        apiKey: '',
        apiModel: '',
        systemPrompt: this.buildAiAssistantPrompt(),
        contactType: 'ai'
      };
    }
    return {
      apiUrl: resolved.apiUrl,
      apiKey: resolved.apiKey,
      apiModel: resolved.apiModel,
      systemPrompt: this.buildAiAssistantPrompt(),
      contactType: 'ai'
    };
  },

  /** 流式展示时去掉尚未完整的 MOMENT 标记 */
  stripMomentForStream: function (text) {
    if (!text) return '';
    return text.replace(/<<MOMENT>>[\s\S]*$/, '').replace(/<<MOMENT>>[\s\S]*?<\/MOMENT>>/g, '').trim();
  },

  /** 将文本拆成多段（分句/真实模式用） */
  splitIntoSegments: function (text, chatSettings) {
    chatSettings = chatSettings || this.getDefaultChatSettings();
    var effect = chatSettings.chatEffect || 'sentence';
    var cleaned = String(text || '').trim();
    if (!cleaned) return [];

    if (effect === 'immersive') {
      return [this._firstSentence(cleaned)];
    }
    if (effect === 'paragraph') {
      return [cleaned];
    }

    var segments = [];
    var lines = cleaned.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      var sentences = this._splitBySentence(line);
      if (sentences.length === 0) {
        segments.push(line);
      } else {
        for (var j = 0; j < sentences.length; j++) {
          segments.push(sentences[j]);
        }
      }
    }

    if (segments.length === 0) {
      var fallback = this._splitBySentence(cleaned);
      return fallback.length > 0 ? fallback : [cleaned];
    }
    return segments;
  },

  _splitBySentence: function (text) {
    var result = [];
    var buf = '';
    text = String(text || '');
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      buf += ch;
      if (/[。！？!?…~～]/.test(ch)) {
        var sentence = buf.trim();
        if (sentence) result.push(sentence);
        buf = '';
      }
    }
    if (buf.trim()) result.push(buf.trim());
    return result;
  },

  _stripMomentFromText: function (text) {
    if (!text) return '';
    return String(text).replace(/<<MOMENT>>[\s\S]*?<\/MOMENT>>/g, '').replace(/<<MOMENT>>[\s\S]*$/, '').trim();
  },

  /** 从 AI 原始回复解析为可存储的 parts + content */
  processAssistantReply: function (raw, chatSettings) {
    chatSettings = chatSettings || this.getDefaultChatSettings();
    var parsed = this.parseAssistantReply(raw);
    var bodyText = parsed.bubbles.join('\n');
    if (!bodyText) {
      bodyText = this._stripMomentFromText(parsed.raw);
    }

    var parts = this.splitIntoSegments(bodyText, chatSettings);

    var content = chatSettings.chatEffect === 'paragraph'
      ? parts.join('')
      : parts.join('\n');

    return {
      parts: parts,
      content: content,
      moment: parsed.moment
    };
  },

  _firstSentence: function (text) {
    if (!text) return '';
    text = String(text).trim();
    for (var i = 0; i < text.length; i++) {
      if (/[。！？!?…~～]/.test(text[i])) {
        return text.slice(0, i + 1).trim();
      }
      if (text[i] === '\n') {
        return text.slice(0, i).trim();
      }
    }
    return text;
  },

  /** 确保消息有 parts 数组并与 content 同步 */
  normalizeMessage: function (msg, chatEffect) {
    this.ensureMessageId(msg);
    chatEffect = chatEffect || 'sentence';

    if (msg.role === 'user') {
      var userText = msg.content || (msg.parts && msg.parts[0]) || '';
      msg.parts = userText ? [String(userText).trim()] : [];
      msg.content = msg.parts[0] || '';
      return msg;
    }

    var source = msg.content || (msg.parts ? msg.parts.join('\n') : '');
    msg.parts = this.splitIntoSegments(source, { chatEffect: chatEffect });
    if (msg.parts.length === 0 && source) {
      msg.parts = [String(source).trim()];
    }
    msg.content = chatEffect === 'paragraph' ? msg.parts.join('') : msg.parts.join('\n');
    return msg;
  },

  getMessageParts: function (msg, chatEffect) {
    chatEffect = chatEffect || 'sentence';
    if (msg.role === 'user') {
      if (msg.parts && msg.parts.length > 0) return msg.parts.slice();
      return msg.content ? [String(msg.content).trim()] : [];
    }
    if (chatEffect === 'paragraph' || chatEffect === 'immersive') {
      if (msg.parts && msg.parts.length > 0) return msg.parts.slice();
      return msg.content ? [String(msg.content).trim()] : [];
    }
    return this.splitIntoSegments(
      msg.content || (msg.parts ? msg.parts.join('\n') : ''),
      { chatEffect: chatEffect }
    );
  },

  syncMessageContent: function (msg, chatEffect) {
    if (!msg.parts || msg.parts.length === 0) {
      msg.content = msg.content || '';
      return msg.content;
    }
    msg.content = chatEffect === 'paragraph' ? msg.parts.join('') : msg.parts.join('\n');
    return msg.content;
  },

  editMessagePart: function (messages, msgId, partIndex, newText) {
    var text = String(newText || '').trim();
    if (!text) return false;

    for (var i = 0; i < messages.length; i++) {
      if (messages[i].id !== msgId) continue;
      var msg = messages[i];
      if (!msg.parts || msg.parts.length === 0) {
        msg.parts = [msg.content || ''];
      }
      if (partIndex < 0 || partIndex >= msg.parts.length) return false;
      msg.parts[partIndex] = text;
      msg.content = msg.parts.join('\n');
      return true;
    }
    return false;
  },

  deleteMessagePart: function (messages, msgId, partIndex) {
    for (var i = 0; i < messages.length; i++) {
      if (messages[i].id !== msgId) continue;
      var msg = messages[i];
      if (!msg.parts || msg.parts.length === 0) {
        msg.parts = this.getMessageParts(msg, 'sentence');
      }
      if (partIndex < 0 || partIndex >= msg.parts.length) return false;

      if (msg.parts.length <= 1) {
        messages.splice(i, 1);
      } else {
        msg.parts.splice(partIndex, 1);
        msg.content = msg.parts.join('\n');
      }
      return true;
    }
    return false;
  },

  /** 从完整回复提取最终存储文本（兼容旧调用） */
  finalizeReplyText: function (raw, contactType, chatEffectOrSettings) {
    if (!raw || !String(raw).trim()) return '';
    if (contactType === 'tool' || contactType === 'ai') {
      return String(raw).trim();
    }
    var settings = typeof chatEffectOrSettings === 'object'
      ? chatEffectOrSettings
      : { chatEffect: chatEffectOrSettings || 'sentence' };
    return this.processAssistantReply(raw, settings).content;
  },

  /** 按聊天效果拆分展示气泡（优先使用 msg.parts） */
  splitForDisplay: function (content, chatEffect, role) {
    if (!content || !String(content).trim()) return [];
    if (role === 'user') return [String(content).trim()];
    return this.splitIntoSegments(content, { chatEffect: chatEffect || 'sentence' });
  },

  /** 从完整回复提取朋友圈（仅角色） */
  extractMoment: function (raw, contactType) {
    if (contactType !== 'character') return null;
    return this.parseAssistantReply(raw).moment;
  }
};
