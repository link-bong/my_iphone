/**
 * main.js — 应用入口
 * 初始化命名空间、迁移旧数据、启动应用
 */
window.MI = window.MI || {};

/**
 * 将旧格式 localStorage 数据迁移到新格式
 */
function migrateOldData() {
  var migrated = false;

  // 检查是否存在旧格式数据
  var oldApiUrl = localStorage.getItem('api-url');
  var oldApiKey = localStorage.getItem('api-key');
  var oldApiModel = localStorage.getItem('api-model');
  var oldSystemPrompt = localStorage.getItem('system-prompt');
  var oldChatHistory = localStorage.getItem('chat-history');

  var hasOldData = oldApiUrl || oldApiKey || oldApiModel || oldSystemPrompt || oldChatHistory;

  if (!hasOldData) return;

  // 迁移配置
  var config = MI.Storage.getConfig();
  if (oldApiUrl && !config.apiUrl) config.apiUrl = oldApiUrl;
  if (oldApiKey && !config.apiKey) config.apiKey = oldApiKey;
  if (oldApiModel && !config.apiModel) config.apiModel = oldApiModel;
  if (oldSystemPrompt && config.systemPrompt === '你现在扮演一位贴心的朋友。请保持人设与我聊天。') {
    config.systemPrompt = oldSystemPrompt;
  }
  MI.Storage.setConfig(config);

  // 迁移聊天记录到 AI 助手会话
  if (oldChatHistory) {
    try {
      var oldMessages = JSON.parse(oldChatHistory);
      if (oldMessages.length > 0) {
        var chats = MI.Storage.getChats();
        // 找到 AI 助手会话
        var aiChat = null;
        for (var i = 0; i < chats.length; i++) {
          if (chats[i].id === 'chat_ai') {
            aiChat = chats[i];
            break;
          }
        }
        if (aiChat) {
          // 添加时间戳
          var now = Date.now();
          for (var j = 0; j < oldMessages.length; j++) {
            aiChat.messages.push({
              role: oldMessages[j].role,
              content: oldMessages[j].content,
              timestamp: now - (oldMessages.length - j) * 60000
            });
          }
          // 截断
          if (aiChat.messages.length > 40) {
            aiChat.messages.splice(0, aiChat.messages.length - 40);
          }
          // 更新最后消息
          if (aiChat.messages.length > 0) {
            var lastMsg = aiChat.messages[aiChat.messages.length - 1];
            aiChat.lastMessage = lastMsg.content;
            aiChat.lastMessageTime = lastMsg.timestamp;
          }
          MI.Storage.setChats(chats);
        }
      }
    } catch (e) {
      console.warn('迁移旧聊天记录失败:', e);
    }
  }

  // 删除旧数据
  var oldKeys = ['api-url', 'api-key', 'api-model', 'system-prompt', 'chat-history'];
  for (var i = 0; i < oldKeys.length; i++) {
    localStorage.removeItem(oldKeys[i]);
  }

  console.log('✅ 旧数据已迁移到新格式');
}

/**
 * 应用启动
 */
function boot() {
  // 1. 迁移旧数据
  migrateOldData();

  // 2. schema v2 迁移
  MI.Data.migrateToV2();
  MI.Data.migrateToV3();
  MI.Data.migrateToV4();
  MI.Data.migrateToV5();
  MI.Data.migrateToV6();
  MI.Data.migrateToV7();
  MI.Data.migrateToV8();
  MI.Data.migrateToV9();
  MI.Data.migrateToV10();
  MI.Data.migrateToV11();
  MI.Data.migrateToV12();
  MI.Data.migrateToV13();

  // 3. 初始化数据（仅确保 AI 助手）
  MI.Data.initSeedData();

  // 3. 启动路由（自动渲染当前页面）
  MI.Router.init();

  console.log('📱 小手机已启动');
  console.log('  页面:', MI.Router.currentPage());
  console.log('  微信Tab:', MI.Router.wechatTab);
}

// DOM 加载完成后启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
