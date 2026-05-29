# 小手机 (my_iphone) — 手机模拟器 + 微信应用

一个纯前端网页应用，模拟 iPhone 手机界面，内置微信风格的聊天、通讯录、朋友圈等功能。
所有数据通过 localStorage 存储在浏览器本地，无需后端服务器。

## 项目结构

```
my_iphone/
├── index.html              # 薄壳入口：meta、#app 挂载点、按依赖顺序加载 JS/CSS
├── css/
│   └── style.css           # 全局样式（约600行，iPhone + WeChat 视觉风格）
├── js/
│   ├── main.js             # 入口：命名空间初始化、旧数据迁移、启动路由
│   ├── storage.js          # localStorage 读写抽象层（含错误处理）
│   ├── data.js             # 种子数据（15个联系人、8条朋友圈）+ 初始化逻辑
│   ├── api.js              # OpenAI 兼容 API 封装（修复了所有已知 bug）
│   ├── router.js           # 栈式导航系统（push/pop 动画）
│   ├── components.js       # 可复用 UI 组件工厂函数
│   ├── homescreen.js       # iPhone 主屏幕（应用网格 + Dock）
│   ├── wechat.js           # 微信核心：Tab 框架、聊天列表、聊天详情（AI）、发现页
│   ├── contacts.js         # 通讯录（拼音分组）
│   ├── moments.js          # 朋友圈（封面 + 帖子列表）
│   └── profile.js          # 「我」Tab + API 设置页
├── README.md
├── CLAUDE.md
└── .gitignore
```

## 架构

- **多文件原生 JS**，通过全局命名空间 `window.MI` 通信
- 每个 JS 文件在 `<script>` 标签中按依赖顺序加载（非 ES module，兼容 `file://` 协议）
- 所有 UI 由 JS 动态生成，无 HTML 模板
- 零外部依赖、零构建工具

## 如何运行

```bash
# 方法 1：直接双击打开
# 直接双击 index.html 即可

# 方法 2：本地服务器
python -m http.server 8080
# 然后访问 http://localhost:8080

# 方法 3：部署到 GitHub Pages
git push origin main
# 在仓库 Settings → Pages 中启用
```

## 功能概览

| 页面 | 文件 | 功能 |
|------|------|------|
| 主屏幕 | `homescreen.js` | 8个应用图标（4×2网格）+ 4个Dock应用，微信可点击 |
| 聊天列表 | `wechat.js` | 会话列表，按时间排序，未读红点 |
| 聊天详情 | `wechat.js` | 消息气泡 + 打字动画 + API 调用 + 输入栏 |
| 通讯录 | `contacts.js` | 联系人按拼音首字母分组（A-Z） |
| 发现 | `wechat.js` | 朋友圈入口（红点）+ 装饰性菜单 |
| 朋友圈 | `moments.js` | 封面 + 帖子（文字、图片、点赞、评论） |
| 我 | `profile.js` | 个人资料 + API 设置入口 + 存储统计 |
| API 设置 | `profile.js` | API URL、Key、模型、System Prompt 配置 |

## localStorage 数据模型

所有 key 使用 `mi_` 前缀，避免与旧数据冲突。

| Key | 类型 | 内容 |
|-----|------|------|
| `mi_config` | object | `{ apiUrl, apiKey, apiModel, systemPrompt }` |
| `mi_profile` | object | `{ name, wechatId, avatar, region, whatsUp }` |
| `mi_contacts` | array | `[{ id, name, avatar, wechatId, phone, pinyin }]` 15个种子联系人 |
| `mi_chats` | array | `[{ id, contactId, messages, lastMessage, lastMessageTime, unreadCount }]` |
| `mi_moments` | array | `[{ id, authorId, content, images, timestamp, likes, comments }]` 8条种子帖子 |
| `mi_navigation` | object | `{ stack: ["home"], wechatTab: "chats" }` 导航状态持久化 |

启动时自动从旧 key（`api-url`、`api-key`、`api-model`、`system-prompt`、`chat-history`）迁移数据。

## API 调用

- `api.js` 发送 OpenAI 兼容的 Chat Completions 请求
- 支持任意兼容 API（DeepSeek、OpenAI 等）
- 每个会话独立发送自己的消息历史（而非全局历史）
- 每次请求自动构建 `[system prompt, ...chat messages]`

## 已修复的 Bug

| # | 原问题 | 修复方式 |
|---|--------|---------|
| 1 | API key 检查晚于 bubble 创建 | 先检查 API Key 再处理 UI |
| 2 | 无 HTTP 错误状态检查 | `response.ok` 检查 + 提取错误消息 |
| 3 | 无 loading 状态，可重复发送 | 发送时禁用按钮 + 输入框 |
| 4 | `word-break: break-all` | 改为 `break-word` |
| 5 | `innerText` 丢失换行 | 改用 `textContent` + `white-space: pre-wrap` |
| 6 | `shift()` 截断不完整 | 改用 `splice(0, len - 40)` |
| 7 | 不支持 Enter 发送 | 添加 keydown 监听（Enter 发送，Shift+Enter 换行）|

## 导航系统

栈式导航（模仿 iOS UINavigationController）：
- `MI.Router.navigateTo(page, params)` — 推入新页面（右滑动画）
- `MI.Router.goBack()` — 弹出当前页面（左滑动画）
- `MI.Router.goHome()` — 回到主屏幕
- 页面标识：`"home"` → `"wechat"` → `"chat-detail"` / `"moments"` / `"settings"`

## 代码规范

- 命名空间：`window.MI`，每个模块 `MI.ModuleName`
- 缩进：4 空格
- 命名：camelCase（变量/函数）、kebab-case（DOM ID）
- 注释：中文，`//` 单行、`/* */` 多行、`/** */` JSDoc
- 事件：全部通过 `addEventListener` 绑定（无内联 onclick）
- 函数：全部使用 `function` 声明（非箭头函数，兼容性更好）

## 安全

- API Key 明文存储在 localStorage 中
- 所有 AI 返回内容使用 `textContent`（防 XSS）
- 聊天记录仅存本地，不上传至任何服务器（除用户配置的 API 端点）
