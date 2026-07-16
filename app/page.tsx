"use client";

import { useMemo, useState } from "react";
import {
  branchCounts,
  d4rtCapabilityColumns,
  d4rtCapabilityMatrix,
  distributionColumns,
  distributionMatrix,
  dossiers,
  geometryColumns,
  geometryMatrix,
  type CellState,
  type MatrixRow,
} from "./research-data";

type Column = { key: string; label: string; group: string };

const readingPaths = [
  {
    label: "主干 · 90 分钟",
    question: "一张图怎样变成统一 3D 几何？",
    steps: ["CroCo", "DUSt3R", "VGGT", "D4RT"],
    reason: "从跨视图自监督，到共同坐标 pointmap，再到多视图全局上下文，最后到统一 4D ray query。",
  },
  {
    label: "动态 4D · 2 小时",
    question: "如何同时消除视角变化与物体运动？",
    steps: ["MonST3R", "DPM", "St4RTrack", "V-DPM", "Point4Cast"],
    reason: "先看动态深度，再看时间不变点图、长程跟踪、视频级融合，最后看未观测未来。",
  },
  {
    label: "记忆 · 70 分钟",
    question: "怎样不再把每个图像对独立处理？",
    steps: ["Spann3R", "CUT3R", "Point4Cast"],
    reason: "外部空间记忆 → 递归持久状态 → 可按任意过去、现在和未来时间读出的 spacetime state。",
  },
  {
    label: "3D 分布 · 2 小时",
    question: "怎样从单解重建走向可采样的 3D？",
    steps: ["LRM", "MVDream", "TRELLIS", "O-Voxel", "U4D"],
    reason: "先看到确定性回归的均值化失败，再依次学习图像空间、原生 3D latent 与 4D diffusion。",
  },
  {
    label: "物理世界模型 · 2 小时",
    question: "怎样让 3D 状态受动作条件控制？",
    steps: ["TesserAct", "PointWorld", "3WM", "P3Sim"],
    reason: "比较生成 RGB-D-N、直接预测 point flow、任意条件分布，以及显式 3D belief 四种答案。",
  },
];

const lineages = [
  {
    name: "A · 前馈几何主干",
    problem: "从 pair-wise 表征推进到全局、稀疏可查询的 4D 函数",
    nodes: ["MAE", "CroCo", "DUSt3R", "VGGT", "D4RT"],
    edges: ["自监督范式", "直接继承", "全局化", "问题延续"],
    kinds: ["concept", "direct", "representation", "concept"],
  },
  {
    name: "B · 动态 4D",
    problem: "把相机运动与物体运动拆开，并扩展到视频和未来",
    nodes: ["DUSt3R", "Dynamic Point Maps", "V-DPM", "Point4Cast"],
    edges: ["四张点图", "DPM + VGGT", "持久状态"],
    kinds: ["direct", "direct", "concept"],
  },
  {
    name: "C · 持久记忆",
    problem: "不再逐对对齐，让历史观测沉淀为可更新状态",
    nodes: ["DUSt3R", "Spann3R", "CUT3R", "Point4Cast"],
    edges: ["外部记忆", "递归状态", "时空查询"],
    kinds: ["direct", "concept", "concept"],
  },
  {
    name: "D · 参考系与度量",
    problem: "固定参考帧会引入顺序偏置；相对尺度不能直接用于机器人",
    nodes: ["VGGT", "π³", "MapAnything", "Any4D"],
    edges: ["去参考帧", "平行问题", "直接初始化"],
    kinds: ["direct", "concept", "direct"],
  },
  {
    name: "E · 原生 3D 生成分布",
    problem: "确定性单图回归会平均多解，生成模型需要真正的 3D latent",
    nodes: ["LRM", "MVDream", "TRELLIS", "O-Voxel"],
    edges: ["多解动机", "结构化 latent", "直接扩展"],
    kinds: ["concept", "representation", "direct"],
  },
  {
    name: "F · 概率物理世界模型",
    problem: "从重建已发生的世界，推进到动作条件下的未来 belief",
    nodes: ["3WM", "P3Sim", "PointWorld", "LPWM"],
    edges: ["直接继承", "确定性对照", "多未来参照"],
    kinds: ["direct", "concept", "concept"],
  },
];

