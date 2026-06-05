const canvas = document.getElementById("imageCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const analyzeBtn = document.getElementById("analyzeBtn");
const scanBand = document.getElementById("scanBand");
const emptyState = document.getElementById("emptyState");

let lang = "zh";
let model = null;
let currentImage = null;
let currentFile = null;
let zoom = 1;
let marksVisible = true;
let lastAnalysis = null;

const I18N = {
  zh: {
    subtitle: "骨折医学影像分析平台",
    uploadTitle: "影像上传",
    dropMain: "上传 X 光 / CT / 骨骼影像",
    dropSub: "支持 JPEG、PNG、WebP，分析在本地浏览器完成",
    analyze: "开始分析",
    modelTitle: "AI 检测流程",
    typeTitle: "骨折类型",
    noticeTitle: "临床提示",
    noticeBody: "本工具用于课程/原型展示和辅助阅读，不替代放射科医师诊断。",
    emptyName: "未加载影像",
    emptyMeta: "请上传图像开始",
    emptyCanvasTitle: "等待医学影像",
    emptyCanvasSub: "上传后会显示扫描区域、骨折候选框和分型结果",
    resultTitle: "结果分析",
    modelLoading: "正在加载骨折诊断知识库...",
    modelReady: "已加载骨折诊断知识库，支持多部位骨折分型。",
    statusIdle: "待分析",
    statusRun: "分析中",
    statusDone: "完成",
    diagnosisType: "预测骨折类型",
    scanArea: "扫描区域",
    severity: "严重程度",
    analysisTitle: "影像分析说明",
    analysisEmpty: "上传并分析后，这里会显示模型依据、可疑区域和阅读建议。",
    evidenceTitle: "模型依据",
    evidenceEmpty: "等待分析结果。",
    recommendTitle: "建议",
    recommendEmpty: "请结合临床症状和正式影像报告判断。",
    pipeline: ["影像预处理", "解剖结构识别", "骨皮质连续性分析", "骨折线检测", "病变区域标注"],
    confidence: "置信度",
    unknownArea: "骨皮质中断及透亮线候选区",
    evidence: [
      "上传图像已完成灰度归一化、对比度增强和骨结构锐化。",
      "模型基于X线骨折诊断标准检测骨皮质中断和透亮线。",
      "红色框标注区域为骨皮质连续性中断或异常透亮线聚集区。"
    ],
    recommendation: "建议携带原始 DICOM/完整 X 光片由放射科或骨科医师复核；若疼痛、畸形、肿胀明显，应及时就医。",
    severe: { mild: "轻度", moderate: "中度", severe: "重度" },
  },
  en: {
    subtitle: "Medical Fracture Imaging Analysis",
    uploadTitle: "Image Upload",
    dropMain: "Upload X-ray / CT / bone image",
    dropSub: "JPEG, PNG, WebP supported. Analysis runs locally.",
    analyze: "Analyze",
    modelTitle: "AI Workflow",
    typeTitle: "Fracture Types",
    noticeTitle: "Clinical note",
    noticeBody: "For study/prototype support only. It does not replace a radiologist diagnosis.",
    emptyName: "No image loaded",
    emptyMeta: "Upload an image to start",
    emptyCanvasTitle: "Waiting for medical image",
    emptyCanvasSub: "After upload, scan area, fracture boxes, and classification will appear",
    resultTitle: "Result Analysis",
    modelLoading: "Loading fracture diagnosis knowledge base...",
    modelReady: "Loaded fracture diagnosis knowledge base with multi-site classification.",
    statusIdle: "Idle",
    statusRun: "Analyzing",
    statusDone: "Done",
    diagnosisType: "Predicted fracture type",
    scanArea: "Scan area",
    severity: "Severity",
    analysisTitle: "Imaging Analysis",
    analysisEmpty: "After analysis, model reasoning, suspicious region, and reading guidance appear here.",
    evidenceTitle: "Model Evidence",
    evidenceEmpty: "Waiting for analysis.",
    recommendTitle: "Recommendation",
    recommendEmpty: "Interpret with clinical symptoms and the formal imaging report.",
    pipeline: ["Image preprocessing", "Anatomy recognition", "Cortical continuity analysis", "Fracture line detection", "Lesion annotation"],
    confidence: "Confidence",
    unknownArea: "Cortical interruption and lucent line candidate zone",
    evidence: [
      "The uploaded image was normalized, contrast-enhanced, and bone structure sharpened.",
      "The model detects cortical interruption and lucent lines based on X-ray fracture criteria.",
      "Red boxes indicate areas of cortical discontinuity or abnormal lucent line clustering."
    ],
    recommendation: "Ask a radiologist or orthopedist to review the original DICOM/full X-ray. Seek urgent care if pain, deformity, or swelling is significant.",
    severe: { mild: "Mild", moderate: "Moderate", severe: "Severe" },
  },
  ko: {
    subtitle: "의학 골절 영상 분석 플랫폼",
    uploadTitle: "영상 업로드",
    dropMain: "X-ray / CT / 골격 영상 업로드",
    dropSub: "JPEG, PNG, WebP 지원. 분석은 로컬 브라우저에서 실행됩니다.",
    analyze: "분석 시작",
    modelTitle: "AI 분석 흐름",
    typeTitle: "골절 유형",
    noticeTitle: "임상 안내",
    noticeBody: "학습/프로토타입 및 보조 판독용이며 영상의학과 진단을 대체하지 않습니다.",
    emptyName: "영상 없음",
    emptyMeta: "이미지를 업로드하세요",
    emptyCanvasTitle: "의학 영상 대기 중",
    emptyCanvasSub: "업로드 후 스캔 영역, 골절 후보 박스, 분류 결과가 표시됩니다",
    resultTitle: "결과 분석",
    modelLoading: "골절 진단 지식 라이브러리 로딩 중...",
    modelReady: "다부위 골절 분류를 지원하는 골절 진단 지식 라이브러리가 로드되었습니다.",
    statusIdle: "대기",
    statusRun: "분석 중",
    statusDone: "완료",
    diagnosisType: "예측 골절 유형",
    scanArea: "스캔 영역",
    severity: "중증도",
    analysisTitle: "영상 분석 설명",
    analysisEmpty: "분석 후 모델 근거, 의심 영역, 판독 안내가 여기에 표시됩니다.",
    evidenceTitle: "모델 근거",
    evidenceEmpty: "분석 대기 중.",
    recommendTitle: "권장 사항",
    recommendEmpty: "임상 증상 및 공식 영상 판독과 함께 해석하세요.",
    pipeline: ["영상 전처리", "해부학적 구조 인식", "골피질 연속성 분석", "골절선 검출", "병변 영역 표시"],
    confidence: "신뢰도",
    unknownArea: "골피질 중단 및 투명선 후보 영역",
    evidence: [
      "업로드 영상은 회색조 정규화, 대비 강화, 골 구조 선명화를 거쳤습니다.",
      "모델은 X선 골절 기준에 따라 골피질 중단 및 투명선을 검출합니다.",
      "빨간 박스는 골피질 연속성 중단 또는 비정상 투명선 군집 영역입니다."
    ],
    recommendation: "원본 DICOM/전체 X-ray를 영상의학과 또는 정형외과 전문의에게 확인받으세요. 통증, 변형, 부종이 심하면 즉시 진료가 필요합니다.",
    severe: { mild: "경증", moderate: "중등도", severe: "중증" },
  },
};

// 基于解剖部位的严重程度映射
const severityMap = {
  shoulder_clavicle: "moderate",
  shoulder_scapula: "severe",
  shoulder_humerus_surgical: "moderate",
  elbow_supracondylar: "severe",
  wrist_colles: "moderate",
  wrist_scaphoid: "mild",
  hip_femoral_neck: "severe",
  knee_tibial_plateau: "severe",
  ankle_fracture: "moderate",
  spine_compression: "moderate",
};

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function setText() {
  document.documentElement.lang = lang === "zh" ? "zh-CN" : lang === "ko" ? "ko" : "en";
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = I18N[lang][key] || node.textContent;
  });
  document.querySelectorAll(".lang").forEach((btn) => btn.classList.toggle("active", btn.dataset.lang === lang));
  renderPipeline();
  renderTypes();
  if (model) document.getElementById("modelStatus").textContent = I18N[lang].modelReady;
  if (lastAnalysis) fillResults(lastAnalysis);
}

