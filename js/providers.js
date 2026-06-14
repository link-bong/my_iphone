/**
 * providers.js — API 厂商预设模板
 */
window.MI = window.MI || {};

MI.Providers = {
  list: [
    {
      id: 'openai',
      name: 'OpenAI (GPT)',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      apiModel: 'gpt-4o-mini',
      note: '需自备 OpenAI API Key'
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      apiUrl: 'https://your-proxy.com/v1/chat/completions',
      apiModel: 'gemini-2.0-flash',
      note: '需使用 OpenAI 兼容中转 URL'
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      apiUrl: 'https://api.deepseek.com/v1/chat/completions',
      apiModel: 'deepseek-chat',
      note: 'DeepSeek 官方 API'
    },
    {
      id: 'claude',
      name: 'Anthropic Claude',
      apiUrl: 'https://your-proxy.com/v1/chat/completions',
      apiModel: 'claude-3-5-sonnet-20241022',
      note: '需使用 OpenAI 兼容中转 URL'
    },
    {
      id: 'siliconflow',
      name: '硅基流动',
      apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
      apiModel: 'deepseek-ai/DeepSeek-V3',
      note: '硅基流动官方 API'
    }
  ],

  getById: function (id) {
    for (var i = 0; i < this.list.length; i++) {
      if (this.list[i].id === id) return this.list[i];
    }
    return null;
  },

  /**
   * 渲染厂商选择器到容器
   */
  renderSelector: function (container, onSelect) {
    container.innerHTML = '';
    var label = document.createElement('div');
    label.className = 'setting-label';
    label.textContent = '选择 API 厂商（一键填充 URL 和模型）';
    container.appendChild(label);

    var grid = document.createElement('div');
    grid.className = 'provider-grid';

    for (var i = 0; i < this.list.length; i++) {
      (function (provider) {
        var card = document.createElement('div');
        card.className = 'provider-card';
        card.innerHTML = '<div class="provider-name">' + provider.name + '</div>' +
          '<div class="provider-note">' + provider.note + '</div>';
        card.addEventListener('click', function (e) {
          e.preventDefault();
          if (onSelect) onSelect(provider);
        });
        grid.appendChild(card);
      })(this.list[i]);
    }

    container.appendChild(grid);
  }
};
