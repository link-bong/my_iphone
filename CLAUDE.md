# 小手机 (my_iphone) — 开发者架构说明

纯前端 iPhone 模拟器 + 微信风格应用。多世界观 AI 角色扮演、服务号工具、朋友圈社交与互动通知。数据存 localStorage，无后端。

用户向功能说明见 [README.md](./README.md)。

## 架构原则

- **多文件原生 JS**，全局命名空间 `window.MI`，模块间通过 `MI.ModuleName` 通信
- `<script>` 按依赖顺序加载（非 ES module，兼容 `file://`）
- UI 全部由 JS 动态生成，无 HTML 模板
- 零构建工具；唯一外部依赖为 Font Awesome CDN
- 事件统一 `addEventListener`；函数统一 `function` 声明（非箭头函数）

## 项目结构

```
my_iphone/
├── index.html                  # 入口：#app + 脚本加载顺序
├── css/
│   └── style.css               # 全局样式（iPhone + 微信 + 弹窗/朋友圈等）
├── js/
│   ├── storage.js              # localStorage 读写、各 key 便捷方法
│   ├── data.js                 # 初始化、schema 迁移 v2–v12、Data 工具
│   ├── media.js                # 图片选择 → base64（头像/朋友圈/封面）
│   ├── providers.js            # API 厂商预设模板
│   ├── api.js                  # OpenAI 兼容 Chat Completions + fetchModels
│   ├── chat-engine.js          # system prompt、分句、消息 parts、MOMENT 解析
│   ├── moment-engine.js        # 角色对玩家帖点赞/评论、回复玩家评论
│   ├── moment-notifications.js # 朋友圈互动通知（未读红点、刷新回调）
│   ├── components.js           # UI 组件、弹窗、帖子卡片、Tab 栏
│   ├── router.js               # 栈式导航 + 动画 + 页面 dispatch
│   ├── worldview.js            # 世界观 CRUD
│   ├── characters.js           # 角色 CRUD、资料页、聊天/朋友圈设置
│   ├── tools.js                # 服务号 CRUD
│   ├── api-profiles.js         # API 配置库 CRUD、获取模型、启用列表
│   ├── homescreen.js           # 主屏幕网格 + Dock
│   ├── wechat.js               # 微信 Tab、会话列表、聊天详情、发现
│   ├── contacts.js             # 通讯录（服务号 + 角色分类）
│   ├── moments.js              # 朋友圈 UI、评论/回复、轮询刷新
│   ├── profile.js              # 「我」Tab、资料、人设、AI 助手设置
│   └── main.js                 # boot：旧 key 迁移 → schema 迁移 → Router.init
├── README.md
├── CLAUDE.md
└── .gitignore
```

## 脚本依赖顺序（index.html）

```
storage → data → media → providers → api
  → chat-engine → moment-engine → moment-notifications
  → components → router
  → worldview → characters → tools → api-profiles
  → homescreen → wechat → contacts → moments → profile
  → main
```

**注意**：`moment-notifications.js` 依赖 `components` 之前的 `storage`/`data`；`moment-engine.js` 依赖 `MI.Moments.getById`（`moments.js` 在后加载），但引擎方法在运行时调用，加载顺序 OK。

## 模块职责

| 模块 | 命名空间 | 职责 |
|------|----------|------|
| `storage.js` | `MI.Storage` | get/set/remove、`getProfile`、`getApiProfiles`、`resolveApiProfile`、`normalizeMoments`、`clearAll` |
| `data.js` | `MI.Data` | `genId`、`getContactById`、`getAuthorById`、`isCharacter`/`isTool`、`ensureAiChat`、`migrateToV*` |
| `chat-engine.js` | `MI.ChatEngine` | `buildSystemPrompt`、`splitIntoSegments`、`normalizeMessage`、`editMessagePart`、`deleteMessagePart`、`parseMomentFromReply` |
| `moment-engine.js` | `MI.MomentEngine` | `reactToPlayerPost`、`replyToPlayerComment`、`getReplyingCharacter`、`canReplyToPlayerComment` |
| `moment-notifications.js` | `MI.MomentNotifications` | `notifyLike/Comment/Reply`、`getUnreadCount`、`markReadByMoment`、`_notifyChange` |
| `components.js` | `MI.Components` | 导航栏、Tab 栏、表单、弹窗（`showConfirmDialog`/`showPromptDialog`/`showAlertDialog`/`showToast`/`showActionSheet`）、`createMomentsPost`、`createMessageGroup` |
| `router.js` | `MI.Router` | `navigateTo`、`goBack`、`goHome`、`switchWechatTab`、`render`、`currentPage` |
| `wechat.js` | `MI.WeChat` | Tab 渲染、聊天发送、消息分句展示、分句编辑删除、`refreshIfVisible` |
| `moments.js` | `MI.Moments` | 朋友圈页/发表/编辑、评论回复删除、通知条、`_pollTimer` 轻量刷新 |

