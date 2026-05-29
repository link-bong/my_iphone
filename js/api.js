/**
 * api.js — OpenAI 兼容 API 封装
 * 修复了原代码的所有 bug：HTTP 状态检查、loading 状态、错误处理
 */
window.MI = window.MI || {};

MI.API = {
  /**
   * 发送消息到 AI API
   * @param {Array} messages - [{role, content}, ...] 聊天消息数组
   * @param {Object} callbacks
   * @param {Function} callbacks.onSuccess - (replyText: string) => void
   * @param {Function} callbacks.onError - (errorMessage: string) => void
   * @param {Function} callbacks.onStart - () => void — 请求开始时调用
   * @param {Function} callbacks.onEnd - () => void — 请求结束时调用（无论成功失败）
   */
  sendChat: function (messages, callbacks) {
    var config = MI.Storage.getConfig();

    // Bug 修复 1：先检查 API Key 是否存在，再处理 UI
    if (!config.apiKey || config.apiKey.trim() === '') {
      if (callbacks.onError) {
        callbacks.onError('请先在「我 → API 设置」中填写你的 API Key 才能聊天哦！');
      }
      return;
    }

    if (!config.apiUrl || config.apiUrl.trim() === '') {
      if (callbacks.onError) {
        callbacks.onError('请先在「我 → API 设置」中填写 API 转发链接。');
      }
      return;
    }

    if (callbacks.onStart) callbacks.onStart();

    // 构建请求体：system prompt + 聊天历史
    var requestMessages = [
      { role: 'system', content: config.systemPrompt }
    ];
    // 仅发送 role 和 content（去掉 timestamp 等额外字段）
    for (var i = 0; i < messages.length; i++) {
      requestMessages.push({
        role: messages[i].role,
        content: messages[i].content
      });
    }

    var body = {
      model: config.apiModel,
      messages: requestMessages,
      temperature: 0.7
    };

    var self = this;

    fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.apiKey.trim()
      },
      body: JSON.stringify(body)
    })
    .then(function (response) {
      // Bug 修复 2：检查 HTTP 状态码
      if (!response.ok) {
        return response.json().then(function (errData) {
          var errMsg = (errData.error && errData.error.message)
            ? errData.error.message
            : ('HTTP ' + response.status + ' ' + response.statusText);
          throw new Error(errMsg);
        }).catch(function (parseErr) {
          if (parseErr.message && parseErr.message.indexOf('HTTP') !== 0) {
            throw parseErr; // 已经是格式化好的错误
          }
          throw new Error('HTTP ' + response.status + ' ' + response.statusText);
        });
      }
      return response.json();
    })
    .then(function (data) {
      // 安全提取 AI 回复
      if (!data.choices || !data.choices.length || !data.choices[0].message) {
        throw new Error('API 返回了异常的数据格式，请检查模型名称和 API URL 是否正确。');
      }
      var reply = data.choices[0].message.content;
      if (callbacks.onSuccess) callbacks.onSuccess(reply);
    })
    .catch(function (error) {
      console.error('MI.API.sendChat error:', error);
      var msg = error.message || '连接失败，请检查你的 API 链接、Key 是否正确，或者网络是否通畅。';
      if (callbacks.onError) callbacks.onError(msg);
    })
    .finally(function () {
      if (callbacks.onEnd) callbacks.onEnd();
    });
  }
};
