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

    // 方案表单
    $("#gen-btn").addEventListener("click", onGenerate);
    $("#print-btn").addEventListener("click", () => window.print());

    // Tab 切换
    $$(".tab").forEach((t) => t.addEventListener("click", () => switchTab(t.dataset.tab)));

    // 恢复上次资料
    loadProfile();
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
      const items = d.exercises.map((x) => {
        const e = x.ex;
        const hint = (lang && lang !== "en" && e.instructions[lang])
          ? `<div class="lhint">${esc(e.instructions[lang].slice(0, 90))}</div>` : "";
        return `<li><b>${esc(e.name)}</b>
          <span class="sr">${sr.sets} 组 × ${sr.reps} 次</span>
          <button class="link" onclick="window.__search('${esc(e.name)}')">查看动作</button>
          ${hint}</li>`;
      }).join("");
      return `<div class="day"><div class="day-h">第 ${d.day} 天 · ${esc(partsTxt)}</div>
        <div class="day-body"><ul class="ex-list">${items}</ul>
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
    $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    $("#sec-learn").style.display = tab === "learn" ? "" : "none";
    $("#sec-plan").style.display = tab === "plan" ? "" : "none";
  }

  document.addEventListener("DOMContentLoaded", () => {
    init();
    $("#modal-close").addEventListener("click", closeModal);
    $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  });
})();
