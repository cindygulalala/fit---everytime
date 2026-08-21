/* 健身动作库 + 训练方案生成器 (纯前端, 数据来自 exercises.data.js) */
(function () {
  "use strict";

  const LANGS = ["zh", "en", "es", "it", "tr", "ru", "hi", "pl", "ko", "fr"];
  const LANG_LABEL = { zh: "中文", en: "English", es: "Español", it: "Italiano", tr: "Türkçe", ru: "Русский", hi: "हिन्दी", pl: "Polski", ko: "한국어", fr: "Français" };

  const BP_LABEL = { back: "背", cardio: "有氧", chest: "胸", glutes: "臀", "lower arms": "前臂", "lower legs": "小腿", neck: "颈", shoulders: "肩", "upper arms": "上臂", "upper legs": "大腿", waist: "腰/核心" };
  const EQUIP_LABEL = { "body weight": "自重", "dumbbell": "哑铃", "barbell": "杠铃", "cable": "绳索", "leverage machine": "器械", "kettlebell": "壶铃", "exercise ball": "健身球", "e-z bar": "EZ杆", "foam roll": "泡沫轴", "band": "弹力带", "trap bar": "六角杠", "medicine ball": "药球", "roller": "滚筒", "other": "其他", "none": "无" };
  const EQUIP_MAP = { "自重": "body weight", "哑铃": "dumbbell", "杠铃": "barbell", "绳索": "cable", "器械": "leverage machine", "弹力带": "band", "均可": null };

  const FOCUS_GROUPS = [
    { key: "chest", label: "胸" }, { key: "back", label: "背" },
    { key: "upper legs", label: "大腿" }, { key: "glutes", label: "臀" },
    { key: "lower legs", label: "小腿" },
    { key: "shoulders", label: "肩" }, { key: "upper arms", label: "上臂" },
    { key: "lower arms", label: "前臂" }, { key: "waist", label: "核心/腰" },
    { key: "cardio", label: "有氧" }, { key: "neck", label: "颈" }
  ];

  const GOAL_LABEL = { hypertrophy: "增肌", fatloss: "减脂", strength: "力量", tone: "塑形", rehab: "康复", general: "维持健康" };
  const LEVEL_LABEL = { "新手": "新手", "初级": "初级", "中级": "中级", "高级": "高级" };

  const SETREP = {
    hypertrophy: { sets: "3-4", reps: "8-12", rest: "60-90 秒" },
    strength: { sets: "4-5", reps: "3-6", rest: "2-3 分钟" },
    fatloss: { sets: "3", reps: "12-15", rest: "30-45 秒" },
    tone: { sets: "3", reps: "12-15", rest: "45-60 秒" },
    rehab: { sets: "2-3", reps: "10-12", rest: "60 秒(低强度)" },
    general: { sets: "3", reps: "10", rest: "60 秒" }
  };

  // 今日单次：状态 → 训练量调整
  const ENERGY_CONFIG = {
    "充沛": { setsNote: "可在标准组数基础上多加 1 组，适当冲击大重量。", label: "💪 充沛" },
    "正常": { setsNote: "", label: "😊 正常" },
    "有限": { setsNote: "以轻重量、慢节奏为主，不要力竭，专注感受肌肉。", label: "😴 有限" }
  };

  // 时长 → 主训练动作数
  const TIME_TO_EX = { 30: 4, 45: 6, 60: 8, 90: 10 };

  // 热身动作（按部位）
  const WARMUP = {
    chest:        ["弹力带扩胸 × 20", "肩绕环（前后各 10 圈）", "俯卧撑热身 × 10（轻松节奏）"],
    back:         ["猫牛式 × 10", "肩胛骨内收外展 × 20", "空拉（模拟引体轨迹，无重量）× 15"],
    "upper legs": ["动态腿摆动（前后/侧向各 15 次）", "空气深蹲 × 20", "踏步高抬腿 × 30"],
    glutes:       ["臀桥（无重量）× 20", "蚌式开合 × 15（每侧）", "髋绕环（每侧 10 圈）"],
    shoulders:    ["肩绕环 × 20（前后各 10）", "面拉（弹力带/轻绳索）× 15", "侧平举热身（极轻）× 12"],
    "upper arms": ["腕绕环 × 20", "轻重量弯举热身 × 15", "三头绳下压热身（极轻）× 15"],
    "lower legs": ["踮脚尖站立 × 20", "脚踝绕环（每侧 10 圈）", "小腿拉伸（靠墙）30 秒 × 2"],
    "lower arms": ["腕绕环（正反各 10）", "轻量腕弯举 × 15", "手指张开握紧 × 20"],
    waist:        ["腹式深呼吸 × 10", "死虫式 × 10（每侧）", "鸟狗式 × 10（每侧）"],
    cardio:       ["原地高抬腿 1 分钟", "开合跳 1 分钟", "手臂绕环放松 30 秒"],
    neck:         ["颈部前后侧伸展（各 15 秒）", "颈部缓慢绕环（每方向 5 圈）"]
  };

  // 放松拉伸（按部位）
  const COOLDOWN = {
    chest:        ["门框胸展：手扶门框身体前倾，每侧 30 秒", "交叉手臂肩前拉伸 30 秒"],
    back:         ["婴儿式 60 秒", "坐姿体前屈 30 秒 × 2", "下犬式 30 秒"],
    "upper legs": ["股四头肌站立拉伸（每侧 30 秒）", "腘绳肌坐姿拉伸 30 秒", "鸽子式（每侧 40 秒）"],
    glutes:       ["鸽子式（每侧 45 秒）", "仰卧 4 字拉伸（每侧 30 秒）", "梨状肌仰卧拉伸 30 秒"],
    shoulders:    ["手臂横跨胸前拉伸（每侧 30 秒）", "肩后侧伸展 30 秒", "颈肩侧拉伸 20 秒"],
    "upper arms": ["三头肌过头拉伸（每侧 30 秒）", "肱二头肌墙壁拉伸 30 秒"],
    "lower legs": ["小腿站立拉伸（每侧 30 秒）", "足底筋膜滚压 1 分钟"],
    "lower arms": ["腕部正反拉伸（各 20 秒）", "手指伸展抖动 × 10"],
    waist:        ["猫牛式 × 10", "侧卧脊柱扭转（每侧 30 秒）", "眼镜蛇式 30 秒"],
    cardio:       ["慢走放松 3 分钟", "下肢主要肌群静态拉伸各 30 秒"],
    neck:         ["颈部各方向静态拉伸（各 20 秒）"]
  };

  // 生理周期阶段及对应训练调整
  const CYCLE_PHASES = {
    menstrual: {
      name: "月经期", days: "第 1–5 天", emoji: "🔴",
      note: "雌激素和孕激素均处于低点，体力偏弱，可能有腹部不适。建议以轻量训练为主，避免大重量和腹部高负荷动作。",
      altSuggestion: "如有痛经，可改为瑜伽或温和拉伸",
      srOverride: { sets: "2", reps: "12-15", rest: "60-90 秒（轻量）" },
      excludeMuscles: ["core"],   // 避开腹部
      capEnergy: true,            // 即使用户选"充沛"也不提升强度
    },
    follicular: {
      name: "卵泡期", days: "第 6–13 天", emoji: "🟡",
      note: "雌激素持续上升，体力和力量逐渐恢复提升，是渐进超负荷、增加训练量的好时机。",
      altSuggestion: null,
      srOverride: null,
      excludeMuscles: [],
      capEnergy: false,
    },
    ovulatory: {
      name: "排卵期", days: "第 14–16 天", emoji: "🟢",
      note: "雌激素达到峰值，体力、协调性与力量均处于最优状态，适合高强度力量训练。注意：此期关节韧带略有松弛，大重量动作需更专注稳定性。",
      altSuggestion: "可适当挑战个人最大重量记录",
      srOverride: null,
      excludeMuscles: [],
      capEnergy: false,
    },
    luteal: {
      name: "黄体期", days: "第 17–28 天", emoji: "🟠",
      note: "孕激素升高，体温偏高，容易感到疲劳和水肿，建议维持中等强度训练，有氧耐力表现相对较好，避免力竭冲击。",
      altSuggestion: "感到明显疲劳时可适当减少 1-2 组",
      srOverride: null,
      excludeMuscles: [],
      capEnergy: false,
    },
  };

  // 根据上次月经日期推算当前周期阶段（默认 28 天周期）
  function calcCyclePhaseFromDate(dateStr) {
    if (!dateStr) return null;
    const last = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - last) / 86400000);
    if (diffDays < 0 || diffDays > 90) return null;  // 日期不合理
    const cycleDay = (diffDays % 28) + 1;
    let phase;
    if (cycleDay <= 5) phase = "menstrual";
    else if (cycleDay <= 13) phase = "follicular";
    else if (cycleDay <= 16) phase = "ovulatory";
    else phase = "luteal";
    return { phase, cycleDay };
  }

  // 自动推荐部位组合（当用户未选择时）
  const AUTO_FOCUS_COMBOS = [
    ["chest", "upper arms"],
    ["back", "upper arms"],
    ["upper legs", "glutes"],
    ["shoulders", "chest"],
    ["back", "waist"],
    ["glutes", "lower legs"],
  ];

  /* ============================================================
     训练逻辑规格实现（training_plan_logic_1.md）
  ============================================================ */

  // 肌群定义（含目标优先权，数字越大越优先）
  const MUSCLE_GROUPS = [
    { key: "chest",     label: "胸",     zone: "upper", prio: { hypertrophy:3, strength:3, fatloss:2, tone:2, rehab:1, general:2 } },
    { key: "back",      label: "背",     zone: "upper", prio: { hypertrophy:3, strength:3, fatloss:2, tone:2, rehab:1, general:2 } },
    { key: "shoulder",  label: "肩",     zone: "upper", prio: { hypertrophy:2, strength:2, fatloss:2, tone:3, rehab:1, general:2 } },
    { key: "bicep",     label: "二头",   zone: "upper", prio: { hypertrophy:2, strength:1, fatloss:1, tone:2, rehab:1, general:1 } },
    { key: "tricep",    label: "三头",   zone: "upper", prio: { hypertrophy:2, strength:1, fatloss:1, tone:2, rehab:1, general:1 } },
    { key: "quad",      label: "股四头", zone: "lower", prio: { hypertrophy:3, strength:3, fatloss:3, tone:3, rehab:2, general:3 } },
    { key: "hamstring", label: "腘绳肌", zone: "lower", prio: { hypertrophy:2, strength:2, fatloss:2, tone:2, rehab:2, general:2 } },
    { key: "glute",     label: "臀",     zone: "lower", prio: { hypertrophy:3, strength:2, fatloss:3, tone:3, rehab:2, general:3 } },
    { key: "calf",      label: "小腿",   zone: "lower", prio: { hypertrophy:1, strength:1, fatloss:2, tone:2, rehab:1, general:1 } },
    { key: "core",      label: "核心",   zone: "core",  prio: { hypertrophy:1, strength:2, fatloss:3, tone:3, rehab:3, general:2 } },
  ];

  // 将肌群 key 映射回 WARMUP / COOLDOWN 所用的 body_part key
  const MUSCLE_TO_BP = {
    chest: "chest", back: "back", shoulder: "shoulders",
    bicep: "upper arms", tricep: "upper arms",
    quad: "upper legs", hamstring: "upper legs", glute: "glutes",
    calf: "lower legs", core: "waist"
  };

  // 按肌群 key 过滤动作（使用已有 ePart() 函数）
  const MUSCLE_EX_FILTER = {
    chest:     (e) => ePart(e) === "chest",
    back:      (e) => ePart(e) === "back",
    shoulder:  (e) => ePart(e) === "shoulders",
    bicep:     (e) => ePart(e) === "upper arms" && !(e.target || "").toLowerCase().includes("tricep"),
    tricep:    (e) => ePart(e) === "upper arms" && (e.target || "").toLowerCase().includes("tricep"),
    quad:      (e) => ePart(e) === "upper legs" && !(e.target || "").toLowerCase().includes("hamstring"),
    hamstring: (e) => ePart(e) === "upper legs" && (e.target || "").toLowerCase().includes("hamstring"),
    glute:     (e) => ePart(e) === "glutes",
    calf:      (e) => ePart(e) === "lower legs",
    core:      (e) => ePart(e) === "waist",
  };

  // 训练分化模板
  const SPLIT_TEMPLATES = {
    full_body: {
      label: "Full Body 全身训练",
      focuses: ["全身（上肢 + 下肢 + 核心）", "全身（上肢 + 下肢 + 核心）", "全身（上肢 + 下肢 + 核心）"],
      muscles: [
        ["chest", "back", "shoulder", "quad", "glute", "core"],
        ["chest", "back", "shoulder", "quad", "hamstring", "core"],
        ["chest", "back", "shoulder", "glute", "hamstring", "core"],
      ],
    },
    upper_lower: {
      label: "上下肢分化（Upper / Lower）",
      focuses: ["上肢（胸/背/肩/手臂）", "下肢（腿/臀/核心）", "上肢（胸/背/肩/手臂）", "下肢（腿/臀/核心）"],
      muscles: [
        ["chest", "back", "shoulder", "bicep", "tricep"],
        ["quad", "hamstring", "glute", "calf", "core"],
        ["chest", "back", "shoulder", "bicep", "tricep"],
        ["quad", "hamstring", "glute", "calf", "core"],
      ],
    },
    ppl: {
      label: "PPL（推 / 拉 / 腿）",
      focuses: ["推（胸/肩/三头）", "拉（背/二头）", "腿（股四头/腘绳/臀）", "推（胸/肩/三头）", "拉（背/二头）"],
      muscles: [
        ["chest", "shoulder", "tricep"],
        ["back", "bicep"],
        ["quad", "hamstring", "glute", "calf"],
        ["chest", "shoulder", "tricep"],
        ["back", "bicep"],
      ],
    },
  };

  // 按水平 + 目标 + 天数选择分化类型（规格 2.2 Step 1）
  function selectSplit(level, goal, days) {
    const isBeginner = ["新手", "初级"].includes(level);
    const isAdvanced = level === "高级";
    const isBuildGoal = ["hypertrophy", "strength"].includes(goal);

    if (isBeginner || days <= 2) {
      const d = Math.min(days, 3);
      const reason = isBeginner
        ? "新手阶段推荐全身训练（Full Body），每周 2-3 次，有效建立动作模式与基础力量，各肌群均可均衡发展。"
        : "每周训练天数较少，全身训练效率最高，每次覆盖所有主要肌群。";
      return { type: "full_body", days: d, reason };
    }
    if (days === 3) {
      return {
        type: "full_body", days: 3,
        reason: "每周 3 天全身训练兼顾恢复与训练频率，是大多数目标的高效选择。"
      };
    }
    if (isAdvanced || (isBuildGoal && days >= 4)) {
      return {
        type: "ppl", days: Math.min(days, 5),
        reason: "PPL 分化训练让每个肌群每周获得 2 次训练刺激，同时保证充足恢复时间，适合增肌与力量目标。"
      };
    }
    return {
      type: "upper_lower", days: Math.min(days, 4),
      reason: "上下肢分化兼顾训练频次与恢复效率，每次训练量适中，适合中级水平的减脂或综合训练目标。"
    };
  }

  let CUR_LANG = "zh";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- 初始化 ---------- */
  function init() {
    // 语言选择
    const langSel = $("#lang");
    LANGS.forEach((l) => { const o = document.createElement("option"); o.value = l; o.textContent = LANG_LABEL[l]; langSel.appendChild(o); });
    langSel.value = CUR_LANG;
    langSel.addEventListener("change", () => { CUR_LANG = langSel.value; renderResults(currentResults); });

    // 方案语言下拉
    const pLang = $("#p-lang");
    LANGS.forEach((l) => { const o = document.createElement("option"); o.value = l; o.textContent = LANG_LABEL[l]; pLang.appendChild(o); });
    pLang.value = "zh";

    // 部位 / 器械 下拉
    const bps = uniq(EXERCISES.map((e) => e.body_part)).filter(Boolean);
    const eqs = uniq(EXERCISES.map((e) => e.equipment)).filter(Boolean);
    fillSelect($("#f-bp"), bps, (v) => BP_LABEL[v] || v);
    fillSelect($("#f-eq"), eqs, (v) => EQUIP_LABEL[v] || v);

    $("#search-btn").addEventListener("click", runSearch);
    $("#search-input").addEventListener("keydown", (e) => { if (e.key === "Enter") runSearch(); });
    $("#f-bp").addEventListener("change", runSearch);
    $("#f-eq").addEventListener("change", runSearch);

    // 周计划表单
    $("#gen-btn").addEventListener("click", onGenerate);
    $("#print-btn").addEventListener("click", () => window.print());

    // 今日单次：语言下拉
    const sLang = $("#s-lang");
    LANGS.forEach((l) => { const o = document.createElement("option"); o.value = l; o.textContent = LANG_LABEL[l]; sLang.appendChild(o); });
    sLang.value = "zh";

    // 今日单次：肌群恢复状态 grid（每个肌群一个 chip，勾 = 仍在恢复中）
    const recoveryGrid = $("#muscle-recovery-grid");
    MUSCLE_GROUPS.forEach((mg) => {
      const lab = document.createElement("label");
      lab.className = "chip";
      lab.innerHTML = `<input type="checkbox" value="${mg.key}"><span>${mg.label}</span>`;
      recoveryGrid.appendChild(lab);
    });

    // 今日单次：生成 & 打印
    $("#s-gen-btn").addEventListener("click", onGenerateSingle);
    $("#s-print-btn").addEventListener("click", () => window.print());

    // 生理周期：toggle 显示/隐藏面板
    $("#s-use-cycle").addEventListener("change", function () {
      $("#cycle-panel").style.display = this.checked ? "" : "none";
    });

    // 生理周期：日期输入 → 自动推算并选中对应阶段
    $("#s-period-date").addEventListener("change", function () {
      updateCycleCalcDisplay(this.value);
    });

    // 生理周期阶段 chips（单选）
    const cycleChipsBox = $("#cycle-phase-chips");
    ["menstrual", "follicular", "ovulatory", "luteal"].forEach((phase) => {
      const cp = CYCLE_PHASES[phase];
      const lab = document.createElement("label");
      lab.className = "chip";
      lab.innerHTML = `<input type="radio" name="s-cycle-phase" value="${phase}"><span>${cp.emoji} ${cp.name}（${cp.days}）</span>`;
      cycleChipsBox.appendChild(lab);
    });

    // 主 Tab 切换（仅响应有 data-tab 属性的按钮）
    $$(".tab[data-tab]").forEach((t) => t.addEventListener("click", () => switchTab(t.dataset.tab)));

    // 方案子 Tab 切换
    $$(".ptab[data-ptab]").forEach((t) => t.addEventListener("click", () => switchPlanTab(t.dataset.ptab)));

    // 恢复上次资料
    loadProfile();
    loadSingleProfile();
    runSearch();
  }

  function uniq(a) { return Array.from(new Set(a)); }
  function fillSelect(sel, vals, labelFn) {
    vals.forEach((v) => { const o = document.createElement("option"); o.value = v; o.textContent = labelFn(v); sel.appendChild(o); });
  }

  /* ---------- 搜索 ---------- */
  let currentResults = [];
  function runSearch() {
    const q = $("#search-input").value.trim().toLowerCase();
    const bp = $("#f-bp").value;
    const eq = $("#f-eq").value;
    let res = EXERCISES.filter((e) => {
      if (bp && e.body_part !== bp) return false;
      if (eq && e.equipment !== eq) return false;
      if (!q) return true;
      const hay = [e.name, e.body_part, e.equipment, e.target, e.muscle_group, e.instructions[CUR_LANG] || "", e.instructions.en || ""].join(" ").toLowerCase();
      return hay.includes(q);
    });
    if (q) res.sort((a, b) => score(b, q) - score(a, q));
    currentResults = res.slice(0, 80);
    $("#result-count").textContent = `命中 ${res.length} 条，显示前 ${currentResults.length} 条`;
    renderResults(currentResults);
  }
  function score(e, q) {
    let s = 0;
    if ((e.name || "").toLowerCase().includes(q)) s += 10;
    if ((e.target || "").toLowerCase().includes(q)) s += 3;
    if ((e.instructions[CUR_LANG] || "").toLowerCase().includes(q)) s += 2;
    if ((e.body_part || "").includes(q)) s += 1;
    return s;
  }
  function renderResults(list) {
    const box = $("#results");
    box.innerHTML = "";
    list.forEach((e) => {
      const ins = e.instructions[CUR_LANG] || e.instructions.en || "";
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="thumb"><img loading="lazy" src="${esc(e.gif || e.img)}" onerror="this.src='${esc(e.img)}';this.onerror=null;" alt=""></div>
        <div class="card-body">
          <div class="card-title">${esc(e.name)}</div>
          <div class="chips">
            <span class="tag">${esc(BP_LABEL[e.body_part] || e.body_part)}</span>
            <span class="tag">${esc(EQUIP_LABEL[e.equipment] || e.equipment)}</span>
            <span class="tag">主肌:${esc(e.target)}</span>
          </div>
          <div class="preview">${esc(ins.slice(0, 70))}${ins.length > 70 ? "…" : ""}</div>
          <button class="link" data-id="${esc(e.id)}">查看详情 / 学习</button>
        </div>`;
      card.querySelector("button").addEventListener("click", () => openDetail(e));
      box.appendChild(card);
    });
  }

  function openDetail(e) {
    const ins = e.instructions[CUR_LANG] || e.instructions.en || "";
    const steps = (e.steps[CUR_LANG] || e.steps.en || []);
    const sec = (e.secondary || []).join("、");
    $("#modal-gif").src = e.gif || e.img;
    $("#modal-gif").onerror = function () { this.src = e.img; };
    $("#modal-title").textContent = e.name;
    $("#modal-meta").innerHTML = `
      <span class="tag">部位:${esc(BP_LABEL[e.body_part] || e.body_part)}</span>
      <span class="tag">器械:${esc(EQUIP_LABEL[e.equipment] || e.equipment)}</span>
      <span class="tag">目标肌:${esc(e.target)}</span>
      <span class="tag">协同肌:${esc(e.muscle_group)}</span>
      ${sec ? `<span class="tag">次要肌:${esc(sec)}</span>` : ""}`;
    $("#modal-ins").textContent = ins;
    $("#modal-steps").innerHTML = steps.map((s, i) => `<li>${esc(s)}</li>`).join("");
    $("#modal-attr").textContent = e.attr || "";
    $("#modal").classList.add("open");
  }
  function closeModal() { $("#modal").classList.remove("open"); }

  /* ---------- 训练方案生成 ---------- */
  function onGenerate() {
    const p = {
      goal:        $("#p-goal").value,
      level:       $("#p-level").value,
      equipment:   $("#p-equip").value,
      days:        parseInt($("#p-days").value, 10),
      duration:    parseInt($("#p-dur").value, 10),
      weeks:       parseInt($("#p-weeks").value, 10) || 4,
      limitations: $("#p-limit").value || "",
      lang:        $("#p-lang").value
    };
    saveProfile(p);
    const out = buildPlan(p);
    $("#plan-output").innerHTML = out;
    $("#plan-output").classList.add("show");
    $("#plan-output").scrollIntoView({ behavior: "smooth" });
  }

  function applyRisk(text, pool) {
    const notes = [];
    const t = (text || "").toLowerCase();
    // 安全红线：心脏/心血管相关（规格 §5）
    if (/心脏|心血管|高血压|cardiac|heart/i.test(t)) {
      pool = pool.filter((e) => !/deadlift|clean|snatch|press|squat|sprint|hiit|burpee|jump/i.test(e.name));
      notes.push("⚠️ 已识别心脏/心血管风险禁忌，已过滤高强度大重量动作。请在专科医生评估后再开始运动计划。");
    }
    if (/腰|腰椎|间盘|脊椎|disk|back pain|herni/i.test(t)) {
      pool = pool.filter((e) => e.body_part !== "waist" && !/deadlift|good morning|back extension|hyper|sit-up|crunch/i.test(e.name));
      notes.push("已避开高脊柱负荷动作（如硬拉、仰卧起坐）；腰背不适请量力而行并咨询专业人士。");
    }
    if (/膝|knee/i.test(t)) {
      pool = pool.filter((e) => !/jump|box|plyo|lunge|squat|leg press|sprint|burpee/i.test(e.name));
      notes.push("已避开膝部高冲击/深蹲类动作（如跳跃、箭步蹲）；膝不适者注意控制幅度。");
    }
    if (/肩|shoulder/i.test(t)) {
      pool = pool.filter((e) => !/overhead|press|upright row|lateral raise|fly/i.test(e.name));
      notes.push("已减少肩部过顶/外展动作（如推举、侧平举）；肩部有伤请谨慎。");
    }
    return { pool, notes };
  }

  // 臀部动作在 DB 里 body_part="upper legs"，但 target 含 "glute"，需虚拟分类
  function ePart(e) {
    return (e.target || "").toLowerCase().includes("glute") ? "glutes" : e.body_part;
  }

  // 长期计划生成（规格逻辑一）
  function buildPlan(p) {
    const equip = EQUIP_MAP[p.equipment];
    const weeks = p.weeks || 4;
    let days = parseInt(p.days);

    // 安全红线：无休息日（规格 §5）
    const safetyWarnings = [];
    if (days >= 7) {
      safetyWarnings.push("每周训练 7 天无休息日存在过度训练风险，已强制减至 5 天，建议保留至少 2 个休息日。");
      days = 5;
    }

    // Step 1：选择训练分化类型
    const split = selectSplit(p.level, p.goal, days);
    const template = SPLIT_TEMPLATES[split.type];
    const trainDays = split.days;

    // 构建可用动作池（器械过滤 + 伤病风险过滤）
    let pool = EXERCISES.filter((e) => !equip || e.equipment === equip);
    const risk = applyRisk(p.limitations, pool);
    pool = risk.pool;
    safetyWarnings.push(...risk.notes);

    if (!pool.length) return `<p class="warn">没有匹配的动作，请放宽器械条件。</p>`;

    const sr = SETREP[p.goal] || SETREP.general;
    const maxEx = TIME_TO_EX[p.duration] || 6;

    // Step 4：按天填充动作（规格 2.2 Step 4）
    const sessions = template.muscles.slice(0, trainDays).map((muscles, i) => {
      const exPerMuscle = Math.max(1, Math.ceil(maxEx / muscles.length));
      let exs = [];
      muscles.forEach((mkey) => {
        const fn = MUSCLE_EX_FILTER[mkey];
        if (!fn) return;
        const mPool = pool.filter(fn);
        if (!mPool.length) return;
        shuffle(mPool).slice(0, exPerMuscle).forEach((e) => exs.push(e));
      });
      return { focus: template.focuses[i] || "训练", exercises: exs.slice(0, maxEx) };
    });

    return renderPlan(sessions, p, sr, split, template, weeks, safetyWarnings);
  }

  function renderPlan(sessions, p, sr, split, template, weeks, warnings) {
    const goalTxt = GOAL_LABEL[p.goal] || p.goal;

    const warnHtml = warnings.length
      ? `<div class="risk">⚠️ ${warnings.map(esc).join(" ")}<br><span class="disclaim">本方案为通用参考，请遵医嘱 / 专业教练。</span></div>`
      : `<div class="risk disclaim">本方案为通用参考，伤病或特殊情况请遵医嘱 / 专业教练。</div>`;

    // Step 3：进阶逻辑说明（规格 2.2 Step 3）
    const deloadHtml = weeks >= 4
      ? `<li>📉 <b>第 4 周（减量周）</b>：组数降至正常的 60%，重量减轻，专注动作质量和充分恢复。</li>` : "";
    const cycleHtml = weeks > 4
      ? `<li>🔄 第 5 周起以更高基础重量重复上述节奏，每个 4 周循环逐渐进阶。</li>` : "";

    const progressHtml = `
      <div class="section-card" style="margin-bottom:14px">
        <div class="day-h">📈 ${weeks} 周渐进安排</div>
        <ul class="ex-list">
          <li>🟢 <b>第 1 周</b>：基础负荷，RPE 目标 6-7，熟悉动作节奏与感受。</li>
          <li>🔼 <b>第 2-3 周</b>：每周递增——每个动作增加 1 组，或重量增加 2.5-5%。</li>
          ${deloadHtml}${cycleHtml}
        </ul>
      </div>`;

    const daysHtml = sessions.map((s, i) => {
      const rows = s.exercises.map((e, j) => `
        <tr>
          <td class="ex-num">${j + 1}</td>
          <td class="ex-name">${esc(e.name)}</td>
          <td class="ex-vol">${sr.sets} × ${sr.reps}</td>
          <td class="ex-act"><button class="link" onclick="window.__search('${esc(e.name)}')">查看</button></td>
        </tr>`).join("");
      return `<div class="day">
        <div class="day-h">第 ${i + 1} 天 · ${esc(s.focus)}</div>
        <div class="day-body">
          <table class="plan-table">
            <thead><tr><th>#</th><th>动作</th><th>组 × 次</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="note">组间休息 ${esc(sr.rest)}。</div>
        </div>
      </div>`;
    }).join("");

    // 补充休息日
    let restHtml = "";
    for (let d = sessions.length + 1; d <= Math.min(parseInt(p.days), 7); d++) {
      restHtml += `<div class="day">
        <div class="day-h">第 ${d} 天 · 休息 / 主动恢复</div>
        <div class="day-body">轻度有氧 20 分钟或全身拉伸放松。</div>
      </div>`;
    }

    return `
      <div class="plan-head">
        <h2>你的训练方案</h2>
        <div class="meta-row">
          <span>目标:${esc(goalTxt)}</span><span>水平:${esc(p.level)}</span>
          <span>模式:${esc(template.label)}</span><span>频率:${sessions.length} 天/周</span>
          <span>单次:${esc(p.duration)} 分钟</span><span>周期:${weeks} 周</span>
        </div>
        <div class="routine" style="margin-top:6px">
          📋 <b>${esc(template.label)}</b> · ${esc(split.reason)}
        </div>
        <div class="routine">每次训练前动态热身 5-10 分钟；训练后拉伸 5-10 分钟。</div>
        ${warnHtml}
      </div>
      ${progressHtml}
      <div class="days">${daysHtml}${restHtml}</div>`;
  }

  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* 供方案内"查看动作"调用 */
  window.__search = function (name) {
    switchTab("learn");
    $("#search-input").value = name;
    runSearch();
    $("#results").scrollIntoView({ behavior: "smooth" });
  };

  /* ---------- profile 持久化 ---------- */
  function saveProfile(p) {
    try { localStorage.setItem("fit_profile", JSON.stringify(p)); } catch (e) {}
  }
  function loadProfile() {
    let p = null;
    try { p = JSON.parse(localStorage.getItem("fit_profile") || "null"); } catch (e) {}
    if (!p) return;
    if (p.goal)        $("#p-goal").value = p.goal;
    if (p.level)       $("#p-level").value = p.level;
    if (p.equipment)   $("#p-equip").value = p.equipment;
    if (p.days)        $("#p-days").value = p.days;
    if (p.duration)    $("#p-dur").value = p.duration;
    if (p.weeks)       { const el = $("#p-weeks"); if (el) el.value = p.weeks; }
    if (p.lang)        $("#p-lang").value = p.lang;
    if (p.limitations) $("#p-limit").value = p.limitations;
  }

  // 更新周期推算显示并自动选中对应阶段 chip
  function updateCycleCalcDisplay(dateStr) {
    const display = $("#cycle-calc-result");
    if (!display) return;
    const result = calcCyclePhaseFromDate(dateStr);
    if (!result) { display.textContent = ""; return; }
    const cp = CYCLE_PHASES[result.phase];
    display.textContent = `→ 推算第 ${result.cycleDay} 天，${cp.emoji} ${cp.name}`;
    // 自动选中对应阶段单选
    const radio = document.querySelector(`input[name="s-cycle-phase"][value="${result.phase}"]`);
    if (radio) radio.checked = true;
  }

  function switchTab(tab) {
    $$(".tab[data-tab]").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    $("#sec-learn").style.display = tab === "learn" ? "" : "none";
    $("#sec-plan").style.display = tab === "plan" ? "" : "none";
  }

  function switchPlanTab(tab) {
    $$(".ptab[data-ptab]").forEach((t) => t.classList.toggle("active", t.dataset.ptab === tab));
    $("#ptab-weekly").style.display = tab === "weekly" ? "" : "none";
    $("#ptab-single").style.display = tab === "single" ? "" : "none";
    // 切换时收起上次输出
    if (tab === "weekly") { $("#plan-output").classList.remove("show"); }
    if (tab === "single") { $("#single-output").innerHTML = ""; }
  }

  /* ---------- 今日单次训练（规格逻辑二） ---------- */
  function onGenerateSingle() {
    // 读取生理周期信息
    let cyclePhase = null;
    let periodDate = "";
    if ($("#s-use-cycle") && $("#s-use-cycle").checked) {
      periodDate = $("#s-period-date") ? $("#s-period-date").value : "";
      if (periodDate) {
        const calc = calcCyclePhaseFromDate(periodDate);
        if (calc) cyclePhase = calc.phase;
      }
      if (!cyclePhase) {
        const radio = document.querySelector("input[name='s-cycle-phase']:checked");
        if (radio) cyclePhase = radio.value;
      }
    }

    const p = {
      goal:        $("#s-goal").value,
      equipment:   $("#s-equip").value,
      duration:    parseInt($("#s-dur").value, 10),
      energy:      $("#s-energy").value,
      lang:        $("#s-lang").value,
      recovering:  $$("#muscle-recovery-grid input:checked").map((c) => c.value),
      limitations: $("#s-limit").value || "",
      cyclePhase,
      periodDate,
      useCycle: !!(cyclePhase),
    };
    saveSingleProfile(p);
    const out = buildSingleSession(p);
    $("#single-output").innerHTML = out;
    $("#single-output").scrollIntoView({ behavior: "smooth" });
  }

  // 单次训练生成（规格 3.2）
  function buildSingleSession(p) {
    // Step 1-2：解析恢复状态，过滤未恢复肌群
    const recovering = new Set(p.recovering || []);
    const freshMuscles = MUSCLE_GROUPS.filter((mg) => !recovering.has(mg.key));

    // 特殊情况：所有肌群均未恢复 → 主动恢复方案
    if (freshMuscles.length === 0) return renderActiveRecovery();

    const equip = EQUIP_MAP[p.equipment];
    const ec = ENERGY_CONFIG[p.energy] || ENERGY_CONFIG["正常"];
    const maxEx = TIME_TO_EX[p.duration] || 6;

    // Step 3：按目标优先级排序已恢复肌群，结合疲劳调整强度
    let sr = { ...(SETREP[p.goal] || SETREP.general) };
    let intensityNote = "";
    if (p.energy === "有限") {
      sr.sets = "2-3";
      intensityNote = "今日体力有限，已降低训练量，建议以轻重量、慢节奏为主。";
    } else if (p.energy === "充沛") {
      intensityNote = "今日状态充沛，可在标准基础上适当加重或多做 1 组。";
    }

    // 按目标优先权排序（恢复最充分 + 目标最相关）
    const sorted = [...freshMuscles].sort(
      (a, b) => (b.prio[p.goal] || 2) - (a.prio[p.goal] || 2)
    );

    // 根据时长决定训练几个肌群（时间短则专注单一肌群）
    const muscleCount = maxEx <= 4 ? 1 : maxEx <= 6 ? 2 : 3;
    const selected = sorted.slice(0, muscleCount);

    // 生成推荐理由（规格 3.3 reason 字段）
    const freshNames = freshMuscles.map((mg) => mg.label).join("、");
    const selectedNames = selected.map((mg) => mg.label).join(" + ");
    const goalTxt = GOAL_LABEL[p.goal] || p.goal;
    const reason = `已恢复肌群：${freshNames}。结合 <b>${goalTxt}</b> 目标，今日优先安排 <b>${selectedNames}</b> 训练。`;

    // Step 4：从动作库填充
    let pool = EXERCISES.filter((e) => !equip || e.equipment === equip);
    const risk = applyRisk(p.limitations, pool);
    pool = risk.pool;

    const exPerMuscle = Math.max(1, Math.ceil(maxEx / selected.length));
    let exercises = [];
    selected.forEach((mg) => {
      const fn = MUSCLE_EX_FILTER[mg.key];
      if (!fn) return;
      const mPool = pool.filter(fn);
      if (!mPool.length) return;
      shuffle(mPool).slice(0, exPerMuscle).forEach((e) => exercises.push({ ex: e, muscle: mg.key }));
    });
    exercises = exercises.slice(0, maxEx);

    if (!exercises.length) return `<p class="warn">没有匹配的动作，请放宽器械条件。</p>`;

    // Step 5（规格扩展）：生理周期阶段调整
    let cycleBannerHtml = "";
    if (p.cyclePhase && CYCLE_PHASES[p.cyclePhase]) {
      const cp = CYCLE_PHASES[p.cyclePhase];

      // 过滤禁忌肌群（月经期避免腹部）
      if (cp.excludeMuscles && cp.excludeMuscles.length) {
        const before = exercises.length;
        exercises = exercises.filter((x) => !cp.excludeMuscles.includes(x.muscle));
        // 如果过滤后动作不足，从其他已恢复肌群补充
        if (exercises.length < 2 && before > 0) {
          const fallback = sorted.find(
            (mg) => !cp.excludeMuscles.includes(mg.key) && !selected.some((s) => s.key === mg.key)
          );
          if (fallback) {
            const fn = MUSCLE_EX_FILTER[fallback.key];
            if (fn) {
              shuffle(pool.filter(fn)).slice(0, 3).forEach((e) =>
                exercises.push({ ex: e, muscle: fallback.key })
              );
            }
          }
        }
      }

      // 月经期：即使用户选了"充沛"也不应用高强度提示，改为友好提示
      if (cp.capEnergy && p.energy === "充沛") {
        intensityNote = "月经期建议避免最大强度冲击，已自动调整为正常训练量。";
      }

      // 覆盖组次
      if (cp.srOverride) sr = { ...sr, ...cp.srOverride };

      // 构建周期横幅
      cycleBannerHtml = `<div class="cycle-banner cycle-${p.cyclePhase}">
        ${cp.emoji} <b>${esc(cp.name)}（${esc(cp.days)}）</b>：${esc(cp.note)}
        ${cp.altSuggestion ? `<div style="margin-top:3px;opacity:.85">💡 ${esc(cp.altSuggestion)}</div>` : ""}
      </div>`;
    }

    return renderSingleSession(exercises, p, ec, sr, risk.notes, selected, reason, intensityNote, cycleBannerHtml);
  }

  function renderActiveRecovery() {
    return `
      <div class="plan-head">
        <h2>今日建议：主动恢复</h2>
        <div class="meta-row"><span>所有肌群仍在恢复中（&lt;48h）</span></div>
        <div class="risk" style="background:rgba(61,220,151,.08);border-color:rgba(61,220,151,.3);color:var(--ok)">
          💤 所有肌群距上次训练不足 48 小时，今日适合休息或进行低强度主动恢复。
        </div>
      </div>
      <div class="section-card">
        <div class="day-h">🧘 主动恢复方案（20-30 分钟）</div>
        <ul class="ex-list">
          <li>轻度有氧：慢跑、快走或骑行，心率维持最大心率的 50-60%</li>
          <li>全身动态拉伸：关节绕环、猫牛式、髋部松动</li>
          <li>泡沫轴滚压：大腿前侧、背部、小腿，各 1-2 分钟</li>
        </ul>
      </div>`;
  }

  function renderSingleSession(exercises, p, ec, sr, riskNotes, selectedMuscles, reason, intensityNote, cycleBannerHtml) {
    const focusTxt = selectedMuscles.map((mg) => mg.label).join(" + ");
    const goalTxt = GOAL_LABEL[p.goal] || p.goal;

    // 热身 / 放松：通过 muscle key → body_part key → WARMUP/COOLDOWN
    const bpKeys = [...new Set(selectedMuscles.map((mg) => MUSCLE_TO_BP[mg.key] || mg.key))];
    const warmupItems = [...new Set(bpKeys.flatMap((k) => WARMUP[k] || ["动态拉伸 5 分钟"]))].slice(0, 5);
    const cooldownItems = [...new Set(bpKeys.flatMap((k) => COOLDOWN[k] || ["静态拉伸 5 分钟"]))].slice(0, 5);

    const riskHtml = riskNotes.length
      ? `<div class="risk">⚠️ ${riskNotes.map(esc).join(" ")}<br><span class="disclaim">本方案为通用参考，不替代医疗 / 教练建议。</span></div>`
      : `<div class="risk disclaim">本方案为通用参考，请量力而行，如有不适立即停止。</div>`;

    const energyHtml = intensityNote
      ? `<div class="risk" style="background:rgba(76,201,240,.08);border-color:rgba(76,201,240,.3);color:var(--accent2)">${esc(ec.label)} · ${esc(intensityNote)}</div>`
      : "";

    const exRows = exercises.map((x, i) => `
      <tr>
        <td class="ex-num">${i + 1}</td>
        <td class="ex-name">${esc(x.ex.name)}</td>
        <td class="ex-vol">${esc(sr.sets)} × ${esc(sr.reps)}</td>
        <td class="ex-act"><button class="link" onclick="window.__search('${esc(x.ex.name)}')">查看</button></td>
      </tr>`).join("");

    const mainMin = Math.max(p.duration - 15, 10);

    return `
      <div class="plan-head">
        <h2>今日训练方案</h2>
        <div class="meta-row">
          <span>目标:${esc(goalTxt)}</span>
          <span>重点:${esc(focusTxt)}</span>
          <span>时长:${esc(p.duration)} 分钟</span>
          <span>状态:${esc(ec.label)}</span>
        </div>
        <div class="routine" style="margin-top:6px;color:var(--accent2)">💡 ${reason}</div>
        ${cycleBannerHtml || ""}
        ${riskHtml}
        ${energyHtml}
      </div>
      <div class="section-card">
        <div class="day-h">🔥 热身（5-10 分钟）</div>
        <ul class="ex-list">${warmupItems.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      </div>
      <div class="section-card">
        <div class="day-h">💪 主训练（约 ${mainMin} 分钟）</div>
        <table class="plan-table">
          <thead><tr><th>#</th><th>动作</th><th>组 × 次</th><th></th></tr></thead>
          <tbody>${exRows}</tbody>
        </table>
        <div class="note">组间休息 ${esc(sr.rest)}。</div>
      </div>
      <div class="section-card">
        <div class="day-h">🧘 放松拉伸（5 分钟）</div>
        <ul class="ex-list">${cooldownItems.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      </div>`;
  }

  /* ---------- 今日单次 profile 持久化 ---------- */
  function saveSingleProfile(p) {
    try {
      localStorage.setItem("fit_single_profile", JSON.stringify(p));
      // 恢复状态仅当天有效（第二天自动清除）
      localStorage.setItem("fit_recovery_date", new Date().toDateString());
    } catch (e) {}
  }
  function loadSingleProfile() {
    let p = null;
    try { p = JSON.parse(localStorage.getItem("fit_single_profile") || "null"); } catch (e) {}
    if (!p) return;
    if (p.goal)        $("#s-goal").value = p.goal;
    if (p.equipment)   $("#s-equip").value = p.equipment;
    if (p.duration)    $("#s-dur").value = p.duration;
    if (p.energy)      $("#s-energy").value = p.energy;
    if (p.lang)        $("#s-lang").value = p.lang;
    if (p.limitations) $("#s-limit").value = p.limitations;
    // 肌群恢复状态：仅当保存于今天时恢复（防止次日残留）
    const savedDate = localStorage.getItem("fit_recovery_date");
    if (savedDate === new Date().toDateString() && p.recovering) {
      p.recovering.forEach((k) => {
        document.querySelectorAll(`#muscle-recovery-grid input[value="${k}"]`)
          .forEach((el) => (el.checked = true));
      });
    }
    // 生理周期设置恢复
    if (p.useCycle) {
      const useCycleEl = $("#s-use-cycle");
      const panel = $("#cycle-panel");
      if (useCycleEl) { useCycleEl.checked = true; if (panel) panel.style.display = ""; }
      if (p.periodDate) {
        const pdEl = $("#s-period-date");
        if (pdEl) { pdEl.value = p.periodDate; updateCycleCalcDisplay(p.periodDate); }
      } else if (p.cyclePhase) {
        const radio = document.querySelector(`input[name="s-cycle-phase"][value="${p.cyclePhase}"]`);
        if (radio) radio.checked = true;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    init();
    $("#modal-close").addEventListener("click", closeModal);
    $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  });
})();
