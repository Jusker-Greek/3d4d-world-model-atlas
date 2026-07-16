"use client";

import { useMemo, useState } from "react";

type Mode = "显式分布" | "隐式先验" | "单场景优化" | "评测 / 分析";
type Paper = {
  title: string;
  venue: string;
  year: number;
  honor: string;
  family: "几何重建" | "4D 记忆" | "生成世界" | "物理 / 机器人" | "评测 / 分析";
  mode: Mode;
  representation: string;
  takeaway: string;
  url: string;
};

const papers: Paper[] = [
  {
    title: "D4RT: Efficiently Reconstructing Dynamic Scenes One 4D Ray at a Time",
    venue: "CVPR",
    year: 2026,
    honor: "Best Paper",
    family: "几何重建",
    mode: "隐式先验",
    representation: "视频级全局场景表征 + 4D ray query",
    takeaway: "把深度、跨时对应和相机统一为一个可查询函数；跨场景学习共享先验，但每次查询仍给出单一几何答案。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Zhang_Efficiently_Reconstructing_Dynamic_Scenes_One_D4RT_at_a_Time_CVPR_2026_paper.html",
  },
  {
    title: "Native and Compact Structured Latents for 3D Generation",
    venue: "CVPR",
    year: 2026,
    honor: "Best Student Paper",
    family: "生成世界",
    mode: "显式分布",
    representation: "O-Voxel + sparse VAE latent",
    takeaway: "把任意拓扑、外观与 PBR 属性压进原生稀疏 3D latent，再用 4B flow-matching 模型学习资产级 3D 分布。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Xiang_Native_and_Compact_Structured_Latents_for_3D_Generation_CVPR_2026_paper.html",
  },
  {
    title: "SAM 3D: 3Dfy Anything in Images",
    venue: "CVPR",
    year: 2026,
    honor: "Best Paper Honorable Mention",
    family: "生成世界",
    mode: "显式分布",
    representation: "对象中心生成式 3D latent",
    takeaway: "以大规模合成预训练和真实图像对齐，把单图重建从确定性回归转成有强数据先验的生成问题。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Chen_SAM_3D_3Dfy_Anything_in_Images_CVPR_2026_paper.html",
  },
  {
    title: "PointWorld: Scaling 3D World Models for In-the-Wild Robotic Manipulation",
    venue: "CVPR",
    year: 2026,
    honor: "Main",
    family: "物理 / 机器人",
    mode: "隐式先验",
    representation: "共享 3D point-flow 状态 / 动作空间",
    takeaway: "在 200 万条跨机器人轨迹上学习动作条件的逐像素 3D 位移，并把预测器直接用于 MPC；论文未把多解采样作为核心。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Huang_PointWorld_Scaling_3D_World_Models_for_In-The-Wild_Robotic_Manipulation_CVPR_2026_paper.html",
  },
  {
    title: "TraceGen: World Modeling in 3D Trace Space Enables Learning from Cross-Embodiment Videos",
    venue: "CVPR",
    year: 2026,
    honor: "Main",
    family: "物理 / 机器人",
    mode: "隐式先验",
    representation: "对象 / 部件的符号化 3D 轨迹",
    takeaway: "不在像素里预测未来，而是在紧凑 3D trace 空间学习可迁移运动先验；它明确学到跨视频 prior，但摘要未主张校准的多未来分布。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Lee_TraceGen_World_Modeling_in_3D_Trace_Space_Enables_Learning_from_CVPR_2026_paper.html",
  },
  {
    title: "U4D: Uncertainty-Aware 4D World Modeling from LiDAR Sequences",
    venue: "CVPR",
    year: 2026,
    honor: "Main",
    family: "生成世界",
    mode: "显式分布",
    representation: "LiDAR 时空 token + diffusion",
    takeaway: "显式建模观测不确定性：先生成高熵、困难区域，再补全其余时空结构，是少数直接承认多未来的 4D 方法。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Xu_U4D_Uncertainty-Aware_4D_World_Modeling_from_LiDAR_Sequences_CVPR_2026_paper.html",
  },
  {
    title: "Gen3R: 3D Scene Generation Meets Feed-Forward Reconstruction",
    venue: "CVPR",
    year: 2026,
    honor: "Main",
    family: "生成世界",
    mode: "显式分布",
    representation: "VGGT geometry latent + video diffusion latent",
    takeaway: "把可生成的外观 latent 与可度量的几何 latent 对齐，同时产出 RGB、相机、深度和全局点云。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Huang_Gen3R_3D_Scene_Generation_Meets_Feed-Forward_Reconstruction_CVPR_2026_paper.html",
  },
  {
    title: "Stereo World Model: Camera-Guided Stereo Video Generation",
    venue: "CVPR",
    year: 2026,
    honor: "Main",
    family: "生成世界",
    mode: "显式分布",
    representation: "双目视频 latent + disparity grounding",
    takeaway: "在视频生成中联合外观和双目几何，以相机坐标 RoPE 与 stereo attention 约束跨视点一致性。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Sun_Stereo_World_Model_Camera-Guided_Stereo_Video_Generation_CVPR_2026_paper.html",
  },
  {
    title: "WorldReel: 4D Video Generation with Consistent Geometry and Motion Modeling",
    venue: "CVPR",
    year: 2026,
    honor: "Main",
    family: "生成世界",
    mode: "显式分布",
    representation: "RGB + 4D pointmap + camera + flow",
    takeaway: "将视频和显式 4D 几何作为联合生成目标，利用合成数据的精确监督与真实视频的多样性。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Fang_WorldReel_4D_Video_Generation_with_Consistent_Geometry_and_Motion_Modeling_CVPR_2026_paper.html",
  },
  {
    title: "Grounded Latents for Entity-Centric 4D Scene Generation",
    venue: "CVPR",
    year: 2026,
    honor: "Main",
    family: "生成世界",
    mode: "显式分布",
    representation: "实体中心、几何落地的 4D latent",
    takeaway: "把生成 latent 绑定到可定位的实体与时空结构，降低纯视频 latent 中身份漂移和几何纠缠。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Park_Grounded_Latents_for_Entity-Centric_4D_Scene_Generation_CVPR_2026_paper.html",
  },
  {
    title: "PerpetualWonder: Long-horizon Action-conditioned 4D Scene Generation",
    venue: "CVPR",
    year: 2026,
    honor: "Main",
    family: "生成世界",
    mode: "显式分布",
    representation: "动作条件 4D 场景 latent",
    takeaway: "目标从一次性视频扩展到长时、可行动条件控制的 4D 场景生成，关注状态累积后的几何稳定性。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Zhan_PerpetualWonder_Long-horizon_Action-conditioned_4D_Scene_Generation_CVPR_2026_paper.html",
  },
  {
    title: "Captain Safari: A World Engine with Pose-Aligned 3D Memory",
    venue: "CVPR",
    year: 2026,
    honor: "Main",
    family: "4D 记忆",
    mode: "隐式先验",
    representation: "pose-aligned persistent memory tokens",
    takeaway: "沿 6DoF 路径检索与当前姿态对齐的历史 token，把世界模型从滑窗生成推进到持久场景记忆。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Chou_Captain_Safari_A_World_Engine_with_Pose-Aligned_3D_Memory_CVPR_2026_paper.html",
  },
  {
    title: "DynamicVGGT: Learning Dynamic Point Maps for 4D Scene Reconstruction",
    venue: "CVPR",
    year: 2026,
    honor: "Main",
    family: "几何重建",
    mode: "隐式先验",
    representation: "当前 / 未来 pointmap + motion attention",
    takeaway: "在 VGGT 路线上加入动态点图与速度，把共享坐标系内的几何重建扩展到运动场。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/He_DynamicVGGT_Learning_Dynamic_Point_Maps_for_4D_Scene_Reconstruction_in_CVPR_2026_paper.html",
  },
  {
    title: "Any4D: Unified Feed-Forward Metric 4D Reconstruction",
    venue: "CVPR",
    year: 2026,
    honor: "Main",
    family: "几何重建",
    mode: "隐式先验",
    representation: "metric pointmap + camera + scene flow",
    takeaway: "统一 RGB-D、IMU、雷达等可选输入，兼顾自我中心深度与全局相机 / 场景流。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Karhade_Any4D_Unified_Feed-Forward_Metric_4D_Reconstruction_CVPR_2026_paper.html",
  },
  {
    title: "Point4Cast: Streaming Dynamic Scene Reconstruction and Forecasting",
    venue: "CVPR",
    year: 2026,
    honor: "Main",
    family: "4D 记忆",
    mode: "隐式先验",
    representation: "持续更新的 latent spacetime",
    takeaway: "流式更新同一个时空状态，并能查询过去、现在与未来点图；比整段视频一次性编码更接近持续世界状态。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Liu_Point4Cast_Streaming_Dynamic_Scene_Reconstruction_and_Forecasting_CVPR_2026_paper.html",
  },
  {
    title: "4D Primitive-Mache: Glueing Primitives for Persistent 4D Scene Reconstruction",
    venue: "CVPR",
    year: 2026,
    honor: "Main",
    family: "4D 记忆",
    mode: "单场景优化",
    representation: "刚性 primitive + 运动外推",
    takeaway: "通过对象永久性和 primitive 级运动补齐遮挡，但核心状态主要在当前视频上优化，不是数据集级生成分布。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Mazur_4D_Primitive-Mache_Glueing_Primitives_for_Persistent_4D_Scene_Reconstruction_CVPR_2026_paper.html",
  },
  {
    title: "Physical Object Understanding with a Physically Controllable World Model",
    venue: "CVPR",
    year: 2026,
    honor: "Main",
    family: "物理 / 机器人",
    mode: "显式分布",
    representation: "多模态变量图 + autoregressive world model",
    takeaway: "直接估计任意视觉变量在其他变量条件下的概率；多次采样的未来暴露对象、部件和运动相关性。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Venkatesh_Physical_Object_Understanding_with_a_Physically_Controllable_World_Model_CVPR_2026_paper.html",
  },
  {
    title: "P3Sim: Perceptual 3D Simulation With Physical World Modeling",
    venue: "CVPR",
    year: 2026,
    honor: "Main",
    family: "物理 / 机器人",
    mode: "显式分布",
    representation: "概率物理模型 + 几何条件 + 持久记忆",
    takeaway: "把概率推断、几何控制和场景记忆组合起来，是“分布 + 3D + 持久状态”三者交汇的代表。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Lee_Perceptual_3D_Simulation_With_Physical_World_Modeling_CVPR_2026_paper.html",
  },
  {
    title: "4DWorldBench: A Comprehensive Evaluation Framework for 3D/4D World Generation Models",
    venue: "CVPR",
    year: 2026,
    honor: "Main",
    family: "评测 / 分析",
    mode: "评测 / 分析",
    representation: "质量 / 条件对齐 / 物理 / 4D 一致性指标",
    takeaway: "提醒我们：好看的视频并不等于一个好的 4D 世界模型，闭环可控性与跨时几何一致性必须单独评估。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Lu_4DWorldBench_A_Comprehensive_Evaluation_Framework_for_3D4D_World_Generation_Models_CVPR_2026_paper.html",
  },
  {
    title: "WorldGen: From Text to Traversable and Interactive 3D Worlds",
    venue: "CVPR",
    year: 2026,
    honor: "Main",
    family: "生成世界",
    mode: "显式分布",
    representation: "可遍历 3D scene asset",
    takeaway: "把文本到 3D 的目标从单对象提升到可遍历、可交互的场景资产，强调结构而非单帧观感。",
    url: "https://openaccess.thecvf.com/content/CVPR2026/html/Wang_WorldGen_From_Text_to_Traversable_and_Interactive_3D_Worlds_CVPR_2026_paper.html",
  },
  {
    title: "Depth Anything 3",
    venue: "ICLR",
    year: 2026,
    honor: "Oral",
    family: "几何重建",
    mode: "隐式先验",
    representation: "统一 depth-ray target",
    takeaway: "用简单 Transformer 和统一深度射线目标处理任意视图集合，属于强共享几何先验，但不是概率式 3D 生成。",
    url: "https://iclr.cc/virtual/2026/events/oral",
  },
  {
    title: "FlashWorld: High-quality 3D Scene Generation within Seconds",
    venue: "ICLR",
    year: 2026,
    honor: "Oral",
    family: "生成世界",
    mode: "显式分布",
    representation: "multiview diffusion 内生 3D Gaussian",
    takeaway: "在多视图扩散过程中直接输出 3DGS，并用跨模式分布匹配连接图像生成与显式 3D 场景。",
    url: "https://iclr.cc/virtual/2026/poster/10011759",
  },
  {
    title: "Unified 3D Scene Understanding Through Physical World Modeling (3WM)",
    venue: "ICLR",
    year: 2026,
    honor: "Poster",
    family: "物理 / 机器人",
    mode: "显式分布",
    representation: "RGB / flow / camera 等多模态概率图",
    takeaway: "不为每个任务造一个 head，而把深度、流、姿态等视为同一概率图上的不同条件推断路径。",
    url: "https://iclr.cc/virtual/2026/poster/10009864",
  },
  {
    title: "Geometry Forcing: Marrying Video Diffusion and 3D Representation for Consistent World Modeling",
    venue: "ICLR",
    year: 2026,
    honor: "Poster",
    family: "评测 / 分析",
    mode: "隐式先验",
    representation: "视频 diffusion feature ↔ 几何 teacher feature",
    takeaway: "实验证明原始视频扩散 latent 未必自动形成可靠 3D；需要角度与尺度目标把中间表征压向几何特征。",
    url: "https://iclr.cc/virtual/2026/poster/10009233",
  },
  {
    title: "Latent Particle World Models",
    venue: "ICLR",
    year: 2026,
    honor: "Oral",
    family: "物理 / 机器人",
    mode: "显式分布",
    representation: "object-centric latent particles",
    takeaway: "以粒子集合和随机动力学表达多对象世界；未必有度量 3D，但为“对象级分布式未来”提供了重要参照。",
    url: "https://iclr.cc/virtual/2026/events/oral",
  },
  {
    title: "One2Scene: Single Image to 3D Scene with Panorama Anchors",
    venue: "ICLR",
    year: 2026,
    honor: "Poster",
    family: "生成世界",
    mode: "显式分布",
    representation: "panorama anchors + 3D Gaussian scaffold",
    takeaway: "先生成环视锚点，再以显式 3DGS 脚手架组织新视图，减少单图外推中的漂移。",
    url: "https://iclr.cc/virtual/2026/poster/10007985",
  },
  {
    title: "L4P: A Unified Foundation Model for 4D Perception",
    venue: "3DV",
    year: 2026,
    honor: "Oral",
    family: "几何重建",
    mode: "隐式先验",
    representation: "共享视频 encoder + 轻量任务 heads",
    takeaway: "用共享 backbone 统一一组低层 4D 感知任务；本质仍是摊销后的多任务点估计。",
    url: "https://openreview.net/forum?id=QjXSTzq6AZ",
  },
  {
    title: "TwoSquared: 4D Scene Synthesis from Two 2D Images",
    venue: "3DV",
    year: 2026,
    honor: "Oral",
    family: "生成世界",
    mode: "显式分布",
    representation: "双端点 3D + 中间物理形变",
    takeaway: "从起止两张图重建端点状态，再生成物理上可行的中间 4D 形变，凸显欠约束问题中的多解性。",
    url: "https://openreview.net/forum?id=Demc1PF0fe",
  },
  {
    title: "Look Around and Pay Attention: Multi-camera Point Tracking Reimagined with Transformers",
    venue: "3DV",
    year: 2026,
    honor: "Best Paper",
    family: "几何重建",
    mode: "隐式先验",
    representation: "多相机 3D point track + attention aggregation",
    takeaway: "对跨相机不完整观测做注意力加权 3D 聚合，长遮挡与不确定观测下仍能保持轨迹。",
    url: "https://openreview.net/forum?id=VlxoTrN71u",
  },
  {
    title: "ConTiCoM-3D: Continuous-Time Consistency Models for 3D Point Cloud Generation",
    venue: "3DV",
    year: 2026,
    honor: "Poster",
    family: "生成世界",
    mode: "显式分布",
    representation: "连续时间 consistency point cloud model",
    takeaway: "直接学习点云数据分布，而不是从每个输入独立回归唯一形状，是“3D 分布”最干净的例子之一。",
    url: "https://openreview.net/forum?id=eyFFM7a3w8",
  },
  {
    title: "MapAnything: Universal Feed-Forward Metric 3D Reconstruction",
    venue: "3DV",
    year: 2026,
    honor: "Poster",
    family: "几何重建",
    mode: "隐式先验",
    representation: "metric 3D map tokens",
    takeaway: "广泛输入设定下的统一度量重建器；把跨数据集规律压进权重，但输出依然是条件点估计。",
    url: "https://openreview.net/forum?id=tcmc0jpDgU",
  },
  {
    title: "FR3D: Future Dynamic 3D Reconstruction — A 3D World Model with Disentangled Ego-Motion",
    venue: "ICML",
    year: 2026,
    honor: "Poster",
    family: "4D 记忆",
    mode: "隐式先验",
    representation: "persistent 3D latent + scene / ego-motion decomposition",
    takeaway: "在统一 3D latent 中分离场景演化与自运动，并预测“最可能”的未来 3D 重建；持久状态明确，多解分布并非主目标。",
    url: "https://fr3d-wm.github.io/",
  },
  {
    title: "WorldGrow: Generating Infinite 3D World",
    venue: "AAAI",
    year: 2026,
    honor: "Main",
    family: "生成世界",
    mode: "显式分布",
    representation: "可拼接 3D scene blocks",
    takeaway: "条件于已生成区块做 3D inpainting，以 coarse-to-fine 方式学习可无限扩张的大场景分布。",
    url: "https://ojs.aaai.org/index.php/AAAI/article/view/37571",
  },
  {
    title: "VGGT: Visual Geometry Grounded Transformer",
    venue: "CVPR",
    year: 2025,
    honor: "Best Paper",
    family: "几何重建",
    mode: "隐式先验",
    representation: "全局场景 token + point / depth / camera heads",
    takeaway: "前馈多视图几何的关键拐点：一个模型从任意图像集合直接预测相机、深度、点图和轨迹。",
    url: "https://openaccess.thecvf.com/content/CVPR2025/html/Wang_VGGT_Visual_Geometry_Grounded_Transformer_CVPR_2025_paper.html",
  },
  {
    title: "Learning 4D Embodied World Models",
    venue: "ICCV",
    year: 2025,
    honor: "Main",
    family: "物理 / 机器人",
    mode: "显式分布",
    representation: "动作条件 RGB-D-normal video → 4D",
    takeaway: "把动作条件视频预测提升为带深度和法线的 4D 预测，是 embodied world model 从像素走向几何的重要一步。",
    url: "https://openaccess.thecvf.com/content/ICCV2025/html/Zhen_Learning_4D_Embodied_World_Models_ICCV_2025_paper.html",
  },
  {
    title: "Dynamic Point Maps: A Versatile Representation for Dynamic 3D Reconstruction",
    venue: "ICCV",
    year: 2025,
    honor: "Main",
    family: "几何重建",
    mode: "隐式先验",
    representation: "每帧点在公共参考系中的动态 pointmap",
    takeaway: "建立 2026 年多项动态点图工作的表征基础：同一像素点随时间在公共 3D 坐标系中移动。",
    url: "https://openaccess.thecvf.com/content/ICCV2025/html/Sucar_Dynamic_Point_Maps_A_Versatile_Representation_for_Dynamic_3D_Reconstruction_ICCV_2025_paper.html",
  },
  {
    title: "Spann3R: 3D Reconstruction with Spatial Memory",
    venue: "3DV",
    year: 2025,
    honor: "Main",
    family: "4D 记忆",
    mode: "隐式先验",
    representation: "在线空间 memory",
    takeaway: "在逐帧处理时维护可更新空间记忆，是从 pairwise reconstruction 走向 persistent world state 的早期代表。",
    url: "https://hengyiwang.github.io/projects/spanner",
  },
  {
    title: "DUSt3R: Geometric 3D Vision Made Easy",
    venue: "CVPR",
    year: 2024,
    honor: "Main",
    family: "几何重建",
    mode: "隐式先验",
    representation: "pairwise pointmap",
    takeaway: "用点图预测绕开传统相机标定流水线，开启大模型式前馈几何；但全局场景仍需成对对齐。",
    url: "https://openaccess.thecvf.com/content/CVPR2024/html/Wang_DUSt3R_Geometric_3D_Vision_Made_Easy_CVPR_2024_paper.html",
  },
  {
    title: "DIO: Decomposable Implicit 4D Occupancy-Flow World Model",
    venue: "CVPR",
    year: 2025,
    honor: "Main",
    family: "物理 / 机器人",
    mode: "隐式先验",
    representation: "implicit 4D occupancy-flow",
    takeaway: "将未来占据与流拆成可组合隐式函数，为自动驾驶提供连续时空状态；这里的“implicit”指函数表征，不等于概率分布。",
    url: "https://openaccess.thecvf.com/content/CVPR2025/papers/Diehl_DIO_Decomposable_Implicit_4D_Occupancy-Flow_World_Model_CVPR_2025_paper.pdf",
  },
  {
    title: "GaussianWorld: Gaussian World Model for Streaming 3D Occupancy Prediction",
    venue: "CVPR",
    year: 2025,
    honor: "Main",
    family: "4D 记忆",
    mode: "隐式先验",
    representation: "streaming 3D Gaussians + occupancy",
    takeaway: "以可持续更新的 3D Gaussian 状态预测占据，代表显式空间记忆与未来预测的合流；并未以多样采样为核心。",
    url: "https://openaccess.thecvf.com/content/CVPR2025/papers/Zuo_GaussianWorld_Gaussian_World_Model_for_Streaming_3D_Occupancy_Prediction_CVPR_2025_paper.pdf",
  },
  {
    title: "NeRF: Representing Scenes as Neural Radiance Fields",
    venue: "ECCV",
    year: 2020,
    honor: "Oral",
    family: "几何重建",
    mode: "单场景优化",
    representation: "每场景连续 radiance field",
    takeaway: "学习的是一个场景内部的空间函数，而不是跨场景分布；每遇到新场景通常要重新优化。",
    url: "https://www.matthewtancik.com/nerf",
  },
  {
    title: "3D Gaussian Splatting for Real-Time Radiance Field Rendering",
    venue: "SIGGRAPH",
    year: 2023,
    honor: "Best Paper",
    family: "几何重建",
    mode: "单场景优化",
    representation: "每场景 3D Gaussians",
    takeaway: "把单场景状态变成可渲染高斯集合，速度大幅提高，但其优化对象仍是某个具体场景。",
    url: "https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/",
  },
];

