# 小手机 (my_iphone)

一个自己搭建的小手机平台：纯静态网页模拟 iPhone 界面，内置微信风格的 AI 聊天、角色扮演、朋友圈与多世界观管理。所有数据保存在浏览器 localStorage，无需后端服务器。

## 快速开始

1. 直接双击 `index.html` 在浏览器中打开（也支持 `file://` 协议）
2. 或使用本地服务器：

```bash
python -m http.server 8080
# 访问 http://localhost:8080
```

3. 首次使用建议路径：
   - **我 → API 配置**：添加模型商、填写 Key、获取并启用模型
   - **我 → 世界观设定**：创建故事背景
   - **我 → 人设管理**：按世界观设定「你」的人设
   - **微信右上角 ＋**：创建角色或服务号
   - 进入聊天即可对话

## 技术栈

- 原生 HTML / CSS / JavaScript（无框架、无构建工具）
- 全局命名空间 `window.MI` 多文件协作
- 浏览器 localStorage 持久化
- OpenAI 兼容 Chat Completions API
- Font Awesome 图标（CDN）

---

## 功能总览

### 手机主屏幕

- iPhone 风格状态栏、4×2 应用网格、底部 Dock
- **微信**可点击进入；其余应用为装饰占位

### 微信 · 四个 Tab

| Tab | 功能 |
|-----|------|
| **微信** | 会话列表，按最后消息时间排序，未读红点 |
| **通讯录** | 服务号 + 角色（按分类分组），可新建服务号 |
| **发现** | 朋友圈入口；有未读互动时显示红点 |
| **我** | 个人资料、人设、API、世界观、设置入口 |

右上角 **＋** 可快速创建角色或服务号。

---

## 世界观

- 在 **我 → 世界观设定** 中创建/编辑/删除
- 每个世界观包含名称与背景描述
- 角色必须绑定世界观；朋友圈按世界观可见
- 玩家人设可按世界观分别设定

---

## 角色（AI 联系人）

### 创建与编辑

- 基础信息：昵称、小名、对你的称呼、微信号、分类、生日、喜好
- 头像：emoji 选择或上传照片
- 角色人设：外貌、性格、个人背景、发信息习惯
- API：分别选择 **模型商配置** 与 **具体模型**
- 可选开启「在对话中注入我的人设」

### 详细资料页

- 从聊天页点击标题，或编辑页进入
- 展示基本信息、人设、聊天设置摘要
- 快捷入口：聊天设置、朋友圈设置、编辑

### 聊天设置（每角色独立）

| 设置项 | 选项 |
|--------|------|
| 关系 | 朋友 / 挚友 / 恋人 / 爱人 / 亲人 / 同事 / 认识的人 / 陌生人 |
| 聊天模式 | 真实模式（纯对话）/ 动作描写模式（动作+对话） |
| 聊天效果 | 分句输出 / 段落输出 / 沉浸模式（每次一句话） |
| 文字语言 | 简中、繁中、英、日、韩、跟随对话 |

关系与性格会写入 system prompt，影响 AI 语气与亲密度。

### 朋友圈设置（每角色独立）

| 设置项 | 说明 |
|--------|------|
| 发布频率 | 很少 / 适中 / 较活跃 / 仅对话时触发 |
| 内容来源 | 基于人设 / 基于对话 / 两者结合 |
| 发布风格 | 自定义文字描述（如文艺、沙雕、恋爱甜蜜等） |

### 删除

- 应用内确认弹窗；同时删除该角色的聊天记录

---

## 聊天与对话引擎

### 通用能力

- 消息气泡、打字动画、发送中禁用输入
- Enter 发送，Shift+Enter 换行
- 每个会话独立消息历史，发送时自动组装 system prompt + 历史
- 支持任意 OpenAI 兼容 API（DeepSeek、OpenAI、硅基流动等）

### 角色对话 system prompt 包含

- 世界观背景、关系定位、性格/外貌/背景
- 角色详细资料（称呼、生日、喜好等）
- 可选注入玩家在该世界观下的人设
- 当前时间（对话与朋友圈时间感知）
- 聊天模式、输出格式、语言要求
- 同世界观近期朋友圈摘要
- 朋友圈行为指引（频率、风格、来源）

### 分句与多气泡

- 消息以 `parts[]` 分句存储，一条 AI 回复可显示为多个气泡
- **分句模式**：按换行 + 句号/问号/叹号拆分
- **段落模式**：整段一条气泡
- **沉浸模式**：每次仅一句话
- 分句之间带随机延迟，模拟真人连发

### 消息编辑与删除（角色聊天）

- 长按/点击消息分句 → 操作菜单
- **编辑**：应用内输入框修改该句，同步更新 AI 记忆
- **删除**：确认后删除该句；若删光则移除整条消息

