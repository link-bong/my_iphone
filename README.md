# 小手机 (my_iphone)

一个自己搭建的小手机平台，自用。

## 简介

纯静态网页应用，模拟手机界面，提供可配置的 AI 聊天功能。数据通过浏览器 localStorage 本地存储，无需后端服务器。

## 功能

- 🤖 AI 聊天 — 支持任意 OpenAI 兼容 API（DeepSeek、OpenAI 等）
- 💾 本地存储 — 聊天记录和 API 配置自动保存
- 📱 移动端适配 — 针对手机触摸优化
- ⚙️ 可自定义 — API URL、密钥、模型、角色设定均可配置

## 如何使用

1. 直接双击 `index.html` 在浏览器中打开
2. 点击 ⚙️ 打开配置面板
3. 填入你的 API Key、API URL 和模型名称
4. 开始聊天！

## 部署到 GitHub Pages

```bash
git push origin main
# 在仓库 Settings → Pages 中启用 GitHub Pages
```

## 技术栈

- 原生 HTML/CSS/JavaScript（无框架、无构建工具）
- 浏览器 localStorage
- OpenAI API 兼容接口
