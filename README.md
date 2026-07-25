# 🍀 Get Jobs【工作无忧】

自动投递简历工具，支持 Boss 直聘、猎聘、51job、智联招聘四大平台。

[![Stars](https://img.shields.io/github/stars/loks666/get_jobs?style=flat&label=stars&labelColor=ff4f4f&color=ff8383)](https://github.com/loks666/get_jobs)
[![License](https://img.shields.io/badge/license-MIT-34D058?labelColor=22863A&style=flat)](https://github.com/loks666/get_jobs/blob/master/LICENSE)

> 原项目：[loks666/get_jobs](https://github.com/loks666/get_jobs)

---

## 功能

- **图形化管理界面** — 网页端配置所有参数，无需改代码
- **AI 智能打招呼**（Boss 直聘）— 自动检测岗位匹配度，根据 JD 生成个性化招呼语
- **图片简历自动发送**（Boss 直聘）— 打招呼后自动发送简历图片，提高回复率
- **智能过滤** — 自动跳过不活跃 HR、猎头岗位、薪资不符的职位
- **企业微信通知** — 投递情况实时推送到微信
- **黑名单** — 自动加入不合适公司，避免重复投递
- **持久登录** — Cookie 持久化，大部分平台每周扫码一次即可

---

## 环境要求

| 依赖 | 版本 | 下载 |
|------|------|------|
| Java JDK | 21+ | [Adoptium](https://adoptium.net/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |

> 项目自动判断系统环境并下载对应浏览器驱动，无需手动安装 Chrome。

---

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/Simon404Error/get_jobs.git
cd get_jobs

# 2. 一键配置环境（仅首次）
setup.bat

# 3. 一键启动
start.bat
```

启动后浏览器自动打开管理界面（`http://localhost:6866`），在各平台页面扫码登录，配置好岗位关键词和筛选条件后即可开始投递。

---

## 手动启动

如果不使用脚本，也可以手动操作：

```bash
# 安装前端依赖
cd front
pnpm install

# 构建后端
cd ..
gradlew build -x test

# 启动前端（端口 6866）
cd front
pnpm dev

# 新开终端，启动后端（端口 8888）
cd ..
gradlew bootRun
```

---

## 项目结构

```
get_jobs/
├── front/          # Next.js 前端（管理界面）
├── src/            # Spring Boot 后端（浏览器自动化）
├── db/             # SQLite 数据库
├── start.bat       # 一键启动脚本
├── setup.bat       # 一键环境配置脚本
└── build.gradle.kts # Gradle 构建配置
```

---

## 注意事项

- **关闭代理** — 本工具针对国内招聘平台，代理会导致页面加载缓慢或失败
- **Boss 直聘** — 当前 Boss 新增了检测机制，可能导致投递过程中页面被退回。如果有解决方案欢迎提 PR
- **智联招聘** — 平台问题较多，建议优先使用 Boss 或猎聘
- **51job** — 投递有上限，活跃度低，不推荐
- **不支持服务器部署** — 招聘网站会检测服务器 IP 并拒绝访问

---

## 平台说明

| 平台 | 推荐度 | 说明 |
|------|--------|------|
| Boss 直聘 | ⭐⭐⭐⭐ | 活跃度高，支持 AI 打招呼和图片简历，每日打招呼上限约 150 次 |
| 猎聘 | ⭐⭐⭐⭐ | 量最大，默认打招呼无上限，需在 App 中预设招呼语 |
| 51job | ⭐⭐ | 已衰落，投递有上限，不推荐 |
| 智联招聘 | ⭐ | 问题多，不推荐 |

---

## 联系与社区

- 原项目 QQ 交流群：[点击加入](https://qm.qq.com/q/qJwmIrqPU)（答案：`get_jobs`）
- 源码镜像（国内）：[gitee/loks666/get_jobs](https://gitee.com/lok666/get_jobs)

---

## 参与贡献

1. Fork 本仓库
2. 从 `main` 新建开发分支
3. 开发完成后提交 PR 到上游的 `dev` 分支
4. Commit 信息前请加 Emoji 表情标明类型

> ⚠️ 未经沟通的 PR 会被直接拒绝，请先在 Issue 或 Discussions 中讨论。

---

## 开源协议

[MIT](LICENSE)

---

## 防骗提醒

市面上存在利用本项目招摇撞骗的收费项目，请擦亮眼睛。本项目完全免费开源，不提供任何付费服务。如发现可疑项目，欢迎举报。