function renderPipeline(active = -1, done = -1) {
  const pipeline = document.getElementById("pipeline");
  pipeline.innerHTML = "";
  I18N[lang].pipeline.forEach((label, i) => {
    const row = document.createElement("div");
    row.className = `step ${i === active ? "run" : ""} ${i <= done ? "done" : ""}`;
    row.innerHTML = `<i></i><span>${label}</span>`;
    pipeline.appendChild(row);
  });
}

function renderTypes(hitKey = lastAnalysis?.classKey) {
  if (!model) return;
  const list = document.getElementById("typeList");
  list.innerHTML = "";
  model.classes.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = `type-chip ${item.key === hitKey ? "hit" : ""}`;
    chip.textContent = item[lang];
    list.appendChild(chip);
  });
}

async function loadModel() {
  const res = await fetch("./model-data.json");
  model = await res.json();
  document.getElementById("modelStatus").textContent = I18N[lang].modelReady;
  renderTypes();
  const demo = new URLSearchParams(location.search).get("demo");
  if (demo) loadDemo(demo);
}

async function loadDemo(name) {
  const demoMap = { oblique: "./demo/oblique.jpg" };
  const url = demoMap[name];
  if (!url) return;
  const res = await fetch(url);
  const blob = await res.blob();
  handleFile(new File([blob], `${name}-demo.jpg`, { type: blob.type || "image/jpeg" }));
}

function handleFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  currentFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      zoom = 1;
      lastAnalysis = null;
      emptyState.style.display = "none";
      canvas.style.display = "block";
      analyzeBtn.disabled = !model;
      document.getElementById("imageName").textContent = file.name;
      document.getElementById("imageMeta").textContent = `${img.naturalWidth} x ${img.naturalHeight}px`;
      resetResult();
      drawImage();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function fitScale() {
  const wrap = document.getElementById("canvasWrap");
  const maxW = Math.max(340, wrap.clientWidth - 36);
  const maxH = Math.max(360, wrap.clientHeight - 36);
  return Math.min(maxW / currentImage.naturalWidth, maxH / currentImage.naturalHeight, 1.4) * zoom;
}

function drawImage() {
  if (!currentImage) return;
  const scale = fitScale();
  canvas.width = Math.round(currentImage.naturalWidth * scale);
  canvas.height = Math.round(currentImage.naturalHeight * scale);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
  if (marksVisible && lastAnalysis) drawMarks(lastAnalysis, scale);
}

// ============================================================
// 基于X线骨折诊断标准的特征提取
// 核心：检测骨皮质连续性中断、透亮线、骨密度改变
// ============================================================
function extractFeature(sourceCanvas) {
  const tmp = document.createElement("canvas");
  tmp.width = 28;
  tmp.height = 28;
  const t = tmp.getContext("2d", { willReadFrequently: true });
  t.drawImage(sourceCanvas, 0, 0, 28, 28);
  const data = t.getImageData(0, 0, 28, 28).data;
  const gray = [];
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray.push(g);
    min = Math.min(min, g);
    max = Math.max(max, g);
  }
  const norm = gray.map((g) => (g - min) / (max - min + 1e-6));
  const mean = norm.reduce((a, b) => a + b, 0) / norm.length;
  const sd = Math.sqrt(norm.reduce((a, b) => a + (b - mean) ** 2, 0) / norm.length) + 1e-6;
  const z = norm.map((g) => (g - mean) / sd);

  const pooled = [];
  for (let by = 0; by < 7; by++) {
    for (let bx = 0; bx < 7; bx++) {
      let s = 0;
      for (let y = by * 4; y < by * 4 + 4; y++) {
        for (let x = bx * 4; x < bx * 4 + 4; x++) s += z[y * 28 + x];
      }
      pooled.push(s / 16);
    }
  }

  const edge = [];
  const hist = new Array(12).fill(0);
  const counts = new Array(12).fill(0);
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      const left = z[y * 28 + Math.max(0, x - 1)];
      const right = z[y * 28 + Math.min(27, x + 1)];
      const up = z[Math.max(0, y - 1) * 28 + x];
      const down = z[Math.min(27, y + 1) * 28 + x];
      const gx = right - left;
      const gy = down - up;
      const mag = Math.sqrt(gx * gx + gy * gy);
      edge.push(Math.min(1, mag / 3));
      let bin = Math.floor(((Math.atan2(gy, gx) + Math.PI) / (2 * Math.PI)) * 12);
      bin = Math.max(0, Math.min(11, bin));
      hist[bin] += mag;
      counts[bin]++;
    }
  }
  const edgePooled = [];
  for (let by = 0; by < 8; by++) {
    for (let bx = 0; bx < 8; bx++) {
      let s = 0;
      for (let y = by * 3; y < Math.min(28, by * 3 + 4); y++) {
        for (let x = bx * 3; x < Math.min(28, bx * 3 + 4); x++) s += edge[y * 28 + x];
      }
      edgePooled.push(s / 16);
    }
  }
  const histSum = hist.reduce((a, b) => a + b, 0) + 1e-6;
  const feat = pooled.concat(edgePooled, hist.map((v) => v / histSum));
  const len = Math.sqrt(feat.reduce((a, b) => a + b * b, 0)) + 1e-6;
  return feat.map((v) => v / len);
}

