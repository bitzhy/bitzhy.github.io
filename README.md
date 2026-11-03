# 个人学术主页维护说明

本项目是段春晖老师的个人学术主页，使用 Hugo + Hugo Blox 构建，并通过 GitHub Pages 自动发布。

这份说明主要介绍如何修改个人信息、教育和工作经历、研究方向、基金与奖励，以及如何新增论文并上传论文 PDF、报告幻灯片等附件。日常更新通常只需要修改 `data/`、`content/` 和 `static/` 中的文件，不需要改程序代码。

> 建议：修改前先下载或拉取最新版本；每次只更新一类内容，预览无误后再提交。文本文件统一使用 **UTF-8** 编码，以免中文乱码。

## 在线论文管理（本测试仓库）

此仓库是 `bitzhy/bitzhy.github.io` 测试站点，配置不会改动上游老师的仓库。

管理员通过 [Pages CMS](https://app.pagescms.org/) 用有仓库权限的 GitHub 账号登录，首次授权本仓库后选择 `main` 分支，打开“在线论文管理”。拥有者直接登录，无需邮箱邀请；其他维护者可选邮箱邀请。

新增论文时填写标题，可粘贴单条 BibTeX，核对日期和作者，上传 PDF 或幻灯片。“暂存为草稿”默认开启，保存草稿不会显示在主页；确认后关闭草稿并保存，后台自动提交到 GitHub，Actions 构建成功后更新主页，无需手动 push。BibTeX 在构建时读取，不会即时自动填入网页字段。

源记录在 `data/online_publications/`，附件在 `static/papers/online/`、`static/slides/online/`。构建前自动生成论文页面和 BibTeX；不要手改被忽略的 `content/publications/online/`。在线新增的论文可回后台修改或撤回为草稿，地址不随标题更改。此前手工维护的论文未迁移到这个在线记录列表。

本地验证：`node --test scripts/online-publications/sync.test.mjs`。本地预览和构建：`pnpm dev`、`pnpm build`。仅使用 `hugo` 命令时需先执行 `node scripts/online-publications/sync.mjs`。

首次登录授权与是否已安装 GitHub App，以 Pages CMS 和 GitHub 中的实际状态为准。

## 目录

- [个人学术主页维护说明](#个人学术主页维护说明)
  - [目录](#目录)
  - [1. 常用文件和目录](#1-常用文件和目录)
  - [2. 两种修改方式](#2-两种修改方式)
    - [方式一：直接在 GitHub 网页上修改](#方式一直接在-github-网页上修改)
    - [方式二：在电脑本地修改](#方式二在电脑本地修改)
  - [3. 修改个人基本信息](#3-修改个人基本信息)
    - [更换头像](#更换头像)
  - [4. 修改教育经历和工作经历](#4-修改教育经历和工作经历)
  - [5. 新增或修改基金与奖励](#5-新增或修改基金与奖励)
  - [6. 新增一篇论文](#6-新增一篇论文)
    - [第一步：确定论文目录名](#第一步确定论文目录名)
    - [第二步：创建论文信息文件](#第二步创建论文信息文件)
    - [第三步：创建 `cite.bib`](#第三步创建-citebib)
    - [第四步：上传论文 PDF 附件](#第四步上传论文-pdf-附件)
    - [第五步：上传论文报告或其他附件](#第五步上传论文报告或其他附件)
    - [第六步：检查新论文](#第六步检查新论文)
  - [7. 修改或删除已有论文](#7-修改或删除已有论文)
  - [8. 修改首页板块和导航栏](#8-修改首页板块和导航栏)
  - [9. 修改网页主题、字体和视觉风格](#9-修改网页主题字体和视觉风格)
    - [9.1 修改主题和配色](#91-修改主题和配色)
    - [9.2 修改字体和全站字号](#92-修改字体和全站字号)
    - [9.3 修改圆角、间距和头像形状](#93-修改圆角间距和头像形状)
    - [9.4 修改首页背景](#94-修改首页背景)
    - [9.5 修改导航栏风格和功能](#95-修改导航栏风格和功能)
  - [10. 发布和查看部署结果](#10-发布和查看部署结果)
  - [11. 本地构建检查](#11-本地构建检查)

## 1. 常用文件和目录

| 要修改的内容 | 文件或目录 |
| --- | --- |
| 姓名、职称、简介、邮箱、研究方向 | `data/authors/me.yaml` |
| 教育经历、工作经历 | `data/authors/me.yaml` 中的 `education`、`experience` |
| 基金与奖励 | `data/authors/me.yaml` 中的 `awards` |
| 个人头像 | `assets/media/authors/me.png` |
| 首页各板块的标题、顺序和显示方式 | `content/_index.md` |
| 顶部导航栏 | `config/_default/menus.yaml` |
| 论文信息 | `content/publications/`，每篇论文一个文件夹 |
| 论文 PDF | `static/papers/` |
| 论文报告 PPT/PDF | `static/slides/` |

`public/`、`resources/` 和 `node_modules/` 都是自动生成或依赖目录，日常维护时不要手工修改，也不要上传其中的内容。

## 2. 两种修改方式

### 方式一：直接在 GitHub 网页上修改

适合修改文字、日期、链接，以及上传少量附件。

1. 打开本项目的 GitHub 仓库：`https://github.com/bitzhy/bitzhy.github.io`。
2. 找到要修改的文件，点击右上角铅笔按钮 **Edit this file**。
3. 修改内容后，点击 **Commit changes**。
4. 填写简短说明，例如 `更新个人简介` 或 `新增 2026 年论文`。
5. 提交到 `main` 分支后，GitHub 会自动构建并发布网站。

新建文件时点击 **Add file → Create new file**；上传 PDF、PPT、图片等附件时点击 **Add file → Upload files**。上传论文时，论文信息页和附件应当一起提交，避免页面按钮暂时指向不存在的文件。

### 方式二：在电脑本地修改

适合一次更新多篇论文，或希望发布前在本地检查效果。

首次使用需要安装 Git、Node.js 22、pnpm、Go 和 Hugo Extended。进入本项目目录后运行：

```powershell
pnpm install
pnpm dev
```

终端会显示本地预览地址，通常为 `http://localhost:1313/`。编辑并保存文件后，网页会自动刷新。

确认没有问题后提交并推送：

```powershell
git pull
git add .
git commit -m "更新主页信息"
git push
```

如多人同时维护，务必先执行 `git pull`，避免覆盖他人刚刚提交的内容。

## 3. 修改个人基本信息

打开 `data/authors/me.yaml`。常用字段如下：

```yaml
name:
  display: "Chunhui Duan"
  given: "Chunhui"
  family: "Duan"
  alternate: "段春晖"

role: "Associate Professor"

bio: "这里填写英文个人简介。可使用 [显示文字](https://example.com) 添加链接。"

affiliations:
  - name: "School of Computer Science and Technology, Beijing Institute of Technology"
    url: "https://cs.bit.edu.cn/"

links:
  - icon: "at-symbol"
    url: "mailto:duanch@bit.edu.cn"
    label: "E-mail Me"
  - icon: "academicons/google-scholar"
    url: "https://scholar.google.com/citations?user=sAY6y4gAAAAJ"

interests:
  - "RFID"
  - "Internet-of-Things"
  - "Indoor Localization"
  - "Wireless Sensing"
```

注意事项：

- 冒号后必须有一个空格，例如 `role: "Professor"`。
- 含有冒号、井号或中英文混排的长文本，建议放在英文双引号中。
- 列表中的每一项以两个空格和 `-` 开头，缩进不要随意改变。
- `bio` 支持 Markdown 链接，也可以用 `<br><br>` 手工换段。
- `ids.google_scholar` 和上面的 Google Scholar 链接应保持一致。

### 更换头像

用新的照片替换 `assets/media/authors/me.png` 即可。建议使用清晰的正方形 PNG 图片，并保留文件名 `me.png`，这样不需要修改其他配置。

## 4. 修改教育经历和工作经历

教育经历位于 `data/authors/me.yaml` 的 `education:` 下：

```yaml
education:
  - degree: "Ph.D. in Software Engineering"
    institution: "School of Software, Tsinghua University"
    start: "2013-08"
    end: "2018-06"
    summary: "经历说明，可留空。"
```

工作经历位于 `experience:` 下：

```yaml
experience:
  - role: "Associate Professor"
    org: "School of Computer Science and Technology, Beijing Institute of Technology"
    start: "2021-03"
    end: ""
    summary: ""
```

新增经历时，复制一整项（从 `- role` 或 `- degree` 开始），粘贴到合适位置后再修改。当前任职的 `end` 保持为空字符串 `""`；已经结束的经历填写结束年月。建议按时间倒序排列，最近的经历放在最上面。

## 5. 新增或修改基金与奖励

基金和奖励统一放在 `data/authors/me.yaml` 的 `awards:` 下，并显示在首页 **Funds & Awards** 板块。

新增一项时，可以复制下面的模板：

```yaml
awards:
  - title: "项目英文名称（项目中文名称）"
    awarder: "资助机构英文名称, Grant No. 项目编号"
    date: "2026-12-31"
    summary: "**Principal Investigator** · Jan 2024 – Dec 2026 · RMB 500K"
    icon: ""
```

各字段含义：

- `title`：项目或奖励名称；可同时填写中英文。
- `awarder`：资助机构、计划名称和项目编号。
- `date`：项目结束日期，格式必须为 `年-月-日`。网页会根据该日期排序。
- `summary`：承担角色、起止时间和经费等补充信息。`**文字**` 会显示为粗体，`·` 用于分隔信息。
- `icon`：目前留空即可。

承担角色建议统一使用 `Principal Investigator`、`Backbone Participant` 或 `Participant`。如果不希望显示经费，可以直接省略金额。

修改已有基金时直接找到对应项修改。删除时必须删除这一项从 `- title:` 到 `icon:` 的全部内容，不要只删除标题。

## 6. 新增一篇论文

每篇论文由三部分组成：

1. `content/publications/论文目录名/index.md`：网页上显示的论文信息。
2. `content/publications/论文目录名/cite.bib`：BibTeX 引用信息。
3. `static/papers/论文目录名.pdf`：供读者下载的论文 PDF。

### 第一步：确定论文目录名

目录名建议使用：

```text
年份-英文标题小写-单词之间用连字符
```

例如：

```text
2026-example-paper-title
```

目录名只能使用英文字母、数字和连字符，不要使用空格、中文、括号、冒号或其他特殊符号。目录名一旦发布，尽量不要再改，因为它同时用于页面地址和附件地址。

### 第二步：创建论文信息文件

在 `content/publications/` 下新建论文目录，并在其中新建 `index.md`。可以复制一篇同类型的旧论文，也可以使用下面的完整模板：

```yaml
---
title: "Example Paper Title"
authors:
  - "First Author"
  - "me"
  - "Third Author"
author_notes:
  - ""
  - "Corresponding author"
  - ""
date: "2026-06-01T00:00:00Z"
publication_types: ["article-journal"]
publication:
  name: "IEEE Transactions on Example"
  short_name: "IEEE TOE"
  volume: "25"
  issue: "6"
  pages: "100-120"
peer_reviewed: true
featured: false
tags:
  - "CCF-A"
  - "中科院一区"
links:
  - type: pdf
    url: "/papers/2026-example-paper-title.pdf"
hugoblox:
  ids:
    doi: "10.1234/example.2026.001"
---

## Citation

F. Author, C. Duan, and T. Author, “Example Paper Title,” IEEE Transactions on Example, vol. 25, no. 6, pp. 100-120, 2026.

## 中文引用（GB/T 7714）

Author F, Duan C, Author T. Example Paper Title[J]. IEEE Transactions on Example, 2026, 25(6): 100-120.
```

字段填写说明：

- `title`：论文英文标题。
- `authors`：作者顺序必须与论文一致；段老师本人写成 `"me"`，网页会自动显示为段春晖老师并加粗。
- `author_notes`：必须与 `authors` 一一对应、数量相同。通讯作者位置填写 `"Corresponding author"`，其他作者填写 `""`。如不需要作者备注，也可将整个 `author_notes` 字段删除。
- `date`：正式发表日期，格式为 `YYYY-MM-DDT00:00:00Z`。列表按此日期倒序排列。
- `publication_types`：期刊填写 `"article-journal"`，会议填写 `"paper-conference"`。
- `publication.name`：期刊或会议全名。
- `publication.short_name`：常用简称，例如 `IEEE TMC`、`IEEE INFOCOM`。
- `volume`、`issue`、`pages`：没有的信息可以删除对应行；会议论文还可以添加 `location: "城市, 国家"`。
- `peer_reviewed`：同行评审论文通常为 `true`。
- `featured`：改为 `true` 可将论文标记为重点论文；通常保持 `false`。
- `tags`：目前用于显示 CCF 和中科院分区标签；没有的标签不要硬填，可以删除该项。
- `links`：论文 PDF、幻灯片及其他外部链接。
- `doi`：只填写 DOI 本身，不要写 `https://doi.org/`；尚无 DOI 时可删除 `hugoblox` 整段。
- 两个 `Citation` 段落：分别填写英文引用和 GB/T 7714 中文引用。它们是正文，必须写在第二个 `---` 之后。

### 第三步：创建 `cite.bib`

在同一个论文目录中创建 `cite.bib`。期刊论文示例：

```bibtex
@article{author2026example,
  title   = {Example Paper Title},
  author  = {Author, First and Duan, Chunhui and Author, Third},
  journal = {IEEE Transactions on Example},
  year    = {2026},
  volume  = {25},
  number  = {6},
  pages   = {100--120},
  doi     = {10.1234/example.2026.001}
}
```

会议论文将首行改为 `@inproceedings`，并把 `journal` 改为 `booktitle`。BibTeX 内容应与 `index.md` 中的作者、题目、年份等信息保持一致。

### 第四步：上传论文 PDF 附件

将论文 PDF 放到 `static/papers/`，文件名必须与论文目录名完全相同：

```text
content/publications/2026-example-paper-title/index.md
static/papers/2026-example-paper-title.pdf
```

同时在 `index.md` 中填写：

```yaml
links:
  - type: pdf
    url: "/papers/2026-example-paper-title.pdf"
```

三个位置的名称必须一致：

1. `content/publications/` 下的论文目录名；
2. `static/papers/` 下的 PDF 文件名（外加 `.pdf` 后缀）；
3. `index.md` 中 `url` 的文件名。

注意不要把 PDF 放进 `public/`。`public/` 会在每次构建时重新生成，里面的手工文件可能丢失。

### 第五步：上传论文报告或其他附件

报告幻灯片放入 `static/slides/`。PPTX 和 PDF 均可，例如：

```text
static/slides/2026-example-paper-title.pptx
```

然后在论文的 `links` 下增加：

```yaml
links:
  - type: pdf
    url: "/papers/2026-example-paper-title.pdf"
  - type: slides
    url: "/slides/2026-example-paper-title.pptx"
```

也可以添加项目主页、代码或视频等外部链接，例如：

```yaml
  - type: code
    url: "https://github.com/example/project"
  - type: video
    url: "https://example.com/video"
```

外部链接必须写完整的 `https://...` 地址；站内附件路径以 `/` 开头。

### 第六步：检查新论文

提交前至少检查以下内容：

- 作者顺序是否正确，段老师是否写为 `"me"`。
- `author_notes` 的条目数量是否与作者数量一致。
- 期刊或会议类型、名称、年份、卷期页码、分区是否正确。
- DOI 是否只填写编号本身。
- 英文引用、中文引用和 BibTeX 是否一致。
- 点击网页上的 **PDF** 和 **Slides** 按钮能否正常打开附件。
- 新论文是否按日期出现在正确位置。

## 7. 修改或删除已有论文

修改论文时，进入对应的 `content/publications/论文目录名/index.md`，直接修改相关字段；如果引用信息也发生变化，应同步修改 `cite.bib`。

替换 PDF 时，用新文件覆盖 `static/papers/` 中的同名文件即可。由于文件名和链接不变，不需要修改 `index.md`。

删除一篇论文时，需要同时删除：

- `content/publications/` 下该论文的整个目录；
- `static/papers/` 下对应 PDF；
- `static/slides/` 下对应的报告文件（如果有）。

如果只是暂时不希望展示，建议不要删除附件，而是在论文 `index.md` 顶部的 YAML 区域增加：

```yaml
draft: true
```

重新显示时删除这一行或改为 `draft: false`。

## 8. 修改首页板块和导航栏

首页配置在 `content/_index.md`：

- `About Me`：个人介绍板块标题。
- `Recent Publications`：论文板块标题。
- `Funds & Awards`：基金与奖励板块标题。
- 每一段的 `id` 对应导航栏中的锚点，不建议随意修改。

顶部导航栏在 `config/_default/menus.yaml`。`name` 是显示文字，`url` 指向首页板块，`weight` 越小越靠前。例如：

```yaml
main:
  - name: Papers
    url: /#papers
    weight: 30
```

只修改显示文字时改 `name` 即可；不要随意更改 `url`，除非同时修改首页对应板块的 `id`。

## 9. 修改网页主题、字体和视觉风格

网页样式主要由三个位置控制：

| 修改范围 | 文件 | 适合修改的内容 |
| --- | --- | --- |
| 全站基础主题 | `config/_default/params.yaml` | 主题包、亮暗模式、字体、字号、圆角、间距、导航栏 |
| 首页局部外观 | `content/_index.md` | 首页背景、头像大小和形状、各板块布局 |
| 精细自定义样式 | `assets/css/custom.css` | 论文卡片、基金列表、标签颜色、按钮和移动端样式 |

建议优先修改 `params.yaml`。主题配置无法满足需求时，再修改 CSS。每次调整后都应检查电脑端、手机端、浅色模式和深色模式。

### 9.1 修改主题和配色

打开 `config/_default/params.yaml`，当前配置为：

```yaml
theme:
  mode: system
  pack: cupcake
  colors:
    primary: ""
    secondary: ""
    neutral: ""
```

- `mode: system`：跟随访客设备的亮暗模式。主题版本支持时，也可尝试固定为 `light` 或 `dark`。
- `pack: cupcake`：当前 Hugo Blox 主题风格包，控制全站基础配色和组件外观。
- `primary`、`secondary`、`neutral`：主色、辅助色和中性色；当前留空表示使用主题包默认值。

只想整体换风格时，最稳妥的方式是在网页右上角的主题选择器中先试选，再把选中的主题包名称写入 `pack`。

页面目前允许访客切换亮暗模式和主题：

```yaml
header:
  theme_toggle: true
  theme_picker: true
```

将某项改为 `false` 可隐藏对应按钮。如果希望所有访客看到统一风格，可确定 `theme.pack` 后将 `theme_picker` 改为 `false`。

### 9.2 修改字体和全站字号

字体配置位于 `config/_default/params.yaml`：

```yaml
typography:
  font: sans
  size: md
  pack: academic
```

- `font: sans`：无衬线字体，风格简洁，适合网页阅读。
- `size: md`：全站中等基础字号。通常可尝试 `sm`、`md` 或 `lg`，以本地预览结果为准。
- `pack: academic`：使用偏学术主页的排版组合。

如果只是觉得全站文字偏小或偏大，优先修改 `size`，不要逐个页面改 CSS。不同 Hugo Blox 版本支持的字体预设可能不同，修改字体后应运行 `hugo` 或 `pnpm build` 验证。

论文列表另有局部字号，位于 `assets/css/custom.css`：

```css
.publication-title {
  font-size: clamp(1.05rem, 1.7vw, 1.22rem);
}

.publication-authors {
  font-size: 0.91rem;
}

.publication-venue {
  font-size: 0.9rem;
}
```

`rem` 是相对全站基础字号的单位；`clamp(最小值, 自适应值, 最大值)` 会让标题随屏幕宽度适度变化。建议一次只微调一个数值。

### 9.3 修改圆角、间距和头像形状

全站布局设置位于 `config/_default/params.yaml`：

```yaml
layout:
  radius: md
  spacing: spacious
  avatar_shape: circle
```

- `radius`：卡片和按钮的圆角程度，当前为中等圆角。
- `spacing`：页面整体留白和内容疏密，当前为较宽松的 `spacious`。
- `avatar_shape`：头像形状，当前为圆形 `circle`。

首页还在 `content/_index.md` 中单独指定了头像：

```yaml
design:
  avatar:
    size: "medium"
    shape: "circle"
```

首页局部配置可能覆盖全站设置。如果修改 `params.yaml` 后头像没有变化，应同步检查这里的 `avatar.shape`。头像大小可通过 `size` 调整。

### 9.4 修改首页背景

首页 About 区域当前使用渐变网格背景，在 `content/_index.md` 的第一个 section 中：

```yaml
design:
  background:
    gradient_mesh:
      enable: true
```

将 `enable` 改为 `false` 可以关闭背景。其他首页板块也位于同一文件的 `sections:` 列表中；调整时建议一次只改一个 section。

### 9.5 修改导航栏风格和功能

导航栏外观在 `config/_default/params.yaml`：

```yaml
header:
  enable: true
  style: navbar
  sticky: true
  align: center
  search: true
  theme_toggle: true
  theme_picker: true
```

- `enable`：是否显示导航栏。
- `style`：导航栏样式，当前为 `navbar`。
- `sticky`：是否在页面滚动后仍固定在顶部。
- `align`：导航内容对齐方式，当前居中。
- `search`：是否显示站内搜索。

这里控制外观和功能；导航项文字、链接和顺序仍在 `config/_default/menus.yaml` 中修改。



## 10. 发布和查看部署结果

推送到 `main` 分支后，`.github/workflows/deploy.yml` 会自动执行构建并发布到 GitHub Pages，一般等待几分钟即可。

可以在 GitHub 仓库的 **Actions** 页面查看状态：

- 绿色对勾：构建和部署成功。
- 黄色圆点：仍在构建，请稍等。
- 红色叉号：构建失败，点击该次任务查看报错。

如果只是修改了文件但没有点击 **Commit changes**，或本地修改后没有执行 `git push`，网站不会更新。浏览器可能缓存旧页面，可使用 `Ctrl + F5` 强制刷新。

## 11. 本地构建检查

运行开发服务器：

```powershell
pnpm dev
```

执行与发布环境接近的完整构建：

```powershell
pnpm build
```

如果 `pnpm build` 正常结束，生成的网站会位于 `public/`。该目录仅用于检查构建结果，不需要提交到 GitHub。