### 聊天中发朋友圈

- 角色可在回复末尾附加 `<<MOMENT>>内容<</MOMENT>>`
- 自动解析并发布朋友圈，聊天中显示可点击的链接卡片
- 点击跳转到对应朋友圈并高亮定位

---

## 服务号（工具）

### 内置服务号

- **AI 翻译官**：多语言翻译
- **代码医生**：代码审查与修复建议

内置服务号可改提示词和 API，不可删除。

### 自定义服务号

- 名称、微信号、头像（emoji/照片/工具图标）
- 独立 system prompt
- 分别选择模型商与模型
- 可删除（含聊天记录）

---

## API 配置库

- **我 → API 配置** 统一管理多个模型商
- 每项配置：名称、URL、Key、模型列表
- **检查连接 / 获取模型**：从 API 拉取模型列表
- 用 **+ / −** 启用/禁用模型（至少启用一个）
- 角色、服务号、AI 助手各自选择「模型商 + 具体模型」
- 迁移时会从旧版全局配置自动生成「原全局配置」条目
- 内置多家厂商预设模板（OpenAI、DeepSeek、Gemini、Claude、硅基流动等）

---

## 玩家资料与人设

### 我的资料

- 昵称、小名、称呼、微信号、地区、生日、喜好、个性签名
- emoji 或照片头像

### 人设管理

- **默认人设** + **按世界观分别设定**
- 字段：外貌、性格、背景、昵称、称呼、生日、喜好
- 角色开启「注入玩家人设」后，对话 prompt 会引用对应世界观下的设定

### AI 助手设置

- 选择 API 配置与模型
- 自定义 AI 助手 system prompt
- 内置「AI 助手」会话，独立于角色聊天

### 存储管理

- 应用内弹窗显示会话数、消息数、联系人、API 配置、世界观、朋友圈数量
- 支持清空所有 `mi_` 数据（应用内二次确认）

---

## 朋友圈

### 浏览与发布

- 个人封面（可更换照片）、昵称、头像
- 按时间倒序展示帖子，支持多世界观标签
- 发表：选择世界观（可多选）、文字、图片（最多 9 张，emoji 或照片）
- 编辑/删除自己的帖子；可编辑/删除角色帖子内容

### 互动

- **点赞**：玩家可对任意帖子点赞/取消
- **评论**：内联输入框发表评论
- **回复**：点击评论 → 回复（嵌套显示「A 回复 B：…」）
- **删除评论**：仅可删除自己的评论（含其下回复链）

### 角色 AI 互动

**玩家发帖后**，同世界观角色可能按人设自动点赞/评论。

**玩家评论或回复时**，对应角色可能 AI 回复（静默刷新，无等待提示）：

| 场景 | 由谁回复 |
|------|----------|
| 在角色朋友圈下评论 | 发帖角色 |
| 在角色朋友圈下回复某评论 | 被回复的角色 |
| 在自己朋友圈下回复某角色评论 | 该角色 |

回复时会将完整评论线程作为上下文传给 AI。

**聊天中触发**：角色通过 `<<MOMENT>>` 标签发帖（见上文）。

---

## 朋友圈互动通知

- 角色对玩家帖子的点赞、评论、回复会写入通知
- **发现 Tab** 与 **朋友圈入口**：仅在有未读互动时显示红点（无互动不显示）
- 朋友圈顶部 **「X 条新消息」** 条（微信风格）：
  - 显示参与者头像摘要
  - 点击展开互动列表（点赞/评论/回复文案）
  - 点击某条通知 → 标记已读、滚动定位到对应帖子并高亮
- 页面停留时每 2.5 秒轻量刷新通知条与帖子互动区
- 异步互动完成后自动刷新界面

---

## 应用内 UI（无浏览器弹窗）

全局统一使用微信/iPhone 风格组件，替代 `alert` / `confirm` / `prompt`：

| 组件 | 用途 |
|------|------|
| `showConfirmDialog` | 删除确认（角色、服务号、API、世界观、朋友圈、评论、清空数据等） |
| `showPromptDialog` | 带校验的输入（如编辑消息分句） |
| `showAlertDialog` | 只读信息（存储统计、清空完成提示） |
| `showToast` | 轻提示（保存成功、表单校验、连接失败等） |
| `showActionSheet` | 底部操作菜单（消息编辑/删除、评论回复/删除、创建菜单等） |

---

## 页面与路由

栈式导航（push 右滑入 / pop 左滑出），状态持久化。