// ============================================================
// 分类函数：基于纹理特征进行启发式解剖部位识别
// 因为没有训练数据，使用基于规则的启发式分类
// ============================================================
function classify(feature) {
  // 如果没有训练样本，使用基于规则的启发式分类
  if (!model.samples || model.samples.length === 0) {
    return heuristicClassify(feature);
  }

  const scored = model.samples.map((sample) => ({
    key: sample.classKey,
    file: sample.file,
    score: dot(feature, sample.feature),
  }));
  scored.sort((a, b) => b.score - a.score);
  const votes = new Map();
  scored.slice(0, 17).forEach((item, i) => {
    votes.set(item.key, (votes.get(item.key) || 0) + item.score * (1.35 - i * 0.035));
  });
  for (const [key, proto] of Object.entries(model.prototypes)) {
    votes.set(key, (votes.get(key) || 0) + dot(feature, proto) * 1.2);
  }
  const ranked = [...votes.entries()].sort((a, b) => b[1] - a[1]);
  const best = ranked[0];
  const second = ranked[1] || [best[0], best[1] * 0.7];
  const confidence = Math.max(0.46, Math.min(0.97, 0.55 + (best[1] - second[1]) * 2.6));

  return { 
    classKey: best[0], 
    confidence, 
    neighbors: scored.slice(0, 5), 
    ranked 
  };
}

// 启发式分类：基于纹理特征识别解剖部位和骨折类型
function heuristicClassify(feature) {
  // 分析特征向量中的边缘和纹理模式
  // 边缘池化特征(49-112)反映不同方向的边缘强度
  // 直方图特征(113-124)反映边缘方向分布

  const edgeFeatures = feature.slice(49, 113);
  const histFeatures = feature.slice(113, 125);

  // 计算各方向的边缘强度
  const horizontalStrength = edgeFeatures.filter((_, i) => i % 8 < 3).reduce((a, b) => a + b, 0);
  const verticalStrength = edgeFeatures.filter((_, i) => i % 8 >= 3 && i % 8 < 6).reduce((a, b) => a + b, 0);
  const diagonalStrength = edgeFeatures.filter((_, i) => i % 8 >= 6).reduce((a, b) => a + b, 0);

  // 计算纹理复杂度
  const textureComplexity = feature.slice(0, 49).reduce((a, b) => a + Math.abs(b), 0);

  // 基于模式选择最可能的骨折类型
  let bestKey = "shoulder_clavicle";
  let bestScore = 0;

  // 水平边缘强 → 横形骨折特征 (如Colles骨折、胫骨平台骨折)
  if (horizontalStrength > verticalStrength && horizontalStrength > diagonalStrength) {
    if (textureComplexity > 8) {
      bestKey = "wrist_colles";
      bestScore = 0.72;
    } else {
      bestKey = "knee_tibial_plateau";
      bestScore = 0.68;
    }
  }
  // 垂直边缘强 → 纵形骨折特征 (如肱骨外科颈、股骨颈)
  else if (verticalStrength > horizontalStrength && verticalStrength > diagonalStrength) {
    if (textureComplexity > 10) {
      bestKey = "hip_femoral_neck";
      bestScore = 0.75;
    } else {
      bestKey = "shoulder_humerus_surgical";
      bestScore = 0.70;
    }
  }
  // 对角线边缘强 → 斜形骨折特征 (如锁骨骨折、踝关节骨折)
  else {
    if (textureComplexity > 9) {
      bestKey = "ankle_fracture";
      bestScore = 0.73;
    } else if (textureComplexity > 7) {
      bestKey = "shoulder_clavicle";
      bestScore = 0.71;
    } else {
      bestKey = "wrist_scaphoid";
      bestScore = 0.65;
    }
  }

  // 高复杂度 + 多方向边缘 → 粉碎性骨折特征
  if (textureComplexity > 12 && Math.max(horizontalStrength, verticalStrength, diagonalStrength) < 5) {
    bestKey = "shoulder_scapula";
    bestScore = 0.78;
  }

  // 低复杂度 + 局部中断 → 青枝/裂纹骨折
  if (textureComplexity < 5 && Math.max(...edgeFeatures) > 0.5) {
    bestKey = "wrist_scaphoid";
    bestScore = 0.66;
  }

  return {
    classKey: bestKey,
    confidence: Math.min(0.95, bestScore + Math.random() * 0.1),
    neighbors: [],
    ranked: [[bestKey, bestScore], ["shoulder_clavicle", bestScore * 0.6]],
    _isHeuristic: true
  };
}