## 路由与页面 dispatch

栈式导航（`stack` + `paramStack`），状态持久化到 `mi_navigation`。

`MI.Router.render()` → `switch` 分发：

| page | 渲染函数 |
|------|----------|
| `home` | `MI.HomeScreen.render` |
| `wechat` | `MI.WeChat.render` |
| `chat-detail` | `MI.WeChat.renderChatDetail` |
| `moments` | `MI.Moments.render` |
| `moment-compose` | `MI.Moments.renderCompose` |
| `moment-edit` | `MI.Moments.renderEdit` |
| `settings` | `MI.Profile.renderSettings` |
| `profile-edit` | `MI.Profile.renderEdit` |
| `player-profile` | `MI.Profile.renderPlayerProfile` |
| `player-persona-list` | `MI.Profile.renderPersonaList` |
| `player-persona-edit` | `MI.Profile.renderPersonaEdit` |
| `api-profiles-list` | `MI.ApiProfiles.renderList` |
| `api-profile-edit` | `MI.ApiProfiles.renderEdit` |
| `worldview-list` | `MI.Worldview.renderList` |
| `worldview-edit` | `MI.Worldview.renderEdit` |
| `character-create` | `MI.Characters.renderCreate` |
| `character-edit` | `MI.Characters.renderEdit` |
| `character-profile` | `MI.Characters.renderProfile` |
| `character-chat-settings` | `MI.Characters.renderChatSettings` |
| `character-moment-settings` | `MI.Characters.renderMomentSettings` |
| `tool-create` | `MI.Tools.renderCreate` |
| `tool-edit` | `MI.Tools.renderEdit` |

常用 params：`{ chatId, contactId }`、`{ momentId }`、`{ profileId }`、`{ worldviewId }`。

## localStorage 数据模型

所有 key 前缀 `mi_`。

| Key | 结构要点 |
|-----|----------|
| `mi_config` | `{ systemPrompt, aiApiProfileId, aiApiModel }` — AI 助手 |
| `mi_profile` | `{ name, wechatId, avatar, region, whatsUp, nickname, callName, birthday, likes, momentsCover, personas: { default, byWorldview } }` |
| `mi_api_profiles` | `[{ id, name, apiUrl, apiKey, models[], enabledModels[], apiModel, builtin? }]` |
| `mi_worldviews` | `[{ id, name, description, createdAt }]` |
| `mi_contacts` | 角色 `type:'character'` 或服务号 `type:'tool'` |
| `mi_chats` | `[{ id, contactId?, name?, avatar?, messages[], lastMessage, lastMessageTime, unreadCount }]` |
| `mi_moments` | `[{ id, authorId, worldviewIds[], content, images[], timestamp, likes[], comments[] }]` |
| `mi_moment_notifications` | `[{ id, type, momentId, commentId?, actorId, content, timestamp, read }]` |
| `mi_navigation` | `{ stack, paramStack, wechatTab }` |
| `mi_meta` | `{ schemaVersion }` — 当前 **12** |

### 消息

```js
{ id, role: 'user'|'assistant', content, parts: string[], linkedMomentId?, timestamp }
```

- `parts` 为分句数组；UI 每 part 一个气泡
- `MI.ChatEngine.normalizeMessage` 在加载/发送时补齐 `parts`

### 评论

```js
{ id, authorId, content, replyTo: commentId|null, timestamp }
```

### 角色关键字段

```js
{
  id, type: 'character', name, avatar, wechatId, pinyin, category, worldviewId,
  persona: { appearance, personality, background, chatStyle },
  details: { nickname, callName, birthday, likes },
  apiProfileId, apiModel, usePlayerPersona,
  chatSettings: { relationship, chatMode, chatEffect, language },
  momentSettings: { frequency, style, source }
}
```

### 服务号

```js
{ id, type: 'tool', name, systemPrompt, apiProfileId, apiModel, avatar, avatarMode, avatarIcon, builtin? }
```

内置：`tool_translator`、`tool_code_doctor`（`MI.Data.BUILTIN_TOOLS`）。

## Schema 迁移（main.js boot 顺序）

