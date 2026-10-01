# 仝学 · 科研为先

[打开新图库](https://tongxue-research-gallery.onrender.com/) · [完整中文 DESIGN.md](https://tongxue-research-gallery.onrender.com/DESIGN.md) · [验收记录](ACCEPTANCE.md)

20 套方案 × 首页、科研成果、能力中心、论文服务，共 80 张原生设计图。

本轮根据用户反馈，以清晰侧栏、文字优先和大编号为核心，融合期刊阅读、自然采光与学术展陈。三大视角为临床问题、科研方法、成果交付；科研方法含生信分析、医学统计、人工智能和预测建模，按课题选择。

## 交付文件

- `public/index.html`：独立图库。
- `public/DESIGN.md`：完整中文设计说明；网页中每套图片下方默认展开对应解析。
- `design-data.json`：20 套设计主张、色板、四页延续和取舍。
- `prompts.json`：80 张图片的生成提示词；`prompt-revisions.json`：精修与重试提示词。
- `asset-manifest.json`：80 张原图的路径、尺寸、字节数、SHA-256 和生成源文件名。
- `evidence/`：浏览器验收记录、原图一致性记录、联系表和复验脚本。

使用内置图像生成工具，原图从默认输出直接复制到项目。80 张图均为独立生成的 PNG，原始宽度为 1024–1086 像素；未通过放大冒充更高分辨率。导航缩略图单独生成，主图和 PNG 下载使用原始文件。

静态设计图用于视觉选型；可暂停光效为 CSS 氛围叠加。真实可操作范围是图库切换、对比、尺寸控制及下载；图中的业务控件为示意。

## 本地预览和验收

在项目目录启动预览。批量验收会同时请求多张缩略图，因此使用足够的本地连接队列：

```python
import http.server
from functools import partial
http.server.ThreadingHTTPServer.request_queue_size = 128
http.server.ThreadingHTTPServer(
    ('127.0.0.1', 8745),
    partial(http.server.SimpleHTTPRequestHandler, directory='public'),
).serve_forever()
```

`evidence/verify-gallery.mjs` 沿用现有 Ego 浏览器验收方式。复验前将文件中的 TaskSpace ID 和 root 改为当前会话及本地项目位置，然后运行：

```sh
ego-browser nodejs < evidence/verify-gallery.mjs
```

本地逐项点击 20 套四页与各类功能按钮。线上按 01、06、11、20 四套复查全部四页及操作，并用以下命令对全部 80 张线上 PNG 做字节校验：

```sh
python3 evidence/verify-public-assets.py https://tongxue-research-gallery.onrender.com
```

线上浏览器复验时，将同一脚本中的本地地址替换为发布地址；脚本按线上地址自动缩小为 16 页代表性检查。记录保存在 `local-audit.json`、`public-audit.json` 和 `public-assets.json`。

## 发布配置

Render 静态站点，发布目录 `public`，构建命令 `true`。图片路径 `/images/*` 的响应头为 `Cache-Control: public, max-age=0, s-maxage=300, no-transform`，避免 CDN 有损转码。保持两个已有图库与服务不变。

## 建议优先深化

- **02 研究阶序**：侧栏与大编号章节结合最直接，适合成为本轮功能门户的主方向。
- **12 留白索引**：文字优先最鲜明，适合突出科研内容与安静阅读体验。
- **13 编目抽屉**：目录行最便于比较和查找，适合功能较多、熟练用户高频访问的场景。