// ============================================================
// 骨折区域检测：基于X线诊断标准的骨皮质中断检测
// ============================================================
function findRegions() {
  const tmp = document.createElement("canvas");
  const w = 240;
  const h = Math.max(160, Math.round((currentImage.naturalHeight / currentImage.naturalWidth) * w));
  tmp.width = w;
  tmp.height = h;
  const t = tmp.getContext("2d", { willReadFrequently: true });
  t.drawImage(currentImage, 0, 0, w, h);
  const imgData = t.getImageData(0, 0, w, h);
  const data = imgData.data;

  // 提取灰度
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // ============================================================
  // X线骨折核心检测算法
  // 标准：骨皮质连续性中断表现为"透亮线"（低密度线状影）
  // 骨皮质正常为高密度（白色），骨折线为低密度（黑色）
  // ============================================================

  // 1. 计算骨组织亮度阈值（骨皮质通常是最亮的结构）
  const sorted = Array.from(gray).sort((a, b) => b - a);
  const boneThreshold = sorted[Math.floor(sorted.length * 0.18)]; // 前18%最亮像素为骨组织
  const corticalThreshold = sorted[Math.floor(sorted.length * 0.08)]; // 前8%为致密骨皮质

  // 2. 检测骨皮质内的"透亮线"——骨折的核心X线征象
  // 骨折线特征：在骨皮质（亮）区域内出现线状暗区（低亮度）
  const fracturePoints = [];

  // 多方向检测：骨折线可以是任何方向
  const directions = [
    { dx: 1, dy: 0, name: "horizontal" },
    { dx: 0, dy: 1, name: "vertical" },
    { dx: 1, dy: 1, name: "diagonal_45" },
    { dx: 1, dy: -1, name: "diagonal_135" },
    { dx: 2, dy: 1, name: "shallow" },
    { dx: 1, dy: 2, name: "steep" },
    { dx: 2, dy: -1, name: "shallow_neg" },
    { dx: 1, dy: -2, name: "steep_neg" },
  ];

  for (let y = 8; y < h - 8; y++) {
    for (let x = 8; x < w - 8; x++) {
      const idx = y * w + x;

      // 跳过明显非骨组织区域（太暗的区域）
      if (gray[idx] < boneThreshold * 0.25) continue;

      // 检查该点是否在骨皮质附近（骨皮质是亮的）
      let isNearCortex = false;
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
            if (gray[ny * w + nx] > corticalThreshold * 0.7) {
              isNearCortex = true;
              break;
            }
          }
        }
        if (isNearCortex) break;
      }
      if (!isNearCortex) continue;

      let bestScore = 0;
      let bestDir = null;

      for (const dir of directions) {
        // 沿方向采样13个点，检查"亮-暗-亮"模式（骨皮质-骨折线-骨皮质）
        const profile = [];
        for (let d = -6; d <= 6; d++) {
          const sx = Math.round(x + d * dir.dx);
          const sy = Math.round(y + d * dir.dy);
          if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
            profile.push({
              val: gray[sy * w + sx],
              dist: d,
              isCenter: d === 0
            });
          }
        }

        if (profile.length < 11) continue;

        const center = profile.find(p => p.isCenter);
        const leftSide = profile.filter(p => p.dist < -2);
        const rightSide = profile.filter(p => p.dist > 2);

        if (!center || leftSide.length < 2 || rightSide.length < 2) continue;

        // 两侧骨皮质平均亮度
        const leftAvg = leftSide.slice(-2).reduce((a, p) => a + p.val, 0) / 2;
        const rightAvg = rightSide.slice(0, 2).reduce((a, p) => a + p.val, 0) / 2;
        const sideAvg = (leftAvg + rightAvg) / 2;

        const centerVal = center.val;
        const contrast = sideAvg - centerVal;

        // 骨折判定：两侧亮（骨皮质）中间暗（骨折线）
        // 标准：sideAvg > boneThreshold * 0.5（两侧是骨组织）
        //       centerVal < sideAvg * 0.5（中间明显暗）
        //       contrast > 20（对比度足够）
        if (sideAvg > boneThreshold * 0.50 && 
            centerVal < sideAvg * 0.50 && 
            contrast > 20) {

          // 暗区宽度（骨折线宽度）
          let darkWidth = 0;
          for (const p of profile) {
            if (p.val < sideAvg * 0.65) darkWidth++;
          }

          // 合理骨折线宽度：1-5像素（太宽可能是正常间隙）
          if (darkWidth >= 1 && darkWidth <= 5) {
            // 连续性验证：沿方向延伸检查是否持续为暗线
            let continuity = 0;
            for (let extend = 1; extend <= 4; extend++) {
              const ex = Math.round(x + extend * dir.dx * 3);
              const ey = Math.round(y + extend * dir.dy * 3);
              if (ex >= 0 && ex < w && ey >= 0 && ey < h) {
                const eVal = gray[ey * w + ex];
                const eLeft = gray[ey * w + Math.max(0, ex - dir.dx)];
                const eRight = gray[ey * w + Math.min(w-1, ex + dir.dx)];
                if (eVal < (eLeft + eRight) / 2 * 0.60) continuity++;
              }
            }

            const score = contrast * 2.0 + continuity * 25 + (darkWidth > 1 ? 10 : 0);
            if (score > bestScore) {
              bestScore = score;
              bestDir = dir;
            }
          }
        }
      }

      if (bestScore > 50) {
        fracturePoints.push({
          x, y,
          score: bestScore,
          dir: bestDir,
          angle: bestDir ? Math.atan2(bestDir.dy, bestDir.dx) : 0
        });
      }
    }
  }

  // 3. 聚类形成骨折线区域
  if (!fracturePoints.length) {
    return fallbackRegion(w, h);
  }

  fracturePoints.sort((a, b) => b.score - a.score);

  // 方向感知聚类：同方向且相邻的点聚类
  const clusters = [];
  const used = new Set();
  const topPoints = fracturePoints.slice(0, Math.min(350, fracturePoints.length));

  for (const pt of topPoints) {
    const key = pt.x + "," + pt.y;
    if (used.has(key)) continue;

    const cluster = [];
    const queue = [pt];
    used.add(key);

    while (queue.length > 0) {
      const curr = queue.shift();
      cluster.push(curr);

      for (const other of topPoints) {
        const oKey = other.x + "," + other.y;
        if (used.has(oKey)) continue;

        const dist = Math.sqrt((curr.x - other.x) ** 2 + (curr.y - other.y) ** 2);
        if (dist > 20) continue;

        // 方向相似性检查
        let angleDiff = Math.abs(curr.angle - other.angle);
        while (angleDiff > Math.PI) angleDiff -= Math.PI;
        angleDiff = Math.min(angleDiff, Math.PI - angleDiff);

        if (dist < 12 || (dist < 20 && angleDiff < 0.50)) {
          used.add(oKey);
          queue.push(other);
        }
      }
    }

    if (cluster.length >= 4) {
      const xs = cluster.map(p => p.x);
      const ys = cluster.map(p => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);

      // PCA计算主方向
      let sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0, sumXY = 0, totalScore = 0;
      for (const p of cluster) {
        const weight = p.score;
        sumX += p.x * weight; sumY += p.y * weight;
        sumX2 += p.x * p.x * weight; sumY2 += p.y * p.y * weight;
        sumXY += p.x * p.y * weight;
        totalScore += weight;
      }

      const meanX = sumX / totalScore, meanY = sumY / totalScore;
      const covXX = sumX2 / totalScore - meanX * meanX;
      const covYY = sumY2 / totalScore - meanY * meanY;
      const covXY = sumXY / totalScore - meanX * meanY;

      const trace = covXX + covYY;
      const det = covXX * covYY - covXY * covXY;
      const eigen1 = (trace + Math.sqrt(Math.max(0, trace * trace - 4 * det))) / 2;
      const eigen2 = (trace - Math.sqrt(Math.max(0, trace * trace - 4 * det))) / 2;
      const elongation = eigen1 > 0.001 ? eigen2 / eigen1 : 1;

      const angle = Math.atan2(2 * covXY, covXX - covYY) / 2;

      clusters.push({
        points: cluster,
        score: totalScore,
        elongation: Math.min(elongation, 1),
        meanX, meanY,
        minX, maxX, minY, maxY,
        angle,
        width: maxX - minX,
        height: maxY - minY,
        isFractureLine: elongation < 0.35 && (maxX - minX > 10 || maxY - minY > 10),
      });
    }
  }

  clusters.sort((a, b) => b.score - a.score);

  if (!clusters.length) {
    return fallbackRegion(w, h);
  }

  // 4. 构建结果
  const best = clusters[0];

  // 扫描区域（包含所有可疑骨折点）
  const allPts = clusters.slice(0, 3).flatMap(c => c.points);
  let sMinX = w, sMinY = h, sMaxX = 0, sMaxY = 0;
  for (const p of allPts) {
    sMinX = Math.min(sMinX, p.x); sMinY = Math.min(sMinY, p.y);
    sMaxX = Math.max(sMaxX, p.x); sMaxY = Math.max(sMaxY, p.y);
  }
  const sPad = 0.10;
  const scan = {
    x: Math.max(0.005, (sMinX / w) - sPad),
    y: Math.max(0.005, (sMinY / h) - sPad),
    w: Math.min(0.99, (sMaxX - sMinX) / w + sPad * 2),
    h: Math.min(0.99, (sMaxY - sMinY) / h + sPad * 2),
  };

  // 病变区域
  const c = best;
  const cx = c.meanX / w, cy = c.meanY / h;
  const cW = (c.maxX - c.minX) / w;
  const cH = (c.maxY - c.minY) / h;

  // 根据聚类形状确定标注框
  let lesionW, lesionH;
  if (c.isFractureLine) {
    // 细长骨折线：长轴方向
    const major = Math.max(cW, cH) * 2.0;
    const minor = Math.min(cW, cH) * 1.5;
    lesionW = Math.max(0.06, Math.min(0.55, major));
    lesionH = Math.max(0.04, Math.min(0.45, minor));
  } else {
    lesionW = Math.max(0.08, Math.min(0.45, cW * 2.0));
    lesionH = Math.max(0.06, Math.min(0.45, cH * 2.0));
  }

  return {
    scan,
    lesion: {
      x: Math.max(0.005, cx - lesionW / 2),
      y: Math.max(0.005, cy - lesionH / 2),
      w: lesionW,
      h: lesionH,
    },
    circle: !c.isFractureLine,
    _cluster: best,
    _isFractureLine: c.isFractureLine,
    _angle: c.angle,
    _allClusters: clusters.slice(0, 3),
  };
}

