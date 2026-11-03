# ytl-site

tl y 的中文个人站。GitHub [`1989tianlong`](https://github.com/1989tianlong)，X [`@ytlclaw`](https://x.com/ytlclaw)。

信息架构靠近「主张 → 现在 → 项目 → 写作 → 关于」。视觉跟随 [DOS: Design of Simplicity](https://yangpan.com/design-system) 的字体角色、色板与留白节奏，而不是报纸风高对比黑白。

## 本地

需要 Node.js 22.23.4 或更高（偶数为宜）。

```sh
npm install
npm run dev
```

开发服务器默认在 `http://localhost:4321`。

```sh
npm run build
npm run preview
```

`npm run build` 输出静态文件到 `dist/`。

## 部署（Cloudflare Workers）

本仓库已放好 `wrangler.jsonc`：Worker 名 `ytl-site`，静态资源来自 `dist/`，`workers_dev` 为 true。本地构建不需要 Cloudflare token。

有账号与权限之后：

```sh
npm run build
npx wrangler deploy
```

或一条：

```sh
npm run deploy
```

## 内容

| 路径 | 作用 |
|------|------|
| `src/content/now/*.md` | `/now` 近况（含首页摘录 `teaser`） |
| `src/content/projects.json` | `/projects` 与首页项目列表，仅原创 |
| `src/content/articles/*.md` | 第一手笔记。文件名即 slug，页面在 `/writing/<slug>` |
| `src/content/writing.json` | `/writing` 里的 X 主题索引，外链，不是长文 |
| `src/data/site.ts` | 姓名、链接、Hero、About 用到的可核事实 |

只写来源里有的事实。不要填假指标、假文章、空的播客/音乐/朋友栏目。`src/content/articles/` 只放带来源的笔记。

## 页面

- `/` 首页
- `/now` 现在
- `/projects` 项目
- `/writing` 写作：最新笔记，以及 X 主题
- `/writing/<slug>` 单篇笔记，例如 `/writing/ai-infra-guard-engineering-notes`
- `/about` 关于

> 这行有一个拼写错误：superagent 拼写（拼写故意写错）
