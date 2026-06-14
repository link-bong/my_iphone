/**
 * api.js — OpenAI 兼容 API 封装
 */
window.MI = window.MI || {};

MI.API = {
  /**
   * @param {Array} messages
   * @param {Object} config - { apiUrl, apiKey, apiModel, systemPrompt }
   * @param {Object} callbacks
   */
  sendChat: function (messages, config, callbacks) {
    callbacks = callbacks || {};
    config = config || MI.Storage.getConfig();

    if (!config.apiKey || config.apiKey.trim() === '') {
      if (callbacks.onError) {
        callbacks.onError('请先填写 API Key 才能聊天哦！');
      }
      return;
    }

    if (!config.apiUrl || config.apiUrl.trim() === '') {
      if (callbacks.onError) {
        callbacks.onError('请先填写 API 转发链接。');
      }
      return;
    }

    if (callbacks.onStart) callbacks.onStart();

    var requestMessages = [
      { role: 'system', content: config.systemPrompt || '请保持角色设定与我聊天。' }
    ];
    for (var i = 0; i < messages.length; i++) {
      requestMessages.push({
        role: messages[i].role,
        content: messages[i].content
      });
    }

    var body = {
      model: config.apiModel,
      messages: requestMessages,
      temperature: 0.8
    };

    fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.apiKey.trim()
      },
      body: JSON.stringify(body)
    })
    .then(function (response) {
      if (!response.ok) {
        return response.json().then(function (errData) {
          var errMsg = (errData.error && errData.error.message)
            ? errData.error.message
            : ('HTTP ' + response.status + ' ' + response.statusText);
          throw new Error(errMsg);
        }).catch(function (parseErr) {
          if (parseErr.message && parseErr.message.indexOf('HTTP') !== 0) {
            throw parseErr;
          }
          throw new Error('HTTP ' + response.status + ' ' + response.statusText);
        });
      }
      return response.json();
    })
    .then(function (data) {
      if (!data.choices || !data.choices.length || !data.choices[0].message) {
        throw new Error('API 返回了异常的数据格式，请检查模型名称和 API URL 是否正确。');
      }
      var reply = data.choices[0].message.content;
      if (callbacks.onSuccess) callbacks.onSuccess(reply);
    })
    .catch(function (error) {
      console.error('MI.API.sendChat error:', error);
      var msg = error.message || '连接失败，请检查 API 链接、Key 或网络。';
      if (msg.indexOf('Failed to fetch') >= 0 || msg.indexOf('NetworkError') >= 0) {
        msg = '网络请求失败，可能是 CORS 限制。请使用兼容中转或本地代理。';
      }
      if (callbacks.onError) callbacks.onError(msg);
    })
    .finally(function () {
      if (callbacks.onEnd) callbacks.onEnd();
    });
  }
};