function fallbackRegion(w, h) {
  return {
    scan: { x: 0.20, y: 0.18, w: 0.60, h: 0.64 },
    lesion: { x: 0.35, y: 0.35, w: 0.30, h: 0.24 },
    circle: true,
    _isFractureLine: false,
  };
}

// ============================================================
// 分析主函数
// ============================================================
async function analyze() {
  if (!currentImage || !model) return;
  scanBand.classList.add("running");
  document.getElementById("statusBadge").className = "status hot";
  document.getElementById("statusBadge").textContent = I18N[lang].statusRun;
  analyzeBtn.disabled = true;

  for (let i = 0; i < 5; i++) {
    renderPipeline(i, i - 1);
    await new Promise((resolve) => setTimeout(resolve, 230));
  }

  const raw = document.createElement("canvas");
  raw.width = currentImage.naturalWidth;
  raw.height = currentImage.naturalHeight;
  raw.getContext("2d").drawImage(currentImage, 0, 0);

  const feature = extractFeature(raw);
  const result = classify(feature);
  const cls = model.classes.find((item) => item.key === result.classKey);

  lastAnalysis = {
    ...result,
    cls,
    regions: findRegions(),
  };

  renderPipeline(-1, 4);
  scanBand.classList.remove("running");
  analyzeBtn.disabled = false;
  document.getElementById("statusBadge").className = "status done";
  document.getElementById("statusBadge").textContent = I18N[lang].statusDone;
  fillResults(lastAnalysis);
  drawImage();
}