const modeExplain: { mode: Mode; eyebrow: string; text: string }[] = [
  {
    mode: "单场景优化",
    eyebrow: "scene-specific field",
    text: "每个场景单独拟合一套参数。它形成的是该场景内部的连续场，而非跨场景概率分布。",
  },
  {
    mode: "隐式先验",
    eyebrow: "amortized predictor",
    text: "一个网络见过许多场景，权重编码跨场景规律；推理时通常仍输出唯一深度、点图或相机。",
  },
  {
    mode: "显式分布",
    eyebrow: "generative / stochastic model",
    text: "用扩散、flow matching、自回归或随机动力学对条件分布建模，同一条件可采样多个 3D / 4D 解。",
  },
  {
    mode: "评测 / 分析",
    eyebrow: "evidence & diagnosis",
    text: "不直接生成状态，而是检验几何一致性、物理合理性、闭环可控性或 latent 是否真的含 3D。",
  },
];

const conferenceAudits = [
  {
    name: "CVPR 2026",
    grade: "最完整",
    count: "官方 4,089 篇录用；当前 Open Access 索引 4,068 条标题",
    method: "全索引标题机械扫描 → 3D/4D/world/dynamic/geometry 候选 → 摘要复核 → award 页交叉核验。",
    result: "D4RT 获 Best Paper；O-Voxel 获 Best Student Paper；SAM 3D 获 Honorable Mention。",
    url: "https://cvpr.thecvf.com/Conferences/2026/News/Best_Papers",
  },
  {
    name: "ICLR 2026",
    grade: "完整标题扫描",
    count: "官方口径 5,355 篇录用",
    method: "官方 paper / oral 列表标题扫描，候选 virtual poster 摘要复核；获奖列表另行检查。",
    result: "Depth Anything 3、FlashWorld、Latent Particle World Models、World-In-World 为 oral；Outstanding Papers 与 3D 主线无直接重合。",
    url: "https://iclr.cc/virtual/2026/events/oral",
  },
  {
    name: "3DV 2026",
    grade: "全表扫描",
    count: "官方 schedule CSV 共 177 条论文记录",
    method: "逐条扫描标题、decision 与摘要；对 oral / award 候选回到 OpenReview 核验。",
    result: "Look Around and Pay Attention 获 Best Paper；L4P 与 TwoSquared 为 oral。",
    url: "https://3dvconf.github.io/2026/awards/",
  },
  {
    name: "ICML 2026",
    grade: "官方列表筛查",
    count: "按官方 program / downloads 页扫描相关关键词",
    method: "从 3D、4D、world model、robot planning 候选回查项目页和论文；不把预印本投稿状态当录用。",
    result: "FR3D 是最直接的 3D future world model；会议刚结束，后续版本与奖项信息仍可能更新。",
    url: "https://icml.cc/Downloads/2026",
  },
  {
    name: "AAAI 2026",
    grade: "官方 proceedings 筛查",
    count: "按 OJS 主会论文集与标题关键词核对",
    method: "对 3D / 4D / dynamic world 候选阅读官方摘要，并区分 main / demo track。",
    result: "WorldGrow 是大尺度 3D 生成代表；3D4D 属 demo track，未混入主会核心证据。",
    url: "https://ojs.aaai.org/index.php/AAAI/issue/view/651",
  },
  {
    name: "待定会场",
    grade: "截至 2026-07-16",
    count: "ECCV / NeurIPS 2026 尚无可稳定复核的最终公开论文集",
    method: "不依据作者主页或 arXiv 的单方 venue 标注冒充官方 award / oral 结论。",
    result: "SIGGRAPH 2026 尚未开幕；相关预印本可作为观察项，但不纳入本页核心会议结论。",
    url: "https://s2026.siggraph.org/",
  },
];

