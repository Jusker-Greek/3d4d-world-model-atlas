"use client";

import { useMemo, useState } from "react";
import {
  branchCounts,
  d4rtCapabilityColumns,
  d4rtCapabilityMatrix,
  diagnosticGates,
  diagnostics,
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
    problem: "训练目标从同图补全变成跨视图补全，输出再从 RGB 变成 pointmap、多视图几何和统一 4D query。",
    steps: [
      {
        paper: "MAE", parent: "ViT 图像编码器", relation: "范式起点", kind: "adjacent",
        location: "自监督训练目标",
        delta: "随机 mask 同一张图的大量 patch，让 decoder 回归被遮像素。核心是学单图 image prior，完全没有第二视图或相机。",
        interface: "masked image → missing RGB patches",
        unlocks: "可扩展的 masked visual pretraining 骨架。",
        boundary: "没有跨视图约束，不要求特征表示 3D 表面。",
      },
      {
        paper: "CroCo", parent: "MAE", relation: "改训练任务", kind: "direct",
        location: "encoder–decoder 的信息来源",
        delta: "保留 MAE 的 masked reconstruction，但变成“完整 source view + 90% masked target view”；target decoder 通过 cross-attention 从 source 找表面线索来补 RGB。",
        interface: "(I₁, masked I₂) → RGB patches of I₂",
        unlocks: "迫使预训练特征学跨视图对应，为深度/匹配提供初始化。",
        boundary: "目标仍是像素补全；不输出 depth、pose 或 world coordinates。",
      },
      {
        paper: "DUSt3R", parent: "CroCo", relation: "直接继承", kind: "direct",
        location: "监督信号与稠密输出头",
        delta: "复用 CroCo 的双分支 encoder/decoder，把“重建 target RGB”替换为两张 dense pointmap；两幅图的每个像素都直接回归到相机 1 坐标系的 3D 点。",
        interface: "(I₁, I₂) → (X¹¹, X²¹, confidence)",
        unlocks: "不需已知 K/R/t 即可得到同坐标系成对几何；pose/depth 变成 pointmap 的派生量。",
        boundary: "基本单元仍是 image pair；N 视图要做全局对齐，并且默认静态场景。",
      },
      {
        paper: "MASt3R", parent: "DUSt3R", relation: "直接继承", kind: "direct",
        location: "pointmap decoder 上的像素描述子头",
        delta: "保留 DUSt3R 的 pointmap 输出，并行增加 dense descriptor/confidence head；用对比损失让同一 3D 点的两个像素 descriptor 接近。",
        interface: "pointmaps only → pointmaps + dense match descriptors",
        unlocks: "把“有几何”扩展到“能稠密找到对应”，改善宽基线匹配和对齐。",
        boundary: "没有把 pair-wise 模型变成全局场景模型，也不解决动态或度量尺度。",
      },
      {
        paper: "VGGT", parent: "pair-wise GFM（问题延续）", relation: "表征升级", kind: "representation",
        location: "主干的视图聚合方式",
        delta: "不再对图像对分别跑网络；用 alternating frame attention / global attention 一次聚合整个视图集，加入 register/camera token，再用多个专用头联合输出相机、depth、pointmap 和 track。",
        interface: "image pairs + alignment → an image set → joint global geometry",
        unlocks: "1–数百视图的单次前馈全局重建，相机与几何共享同一 context。",
        boundary: "主体是静态、确定性、batch 式输入；多个输出头也不是统一 query interface。",
      },
      {
        paper: "π³", parent: "VGGT 架构/权重", relation: "直接继承", kind: "direct",
        location: "参考坐标系和视图顺序处理",
        delta: "保留 VGGT 主干，去掉把第一帧当固定 world anchor 的不对称性；输出每视图局部 pointmap 与仿射不变相机，使输入置换导致输出同样置换。",
        interface: "ordered views in one anchor → an unordered/equivariant view set",
        unlocks: "降低参考帧选择和输入排列造成的几何波动。",
        boundary: "为了去锚点使用 scale/affine-invariant 量，不自动恢复 metric scale；仍不是动态模型。",
      },
      {
        paper: "D4RT", parent: "SRT-style query decoding + video pretraining", relation: "问题延续", kind: "concept",
        location: "输出接口和 decoder 形式",
        delta: "先把完整视频编码成一个 global latent；不再为 depth/pose/track 建多个 dense head，而是用单 decoder 接收 (u,v, source time, target time, target camera) 和局部 RGB patch，只读出所问 ray 的 3D 结果。",
        interface: "fixed dense heads → sparse 4D ray queries over one video latent",
        unlocks: "同一 decoder 同时表达重建、跨时对应和不同参考系，且稀疏查询无需解码全帧。",
        boundary: "它不是 VGGT 的直接后继；输入仍需完整视频，没有 streaming belief 或多未来分布。",
      },
    ],
  },
  {
    name: "B · 动态 4D",
    problem: "静态 pointmap 无法区分 camera motion 与 object motion；各工作分别从优化、时间不变表征、视频聚合和未来读出解决。",
    steps: [
      {
        paper: "MonST3R", parent: "DUSt3R", relation: "直接改造", kind: "direct",
        location: "dynamic fine-tuning + 视频后端优化",
        delta: "保留 DUSt3R encoder，对 decoder/head 做动态数据 fine-tune；再在滑窗视频优化中加入外部 optical-flow correspondence、camera smoothness 和静/动 mask。",
        interface: "static pair pointmaps → dynamic per-frame geometry + video optimization",
        unlocks: "不再把运动物体强行拉成静态结构，可恢复 dynamic depth/camera。",
        boundary: "动态对应主要由外部 2D flow 提供，不是 pointmap 表征本身直接给出 scene flow。",
      },
      {
        paper: "Dynamic Point Maps", parent: "DUSt3R pointmap", relation: "表征继承", kind: "representation",
        location: "pointmap 对时间的定义",
        delta: "把两张静态 pointmap 扩展为四张 time-aware pointmap：两个输入图的像素都预测该物理点在两个时刻的 3D 位置，并固定到同一 camera/time reference。",
        interface: "2 pointmaps at one time assumption → 4 maps spanning two cameras × two times",
        unlocks: "同一点两个时刻的坐标差直接就是 scene flow，不再额外跑 optical flow。",
        boundary: "核心仍是 two-frame pair；无持久状态，也不预测未观测未来。",
      },
      {
        paper: "St4RTrack", parent: "time-dependent pointmap 问题", relation: "问题延续", kind: "concept",
        location: "重建点和跟踪点的联合输出",
        delta: "对“首帧—当前帧”图像对同时预测当前可见表面的 reconstruction pointmap，以及首帧点在当前时刻的 tracking pointmap，两者统一在首帧 world frame。",
        interface: "reconstruct or track separately → reconstruction + long-range 3D tracking together",
        unlocks: "几何与身份轨迹共享表征，可直接得到长程 4D correspondence。",
        boundary: "通常仍将首帧与后续帧成对处理；长遮挡、尺度和相机大运动仍是薄弱点。",
      },
      {
        paper: "V-DPM", parent: "Dynamic Point Maps + VGGT", relation: "明确合并", kind: "direct",
        location: "pair representation 到 video backbone 的扩展",
        delta: "用 VGGT 的多视图 alternating attention 替换 DPM 的两图骨架，保留 dynamic pointmap 定义；加入 target-time conditioned decoder，从整段视频 latent 读出某观测像素在指定时刻的 3D 坐标。",
        interface: "two-frame DPM → multi-frame video DPM queried by target time",
        unlocks: "一次联合处理多帧，无外部 flow 恢复视频级 scene flow。",
        boundary: "长视频仍需窗口融合/优化；target time 来自已观测片段，不是未来分布。",
      },
      {
        paper: "DynamicVGGT", parent: "VGGT + Dynamic Point Map 概念", relation: "表征继承", kind: "representation",
        location: "global attention 中的时间聚合和动态输出头",
        delta: "在 VGGT 中加 motion-temporal attention，并新增 future point head 和 dynamic 3DGS velocity head；同时预测当前/短期未来 pointmap 与高斯运动。",
        interface: "static global geometry heads → current/future points + Gaussian velocity",
        unlocks: "把全局重建扩展到短 clip 的 4D reconstruction 和短期 forecast。",
        boundary: "未来是单一回归而非多模态分布；无 streaming memory，主要验证短驾驶片段。",
      },
      {
        paper: "Any4D", parent: "MapAnything 权重/因子化表征", relation: "直接继承", kind: "direct",
        location: "静态 metric factors 到动态 factors",
        delta: "保留 MapAnything 的 egocentric depth/ray、allocentric pose 和 metric-scale 分解，新增 allocentric scene-flow decoder，并让 RGB-D/IMU/Radar 成为可选条件。",
        interface: "multimodal metric 3D → multimodal metric 4D + scene flow",
        unlocks: "直接前馈输出带绝对单位的相机、几何和动态。",
        boundary: "N 帧 batch 式处理；没有持久状态、不外推未观测未来，对传感器噪声建模也有限。",
      },
      {
        paper: "Point4Cast", parent: "persistent-state GFM + dynamic pointmaps", relation: "问题合并", kind: "concept",
        location: "视频处理方式与时间读出域",
        delta: "将整段 batch encoder 换成每帧更新的固定容量 spacetime tokens；readout 同时接收 query frame 和 query time，可读任意已观测过去/当前，也读未观测未来 pointmap。",
        interface: "offline observed-video reconstruction → streaming state + arbitrary-time readout",
        unlocks: "把 reconstruction、scene flow、长程记忆和 forecasting 合到同一 state/query 接口。",
        boundary: "状态与未来仍是确定性的；论文明确将 uncertainty/multiple futures 留作后续问题。",
      },
    ],
  },
  {
    name: "C · 持久记忆",
    problem: "不再把每个 image pair 当独立样本；分别将历史放入外部 memory、递归 latent state 或时空 state。",
    steps: [
      {
        paper: "Spann3R", parent: "DUSt3R", relation: "直接改造", kind: "direct",
        location: "pair decoder 之外的读/写式空间 memory",
        delta: "将前帧组成 working memory，超出窗口的内容压入 long-term memory；新帧与 memory feature 匹配，直接读出到现有 world frame 的 pointmap，同时回写 memory。",
        interface: "independent image pairs → frame + external spatial memory → world pointmap",
        unlocks: "可在不做全局 BA/对齐的情况下在线累积静态场景。",
        boundary: "memory 不是可校准 belief，也没有显式 loop closure；长序列会漂移，默认静态世界。",
      },
      {
        paper: "CUT3R", parent: "DUSt3R-style pointmap GFM", relation: "架构改造", kind: "representation",
        location: "主干中的 recurrent state update/readout",
        delta: "不保存可检索的历史帧表；用一个固定 latent state 持续吸收新帧，每次通过 update 改写世界，再由 readout 输出当前 pointmap/camera；raymap 还可作为虚拟视角 query。",
        interface: "frame set / external alignment → recurrent latent world state → metric readouts",
        unlocks: "在线、恒定容量的 continuous 3D perception，并能查询未观测相机 rays。",
        boundary: "state 是确定性压缩；虚拟视角遇到歧义会平均化，长程漂移仍在。",
      },
      {
        paper: "Point4Cast", parent: "CUT3R-style persistence + DPM-style time", relation: "问题合并", kind: "concept",
        location: "state 的语义与 readout query",
        delta: "把只表示“当前累积场景”的 state 升级为 spacetime state；读出时不只给 camera ray，还给世界目标时刻，所以同一状态可生成过去/当前/未来 pointmap。",
        interface: "spatial persistent state → time-indexed spacetime state",
        unlocks: "记忆不再只用于当前重建，而成为可用于 4D 轨迹与 forecast 的统一中介。",
        boundary: "没有证明 state 是对观测顺序不变的 Bayesian belief；未来无多解。",
      },
    ],
  },
  {
    name: "D · 参考系与度量",
    problem: "“用第一帧当 world”会产生顺序偏置；“整体形状对但尺度任意”则无法直接用于传感器融合和控制。",
    steps: [
      {
        paper: "π³", parent: "VGGT", relation: "去参考帧", kind: "direct",
        location: "world gauge 的选择",
        delta: "将“所有输出固定在某一 reference camera”改为每视图局部量 + 视图间可对齐的 camera，从结构上保证 permutation equivariance。",
        interface: "reference-frame global output → equivariant local outputs",
        unlocks: "输入顺序不再决定哪张图掌握 world origin。",
        boundary: "解决的是 gauge/顺序，不是绝对米制尺度。",
      },
      {
        paper: "MapAnything", parent: "DUSt3R/VGGT-style feed-forward geometry", relation: "平行问题", kind: "concept",
        location: "输出几何的可解释因子分解",
        delta: "不直接用一个全局 pointmap 同时承担所有信息；分别预测 egocentric depth/ray、allocentric camera、local shape 和一个 global metric-scale factor，再解析组合。",
        interface: "RGB-only relative geometry → flexible RGB/depth/ray/pose inputs → factored metric 3D",
        unlocks: "同一模型可接受不同输入模态与视图数，并将几何放到绝对单位。",
        boundary: "工作对象仍是静态 3D；没有 scene flow、持久记忆或输入噪声后验。",
      },
      {
        paper: "Any4D", parent: "MapAnything", relation: "直接继承", kind: "direct",
        location: "factored metric output 的时间维",
        delta: "在 MapAnything 的各几何因子之间新增 allocentric scene flow，并使其与 metric scale/camera 共同解码；RGB-D/IMU/Radar 用来锁定绝对尺度/运动。",
        interface: "factored metric 3D → factored metric 4D",
        unlocks: "直接得到带米制单位的动态场景几何和 motion。",
        boundary: "只重建已输入时刻，不提供流式记忆或概率未来。",
      },
    ],
  },
  {
    name: "E · 原生 3D 生成分布",
    problem: "从确定性单图 3D 回归，经过多视图 diffusion，再到直接对稀疏 3D latent 或 4D geometry-motion latent 建模。",
    steps: [
      {
        paper: "LRM", parent: "per-scene NeRF optimization", relation: "跨场景前馈", kind: "concept",
        location: "每场景优化 → 单次网络预测",
        delta: "用大 Transformer 将一张输入图的 image tokens 直接解码成 triplane，再通过 NeRF renderer 产生新视图；3D prior 从训练集压入共享权重。",
        interface: "one scene + optimization → one image + one forward pass → triplane NeRF",
        unlocks: "把单图 3D 构建降到秒级，并获得跨对象类别先验。",
        boundary: "虽然论文承认单图是概率问题，模型本身却只输出一个确定性形状，遮挡区容易均值化。",
      },
      {
        paper: "MVDream", parent: "2D latent diffusion / Stable Diffusion", relation: "转为多视图分布", kind: "representation",
        location: "diffusion denoiser 的相机条件和视图交互",
        delta: "不再独立生成单图；每次联合去噪四个 camera-conditioned views，使多视图在 denoiser 中交换信息，再通过 SDS 将分布蒸馏到 3D。",
        interface: "text → one image distribution → camera-conditioned multi-view image distribution",
        unlocks: "同一 prompt 可采样多套对视角一致的外观，减少 Janus 问题。",
        boundary: "被建模的随机变量仍是多视图像素，不是 native 3D geometry/material latent。",
      },
      {
        paper: "TRELLIS", parent: "multi-view/image-conditioned 3D generation", relation: "原生 3D latent", kind: "representation",
        location: "生成随机变量的表征空间",
        delta: "定义 sparse structured latent（SLAT）：第一阶段先生成稀疏结构占据，第二阶段只在活跃位置生成局部属性；两阶段都用 rectified flow，最后可解码为 radiance field、3DGS 或 mesh。",
        interface: "image-space samples → sparse structure + native 3D feature latents",
        unlocks: "在统一稀疏 3D 空间学形状/外观分布，并支持多种资产格式。",
        boundary: "主要生成静态资产；原版材质常烘有光照，拓扑/PBR 表达受限。",
      },
      {
        paper: "O-Voxel", parent: "TRELLIS", relation: "直接后继", kind: "direct",
        location: "SLAT 的空间载体、解码器和材质通道",
        delta: "用 open-voxel 表示替换原 SLAT 的有限表面结构；体素可携带几何、任意拓扑与 albedo/roughness/metallic 等 PBR 属性，同时将 sparse VAE 压缩率提到约 16×。",
        interface: "TRELLIS SLAT → compact open voxels → topology + PBR asset",
        unlocks: "同一原生 3D generative latent 可表示开放/多连通拓扑和可重打光材质。",
        boundary: "voxel discretization 仍可产生 aliasing/小孔；没有对象级语义和时间 dynamics。",
      },
      {
        paper: "FlashWorld", parent: "multi-view diffusion + 3DGS generation", relation: "问题合并", kind: "concept",
        location: "2D 生成分布与 3D 生成分布的对齐",
        delta: "并行训练 multi-view-oriented diffusion 与 3D-oriented diffusion，再用 cross-mode distribution matching 把两者对齐，使外观多样性与可解码 3DGS 几何同时保留。",
        interface: "multi-view images or 3D separately → aligned 2D/3D generative modes → 3DGS scene",
        unlocks: "数秒级生成静态 3D 场景，减少只蒸馏 2D diffusion 的几何不稳定。",
        boundary: "对象是 static scene distribution；无动作、记忆或 4D dynamics。",
      },
      {
        paper: "Geometry Forcing", parent: "video diffusion + frozen VGGT", relation: "teacher 对齐", kind: "representation",
        location: "video diffusion 中间特征的训练约束",
        delta: "不额外生成 depth 当 condition；直接将 video diffusion 中间 feature 与冻结 VGGT feature 做 angular alignment + scale alignment，使生成 latent 内部携带几何结构。",
        interface: "video denoising loss only → video loss + geometry-feature alignment",
        unlocks: "不修改 diffusion 输入接口即提升多视图/时间几何一致性。",
        boundary: "几何上限被 teacher 绑定；VGGT 对显著动态、透明/反射的失败可传递给 diffusion。",
      },
      {
        paper: "WorldReel", parent: "video latent diffusion + geometric/motion supervision", relation: "联合 4D 生成", kind: "concept",
        location: "diffusion latent 的通道语义和联合目标",
        delta: "把视频 latent 拆成 RGB appearance 与 appearance-agnostic geo-motion latent，联合生成 RGB、4D pointmap、camera、2D flow、scene flow 和 dynamic mask；合成数据提供精确 4D 监督，真实视频提供外观分布。",
        interface: "RGB video distribution → joint RGB + explicit geometry/motion distribution",
        unlocks: "生成的随机样本不只有像素序列，还带与其对齐的 4D 几何和 motion。",
        boundary: "仍是有限时窗；合成到真实的 domain gap、拓扑变化和长遮挡未解决。",
      },
    ],
  },
  {
    name: "F · 概率物理世界模型",
    problem: "这一支不只问“世界在哪里”，还问“动作后会发生什么”以及“不确定世界如何随新观测更新”。",
    steps: [
      {
        paper: "TesserAct", parent: "pretrained latent video diffusion", relation: "通道扩展", kind: "representation",
        location: "视频 diffusion 的输出模态与几何提升",
        delta: "将只生成 RGB 的 video latent 扩成 RGB + depth + normal（RGB-D-N），加入跨通道一致损失，再用深度/法线积分把视频样本 lift 成可用于动作规划的 4D scene。",
        interface: "action-conditioned RGB video → RGB-D-N video → lifted 4D scene",
        unlocks: "世界模型样本可直接提供空间轨迹和逆动力学信号。",
        boundary: "生成仍可产生物体消失/错误 affordance；通常需多 seed 选优，只表示可见单表面。",
      },
      {
        paper: "PointWorld", parent: "3D tracking/point backbone + MPC", relation: "统一动作空间", kind: "concept",
        location: "世界状态和机器人动作的表示",
        delta: "不用机器人关节 token 或像素动作；将状态变化和 action 都表成每个 3D 点的 displacement/point flow，从约 2M 跨 embodiment 轨迹学快速 deterministic dynamics，直接装入 MPC。",
        interface: "robot-specific actions + image state → shared 3D point-action/state flow",
        unlocks: "同一预测器可条件化不同机器人的几何动作，并以约 0.1s rollout 做真机控制。",
        boundary: "方差头主要是稳健回归，不是多未来采样；假设初始场景静止，不生成 appearance dynamics。",
      },
      {
        paper: "3WM", parent: "autoregressive visual tokens + PGM", relation: "概率统一", kind: "concept",
        location: "变量定义与 autoregressive 序列化方式",
        delta: "把 RGB、flow、camera 等局部 patch 都当作 probabilistic graphical model 节点；每个 token 包含“要问哪个节点”的 pointer 和 content，用 local random-access sequences 训任意未知节点在任意已知子集下的条件分布。",
        interface: "fixed task heads → p(any missing modality/patch | any observed subset)",
        unlocks: "NVS、depth、flow、camera 不再是不同模型，而是同一 joint distribution 的不同条件查询。",
        boundary: "3D 主要存在于模态间推断路径，而非一个持久显式 world state；速度与视觉伪影仍有问题。",
      },
      {
        paper: "P3Sim", parent: "3WM / physical world model Ψ", relation: "直接继承", kind: "direct",
        location: "概率核心外的 3D 几何化与持久记忆",
        delta: "保留 3WM-style 概率多模态核心 Ψ，新增 geometrizer Γ 把 3D 操作改写为 depth/flow/camera 条件，以及 persistent memory μ 持续融合观测为场景 belief。",
        interface: "probabilistic multimodal inference → Ψ + 3D transform interface Γ + memory μ",
        unlocks: "概率生成不再对每个视图独立开始；可在持久 3D context 中做 NVS 和对象操作。",
        boundary: "Γ/μ 的独立系统消融和闭环机器人证据仍不充分；仍继承大生成模型的速度/伪影。",
      },
      {
        paper: "LPWM", parent: "DLP/DDLP object-centric video prediction", relation: "相邻参照", kind: "adjacent",
        location: "对象粒子的身份跟踪和动作随机变量",
        delta: "取消要求每个 particle 显式跨帧对应的 tracking 假设，为每个自发现粒子预测 latent-action distribution，从同一初态采样不同对象级运动。",
        interface: "tracked deterministic particles → untracked particles + stochastic latent actions",
        unlocks: "用对象级 mode 而非像素均值表达多未来，并可做 goal-conditioned imitation。",
        boundary: "主要是 2D particles/video，不是原生 3D world state；小相机运动假设下可把视差误解为对象动作。",
      },
    ],
  },
];

