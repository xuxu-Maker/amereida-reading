# 阿梅雷伊达：一片海的发明 · 三语对照阅读站点

*Amereida, la invención de un mar* — 西语原文 / 英语译文 / 中文译文 三语对照阅读器。
纯静态站点，零外部依赖、零构建步骤，可直接用 GitHub Pages 托管。

## 站点内容

| 项目 | 数量 |
| --- | --- |
| 章节 | 21 |
| 跨页图版（含封面封底） | 121 |
| 段落对照单元 | 637（95% 逐段配到中文） |
| 图片索引条目 | 98 |
| 地名词表条目 | 34 |

## 目录结构

```
index.html                  唯一入口
assets/css/site.css         样式
assets/js/app.js            交互逻辑（原生 JS，无框架）
assets/data/book.js         全书数据（同时提供 book.json 供程序读取）
assets/img/full/p01–121.jpg 跨页扫描网页版（2000px 宽）
assets/img/thumb/p01–121.jpg 缩略图（480px 宽）
.github/workflows/pages.yml GitHub Pages 部署工作流
robots.txt                  声明不被搜索引擎收录（建议性，非访问控制）
```

## 本地运行

直接双击 `index.html` 即可——数据以 `window.BOOK` 内联为 JS，不走 `fetch`，
所以 `file://` 协议下也能完整工作。若需要 HTTP 环境：

```bash
python -m http.server 8000     # 或 npx serve
```

## 部署到 GitHub Pages

仓库根目录即为站点根目录，推送到 `main` 后工作流会自动发布，
地址为 `https://<用户名>.github.io/<仓库名>/`。

首次需要一次性开启：仓库 **Settings → Pages → Source** 选 **GitHub Actions**。
未开启时工作流会在 `configure-pages` 步骤报
`Get Pages site failed … repository has Pages enabled`，开启后重跑即可。

## 使用方式

- **书志**：封面、书志信息、21 章卡片、体例说明。
- **阅读**：左侧为跨页扫描（点击放大，左右半幅翻页），右侧为文本区。
  语言切换提供 `西／英`、`Español`、`English`、`中文` 四种模式。
- 点击任意段落弹出浮层：原文模式下浮层中文译文在前，
  `中文` 模式下浮层原文在前；`←` `→` 在段落间移动，`Esc` 关闭。
- **图片索引** / **地名词表**：可筛选。
- 顶部搜索框对全书西语、英语、中文文本做子串检索，命中项可跳转并直接打开浮层。

键盘：`←` `→` 翻跨页（浮层内翻段落），`Esc` 关闭浮层或大图。

## 数据来源与再生产

文本取自 `Amereida文字.docx`（含中文译文），图片取自原书扫描件。
扫描号与书页码的换算为 `扫描号 = (左页码 + 2) ÷ 2`。
解析与对齐脚本见 `_tmp/`（该目录已 gitignore，不进入站点）。

## 版权提示

本站点包含 *Amereida, la invención de un mar*（Polígrafa, Barcelona, 2018，
ISBN 978-84-343-1376-8）的受版权文本与书页扫描影像，**仅用于个人学习研究用途，
不得用于商业或二次分发**。

本站不收录原书文档原件：文本由本地的 `Amereida文字.docx` 解析而来，原始 `.docx`
文件、扫描件原图以及解析中间产物都保存在仓库之外的 `_tmp/` 目录，既不进入站点，
也不进入部署包 `dist/amereida-site.zip`。

仓库根目录的 `robots.txt` 已对所有爬虫声明 `User-agent: *` 与 `Disallow: /`，
表明不希望本站被搜索引擎收录。请注意 robots 协议只是对爬取者的建议，不构成访问
控制，已被他人链接的页面仍可能被索引；若需要真正限制访问范围，请把仓库改为 Private。