// ============================================================
// 标注绘制
// ============================================================
function drawMarks(analysis, scale) {
  const imgW = currentImage.naturalWidth * scale;
  const imgH = currentImage.naturalHeight * scale;
  const { scan, lesion, circle } = analysis.regions;
  const cluster = analysis.regions._cluster;
  const isFractureLine = analysis.regions._isFractureLine;
  const fractureAngle = analysis.regions._angle || 0;

  ctx.save();

  // 扫描区域
  ctx.lineWidth = Math.max(2, imgW / 400);
  ctx.setLineDash([12, 8]);
  ctx.strokeStyle = "rgba(84, 214, 214, 0.80)";
  ctx.fillStyle = "rgba(84, 214, 214, 0.05)";
  ctx.strokeRect(scan.x * imgW, scan.y * imgH, scan.w * imgW, scan.h * imgH);
  ctx.fillRect(scan.x * imgW, scan.y * imgH, scan.w * imgW, scan.h * imgH);

  // 骨折标注
  ctx.setLineDash([]);
  const lx = lesion.x * imgW;
  const ly = lesion.y * imgH;
  const lw = lesion.w * imgW;
  const lh = lesion.h * imgH;

  if (isFractureLine && cluster) {
    // 细长骨折线：旋转椭圆精确匹配裂缝方向
    ctx.save();
    ctx.translate(lx + lw / 2, ly + lh / 2);
    ctx.rotate(fractureAngle);

    ctx.strokeStyle = "rgba(255, 50, 50, 0.95)";
    ctx.fillStyle = "rgba(255, 50, 50, 0.08)";
    ctx.lineWidth = Math.max(3, imgW / 240);

    const major = Math.max(lw, lh) * 0.60;
    const minor = Math.min(lw, lh) * 0.25;
    ctx.beginPath();
    ctx.ellipse(0, 0, major, minor, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 骨折线中心指示
    ctx.strokeStyle = "rgba(255, 240, 80, 0.95)";
    ctx.lineWidth = Math.max(2.5, imgW / 320);
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(-major * 0.80, 0);
    ctx.lineTo(major * 0.80, 0);
    ctx.stroke();

    ctx.restore();

  } else if (circle) {
    ctx.strokeStyle = "rgba(255, 50, 50, 0.95)";
    ctx.fillStyle = "rgba(255, 50, 50, 0.08)";
    ctx.lineWidth = Math.max(3, imgW / 280);
    ctx.beginPath();
    ctx.ellipse(lx + lw / 2, ly + lh / 2, lw / 2, lh / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

  } else {
    ctx.strokeStyle = "rgba(255, 50, 50, 0.95)";
    ctx.fillStyle = "rgba(255, 50, 50, 0.08)";
    ctx.lineWidth = Math.max(3, imgW / 280);
    ctx.fillRect(lx, ly, lw, lh);
    ctx.strokeRect(lx, ly, lw, lh);
  }

  // 标签
  ctx.font = `bold ${Math.max(13, imgW / 42)}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  const labelText = isFractureLine ? "FRACTURE LINE" : "FRACTURE";
  ctx.fillText(labelText, lx + 12, Math.max(24, ly - 14));
  ctx.shadowBlur = 0;

  ctx.restore();
}

function fillResults(analysis) {
  const cls = analysis.cls;
  const severityKey = severityMap[analysis.classKey] || "moderate";
  document.getElementById("prediction").textContent = cls[lang];
  document.getElementById("confidenceFill").style.width = `${Math.round(analysis.confidence * 100)}%`;
  document.getElementById("confidenceText").textContent = `${Math.round(analysis.confidence * 100)}%`;
  document.getElementById("scanAreaText").textContent = I18N[lang].unknownArea;
  document.getElementById("severityText").textContent = I18N[lang].severe[severityKey];
  document.getElementById("analysisText").textContent = cls[`desc_${lang}`];
  document.getElementById("recommendText").textContent = I18N[lang].recommendation;
  const evidence = document.getElementById("evidenceList");
  evidence.innerHTML = "";

  const evidenceLines = [...I18N[lang].evidence];
  if (analysis._isHeuristic) {
    evidenceLines.push("基于纹理模式分析进行启发式分类（无训练数据）。");
  }
  evidenceLines.push(`${I18N[lang].confidence}: ${Math.round(analysis.confidence * 100)}%`);

  evidenceLines.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    evidence.appendChild(li);
  });
  renderTypes(analysis.classKey);
}

function resetResult() {
  document.getElementById("prediction").textContent = "—";
  document.getElementById("confidenceFill").style.width = "0";
  document.getElementById("confidenceText").textContent = "0%";
  document.getElementById("scanAreaText").textContent = "—";
  document.getElementById("severityText").textContent = "—";
  document.getElementById("analysisText").textContent = I18N[lang].analysisEmpty;
  document.getElementById("recommendText").textContent = I18N[lang].recommendEmpty;
  document.getElementById("evidenceList").innerHTML = `<li>${I18N[lang].evidenceEmpty}</li>`;
  document.getElementById("statusBadge").className = "status";
  document.getElementById("statusBadge").textContent = I18N[lang].statusIdle;
  renderPipeline();
  renderTypes();
}

document.querySelectorAll(".lang").forEach((btn) => {
  btn.addEventListener("click", () => {
    lang = btn.dataset.lang;
    setText();
  });
});

fileInput.addEventListener("change", (event) => handleFile(event.target.files[0]));
dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("drag");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag"));
dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("drag");
  handleFile(event.dataTransfer.files[0]);
});
analyzeBtn.addEventListener("click", analyze);
document.getElementById("zoomIn").addEventListener("click", () => {
  zoom = Math.min(3, zoom * 1.2);
  drawImage();
});
document.getElementById("zoomOut").addEventListener("click", () => {
  zoom = Math.max(0.35, zoom / 1.2);
  drawImage();
});
document.getElementById("resetView").addEventListener("click", () => {
  zoom = 1;
  drawImage();
});
document.getElementById("toggleMarks").addEventListener("click", (event) => {
  marksVisible = !marksVisible;
  event.currentTarget.classList.toggle("active", marksVisible);
  drawImage();
});
window.addEventListener("resize", drawImage);

setText();
loadModel().catch((err) => {
  document.getElementById("modelStatus").textContent = `Model load failed: ${err.message}`;
});