const diagnosticSources = [
  { name: "Probe3D", note: "冻结特征后分别测 3D 结构与跨视角表面一致性", url: "https://openaccess.thecvf.com/content/CVPR2024/html/Banani_Probing_the_3D_Awareness_of_Visual_Foundation_Models_CVPR_2024_paper.html" },
  { name: "Feat2GS", note: "用可分解的 3DGS readout 分开几何与纹理 awareness", url: "https://arxiv.org/abs/2412.09606" },
  { name: "EquiPose", note: "相对 pose 必须满足 A→B 与 B→A 互逆的置换等变性", url: "https://openaccess.thecvf.com/content/CVPR2025/html/Liu_EquiPose_Exploiting_Permutation_Equivariance_for_Relative_Camera_Pose_Estimation_CVPR_2025_paper.html" },
  { name: "MVGBench", note: "把多视图生成的几何、纹理、画质和语义分开评估", url: "https://openaccess.thecvf.com/content/ICCV2025/html/Xie_MVGBench_a_Comprehensive_Benchmark_for_Multi-view_Generation_Models_ICCV_2025_paper.html" },
  { name: "ViewDiag", note: "指出“跨视角一致但一直答错”，不能把 consistency 当 accuracy", url: "https://openaccess.thecvf.com/content/CVPR2026W/MULA2026/html/Bhat_Consistent_Yet_Wrong_Evidence_Insensitivity_in_Spatial_Vision-Language_Models_CVPRW_2026_paper.html" },
  { name: "ViewBench", note: "用相机闭环回到起点，直接测长程世界记忆的几何漂移", url: "https://openreview.net/forum?id=eXgmwOOvlR" },
];