const nav = [
  ["thesis", "核心结论"],
  ["lineage", "发展脉络"],
  ["d4rt", "拆解 D4RT"],
  ["distribution", "分布如何形成"],
  ["matrix", "方法对比"],
  ["audit", "会议审计"],
  ["library", "论文索引"],
  ["agenda", "研究机会"],
];

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="external-link">
      {children}<span aria-hidden="true">↗</span>
    </a>
  );
}

export default function Home() {
  const [conference, setConference] = useState("全部");
  const [family, setFamily] = useState("全部");
  const [mode, setMode] = useState("全部");
  const [query, setQuery] = useState("");

  const conferences = ["全部", "CVPR", "ICLR", "3DV", "ICML", "AAAI", "历史锚点"];
  const families = ["全部", "几何重建", "4D 记忆", "生成世界", "物理 / 机器人", "评测 / 分析"];
  const modes = ["全部", "显式分布", "隐式先验", "单场景优化", "评测 / 分析"];

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return papers.filter((paper) => {
      const confMatch = conference === "全部" ||
        (conference === "历史锚点" ? paper.year < 2026 : paper.venue === conference && paper.year === 2026);
      const familyMatch = family === "全部" || paper.family === family;
      const modeMatch = mode === "全部" || paper.mode === mode;
      const queryMatch = !normalized || [paper.title, paper.takeaway, paper.representation, paper.venue]
        .join(" ").toLowerCase().includes(normalized);
      return confMatch && familyMatch && modeMatch && queryMatch;
    });
  }, [conference, family, mode, query]);

  return (
    <main>
      <header className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-kicker"><span>RESEARCH ATLAS · 01</span><span>更新于 2026.07.16</span></div>
          <div className="hero-copy">
            <p className="overline">3D / 4D WORLD MODEL FIELD GUIDE</p>
            <h1>世界模型，<br/><em>到底怎样学会 3D？</em></h1>
            <p className="hero-deck">从 NeRF、DUSt3R、VGGT 到 D4RT、FlashWorld 与概率物理模型：这不是一份“论文堆砌”，而是一张关于<strong>场景状态、跨场景先验、多解分布、持久记忆与动力学</strong>的学习地图。</p>
            <div className="hero-actions">
              <a className="button primary" href="#thesis">先看结论 <span>↓</span></a>
              <a className="button secondary" href="#library">检索 {papers.length} 篇论文</a>
            </div>
          </div>
          <div className="hero-note">
            <span className="note-index">01</span>
            <p>核心判断</p>
            <strong>D4RT 学到了跨场景的几何先验，<br/>但没有显式学习“多个可能 3D 世界”的概率分布。</strong>
          </div>
          <div className="hero-metrics">
            <div><strong>6</strong><span>会场 / 状态审计</span></div>
            <div><strong>{papers.filter(p => p.year === 2026).length}</strong><span>篇 2026 核心论文</span></div>
            <div><strong>4</strong><span>种“学习 3D”范式</span></div>
          </div>
        </div>
      </header>

      <nav className="chapter-nav" aria-label="章节导航">
        <a className="brand" href="#top"><span>4D</span> ATLAS</a>
        <div className="chapter-links">
          {nav.map(([id, label], i) => <a key={id} href={`#${id}`}><b>{String(i + 1).padStart(2, "0")}</b>{label}</a>)}
        </div>
      </nav>

      <section className="section thesis-section" id="thesis">
        <div className="section-heading">
          <p className="section-number">01 / 核心结论</p>
          <h2>先拆掉一个歧义：<br/><em>“逐个样本处理”不等于“没有学习分布”</em></h2>
        </div>
        <div className="thesis-layout">
          <aside className="margin-note">
            <span>一句话回答</span>
            <p>现代前馈几何模型通常在推理时逐个场景输出，但它们的共享权重已经从数据集学习了跨场景先验。真正稀缺的是：对同一不完整观测，生成多个校准且物理可行的 3D / 4D 假设。</p>
          </aside>
          <div className="mode-grid">
            {modeExplain.map((item, i) => (
              <article className={`mode-card mode-${i}`} key={item.mode}>
                <div className="mode-top"><span>0{i + 1}</span><small>{item.eyebrow}</small></div>
                <h3>{item.mode}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="equation-card">
          <span>问题的两条轴</span>
          <div className="equation-row"><b>推理粒度</b><code>一个场景 / 一段视频 → 一个输出</code></div>
          <div className="equation-mark">≠</div>
          <div className="equation-row"><b>学习目标</b><code>点估计 ŷ = f(x)　或　条件分布 p(Y | X, A)</code></div>
        </div>
      </section>

      <section className="section dark-section" id="lineage">
        <div className="section-heading light">
          <p className="section-number">02 / 发展脉络</p>
          <h2>从“拟合一个场景”<br/>到“维护一个会演化的世界”</h2>
        </div>
        <div className="lineage">
          <article>
            <span className="lineage-year">2020—2023</span>
            <div className="lineage-dot" />
            <small>FIELD</small>
            <h3>每场景连续场</h3>
            <p>NeRF / 3DGS 为每个场景单独优化辐射场或高斯集合。空间是连续的，但知识很少跨场景迁移。</p>
            <strong>学到：场景内的 3D 函数</strong>
          </article>
          <article>
            <span className="lineage-year">2024—2025</span>
            <div className="lineage-dot" />
            <small>PRIOR</small>
            <h3>摊销式几何先验</h3>
            <p>DUSt3R / VGGT 把大量场景压进共享参数，直接预测 pointmap、相机和深度。</p>
            <strong>学到：跨场景的条件点估计</strong>
          </article>
          <article>
            <span className="lineage-year">2025—2026</span>
            <div className="lineage-dot" />
            <small>MEMORY</small>
            <h3>持久 4D 世界状态</h3>
            <p>Spann3R / Captain Safari / Point4Cast / FR3D 让状态跨帧更新，并允许查询过去与未来。</p>
            <strong>学到：可持续更新的 belief state</strong>
          </article>
          <article>
            <span className="lineage-year">2026 →</span>
            <div className="lineage-dot" />
            <small>DISTRIBUTION</small>
            <h3>生成式 3D 与动力学</h3>
            <p>O-Voxel、FlashWorld、U4D、3WM、P3Sim 用 flow / diffusion / AR 对对象、场景或未来建模。</p>
            <strong>目标：p(世界状态与演化 | 观测, 动作)</strong>
          </article>
        </div>
      </section>

      <section className="section d4rt-section" id="d4rt">
        <div className="section-heading split">
          <div><p className="section-number">03 / D4RT CASE STUDY</p><h2>D4RT 为什么重要，<br/><em>又没有做什么？</em></h2></div>
          <div className="award-stamp"><span>CVPR 2026</span><strong>BEST<br/>PAPER</strong></div>
        </div>
        <div className="d4rt-grid">
          <div className="architecture-card">
            <div className="arch-label">GLOBAL ENCODE · LOCAL QUERY</div>
            <div className="video-stack" aria-label="输入视频帧示意">
              <div>t<sub>1</sub></div><div>t<sub>2</sub></div><div>t<sub>…</sub></div><div>t<sub>T</sub></div>
            </div>
            <div className="arch-arrow">↓　共享 Transformer 编码整段视频　↓</div>
            <div className="global-state"><small>GLOBAL SCENE REPRESENTATION</small><strong>一个视频级、时空耦合的 latent 场景状态</strong><div className="token-row"><i/><i/><i/><i/><i/><i/><i/><i/></div></div>
            <div className="query-box"><span>QUERY</span><code>(u, v, t<sub>src</sub>, t<sub>tgt</sub>, t<sub>cam</sub>)</code></div>
            <div className="arch-arrow compact">↓ query decoder ↓</div>
            <div className="outputs"><div><small>3D POSITION</small><b>x, y, z</b></div><div><small>DERIVED</small><b>depth · track · camera</b></div></div>
          </div>
          <div className="d4rt-analysis">
            <div className="claim positive"><span>它突破了什么</span><h3>统一查询接口，而不是任务拼装</h3><p>深度、跨时对应和相机不再各跑一套 pipeline，而是同一个 4D ray query 在不同时间与相机坐标条件下的读出。</p></div>
            <div className="claim neutral"><span>它怎样“学习 3D”</span><h3>共享网络学习跨视频几何规律</h3><p>训练数据中的形状、遮挡、运动和相机规律进入参数与视频级 latent；新视频无需像 NeRF 那样重新优化。</p></div>
            <div className="claim warning"><span>它还不是</span><h3>显式多假设世界分布</h3><p>同一 query 通常返回一个 3D 位置；论文主目标不是估计校准的 p(X<sub>3D</sub> | video)，也不靠采样表达遮挡背后的多个可能世界。</p></div>
            <ExternalLink href="https://d4rt-paper.github.io/">D4RT 项目主页</ExternalLink>
          </div>
        </div>
      </section>

      <section className="section distribution-section" id="distribution">
        <div className="section-heading">
          <p className="section-number">04 / 分布如何形成</p>
          <h2>“3D 分布”不是一句口号，<br/><em>至少有五个不同层级</em></h2>
        </div>
        <div className="distribution-layers">
          {[
            ["01", "空间场", "Fθ(x, y, z, t)", "单场景中的连续密度、颜色、占据或运动。NeRF 做到了这一层，但不自动成为数据集分布。"],
            ["02", "跨场景先验", "θ ← {sceneᵢ}", "共享参数从许多场景吸收规律。VGGT / D4RT 属于这里，即便输出仍是确定性的。"],
            ["03", "歧义后验", "p(S | observations)", "对未观测区域、单图背面或遮挡后的结构保留多种假设；需要 VAE、diffusion、flow 或 AR。"],
            ["04", "动力学分布", "p(Sₜ₊₁ | S≤ₜ, A≤ₜ)", "动作与接触下的多个可能未来。U4D、PointWorld、3WM、P3Sim 更靠近这个目标。"],
            ["05", "持久世界信念", "bₜ(S) ∝ p(oₜ | S)bₜ₋₁(S)", "新观测持续更新记忆，同时保留不可见对象和不确定性；目前仍是最不成熟的一层。"],
          ].map(([n, title, formula, text]) => (
            <article key={n}><span>{n}</span><div><h3>{title}</h3><code>{formula}</code><p>{text}</p></div></article>
          ))}
        </div>
        <div className="how-distribution">
          <h3>实际训练中，分布是这样被“做出来”的</h3>
          <div className="pipeline">
            {[
              ["对齐", "把不同场景放入相对 / 世界 / 相机坐标约定"],
              ["离散化", "选择 voxel、point、Gaussian、ray、object 或 latent particle"],
              ["条件化", "输入观测、文字、相机、动作与历史记忆"],
              ["建模", "回归只学中心；diffusion / flow / AR 学条件密度"],
              ["约束", "加入多视图、深度、流、物理、身份与闭环一致性"],
              ["采样", "同一条件产生多个世界，再用任务或规划筛选"],
            ].map(([title, text], i) => <div key={title}><b>{i + 1}</b><h4>{title}</h4><p>{text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="section matrix-section" id="matrix">
        <div className="section-heading">
          <p className="section-number">05 / 方法对比</p>
          <h2>不要只问“是不是 world model”，<br/><em>要问它的状态与随机性在哪里</em></h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>代表方法</th><th>世界状态</th><th>跨场景学习</th><th>多解采样</th><th>时间 / 动作</th><th>持久记忆</th></tr></thead>
            <tbody>
              <tr><td>NeRF / 3DGS</td><td>field / Gaussians</td><td><i className="no">—</i></td><td><i className="no">—</i></td><td><i className="no">—</i></td><td>单场景参数</td></tr>
              <tr><td>DUSt3R / VGGT</td><td>pointmap + camera</td><td><i className="yes">●</i></td><td><i className="no">—</i></td><td>弱 / 无</td><td><i className="no">—</i></td></tr>
              <tr className="highlight-row"><td>D4RT</td><td>global latent + 4D ray</td><td><i className="yes">●</i></td><td><i className="no">—</i></td><td>时间对应</td><td>视频级 latent</td></tr>
              <tr><td>Point4Cast / FR3D</td><td>persistent 3D/4D latent</td><td><i className="yes">●</i></td><td><i className="no">—</i></td><td><i className="yes">●</i></td><td><i className="yes">●</i></td></tr>
              <tr><td>O-Voxel / FlashWorld</td><td>voxel / 3DGS latent</td><td><i className="yes">●</i></td><td><i className="yes">●</i></td><td><i className="no">—</i></td><td><i className="no">—</i></td></tr>
              <tr><td>U4D / WorldReel</td><td>LiDAR / 4D pointmap</td><td><i className="yes">●</i></td><td><i className="yes">●</i></td><td><i className="yes">●</i></td><td>短 / 中期</td></tr>
              <tr><td>3WM / P3Sim</td><td>概率变量图 + memory</td><td><i className="yes">●</i></td><td><i className="yes">●</i></td><td>动作 / 物理</td><td><i className="yes">●</i></td></tr>
            </tbody>
          </table>
        </div>
        <p className="table-footnote">● 表示论文目标中明确具备；“多解采样”只在同一条件可表达多个状态或未来时标记。前馈模型的训练数据分布不等于显式输出分布。</p>
      </section>

      <section className="section audit-section" id="audit">
        <div className="section-heading split">
          <div><p className="section-number">06 / CONFERENCE AUDIT</p><h2>2026 会场清单，<br/><em>我们具体核对了什么？</em></h2></div>
          <p className="heading-note">筛选口径：论文必须直接预测、生成、维护或评估显式 / 隐式 3D、动态 4D 状态；仅用 “world” 命名但没有空间状态的工作列为相邻项，不充当核心证据。</p>
        </div>
        <div className="audit-grid">
          {conferenceAudits.map((audit, i) => (
            <article key={audit.name}>
              <div className="audit-head"><span>{String(i + 1).padStart(2, "0")}</span><small>{audit.grade}</small></div>
              <h3>{audit.name}</h3>
              <strong>{audit.count}</strong>
              <p>{audit.method}</p>
              <div className="audit-result">{audit.result}</div>
              <ExternalLink href={audit.url}>官方来源</ExternalLink>
            </article>
          ))}
        </div>
        <div className="integrity-note"><b>研究完整性说明</b><p>“全列表扫描”指对官方列表逐标题进行机械筛选并对候选读摘要，不代表逐篇通读数千篇全文。GeoWorld 一类只在 latent 几何中工作的论文不会因为标题含“Geo / World”就被算作 3D；反之，点图、占据、场景流、相机与可渲染 3D 状态都纳入。</p></div>
      </section>

      <section className="section library-section" id="library">
        <div className="section-heading split">
          <div><p className="section-number">07 / PAPER LIBRARY</p><h2>论文索引与阅读卡片</h2></div>
          <p className="heading-note">每张卡片都按“表征是什么、是否显式分布、最值得读什么”重写。点击标题直达官方论文页、OpenReview 或项目页。</p>
        </div>
        <div className="filter-panel">
          <label className="search-box"><span>搜索</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：D4RT、pointmap、diffusion、memory…" /></label>
          <FilterGroup label="会场" values={conferences} active={conference} onChange={setConference}/>
          <FilterGroup label="任务" values={families} active={family} onChange={setFamily}/>
          <FilterGroup label="学习范式" values={modes} active={mode} onChange={setMode}/>
        </div>
        <div className="results-bar"><span>RESULTS</span><strong>{filtered.length}</strong><button onClick={() => {setConference("全部"); setFamily("全部"); setMode("全部"); setQuery("");}}>清空筛选</button></div>
        <div className="paper-grid">
          {filtered.map((paper, i) => (
            <article className="paper-card" key={`${paper.title}-${paper.year}`}>
              <div className="paper-meta"><span>{paper.venue} {paper.year}</span><small>{paper.honor}</small></div>
              <a href={paper.url} target="_blank" rel="noreferrer"><h3>{paper.title}</h3><span className="go">↗</span></a>
              <div className="paper-tags"><span>{paper.family}</span><span className={`mode-tag mode-${paper.mode.replaceAll(" ", "-").replace("/", "-")}`}>{paper.mode}</span></div>
              <dl><div><dt>STATE</dt><dd>{paper.representation}</dd></div><div><dt>WHY READ</dt><dd>{paper.takeaway}</dd></div></dl>
              <b className="paper-index">{String(i + 1).padStart(2, "0")}</b>
            </article>
          ))}
        </div>
        {filtered.length === 0 && <div className="empty-state"><strong>没有匹配结果</strong><p>试着清空一个筛选条件，或换一个表征关键词。</p></div>}
      </section>

      <section className="section reading-section">
        <div className="section-heading"><p className="section-number">08 / READING PATHS</p><h2>三条最短阅读路径</h2></div>
        <div className="reading-paths">
          <article><span>A</span><small>我要理解前馈 3D</small><h3>DUSt3R → VGGT → D4RT</h3><p>点图如何替代传统几何流水线；全局 token 如何统一多视图；4D ray query 如何统一动态场景任务。</p></article>
          <article><span>B</span><small>我要理解 3D 生成分布</small><h3>O-Voxel → FlashWorld → WorldReel</h3><p>先看原生 3D latent，再看 diffusion 内生 3DGS，最后看 RGB 与显式 4D pointmap 的联合生成。</p></article>
          <article><span>C</span><small>我要做可行动世界模型</small><h3>3WM → P3Sim → PointWorld</h3><p>从多模态概率推断，到持久场景记忆，再到 3D point-flow 空间里的动作预测与 MPC。</p></article>
        </div>
      </section>

      <section className="section agenda-section" id="agenda">
        <div className="section-heading light"><p className="section-number">09 / OPEN RESEARCH AGENDA</p><h2>如果下一步要做研究，<br/>真正空着的位置在哪里？</h2></div>
        <div className="agenda-layout">
          <div className="agenda-lead"><p>当前最强的工作往往只覆盖右侧能力中的两三项。一个真正完整的 3D/4D world model，应该维护一个<strong>可更新、可采样、可行动、可校准</strong>的世界信念。</p><code>p(S<sub>0:T</sub>, O<sub>0:T</sub> | I<sub>≤t</sub>, A<sub>≤T</sub>)</code></div>
          <ol className="agenda-list">
            <li><b>01</b><div><h3>共享 4D latent 词表</h3><p>跨场景、跨视角、跨时间仍缺统一且可组合的对象 / 表面 / 运动 primitive。</p></div></li>
            <li><b>02</b><div><h3>校准的多模态未来</h3><p>不是生成“一个看起来对的未来”，而是给出覆盖率、概率与可验证不确定性。</p></div></li>
            <li><b>03</b><div><h3>对象永久性与反事实</h3><p>被遮挡对象应继续存在；改变动作时，世界应按接触与物理关系一致演化。</p></div></li>
            <li><b>04</b><div><h3>从相对几何到度量世界</h3><p>多数据集坐标、尺度、重力与时间基准不一致，是形成通用 3D 分布的基础障碍。</p></div></li>
            <li><b>05</b><div><h3>闭环而非视频分数</h3><p>核心评价应转向规划成功率、重访问一致性、状态可辨识性与长期漂移。</p></div></li>
          </ol>
        </div>
      </section>

      <footer>
        <div><span>3D / 4D WORLD MODEL ATLAS</span><strong>一份以“状态、分布与记忆”为主线的研究地图</strong></div>
        <p>资料截止 2026-07-16。论文状态以官方 conference / proceedings / OpenReview 为优先依据；项目页只用于补充可视化与作者说明。</p>
        <a href="#top">回到顶部 ↑</a>
      </footer>
    </main>
  );
}

function FilterGroup({ label, values, active, onChange }: { label: string; values: string[]; active: string; onChange: (value: string) => void }) {
  return <div className="filter-group"><span>{label}</span><div>{values.map(value => <button key={value} aria-pressed={active === value} onClick={() => onChange(value)}>{value}</button>)}</div></div>;
}