const statusMeta: Record<CellState, { mark: string; label: string }> = {
  yes: { mark: "✓", label: "论文有直接证据" },
  partial: { mark: "◐", label: "部分满足或依赖额外步骤" },
  no: { mark: "×", label: "论文未解决或有反证" },
};

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="external-link" href={href} target="_blank" rel="noreferrer">
      {children}<span aria-hidden="true">↗</span>
    </a>
  );
}

function SectionHeading({ index, title, note, light = false }: { index: string; title: React.ReactNode; note: string; light?: boolean }) {
  return (
    <div className={`section-heading split${light ? " light" : ""}`}>
      <div>
        <p className="section-number">{index}</p>
        <h2>{title}</h2>
      </div>
      <p className="heading-note">{note}</p>
    </div>
  );
}

function groupedColumns(columns: readonly Column[]) {
  return columns.reduce<{ name: string; count: number }[]>((groups, column) => {
    const last = groups.at(-1);
    if (last?.name === column.group) last.count += 1;
    else groups.push({ name: column.group, count: 1 });
    return groups;
  }, []);
}

function StatusCell({ state, note }: { state: CellState; note: string }) {
  const meta = statusMeta[state];
  return (
    <td className={`matrix-cell state-${state}`} tabIndex={0} aria-label={`${meta.label}：${note}`}>
      <span className="cell-mark" aria-hidden="true">{meta.mark}</span>
      <span className="cell-tooltip" role="tooltip"><b>{meta.label}</b>{note}</span>
    </td>
  );
}

