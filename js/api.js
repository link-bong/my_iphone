/**
 * api.js — OpenAI 兼容 API 封装
 */
window.MI = window.MI || {};

MI.API = {
  /**
   * 从 chat/completions URL 推导 models URL
   */
  getModelsUrl: function (apiUrl) {
    if (!apiUrl) return '';
    var url = apiUrl.trim().replace(/\/+$/, '');

    if (url.indexOf('/chat/completions') >= 0) {
      return url.replace('/chat/completions', '/models');
    }
    if (/\/v1$/i.test(url)) {
      return url + '/models';
    }
    if (url.indexOf('/v1/') >= 0) {
      return url.replace(/\/v1\/.*$/, '/v1/models');
    }
    return url + '/v1/models';
  },

  /**
   * 拉取可用模型列表
   */
  fetchModels: function (apiUrl, apiKey, callbacks) {
    callbacks = callbacks || {};

    if (!apiKey || !apiKey.trim()) {
      if (callbacks.onError) callbacks.onError('请先填写 API Key');
      return;
    }
    if (!apiUrl || !apiUrl.trim()) {
      if (callbacks.onError) callbacks.onError('请先填写 API URL');
      return;
    }

    var modelsUrl = this.getModelsUrl(apiUrl);
    if (callbacks.onStart) callbacks.onStart();

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutId = controller ? setTimeout(function () {
      controller.abort();
    }, 90000) : null;

    fetch(modelsUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + apiKey.trim(),
        'Content-Type': 'application/json'
      },
      signal: controller ? controller.signal : undefined
    })
    .then(function (response) {
      if (!response.ok) {
        return response.json().then(function (errData) {
          var errMsg = (errData.error && errData.error.message)
            ? errData.error.message
            : ('HTTP ' + response.status + ' ' + response.statusText);
          throw new Error(errMsg);
        }).catch(function (parseErr) {
          if (parseErr.message && parseErr.message.indexOf('HTTP') !== 0) throw parseErr;
          throw new Error('HTTP ' + response.status + ' ' + response.statusText);
        });
      }
      return response.json();
    })
    .then(function (data) {
      var models = [];
      if (data.data && data.data.length) {
        for (var i = 0; i < data.data.length; i++) {
          if (data.data[i].id) models.push(data.data[i].id);
        }
      } else if (data.models && data.models.length) {
        for (var j = 0; j < data.models.length; j++) {
          var m = data.models[j];
          models.push(typeof m === 'string' ? m : m.id);
        }
      }
      models.sort();
      if (models.length === 0) {
        throw new Error('未获取到模型列表，请检查 API 是否支持 /v1/models');
      }
      if (callbacks.onSuccess) callbacks.onSuccess(models);
    })
    .catch(function (error) {
      console.error('MI.API.fetchModels error:', error);
      var msg = error.message || '获取模型失败';
      if (error.name === 'AbortError') {
        msg = '请求超时，请检查网络或 API 地址';
      } else if (msg.indexOf('Failed to fetch') >= 0 || msg.indexOf('NetworkError') >= 0) {
        msg = '网络请求失败，可能是 CORS 限制。请使用兼容中转或本地代理。';
      }
      if (callbacks.onError) callbacks.onError(msg);
    })
    .finally(function () {
      if (timeoutId) clearTimeout(timeoutId);
      if (callbacks.onEnd) callbacks.onEnd();
    });
  },

  sendChat: function (messages, config, callbacks) {
    callbacks = callbacks || {};
    config = config || MI.Storage.getConfig();

    if (!config.apiKey || config.apiKey.trim() === '') {
      if (callbacks.onError) callbacks.onError('请先填写 API Key 才能聊天哦！');
      return;
    }

    if (!config.apiUrl || config.apiUrl.trim() === '') {
      if (callbacks.onError) callbacks.onError('请先填写 API 转发链接。');
      return;
    }

    if (!config.apiModel || !config.apiModel.trim()) {
      if (callbacks.onError) callbacks.onError('请先选择或填写模型名称。');
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

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutId = controller ? setTimeout(function () {
      controller.abort();
    }, 90000) : null;

    fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.apiKey.trim()
      },
      body: JSON.stringify(body),
      signal: controller ? controller.signal : undefined
    })
    .then(function (response) {
      if (!response.ok) {
        return response.json().then(function (errData) {
          var errMsg = (errData.error && errData.error.message)
            ? errData.error.message
            : ('HTTP ' + response.status + ' ' + response.statusText);
          throw new Error(errMsg);
        }).catch(function (parseErr) {
          if (parseErr.message && parseErr.message.indexOf('HTTP') !== 0) throw parseErr;
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
      if (error.name === 'AbortError') {
        msg = '请求超时，请检查网络或 API 地址';
      } else if (msg.indexOf('Failed to fetch') >= 0 || msg.indexOf('NetworkError') >= 0) {
        msg = '网络请求失败，可能是 CORS 限制。请使用兼容中转或本地代理。';
      }
      if (callbacks.onError) callbacks.onError(msg);
    })
    .finally(function () {
      if (timeoutId) clearTimeout(timeoutId);
      if (callbacks.onEnd) callbacks.onEnd();
    });
  },

  /**
   * 流式聊天（stream: true，OpenAI SSE 格式）
   */
  sendChatStream: function (messages, config, callbacks) {
    callbacks = callbacks || {};
    config = config || MI.Storage.getConfig();

    if (!config.apiKey || config.apiKey.trim() === '') {
      if (callbacks.onError) callbacks.onError('请先填写 API Key 才能聊天哦！');
      return;
    }
    if (!config.apiUrl || config.apiUrl.trim() === '') {
      if (callbacks.onError) callbacks.onError('请先填写 API 转发链接。');
      return;
    }
    if (!config.apiModel || !config.apiModel.trim()) {
      if (callbacks.onError) callbacks.onError('请先选择或填写模型名称。');
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
      temperature: 0.8,
      stream: true
    };

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutId = controller ? setTimeout(function () {
      controller.abort();
    }, 120000) : null;

    var self = this;

    fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.apiKey.trim()
      },
      body: JSON.stringify(body),
      signal: controller ? controller.signal : undefined
    })
    .then(function (response) {
      if (!response.ok) {
        return response.text().then(function (text) {
          var errMsg = 'HTTP ' + response.status + ' ' + response.statusText;
          try {
            var errData = JSON.parse(text);
            if (errData.error && errData.error.message) errMsg = errData.error.message;
          } catch (e) { /* 非 JSON 错误体 */ }
          throw new Error(errMsg);
        });
      }
      if (!response.body || !response.body.getReader) {
        throw new Error('当前浏览器不支持流式响应');
      }
      return self._readChatStream(response.body.getReader(), callbacks);
    })
    .catch(function (error) {
      console.error('MI.API.sendChatStream error:', error);
      var msg = error.message || '连接失败，请检查 API 链接、Key 或网络。';
      if (error.name === 'AbortError') {
        msg = '请求超时，请检查网络或 API 地址';
      } else if (msg.indexOf('Failed to fetch') >= 0 || msg.indexOf('NetworkError') >= 0) {
        msg = '网络请求失败，可能是 CORS 限制。请使用兼容中转或本地代理。';
      }
      if (callbacks.onError) callbacks.onError(msg);
    })
    .finally(function () {
      if (timeoutId) clearTimeout(timeoutId);
      if (callbacks.onEnd) callbacks.onEnd();
    });
  },

  /** 解析 SSE 流并逐块回调 */
  _readChatStream: function (reader, callbacks) {
    var decoder = new TextDecoder();
    var buffer = '';
    var fullText = '';

    function processLine(line) {
      var trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') return;
      if (trimmed.indexOf('data: ') !== 0) return;

      var payload = trimmed.slice(6);
      try {
        var json = JSON.parse(payload);
        var choice = json.choices && json.choices[0];
        if (!choice) return;

        var piece = '';
        if (choice.delta && choice.delta.content) {
          piece = choice.delta.content;
        } else if (choice.message && choice.message.content) {
          piece = choice.message.content;
        }

        if (piece) {
          fullText += piece;
          if (callbacks.onChunk) callbacks.onChunk(piece, fullText);
        }
      } catch (e) {
        /* 忽略单行解析失败 */
      }
    }

    function pump() {
      return reader.read().then(function (result) {
        if (result.done) {
          if (buffer.trim()) processLine(buffer);
          if (callbacks.onSuccess) callbacks.onSuccess(fullText);
          return;
        }

        buffer += decoder.decode(result.value, { stream: true });
        var lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (var i = 0; i < lines.length; i++) {
          processLine(lines[i]);
        }
        return pump();
      });
    }

    return pump();
  }
};