| 页面 ID | 说明 |
|---------|------|
| `home` | 主屏幕 |
| `wechat` | 微信 Tab 框架 |
| `chat-detail` | 聊天详情 |
| `moments` | 朋友圈（支持 `momentId` 参数定位） |
| `moment-compose` | 发表朋友圈 |
| `moment-edit` | 编辑朋友圈 |
| `profile-edit` | 编辑我的资料 |
| `player-profile` | 我的资料展示 |
| `player-persona-list` | 人设管理列表 |
| `player-persona-edit` | 编辑玩家人设 |
| `settings` | AI 助手设置 |
| `api-profiles-list` | API 配置列表 |
| `api-profile-edit` | 添加/编辑 API |
| `worldview-list` | 世界观列表 |
| `worldview-edit` | 创建/编辑世界观 |
| `character-create` / `character-edit` | 创建/编辑角色 |
| `character-profile` | 角色详细资料 |
| `character-chat-settings` | 角色聊天设置 |
| `character-moment-settings` | 角色朋友圈设置 |
| `tool-create` / `tool-edit` | 创建/编辑服务号 |

---

## 项目结构

```
my_iphone/
├── index.html              # 入口，按依赖顺序加载脚本
├── css/style.css           # 全局样式（iPhone + 微信视觉）
├── js/
│   ├── main.js             # 启动、旧数据迁移、schema 迁移
│   ├── storage.js          # localStorage 抽象
│   ├── data.js             # 初始化、迁移 v2–v12、工具方法
│   ├── media.js            # 图片选择/上传（base64）
│   ├── providers.js        # API 厂商预设
│   ├── api.js              # OpenAI 兼容 API 封装
│   ├── chat-engine.js      # 对话引擎：prompt、分句、消息编辑、MOMENT 解析
│   ├── moment-engine.js    # 朋友圈 AI 互动（点赞/评论/回复）
│   ├── moment-notifications.js  # 朋友圈互动通知
│   ├── components.js       # UI 组件与弹窗
│   ├── router.js           # 栈式路由
│   ├── worldview.js        # 世界观 CRUD
│   ├── characters.js       # 角色 CRUD、资料、聊天/朋友圈设置
│   ├── tools.js            # 服务号 CRUD
│   ├── api-profiles.js     # API 配置库
│   ├── homescreen.js       # 主屏幕
│   ├── wechat.js           # 微信：Tab、聊天、发现
│   ├── contacts.js         # 通讯录
│   ├── moments.js          # 朋友圈 UI
│   └── profile.js          # 「我」Tab 与设置
├── README.md
└── CLAUDE.md               # 开发者架构说明
```

---

## 数据模型（localStorage）

所有 key 使用 `mi_` 前缀。

| Key | 内容 |
|-----|------|
| `mi_config` | AI 助手：`systemPrompt`、`aiApiProfileId`、`aiApiModel` |
| `mi_profile` | 玩家资料、朋友圈封面、`personas`（默认 + 按世界观） |
| `mi_api_profiles` | API 配置数组（URL、Key、models、enabledModels） |
| `mi_worldviews` | 世界观数组 |
| `mi_contacts` | 联系人（角色 `character` / 服务号 `tool`） |
| `mi_chats` | 会话与消息 |
| `mi_moments` | 朋友圈帖子 |
| `mi_moment_notifications` | 互动通知（点赞/评论/回复，含已读状态） |
| `mi_navigation` | 路由栈与微信 Tab 状态 |
| `mi_meta` | `schemaVersion`（当前 v12） |

### 消息结构

```js
{
  id, role, content, parts[], linkedMomentId?, timestamp
}
```

### 朋友圈结构

```js
{
  id, authorId, worldviewIds[], content, images[],
  timestamp, likes[], comments[{ id, authorId, content, replyTo, timestamp }]
}
```

### 角色关键字段

```js
{
  type: 'character', persona, details, worldviewId,
  apiProfileId, apiModel, usePlayerPersona,
  chatSettings: { relationship, chatMode, chatEffect, language },
  momentSettings: { frequency, style, source }
}
```

启动时自动执行 schema 迁移（v2→v12），并从旧版 key（`api-url`、`api-key` 等）迁移数据。

---

## 部署

```bash
git push origin main
# GitHub 仓库 Settings → Pages 启用即可
```

---

## 安全说明

- API Key 明文存储在 localStorage，请勿在公共设备使用
- AI 返回内容使用 `textContent` 渲染，防 XSS
- 聊天记录仅存本地；API 请求仅发往用户配置的端点

---

## 开发说明

- 零构建：修改 JS/CSS 后刷新浏览器即可
- 命名空间：`MI.ModuleName`，函数使用 `function` 声明
- 事件统一 `addEventListener`，无内联 onclick
- 更多架构细节见 [CLAUDE.md](./CLAUDE.md)