function EvidenceMatrix({ columns, rows, compact = false }: { columns: readonly Column[]; rows: MatrixRow[]; compact?: boolean }) {
  const groups = groupedColumns(columns);
  return (
    <div className={`matrix-shell${compact ? " compact-matrix" : ""}`}>
      <table className="evidence-table">
        <thead>
          <tr className="group-head">
            <th rowSpan={2}>Model</th>
            {groups.map((group) => <th key={group.name} colSpan={group.count}>{group.name}</th>)}
          </tr>
          <tr className="column-head">
            {columns.map((column) => <th key={column.key}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.paper} className={row.paper === "D4RT" ? "focus-row" : undefined}>
              <td className="model-cell">
                <a href={row.url} target="_blank" rel="noreferrer">{row.paper}<span>↗</span></a>
                <small>{row.venue}</small>
              </td>
              {columns.map((column) => {
                const cell = row.cells[column.key];
                return <StatusCell key={column.key} state={cell.state} note={cell.note} />;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Home() {
  const [branch, setBranch] = useState("全部");
  const [query, setQuery] = useState("");
  const branches = ["全部", ...Object.keys(branchCounts)];
  const filteredDossiers = useMemo(() => dossiers.filter((paper) => {
    const branchMatch = branch === "全部" || paper.branch === branch;
    const haystack = `${paper.title} ${paper.unique} ${paper.buildsOn} ${paper.limitation}`.toLowerCase();
    return branchMatch && haystack.includes(query.trim().toLowerCase());
  }), [branch, query]);

  return (
    <main>
      <header className="hero" id="top">
        <div className="hero-grid" />
        <div className="hero-inner">
          <div className="hero-kicker"><span>3D / 4D WORLD MODEL FIELD GUIDE</span><span>FULL-TEXT AUDIT · 2026-07-16</span></div>
          <div className="hero-copy">
            <p className="overline">不是论文清单，是问题推进图</p>
            <h1>别从最新论文开始。<br /><em>沿着问题读。</em></h1>
            <p className="hero-deck">29 篇全文复核后，把领域拆成五条主线。每条关系都说明“继承了什么、只新增了什么、哪项实验支持、还有什么没解决”。</p>
            <div className="hero-actions">
              <a className="button primary" href="#start">先选阅读路径 <span>↓</span></a>
              <a className="button secondary" href="#geometry-matrix">直接看证据表 <span>↘</span></a>
            </div>
          </div>
          <aside className="hero-note">
            <span className="note-index">01</span>
            <p>先给结论</p>
            <strong>今天多数 3D reconstruction model 学到的是<span className="accent">跨场景确定性先验</span>，不是可采样、可校准的 3D 世界分布。</strong>
          </aside>
          <div className="hero-metrics">
            <div><strong>29</strong><span>篇核心论文全文复核</span></div>
            <div><strong>5</strong><span>条问题主线</span></div>
            <div><strong>3</strong><span>类关系边，拒绝伪谱系</span></div>
          </div>
        </div>
      </header>

      <nav className="chapter-nav" aria-label="章节导航">
        <a className="brand" href="#top"><span>4D</span> FIELD GUIDE</a>
        <div className="chapter-links">
          {[
            ["01", "怎么读", "#start"], ["02", "先验 vs 分布", "#answer"], ["03", "谱系", "#tree"],
            ["04", "重建表", "#geometry-matrix"], ["05", "分布表", "#distribution-matrix"], ["06", "D4RT 表", "#d4rt-table"],
            ["07", "逐篇卡", "#dossiers"], ["08", "方法", "#method"],
          ].map(([i, label, href]) => <a href={href} key={href}><b>{i}</b>{label}</a>)}
        </div>
      </nav>

      <section className="section reading-section" id="start">
        <SectionHeading index="01 · START HERE" title={<>先选问题，再决定<em>下一篇</em></>} note="如果只有 90 分钟，读第一条。不要先读 D4RT：不了解 CroCo、DUSt3R 与 VGGT，就很难识别它真正新增的只是哪个接口。" />
        <div className="reading-gates">
          {readingPaths.map((path, index) => (
            <article className="reading-card" key={path.label}>
              <div className="reading-index">0{index + 1}</div>
              <small>{path.label}</small>
              <h3>{path.question}</h3>
              <div className="step-chain">
                {path.steps.map((step, stepIndex) => <span key={step}>{step}{stepIndex < path.steps.length - 1 && <i>→</i>}</span>)}
              </div>
              <p>{path.reason}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section answer-section" id="answer">
        <SectionHeading index="02 · THE CENTRAL QUESTION" title={<>“学到了 3D”有<em>四个不同含义</em></>} note="这四层经常在论文叙事中混用。判断是否形成 3D 分布，关键不是训练样本多，而是模型是否定义并验证了同一条件下多个合理世界。" />
        <div className="answer-layers">
          <article><span>01</span><div><small>PER-SCENE OPTIMIZATION</small><h3>单场景拟合</h3><code>θᵢ* = argmin L(Render(θᵢ), Iᵢ)</code><p>NeRF / 3DGS 常见范式。每个场景独立优化一个参数实例；跨场景没有共享生成分布。</p></div></article>
          <article><span>02</span><div><small>AMORTIZED PRIOR</small><h3>跨场景确定性先验</h3><code>Ŝ = fθ(I)</code><p>DUSt3R、VGGT、D4RT、Point4Cast 的主体。数据集把规律压进权重，但同一输入通常只回归一个答案。</p></div></article>
          <article className="distribution-layer"><span>03</span><div><small>EXPLICIT CONDITIONAL DISTRIBUTION</small><h3>可采样的条件分布</h3><code>S ~ pθ(S | I, A)</code><p>MVDream、TRELLIS、O-Voxel、WorldReel、U4D、3WM。必须看多次采样、分布指标或校准，而非只看单次重建误差。</p></div></article>
          <article><span>04</span><div><small>PERSISTENT BELIEF</small><h3>随观测更新的世界 belief</h3><code>bₜ(S) ∝ p(oₜ | S, aₜ)·bₜ₋₁(S)</code><p>P3Sim 最接近这一定义；CUT3R/Point4Cast 有持久状态，但状态仍是确定性 token，不自动等于 belief distribution。</p></div></article>
        </div>
        <div className="answer-callout"><b>一句话判断</b><p>“跨很多 3D 样本训练”只证明学到 <em>prior</em>；只有对固定条件能产生并评估多个合理 3D/4D 假设，才证明学到 <em>distribution</em>。</p></div>
      </section>

      <section className="section dark-section lineage-section" id="tree">
        <SectionHeading light index="03 · LITERATURE LINEAGE" title={<>一棵树不够：这是六条<em>问题推进链</em></>} note="实线是直接代码/架构继承；虚线是表征继承；点线仅表示在解决同一未决问题。点线不是“后者建立在前者代码上”。" />
        <div className="relation-legend">
          <span><i className="legend-line direct" />直接继承</span><span><i className="legend-line representation" />表征继承</span><span><i className="legend-line concept" />问题延续 / 对照</span>
        </div>
        <div className="branch-map">
          {lineages.map((lineage) => (
            <article className="branch-row" key={lineage.name}>
              <header><small>{lineage.name}</small><p>{lineage.problem}</p></header>
              <div className="branch-flow">
                {lineage.nodes.map((node, index) => (
                  <div className="flow-unit" key={`${lineage.name}-${node}`}>
                    <span className="branch-node">{node}</span>
                    {index < lineage.edges.length && <span className={`edge ${lineage.kinds[index]}`}><i />{lineage.edges[index]}<b>→</b></span>}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section matrix-section" id="geometry-matrix">
        <SectionHeading index="04 · RECONSTRUCTION MATRIX" title={<>不是“谁最好”，而是<em>哪一块被解决</em></>} note="结构仿照你给出的 D4RT Table 2，但增加“未来预测、度量尺度、持久记忆、多解分布”，并为每格附上实验或论文陈述。悬停 / 点击格子查看证据。" />
        <div className="matrix-legend"><span className="yes">✓</span> 有直接证据 <span className="partial">◐</span> 部分满足 / 需后处理 <span className="no">×</span> 未解决 / 有反证</div>
        <EvidenceMatrix columns={geometryColumns} rows={geometryMatrix} />
        <p className="matrix-footnote">表中“多解分布”要求同一条件下能采样多个合理 3D/4D，并有分布级验证。confidence、heteroscedastic variance、跨场景训练都不足以单独获得 ✓。</p>
      </section>

      <section className="section distribution-section" id="distribution-matrix">
        <SectionHeading index="05 · DISTRIBUTION MATRIX" title={<>谁真的在形成<em>3D / 4D 分布</em>？</>} note="把“原生 3D 状态”和“显式多解采样”分开：MVDream 有多解但主要在多视图图像空间；PointWorld 有原生 3D dynamics，却不是多未来生成器。" />
        <div className="matrix-legend"><span className="yes">✓</span> 直接满足 <span className="partial">◐</span> 间接 / 有限满足 <span className="no">×</span> 没有证明</div>
        <EvidenceMatrix columns={distributionColumns} rows={distributionMatrix} />
        <div className="matrix-insight-grid">
          <article><small>资产级分布</small><strong>TRELLIS → O-Voxel</strong><p>在稀疏原生 3D latent 上做 rectified flow；解决的是跨对象的形状/材质分布，不是时间 dynamics。</p></article>
          <article><small>场景 / 视频分布</small><strong>MVDream → WorldReel / U4D</strong><p>从相机条件多视图 diffusion 推进到显式 4D 几何或 LiDAR 时空生成，但长时一致性仍弱。</p></article>
          <article><small>交互 belief</small><strong>3WM → P3Sim</strong><p>任意条件概率模型再加入 geometrizer 与 persistent memory，是“分布 + 3D + belief”目前最完整的组合之一。</p></article>
        </div>
      </section>

      <section className="section d4rt-section" id="d4rt-table">
        <SectionHeading index="06 · THE REQUESTED TABLE" title={<>把 D4RT 原表复刻成<em>可查证表格</em></>} note="下面严格对应 D4RT 原论文 Table 2 的六个 capability。它能说明 D4RT 的接口统一性，但不能回答“是否学到多未来 3D 分布”。" />
        <EvidenceMatrix columns={d4rtCapabilityColumns} rows={d4rtCapabilityMatrix} compact />
        <div className="d4rt-reading">
          <div><span>真正新增</span><strong>统一的 4D ray query</strong><p>query = (u, v, source time, target time, target camera)，同一个 decoder 稀疏读取 depth 与跨时 3D correspondence。</p></div>
          <div><span>直接证据</span><strong>一个 decoder 覆盖多个任务</strong><p>全局视频 latent + 局部 RGB patch，在不同 reference frame、稀疏 query 和 dense reconstruction 之间复用。</p></div>
          <div><span>仍未解决</span><strong>不是未来分布，也不是 streaming belief</strong><p>输入完整视频后做确定性查询；没有展示同一观测条件下的多种未来 4D，也没有在线更新的概率状态。</p></div>
        </div>
        <ExternalLink href="https://d4rt-paper.github.io/">D4RT 项目页与原文</ExternalLink>
      </section>

      <section className="section library-section" id="dossiers">
        <SectionHeading light index="07 · PAPER DOSSIERS" title={<>每篇只保留一个<em>不可再缩的贡献</em></>} note="“核心贡献”不是摘要复述，而是相对直接前驱新增的最小机制。展开卡片即可看到前驱、关系类型、支持实验、反证/局限与下一篇。" />
        <div className="dossier-toolbar">
          <label><span>搜索论文 / 机制 / 局限</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：pointmap、未来、memory、metric scale" /></label>
          <div className="branch-filters" aria-label="按研究主线筛选">
            {branches.map((item) => <button key={item} type="button" aria-pressed={branch === item} onClick={() => setBranch(item)}>{item}{item !== "全部" && <small>{branchCounts[item]}</small>}</button>)}
          </div>
        </div>
        <div className="dossier-count">当前显示 <strong>{filteredDossiers.length}</strong> / {dossiers.length} 篇</div>
        <div className="dossier-list">
          {filteredDossiers.map((paper, index) => (
            <details className="dossier-card" key={paper.id} id={paper.id}>
              <summary>
                <span className="dossier-number">{String(index + 1).padStart(2, "0")}</span>
                <div><small>{paper.venue} {paper.year}{paper.honor ? ` · ${paper.honor}` : ""}</small><h3>{paper.title}</h3></div>
                <span className={`relation-pill relation-${paper.relation}`}>{paper.relation}</span>
                <i aria-hidden="true">+</i>
              </summary>
              <div className="dossier-body">
                <div className="dossier-core"><span>最小独有贡献</span><p>{paper.unique}</p></div>
                <dl>
                  <div><dt>建立在什么上</dt><dd>{paper.buildsOn}</dd></div>
                  <div><dt>哪个实验证明</dt><dd>{paper.evidence}</dd></div>
                  <div className="limitation"><dt>没有解决什么</dt><dd>{paper.limitation}</dd></div>
                  <div><dt>下一篇为什么读</dt><dd>{paper.readNext}</dd></div>
                </dl>
                <ExternalLink href={paper.url}>打开原文 / 项目页</ExternalLink>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="section method-section" id="method">
        <SectionHeading index="08 · METHOD & BOUNDARY" title={<>这张地图如何<em>避免伪关系</em></>} note="引用图只能找候选关系，不能替代读文。最终边与单元格都回到论文的 method、ablation、limitations 和 evaluation。" />
        <div className="method-grid">
          <article><span>01</span><h3>先追引用，再读全文</h3><p>用 references / related work 找直接前驱，随后复核模型结构、训练目标、消融和失败案例；本版逐篇全文复核 29 篇。</p></article>
          <article><span>02</span><h3>关系边分三类</h3><p><b>直接继承</b>要求明确复用代码、权重或架构；<b>表征继承</b>复用 pointmap / SLAT 等对象；<b>问题延续</b>只说明解决同一缺口。</p></article>
          <article><span>03</span><h3>× 也需要证据</h3><p>来自论文明确限制、评测所需后处理、消融失败，或任务定义根本没有该输出。没有找到不能武断写成“做不到”。</p></article>
          <article><span>04</span><h3>表格是论文证据，不是能力上限</h3><p>某格为 × 表示该工作没有提出或证明，不表示架构经过新训练永远不能做到。日期截至 2026-07-16。</p></article>
        </div>
      </section>

      <footer>
        <div><span>3D / 4D WORLD MODEL FIELD GUIDE</span><strong>问题推进、证据矩阵与可执行阅读顺序</strong></div>
        <p>内容为论文全文与官方项目页的结构化研读，不替代作者声明。会议状态、奖项和 camera-ready 版本可能继续更新。</p>
        <a href="#top">回到顶部 ↑</a>
      </footer>
    </main>
  );
}
