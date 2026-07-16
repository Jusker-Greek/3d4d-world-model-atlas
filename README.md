# 3D / 4D World Model 学习地图

一份中文交互式文献学习网站，资料截止 **2026-07-16**。网站围绕一个核心问题组织：现代方法究竟是在逐场景恢复几何、学习跨场景先验，还是在显式建模可采样的 3D / 4D 条件分布？

在线访问：<https://jusker-greek.github.io/3d4d-world-model-atlas/>

## 内容

- 从 NeRF / 3DGS 到 DUSt3R / VGGT / D4RT 的发展脉络
- D4RT 的全局编码、4D ray query 及其能力边界
- “3D 分布”的五层定义与实际训练流水线
- 单场景优化、摊销式点估计、持久记忆、显式生成分布对比
- CVPR、ICLR、3DV、ICML、AAAI 2026 会议列表审计
- 42 篇论文的会场、任务、学习范式筛选和原文链接
- 三条最短阅读路线与开放研究问题

## 附加教师课件

- [开源 LLM 蒸馏教师课](./public/llm-distillation-teacher-class.html)：资料截至 2026-07-16，覆盖分布匹配、推理轨迹、专项知识、条件化 / 自适应、剪枝与多教师蒸馏；包含需求选型器、模型图鉴、训练路线和一手来源。

## 本地打开

需要 Node.js `>=22.13.0`：

```bash
npm install
npm run dev
```

然后打开 [http://localhost:3000](http://localhost:3000)。

用于 GitHub Pages 的静态导出：

```bash
npm run build:pages
```

## 验证

```bash
npm run lint
npm test
```

`npm test` 会重新构建网站，并检查中文页面、关键章节、D4RT 外链和会场内容是否成功进行服务端渲染。

## 主要文件

- `app/page.tsx`：研究内容、论文数据与筛选交互
- `app/globals.css`：学习网站版式、响应式布局与视觉系统
- `app/layout.tsx`：中文页面元数据
- `tests/rendered-html.test.mjs`：构建后的 HTML 验证

## 证据口径

会议“全列表扫描”指对官方列表逐标题机械筛选、对候选阅读摘要，并对 award / oral 状态回查官方页面；不代表逐篇精读数千篇全文。论文卡片优先链接官方 Open Access、conference virtual page、OpenReview 或 proceedings。项目页只用于补充说明。