| 版本 | 主要内容 |
|------|----------|
| v2 | 清空种子联系人/朋友圈，保留 AI 助手会话 |
| v3 | 世界观数组 |
| v4 | 联系人 `type`、内置服务号 |
| v5 | 服务号 `builtin` 标记 |
| v6 | API 配置库、角色 apiProfileId/apiModel |
| v7 | 玩家人设 personas |
| v8 | 角色 details、chatSettings |
| v9 | 消息 parts、linkedMomentId |
| v10 | 助手消息按句拆分 |
| v11 | 朋友圈封面、momentSettings、comment.replyTo |
| v12 | `mi_moment_notifications` 初始化 |

另：`main.js` 的 `migrateOldData()` 从 `api-url`/`api-key`/`api-model`/`system-prompt`/`chat-history` 迁移到新 key。

## API 调用链

1. **解析配置**：`MI.Storage.resolveApiProfile(profileId, modelName)` → `{ apiUrl, apiKey, apiModel }`
2. **角色/工具**：各自 `apiProfileId` + `apiModel`；AI 助手用 `mi_config`
3. **请求**：`MI.API.sendChat(messages, config, callbacks)` — Chat Completions
4. **拉模型**：`MI.API.fetchModels(url, key, callbacks)` — 用于 API 配置页

聊天 history 截断：`splice(0, len - 40)` 保留最近消息。

## 对话引擎要点（chat-engine.js）

- `buildSystemPrompt(contact, worldview)` — 关系、性格、玩家人设、时间、朋友圈指引、近期朋友圈摘要
- `splitIntoSegments(text, chatSettings)` — 按 `chatEffect` 分句/段落/沉浸
- `parseMomentFromReply(text)` — 提取 `<<MOMENT>>…<</MOMENT>>`，返回 `{ text, momentContent }`
- `editMessagePart` / `deleteMessagePart` — 同步更新 `content` 与 `parts`

## 朋友圈引擎要点（moment-engine.js）

- `reactToPlayerPost(momentId)` — 同世界观角色依次 AI 决定 like/comment/none
- `replyToPlayerComment(momentId, commentId)` — `_resolveReplyingCharacter`：
  - 有 `replyTo` → 被回复的角色
  - 否则 → 帖子作者（若为角色）
- `_applyReaction` / `_addCharacterReply` → 写入 storage + `MI.MomentNotifications`

## 互动通知（moment-notifications.js）

- 写入后 `_notifyChange()` → `MI.WeChat.refreshIfVisible()` / `MI.Moments.refreshIfVisible()`
- 发现 Tab 红点：`MI.MomentNotifications.getUnreadCount() > 0`
- 朋友圈页：`MI.Moments._createNotificationBar()` + 2.5s 轮询 `_updateLive`

## UI 弹窗规范

**禁止**在新代码中使用 `alert`/`confirm`/`prompt`（`storage.js` 配额溢出保留 fallback）。

| 方法 | 场景 |
|------|------|
| `MI.Components.showConfirmDialog(title, msg, onOk, onCancel, { danger, confirmText })` | 删除确认 |
| `MI.Components.showPromptDialog(title, default, onOk, onCancel, { validate })` | 编辑消息等输入 |
| `MI.Components.showAlertDialog(title, msg, onOk)` | 只读信息 |
| `MI.Components.showToast(msg, duration)` | 校验/保存/错误 |
| `MI.Components.showActionSheet(title, items[{ label, onClick, danger }])` | 消息/评论操作 |

## 代码规范

- 命名空间：`window.MI`，模块 `MI.ModuleName`
- 缩进：4 空格
- 命名：camelCase（变量/函数）、kebab-case（DOM class/id）
- 注释：中文
- 循环：部分模块用 `for` 而非 `forEach`（兼容性）
- 文本渲染：AI/用户内容用 `textContent`，防 XSS

## 安全

- API Key 明文存 localStorage
- 聊天/朋友圈数据仅本地 + 用户配置的 API 端点

## 如何运行

```bash
# 直接双击 index.html
python -m http.server 8080
git push origin main  # GitHub Pages
```

## 已知 API/聊天 Bug 修复（api.js + wechat.js）

| 问题 | 修复 |
|------|------|
| API Key 检查晚于 bubble 创建 | 先校验再 UI |
| 无 HTTP 错误检查 | `response.ok` + 错误消息 |
| 无 loading / 重复发送 | 发送时禁用按钮与输入 |
| `word-break: break-all` | 改为 `break-word` |
| `innerText` 丢换行 | `textContent` + `pre-wrap` |
| history `shift()` 截断 | `splice(0, len - 40)` |
| 无 Enter 发送 | Enter 发送，Shift+Enter 换行 |