const dossierById = Object.fromEntries(dossiers.map((paper) => [paper.id, paper]));
const diagnosticByPaper = Object.fromEntries(diagnostics.map((experiment) => [experiment.paperId, experiment]));

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
            <p className="hero-deck">29 篇全文复核后，把领域拆成六条主线。每个增量都说明“继承了什么、具体改了哪里、I/O 怎样变化、因此新增什么、还有什么没解决”。</p>
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
            <div><strong>6</strong><span>条问题推进主线</span></div>
            <div><strong>32</strong><span>个逐篇具体增量</span></div>
          </div>
        </div>
      </header>

      <nav className="chapter-nav" aria-label="章节导航">
        <a className="brand" href="#top"><span>4D</span> FIELD GUIDE</a>
        <div className="chapter-links">
          {[
            ["01", "怎么读", "#start"], ["02", "先验 vs 分布", "#answer"], ["03", "PWP 压力测试", "#stress-test"],
            ["04", "谱系", "#tree"], ["05", "重建表", "#geometry-matrix"], ["06", "分布表", "#distribution-matrix"],
            ["07", "D4RT 表", "#d4rt-table"], ["08", "逐篇卡", "#dossiers"], ["09", "方法", "#method"],
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

      <section className="section stress-section" id="stress-test">
        <SectionHeading index="03 · FALSIFICATION PROTOCOL" title={<>Pixel→World→Pixel：如何排除<em>强 autoencoder 捷径</em></>} note="这组实验不能从哲学上“证明模型理解了世界”；它能够逐层否定更弱的解释：纹理匹配、训练轨迹插值、成对像素回归和无物理含义的 token cache。" />

        <div className="falsification-warning">
          <b>首先修正一个标准</b>
          <p>“知道这是椅子”和“知道相机转 30° 时表面点怎样投影”是两种能力。一个 pose 模型可以有真实的投影几何能力而没有类别语义；因此应在论文的声称边界内分层测试。</p>
        </div>

        <div className="grounding-levels">
          <article><span>G</span><small>GEOMETRIC</small><h3>投影几何</h3><p>depth、pose、world point、visibility 可以在不看目标像素时预测目标位置，并满足 SE(3) 组合。</p></article>
          <article><span>O</span><small>OBJECT-CENTRIC</small><h3>对象持久性</h3><p>纹理、视角和遮挡改变后，仍保持同一对象、部件、身份和 3D 轨迹。</p></article>
          <article><span>P</span><small>PHYSICAL</small><h3>物理因果</h3><p>可以分别介入 camera、object motion、light、material 或 action，而不污染无关状态。</p></article>
          <article><span>D</span><small>DISTRIBUTIONAL</small><h3>条件分布</h3><p>相同可见证据存在多个隐藏世界/未来时，输出覆盖各 mode 并随新证据收缩。</p></article>
        </div>

        <div className="pwp-contrast">
          <div className="grounded-route">
            <small>可解释路径</small>
            <div><b>pixel p</b><i>→</i><b>depth + K + T</b><i>→</i><strong>world point X</strong><i>→</i><b>K′ + T′ + visibility</b><i>→</i><b>pixel p′</b></div>
            <code>X = T⁻¹ π⁻¹(p,d,K) &nbsp;;&nbsp; p′ = π(K′T′X)</code>
          </div>
          <div className="shortcut-route">
            <small>不能被普通重建 loss 排除的路径</small>
            <div><b>input pixels + camera token</b><i>→</i><strong>high-dimensional latent</strong><i>→</i><b>target pixels / pointmap</b></div>
            <p>它在 IID 数据上可以一样准；只有因子介入、组合和闭环才能区分两者。</p>
          </div>
        </div>

        <div className="stress-subhead">
          <div><small>TEST SUITE</small><h3>八个可独立执行的压力测试</h3></div>
          <p>每次只改一个物理因子；不把换纹理、换相机和换数据域捆在同一次实验里。</p>
        </div>
        <div className="gate-grid">
          {diagnosticGates.map((gate) => (
            <article key={gate.id}>
              <span>{gate.id}</span><h3>{gate.title}</h3><p>{gate.question}</p><code>{gate.equation}</code>
            </article>
          ))}
        </div>

        <div className="minimal-gate">
          <header><small>MINIMAL GATE LADDER</small><h3>第一轮先不训新模型</h3></header>
          <ol>
            <li><b>H1a · 纹理介入</b><p>只替换贴图，冻结模型、mesh、camera、light 和 metric。如果 pose/pointmap 大幅改变，先拒绝几何不变性。</p></li>
            <li><b>H1b · 相机组合</b><p>H1a 通过后，只改 camera transform；检查 g₁ 后 g₂ 是否等于 g₂g₁，以及 A→B 是否与 B→A 互逆。</p></li>
            <li><b>H1c · 中介因果</b><p>禁用 learned pixel decoder，只把模型预测的 W = {`{depth, pose, points, visibility}`} 送入固定解析 renderer。若目标视图仍可解释，才证明 W 对任务是充分中介。</p></li>
          </ol>
          <aside><b>对照组</b><p>同一评测同时放入纯 pixel predictor、经典 calibrated triangulation/BA 和 GT geometry renderer。前者是“强 autoencoder”对照，后两者给出几何规律和上限。</p></aside>
        </div>

        <div className="stress-subhead source-heading">
          <div><small>PRIOR ART</small><h3>已有评测到哪一步</h3></div>
          <p>这个方向不是从零开始；新的部分是把 feature probing、解析 PWP 闭环、因果介入和歧义分布合成对 3D/4D GFM 的分层协议。</p>
        </div>
        <div className="source-strip">
          {diagnosticSources.map((source) => <a key={source.name} href={source.url} target="_blank" rel="noreferrer"><strong>{source.name}<span>↗</span></strong><p>{source.note}</p></a>)}
        </div>

        <details className="diagnostic-index">
          <summary><span>29 篇论文的最小证伪实验索引</span><small>展开总表 · 逐篇完整 protocol 也已写入下方证据卡</small><i>+</i></summary>
          <div className="diagnostic-table-wrap">
            <table className="diagnostic-table">
              <thead><tr><th>Paper</th><th>声称层级</th><th>最小 gate</th><th>唯一改变</th><th>捷径失败指纹</th><th>主指标</th></tr></thead>
              <tbody>{diagnostics.map((experiment) => {
                const paper = dossierById[experiment.paperId];
                return <tr key={experiment.paperId}><td><a href={`#${paper.id}`}>{paper.title}</a></td><td>{experiment.target}</td><td><b>{experiment.gate}</b><small>{experiment.name}</small></td><td>{experiment.singleVariable}</td><td>{experiment.shortcutFailure}</td><td>{experiment.metric}</td></tr>;
              })}</tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="section dark-section lineage-section" id="tree">
        <SectionHeading light index="04 · LITERATURE LINEAGE" title={<>一棵树不够：改成逐篇<em>增量账本</em></>} note="每张卡只回答五件事：前驱是谁、改了模型的哪一层、输入/输出怎样变、新能力从哪里来、还缺什么。关系标签说明它是否真的复用了前作代码或表征。" />
        <div className="relation-legend">
          <span className="relation-chip direct">直接继承</span>
          <span className="relation-chip representation">表征继承 / 升级</span>
          <span className="relation-chip concept">问题延续 / 平行方案</span>
          <span className="relation-chip adjacent">相邻参照</span>
        </div>
        <p className="lineage-reading-rule"><b>阅读顺序</b>　先看 FROM 和“改动位置”，再读“最小增量”；如果 I/O 没有变化，就重点检查训练目标、状态表示或推理过程究竟改在哪里。</p>
        <div className="lineage-ledger">
          {lineages.map((lineage, branchIndex) => (
            <section className="lineage-branch" key={lineage.name}>
              <header className="lineage-branch-head">
                <div><span>{String(branchIndex + 1).padStart(2, "0")}</span><h3>{lineage.name}</h3></div>
                <p>{lineage.problem}</p>
                <small>{lineage.steps.length} 个具体增量</small>
              </header>
              <div className="increment-grid">
                {lineage.steps.map((step, index) => (
                  <article className={`increment-card kind-${step.kind}`} key={`${lineage.name}-${step.paper}`}>
                    <div className="increment-top">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <small>FROM · {step.parent}</small>
                      <em>{step.relation}</em>
                    </div>
                    <h4>{step.paper}</h4>
                    <dl>
                      <div><dt>改动位置</dt><dd>{step.location}</dd></div>
                      <div className="delta-row"><dt>最小增量</dt><dd>{step.delta}</dd></div>
                      <div className="interface-row"><dt>I/O 变化</dt><dd><code>{step.interface}</code></dd></div>
                      <div><dt>因此新增</dt><dd>{step.unlocks}</dd></div>
                      <div className="boundary-row"><dt>仍未解决</dt><dd>{step.boundary}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="section matrix-section" id="geometry-matrix">
        <SectionHeading index="05 · RECONSTRUCTION MATRIX" title={<>不是“谁最好”，而是<em>哪一块被解决</em></>} note="结构仿照你给出的 D4RT Table 2，但增加“未来预测、度量尺度、持久记忆、多解分布”，并为每格附上实验或论文陈述。悬停 / 点击格子查看证据。" />
        <div className="matrix-legend"><span className="yes">✓</span> 有直接证据 <span className="partial">◐</span> 部分满足 / 需后处理 <span className="no">×</span> 未解决 / 有反证</div>
        <EvidenceMatrix columns={geometryColumns} rows={geometryMatrix} />
        <p className="matrix-footnote">表中“多解分布”要求同一条件下能采样多个合理 3D/4D，并有分布级验证。confidence、heteroscedastic variance、跨场景训练都不足以单独获得 ✓。</p>
      </section>

      <section className="section distribution-section" id="distribution-matrix">
        <SectionHeading index="06 · DISTRIBUTION MATRIX" title={<>谁真的在形成<em>3D / 4D 分布</em>？</>} note="把“原生 3D 状态”和“显式多解采样”分开：MVDream 有多解但主要在多视图图像空间；PointWorld 有原生 3D dynamics，却不是多未来生成器。" />
        <div className="matrix-legend"><span className="yes">✓</span> 直接满足 <span className="partial">◐</span> 间接 / 有限满足 <span className="no">×</span> 没有证明</div>
        <EvidenceMatrix columns={distributionColumns} rows={distributionMatrix} />
        <div className="matrix-insight-grid">
          <article><small>资产级分布</small><strong>TRELLIS → O-Voxel</strong><p>在稀疏原生 3D latent 上做 rectified flow；解决的是跨对象的形状/材质分布，不是时间 dynamics。</p></article>
          <article><small>场景 / 视频分布</small><strong>MVDream → WorldReel / U4D</strong><p>从相机条件多视图 diffusion 推进到显式 4D 几何或 LiDAR 时空生成，但长时一致性仍弱。</p></article>
          <article><small>交互 belief</small><strong>3WM → P3Sim</strong><p>任意条件概率模型再加入 geometrizer 与 persistent memory，是“分布 + 3D + belief”目前最完整的组合之一。</p></article>
        </div>
      </section>

      <section className="section d4rt-section" id="d4rt-table">
        <SectionHeading index="07 · THE REQUESTED TABLE" title={<>把 D4RT 原表复刻成<em>可查证表格</em></>} note="下面严格对应 D4RT 原论文 Table 2 的六个 capability。它能说明 D4RT 的接口统一性，但不能回答“是否学到多未来 3D 分布”。" />
        <EvidenceMatrix columns={d4rtCapabilityColumns} rows={d4rtCapabilityMatrix} compact />
        <div className="d4rt-reading">
          <div><span>真正新增</span><strong>统一的 4D ray query</strong><p>query = (u, v, source time, target time, target camera)，同一个 decoder 稀疏读取 depth 与跨时 3D correspondence。</p></div>
          <div><span>直接证据</span><strong>一个 decoder 覆盖多个任务</strong><p>全局视频 latent + 局部 RGB patch，在不同 reference frame、稀疏 query 和 dense reconstruction 之间复用。</p></div>
          <div><span>仍未解决</span><strong>不是未来分布，也不是 streaming belief</strong><p>输入完整视频后做确定性查询；没有展示同一观测条件下的多种未来 4D，也没有在线更新的概率状态。</p></div>
        </div>
        <ExternalLink href="https://d4rt-paper.github.io/">D4RT 项目页与原文</ExternalLink>
      </section>

      <section className="section library-section" id="dossiers">
        <SectionHeading light index="08 · PAPER DOSSIERS" title={<>每篇只保留一个<em>不可再缩的贡献</em></>} note="“核心贡献”不是摘要复述，而是相对直接前驱新增的最小机制。现在每张卡还包含一个仅改单变量的“强 autoencoder 证伪 gate”。" />
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
                <div className="diagnostic-proposal">
                  <header>
                    <div><span>{diagnosticByPaper[paper.id].gate}</span><small>{diagnosticByPaper[paper.id].target}</small></div>
                    <h4>{diagnosticByPaper[paper.id].name}</h4>
                    <b>实验设想 · 尚未运行</b>
                  </header>
                  <dl className="diagnostic-protocol">
                    <div><dt>唯一改变</dt><dd>{diagnosticByPaper[paper.id].singleVariable}</dd></div>
                    <div><dt>冻结变量</dt><dd>{diagnosticByPaper[paper.id].frozen}</dd></div>
                    <div className="protocol-wide"><dt>最小 protocol</dt><dd>{diagnosticByPaper[paper.id].protocol}</dd></div>
                    <div className="shortcut-signal"><dt>若只是表层捷径</dt><dd>{diagnosticByPaper[paper.id].shortcutFailure}</dd></div>
                    <div><dt>通过标准</dt><dd>{diagnosticByPaper[paper.id].passCriterion}</dd></div>
                    <div className="protocol-wide metric-line"><dt>主指标</dt><dd>{diagnosticByPaper[paper.id].metric}</dd></div>
                  </dl>
                </div>
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
        <SectionHeading index="09 · METHOD & BOUNDARY" title={<>这张地图如何<em>避免伪关系</em></>} note="引用图只能找候选关系，不能替代读文。最终边与单元格都回到论文的 method、ablation、limitations 和 evaluation。" />
        <div className="method-grid">
          <article><span>01</span><h3>先追引用，再读全文</h3><p>用 references / related work 找直接前驱，随后复核模型结构、训练目标、消融和失败案例；本版逐篇全文复核 29 篇。</p></article>
          <article><span>02</span><h3>关系标签分四类</h3><p><b>直接继承</b>要求复用代码、权重或架构；<b>表征继承</b>复用 pointmap / SLAT 等对象；<b>问题延续</b>只解决同一缺口；<b>相邻参照</b>不构成前后继。</p></article>
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
