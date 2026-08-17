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

  // 自动推荐部位组合（当用户未选择时）
  const AUTO_FOCUS_COMBOS = [
    ["chest", "upper arms"],
    ["back", "upper arms"],
    ["upper legs", "glutes"],
    ["shoulders", "chest"],
    ["back", "waist"],
    ["glutes", "lower legs"],
  ];

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

    // 重点部位 chips
    const focusBox = $("#focus-box");
    FOCUS_GROUPS.forEach((g) => {
      const id = "fc_" + g.key;
      const lab = document.createElement("label");
      lab.className = "chip";
      lab.innerHTML = `<input type="checkbox" id="${id}" value="${g.key}"><span>${g.label}</span>`;
      focusBox.appendChild(lab);
    });

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

    // 今日单次：重点部位 chips
    const singleFocusBox = $("#single-focus-box");
    FOCUS_GROUPS.forEach((g) => {
      const id = "sfc_" + g.key;
      const lab = document.createElement("label");
      lab.className = "chip";
      lab.innerHTML = `<input type="checkbox" id="${id}" value="${g.key}"><span>${g.label}</span>`;
      singleFocusBox.appendChild(lab);
    });

    // 今日单次：生成 & 打印
    $("#s-gen-btn").addEventListener("click", onGenerateSingle);
    $("#s-print-btn").addEventListener("click", () => window.print());

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
      goal: $("#p-goal").value,
      level: $("#p-level").value,
      equipment: $("#p-equip").value,
      days: parseInt($("#p-days").value, 10),
      duration: parseInt($("#p-dur").value, 10),
      focus: $$("#focus-box input:checked").map((c) => c.value),
      limitations: $("#p-limit").value || "",
      lang: $("#p-lang").value
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
    if (/腰|腰椎|间盘|脊椎|disk|back pain|herni/i.test(t)) {
      pool = pool.filter((e) => e.body_part !== "waist" && !/deadlift|good morning|back extension|hyper|sit-up|crunch/i.test(e.name));
      notes.push("已避开高脊柱负荷动作（如硬拉、仰卧起坐）；腰背不适者请量力而行并咨询专业人士。");
    }
    if (/膝|knee/i.test(t)) {
      pool = pool.filter((e) => !/jump|box|plyo|lunge|squat|leg press|sprint|burpee/i.test(e.name));
      notes.push("已避开膝部高冲击/深蹲类动作（如跳跃、箭步蹲、深蹲）；膝不适者注意控制幅度。");
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

  function buildPlan(p) {
    const lang = p.lang;
    const equip = EQUIP_MAP[p.equipment];
    const focus = p.focus.length ? p.focus : FOCUS_GROUPS.map((g) => g.key).filter((k) => k !== "neck");
    let pool = EXERCISES.filter((e) => {
      if (equip && e.equipment !== equip) return false;
      if (!focus.includes(ePart(e))) return false;
      return true;
    });
    const risk = applyRisk(p.limitations, pool);
    pool = risk.pool;
    if (!pool.length) return `<p class="warn">没有匹配的动作，请放宽器械或重点部位条件。</p>`;

    const byPart = {};
    pool.forEach((e) => { const pt = ePart(e); (byPart[pt] = byPart[pt] || []).push(e); });
    const parts = Object.keys(byPart);

    const perPart = { "新手": 3, "初级": 3, "中级": 4, "高级": 4 }[p.level] || 3;
    const sr = SETREP[p.goal] || SETREP.general;
    const maxEx = { 30: 5, 45: 7, 60: 9 }[p.duration] || 6;

    // 把部位尽量均分到各训练日 (round-robin), 同部位不重复出现
    const groups = Array.from({ length: p.days }, () => []);
    parts.forEach((pt, i) => groups[i % p.days].push(pt));

    const plan = groups.map((gparts, i) => {
      let exs = [];
      gparts.forEach((pt) => {
        shuffle(byPart[pt]).slice(0, perPart).forEach((e) => exs.push({ ex: e, part: pt }));
      });
      // 控制单日动作数
      if (exs.length > maxEx) exs = exs.slice(0, maxEx);
      return { day: i + 1, parts: gparts, exercises: exs, rest: gparts.length === 0 };
    });

    return renderPlan(plan, p, sr, risk.notes, parts.length);
  }

  function renderPlan(plan, p, sr, riskNotes, partCount) {
    const lang = p.lang;
    const goalTxt = GOAL_LABEL[p.goal] || p.goal;
    const levelTxt = p.level;
    const equipTxt = p.equipment;
    const durTxt = p.duration + " 分钟";
    const focusTxt = (p.focus.length ? p.focus : FOCUS_GROUPS.map((g) => g.key).filter((k) => k !== "neck"))
      .map((k) => BP_LABEL[k] || k).join("、");

    let riskHtml = riskNotes.length
      ? `<div class="risk">⚠️ 已根据你的限制调整：${riskNotes.map(esc).join(" ")}<br><span class="disclaim">本方案为通用参考，不能替代专业医疗/教练建议。</span></div>`
      : `<div class="risk disclaim">本方案为通用参考，伤病或特殊情况请遵医嘱 / 专业教练。</div>`;

    let daysHtml = plan.map((d) => {
      if (d.rest) {
        return `<div class="day"><div class="day-h">第 ${d.day} 天 · 休息 / 主动恢复</div>
          <div class="day-body">轻度有氧 20 分钟 或 拉伸放松。</div></div>`;
      }
      const partsTxt = d.parts.map((pt) => BP_LABEL[pt] || pt).join(" + ");
      const rows = d.exercises.map((x, i) => {
        const e = x.ex;
        return `<tr>
          <td class="ex-num">${i + 1}</td>
          <td class="ex-name">${esc(e.name)}</td>
          <td class="ex-vol">${sr.sets} × ${sr.reps}</td>
          <td class="ex-act"><button class="link" onclick="window.__search('${esc(e.name)}')">查看</button></td>
        </tr>`;
      }).join("");
      const table = `<table class="plan-table">
        <thead><tr><th>#</th><th>动作</th><th>组 × 次</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
      return `<div class="day"><div class="day-h">第 ${d.day} 天 · ${esc(partsTxt)}</div>
        <div class="day-body">${table}
        <div class="note">组间休息 ${esc(sr.rest)}。</div></div></div>`;
    }).join("");

    return `
      <div class="plan-head">
        <h2>你的训练方案</h2>
        <div class="meta-row">
          <span>目标:${esc(goalTxt)}</span><span>水平:${esc(levelTxt)}</span>
          <span>器械:${esc(equipTxt)}</span><span>频率:${esc(p.days)} 天/周</span>
          <span>单次:${esc(durTxt)}</span><span>重点:${esc(focusTxt)}</span>
        </div>
        <div class="routine">每次训练前动态热身 5-10 分钟；训练后拉伸 5-10 分钟。</div>
        ${riskHtml}
      </div>
      <div class="days">${daysHtml}</div>`;
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
    if (p.goal) $("#p-goal").value = p.goal;
    if (p.level) $("#p-level").value = p.level;
    if (p.equipment) $("#p-equip").value = p.equipment;
    if (p.days) $("#p-days").value = p.days;
    if (p.duration) $("#p-dur").value = p.duration;
    if (p.lang) $("#p-lang").value = p.lang;
    if (p.limitations) $("#p-limit").value = p.limitations;
    if (p.focus) p.focus.forEach((k) => { const el = document.getElementById("fc_" + k); if (el) el.checked = true; });
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

  /* ---------- 今日单次训练 ---------- */
  function onGenerateSingle() {
    const p = {
      goal:        $("#s-goal").value,
      equipment:   $("#s-equip").value,
      duration:    parseInt($("#s-dur").value, 10),
      energy:      $("#s-energy").value,
      lang:        $("#s-lang").value,
      focus:       $$("#single-focus-box input:checked").map((c) => c.value),
      limitations: $("#s-limit").value || ""
    };
    saveSingleProfile(p);
    const out = buildSingleSession(p);
    $("#single-output").innerHTML = out;
    $("#single-output").scrollIntoView({ behavior: "smooth" });
  }

  function buildSingleSession(p) {
    const equip = EQUIP_MAP[p.equipment];
    // 未选部位时从推荐组合中随机取一个
    const focus = p.focus.length
      ? p.focus
      : AUTO_FOCUS_COMBOS[Math.floor(Math.random() * AUTO_FOCUS_COMBOS.length)];

    const sr = SETREP[p.goal] || SETREP.general;
    const ec = ENERGY_CONFIG[p.energy] || ENERGY_CONFIG["正常"];
    const maxEx = TIME_TO_EX[p.duration] || 6;

    let pool = EXERCISES.filter((e) => {
      if (equip && e.equipment !== equip) return false;
      return focus.includes(ePart(e));
    });

    const risk = applyRisk(p.limitations, pool);
    pool = risk.pool;

    if (!pool.length) return `<p class="warn">没有匹配的动作，请放宽器械或重点部位条件。</p>`;

    // 按有效部位分组，每个部位均匀取若干动作
    const byFocusPart = {};
    pool.forEach((e) => { const pt = ePart(e); (byFocusPart[pt] = byFocusPart[pt] || []).push(e); });
    const actualFocus = focus.filter((f) => byFocusPart[f]);
    const perPart = Math.max(2, Math.ceil(maxEx / Math.max(actualFocus.length, 1)));

    let selected = [];
    actualFocus.forEach((pt) => {
      shuffle(byFocusPart[pt]).slice(0, perPart).forEach((e) => selected.push({ ex: e, part: pt }));
    });
    selected = selected.slice(0, maxEx);

    return renderSingleSession(selected, p, ec, sr, risk.notes, actualFocus);
  }

  function renderSingleSession(exercises, p, ec, sr, riskNotes, focus) {
    const lang = p.lang || "zh";
    const goalTxt = GOAL_LABEL[p.goal] || p.goal;
    const focusTxt = focus.map((k) => BP_LABEL[k] || k).join(" + ");
    const autoTip = p.focus && p.focus.length === 0
      ? `<div class="lhint" style="margin-bottom:8px">💡 未选重点部位，已为你自动推荐：<b>${focusTxt}</b></div>` : "";

    // 热身（去重，最多 5 条）
    const warmupItems = [...new Set(focus.flatMap((k) => WARMUP[k] || ["动态拉伸 5 分钟"]))].slice(0, 5);
    const warmupHtml = warmupItems.map((s) => `<li>${esc(s)}</li>`).join("");

    // 放松（去重，最多 5 条）
    const cooldownItems = [...new Set(focus.flatMap((k) => COOLDOWN[k] || ["静态拉伸 5 分钟"]))].slice(0, 5);
    const cooldownHtml = cooldownItems.map((s) => `<li>${esc(s)}</li>`).join("");

    // 主训练动作（表格，只展示名称 + 组次 + 链接）
    const exRows = exercises.map((x, i) => {
      const e = x.ex;
      return `<tr>
        <td class="ex-num">${i + 1}</td>
        <td class="ex-name">${esc(e.name)}</td>
        <td class="ex-vol">${esc(sr.sets)} × ${esc(sr.reps)}</td>
        <td class="ex-act"><button class="link" onclick="window.__search('${esc(e.name)}')">查看</button></td>
      </tr>`;
    }).join("");
    const exHtml = `<table class="plan-table">
      <thead><tr><th>#</th><th>动作</th><th>组 × 次</th><th></th></tr></thead>
      <tbody>${exRows}</tbody>
    </table>`;

    const riskHtml = riskNotes.length
      ? `<div class="risk">⚠️ 已根据伤病限制调整：${riskNotes.map(esc).join(" ")}<br><span class="disclaim">本方案为通用参考，不替代医疗 / 教练建议。</span></div>`
      : `<div class="risk disclaim">本方案为通用参考，请量力而行，如有不适立即停止。</div>`;
    const energyHtml = ec.setsNote
      ? `<div class="risk" style="background:rgba(76,201,240,.08);border-color:rgba(76,201,240,.3);color:var(--accent2)">${esc(ec.label)} ${esc(ec.setsNote)}</div>` : "";

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
        ${autoTip}
        ${riskHtml}
        ${energyHtml}
      </div>
      <div class="section-card">
        <div class="day-h">🔥 热身（5–10 分钟）</div>
        <ul class="ex-list">${warmupHtml}</ul>
      </div>
      <div class="section-card">
        <div class="day-h">💪 主训练（约 ${mainMin} 分钟）</div>
        <ul class="ex-list">${exHtml}</ul>
        <div class="note">组间休息 ${esc(sr.rest)}。</div>
      </div>
      <div class="section-card">
        <div class="day-h">🧘 放松拉伸（5 分钟）</div>
        <ul class="ex-list">${cooldownHtml}</ul>
      </div>`;
  }

  /* ---------- 今日单次 profile 持久化 ---------- */
  function saveSingleProfile(p) {
    try { localStorage.setItem("fit_single_profile", JSON.stringify(p)); } catch (e) {}
  }
  function loadSingleProfile() {
    let p = null;
    try { p = JSON.parse(localStorage.getItem("fit_single_profile") || "null"); } catch (e) {}
    if (!p) return;
    if (p.goal)      $("#s-goal").value = p.goal;
    if (p.equipment) $("#s-equip").value = p.equipment;
    if (p.duration)  $("#s-dur").value = p.duration;
    if (p.energy)    $("#s-energy").value = p.energy;
    if (p.lang)      $("#s-lang").value = p.lang;
    if (p.limitations) $("#s-limit").value = p.limitations;
    if (p.focus) p.focus.forEach((k) => { const el = document.getElementById("sfc_" + k); if (el) el.checked = true; });
  }

  document.addEventListener("DOMContentLoaded", () => {
    init();
    $("#modal-close").addEventListener("click", closeModal);
    $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  });
})();
