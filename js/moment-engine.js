/**
 * moment-engine.js — 朋友圈互动：角色点赞/评论、回复玩家评论
 */
window.MI = window.MI || {};

MI.MomentEngine = {
  FREQUENCY_OPTIONS: [
    { value: 'low', label: '很少发（克制）' },
    { value: 'medium', label: '适中' },
    { value: 'high', label: '较活跃' },
    { value: 'chat_only', label: '仅对话时触发' }
  ],

  SOURCE_OPTIONS: [
    { value: 'persona', label: '基于角色人设与日常' },
    { value: 'chat', label: '基于当前对话' },
    { value: 'both', label: '两者结合' }
  ],

  getDefaultMomentSettings: function () {
    return {
      frequency: 'medium',
      style: '',
      source: 'both'
    };
  },

  getMomentSettings: function (contact) {
    var def = this.getDefaultMomentSettings();
    if (!contact || !contact.momentSettings) return def;
    var ms = contact.momentSettings;
    return {
      frequency: ms.frequency || def.frequency,
      style: ms.style != null ? ms.style : def.style,
      source: ms.source || def.source
    };
  },

  getFrequencyLabel: function (key) {
    var opts = this.FREQUENCY_OPTIONS;
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].value === key) return opts[i].label;
    }
    return key;
  },

  getSourceLabel: function (key) {
    var opts = this.SOURCE_OPTIONS;
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].value === key) return opts[i].label;
    }
    return key;
  },

  /** 写入聊天 system prompt 的朋友圈指引 */
  buildChatMomentGuidance: function (contact) {
    var ms = this.getMomentSettings(contact);
    var settings = MI.ChatEngine.getChatSettings(contact);
    var lines = ['【朋友圈行为】'];
    lines.push('你拥有真实的朋友圈生活。发布内容必须符合人设与下方设置。');
    lines.push('- 发布频率：' + this.getFrequencyLabel(ms.frequency));
    if (ms.frequency === 'chat_only') {
      lines.push('  仅当对话中自然想分享时才发，不要频繁主动提发朋友圈。');
    } else if (ms.frequency === 'low') {
      lines.push('  克制发布，多数对话不必发朋友圈。');
    } else if (ms.frequency === 'high') {
      lines.push('  较活跃，常分享日常、情绪与想法。');
    }
    lines.push('- 内容来源：' + this.getSourceLabel(ms.source));
    if (ms.source === 'persona') {
      lines.push('  优先发与角色自身生活、性格、爱好相关的内容，不必紧扣对话。');
    } else if (ms.source === 'chat') {
      lines.push('  优先基于当前对话与刚聊的话题发朋友圈。');
    } else {
      lines.push('  可发对话延伸，也可发符合人设的独立日常。');
    }
    if (ms.style) {
      lines.push('- 发布风格：' + ms.style);
    }
    lines.push('- 你可以边聊天边发朋友圈：正常回复对话，若此刻想发圈，在回复最末尾单独一行附加 <<MOMENT>>内容<</MOMENT>>。');
    lines.push('- 朋友圈内容要有具体时间感（如「刚」「今晚」「今天」），与【当前时间】一致。');
    lines.push('- 关系为「' + MI.ChatEngine.getRelationshipLabel(settings.relationship) + '」时，发圈语气也要符合该关系。');
    return lines.join('\n');
  },

  /** 玩家发帖后，同世界观角色按人设点赞/评论 */
  reactToPlayerPost: function (momentId, onComplete) {
    var moment = MI.Moments.getById(momentId);
    if (!moment || moment.authorId !== 'player') {
      if (onComplete) onComplete();
      return;
    }

    var characters = this._getCharactersForMoment(moment);
    if (characters.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    var self = this;
    var index = 0;

    function next() {
      if (index >= characters.length) {
        if (onComplete) onComplete();
        return;
      }
      var character = characters[index++];
      self._requestCharacterReaction(character, moment, function (result) {
        if (result) self._applyReaction(momentId, character.id, result);
        next();
      });
    }

    next();
  },

  /** 玩家评论/回复 → 对应角色回复 */
  replyToPlayerComment: function (momentId, commentId, onComplete) {
    var moment = MI.Moments.getById(momentId);
    if (!moment) {
      if (onComplete) onComplete();
      return;
    }

    var playerComment = this._findComment(moment, commentId);
    if (!playerComment || playerComment.authorId !== 'player') {
      if (onComplete) onComplete();
      return;
    }

    var character = this._resolveReplyingCharacter(moment, playerComment);
    if (!character) {
      if (onComplete) onComplete();
      return;
    }

    var self = this;
    this._requestCommentReply(character, moment, playerComment, function (replyText) {
      if (replyText) {
        self._addCharacterReply(momentId, commentId, character.id, replyText);
      }
      if (onComplete) onComplete();
    });
  },

  /** 判断玩家评论是否可能触发角色回复 */
  canReplyToPlayerComment: function (moment, commentId) {
    if (!moment) return false;
    var playerComment = this._findComment(moment, commentId);
    if (!playerComment || playerComment.authorId !== 'player') return false;
    return !!this._resolveReplyingCharacter(moment, playerComment);
  },

  /** 获取应回复玩家的角色 */
  getReplyingCharacter: function (moment, playerComment) {
    return this._resolveReplyingCharacter(moment, playerComment);
  },

  _findComment: function (moment, commentId) {
    for (var i = 0; i < (moment.comments || []).length; i++) {
      if (moment.comments[i].id === commentId) return moment.comments[i];
    }
    return null;
  },

  /** 确定应由哪个角色回复玩家 */
  _resolveReplyingCharacter: function (moment, playerComment) {
    if (playerComment.replyTo) {
      var parent = this._findComment(moment, playerComment.replyTo);
      if (parent && parent.authorId !== 'player') {
        var repliedTo = MI.Data.getContactById(parent.authorId);
        if (repliedTo && MI.Data.isCharacter(repliedTo)) return repliedTo;
      }
    }

    if (moment.authorId !== 'player') {
      var author = MI.Data.getContactById(moment.authorId);
      if (author && MI.Data.isCharacter(author)) return author;
    }

    return null;
  },

  _buildCommentThreadContext: function (moment, playerComment) {
    var lines = [];
    var chain = [];
    var current = playerComment;
    var guard = 0;

    while (current && guard < 8) {
      chain.unshift(current);
      if (!current.replyTo) break;
      current = this._findComment(moment, current.replyTo);
      guard++;
    }

    for (var i = 0; i < chain.length; i++) {
      var cm = chain[i];
      var author = MI.Data.getAuthorById(cm.authorId);
      var name = author ? author.name : '未知';
      var prefix = cm.id === playerComment.id ? '>>> ' : '';
      lines.push(prefix + name + '：「' + cm.content + '」');
    }

    return lines.join('\n');
  },

  _getCharactersForMoment: function (moment) {
    var wvIds = moment.worldviewIds || (moment.worldviewId ? [moment.worldviewId] : []);
    var contacts = MI.Storage.getContacts();
    var result = [];
    for (var i = 0; i < contacts.length; i++) {
      var c = contacts[i];
      if (!MI.Data.isCharacter(c)) continue;
      if (wvIds.indexOf(c.worldviewId) < 0) continue;
      result.push(c);
    }
    return result;
  },

  _buildCharacterPersonaBrief: function (contact) {
    var persona = contact.persona || {};
    var settings = MI.ChatEngine.getChatSettings(contact);
    var parts = [
      '角色：' + contact.name,
      '关系：' + MI.ChatEngine.getRelationshipLabel(settings.relationship)
    ];
    if (persona.personality) parts.push('性格：' + persona.personality);
    if (persona.background) parts.push('背景：' + persona.background);
    if (persona.chatStyle) parts.push('说话习惯：' + persona.chatStyle);
    return parts.join('\n');
  },

  _requestCharacterReaction: function (contact, moment, callback) {
    var apiConfig = MI.ChatEngine.getApiConfigForContact(contact);
    if (!apiConfig || !apiConfig.apiKey) {
      callback(null);
      return;
    }

    var profile = MI.Storage.getProfile();
    var timeStr = MI.ChatEngine.formatContextTime(moment.timestamp);
    var prompt = [
      '【任务】你是「' + contact.name + '」，请根据你的人设决定对玩家朋友圈的互动。',
      this._buildCharacterPersonaBrief(contact),
      '',
      '玩家「' + profile.name + '」刚发了朋友圈：',
      '发布时间：' + timeStr,
      '内容：「' + moment.content + '」',
      '',
      '请决定：点赞、评论、两者都要、或不做任何互动。',
      '评论必须像真人微信，简短自然，符合性格与关系，1-2句即可。',
      '只输出 JSON，不要其它文字：',
      '{"action":"like"|"comment"|"both"|"none","comment":"评论内容或空字符串"}'
    ].join('\n');

    MI.API.sendChat(
      [{ role: 'user', content: prompt }],
      {
        apiUrl: apiConfig.apiUrl,
        apiKey: apiConfig.apiKey,
        apiModel: apiConfig.apiModel,
        systemPrompt: '你是角色社交互动模拟器。严格按人设输出 JSON，不要 markdown。'
      },
      {
        onSuccess: function (reply) {
          callback(MI.MomentEngine._parseReactionJson(reply));
        },
        onError: function () {
          callback(null);
        }
      }
    );
  },

  _requestCommentReply: function (contact, moment, playerComment, callback) {
    var apiConfig = MI.ChatEngine.getApiConfigForContact(contact);
    if (!apiConfig || !apiConfig.apiKey) {
      callback(null);
      return;
    }

    var threadContext = this._buildCommentThreadContext(moment, playerComment);
    var taskLine = playerComment.replyTo
      ? '请回复玩家对你评论的回复。'
      : '请回复玩家在你朋友圈下的评论。';

    var prompt = [
      '【任务】你是「' + contact.name + '」，' + taskLine,
      this._buildCharacterPersonaBrief(contact),
      '',
      '朋友圈原文（' + MI.ChatEngine.formatContextTime(moment.timestamp) + '）：「' + moment.content + '」',
      '评论对话（>>> 为玩家刚发的内容）：',
      threadContext,
      '',
      '请以「' + contact.name + '」身份回复一条，像真人微信，简短自然，符合性格与关系。',
      '只输出回复正文，不要引号、不要 JSON、不要解释。'
    ].join('\n');

    MI.API.sendChat(
      [{ role: 'user', content: prompt }],
      {
        apiUrl: apiConfig.apiUrl,
        apiKey: apiConfig.apiKey,
        apiModel: apiConfig.apiModel,
        systemPrompt: '你是「' + contact.name + '」。完全按人设回复，只输出一条评论内容。'
      },
      {
        onSuccess: function (reply) {
          var text = String(reply || '').trim();
          if (text.indexOf('{') === 0) {
            callback(null);
            return;
          }
          callback(text);
        },
        onError: function () {
          callback(null);
        }
      }
    );
  },

  _parseReactionJson: function (text) {
    if (!text) return null;
    try {
      var match = String(text).match(/\{[\s\S]*\}/);
      if (match) {
        var obj = JSON.parse(match[0]);
        if (obj.action) return obj;
      }
    } catch (e) { /* ignore */ }
    return null;
  },

  _applyReaction: function (momentId, characterId, result) {
    if (!result || result.action === 'none') return;

    var moments = MI.Storage.getMoments();
    for (var i = 0; i < moments.length; i++) {
      if (moments[i].id !== momentId) continue;

      if (!moments[i].likes) moments[i].likes = [];
      if (!moments[i].comments) moments[i].comments = [];

      if (result.action === 'like' || result.action === 'both') {
        if (moments[i].likes.indexOf(characterId) < 0) {
          moments[i].likes.push(characterId);
        }
      }

      if ((result.action === 'comment' || result.action === 'both') && result.comment) {
        var commentText = String(result.comment).trim();
        if (commentText) {
          var cmId = MI.Data.genId('cm');
          moments[i].comments.push({
            id: cmId,
            authorId: characterId,
            content: commentText,
            timestamp: Date.now(),
            replyTo: null
          });
          if (MI.MomentNotifications && moments[i].authorId === 'player') {
            MI.MomentNotifications.notifyComment(moments[i].id, characterId, commentText, cmId);
          }
        }
      }

      if ((result.action === 'like' || result.action === 'both') && moments[i].authorId === 'player') {
        if (MI.MomentNotifications) {
          MI.MomentNotifications.notifyLike(moments[i].id, characterId);
        }
      }
      break;
    }
    MI.Storage.setMoments(moments);
  },

  _addCharacterReply: function (momentId, parentCommentId, characterId, content) {
    var moments = MI.Storage.getMoments();
    for (var i = 0; i < moments.length; i++) {
      if (moments[i].id !== momentId) continue;
      if (!moments[i].comments) moments[i].comments = [];
      var replyId = MI.Data.genId('cm');
      moments[i].comments.push({
        id: replyId,
        authorId: characterId,
        content: String(content).trim(),
        timestamp: Date.now(),
        replyTo: parentCommentId
      });
      if (MI.MomentNotifications) {
        MI.MomentNotifications.notifyReply(moments[i].id, characterId, content, replyId);
      }
      break;
    }
    MI.Storage.setMoments(moments);
  }
};
