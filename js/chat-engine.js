/**
 * chat-engine.js — 对话引擎：prompt 组装、分段输出、朋友圈解析
 */
window.MI = window.MI || {};

MI.ChatEngine = {
  BUBBLE_DELAY_MIN: 400,
  BUBBLE_DELAY_MAX: 900,

  /**
   * 为角色构建 system prompt
   */
  buildSystemPrompt: function (contact, worldview) {
    var profile = MI.Storage.getProfile();
    var parts = [];

    parts.push('你现在要完全扮演以下角色，用第一人称与我（' + profile.name + '）在微信上聊天。');
    parts.push('绝对不要跳出角色，不要提及你是 AI。');

    if (worldview && worldview.description) {
      parts.push('\n【世界观背景】\n' + worldview.description);
    }

    if (contact.persona) {
      if (contact.persona.appearance) parts.push('\n【外貌】\n' + contact.persona.appearance);
      if (contact.persona.personality) parts.push('\n【性格】\n' + contact.persona.personality);
      if (contact.persona.chatStyle) parts.push('\n【发信息习惯】\n' + contact.persona.chatStyle);
      if (contact.persona.background) parts.push('\n【个人背景】\n' + contact.persona.background);
    }

    parts.push('\n【输出格式要求】');
    parts.push('1. 模拟真实微信聊天：每次回复用换行分隔多条短消息，每条3-4句话，不要编号。');
    parts.push('2. 语气必须符合角色人设和发信息习惯。');
    parts.push('3. 如果此刻想发朋友圈，在回复最末尾单独一行附加：<<MOMENT>>朋友圈内容<</MOMENT>>');
    parts.push('4. 朋友圈内容应贴合当前对话和世界观，玩家看不到 <<MOMENT>> 标记。');

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

  _getMomentsContext: function (worldviewId, excludeContactId) {
    if (!worldviewId) return '';
    var moments = MI.Storage.getMomentsByWorldview(worldviewId);
    moments.sort(function (a, b) { return b.timestamp - a.timestamp; });

    var lines = [];
    var count = 0;
    for (var i = 0; i < moments.length && count < 8; i++) {
      var m = moments[i];
      var author = MI.Data.getAuthorById(m.authorId);
      var time = MI.Components._formatTime(m.timestamp);
      lines.push('- ' + author.name + '（' + time + '）：' + m.content);
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
   * 逐条渲染气泡
   */
  renderBubblesSequentially: function (msgList, bubbles, onEach, onComplete) {
    var index = 0;
    var typingBubble = MI.Components.createTypingBubble();
    msgList.appendChild(typingBubble);
    msgList.scrollTop = msgList.scrollHeight;

    function showNext() {
      if (index >= bubbles.length) {
        if (typingBubble.parentNode) typingBubble.parentNode.removeChild(typingBubble);
        if (onComplete) onComplete();
        return;
      }

      if (typingBubble.parentNode) typingBubble.parentNode.removeChild(typingBubble);

      var bubble = MI.Components.createMessageBubble(bubbles[index], 'assistant');
      msgList.appendChild(bubble);
      msgList.scrollTop = msgList.scrollHeight;

      if (onEach) onEach(bubbles[index], index);

      index++;
      if (index < bubbles.length) {
        msgList.appendChild(typingBubble);
        msgList.scrollTop = msgList.scrollHeight;
        var delay = MI.ChatEngine.BUBBLE_DELAY_MIN +
          Math.floor(Math.random() * (MI.ChatEngine.BUBBLE_DELAY_MAX - MI.ChatEngine.BUBBLE_DELAY_MIN));
        setTimeout(showNext, delay);
      } else {
        if (typingBubble.parentNode) typingBubble.parentNode.removeChild(typingBubble);
        if (onComplete) onComplete();
      }
    }

    var firstDelay = 500;
    setTimeout(showNext, firstDelay);
  },

  /**
   * 角色发朋友圈
   */
  createMomentFromChat: function (contact, content) {
    if (!content || !contact.worldviewId) return null;
    var moment = {
      id: MI.Data.genId('m'),
      authorId: contact.id,
      worldviewId: contact.worldviewId,
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
   * 获取角色 API 配置
   */
  getApiConfigForContact: function (contact) {
    if (!contact || !contact.api) return null;
    var worldview = MI.Storage.getWorldviewById(contact.worldviewId);
    return {
      apiUrl: contact.api.apiUrl,
      apiKey: contact.api.apiKey,
      apiModel: contact.api.apiModel,
      systemPrompt: this.buildSystemPrompt(contact, worldview)
    };
  },

  /**
   * AI 助手 API 配置
   */
  getApiConfigForAi: function () {
    var config = MI.Storage.getConfig();
    return {
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      apiModel: config.apiModel,
      systemPrompt: this.buildAiAssistantPrompt()
    };
  }
};
