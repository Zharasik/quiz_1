"use strict";
/* ===================== НАСТРОЙКИ ===================== */
/* COURSE = {ns, title, tool:{name,url}, quiz:[...], tasks:[...]} задаётся на странице */
const RU = COURSE.ui === "ru";
const t_ = (kk, ru) => RU ? ru : kk;
const SETS = {
  quiz: {name: n => t_("Квиз · ", "Квиз · ") + n + t_(" сұрақ", " вопросов"), short: "Квиз", quick: true},
  practice: {name: n => "Практика · " + n + " тапсырма", short: "Практика", quick: false},
  free: {name: () => t_("Еркін практика", "Свободная практика"), short: t_("Еркін", "Свободно"), quick: false}
};
const autoGrade = (sec, limitSec, thr) => { const r = sec / Math.max(1, limitSec) * 100; return r <= thr[0] ? 5 : r <= thr[1] ? 4 : r <= thr[2] ? 3 : 2; };
const mmss = x => Math.floor(x / 60) + ":" + String(Math.floor(x % 60)).padStart(2, "0");
const safeName = s => String(s || "").replace(/[\\/:*?"<>|]+/g, "_").trim().slice(0, 40) || "file";
function downloadBlob(blob, name) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); }
const dataToBytes = d => { const b = atob(d.split(",")[1]); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
/* [[орысша|english]] → таңдалған интерфейс тілі */
const L = (s, lang) => String(s == null ? "" : s).replace(/\[\[([^|\]]*)\|([^\]]*)\]\]/g, (m, ru, en) => lang === "en" ? en : ru);
const LANGS = COURSE.langs || [["ru", "Орысша"], ["en", "English"]];
const LANG_LABEL = COURSE.langLabel || "Интерфейс:";
const exUrl = ex => !ex ? "" : /^https?:\/\//.test(ex) ? ex : "ex/" + ex + ".jpg";
const fromBank = id => { const b = COURSE.bank.find(x => x.id === id); return b ? JSON.parse(JSON.stringify(Object.assign({uid: rid(6)}, b))) : null; };
const defaultPlan = () => COURSE.defaults.map(fromBank).filter(Boolean);
const toRound = (t, i) => ({type: "task", t: Math.max(1, +t.min || 5) * 60, k: (i + 1) + "-тапсырма · " + (+t.min || 5) + " мин", title: t.title, steps: t.steps || [], crit: t.crit || [], ex: t.ex || "", table: t.table || null, hints: t.hints || [], checks: t.checks || [], shot: t.shot !== false, ai: t.ai || [], vp: t.vp || [], lvl: t.lvl || "", why: t.why || ""});
const LVL = {A: t_("A · базалық", "A · базовый"), B: t_("B · орта", "B · средний"), C: t_("C · жоғары", "C · высокий")};
const lvlB = l => LVL[l] ? `<span class="lvl l${l}">${LVL[l]}</span>` : "";
const LESSON = COURSE.lesson || null;
function qrSvg(text) { try { if (typeof qrcode === "undefined") return ""; const q = qrcode(0, "M"); q.addData(text); q.make(); return q.createSvgTag({cellSize: 8, margin: 2, scalable: true}); } catch (e) { return ""; } }
const goalBox = (big) => !LESSON ? "" : `<div class="goalbox ${big ? "big" : ""}"><div class="kicker">${t_("Сабақ мақсаты", "Цель занятия")}</div><div class="gtxt">${esc(LESSON.goal || "")}</div>${LESSON.crit && LESSON.crit.length ? `<div class="kicker" style="margin-top:12px">${t_("Табыс критерийлері", "Критерии успеха")}</div><ul class="gcrit">${LESSON.crit.map(c => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}</div>`;
const REFQ = () => LESSON && Array.isArray(LESSON.reflQ) && LESSON.reflQ.length === 3 ? LESSON.reflQ : [t_("Бүгін нені үйрендім? (1 сөйлем)", "Чему я научился сегодня? (1 предложение)"), t_("Қай жерде қиналдым, неге?", "Где было трудно и почему?"), t_("Келесі жолы нені басқаша істеймін?", "Что сделаю иначе в следующий раз?")];
const REFC = () => ({g: {t: t_("Өзім орындай аламын", "Могу сам"), c: "#2FB36D"}, y: {t: t_("Кейде көмек керек", "Иногда нужна помощь"), c: "#F5A524"}, r: {t: t_("Қайта түсіндіру керек", "Нужно объяснить ещё раз"), c: "#E5484D"}});
const selfLine = (crit, self) => self && crit && crit.length ? `<div class="selfl"><span class="mut">${t_("Өзін-өзі бағалау", "Самооценка")}:</span> ${crit.map((c, j) => `<span class="${self[j] ? "okc" : "badc"}">${self[j] ? "✓" : "✗"} ${esc(c)}</span>`).join("")}<b>${self.filter(Boolean).length}/${crit.length}</b></div>` : "";
const linkify = x => esc(x).replace(/(https?:\/\/[^\s<,)»]+)/g, u => `<a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</a>`);
const PB = g => /^[0-5]$/.test(String(g)) ? (({5: 100, 4: 85, 3: 70, 2: 50, 1: 25, 0: 0})[g]) + " / 100" : g;
const whyBox = r => r.why ? `<div class="whyb"><b>${t_("Не үшін?", "Зачем?")}</b> ${esc(L(r.why, typeof lang === "function" ? lang() : "kk"))}</div>` : "";
const extraTips = (r, lg) => (r.ai && r.ai.length ? `<details class="exd tipai"><summary>🤖 ${t_("ЖИ көмекшісі", "ИИ-помощник")}</summary><ul class="hints">${r.ai.map(h => `<li>${linkify(L(h, lg))}</li>`).join("")}</ul></details>` : "")
  + (r.vp && r.vp.length ? `<details class="exd tipvp"><summary>🌐 ${t_("Illustrator жоқ па? Vectorpea", "Нет Illustrator? Vectorpea")}</summary><ul class="hints">${r.vp.map(h => `<li>${linkify(L(h, lg))}</li>`).join("")}</ul></details>` : "");
const checkOk = (c, v) => { if (c.opts) return (v | 0) === c.c && v !== "" && v != null; const x = parseFloat(String(v == null ? "" : v).replace(/[\s\u00a0]/g, "").replace("%", "").replace(",", ".")); if (!isFinite(x)) return false; const tol = c.tol != null ? c.tol : Math.max(0.5, Math.abs(c.a) * 0.002); return Math.abs(x - c.a) <= tol || (c.pct && Math.abs(x * 100 - c.a) <= tol); };
const NS = COURSE.ns;
const TITLE = COURSE.title;
const BROKERS = ["wss://broker.emqx.io:8084/mqtt", "wss://broker.hivemq.com:8884/mqtt", "wss://test.mosquitto.org:8081"];
const PARAMS = new URLSearchParams(location.search);
const IS_HOST = PARAMS.has("host");
const IMG_MAX = 1000, IMG_Q = 0.78;
const isTask = r => r && r.type === "task";

/* ===================== УТИЛИТЫ ===================== */
const $ = s => document.querySelector(s);
const app = $("#app");
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const rid = (n, abc) => { abc = abc || "abcdefghijkmnpqrstuvwxyz23456789"; let s = ""; const a = new Uint32Array(n); crypto.getRandomValues(a); for (const x of a) s += abc[x % abc.length]; return s; };
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(NS + k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(NS + k); } catch (e) {} }
};
const SHAPES = [
  '<svg class="shape" viewBox="0 0 28 28"><path d="M14 4 25 23H3z" fill="currentColor"/></svg>',
  '<svg class="shape" viewBox="0 0 28 28"><path d="M14 2.5 25.5 14 14 25.5 2.5 14z" fill="currentColor"/></svg>',
  '<svg class="shape" viewBox="0 0 28 28"><circle cx="14" cy="14" r="11" fill="currentColor"/></svg>',
  '<svg class="shape" viewBox="0 0 28 28"><rect x="4" y="4" width="20" height="20" rx="2" fill="currentColor"/></svg>'
];
const ICON = {
  fr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17M9 4l3 2 3-2M9 20l3-2 3 2"/></svg>',
  x2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8l6 8M10 8l-6 8M14 9.5a2.5 2.5 0 0 1 5 0c0 2.5-5 4-5 6.5h5"/></svg>',
  ff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="7" height="7" rx="1.5"/><rect x="14" y="13" width="7" height="7" rx="1.5"/><path d="M14 5l7 5M21 5l-7 5M3 14l7 5M10 14l-7 5" opacity=".5"/></svg>',
  sh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></svg>',
  ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>'
};
const GRADE = {ok: {t: "Қабылданды", c: "var(--ok)"}, best: {t: "Үздік жұмыс", c: "var(--a2)"}, redo: {t: "Пысықтау керек", c: "var(--bad)"}, zero: {t: "Есептелмеді · 0", c: "#8b1e2d"}};
function vibrate(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }
function toast(t) { const old = $(".toast"); if (old) old.remove(); const d = document.createElement("div"); d.className = "toast"; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2800); }
function setNet(on, text) { const n = $("#net"); n.classList.toggle("on", !!on); n.querySelector("span").textContent = on ? "Қосылды" : (text || "Қосылуда…"); }
function confetti() {
  const c = $("#cf"); c.classList.remove("hidden"); const ctx = c.getContext("2d");
  const W = c.width = innerWidth * devicePixelRatio, H = c.height = innerHeight * devicePixelRatio;
  const cols = ["#E5484D", "#3E7BFA", "#F5A524", "#2FB36D", "#F3F4F6"];
  const ps = Array.from({length: 90}, () => ({x: W / 2 + (Math.random() - .5) * W * .3, y: H * .45, vx: (Math.random() - .5) * W * .03, vy: -Math.random() * H * .03 - H * .008, r: Math.random() * Math.PI, s: (6 + Math.random() * 8) * devicePixelRatio, c: cols[Math.random() * 5 | 0]}));
  const t0 = performance.now();
  (function f(t) { const k = (t - t0) / 1400; ctx.clearRect(0, 0, W, H);
    for (const p of ps) { p.x += p.vx; p.y += p.vy; p.vy += H * .0011; p.r += .2; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - k); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); }
    if (k < 1) requestAnimationFrame(f); else { ctx.clearRect(0, 0, W, H); c.classList.add("hidden"); } })(t0);
}
function brokerUrl(i) { return PARAMS.get("broker") || BROKERS[i % BROKERS.length]; }
function connect(bi, onConnect, onMsg, extra) {
  setNet(false);
  const c = mqtt.connect(brokerUrl(bi), Object.assign({clientId: NS + "_" + rid(12), keepalive: 30, reconnectPeriod: 2000, connectTimeout: 8000, clean: true}, extra || {}));
  c.on("connect", () => { setNet(true); onConnect(c); });
  c.on("reconnect", () => setNet(false, "Қайта қосылуда…"));
  c.on("offline", () => setNet(false, "Байланыс жоқ"));
  c.on("error", () => {});
  c.on("message", (t, buf) => { let m; try { m = JSON.parse(buf.toString()); } catch (e) { return; } try { onMsg(t, m); } catch (e) { console.error(e); } });
  return c;
}
const T = room => NS + "/" + room + "/";
const fmtTime = s => s >= 60 ? Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") : String(s);
/* Сурет → JPEG dataURL (ақ фонмен, ең үлкен жағы IMG_MAX) */
function compressImage(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      try {
        let w = img.naturalWidth || img.width || 1000, h = img.naturalHeight || img.height || 1000;
        const k = Math.min(1, IMG_MAX / Math.max(w, h)); w = Math.max(1, Math.round(w * k)); h = Math.max(1, Math.round(h * k));
        const c = document.createElement("canvas"); c.width = w; c.height = h; const ctx = c.getContext("2d");
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
        let q = IMG_Q, d = c.toDataURL("image/jpeg", q);
        while (d.length > 260000 && q > 0.4) { q -= 0.1; d = c.toDataURL("image/jpeg", q); }
        URL.revokeObjectURL(url); res(d);
      } catch (e) { URL.revokeObjectURL(url); rej(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("bad image")); };
    img.src = url;
  });
}


/* ===================== ТАПСЫРМАЛАР РЕДАКТОРЫ (мұғалім) ===================== */
let TD_LANG = "ru";
function TaskDialog(t, parent, o) {
  const m = document.createElement("div"); m.className = "edm"; parent.appendChild(m);
  const bankItem = COURSE.bank.find(b => b.id === t.id);
  const ta = (id, lab, arr, rows, hint) => `<div class="ff wide"><label>${lab}</label><textarea id="${id}" rows="${rows}">${esc((arr || []).join("\n"))}</textarea>${hint ? `<div class="hint">${hint}</div>` : ""}</div>`;
  m.innerHTML = `<div class="edbox">
    <div class="edtop" style="margin:0"><h3 class="disp" style="margin:0;font-size:26px">${o.head || (o.isNew ? "Жаңа тапсырма" : "Тапсырманы өңдеу")}</h3><button class="btn ghost" id="mx">Болдырмау</button></div>
    ${o.note ? `<div class="hint" style="margin:0">${o.note}</div>` : ""}
    <div class="edform">
      <div class="ff"><label>Атауы</label><input id="f-title" value="${esc(t.title)}" maxlength="80" placeholder="Мысалы: Мерекелік постер"></div>
      <div class="ff" style="max-width:160px"><label>Уақыты, мин</label><input id="f-min" type="number" min="1" max="60" value="${+t.min || 6}"></div>
      <div class="ff wide"><label>Қадамдар — әр жолға бір қадам</label><textarea id="f-steps" rows="8">${esc((t.steps || []).join("\n"))}</textarea>
        <div class="hint">Мәзір атауын екі тілде жазу: <code>[[Файл → Создать|File → New]]</code> — студент таңдаған интерфейс тіліне қарай біреуі көрінеді.</div></div>
      <div class="ff"><label>Бағалау критерийлері — әр жолға біреу</label><textarea id="f-crit" rows="3">${esc((t.crit || []).join("\n"))}</textarea></div>
      <div class="ff"><label>Мысал сурет</label><select id="f-exsel"><option value="">Жоқ</option>${COURSE.bank.filter(b => b.ex).map(b => `<option value="${b.ex}" ${t.ex === b.ex ? "selected" : ""}>Банктен: ${esc(b.title)}</option>`).join("")}<option value="__url" ${/^https?:/.test(t.ex) ? "selected" : ""}>Сілтеме (URL)…</option></select>
        <input id="f-exurl" placeholder="https://…/surat.jpg" value="${/^https?:/.test(t.ex) ? esc(t.ex) : ""}" style="margin-top:8px;${/^https?:/.test(t.ex) ? "" : "display:none"}"></div>
      ${ta("f-hints", t_("Кеңестер — әр жолға біреу (міндетті емес)", "Подсказки — по одной в строке (необязательно)"), t.hints, 3)}
      ${ta("f-ai", "🤖 " + t_("ЖИ көмекшісі — әр жолға біреу (міндетті емес)", "ИИ-помощник — по одной в строке (необязательно)"), t.ai, 3, t_("Сілтемелер (https://…) студентте басылатын болады.", "Ссылки (https://…) у студента будут кликабельными."))}
      ${ta("f-vp", "🌐 " + t_("Vectorpea / Photopea кеңестері (міндетті емес)", "Подсказки для Vectorpea / Photopea (необязательно)"), t.vp, 2)}
      <div class="ff wide"><div class="pvh"><label>Алдын ала қарау</label><div class="mode" style="margin:0">${LANGS.map(([k, x]) => `<button data-pv="${k}" class="${TD_LANG === k ? "on" : ""}">${x}</button>`).join("")}</div></div><ol class="pv" id="pv"></ol></div>
    </div>
    <div class="edtop" style="margin:0;justify-content:flex-end">${bankItem && o.canReset ? `<button class="btn ghost" id="mreset">Банктегі нұсқаға қайтару</button>` : ""}<button class="btn" id="msave">${o.saveLabel || "Сақтау"}</button></div></div>`;
  const pv = () => { $("#pv").innerHTML = $("#f-steps").value.split("\n").map(x => x.trim()).filter(Boolean).map(x => `<li>${esc(L(x, TD_LANG))}</li>`).join("") || `<li class="mut">Қадамдар жоқ</li>`; };
  $("#f-steps").oninput = pv; pv();
  m.querySelectorAll("[data-pv]").forEach(b => b.onclick = () => { TD_LANG = b.dataset.pv; m.querySelectorAll("[data-pv]").forEach(x => x.classList.toggle("on", x === b)); pv(); });
  $("#f-exsel").onchange = () => { $("#f-exurl").style.display = $("#f-exsel").value === "__url" ? "" : "none"; };
  $("#mx").onclick = () => m.remove();
  const rs = $("#mreset"); if (rs) rs.onclick = () => { m.remove(); o.onReset && o.onReset(); };
  const lines = id => $(id).value.split("\n").map(x => x.trim()).filter(Boolean);
  $("#msave").onclick = () => {
    const title = $("#f-title").value.trim(), steps = lines("#f-steps");
    if (!title) { toast("Атауын жазыңыз"); return; }
    if (!steps.length) { toast("Кемінде бір қадам жазыңыз"); return; }
    const sel = $("#f-exsel").value, url = $("#f-exurl").value.trim();
    if (sel === "__url" && url && !/^https?:\/\//.test(url)) { toast("Сілтеме https:// деп басталуы керек"); return; }
    const nt = Object.assign({}, t, {title, min: Math.min(60, Math.max(1, +$("#f-min").value || 6)), steps, crit: lines("#f-crit"), hints: lines("#f-hints"), ai: lines("#f-ai"), vp: lines("#f-vp"), ex: sel === "__url" ? url : sel, edited: !!bankItem});
    m.remove(); o.onSave(nt);
  };
}
function PlanEditor(plan0, onDone, opts) {
  opts = opts || {}; const used = new Set(opts.used || []);
  let plan = JSON.parse(JSON.stringify(plan0));
  const w = document.createElement("div"); w.className = "ed"; w.id = "ed"; document.body.appendChild(w);
  const totalMin = () => plan.reduce((a, t) => a + (+t.min || 0), 0);
  function draw() {
    const inPlan = new Set(plan.map(t => t.id));
    w.innerHTML = `<div class="edtop"><div><div class="kicker">${opts.add ? t_("Жүріп жатқан практикаға қосу", "Добавить в идущую практику") : "Практика"}</div><h2 class="disp" style="margin:0;font-size:32px">${opts.add ? t_("Жаңа тапсырмалар", "Новые задания") : "Тапсырмалар"}: ${plan.length} · ${totalMin()} мин</h2></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">${opts.add ? `<button class="btn ghost" id="edcancel">${t_("Болдырмау", "Отмена")}</button>` : ""}<button class="btn ghost" id="edadd">+ Өз тапсырмаңыз</button>${opts.add ? "" : `<button class="btn ghost" id="eddef">Әдепкіге қайтару</button>`}<button class="btn" id="edok">${opts.add ? t_("Студенттерге қосу", "Добавить студентам") : "Дайын"}</button></div></div>
      <div class="edcols">
        <div class="edlist"><div class="edh">Сабақта (реті бойынша)</div>
          ${plan.map((t, i) => `<div class="edrow">
              <span class="n">${i + 1}</span>${t.ex ? `<img src="${esc(exUrl(t.ex))}" alt="" onerror="this.style.visibility='hidden'">` : `<span class="noimg"></span>`}
              <div class="tt"><b>${lvlB(t.lvl)}${esc(t.title)}</b><span class="mut">${t.id && t.id.indexOf("custom") === 0 ? "өз тапсырмаңыз" : t.edited ? "өзгертілген" : "банктен"} · ${(t.steps || []).length} қадам</span></div>
              <div class="mins"><button data-a="minus" data-i="${i}" aria-label="Азайту">−</button><span>${t.min} мин</span><button data-a="plus" data-i="${i}" aria-label="Көбейту">+</button></div>
              <button class="ib" data-a="up" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="Жоғары">↑</button><button class="ib" data-a="down" data-i="${i}" ${i === plan.length - 1 ? "disabled" : ""} aria-label="Төмен">↓</button>
              <button class="ib" data-a="edit" data-i="${i}" aria-label="Өңдеу">✎</button><button class="ib del" data-a="del" data-i="${i}" aria-label="Өшіру">✕</button>
            </div>`).join("") || `<p class="mut">Тапсырма таңдалмаған. Оң жақтағы банктен қосыңыз.</p>`}
        </div>
        <div class="edbank"><div class="edh">Тапсырмалар банкі · ${COURSE.bank.length}</div><div class="bgrid">
          ${COURSE.bank.map(b => `<div class="bcard ${inPlan.has(b.id) ? "on" : ""}">${b.ai && b.ai.length ? `<span class="aib">🤖 ЖИ</span>` : ""}${b.ex ? `<img src="${esc(exUrl(b.ex))}" alt="${esc(b.title)}">` : `<div class="noimg2">${esc(b.title)}</div>`}<div class="bt"><b>${esc(b.title)}</b><span class="mut">${lvlB(b.lvl)} ${b.min} мин</span></div>
            <button class="btn ${inPlan.has(b.id) ? "ghost" : ""}" data-add="${b.id}" ${inPlan.has(b.id) ? "disabled" : ""}>${inPlan.has(b.id) ? "✓ Қосылған" : used.has(b.id) ? "+ " + t_("Тағы бір рет (практикада бар)", "Ещё раз (уже было)") : "+ Қосу"}</button></div>`).join("")}
        </div></div>
      </div>`;
    $("#edok").onclick = () => { if (!plan.length) { toast("Кемінде 1 тапсырма таңдаңыз"); return; } onDone(plan); w.remove(); };
    if ($("#eddef")) $("#eddef").onclick = () => { plan = defaultPlan(); draw(); };
    if ($("#edcancel")) $("#edcancel").onclick = () => w.remove();
    $("#edadd").onclick = () => edit(-1);
    w.querySelectorAll("[data-add]").forEach(b => b.onclick = () => { const t = fromBank(b.dataset.add); if (t) { plan.push(t); draw(); } });
    w.querySelectorAll("[data-a]").forEach(b => b.onclick = () => {
      const i = +b.dataset.i, a = b.dataset.a;
      if (a === "minus") plan[i].min = Math.max(1, (+plan[i].min || 5) - 1);
      if (a === "plus") plan[i].min = Math.min(60, (+plan[i].min || 5) + 1);
      if (a === "up" && i > 0) [plan[i - 1], plan[i]] = [plan[i], plan[i - 1]];
      if (a === "down" && i < plan.length - 1) [plan[i + 1], plan[i]] = [plan[i], plan[i + 1]];
      if (a === "del") plan.splice(i, 1);
      if (a === "edit") return edit(i);
      draw();
    });
  }
  function edit(i) {
    const t = i >= 0 ? plan[i] : {uid: rid(6), id: "custom-" + rid(5), title: "", min: 6, steps: [], crit: [], ex: ""};
    TaskDialog(t, w, {isNew: i < 0, canReset: i >= 0,
      onReset: () => { const f = fromBank(t.id); f.uid = t.uid; plan[i] = f; draw(); },
      onSave: nt => { if (i >= 0) plan[i] = nt; else plan.push(nt); draw(); }});
  }
  draw();
}

/* ===================== ЖҮРГІЗУШІ (мұғалім) ===================== */
function Host() {
  let H = store.get("host");
  const fresh = () => ({room: rid(5, "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"), b: +(PARAMS.get("b") || 0), lang: store.get("lang") || "ru", plan: store.get("plan") || defaultPlan(), set: "quiz", phase: "lobby", qi: -1, players: {}, ans: {}, counts: [0, 0, 0, 0], qEnd: 0, feed: [], prevRank: {}, subs: {}, grades: {}, rates: {}, chk: {}, mix: "after", thr: [100, 150, 200], fs: {}, items: null, fid: "", hideMarks: false, cmts: {}});
  if (!H || !H.room || !SETS[H.set]) H = fresh();
  if (!Array.isArray(H.plan) || !H.plan.length) H.plan = store.get("plan") || defaultPlan();
  if (!H.lang) H.lang = "ru";
  if (!H.thr) H.thr = [100, 150, 200]; if (!H.mix) H.mix = "after"; if (!H.fs) H.fs = {};
  const IMG = {}, IMGF = {};
  const FREE = () => H.set === "free";
  const fItem = i => (H.items || [])[i];
  const fSt = (pid, i) => { const a = H.fs[pid] = H.fs[pid] || []; return a[i] = a[i] || {}; }; /* pid -> dataURL (ағымдағы тапсырма) */
  let client = null, tick = null, pubTimer = null, connectedOnce = false, lb = null;
  const save = () => store.set("host", H);
  const RS = () => H.set === "quiz" ? COURSE.quiz : H.set === "free" ? (H.items || []) : H.plan.map(toRound), total = () => RS().length, R = () => RS()[H.qi];
  const setName = k => SETS[k].name(k === "quiz" ? COURSE.quiz.length : H.plan.length);
  function buildFree() {
    const hk = (COURSE.hotkeys || []).map(q => Object.assign({type: "mc"}, q)), items = [];
    const take = id => { if (!hk.length) return null; let i = hk.findIndex(q => q.for && q.for.includes(id)); if (i < 0) i = hk.findIndex(q => !q.for); if (i < 0) return null; return hk.splice(i, 1)[0]; };
    H.plan.forEach((t, i) => { const r = toRound(t, i); r.k = t_((i + 1) + "-тапсырма", "Задание " + (i + 1)) + " · " + t.min + " " + t_("мин", "мин"); items.push(r);
      if (H.mix === "after") { const q = take(t.id); if (q) items.push(Object.assign(q, {k: t_("Пернелер сұрағы", "Вопрос по горячим клавишам")})); } });
    if (H.mix === "end") hk.forEach(q => items.push(Object.assign(q, {k: t_("Пернелер сұрағы", "Вопрос по горячим клавишам")})));
    return items;
  }
  function fTryDone(pid, i) {
    const it = fItem(i), s = fSt(pid, i); if (!it || s.d) return;
    if (it.type === "task") {
      if (it.checks.length && !(s.ok && s.ok.length && s.ok.every(Boolean))) return;
      if (it.shot && !s.sub) return;
      if (!it.checks.length && !s.sub) return;
      s.d = NOW(); if (!s.o) s.o = s.d; if (s.d < s.o) s.d = s.o;
      s.sec = Math.round((s.d - s.o) / 1000); s.ag = autoGrade(s.sec, it.t, H.thr);
      addFeed("ok", `<b>${esc(H.players[pid].name)}</b>: ${esc(it.title)} — ${mmss(s.sec)}`);
    }
  }
  function startFree() {
    H.items = buildFree(); H.fid = rid(5); H.fs = {}; H.phase = "free"; H.fstart = Date.now(); H.feed = [];
    for (const k in IMGF) delete IMGF[k];
    save(); pubItems(); pubState(); pids().forEach(pubPlayer); render();
  }
  function pubItems() { if (H.items) pub("items", {fid: H.fid, items: H.items, thr: H.thr}, true); }
  const rk = () => H.set + ":" + H.qi;
  const pids = () => Object.keys(H.players);
  let MT = null; /* хабарламаның нақты уақыты (мұғалім офлайн болса — студент жіберген сәт) */
  const NOW = () => MT || Date.now();
  const leftMs = () => H.paused ? (H.pauseLeft || 0) : Math.max(0, H.qEnd - NOW());
  const msgTime = m => { const now = Date.now(); if (m && typeof m.ago === "number" && m.ago >= 0) return now - Math.min(m.ago, 20 * 60000); const h = m && +m.hat; return h && h <= now + 3000 && h >= now - 20 * 60000 ? Math.min(now, h) : now; };
  const joinUrl = () => { const u = new URL(location.href); u.search = ""; u.hash = ""; u.searchParams.set("r", H.room); if (H.b) u.searchParams.set("b", H.b); if (PARAMS.get("broker")) u.searchParams.set("broker", PARAMS.get("broker")); return u.toString(); };
  const newPlayer = name => ({name, score: 0, streak: 0, done: 0, pw: {fr: 1, x2: 1, ff: 1, sh: 1}, x2on: false, hide: null, frozen: null, last: null, note: null});
  const subPids = () => Object.keys(H.subs).filter(id => H.players[id]).sort((a, b) => H.subs[b].left - H.subs[a].left);

  function start() {
    client && client.end(true);
    connectedOnce = false;
    client = connect(H.b, c => { connectedOnce = true; c.subscribe([T(H.room) + "i", T(H.room) + "img/+", T(H.room) + "img/+/+"], {qos: 1}); c.publish(T(H.room) + "hb", JSON.stringify({on: 1, t: Date.now()}), {qos: 1, retain: true}); if (FREE() && H.items) pubItems(); pubState(); pids().forEach(pubPlayer); }, (t, m) => { MT = msgTime(m); try { onMsg(t, m); } finally { MT = null; } },
      {keepalive: 10, will: {topic: T(H.room) + "hb", payload: JSON.stringify({on: 0}), qos: 1, retain: true}});
    setTimeout(() => { if (!connectedOnce && H.phase === "lobby") render(); }, 9000);
    save(); render();
    clearInterval(tick); tick = setInterval(onTick, 200);
    clearInterval(pubTimer); pubTimer = setInterval(() => { if (H.phase === "question" || H.phase === "vote") pubState(); if (H.phase === "free" && !lb && !document.querySelector(".fset")) { const t = $("#ftime"); if (t) t.textContent = mmss((Date.now() - H.fstart) / 1000); document.querySelectorAll("[data-run]").forEach(e => { e.textContent = mmss((Date.now() - +e.dataset.run) / 1000); }); } }, 1000);
  }
  function pub(topic, obj, retain) { if (client && client.connected) client.publish(T(H.room) + topic, JSON.stringify(obj), {qos: 1, retain: !!retain}); }
  function ranked() { return pids().sort((a, b) => H.players[b].score - H.players[a].score || H.players[a].name.localeCompare(H.players[b].name)); }
  function addFeed(kind, html) { H.feed.unshift({k: kind, h: html}); H.feed = H.feed.slice(0, 7); }
  function note(pid, text) { const p = H.players[pid]; if (p) p.note = {id: rid(6), t: text}; }
  function togglePause() {
    if (H.phase !== "question") return;
    if (H.paused) { H.qEnd = Date.now() + (H.pauseLeft || 0); H.paused = false; } else { H.pauseLeft = leftMs(); H.paused = true; }
    save(); pubState(); render();
  }

  function pubState() {
    const st = {v: 3, now: Date.now(), set: H.set, lang: H.lang, setName: setName(H.set), phase: H.phase, qi: H.qi, total: total(), n: pids().length, answered: isTask(R()) ? Object.keys(H.subs).length : Object.keys(H.ans).length};
    if (isTask(R()) && H.phase !== "lobby" && !FREE()) { st.task = R(); st.tv = H.tv || 0; }
    if (FREE()) { st.fid = H.fid; st.nItems = (H.items || []).length; }
    if (H.refl && H.refl.on) st.refl = {id: H.refl.id};
    if (H.phase === "question") { st.endsIn = leftMs(); st.paused = !!H.paused; st.roster = ranked().slice(0, 40).map(id => [id, H.players[id].name]); }
    if (H.phase === "vote") st.cands = subPids().map(id => [id, H.players[id].name]);
    pub("s", st, true);
  }
  function pubPlayer(pid) {
    const p = H.players[pid]; if (!p) return;
    const r = ranked();
    pub("p/" + pid, {ack: ((H.mids || {})[pid] || []).slice(-40), name: p.name, score: p.score, rank: r.indexOf(pid) + 1, of: r.length, streak: p.streak, pw: p.pw, x2on: p.x2on ? rk() : "", hide: p.hide, frozen: p.frozen, last: p.last,
      locked: H.ans[pid] ? {set: H.set, qi: H.qi, a: H.ans[pid].a} : null,
      sub: H.subs[pid] ? {k: rk(), left: H.subs[pid].left} : null, chk: H.chk && H.chk[pid] ? Object.assign({k: rk(), place: place(pid)}, H.chk[pid]) : null, grade: H.grades[pid] ? {k: rk(), g: H.grades[pid]} : null, rates: {k: rk(), m: (H.rates || {})[pid] || {}},
      cm: H.cmts && H.cmts[pid] ? {k: rk(), t: H.cmts[pid]} : null,
      fs: FREE() ? {fid: H.fid, s: H.fs[pid] || [], hide: false, now: Date.now(), p100: H.items ? fScore(pid).final : null} : null,
      rf: H.refl && H.refls && H.refls[pid] ? H.refl.id : null,
      note: p.note, kicked: !!p.kicked}, true);
  }

  function onMsg(topic, m) {
    if (topic.indexOf("/img/") > 0) { const parts = topic.split("/"); const ii = parts.indexOf("img"); if (parts.length - ii === 3) return onImgFree(parts[ii + 1], +parts[ii + 2], m); return onImg(parts.pop(), m); }
    if (!m || typeof m.pid !== "string" || m.pid.length > 40) return;
    const pid = m.pid, p = H.players[pid];
    if (m.mid && p) { H.mids = H.mids || {}; const ml = H.mids[pid] = H.mids[pid] || []; if (ml.includes(m.mid)) { pubPlayer(pid); return; } ml.push(m.mid); if (ml.length > 60) ml.splice(0, ml.length - 60); }
    if (m.t === "join") {
      const name = String(m.name || "").replace(/\s+/g, " ").trim().slice(0, 18);
      if (!name) return;
      if (p) { pubPlayer(pid); pubState(); return; }
      if (H.phase === "final") return;
      const taken = new Set(Object.values(H.players).map(x => x.name.toLowerCase()));
      let nm = name, k = 2; while (taken.has(nm.toLowerCase())) nm = name + " " + (k++);
      H.players[pid] = newPlayer(nm);
      save(); pubPlayer(pid); pubState(); render(); return;
    }
    if (m.t === "refl" && p) {
      if (!H.refl || !H.refl.on || m.rid !== H.refl.id) { pubPlayer(pid); return; }
      H.refls = H.refls || {}; H.refls[pid] = {c: ["g", "y", "r"].includes(m.c) ? m.c : "y", a: (Array.isArray(m.a) ? m.a : []).slice(0, 3).map(x => String(x == null ? "" : x).slice(0, 300)), t: Date.now()};
      save(); pubPlayer(pid); reflDraw(); if (!reflW) render(); return;
    }
    if (!p || m.set !== H.set) return;
    if (FREE()) { onFreeMsg(pid, p, m); return; }
    const r = R();
    if (m.t === "chk") {
      const r2 = R();
      if (H.phase !== "question" || m.qi !== H.qi || !isTask(r2) || !r2.checks.length || !Array.isArray(m.vals)) return;
      if (!H.paused && NOW() > H.qEnd + 1500) return;
      H.chk = H.chk || {};
      const c = H.chk[pid] = H.chk[pid] || {ok: [], tries: 0, wrong: 0};
      if (c.fin != null) { pubPlayer(pid); return; }
      c.ok = r2.checks.map((ch, i) => checkOk(ch, m.vals[i]));
      c.tries++; if (!c.ok.every(Boolean)) c.wrong++;
      tryFinish(pid, r2);
      save(); pubPlayer(pid); pubState(); render(); return;
    }
    if (m.t === "rate") {
      const v = m.v | 0;
      if (H.phase !== "vote" || m.qi !== H.qi || !H.subs[m.to] || m.to === pid || v < 1 || v > 5) return;
      H.rates = H.rates || {}; (H.rates[pid] = H.rates[pid] || {})[m.to] = v;
      save(); pubPlayer(pid); pubState(); render(); return;
    }
    if (m.t === "ans" && r && r.type === "mc") {
      if (H.phase !== "question" || m.qi !== H.qi || H.ans[pid]) { pubPlayer(pid); return; }
      if (!H.paused && NOW() > H.qEnd + 400) { pubPlayer(pid); return; }
      const a = m.a | 0; if (a < 0 || a > 3) return;
      if (p.hide && p.hide.k === rk() && p.hide.idx.includes(a)) return;
      H.ans[pid] = {a, ok: a === r.c, left: leftMs()}; H.counts[a]++;
      save(); pubPlayer(pid); pubState();
      if (Object.keys(H.ans).length >= pids().length) reveal(); else render();
      return;
    }
    if (m.t === "pw" && r && r.type === "mc") {
      if (H.phase !== "question" || m.qi !== H.qi) return;
      if (H.ans[pid]) { note(pid, "Жауап берген соң бонус қолданылмайды"); pubPlayer(pid); return; }
      if (m.k === "x2" && p.pw.x2 > 0 && !p.x2on) { p.pw.x2--; p.x2on = true; addFeed("x2", `<b>${esc(p.name)}</b> екі есе ұпайға ойнап жатыр`); }
      else if (m.k === "ff" && p.pw.ff > 0 && !(p.hide && p.hide.k === rk())) {
        const wrong = [0, 1, 2, 3].filter(i => i !== r.c).sort(() => Math.random() - .5).slice(0, 2);
        p.pw.ff--; p.hide = {k: rk(), idx: wrong}; addFeed("ff", `<b>${esc(p.name)}</b> 50/50 қолданды`);
      } else if (m.k === "fr" && p.pw.fr > 0) {
        const tp = H.players[m.target];
        if (!tp || m.target === pid) return;
        if (H.ans[m.target]) { note(pid, tp.name + " жауап беріп қойды — мұздату сақталды"); pubPlayer(pid); return; }
        if (tp.frozen && tp.frozen.k === rk()) { note(pid, tp.name + " қазір де мұзда тұр"); pubPlayer(pid); return; }
        p.pw.fr--;
        if (tp.pw.sh > 0) { tp.pw.sh--; note(m.target, p.name + " сізді мұздатқысы келді — қалқан қорғады!"); note(pid, tp.name + " қалқанмен қорғанды"); addFeed("sh", `<b>${esc(tp.name)}</b> қалқанмен <b>${esc(p.name)}</b> мұзын тойтарды`); }
        else { tp.frozen = {id: rid(6), k: rk(), by: p.name}; note(pid, tp.name + " мұздатылды!"); addFeed("fr", `<b>${esc(p.name)}</b> → <b>${esc(tp.name)}</b> мұздатты`); }
        pubPlayer(m.target);
      } else return;
      save(); pubPlayer(pid); render();
    }
  }
  function place(pid) { const c = H.chk && H.chk[pid]; if (!c || c.fin == null) return 0; return 1 + Object.values(H.chk).filter(x => x.fin != null && x.fin > c.fin).length; }
  function tryFinish(pid, r) {
    const c = H.chk && H.chk[pid]; if (!c || c.fin != null || !r.checks.length) return;
    if (!c.ok.length || !c.ok.every(Boolean) || (r.shot && !H.subs[pid])) return;
    c.fin = leftMs(); const pl = place(pid), p = H.players[pid];
    addFeed("ok", t_(`<b>${esc(p.name)}</b> ${pl}-орында аяқтады`, `<b>${esc(p.name)}</b> финишировал ${pl}-м`));
    note(pid, t_(`Дайын! Сіздің орныңыз: ${pl}`, `Готово! Ваше место: ${pl}`));
  }
  function onFreeMsg(pid, p, m) {
    if (H.phase !== "free" || m.fid !== H.fid) return;
    const i = m.i | 0, it = fItem(i); if (!it) return;
    const s = fSt(pid, i);
    if (m.t === "fopen") { if (!s.o) s.o = NOW(); p.cur = i; }
    else if (m.t === "fchk" && it.type === "task" && it.checks.length && Array.isArray(m.vals)) {
      if (s.d) { pubPlayer(pid); return; }
      if (!s.o) s.o = NOW();
      s.ok = it.checks.map((ch, j) => checkOk(ch, m.vals[j])); s.tries = (s.tries || 0) + 1; if (!s.ok.every(Boolean)) s.wrong = (s.wrong || 0) + 1;
      fTryDone(pid, i);
    } else if (m.t === "fmc" && it.type === "mc") {
      if (s.a != null) { pubPlayer(pid); return; }
      const a = m.a | 0; if (a < 0 || a >= it.a.length) return;
      s.a = a; s.c = a === it.c; s.d = NOW(); if (!s.o) s.o = s.d;
    } else return;
    save(); pubPlayer(pid); fRender();
  }
  function onImgFree(pid, i, m) {
    if (!FREE() || !m || m.fid !== H.fid || typeof m.data !== "string" || m.data.slice(0, 23) !== "data:image/jpeg;base64," || m.data.length > 400000) return;
    const p = H.players[pid], it = fItem(i); if (!p || !it || it.type !== "task") return;
    (IMGF[pid] = IMGF[pid] || {})[i] = m.data;
    const s = fSt(pid, i);
    if (Array.isArray(m.self)) s.self = m.self.slice(0, 12).map(Boolean);
    if (s.subId !== m.id && H.phase === "free") { s.subId = m.id; s.sub = true; if (!s.o) s.o = NOW(); fTryDone(pid, i); save(); pubPlayer(pid); }
    fRender();
  }
  let fTimer = null;
  function fRender() { if (fTimer) return; fTimer = setTimeout(() => { fTimer = null; if (lb) drawFlb(); else if (!document.querySelector(".fset")) render(); }, 250); }
  function onImg(pid, m) {
    if (!m || typeof m.data !== "string" || m.data.slice(0, 23) !== "data:image/jpeg;base64," || m.data.length > 400000) return;
    const p = H.players[pid]; if (!p || m.set !== H.set || m.qi !== H.qi || !isTask(R())) return;
    if (H.subs[pid] && H.subs[pid].id === m.id) { IMG[pid] = m.data; render(); return; } /* қайта жеткізілген (retain) */
    if (H.phase !== "question") return;
    if (!H.paused && NOW() > H.qEnd + 1500) { note(pid, "Уақыт бітті — жұмыс қабылданбады"); pubPlayer(pid); return; }
    const first = !H.subs[pid];
    H.subs[pid] = {id: m.id, left: first ? leftMs() : H.subs[pid].left, self: Array.isArray(m.self) ? m.self.slice(0, 12).map(Boolean) : null};
    IMG[pid] = m.data;
    if (first && !R().checks.length) addFeed("ok", `<b>${esc(p.name)}</b> жұмысын жіберді`);
    tryFinish(pid, R());
    save(); pubPlayer(pid); pubState(); render();
  }

  function startQ() {
    if (H.qi + 1 >= total()) return finish();
    H.qi++; H.phase = "question"; H.ans = {}; H.counts = [0, 0, 0, 0]; H.feed = []; H.subs = {}; H.grades = {}; H.cmts = {}; H.rates = {}; H.chk = {}; H.paused = false;
    for (const k in IMG) delete IMG[k];
    for (const id of pids()) { const p = H.players[id]; p.x2on = false; p.hide = null; p.frozen = null; }
    H.qEnd = Date.now() + R().t * 1000;
    save(); pubState(); pids().forEach(pubPlayer); render();
  }
  function reveal() {
    if (H.phase !== "question") return;
    H.paused = false; lb = null;
    const r = R();
    if (isTask(r)) { H.phase = "review"; save(); pubState(); pids().forEach(pubPlayer); render(); return; }
    const T0 = r.t * 1000;
    H.prevRank = {}; ranked().forEach((id, i) => H.prevRank[id] = i);
    for (const id of pids()) {
      const p = H.players[id], a = H.ans[id];
      if (a && a.ok) {
        let pts = Math.round(500 + 500 * Math.min(1, a.left / T0)) + Math.min(p.streak, 3) * 100;
        if (p.x2on) pts *= 2;
        p.streak++; p.score += pts; p.last = {k: rk(), ok: true, pts, a: a.a};
        if (p.streak % 3 === 0) { p.pw.fr++; note(id, p.streak + " рет қатарынан дұрыс! +1 мұздату"); }
      } else { p.streak = 0; p.last = {k: rk(), ok: false, pts: 0, a: a ? a.a : null}; }
      p.x2on = false;
    }
    H.phase = "reveal"; save(); pubState(); pids().forEach(pubPlayer); render();
  }
  function stats() { const st = {}; Object.values(H.rates || {}).forEach(m => Object.keys(m).forEach(to => { const x = st[to] = st[to] || {n: 0, sum: 0}; x.n++; x.sum += m[to]; })); Object.values(st).forEach(x => x.avg = Math.round(x.sum / x.n * 10) / 10); return st; }
  const avgTxt = x => x ? `★ ${String(x.avg).replace(".", ",")} · ${x.n}` : "";
  function makeThumb(data) {
    return new Promise(res => { const im = new Image(); im.onload = () => { const k = Math.min(1, 560 / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", .72)); }; im.onerror = () => res(null); im.src = data; });
  }
  async function startVote() {
    H.phase = "vote"; H.rates = {}; save(); pubState(); pids().forEach(pubPlayer); render();
    const k = rk();
    for (const id of subPids()) { if (!IMG[id]) continue; const t = await makeThumb(IMG[id]); if (t && H.phase === "vote" && rk() === k) pub("th/" + id, {k, name: H.players[id] ? H.players[id].name : "", data: t}, true); }
  }
  function finalizeTask() {
    const r = R(), T0 = r.t * 1000, st = stats(), max = Math.max(0, ...Object.values(st).map(x => x.avg));
    H.prevRank = {}; ranked().forEach((id, i) => H.prevRank[id] = i);
    for (const id of pids()) {
      const p = H.players[id], s = H.subs[id];
      if (r.checks.length) {
        const c = (H.chk || {})[id], g = H.grades[id] || "ok", pl = place(id);
        let pts = 0;
        if (c && c.fin != null) { pts = Math.round(500 + 500 * Math.min(1, c.fin / T0)) - Math.min(200, 25 * (c.wrong || 0)) + (pl === 1 ? 300 : pl === 2 ? 200 : pl === 3 ? 100 : 0); p.done = (p.done || 0) + 1; }
        else if (c && c.ok.length && c.ok.every(Boolean)) pts = 300;
        else if (s || (c && c.ok.some(Boolean))) pts = 150;
        if (g === "best") pts += 500; if (g === "redo") pts = Math.min(pts, 150);
        const fav = g !== "zero" && max > 0 && st[id] && st[id].avg === max; if (fav) pts += 300;
        if (g === "zero") { if (c && c.fin != null) p.done = Math.max(0, (p.done || 1) - 1); pts = 0; }
        if (!s && !c) { p.last = {k: rk(), ok: false, pts: 0, none: true}; continue; }
        p.score += pts; p.last = {k: rk(), ok: !!(c && c.fin != null), pts, g, place: pl, avg: st[id] ? st[id].avg : 0, fav}; continue;
      }
      if (!s) { p.last = {k: rk(), ok: false, pts: 0, none: true}; continue; }
      const g = H.grades[id] || "ok";
      let pts = 0;
      if (g === "zero") pts = 0;
      else if (g !== "redo") { pts = Math.round(500 + 500 * Math.min(1, s.left / T0)); if (g === "best") pts += 500; p.done = (p.done || 0) + 1; }
      else pts = 200;
      const fav = g !== "zero" && max > 0 && st[id] && st[id].avg === max;
      if (fav) pts += 300;
      p.score += pts; p.last = {k: rk(), ok: g !== "redo", pts, g, avg: st[id] ? st[id].avg : 0, fav};
    }
    H.phase = "board"; save(); pubState(); pids().forEach(pubPlayer); render();
  }
  function board() { H.phase = "board"; save(); pubState(); render(); }
  function finish() { H.phase = "final"; save(); pubState(); pids().forEach(pubPlayer); render(); }
  function toSet(set) {
    H.set = set; H.phase = "lobby"; H.qi = -1; H.ans = {}; H.counts = [0, 0, 0, 0]; H.feed = []; H.prevRank = {}; H.subs = {}; H.grades = {}; H.cmts = {}; H.rates = {}; H.chk = {}; H.fs = {}; H.items = null;
    for (const id of pids()) { const n = H.players[id].name; H.players[id] = newPlayer(n); }
    save(); pubState(); pids().forEach(pubPlayer); render();
  }
  function next() {
    if (lb) return;
    if (H.phase === "lobby") { if (pids().length) (FREE() ? startFree() : startQ()); }
    else if (H.phase === "free") return;
    else if (H.phase === "question") reveal();
    else if (H.phase === "reveal") { if (SETS[H.set].quick) (H.qi + 1 >= total() ? board() : startQ()); else board(); }
    else if (H.phase === "review") finalizeTask();
    else if (H.phase === "vote") { H.phase = "review"; save(); pubState(); render(); }
    else if (H.phase === "board") (H.qi + 1 >= total() ? finish() : startQ());
  }
  function onTick() {
    if (H.phase !== "question") return;
    const left = H.paused ? H.pauseLeft : H.qEnd - Date.now();
    const t = $("#htime"), b = $("#hbar");
    if (t) t.textContent = fmtTime(Math.max(0, Math.ceil(left / 1000)));
    if (b) b.style.transform = `scaleX(${Math.max(0, left / (R().t * 1000))})`;
    if (!H.paused && left <= 0) reveal();
  }
  document.addEventListener("keydown", e => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") return;
    if (flb) {
      const d = $("#lb");
      if (e.code === "Escape") { flb = null; if (d) d.remove(); render(); }
      else if (e.code === "ArrowRight" && d && d._step) { e.preventDefault(); d._step(1); }
      else if (e.code === "ArrowLeft" && d && d._step) { e.preventDefault(); d._step(-1); }
      else if (/^Digit[2-5]$/.test(e.code)) fSetGrade(e.code.slice(5)); else if (e.code === "Digit0") fSetGrade("0"); else if (e.code === "KeyA") fSetGrade("auto");
      return;
    }
    if (lb) {
      if (e.code === "Escape") { closeLb(); }
      else if (e.code === "ArrowRight") { e.preventDefault(); stepLb(1); }
      else if (e.code === "ArrowLeft") { e.preventDefault(); stepLb(-1); }
      else if (e.code === "Digit1") grade("ok"); else if (e.code === "Digit2") grade("best"); else if (e.code === "Digit3") grade("redo"); else if (e.code === "Digit4" || e.code === "Digit0") grade("zero");
      return;
    }
    if (e.target.tagName === "BUTTON") return;
    if (e.code === "Space" || e.code === "Enter" || e.code === "ArrowRight") { e.preventDefault(); next(); }
    if (e.code === "KeyP") { e.preventDefault(); togglePause(); }
  });

  /* ---- галерея / лайтбокс ---- */
  function openLb(id) { lb = id; drawLb(); }
  function closeLb() { lb = null; const d = $("#lb"); if (d) d.remove(); render(); }
  function stepLb(dir) { const L = subPids(); if (!L.length) return; const i = L.indexOf(lb); lb = L[(i + dir + L.length) % L.length]; drawLb(); }

  const QCM = () => [t_("Жарайсың!", "Отлично!"), t_("Ұқыпты орындалған", "Аккуратно выполнено"), t_("Түзету керек", "Нужно доработать"), t_("Тапсырманы қайта оқы", "Перечитай задание"), t_("Скриншот анық емес", "Скриншот нечёткий"), t_("Мерзімнен кешікті", "Не уложился во время"), t_("Жұмыс өзіңдікі емес — 0", "Работа не твоя — 0")];
  function cmBox(val) {
    return `<div class="lbcm"><textarea id="lbcm" maxlength="400" rows="2" placeholder="${t_("Студентке пікір (ол телефоннан бірден көреді)…", "Комментарий студенту (он сразу увидит его на телефоне)…")}">${esc(val || "")}</textarea>
      <div class="lbcmr"><div class="qcm">${QCM().map(q => `<button class="chipb" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div><span class="mut" id="lbcmst" style="font-size:13px">${val ? "✓ " + t_("жіберілді", "отправлено") : ""}</span><button class="btn" id="lbcms">💬 ${t_("Жіберу", "Отправить")}</button></div></div>`;
  }
  function bindCm(saveFn) {
    const ta = $("#lbcm"), st = $("#lbcmst"); if (!ta) return;
    const go = () => { saveFn(ta.value.replace(/\s+$/,"").slice(0, 400)); st.textContent = "✓ " + t_("жіберілді", "отправлено"); };
    $("#lbcms").onclick = go;
    ta.oninput = () => { st.textContent = t_("сақталмаған", "не отправлено"); };
    ta.onkeydown = e => { e.stopPropagation(); if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); go(); } if (e.key === "Escape") ta.blur(); };
    document.querySelectorAll(".lbcm .chipb").forEach(b => b.onclick = () => { const q = b.dataset.q; ta.value = ta.value.trim() ? ta.value.trim() + " " + q : q; go(); });
  }
  function grade(g) { if (!lb) return; H.grades[lb] = g; save(); pubPlayer(lb); drawLb(); }
  function drawLb() {
    let d = $("#lb"); if (!d) { d = document.createElement("div"); d.id = "lb"; d.className = "lb"; document.body.appendChild(d); }
    const p = H.players[lb], L = subPids(), i = L.indexOf(lb), g = H.grades[lb], st = stats();
    d.innerHTML = `<div class="lbtop"><span class="lbn">${esc(p ? p.name : "")}</span><span class="mut">${i + 1} / ${L.length}${st[lb] ? ` · ${avgTxt(st[lb])} баға` : ""}</span><button class="btn ghost" id="lbx">Жабу · Esc</button></div>
      <div class="lbimg">${IMG[lb] ? `<img src="${IMG[lb]}" alt="${esc(p ? p.name : "")} жұмысы">` : `<div class="mut">Сурет жүктелуде…</div>`}</div>${selfLine(R().crit, H.subs[lb] && H.subs[lb].self)}
      <div class="lbbar"><button class="btn ghost" id="lbp">←</button>
        <div style="display:flex;gap:10px">${Object.keys(GRADE).map((k, j) => `<button class="btn grade ${g === k || (!g && k === "ok") ? "on" : ""}" data-g="${k}" style="--gc:${GRADE[k].c}">${j + 1} · ${k === "ok" ? "✓ " : k === "best" ? "★ " : k === "zero" ? "⛔ " : "↺ "}${GRADE[k].t}</button>`).join("")}</div>
        <button class="btn ghost" id="lbn">→</button></div>${cmBox((H.cmts || {})[lb])}`;
    bindCm(t => { if (!lb) return; H.cmts = H.cmts || {}; if (t) H.cmts[lb] = t; else delete H.cmts[lb]; save(); pubPlayer(lb); });
    $("#lbx").onclick = closeLb; $("#lbp").onclick = () => stepLb(-1); $("#lbn").onclick = () => stepLb(1);
    d.querySelectorAll(".grade").forEach(b => b.onclick = () => grade(b.dataset.g));
  }


  function kickPlayer(id) {
    const p = H.players[id]; if (!p) return;
    p.kicked = true; pubPlayer(id);
    for (const k of ["ans", "subs", "chk", "fs", "rates", "grades", "cmts", "ovr", "votes", "mids"]) if (H[k] && typeof H[k] === "object") delete H[k][id];
    if (H.rates) for (const v of Object.values(H.rates)) if (v && typeof v === "object") delete v[id];
    if (typeof IMG !== 'undefined') delete IMG[id]; if (typeof IMGF !== 'undefined') delete IMGF[id];
    delete H.players[id]; save(); pubState(); render();
  }
  function PeopleModal() {
    const old = document.querySelector(".pmod"); if (old) old.remove();
    const w = document.createElement("div"); w.className = "pmod";
    const draw = () => {
      const ids = Object.keys(H.players).sort((a, b) => H.players[a].name.localeCompare(H.players[b].name));
      w.innerHTML = `<div class="pmbox"><div class="pmtop"><h3>${t_("Ойыншылар", "Участники")} · ${ids.length}</h3><button class="btn ghost" data-x="1">${t_("Жабу", "Закрыть")}</button></div>
        <p class="pmnote">${t_("Шығарылған ойыншы осы құрылғыдан қайта кірсе, жаңа ойыншы ретінде қосылады. Оның осы ойындағы нәтижелері өшеді.", "Удалённый участник, если зайдёт снова, появится как новый. Его результаты в этой игре удаляются.")}</p>
        <div class="pmlist">${ids.map(id => `<div class="pmrow"><span>${esc(H.players[id].name)}</span><button class="btn ghost pmdel" data-k="${id}">${t_("Шығару", "Удалить")}</button></div>`).join("") || `<p class="pmnote">${t_("Ойыншы жоқ", "Участников нет")}</p>`}</div></div>`;
      w.querySelector("[data-x]").onclick = () => w.remove();
      w.onclick = e => { if (e.target === w) w.remove(); };
      w.querySelectorAll(".pmdel").forEach(b => b.onclick = () => {
        if (b.dataset.c !== "1") { b.dataset.c = "1"; b.textContent = t_("Растау?", "Точно?"); b.classList.add("warn"); setTimeout(() => { if (b.isConnected) { b.dataset.c = ""; b.textContent = t_("Шығару", "Удалить"); b.classList.remove("warn"); } }, 3000); return; }
        const nm = H.players[b.dataset.k] ? H.players[b.dataset.k].name : ""; kickPlayer(b.dataset.k); toast(nm + " — " + t_("шығарылды", "удалён")); draw(); });
    };
    document.body.appendChild(w); draw();
  }
  function QrFull() {
    const w = document.createElement("div"); w.className = "qrfull";
    w.innerHTML = `<div class="qrin">${qrSvg(joinUrl())}</div><div><div class="lbl">${t_("Ойын коды", "Код игры")}</div><div class="code" style="font-size:clamp(60px,9vw,140px)">${H.room}</div><p class="mut" style="font-size:20px;max-width:420px">${t_("Телефон камерасымен сканерлеңіз. Жабу үшін кез келген жерді басыңыз.", "Наведите камеру телефона. Нажмите в любом месте, чтобы закрыть.")}</p><div class="count" style="margin-top:20px">${pids().length} ${t_("ойыншы қосылды", "подключились")}</div></div>`;
    w.onclick = () => w.remove(); document.body.appendChild(w);
  }
  /* ---------- Рефлексия ---------- */
  let reflW = null;
  function reflDraw() {
    if (!reflW || !reflW.isConnected) { reflW = null; return; }
    const on = H.refl && H.refl.on, R0 = H.refls || {}, ids = Object.keys(R0).filter(id => H.players[id]), C = REFC();
    const cnt = {g: 0, y: 0, r: 0}; ids.forEach(id => cnt[R0[id].c] = (cnt[R0[id].c] || 0) + 1);
    const n = Math.max(1, ids.length);
    reflW.innerHTML = `<div class="edbox" style="max-width:1100px"><div class="edtop" style="margin:0"><div><div class="kicker">${t_("Рефлексия", "Рефлексия")}</div><h3 class="disp" style="margin:0;font-size:30px">${on ? t_("Студенттер жауап беріп жатыр", "Студенты отвечают") : H.refl ? t_("Рефлексия жабылды", "Рефлексия закрыта") : t_("Сабақ соңындағы рефлексия", "Рефлексия в конце занятия")} · ${ids.length} / ${pids().length}</h3></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${on ? `<button class="btn ghost" id="rfstop">■ ${t_("Жинауды тоқтату", "Остановить сбор")}</button>` : `<button class="btn" id="rfgo">▶ ${H.refl ? t_("Қайта бастау", "Начать заново") : t_("Студенттерге жіберу", "Отправить студентам")}</button>`}${ids.length ? `<button class="btn ghost" id="rfcsv">⬇ CSV</button>` : ""}<button class="btn ghost" id="rfx">${t_("Жабу", "Закрыть")}</button></div></div>
      <div class="rfbars">${["g", "y", "r"].map(k => `<div class="rfb"><div class="rfl"><i style="background:${C[k].c}"></i>${C[k].t}</div><div class="tr"><i style="width:${cnt[k] / n * 100}%;background:${C[k].c}"></i></div><b>${cnt[k]}</b></div>`).join("")}</div>
      <div class="rflist">${ids.sort((a, b) => R0[b].t - R0[a].t).map(id => `<div class="rfi"><div class="rfn"><i style="background:${(C[R0[id].c] || C.y).c}"></i>${esc(H.players[id].name)}</div>${R0[id].a.map((x, i) => x ? `<div class="rfa"><span class="mut">${esc(REFQ()[i])}</span> ${esc(x)}</div>` : "").join("")}</div>`).join("") || `<p class="mut">${on ? t_("Жауаптарды күтудеміз…", "Ждём ответы…") : t_("Басқанда студенттердің телефонында бағдаршам мен 3 сұрақ ашылады.", "После запуска у студентов откроется светофор и 3 вопроса.")}</p>`}</div></div>`;
    const go = $("#rfgo"); if (go) go.onclick = () => { H.refl = {id: rid(5), on: true}; H.refls = {}; save(); pubState(); reflDraw(); };
    const st = $("#rfstop"); if (st) st.onclick = () => { H.refl.on = false; save(); pubState(); reflDraw(); };
    const cv = $("#rfcsv"); if (cv) cv.onclick = () => downloadBlob(new Blob(["\ufeff" + reflCsv()], {type: "text/csv;charset=utf-8"}), safeName(TITLE) + " — " + t_("рефлексия", "рефлексия") + ".csv");
    $("#rfx").onclick = () => { reflW.remove(); reflW = null; };
  }
  function reflCsv() { const q = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`, C = REFC(), R0 = H.refls || {};
    return [[t_("Студент", "Студент"), t_("Бағдаршам", "Светофор"), ...REFQ()], ...Object.keys(R0).filter(id => H.players[id]).map(id => [H.players[id].name, (C[R0[id].c] || C.y).t, ...R0[id].a])].map(r => r.map(q).join(";")).join("\r\n"); }
  function ReflModal() { if (reflW) reflW.remove(); reflW = document.createElement("div"); reflW.className = "edm fset"; document.body.appendChild(reflW); reflDraw(); }
  function ctlBar(primary, extra, left) {
    return `<div class="hctl"><div style="display:flex;gap:10px;align-items:center"><button class="btn ghost" id="reset">${t_("Жаңа ойын", "Новая игра")}</button><button class="btn ghost" id="reflb">🪞 ${t_("Рефлексия", "Рефлексия")}${H.refl && H.refl.on ? " ●" : ""}</button>${H.phase !== "lobby" ? `<button class="btn ghost" id="people">${t_("👥 Ойыншылар", "👥 Участники")} (${Object.keys(H.players).length})</button>` : ""}${left || ""}</div><div style="display:flex;gap:10px">${extra || ""}${primary ? `<button class="btn" id="next">${primary}</button>` : ""}</div></div>`;
  }
  function bind() {
    const pp = $("#people"); if (pp) pp.onclick = PeopleModal;
    const rb = $("#reflb"); if (rb) rb.onclick = ReflModal;
    const n = $("#next"); if (n) n.onclick = next;
    const r = $("#reset"); if (r) r.onclick = () => {
      if (r.dataset.c !== "1") { r.dataset.c = "1"; r.textContent = "Растау: код пен ойыншылар өшеді"; setTimeout(() => { r.dataset.c = ""; r.textContent = "Жаңа ойын"; }, 3000); return; }
      pub("s", {v: 3, phase: "closed"}, true); H = fresh(); start();
    };
    const tp = $("#topractice"); if (tp) tp.onclick = () => toSet("practice");
    const pz = $("#pause"); if (pz) pz.onclick = togglePause;
    const te = $("#tedit"); if (te) te.onclick = () => { const t = H.plan[H.qi]; if (!t) return;
      TaskDialog(t, document.body, {head: t_("Нұсқаулықты өзгерту", "Изменить инструкцию"), note: t_("Сақтағаннан кейін студенттердің экранында бірден жаңарады. Уақыт өзгерсе — келесі тапсырмадан бастап әсер етеді.", "После сохранения инструкция сразу обновится у студентов. Изменение времени не влияет на уже идущий таймер."), saveLabel: t_("Сақтау және жіберу", "Сохранить и отправить"),
        onSave: nt => { H.plan[H.qi] = nt; H.tv = (H.tv || 0) + 1; save(); pubState(); render(); toast(t_("Нұсқаулық жаңартылды", "Инструкция обновлена")); }}); };
    const vt = $("#vote"); if (vt) vt.onclick = startVote;
    const en = $("#endnow"); if (en) en.onclick = () => { if (en.dataset.c !== "1") { en.dataset.c = "1"; en.textContent = "Растау"; setTimeout(() => { en.dataset.c = ""; en.textContent = "Аяқтау"; }, 3000); return; } finish(); };
    document.querySelectorAll(".thumb[data-p]").forEach(t => t.onclick = () => openLb(t.dataset.p));
  }
  function side(done, n) {
    return `<div class="side"><div><div class="big">${done}<span class="mut" style="font-size:24px"> / ${n}</span></div><div class="mut" style="font-size:15px;margin-top:6px">жауап берді</div></div>
      <div class="feed">${H.feed.map(e => `<div class="ev ${e.k}">${e.h}</div>`).join("") || `<div class="mut" style="font-size:14px">Мұздату, 50/50 және ×2 осында көрінеді</div>`}</div></div>`;
  }
  function race(r) {
    const C = H.chk || {}, ids = pids().sort((a, b) => { const A = C[a] || {}, B = C[b] || {};
      if ((A.fin != null) !== (B.fin != null)) return A.fin != null ? -1 : 1;
      if (A.fin != null) return B.fin - A.fin;
      return ((B.ok || []).filter(Boolean).length + (H.subs[b] ? 1 : 0)) - ((A.ok || []).filter(Boolean).length + (H.subs[a] ? 1 : 0)); });
    const T0 = r.t * 1000;
    return `<div class="race">${ids.map(id => { const c = C[id] || {}, pl = place(id);
      return `<div class="rrow ${c.fin != null ? "fin" : ""}"><span class="rp">${pl || ""}</span><span class="rn">${esc(H.players[id].name)}</span>
        <span class="rd">${r.checks.map((x, i) => `<i class="${c.ok && c.ok[i] ? "g" : c.ok && c.ok.length ? "b" : ""}"></i>`).join("")}${r.shot ? `<i class="cam ${H.subs[id] ? "g" : ""}">▣</i>` : ""}</span>
        <span class="rt">${c.fin != null ? (x => Math.floor(x / 60) + ":" + String(x % 60).padStart(2, "0"))(Math.round((T0 - c.fin) / 1000)) : c.tries ? c.tries + "×" : ""}</span></div>`; }).join("")}</div>`;
  }
  function gallery(big) {
    const L = subPids(), st = stats();
    if (!L.length) return `<div class="mut" style="font-size:18px;padding:30px 0">Әзірге жұмыс жоқ…</div>`;
    return `<div class="gal ${big ? "big" : ""}">${L.map(id => { const g = H.grades[id];
      return `<button class="thumb" data-p="${id}">${IMG[id] ? `<img src="${IMG[id]}" alt="${esc(H.players[id].name)}">` : `<span class="ph">…</span>`}
        <span class="cap"><span>${esc(H.players[id].name)}</span>${st[id] ? `<b>${avgTxt(st[id])}</b>` : ""}${g && g !== "ok" ? `<i style="background:${GRADE[g].c}">${g === "best" ? "★" : g === "zero" ? "0" : "↺"}</i>` : ""}</span></button>`; }).join("")}</div>`;
  }

  /* ---------- Еркін режим: мониторинг ---------- */
  let flb = null;
  const fGrade = s => s && s.d ? (s.tg || s.ag || null) : (s && s.tg) || null;
  const P100 = () => H.p100 = Object.assign({map: {5: 100, 4: 85, 3: 70, 2: 50}, zero: true, hkW: 0}, H.p100 || {});
  const LET = x => x >= 95 ? "A" : x >= 90 ? "A-" : x >= 85 ? "B+" : x >= 80 ? "B" : x >= 75 ? "B-" : x >= 70 ? "C+" : x >= 65 ? "C" : x >= 60 ? "C-" : x >= 55 ? "D+" : x >= 50 ? "D" : "F";
  const TRAD = x => x >= 90 ? t_("үздік", "отлично") : x >= 75 ? t_("жақсы", "хорошо") : x >= 50 ? t_("қанағат.", "удовл.") : t_("қанағат. емес", "неудовл.");
  function fScore(pid) {
    const c = P100(), items = H.items || [], st = H.fs[pid] || [];
    const used = i => pids().some(id => fGrade((H.fs[id] || [])[i]));
    const pts = items.map((it, i) => { if (it.type !== "task" || it.off || !used(i)) return undefined; const g = fGrade(st[i]); return g ? (+c.map[g] || 0) : (c.zero ? 0 : null); }).filter(x => x !== undefined && x !== null);
    const mcs = items.map((it, i) => it.type === "mc" && !it.off && pids().some(id => ((H.fs[id] || [])[i] || {}).a != null) ? st[i] || {} : null).filter(Boolean);
    const tScore = pts.length ? pts.reduce((a, b) => a + b, 0) / pts.length : 0;
    const w = mcs.length ? Math.max(0, Math.min(100, +c.hkW || 0)) / 100 : 0;
    const hkPct = mcs.length ? mcs.filter(x => x.c).length / mcs.length * 100 : 0;
    const auto = Math.round(tScore * (1 - w) + hkPct * w);
    const ovr = H.ovr && H.ovr[pid] != null ? H.ovr[pid] : null;
    return {auto, final: ovr != null ? ovr : auto, ovr};
  }
  function fRow(pid) {
    const items = H.items || [], st = H.fs[pid] || [];
    const g = items.map((it, i) => it.type === "task" && !it.off ? fGrade(st[i]) : null).filter(Boolean).map(Number);
    const mcs = items.map((it, i) => it.type === "mc" && !it.off ? st[i] : undefined).filter(x => x !== undefined);
    return {avg: g.length ? Math.round(g.reduce((a, b) => a + b, 0) / g.length * 10) / 10 : null, hk: mcs.filter(x => x && x.c).length, hkN: mcs.length, done: items.filter((it, i) => !it.off && st[i] && st[i].d).length, n: items.filter(it => !it.off).length};
  }
  function freeTable() {
    const items = H.items || [], hide = H.hideMarks;
    const ids = pids().sort((a, b) => H.players[a].name.localeCompare(H.players[b].name));
    let tn = 0;
    const heads = items.map((it, i) => it.off ? "" : it.type === "task" ? `<th class="thed" data-ed="${i}" title="${esc(it.title)} — ${t_("басып, нұсқаулықты өзгертіңіз", "нажмите, чтобы изменить инструкцию")}">${++tn}${it.lvl ? `<sup class="lv l${it.lvl}">${it.lvl}</sup>` : ""}<small>${esc(it.title.slice(0, 14))}</small></th>` : `<th class="q" title="${esc(L(it.q, H.lang))}">⌨</th>`).join("");
    const rows = ids.map(id => { const p = H.players[id], st = H.fs[id] || [], rr = fRow(id);
      const cells = items.map((it, i) => { const x = st[i] || {};
        if (it.off) return "";
        if (it.type === "mc") return `<td class="q ${x.a == null ? "" : x.c ? "ok" : "no"}">${x.a == null ? (x.o ? "…" : "") : x.c ? "✓" : "✗"}</td>`;
        const g = fGrade(x), dots = it.checks.length && x.ok ? `<span class="fd">${x.ok.map(o => `<i class="${o ? "g" : "b"}"></i>`).join("")}</span>` : "";
        if (x.d) return `<td class="t done ${x.tg ? "tgr" : ""}" data-c="${id}:${i}">${hide ? "✓" : `<b class="g${g}">${g}</b>`}<small>${mmss(x.sec || 0)}</small>${x.sub ? "<em>▣</em>" : ""}${x.cm ? "<i class=\"cmi\">💬</i>" : ""}${x.self && it.crit.length ? `<small class="sfm" title="${t_("Өзін-өзі бағалау", "Самооценка")}">◐ ${x.self.filter(Boolean).length}/${it.crit.length}</small>` : ""}</td>`;
        if (x.o) return `<td class="t run" data-c="${id}:${i}"><small data-run="${x.o}">${mmss((Date.now() - x.o) / 1000)}</small>${dots}${x.sub ? "<em>▣</em>" : ""}${x.tg && !hide ? `<b class="g${x.tg}">${x.tg}</b>` : ""}${x.cm ? "<i class=\"cmi\">💬</i>" : ""}</td>`;
        return `<td class="t"></td>`; }).join("");
      return `<tr><th class="nm">${esc(p.name)}${p.cur != null && items[p.cur] ? `<small>→ ${items[p.cur].type === "task" ? items.slice(0, p.cur + 1).filter(x => x.type === "task" && !x.off).length : "⌨"}</small>` : ""}</th>${cells}<td class="sum" data-s="${id}">${hide ? rr.done + "/" + rr.n : (sc => `<b class="${sc.ovr != null ? "ovr" : ""}">${sc.final}</b><span class="mut">/100 ${LET(sc.final)}</span>`)(fScore(id))}<small>${hide ? "" : (rr.avg == null ? "—" : t_("орт. ", "ср. ") + String(rr.avg).replace(".", ","))}${rr.hkN ? ` · ⌨ ${rr.hk}/${rr.hkN}` : ""}</small></td></tr>`; }).join("");
    return `<div class="fwrap"><table class="fm"><thead><tr><th class="nm">${t_("Студент", "Студент")}</th>${heads}<th class="sum">${t_("Қорытынды /100", "Итог /100")}</th></tr></thead><tbody>${rows || `<tr><td class="mut" colspan="${items.filter(x => !x.off).length + 2}" style="padding:20px">${t_("Ойыншылар жоқ", "Нет участников")}</td></tr>`}</tbody></table></div>`;
  }
  function renderFree() {
    const fin = H.phase === "final";
    const head = `<div class="htop"><span class="tag">${TITLE} · ${SETS.free.short}</span><span class="tag">${pids().length} ${t_("ойыншы", "участников")}</span></div>`;
    app.innerHTML = `<div class="host fhost">${head}
      <div class="ftop"><div><div class="kicker">${fin ? t_("Аяқталды", "Завершено") : t_("Еркін практика жүріп жатыр", "Идёт свободная практика")}</div>
        <h2 class="qtext" style="font-size:34px">${t_("Уақыт", "Прошло")}: <span id="ftime">${mmss(((fin ? H.fend : Date.now()) - H.fstart) / 1000)}</span></h2>
        <div class="mut" style="font-size:14px;margin-top:4px">${t_("Бағалау уақыт бойынша", "Оценка по времени")}: 5 ≤ ${H.thr[0]}% · 4 ≤ ${H.thr[1]}% · 3 ≤ ${H.thr[2]}% ${t_("нормадан", "от нормы")} · ${t_("ұяшықты басып — өз бағаңыз", "клик по ячейке — ваша оценка")}</div></div>
        <div class="fbtns"><button class="btn ghost" id="fadd">+ ${t_("Тапсырма қосу", "Добавить задание")}</button><button class="btn ghost" id="fitems">✂ ${t_("Тапсырмалар", "Задания")}${items0Off() ? " (−" + items0Off() + ")" : ""}</button><button class="btn ghost" id="f100">⚙ ${t_("100 балл", "100 баллов")}</button><button class="btn ghost" id="fhide">${H.hideMarks ? t_("👁 Бағаларды көрсету", "👁 Показать оценки") : t_("👁 Бағаларды жасыру", "👁 Скрыть оценки")}</button>
          <button class="btn ghost" id="fzip">⬇ ${t_("Барлық жұмыстар (ZIP)", "Все работы (ZIP)")}</button><button class="btn ghost" id="fcsv">⬇ ${t_("Журнал (CSV)", "Журнал (CSV)")}</button></div></div>
      ${items0Off() ? `<div class="offban">${t_("Алынған тапсырмалар", "Убрано заданий/вопросов")}: <b>${items0Off()}</b> — ${t_("олардың скриншоттары мен бағалары кестеде, журналда және ZIP-те көрсетілмейді.", "их скриншоты и оценки не показываются в таблице, журнале и ZIP.")} <button class="btn ghost" id="offall">↩ ${t_("Барлығын қайтару", "Вернуть все")}</button></div>` : ""}
      ${freeTable()}
      ${ctlBar("", fin ? `<button class="btn ghost" id="freopen">${t_("Қайта ашу", "Открыть снова")}</button>` : `<button class="btn" id="fend">${t_("Практиканы аяқтау", "Завершить практику")}</button>`)}</div>`;
    $("#f100").onclick = P100Settings; $("#fitems").onclick = ItemsEditor; $("#fadd").onclick = AddTasks; document.querySelectorAll("th.thed").forEach(th => th.onclick = () => editItemLive(+th.dataset.ed)); const oa = $("#offall"); if (oa) oa.onclick = () => { (H.items || []).forEach(it => delete it.off); save(); pubItems(); pubState(); pids().forEach(pubPlayer); render(); };
    document.querySelectorAll("td.sum[data-s]").forEach(td => td.onclick = () => OvrEditor(td.dataset.s));
    $("#fhide").onclick = () => { H.hideMarks = !H.hideMarks; save(); pids().forEach(pubPlayer); render(); };
    $("#fzip").onclick = zipAll; $("#fcsv").onclick = () => downloadBlob(new Blob(["﻿" + journalCsv()], {type: "text/csv;charset=utf-8"}), safeName(TITLE) + " — журнал.csv");
    const fe = $("#fend"); if (fe) fe.onclick = () => { if (fe.dataset.c !== "1") { fe.dataset.c = "1"; fe.textContent = t_("Растау: аяқтау", "Точно завершить?"); setTimeout(() => { fe.dataset.c = ""; fe.textContent = t_("Практиканы аяқтау", "Завершить практику"); }, 3000); return; }
      H.phase = "final"; H.fend = Date.now(); save(); pubState(); pids().forEach(pubPlayer); render(); };
    const fr = $("#freopen"); if (fr) fr.onclick = () => { H.phase = "free"; save(); pubState(); render(); };
    document.querySelectorAll("td[data-c]").forEach(td => td.onclick = () => { const [pid, i] = td.dataset.c.split(":"); flb = {pid, i: +i}; drawFlb(); });
  }
  function drawFlb() {
    if (!flb) return;
    let d = $("#lb"); if (!d) { d = document.createElement("div"); d.id = "lb"; d.className = "lb"; document.body.appendChild(d); }
    const it = fItem(flb.i), p = H.players[flb.pid], x = fSt(flb.pid, flb.i), img = (IMGF[flb.pid] || {})[flb.i];
    d.innerHTML = `<div class="lbtop"><span class="lbn">${esc(p ? p.name : "")}</span><span class="mut">${esc(it.title)}${x.d ? ` · ${mmss(x.sec)} · ${t_("уақыт бағасы", "оценка по времени")}: ${x.ag}` : x.o ? ` · ${t_("орындап жатыр", "в процессе")}` : ""}${x.tries ? ` · ${t_("тексеру", "проверок")}: ${x.tries}` : ""}</span><button class="btn ghost" id="lbx">${t_("Жабу · Esc", "Закрыть · Esc")}</button></div>
      <div class="lbimg">${img ? `<img src="${img}" alt="">` : `<div class="mut">${t_("Скриншот әлі жоқ", "Скриншота пока нет")}</div>`}</div>${selfLine(it.crit, x.self)}
      ${it.checks.length ? `<div class="mut" style="font-size:15px">${it.checks.map((c, j) => `${x.ok && x.ok[j] ? "✓" : x.ok ? "✗" : "·"} ${esc(L(c.l, H.lang))}`).join(" &nbsp; ")}</div>` : ""}
      <div class="lbbar"><button class="btn ghost" id="lbp">←</button>
        <div style="display:flex;gap:10px;align-items:center"><span class="mut">${t_("Сіздің бағаңыз", "Ваша оценка")}:</span>${[5, 4, 3, 2, 0].map(g => `<button class="btn grade g${g} ${x.tg != null && String(x.tg) === String(g) ? "on" : ""}" data-g="${g}" style="--gc:var(--g${g})" ${g === 0 ? `title="${t_("Есептелмейді (көшірген, алдаған)", "Не засчитано (списал, обман)")}"` : `title="«${g}»"`}>${g ? P100().map[g] : 0}</button>`).join("")}<button class="btn grade ${!x.tg ? "on" : ""}" data-g="auto" style="--gc:var(--mut)">${t_("Авто", "Авто")}${x.ag ? " (" + x.ag + ")" : ""}</button></div>
        <button class="btn ghost" id="lbn">→</button></div>${cmBox(x.cm)}`;
    bindCm(t => { if (!flb) return; const y = fSt(flb.pid, flb.i); y.cm = t || null; y.cmId = t ? Date.now() : null; save(); pubPlayer(flb.pid); });
    $("#lbx").onclick = () => { flb = null; d.remove(); render(); };
    const others = pids().filter(id => { const y = (H.fs[id] || [])[flb.i]; return y && (y.o || y.sub); }).sort((a, b) => H.players[a].name.localeCompare(H.players[b].name));
    const step = k => { if (!others.length) return; const j = others.indexOf(flb.pid); flb.pid = others[(j + k + others.length) % others.length]; drawFlb(); };
    $("#lbp").onclick = () => step(-1); $("#lbn").onclick = () => step(1);
    d.querySelectorAll(".grade").forEach(b => b.onclick = () => fSetGrade(b.dataset.g));
    d._step = step;
  }
  function fSetGrade(g) { if (!flb) return; const x = fSt(flb.pid, flb.i); x.tg = g === "0" || g === 0 ? "0" : (+g >= 2 && +g <= 5 ? +g : null); save(); pubPlayer(flb.pid); drawFlb(); }
  function P100Settings() {
    const c = P100(), w = document.createElement("div"); w.className = "edm fset"; document.body.appendChild(w);
    w.innerHTML = `<div class="edbox" style="max-width:620px"><h3 class="disp" style="margin:0;font-size:26px">${t_("100 баллдық бағалау", "Перевод в 100 баллов")}</h3>
      <p class="mut" style="margin:0;font-size:15px">${t_("Әр тапсырманың бағасы (сіздікі немесе уақыт бойынша) баллға айналады, қорытынды — орташасы. Студенттің жиынын басып, қолмен де қоюға болады.", "Оценка за каждое задание (ваша или по времени) переводится в баллы, итог — среднее по заданиям. Итог любого студента можно поправить вручную: нажмите на его ячейку «Итог».")}</p>
      <div class="ff"><label>${t_("Баға → балл", "Оценка → баллы")}</label><div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">${[5, 4, 3, 2].map(g => `«${g}» = <input id="p-${g}" type="number" min="0" max="100" value="${c.map[g]}" style="width:80px">`).join("")}</div></div>
      <label style="display:flex;gap:10px;align-items:center;font-size:15px"><input type="checkbox" id="p-zero" ${c.zero ? "checked" : ""} style="width:20px;height:20px"> ${t_("Тапсырылмаған тапсырма = 0 балл (белгісіз болса — есептелмейді)", "Несданное задание = 0 баллов (если снять галочку — не учитывается в среднем)")}</label>
      <div class="hint">${t_("Ешкім тапсырмаған тапсырмалар (сабақта жетпеген) есептелмейді.", "Задания, которые никто не сдал (не успели на паре), в итог не входят.")}</div>
      <div class="ff"><label>${t_("Пернелер сұрақтарының үлесі, %", "Доля вопросов по горячим клавишам в итоге, %")}</label><input id="p-hk" type="number" min="0" max="100" value="${c.hkW}" style="width:120px"><div class="hint">${t_("0 — тек тапсырмалар. 20 — қорытындының 20%-ы сұрақтардан.", "0 — только задания. 20 — пятая часть итога из вопросов.")}</div></div>
      <div class="hint">${t_("Әріптік баға: A 95–100, A- 90–94, B+ 85–89, B 80–84, B- 75–79, C+ 70–74, C 65–69, C- 60–64, D+ 55–59, D 50–54, F 0–49.", "Буквенная оценка: A 95–100, A- 90–94, B+ 85–89, B 80–84, B- 75–79, C+ 70–74, C 65–69, C- 60–64, D+ 55–59, D 50–54, F 0–49.")}</div>
      <div class="edtop" style="margin:0;justify-content:flex-end"><button class="btn ghost" id="p-x">${t_("Болдырмау", "Отмена")}</button><button class="btn" id="p-ok">${t_("Сақтау", "Сохранить")}</button></div></div>`;
    $("#p-x").onclick = () => w.remove();
    $("#p-ok").onclick = () => { const m = {}; [5, 4, 3, 2].forEach(g => m[g] = Math.max(0, Math.min(100, +$("#p-" + g).value || 0)));
      H.p100 = {map: m, zero: $("#p-zero").checked, hkW: Math.max(0, Math.min(100, +$("#p-hk").value || 0))}; save(); pids().forEach(pubPlayer); w.remove(); render(); };
  }
  function OvrEditor(pid) {
    const sc = fScore(pid), w = document.createElement("div"); w.className = "edm fset"; document.body.appendChild(w);
    w.innerHTML = `<div class="edbox" style="max-width:440px"><h3 class="disp" style="margin:0;font-size:24px">${esc(H.players[pid].name)}</h3>
      <div class="ff"><label>${t_("Қорытынды балл (0–100)", "Итог в баллах (0–100)")}</label><input id="o-v" type="number" min="0" max="100" value="${sc.final}" style="font-size:28px;font-weight:800;width:160px"></div>
      <div class="hint">${t_("Автоматты есептеу", "Автоматически")}: ${sc.auto}</div>
      <div class="edtop" style="margin:0;justify-content:flex-end"><button class="btn ghost" id="o-auto">${t_("Авто", "Авто")} (${sc.auto})</button><button class="btn ghost" id="o-x">${t_("Болдырмау", "Отмена")}</button><button class="btn" id="o-ok">${t_("Сақтау", "Сохранить")}</button></div></div>`;
    const inp = $("#o-v"); inp.focus(); inp.select();
    const done = v => { H.ovr = H.ovr || {}; if (v == null) delete H.ovr[pid]; else H.ovr[pid] = v; save(); pubPlayer(pid); w.remove(); render(); };
    $("#o-x").onclick = () => w.remove(); $("#o-auto").onclick = () => done(null);
    $("#o-ok").onclick = () => { const v = Math.round(+inp.value); if (!isFinite(v) || v < 0 || v > 100) { toast("0–100"); return; } done(v); };
    inp.onkeydown = e => { if (e.key === "Enter") $("#o-ok").click(); if (e.key === "Escape") w.remove(); };
  }
  function journalCsv() {
    const items = H.items || [], tasks = items.map((it, i) => [it, i]).filter(([it]) => it.type === "task" && !it.off);
    const q = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
    const c = P100();
    const head = [t_("Студент", "Студент"), ...tasks.flatMap(([it], n) => [`${n + 1}. ${it.title} — ${t_("уақыт", "время")}`, `${n + 1}. ${t_("баға", "оценка")}`, `${n + 1}. ${t_("балл", "баллы")}`, `${n + 1}. ${t_("пікір", "комментарий")}`, `${n + 1}. ${t_("өзін-өзі бағалау", "самооценка")}`]), t_("Орташа баға", "Средняя оценка"), t_("Пернелер (дұрыс)", "Горячие клавиши (верно)"), t_("Қорытынды (100)", "Итог (100)"), t_("Әріптік", "Буквенная"), t_("Дәстүрлі", "Традиционная")];
    const rows = pids().sort((a, b) => H.players[a].name.localeCompare(H.players[b].name)).map(id => { const st = H.fs[id] || [], rr = fRow(id), sc = fScore(id);
      return [H.players[id].name, ...tasks.flatMap(([it, i]) => { const x = st[i] || {}, g = fGrade(x); const used = pids().some(z => fGrade((H.fs[z] || [])[i])); return [x.d ? mmss(x.sec) : "", g || "", g ? (+c.map[g] || 0) : (c.zero && used ? 0 : ""), x.cm || "", x.self && it.crit.length ? x.self.filter(Boolean).length + "/" + it.crit.length : ""]; }), rr.avg == null ? "" : String(rr.avg).replace(".", ","), rr.hkN ? rr.hk + "/" + rr.hkN : "", sc.final, LET(sc.final), TRAD(sc.final)]; });
    return [head, ...rows].map(r => r.map(q).join(";")).join("\r\n");
  }



  function editItemLive(i) {
    const r = (H.items || [])[i]; if (!r || r.type !== "task") return;
    const t = {id: r.id || "", title: r.title, min: Math.round(r.t / 60), steps: r.steps, crit: r.crit, ex: r.ex, hints: r.hints, ai: r.ai, vp: r.vp, why: r.why};
    TaskDialog(t, document.body, {head: t_("Нұсқаулықты өзгерту", "Изменить инструкцию"), note: t_("Сақтағаннан кейін студенттердің экранында бірден жаңарады. Уақыт өзгерсе — уақыт бойынша баға жаңа нормамен есептеледі.", "После сохранения инструкция сразу обновится у студентов. Если изменить минуты — оценка по времени будет считаться по новой норме."), saveLabel: t_("Сақтау және жіберу", "Сохранить и отправить"),
      onSave: nt => { const n = (H.items || []).slice(0, i + 1).filter(x => x.type === "task").length;
        Object.assign(r, {title: nt.title, t: nt.min * 60, steps: nt.steps, crit: nt.crit, ex: nt.ex, hints: nt.hints, ai: nt.ai, vp: nt.vp, why: nt.why, k: t_(n + "-тапсырма", "Задание " + n) + " · " + nt.min + " " + t_("мин", "мин")});
        save(); pubItems(); render(); const w = document.querySelector(".fset"); if (w && w._draw) w._draw(); toast(t_("Нұсқаулық жаңартылды", "Инструкция обновлена")); }});
  }
  function AddTasks() {
    PlanEditor([], add => {
      if (!add.length) return;
      const items = H.items || [];
      add.forEach(t => { const n = items.filter(x => x.type === "task").length + 1, r = toRound(t, n - 1);
        r.k = t_(n + "-тапсырма", "Задание " + n) + " · " + t.min + " " + t_("мин", "мин"); r.added = Date.now(); r.id = t.id; items.push(r); });
      H.items = items; if (H.phase === "final") { H.phase = "free"; H.fend = null; }
      save(); pubItems(); pubState(); pids().forEach(pubPlayer); render();
      toast(t_(`${add.length} тапсырма қосылды`, `Добавлено заданий: ${add.length}`));
    }, {add: true, used: (H.plan || []).map(t => t.id).concat((H.items || []).map(x => x.id).filter(Boolean))});
  }
  const items0Off = () => (H.items || []).filter(x => x.off).length;
  function ItemsEditor() {
    const w = document.createElement("div"); w.className = "edm fset"; document.body.appendChild(w);
    const draw = () => {
      const items = H.items || []; let tn = 0;
      const did = i => pids().filter(id => { const x = (H.fs[id] || [])[i]; return x && (x.d || x.a != null || x.sub || x.tg); }).length;
      w.innerHTML = `<div class="edbox" style="max-width:640px"><h3 class="disp" style="margin:0;font-size:26px">${t_("Тапсырмаларды алып тастау", "Убрать задания и вопросы")}</h3>
        <p class="mut" style="margin:0;font-size:15px">${t_("Алынған тапсырмалар студенттерде жоғалады және бағаға, журналға, ZIP-ке кірмейді. Кез келген уақытта қайтаруға болады.", "Убранные задания и вопросы исчезнут у студентов и не войдут в оценку, журнал и ZIP. Вернуть можно в любой момент — ничего не удаляется насовсем.")}</p>
        <div class="itl">${items.map((it, i) => { const lbl = it.type === "task" ? (++tn) + ". " + esc(it.title) : "⌨ " + esc(L(it.q, H.lang)).slice(0, 70); const n = did(i);
          return `<div class="iti ${it.off ? "off" : ""}"><span>${lbl}</span><small class="mut">${n ? t_("орындаған", "сделали") + ": " + n : t_("ешкім орындамаған", "никто не делал")}</small>${it.type === "task" ? `<button class="btn ghost itb" data-ed="${i}" title="${t_("Нұсқаулықты өзгерту", "Изменить инструкцию")}">✎</button>` : ""}${it.off ? `<button class="btn ghost itb" data-on="${i}">↩ ${t_("Қайтару", "Вернуть")}</button>` : `<button class="btn ghost itb del" data-off="${i}" data-n="${n}">✕ ${t_("Алып тастау", "Убрать")}</button>`}</div>`; }).join("")}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost" id="it-unused">${t_("Ешкім жасамағандарды алу", "Убрать то, что никто не делал")}</button><button class="btn ghost" id="it-all">${t_("Барлығын қайтару", "Вернуть все")}</button><span style="flex:1"></span><button class="btn" id="it-ok">${t_("Дайын", "Готово")}</button></div></div>`;
      w.querySelectorAll("[data-on]").forEach(b => b.onclick = () => setOff([+b.dataset.on], false));
      w.querySelectorAll("[data-ed]").forEach(b => b.onclick = () => editItemLive(+b.dataset.ed));
      w.querySelectorAll("[data-off]").forEach(b => b.onclick = () => {
        if (+b.dataset.n > 0 && b.dataset.c !== "1") { b.dataset.c = "1"; b.textContent = t_(`Сенімдісіз бе? ${b.dataset.n} жұмыс жасырылады`, `Точно? Скроются работы: ${b.dataset.n}`); return; }
        setOff([+b.dataset.off], true); });
      $("#it-unused").onclick = () => setOff(items.map((it, i) => i).filter(i => !did(i)), true);
      $("#it-all").onclick = () => setOff(items.map((it, i) => i), false);
      $("#it-ok").onclick = () => w.remove();
    };
    const setOff = (idx, off) => {
      const items = H.items || [];
      const left = items.filter((it, i) => !(idx.includes(i) ? off : it.off)).length;
      if (!left) { toast(t_("Кемінде бір тапсырма қалуы керек", "Должно остаться хотя бы одно задание")); draw(); return; }
      idx.forEach(i => { if (items[i]) { if (off) items[i].off = true; else delete items[i].off; } });
      save(); pubItems(); pubState(); pids().forEach(pubPlayer); render(); draw();
    };
    w.onclick = e => { if (e.target === w) w.remove(); };
    w._draw = draw; draw();
  }
  async function zipAll() {
    if (typeof JSZip === "undefined") { toast(t_("ZIP кітапханасы жүктелмеді", "Не загрузилась библиотека ZIP")); return; }
    const zip = new JSZip(), items = H.items || [];
    zip.file(t_("журнал.csv", "журнал.csv"), "﻿" + journalCsv());
    if (H.refls && Object.keys(H.refls).length) zip.file(t_("рефлексия.csv", "рефлексия.csv"), "﻿" + reflCsv());
    let n = 0;
    for (const id of pids()) { const imgs = IMGF[id] || {}, folder = zip.folder(safeName(H.players[id].name));
      let tn = 0; items.forEach((it, i) => { if (it.type !== "task" || it.off) return; tn++; if (imgs[i]) { folder.file(String(tn).padStart(2, "0") + "_" + safeName(it.title) + ".jpg", dataToBytes(imgs[i])); n++; } }); }
    const blob = await zip.generateAsync({type: "blob"});
    downloadBlob(blob, safeName(TITLE) + ".zip"); toast(t_(`${n} жұмыс жүктелді`, `Скачано работ: ${n}`));
  }
  function FreeSettings() {
    const w = document.createElement("div"); w.className = "edm fset"; document.body.appendChild(w);
    const nHk = (COURSE.hotkeys || []).length;
    w.innerHTML = `<div class="edbox" style="max-width:640px"><h3 class="disp" style="margin:0;font-size:26px">${t_("Еркін практика баптаулары", "Настройки свободной практики")}</h3>
      <p class="mut" style="margin:0;font-size:15px">${t_("Әр студент өз қарқынымен жүреді: тапсырманы бітірген соң келесісіне өтеді. Баға уақытқа қарай қойылады, сіз оны өзгерте аласыз.", "Каждый идёт в своём темпе: сдал задание — переходит к следующему. Оценка ставится автоматически по времени, вы можете её изменить.")}</p>
      <div class="ff"><label>${t_("Пернелер сұрақтары", "Вопросы по горячим клавишам")} (${nHk})</label><select id="fs-mix">
        <option value="after" ${H.mix === "after" ? "selected" : ""}>${t_("Әр тапсырмадан кейін 1 сұрақ", "После каждого задания — 1 вопрос")}</option>
        <option value="end" ${H.mix === "end" ? "selected" : ""}>${t_("Барлығы соңында", "Все в конце")}</option>
        <option value="none" ${H.mix === "none" ? "selected" : ""}>${t_("Сұрақсыз", "Без вопросов")}</option></select></div>
      <div class="ff"><label>${t_("Уақыт бойынша баға (тапсырма нормасынан %)", "Оценка по времени (% от нормы задания)")}</label>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">«5» ≤ <input id="fs-t0" type="number" min="10" max="500" value="${H.thr[0]}" style="width:90px">% «4» ≤ <input id="fs-t1" type="number" min="10" max="600" value="${H.thr[1]}" style="width:90px">% «3» ≤ <input id="fs-t2" type="number" min="10" max="800" value="${H.thr[2]}" style="width:90px">% ${t_(", одан ұзақ — «2»", ", дольше — «2»")}</div>
        <div class="hint">${t_("Мысалы, 10 минуттық тапсырма: 10 мин-қа дейін — 5, 15-ке дейін — 4, 20-ға дейін — 3.", "Пример для задания на 10 минут: до 10 мин — 5, до 15 — 4, до 20 — 3, дольше — 2.")}</div></div>
      <div class="edtop" style="margin:0;justify-content:flex-end"><button class="btn ghost" id="fs-x">${t_("Болдырмау", "Отмена")}</button><button class="btn" id="fs-ok">${t_("Сақтау", "Сохранить")}</button></div></div>`;
    $("#fs-x").onclick = () => w.remove();
    $("#fs-ok").onclick = () => { const t = [0, 1, 2].map(i => Math.max(10, +$("#fs-t" + i).value || 100)).sort((a, b) => a - b);
      H.mix = $("#fs-mix").value; H.thr = t; save(); w.remove(); render(); };
  }
  function render() {
    if (lb) { drawLb(); return; }
    if (flb) { drawFlb(); return; }
    if (FREE() && (H.phase === "free" || H.phase === "final")) { renderFree(); bind(); return; }
    const head = `<div class="htop"><span class="tag">${TITLE} · ${SETS[H.set].short}</span><span class="tag">${H.phase === "lobby" || H.phase === "final" ? "" : `${H.qi + 1} / ${total()}`}</span></div>`;
    if (H.phase === "lobby") {
      const ps = pids();
      app.innerHTML = `<div class="host">${head}<div class="hbody"><div class="lobby">
        <div class="up">
          ${LESSON && LESSON.topic ? `<div class="kicker">${esc(LESSON.topic)}</div>` : ""}<h1 class="disp">${t_("Телефонмен қосылыңыз", "Подключайтесь с телефона")}</h1>
          <p class="mut" style="font-size:19px;margin:0;max-width:600px">${t_("QR-кодты камерамен сканерлеңіз немесе кодты енгізіңіз. Тапсырмаларды ", "Сканируйте QR-код камерой или введите код. Задания выполняете в ")}${esc(COURSE.tool.name)}${t_("-да орындайсыз.", ".")}</p>
          <div class="joinbox"><div class="jrow"><button class="qr" id="qrbig" title="${t_("Үлкейту", "Увеличить")}">${qrSvg(joinUrl())}</button><div style="min-width:0"><div class="lbl">${t_("Ойын коды", "Код игры")}</div><div class="code">${H.room}</div>
            <div class="lbl" style="margin-top:14px">${t_("Сілтеме", "Ссылка")}</div><div class="url">${esc(joinUrl().replace(/^https?:\/\//, ""))}</div></div></div>
            <div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap"><button class="btn ghost" id="copy">${t_("Сілтемені көшіру", "Копировать ссылку")}</button><button class="btn ghost" id="qrfull">⛶ QR ${t_("толық экранда", "на весь экран")}</button>
            ${!connectedOnce ? `<button class="btn ghost" id="srv">Басқа сервер (${H.b + 1}/${BROKERS.length})</button>` : ""}</div></div>
        </div>
        <div><div class="setrow" style="margin:0 0 14px"><span class="mut">${LANG_LABEL}</span><div class="mode" style="margin:0">${LANGS.map(([k, t]) => `<button data-lang="${k}" class="${H.lang === k ? "on" : ""}">${t}</button>`).join("")}</div>
            <button class="btn ghost" id="plan" style="height:40px;font-size:14px;margin-left:auto">✎ Тапсырмалар (${H.plan.length})</button>${FREE() ? `<button class="btn ghost" id="fset" style="height:40px;font-size:14px">⚙ ${t_("Баптау", "Настройки")}</button>` : ""}</div>
        ${goalBox(false)}<div class="plbox"><div class="count">${ps.length} ${t_("ойыншы", "участников")}</div>
          <div class="pl">${ps.map(id => `<button class="chip" data-k="${id}" title="Ойыннан шығару">${esc(H.players[id].name)}</button>`).join("") || `<span class="mut" style="font-size:18px">Ойыншыларды күтудеміз…</span>`}</div></div></div>
        </div></div>${ctlBar(ps.length ? "Бастау: " + SETS[H.set].short : "", "", `<div class="mode" style="margin:0">${Object.keys(SETS).map(k => `<button data-set="${k}" class="${H.set === k ? "on" : ""}">${setName(k)}</button>`).join("")}</div>`)}</div>`;
      $("#copy").onclick = () => { navigator.clipboard && navigator.clipboard.writeText(joinUrl()).then(() => toast(t_("Көшірілді", "Скопировано")), () => toast(t_("Көшіру мүмкін болмады", "Не удалось скопировать"))); };
      $("#qrfull").onclick = $("#qrbig").onclick = () => QrFull();
      const srv = $("#srv"); if (srv) srv.onclick = () => { H.b = (H.b + 1) % BROKERS.length; start(); };
      document.querySelectorAll(".mode button[data-set]").forEach(b => b.onclick = () => { if (H.set !== b.dataset.set) { H.set = b.dataset.set; save(); pubState(); render(); } });
      document.querySelectorAll(".mode button[data-lang]").forEach(b => b.onclick = () => { H.lang = b.dataset.lang; store.set("lang", H.lang); save(); pubState(); render(); });
      const fsb = $("#fset"); if (fsb) fsb.onclick = FreeSettings;
      $("#plan").onclick = () => PlanEditor(H.plan, plan => { H.plan = plan; store.set("plan", plan); save(); pubState(); render(); });
      document.querySelectorAll(".chip[data-k]").forEach(b => b.onclick = () => {
        const id = b.dataset.k; if (b.dataset.c !== "1") { b.dataset.c = "1"; b.textContent = "Шығару?"; setTimeout(render, 2500); return; }
        H.players[id].kicked = true; pubPlayer(id); delete H.players[id]; save(); pubState(); render(); });
    } else if ((H.phase === "question" || H.phase === "reveal") && !isTask(R())) {
      const r = R(), rv = H.phase === "reveal", n = pids().length, done = Object.keys(H.ans).length, left = leftMs();
      const max = Math.max(1, ...H.counts);
      const nextLbl = rv ? (H.qi + 1 >= total() ? "Нәтиже" : "Келесі сұрақ") : "Жауапты көрсету";
      app.innerHTML = `<div class="host">${head}<div class="hbody">
        <div class="qhead"><div style="flex:1"><h2 class="qtext">${esc(L(r.q, H.lang))}</h2></div><div style="text-align:right">${!rv && H.paused ? `<div class="kicker" style="color:var(--a2)">Кідірту</div>` : ""}<div class="timer" id="htime" style="${!rv && H.paused ? "color:var(--a2)" : ""}">${rv ? "" : fmtTime(Math.ceil(left / 1000))}</div></div></div>
        <div class="bar"><i id="hbar" style="transform:scaleX(${rv ? 0 : left / (r.t * 1000)})"></i></div>
        <div class="hgrid"><div class="tiles">${r.a.map((a, i) => `<div class="tile t${i} ${rv ? (i === r.c ? "win" : "off") : ""}">${SHAPES[i]}<span>${esc(L(a, H.lang))}</span>${rv ? `<span class="cnt">${H.counts[i]}</span><span class="fill" style="width:${H.counts[i] / max * 100}%"></span>` : ""}</div>`).join("")}</div>${side(done, n)}</div>
        </div>${ctlBar(nextLbl, rv ? "" : `<button class="btn ghost" id="pause">${H.paused ? "▶ Жалғастыру" : "❚❚ Кідірту"}</button>`)}</div>`;
    } else if (H.phase === "question") {
      const r = R(), left = leftMs(), n = pids().length, done = Object.keys(H.subs).length;
      app.innerHTML = `<div class="host">${head}<div class="hbody" style="justify-content:flex-start">
        <div class="qhead"><div style="flex:1"><div class="kicker">${esc(r.k)} ${lvlB(r.lvl)}</div><h2 class="qtext">${esc(r.title)}</h2>${whyBox(r)}</div><div style="text-align:right">${H.paused ? `<div class="kicker" style="color:var(--a2)">Кідірту</div>` : ""}<div class="timer" id="htime" style="${H.paused ? "color:var(--a2)" : ""}">${fmtTime(Math.ceil(left / 1000))}</div></div></div>
        <div class="bar"><i id="hbar" style="transform:scaleX(${left / (r.t * 1000)})"></i></div>
        <div class="tgrid">
          <div class="steps">${r.ex ? `<img class="exh" src="${esc(exUrl(r.ex))}" alt="Мысал" onerror="this.remove()">` : ""}<ol>${r.steps.map(s => `<li>${esc(L(s, H.lang))}</li>`).join("")}</ol>${r.crit && r.crit.length ? `<div class="crit">${r.crit.map(c => `<span>${esc(c)}</span>`).join("")}</div>` : ""}</div>
          <div>${r.checks.length ? race(r) : ""}<div class="count">${done} / ${n} жіберді</div>${gallery(false)}</div>
        </div></div>${ctlBar("Уақытты аяқтау", `<button class="btn ghost" id="tedit">✎ ${t_("Нұсқаулықты өзгерту", "Изменить инструкцию")}</button><button class="btn ghost" id="pause">${H.paused ? "▶ Жалғастыру" : "❚❚ Кідірту"}</button>`)}</div>`;
    } else if (H.phase === "review" || H.phase === "vote") {
      const r = R(), n = pids().length, L = subPids(), vote = H.phase === "vote", nv = Object.keys(H.rates || {}).length;
      app.innerHTML = `<div class="host">${head}<div class="hbody" style="justify-content:flex-start">
        <div class="qhead"><div style="flex:1"><div class="kicker">${esc(r.k)} · ${vote ? "өзара бағалау" : "жұмыстарды қарау"}</div><h2 class="qtext" style="font-size:clamp(26px,2.6vw,38px)">${vote ? "Телефоннан әр жұмысты 1–5 жұлдызбен бағалаңыз" : `${L.length} / ${n} жұмыс. Ашу үшін басыңыз`}</h2></div>${vote ? `<div class="timer" style="font-size:44px">${nv}<span class="mut" style="font-size:20px"> бағалады</span></div>` : ""}</div>
        <div style="margin-top:18px">${gallery(true)}</div>
        <p class="mut" style="font-size:14px;margin:14px 0 0">Бағалау: жұмысты ашып 1 — қабылданды, 2 — үздік, 3 — пысықтау. Белгіленбегендер «қабылданды» болып есептеледі.</p>
        </div>${ctlBar(vote ? "Бағалауды жабу" : "Ұпай беру", vote || !L.length ? "" : `<button class="btn ghost" id="vote">★ Өзара бағалау</button>`)}</div>`;
    } else if (H.phase === "board") {
      const rr = ranked().slice(0, 5), last = H.qi + 1 >= total(), task = isTask(R());
      app.innerHTML = `<div class="host">${head}<div class="hbody"><h2 class="h2">Көшбасшылар</h2><div class="board">
        ${rr.map((id, i) => { const p = H.players[id]; const up = H.qi > 0 && H.prevRank[id] != null && H.prevRank[id] > i;
          return `<div class="row ${i === 0 ? "first" : ""}" style="animation-delay:${i * .07}s"><span class="n">${i + 1}</span><span>${esc(p.name)}${p.last && p.last.pts ? `<span class="d">+${p.last.pts}</span>` : ""}${p.last && p.last.fav ? `<span class="d">★ сыныптастар таңдауы</span>` : ""}${up ? `<span class="d">▲</span>` : ""}</span><span class="sc">${p.score}</span></div>`; }).join("")}
        </div></div>${ctlBar(last ? "Нәтиже" : (task ? "Келесі тапсырма" : "Келесі"), last ? "" : `<button class="btn ghost" id="endnow">Аяқтау</button>`)}</div>`;
    } else if (H.phase === "final") {
      const rr = ranked(); const ord = [1, 0, 2], hs = [190, 260, 140];
      const isQuiz = H.set === "quiz";
      app.innerHTML = `<div class="host">${head}<div class="hbody"><h2 class="h2">${isQuiz ? "Квиз аяқталды" : "Практика жеңімпаздары"}</h2>
        <div class="podium">${ord.map((k, j) => rr[k] ? `<div class="pod"><div class="nm" style="animation-delay:${.6 + j * .15}s">${esc(H.players[rr[k]].name)}</div><div class="blk ${k === 0 ? "pl1" : ""}" style="height:${hs[j]}px;animation-delay:${j * .15}s"><span class="place">${k + 1}</span><span class="pts">${H.players[rr[k]].score} ұпай</span></div></div>` : "").join("")}</div>
        ${isQuiz ? "" : `<div class="board">${rr.map((id, i) => `<div class="row" style="font-size:20px;padding:10px 20px;animation-delay:${i * .03}s"><span class="n">${i + 1}</span><span>${esc(H.players[id].name)}</span><span class="sc">${H.players[id].done || 0} / ${total()} · ${H.players[id].score}</span></div>`).join("")}</div>`}
        </div>${ctlBar("", isQuiz ? `<button class="btn" id="topractice">Практикаға өту</button>` : "")}</div>`;
    }
    bind();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  start();
}

/* ===================== ОЙЫНШЫ (студент) ===================== */
function Player() {
  let room = (PARAMS.get("r") || store.get("room") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const bi = +(PARAMS.get("b") || 0);
  let pid = store.get("pid"); if (!pid) { pid = rid(14); store.set("pid", pid); }
  let name = store.get("name") || "";
  let joined = !!(name && room && store.get("joinedRoom") === room);
  let client = null, S = null, P = null, lastScreen = "", myLock = null, raf = 0, deadline = 0;
  let draft = {k: "", data: null}, sending = false, sentLocal = {k: "", data: null};
  let ITEMS = null, curF = 0, showMine = false, skew = 0; const OWN = {};
  const isFree = () => S && S.set === "free" && (S.phase === "free" || S.phase === "final");
  const fs = () => P && P.fs && S && P.fs.fid === S.fid ? P.fs : null;
  const fst = i => { const f = fs(); return (f && f.s[i]) || {}; };
  const fItems = () => ITEMS && S && ITEMS.fid === S.fid ? ITEMS.items : [];
  const seen = {note: null, frozen: null, res: null, fb: null};
  let iceTimer = null, thSub = false, viewer = null;
  const THUMBS = {}, myRates = {}, chkVals = {}, selfVals = {}, opened = {};
  const rfKey = id => "rf_" + room + "_" + id;
  const reflPending = () => S && S.refl && S.refl.id && !(P && P.rf === S.refl.id) && !store.get(rfKey(S.refl.id));
  let rfDraft = {c: "", a: ["", "", ""]};
  const RR = () => !S || !SETS[S.set] ? null : isFree() ? fItems()[curF] || null : S.qi < 0 ? null : S.set === "quiz" ? COURSE.quiz[S.qi] : S.task || null;
  const lang = () => store.get("lang") || (S && S.lang) || "ru";
  const qkey = () => !S ? "" : isFree() ? "f:" + S.fid + ":" + curF : S.set + ":" + S.qi;

  /* Шығыс кезек: мұғалім офлайн болса да ештеңе жоғалмайды — растау (ack) келгенше қайта жіберіледі */
  let hostOn = true; const OBK = NS + "ob_" + room + "_" + pid;
  let OB = []; try { OB = JSON.parse(localStorage.getItem(OBK) || "[]").filter(x => Date.now() - x.q < 30 * 60000); } catch (e) {}
  const obSave = () => { try { localStorage.setItem(OBK, JSON.stringify(OB.slice(-60))); } catch (e) {} };
  const hat = () => Date.now() + skew;
  function rawPub(o) { if (client && client.connected) { client.publish(T(room) + "i", JSON.stringify(o), {qos: 1}); return true; } return false; }
  function send(o) { o.pid = pid; if (S) { o.set = S.set; if (S.fid) o.fid = S.fid; } o.hat = hat();
    if (o.t !== "join") { o.mid = rid(8); OB.push({o, q: Date.now(), s: Date.now()}); obSave(); }
    o.ago = 0; rawPub(o); netBanner(); return true; }
  function obAck(ack) { if (!Array.isArray(ack) || !OB.length) return; const n = OB.length; OB = OB.filter(x => !ack.includes(x.o.mid)); if (OB.length !== n) { obSave(); netBanner(); } }
  function obFlush(force) { if (!client || !client.connected || !joined) return; const now = Date.now(); OB.forEach(x => { if (force || now - x.s > 4000) { x.s = now; x.o.ago = now - x.q; rawPub(x.o); } }); }
  let subAt = 0; const fresh = () => performance.now() - subAt > 1500;
  setInterval(() => { if (OB.length) obFlush(false); netBanner(); }, 4000);
  function netBanner() {
    let b = $("#hostoff"); const show = !hostOn && joined;
    if (!show) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement("div"); b.id = "hostoff"; b.className = "hostoff"; document.body.appendChild(b); }
    b.innerHTML = `<b>${t_("Мұғалімнің интернеті үзілді", "У преподавателя пропал интернет")}</b><span>${t_("Жұмысты жалғастыра беріңіз — жібергендеріңіз сақталды және ол қайта қосылғанда өзі жетеді. Уақыт жіберген сәттен есептеледі.", "Продолжайте работать — всё отправленное сохранено и дойдёт само, когда он вернётся. Время засчитывается по моменту отправки.")}${OB.length ? " · " + t_("Кезекте", "В очереди") + ": " + OB.length : ""}</span>`;
  }
  function go() {
    client && client.end(true);
    thSub = false;
    client = connect(bi, c => { thSub = false; subAt = performance.now(); c.subscribe([T(room) + "s", T(room) + "p/" + pid, T(room) + "items", T(room) + "img/" + pid + "/+", T(room) + "hb"], {qos: 1}); if (joined) { send({t: "join", name}); obFlush(true); } },
      (topic, m) => {
        if (topic.endsWith("/hb")) { const was = hostOn; hostOn = !(m && m.on === 0); netBanner(); if (hostOn && !was) obFlush(true); if (was !== hostOn) taskUpload(); return; }
        if (topic.endsWith("/items")) { const prevOn = ITEMS && ITEMS.fid === m.fid ? ITEMS.items.filter(x => !x.off && x.type === "task").length : null; ITEMS = m;
          const nowOn = m.items.filter(x => !x.off && x.type === "task").length; if (prevOn != null && nowOn > prevOn) { const nw = m.items.filter(x => !x.off && x.type === "task").slice(prevOn); fbPop("", null, t_("Жаңа тапсырма қосылды: ", "Добавлено новое задание: ") + nw.map(x => "«" + x.title + "»").join(", ")); } if (S && S.fid === m.fid) { const sv = store.get("cur_" + m.fid); curF = nearOn(sv != null ? Math.min(sv, m.items.length - 1) : 0); } lastScreen = ""; render(); return; }
        if (topic.indexOf("/img/" + pid + "/") > 0) { if (m && m.fid && typeof m.data === "string") (OWN[m.fid] = OWN[m.fid] || {})[m.i] = m.data; if (showMine) { lastScreen = ""; render(); } return; }
        if (topic.indexOf("/th/") > 0) { onThumb(topic.split("/").pop(), m); return; }
        if (topic.endsWith("/s")) { S = m; if (S.now && fresh() && hostOn) skew = S.now - Date.now(); if (S.phase === "question") deadline = performance.now() + (S.endsIn || 0); if (S.phase === "vote" && !thSub && client.connected) { thSub = true; client.subscribe(T(room) + "th/+", {qos: 1}); } }
        else { P = m; if (P.fs && P.fs.now && fresh() && hostOn) skew = P.fs.now - Date.now(); obAck(P.ack); onPlayerMsg(); }
        render();
      });
  }
  const locked = () => S && ((myLock && myLock.k === qkey()) || (P && P.locked && P.locked.set === S.set && P.locked.qi === S.qi));
  const mySub = () => isFree() ? !!fst(curF).sub : P && P.sub && P.sub.k === qkey();
  function onPlayerMsg() {
    if (P.kicked) { joined = false; store.del("joinedRoom"); return; }
    if (P.name && P.name !== name) { name = P.name; store.set("name", name); }
    if (P.note && P.note.id !== seen.note) { const first = seen.note === null && lastScreen === ""; seen.note = P.note.id; if (!first) toast(P.note.t); }
    if (P.frozen && P.frozen.id !== seen.frozen && S && S.phase === "question" && P.frozen.k === qkey() && !locked()) { seen.frozen = P.frozen.id; freeze(P.frozen.by); }
    fbWatch();
  }
  function fbWatch() {
    if (P.fs && P.fs.s) {
      const st = P.fs.s, sig = st.map(x => x ? (x.tg || "") + "|" + (x.cmId || "") : "|");
      if (seen.fb && seen.fb.k === "f" + P.fs.fid) st.forEach((x, i) => { if (x && sig[i] !== (seen.fb.a[i] || "|") && (x.tg || x.cm)) { const it = fItems()[i]; const prevTg = (seen.fb.a[i] || "|").split("|")[0]; fbPop(it ? it.title : "", String(x.tg || "") !== prevTg ? x.tg : null, (x.cmId || "") !== (seen.fb.a[i] || "|").split("|")[1] ? x.cm : null); } });
      seen.fb = {k: "f" + P.fs.fid, a: sig}; return;
    }
    const k = qkey(), g = P.grade && P.grade.k === k ? P.grade.g : "", cm = P.cm && P.cm.k === k ? P.cm.t : "", sig = g + "|" + cm;
    if (seen.fb && seen.fb.k === "r" + k && seen.fb.a !== sig && (g || cm)) { const [pg, pc] = seen.fb.a.split(/\|(.*)/s); fbPop(RR() ? RR().title || "" : "", g && g !== pg ? GRADE[g].t : null, cm && cm !== pc ? cm : null); }
    seen.fb = {k: "r" + k, a: sig};
  }
  function fbPop(title, g, cm) {
    if (!g && !cm) return;
    const old = $(".fbpop"); if (old) old.remove();
    const d = document.createElement("div"); d.className = "fbpop";
    d.innerHTML = `<div class="fbh">${t_("Мұғалімнен", "От преподавателя")}${title ? " · " + esc(title) : ""}</div>${g ? `<div class="fbg">${t_("Баға", "Оценка")}: <b class="${/^[0-5]$/.test(String(g)) ? "g" + g : ""}">${esc(String(PB(g)))}</b></div>` : ""}${cm ? `<div class="fbt">💬 ${esc(cm)}</div>` : ""}<div class="fbx">${t_("Жабу үшін басыңыз", "Нажмите, чтобы закрыть")}</div>`;
    d.onclick = () => d.remove(); document.body.appendChild(d); vibrate([40, 60, 40]);
    setTimeout(() => d.remove(), cm ? 9000 : 5000);
  }
  function fbBox() {
    if (!isFree()) { const k = qkey(), g = P && P.grade && P.grade.k === k ? P.grade.g : null, cm = P && P.cm && P.cm.k === k ? P.cm.t : null;
      return cm ? `<div class="fbk"><div class="fbh">${t_("Мұғалімнің пікірі", "Комментарий преподавателя")}</div><div class="fbt">${esc(cm)}</div></div>` : ""; }
    const x = fst(curF); if (!x.tg && !x.cm) return "";
    return `<div class="fbk"><div class="fbh">${t_("Мұғалімнен", "От преподавателя")}</div>${x.tg ? `<div class="fbg">${t_("Баға", "Оценка")}: <b class="g${x.tg}">${PB(x.tg)}</b></div>` : ""}${x.cm ? `<div class="fbt">💬 ${esc(x.cm)}</div>` : ""}</div>`;
  }
  function updateFb() { const b = $("#fbk"); if (!b) return; const h = fbBox(); if (b.dataset.h !== h) { b.dataset.h = h; b.innerHTML = h; } }
  function onThumb(id, m) {
    if (!m || typeof m.data !== "string" || m.data.slice(0, 11) !== "data:image/") return;
    THUMBS[id] = m;
    const img = document.querySelector(`.vcard[data-p="${CSS.escape(id)}"] .vimg`);
    if (img && m.k === qkey()) img.innerHTML = `<img src="${m.data}" alt="${esc(m.name)} жұмысы">`;
    if (viewer === id) drawViewer();
  }
  const rated = to => (myRates[qkey()] || {})[to] || (P && P.rates && P.rates.k === qkey() && P.rates.m[to]) || 0;
  const starRow = (to, big) => `<div class="stars ${big ? "big" : ""}" data-to="${esc(to)}">${[1, 2, 3, 4, 5].map(v => `<button data-v="${v}" class="${rated(to) >= v ? "on" : ""}" aria-label="${v} жұлдыз">★</button>`).join("")}</div>`;
  function rate(to, v) {
    if (!send({t: "rate", qi: S.qi, to, v})) { toast("Байланыс жоқ — қайта басыңыз"); return; }
    (myRates[qkey()] = myRates[qkey()] || {})[to] = v; vibrate(15);
    document.querySelectorAll(`.stars[data-to="${CSS.escape(to)}"] button`).forEach(b => b.classList.toggle("on", +b.dataset.v <= v));
  }
  function bindStars(root) { root.querySelectorAll(".stars button").forEach(b => b.onclick = e => { e.stopPropagation(); rate(b.parentNode.dataset.to, +b.dataset.v); }); }
  function drawViewer() {
    const cands = (S && S.cands) || [], i = cands.findIndex(c => c[0] === viewer);
    if (i < 0) { closeViewer(); return; }
    let d = $("#pv"); if (!d) { d = document.createElement("div"); d.id = "pv"; d.className = "pview"; document.body.appendChild(d); }
    const c = cands[i], th = THUMBS[c[0]], own = c[0] === pid;
    d.innerHTML = `<div class="pvtop"><b>${esc(c[1])}</b><span class="mut">${i + 1} / ${cands.length}</span><button class="btn ghost" id="pvx">Жабу</button></div>
      <div class="pvimg">${th && th.k === qkey() ? `<img src="${th.data}" alt="${esc(c[1])} жұмысы">` : `<div class="mut">Жүктелуде…</div>`}</div>
      <div class="pvbar"><button class="btn ghost" id="pvp">←</button>${own ? `<span class="mut">Сіздің жұмысыңыз</span>` : starRow(c[0], true)}<button class="btn ghost" id="pvn">→</button></div>`;
    $("#pvx").onclick = closeViewer;
    $("#pvp").onclick = () => { viewer = cands[(i - 1 + cands.length) % cands.length][0]; drawViewer(); };
    $("#pvn").onclick = () => { viewer = cands[(i + 1) % cands.length][0]; drawViewer(); };
    bindStars(d);
  }
  function closeViewer() { viewer = null; const d = $("#pv"); if (d) d.remove(); }
  function freeze(by) {
    unfreeze(true); closeSheet(); vibrate([80, 40, 120]);
    const d = document.createElement("div"); d.id = "ice";
    const cracks = ["M50 50 L32 30 L20 34 L6 18", "M50 50 L70 26 L84 30 L96 10", "M50 50 L28 66 L14 64 L4 84", "M50 50 L68 72 L86 70 L96 92", "M50 50 L48 20 L54 4", "M50 50 L52 82 L44 98"];
    d.innerHTML = `<svg class="frost" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><radialGradient id="g" cx="50%" cy="50%" r="70%"><stop offset="55%" stop-color="#fff" stop-opacity="0"/><stop offset="100%" stop-color="#fff" stop-opacity=".85"/></radialGradient></defs><rect width="100" height="100" fill="url(#g)"/>
      ${cracks.map((p, i) => `<path class="crack" data-i="${i}" d="${p}" vector-effect="non-scaling-stroke"/>`).join("")}</svg>
      ${[[8, 12, 54], [78, 8, 40], [14, 72, 46], [80, 70, 60], [44, 88, 30], [60, 28, 26]].map(f => `<span class="flake" style="left:${f[0]}%;top:${f[1]}%;width:${f[2]}px;height:${f[2]}px">${ICON.fr}</span>`).join("")}
      <div class="it1">Мұздатылдыңыз!</div><div class="it2">${esc(by)} сізді мұздатты</div><div class="taps" id="taps">6</div><div class="it2">Мұзды сындыру үшін басыңыз</div>`;
    document.body.appendChild(d);
    let left = 6;
    d.addEventListener("pointerdown", e => { e.preventDefault(); left--; vibrate(25); d.classList.remove("hit"); void d.offsetWidth; d.classList.add("hit");
      const c = d.querySelector(`.crack[data-i="${5 - left}"]`); if (c) c.style.opacity = 1;
      const t = $("#taps"); if (t) t.textContent = Math.max(0, left); if (left <= 0) unfreeze(); });
    iceTimer = setTimeout(unfreeze, 4500);
  }
  function unfreeze(instant) { clearTimeout(iceTimer); const d = $("#ice"); if (!d) return; if (instant) { d.remove(); return; } d.classList.add("melt"); setTimeout(() => d.remove(), 480); }
  function openSheet() {
    if (!S || !S.roster) return;
    const others = S.roster.filter(r => r[0] !== pid);
    if (!others.length) { toast("Мұздататын адам жоқ"); return; }
    const d = document.createElement("div"); d.className = "sheet"; d.id = "sheet";
    d.innerHTML = `<div class="in"><h3>Кімді мұздатамыз?</h3><div class="mut" style="font-size:14px">Ол 4,5 секунд жауап бере алмайды. Қалқаны болса — қорғанады.</div>
      ${others.map((r, i) => `<button class="tg" data-t="${esc(r[0])}"><span>${esc(r[1])}</span><span class="mut">${i + 1}-орын</span></button>`).join("")}
      <button class="btn ghost" id="cancel" style="width:100%;margin-top:14px">Болдырмау</button></div>`;
    document.body.appendChild(d);
    d.onclick = e => { if (e.target === d) closeSheet(); };
    $("#cancel").onclick = closeSheet;
    d.querySelectorAll(".tg").forEach(b => b.onclick = () => { send({t: "pw", k: "fr", target: b.dataset.t, qi: S.qi}); closeSheet(); });
  }
  function closeSheet() { const s = $("#sheet"); if (s) s.remove(); }

  function screenKey() {
    if (!joined) return "join";
    if (!S || S.phase === "closed" || !SETS[S.set]) return "wait0";
    if (P && P.kicked) return "kicked";
    if (reflPending()) return "refl" + S.refl.id;
    if (S.phase === "lobby") return "lobby" + S.set;
    if (isFree()) { if (!fItems().length) return "frwait" + S.fid; if (showMine || S.phase === "final") return "frmine" + S.fid + ":" + S.phase + ":" + Object.keys(OWN[S.fid] || {}).length + ":" + JSON.stringify((fs() || {}).s || []).length + ":" + ((fs() || {}).p100) + ":" + !!(fs() || {}).hide;
      const it = fItems()[curF]; return "fr" + S.fid + ":" + curF + ":" + onIdx().join(",") + ":" + lang() + (it && it.type === "mc" ? ":" + (fst(curF).a != null) : ""); }
    const r = RR();
    if (S.phase === "question") {
      if (isTask(r)) return "task" + qkey() + lang() + ":" + (S.tv || 0);
      return (locked() ? "locked" : "q") + qkey();
    }
    if (S.phase === "reveal") return "rv" + qkey() + (P && P.last ? P.last.k : "");
    if (S.phase === "review") return "review" + qkey() + (P && P.grade ? P.grade.k + P.grade.g : "") + (P && P.cm ? P.cm.k + P.cm.t : "") + (mySub() ? "s" : "");
    if (S.phase === "vote") return "vote" + qkey() + (S.cands ? S.cands.length : 0);
    if (S.phase === "board") return "board" + qkey() + (P && P.last ? P.last.k + P.last.pts : "");
    return S.phase + qkey();
  }
  const top = () => isFree() ? `<div class="pbar"><span class="me">${esc(name)}</span><span>${fItems().filter((it, i) => !it.off && (fst(i).d || fst(i).a != null)).length} / ${onIdx().length} ${t_("дайын", "готово")}</span></div>` : `<div class="pbar"><span class="me">${esc(name)}</span><span>${P ? P.score + " ұпай" : ""}${S && S.qi >= 0 && S.total ? ` · ${S.qi + 1}/${S.total}` : ""}</span></div>`;
  function sendMc(a) {
    if ($("#ice") || locked()) return;
    if (!send({t: "ans", qi: S.qi, a})) { toast("Байланыс жоқ — қайта басыңыз"); return; }
    myLock = {k: qkey(), a}; vibrate(30); render();
  }
  function taskUpload(force) {
    const r = RR(), k = qkey(), box = $("#upbox"); if (!box) return;
    const sent = mySub(), have = draft.k === k && draft.data;
    const sentImg = isFree() ? (OWN[S.fid] || {})[curF] || null : sentLocal.k === k ? sentLocal.data : null;
    const pend = !sent && sentImg && !hostOn;
    const sig = [k, !!sent, have ? draft.data.length : 0, sending, sentImg ? sentImg.length : 0, pend].join("|");
    if (!force && sig === upSig && box.childElementCount) return; upSig = sig;
    const crit = (r && r.crit) || [], sv = selfVals[k] = selfVals[k] || [];
    box.innerHTML = have ? `<img class="prev" src="${draft.data}" alt="Таңдалған сурет">
        ${crit.length ? `<div class="selfck"><div class="edh" style="margin:0">${t_("Жіберер алдында өзіңізді тексеріңіз", "Перед отправкой проверьте себя")}</div>${crit.map((c, i) => `<label><input type="checkbox" data-sc="${i}" ${sv[i] ? "checked" : ""}><span>${esc(c)}</span></label>`).join("")}<div class="mut" style="font-size:12px">${t_("Адал белгілеңіз — мұғалім сіздің бағаңызды өз бағасымен салыстырады.", "Отмечайте честно — преподаватель сравнит вашу самооценку со своей.")}</div></div>` : ""}
        <div class="ansrow"><label class="btn ghost" for="file" style="flex:1">Басқасын таңдау</label><button class="btn" id="sendimg" ${sending ? "disabled" : ""}>${sending ? "Жіберілуде…" : "Жіберу"}</button></div>`
      : pend ? `<img class="prev" src="${sentImg}" alt="Жіберілген жұмыс"><div class="okline" style="color:var(--a2)">⏳ ${t_("Жіберілді. Мұғалім қайта қосылғанда өзі қабылданады — қайта жіберудің қажеті жоқ.", "Отправлено. Работа будет принята автоматически, когда преподаватель вернётся — повторно отправлять не нужно.")}</div><label class="btn ghost" for="file" style="width:100%">Ауыстыру</label>`
      : sent ? `${sentImg ? `<img class="prev" src="${sentImg}" alt="Жіберілген жұмыс">` : ""}<div class="okline">✓ Жұмыс жіберілді. Уақыт біткенше ауыстыруға болады.</div>
        <label class="btn ghost" for="file" style="width:100%">Ауыстыру</label>`
      : `<label class="drop" for="file">${ICON.up}<b>Нәтижені жүктеу</b><span>Экспорт (JPG/PNG) немесе экран скриншоты</span></label>`;
    box.querySelectorAll("[data-sc]").forEach(c => c.onchange = () => { sv[+c.dataset.sc] = c.checked; });
    const sb = $("#sendimg");
    if (sb) sb.onclick = () => {
      if (!client || !client.connected) { toast("Байланыс жоқ — қайта басыңыз"); return; }
      sending = true; taskUpload();
      const id = rid(8);
      const fi = curF, free = isFree();
      client.publish(T(room) + "img/" + pid + (free ? "/" + fi : ""), JSON.stringify(Object.assign(free ? {fid: S.fid, i: fi, id, hat: hat(), data: draft.data} : {set: S.set, qi: S.qi, id, hat: hat(), data: draft.data}, crit.length ? {self: crit.map((c, i) => !!sv[i])} : {})), {qos: 1, retain: true}, err => {
        sending = false;
        if (err) { toast("Жіберілмеді — қайта басыңыз"); taskUpload(); return; }
        if (free) (OWN[S.fid] = OWN[S.fid] || {})[fi] = draft.data; else sentLocal = {k, data: draft.data};
        draft = {k: "", data: null}; vibrate(40); toast("Жіберілді!"); taskUpload();
      });
    };
  }
  let upSig = "";
  function dataTable(tb) {
    const cols = tb.head.length, L0 = "ABCDEFGHIJ";
    return `<div class="dt"><div class="edh" style="margin:0">${t_("Енгізетін кесте", "Таблица для ввода")}</div><div class="dtw"><table><tr><th></th>${tb.head.map((h, i) => `<th>${L0[i]}</th>`).join("")}</tr>
      <tr><th>1</th>${tb.head.map(h => `<td><b>${esc(h)}</b></td>`).join("")}</tr>
      ${tb.rows.map((r, i) => `<tr><th>${i + 2}</th>${Array.from({length: cols}, (_, j) => `<td class="${j && r[j] !== "" && !isNaN(+r[j]) ? "num" : ""}">${esc(r[j] == null ? "" : r[j])}</td>`).join("")}</tr>`).join("")}</table></div>
      <button class="btn ghost" id="copytbl" style="width:100%;height:44px;font-size:15px">${t_("Кестені көшіру", "Скопировать таблицу")}</button>
      <div class="mut" style="font-size:12px">${t_("A1 ұяшығына қойыңыз (Ctrl+V немесе ұзақ басу → Қою).", "Вставьте в ячейку A1 (Ctrl+V или долгое нажатие → Вставить).")}</div></div>`;
  }
  function copyText(t) {
    const ok = () => toast(t_("Көшірілді — A1-ге қойыңыз", "Скопировано — вставьте в A1"));
    const fb = () => { const a = document.createElement("textarea"); a.value = t; a.style.position = "fixed"; a.style.opacity = "0"; document.body.appendChild(a); a.select(); try { document.execCommand("copy"); ok(); } catch (e) { toast(t_("Көшіру мүмкін болмады", "Не удалось скопировать")); } a.remove(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, fb); else fb();
  }
  function checkForm(r) {
    const v = chkVals[qkey()] || [];
    return `<div class="chkbox" id="chkbox"><div class="edh" style="margin:0">${t_("Тексеру: нәтижені енгізіңіз", "Проверка: введите результаты")}</div>
      ${r.checks.map((c, i) => `<div class="chf" data-i="${i}"><label>${esc(L(c.l, lang()))}</label>
        ${c.opts ? `<div class="chopts">${c.opts.map((o, j) => `<button data-o="${j}" class="${String(v[i]) === String(j) ? "on" : ""}">${esc(o)}</button>`).join("")}</div>`
          : `<input inputmode="decimal" autocomplete="off" value="${esc(v[i] == null ? "" : v[i])}" placeholder="${c.pct ? "%" : t_("сан", "число")}">`}<span class="chs"></span></div>`).join("")}
      <button class="btn" id="chkgo" style="width:100%">${t_("Тексеру", "Проверить")}</button><div id="chkst" class="chkst"></div></div>`;
  }
  function bindChecks(r) {
    const box = $("#chkbox"); if (!box) return;
    const k = qkey(); chkVals[k] = chkVals[k] || [];
    box.querySelectorAll(".chf").forEach(f => {
      const i = +f.dataset.i, inp = f.querySelector("input");
      if (inp) inp.oninput = () => { chkVals[k][i] = inp.value; };
      f.querySelectorAll(".chopts button").forEach(b => b.onclick = () => { chkVals[k][i] = +b.dataset.o; f.querySelectorAll(".chopts button").forEach(x => x.classList.toggle("on", x === b)); });
    });
    $("#chkgo").onclick = () => {
      const vals = r.checks.map((c, i) => chkVals[k][i] == null ? "" : chkVals[k][i]);
      if (vals.some(x => x === "")) { toast(t_("Барлық өрістерді толтырыңыз", "Заполните все поля")); return; }
      if (!send(isFree() ? {t: "fchk", i: curF, vals} : {t: "chk", qi: S.qi, vals})) { toast(t_("Байланыс жоқ — қайта басыңыз", "Нет связи — нажмите ещё раз")); return; }
      vibrate(20); const st = $("#chkst"); if (st) st.textContent = t_("Тексерілуде…", "Проверяем…");
    };
  }

  /* ---------- Еркін режим (студент) ---------- */
  const onIdx = () => fItems().map((it, i) => it.off ? -1 : i).filter(i => i >= 0);
  function nearOn(i) { const L = onIdx(); if (!L.length) return 0; if (L.includes(i)) return i; const nx = L.find(j => j > i); return nx != null ? nx : L[L.length - 1]; }
  function openItem(i) { const n = fItems().length; if (!n) return; curF = nearOn(Math.max(0, Math.min(n - 1, i))); store.set("cur_" + S.fid, curF); showMine = false; closeList(); send({t: "fopen", i: curF}); lastScreen = ""; render(); window.scrollTo(0, 0); }
  function itemLabel(it, i) { return it.type === "task" ? it.title : t_("Пернелер сұрағы", "Вопрос: горячие клавиши"); }
  function statusIcon(i) { const x = fst(i), it = fItems()[i]; if (it.type === "mc") return x.a == null ? "○" : x.c ? "✓" : "✗"; return x.d ? "✓" : x.o || x.tries || x.sub ? "◐" : "○"; }
  function openList() {
    closeList(); const items = fItems(), hide = fs() && fs().hide;
    const d = document.createElement("div"); d.className = "sheet"; d.id = "flist";
    d.innerHTML = `<div class="in"><h3>${t_("Барлық тапсырмалар", "Все задания")}</h3>
      ${items.map((it, i) => { if (it.off) return ""; const x = fst(i), g = x.tg || x.ag; return `<button class="tg fli ${i === curF ? "on" : ""}" data-i="${i}"><span><b class="si s${statusIcon(i) === "✓" ? "ok" : statusIcon(i) === "✗" ? "no" : statusIcon(i) === "◐" ? "run" : ""}">${statusIcon(i)}</b> ${it.lvl ? `<sup class="lv l${it.lvl}">${it.lvl}</sup> ` : ""}${esc(itemLabel(it, i))}</span><span class="mut">${it.type === "task" && x.d && !hide ? "«" + g + "» · " + mmss(x.sec || 0) : it.type === "task" ? it.t / 60 + " " + t_("мин", "мин") : ""}${it.type === "task" && x.tg && !x.d ? " · «" + x.tg + "»" : ""}${x.cm ? " 💬" : ""}</span></button>`; }).join("")}
      <button class="btn ghost" id="fmine" style="width:100%;margin-top:14px">${t_("Менің жұмыстарым", "Мои работы")}</button>
      <button class="btn ghost" id="flx" style="width:100%;margin-top:8px">${t_("Жабу", "Закрыть")}</button></div>`;
    document.body.appendChild(d);
    d.onclick = e => { if (e.target === d) closeList(); };
    d.querySelectorAll(".fli").forEach(b => b.onclick = () => openItem(+b.dataset.i));
    $("#flx").onclick = closeList; $("#fmine").onclick = () => { closeList(); showMine = true; lastScreen = ""; render(); };
  }
  function closeList() { const d = $("#flist"); if (d) d.remove(); }
  function freeNav() {
    const L = onIdx();
    return `<div class="fnav" id="fnav"><button class="btn ghost" id="fprev" ${curF <= L[0] ? "disabled" : ""}>←</button><button class="btn ghost" id="fmenu">☰ ${L.indexOf(curF) + 1}/${L.length}</button><button class="btn" id="fnext"></button></div>`;
  }
  function updateFreeNav() {
    const b = $("#fnext"); if (!b) return; const L = onIdx(), x = fst(curF), last = curF >= L[L.length - 1];
    const done = x.d || x.a != null;
    b.textContent = last ? t_("Менің жұмыстарым →", "Мои работы →") : done ? t_("Келесі тапсырма →", "Следующее →") : t_("Өткізіп жіберу →", "Пропустить →");
    b.classList.toggle("ghost", !done && !last);
  }
  function bindFreeNav() {
    $("#fprev").onclick = () => { const L = onIdx(), j = L.indexOf(curF); if (j > 0) openItem(L[j - 1]); };
    $("#fmenu").onclick = openList;
    $("#fnext").onclick = () => { const L = onIdx(), x = fst(curF);
      if (curF >= L[L.length - 1]) { showMine = true; lastScreen = ""; render(); return; }
      const b = $("#fnext");
      if (!(x.d || x.a != null) && b.dataset.c !== "1") { b.dataset.c = "1"; b.textContent = t_("Тапсырылмаған. Бәрібір өту?", "Не сдано. Всё равно перейти?"); setTimeout(() => { b.dataset.c = ""; updateFreeNav(); }, 3000); return; }
      openItem(L[L.indexOf(curF) + 1]); };
    updateFreeNav();
  }
  function renderFreeItem() {
    const r = RR(), x = fst(curF);
    if (!x.o && !opened[qkey()]) { opened[qkey()] = 1; send({t: "fopen", i: curF}); }
    if (r.type === "mc") {
      const answered = x.a != null;
      app.innerHTML = `<div class="ply"><div class="pw-wrap">${top()}<div class="pk">${esc(r.k || "")}</div><div class="pq up">${esc(L(r.q, lang()))}</div>
        <div class="answers">${r.a.map((a, i) => `<button class="ans t${i} ${answered ? (i === r.c ? "pick" : i === x.a ? "" : "gone") : ""}" data-a="${i}" ${answered ? "disabled" : ""}>${SHAPES[i]}<span>${esc(L(a, lang()))}</span></button>`).join("")}</div>
        ${answered ? `<div class="fres ${x.c ? "ok" : "no"}">${x.c ? t_("Дұрыс!", "Верно!") : t_("Қате. Дұрыс жауап", "Неверно. Правильно") + ": " + esc(L(r.a[r.c], lang()))}</div>` : ""}
        ${freeNav()}</div></div>`;
      document.querySelectorAll(".ans:not([disabled])").forEach(b => b.onclick = () => { if (!send({t: "fmc", i: curF, a: +b.dataset.a})) { toast(t_("Байланыс жоқ", "Нет связи")); return; } vibrate(25); document.querySelectorAll(".ans").forEach(z => z.disabled = true); });
      bindFreeNav(); return;
    }
    app.innerHTML = `<div class="ply"><div class="pw-wrap">${top()}
      <div class="pk">${esc(r.k)} · ${t_("уақыт", "время")} <span id="ptt">${x.o ? "" : "0:00"}</span> ${lvlB(r.lvl)}</div><div class="pq up">${esc(r.title)}</div>${whyBox(r)}
      <div id="fbk"></div>
      <div class="langsw"><span class="mut">${LANG_LABEL}</span>${LANGS.map(([k, t]) => `<button data-l="${k}" class="${lang() === k ? "on" : ""}">${t}</button>`).join("")}</div>
      <ol class="psteps">${r.steps.map(s => `<li>${esc(L(s, lang()))}</li>`).join("")}</ol>
      ${r.crit && r.crit.length ? `<div class="crit">${r.crit.map(c => `<span>${esc(c)}</span>`).join("")}</div>` : ""}
      ${r.table ? dataTable(r.table) : ""}
      ${r.hints && r.hints.length ? `<details class="exd"><summary>${t_("Кеңестер", "Подсказки")} (${r.hints.length})</summary><ul class="hints">${r.hints.map(h => `<li>${esc(L(h, lang()))}</li>`).join("")}</ul></details>` : ""}
      ${extraTips(r, lang())}
      ${r.ex ? `<details class="exd"><summary>${t_("Мысалды көру", "Посмотреть образец")}</summary><img src="${esc(exUrl(r.ex))}" alt="" onerror="this.parentNode.remove()"></details>` : ""}
      ${r.checks && r.checks.length ? checkForm(r) : ""}
      ${COURSE.tool.url ? `<a class="btn ghost" href="${COURSE.tool.url}" target="_blank" rel="noopener" style="width:100%;margin:12px 0">${ICON.ext}<span>${esc(COURSE.tool.name)} ашу</span></a>` : `<div class="mut" style="font-size:13px;margin:12px 0">${t_("Тапсырманы компьютердегі ", "Задание выполняйте в ")}${esc(COURSE.tool.name)}${t_(" бағдарламасында орындап, нәтижені экспорттаңыз немесе скриншот жасаңыз.", ", затем экспортируйте результат или сделайте скриншот.")}</div>`}
      <input type="file" id="file" accept="image/*" class="hidden">
      ${r.shot === false ? "" : `<div class="edh" style="margin-top:6px">${t_("Скриншот", "Скриншот")}</div><div id="upbox" class="upbox"></div>`}
      ${freeNav()}</div></div>`;
    document.querySelectorAll(".langsw button").forEach(b => b.onclick = () => { store.set("lang", b.dataset.l); lastScreen = ""; render(); });
    $("#file").onchange = async e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return;
      try { draft = {k: qkey(), data: await compressImage(f)}; taskUpload(); } catch (err) { toast("Бұл файлды ашу мүмкін болмады. JPG/PNG немесе скриншот таңдаңыз"); } };
    upSig = ""; lastChk = ""; taskUpload(); bindChecks(r); updateChecks(); bindFreeNav(); updateFb();
    const cp = $("#copytbl"); if (cp) cp.onclick = () => copyText(r.table.head.join("\t") + "\n" + r.table.rows.map(z => z.join("\t")).join("\n"));
    const loop = () => { const el = $("#ptt"); if (!el) return; const y = fst(curF); el.textContent = y.d ? mmss(y.sec || 0) + " ✓" : y.o ? mmss(Math.max(0, (Date.now() + skew - y.o) / 1000)) : "0:00"; raf = requestAnimationFrame(() => setTimeout(loop, 500)); };
    loop();
  }
  function renderRefl() {
    const C = REFC(), Q = REFQ(), rid0 = S.refl.id;
    app.innerHTML = `<div class="ply"><div class="pw-wrap">${top()}<div class="pq up" style="margin-top:14px">${t_("Рефлексия", "Рефлексия")}</div>
      ${LESSON && LESSON.goal ? `<div class="goalbox"><div class="kicker">${t_("Сабақ мақсаты", "Цель занятия")}</div><div class="gtxt" style="font-size:15px">${esc(LESSON.goal)}</div></div>` : ""}
      <div class="edh" style="margin:14px 0 8px">${t_("Мақсатқа қаншалықты жеттім?", "Насколько я достиг цели?")}</div>
      <div class="rfpick">${["g", "y", "r"].map(k => `<button data-c="${k}" class="${rfDraft.c === k ? "on" : ""}" style="--rc:${C[k].c}"><i></i><span>${C[k].t}</span></button>`).join("")}</div>
      ${Q.map((q, i) => `<div class="ff" style="margin-top:12px"><label>${esc(q)}</label><textarea data-q="${i}" rows="2" maxlength="300" class="rfta">${esc(rfDraft.a[i])}</textarea></div>`).join("")}
      <button class="btn" id="rfsend" style="width:100%;margin-top:16px">${t_("Жіберу", "Отправить")}</button>
      <p class="mut" style="font-size:13px">${t_("Бағдаршамды таңдау міндетті, сұрақтар — қысқа болса да жазыңыз.", "Цвет выбрать обязательно, на вопросы ответьте хотя бы коротко.")}</p></div></div>`;
    app.querySelectorAll(".rfpick button").forEach(b => b.onclick = () => { rfDraft.c = b.dataset.c; app.querySelectorAll(".rfpick button").forEach(x => x.classList.toggle("on", x === b)); vibrate(15); });
    app.querySelectorAll(".rfta").forEach(t => t.oninput = () => { rfDraft.a[+t.dataset.q] = t.value; });
    $("#rfsend").onclick = () => {
      if (!rfDraft.c) { toast(t_("Бағдаршамнан бір түсті таңдаңыз", "Выберите цвет светофора")); return; }
      send({t: "refl", rid: rid0, c: rfDraft.c, a: rfDraft.a.map(x => x.trim())});
      store.set(rfKey(rid0), 1); rfDraft = {c: "", a: ["", "", ""]}; vibrate(40); toast(t_("Рахмет! Рефлексия жіберілді", "Спасибо! Рефлексия отправлена")); lastScreen = ""; render();
    };
  }
  function renderMine() {
    const items = fItems(), own = OWN[S.fid] || {}, hide = fs() && fs().hide, fin = S.phase === "final";
    let tn = 0;
    const cards = items.map((it, i) => { if (it.type !== "task" || (it.off && !own[i])) return ""; tn++; const x = fst(i), img = own[i], g = x.tg || x.ag;
      return `<div class="mine"><div class="mt"><b>${tn}. ${esc(it.title)}</b><span class="mut">${x.d ? (hide ? "✓" : "«" + g + "»") + " · " + mmss(x.sec || 0) : x.o ? t_("аяқталмаған", "не завершено") : t_("ашылмаған", "не начато")}</span></div>
        ${x.tg ? `<div class="fbg" style="font-size:14px">${t_("Мұғалім бағасы", "Оценка преподавателя")}: <b class="g${x.tg}">${PB(x.tg)}</b></div>` : ""}${x.cm ? `<div class="fbt mcm">💬 ${esc(x.cm)}</div>` : ""}
        ${img ? `<img src="${img}" alt=""><a class="btn ghost" download="${String(tn).padStart(2, "0")}_${esc(safeName(it.title))}.jpg" href="${img}">⬇ ${t_("Сақтау", "Сохранить")}</a>` : `<div class="mut" style="font-size:13px">${t_("Скриншот жоқ", "Скриншота нет")}</div>`}
        ${!fin ? `<button class="btn ghost" data-go="${i}">${t_("Тапсырмаға өту", "Открыть задание")}</button>` : ""}</div>`; }).join("");
    const mcs = items.map((it, i) => it.type === "mc" && !it.off ? fst(i) : null).filter(Boolean);
    app.innerHTML = `<div class="ply"><div class="pw-wrap">${top()}<div class="pq up" style="margin-top:14px">${fin ? t_("Практика аяқталды", "Практика завершена") : t_("Менің жұмыстарым", "Мои работы")}</div>
      ${!hide && fs() && fs().p100 != null ? `<div class="p100"><b>${fs().p100}</b><span>/ 100</span></div>` : ""}
      ${mcs.length ? `<p class="mut" style="margin:0 0 10px">${t_("Пернелер сұрақтары", "Вопросы по горячим клавишам")}: ${mcs.filter(x => x.c).length} / ${mcs.length}</p>` : ""}
      <button class="btn" id="zipme" style="width:100%;margin-bottom:12px">⬇ ${t_("Барлығын жүктеу (ZIP)", "Скачать все работы (ZIP)")}</button>
      <div class="minelist">${cards}</div>
      ${!fin ? `<button class="btn ghost" id="back2" style="width:100%;margin-top:12px">← ${t_("Тапсырмаларға оралу", "Вернуться к заданиям")}</button>` : ""}</div></div>`;
    document.querySelectorAll("[data-go]").forEach(b => b.onclick = () => openItem(+b.dataset.go));
    const bk = $("#back2"); if (bk) bk.onclick = () => { showMine = false; lastScreen = ""; render(); };
    $("#zipme").onclick = async () => {
      if (typeof JSZip === "undefined") { toast(t_("ZIP жүктелмеді", "Не загрузился ZIP")); return; }
      const zip = new JSZip(); let n = 0, k = 0, lines = [`${TITLE}`, `${name}`, ""];
      items.forEach((it, i) => { if (it.type !== "task" || (it.off && !own[i])) return; k++; const x = fst(i); lines.push(`${k}. ${it.title}: ${x.d ? (hide ? "✓" : (x.tg || x.ag)) + " · " + mmss(x.sec || 0) : "—"}`); if (x.cm) lines.push("   " + t_("Пікір", "Комментарий") + ": " + x.cm);
        if (own[i]) { zip.file(String(k).padStart(2, "0") + "_" + safeName(it.title) + ".jpg", dataToBytes(own[i])); n++; } });
      if (mcs.length) lines.push("", t_("Пернелер сұрақтары", "Горячие клавиши") + `: ${mcs.filter(x => x.c).length}/${mcs.length}`);
      if (!hide && fs() && fs().p100 != null) lines.push("", t_("Қорытынды", "Итог") + `: ${fs().p100} / 100`);
      zip.file(t_("нәтижелер.txt", "итоги.txt"), lines.join("\r\n"));
      downloadBlob(await zip.generateAsync({type: "blob"}), safeName(TITLE + " — " + name) + ".zip"); toast(t_(`${n} жұмыс`, `Работ в архиве: ${n}`));
    };
  }
  let lastChk = "";
  function updateChecks() {
    const box = $("#chkbox"); if (!box) return;
    let c = P && P.chk && P.chk.k === qkey() ? P.chk : null;
    if (isFree()) { const x = fst(curF); c = x.tries || x.d ? {ok: x.ok || [], tries: x.tries || 0, fin: x.d ? 1 : null, place: 0, ag: x.ag, tg: x.tg} : null; }
    const sig = c ? JSON.stringify([c.ok, c.tries, c.fin, c.place, c.ag, c.tg]) : "";
    if (sig === lastChk && box.dataset.done === sig) return; lastChk = sig; box.dataset.done = sig;
    const r = RR();
    box.querySelectorAll(".chf").forEach(f => { const i = +f.dataset.i, s = f.querySelector(".chs");
      f.classList.toggle("good", !!(c && c.ok[i])); f.classList.toggle("bad", !!(c && c.ok.length && !c.ok[i]));
      s.textContent = c && c.ok.length ? (c.ok[i] ? "✓" : "✗") : ""; const inp = f.querySelector("input"); if (inp) inp.disabled = !!(c && c.ok[i]); });
    const st = $("#chkst"), allOk = c && c.ok.length && c.ok.every(Boolean);
    if (st) st.innerHTML = !c ? "" : c.fin != null ? (isFree() ? `<b class="okc">${t_("Дайын!", "Готово!")}</b> ${fs() && fs().hide ? "" : (c.tg ? t_("Мұғалім бағасы", "Оценка преподавателя") : t_("Уақыт бойынша", "По времени")) + ": <b>" + PB(c.tg || c.ag) + "</b>"}` : `<b class="okc">${t_("Дайын!", "Готово!")} ${t_("Орныңыз", "Ваше место")}: ${c.place}</b>`)
      : allOk ? (r && r.shot ? `<b class="okc">${t_("Сандар дұрыс ✓", "Числа верны ✓")}</b> ${t_("Енді скриншот жіберіңіз.", "Теперь отправьте скриншот.")}` : "")
      : `<span class="badc">${t_("Қатесі бар — ✗ белгіленген өрістерді тексеріңіз.", "Есть ошибки — проверьте поля с ✗.")}</span>`;
    const go = $("#chkgo"); if (go) go.disabled = !!allOk;
    if (c && c.fin != null && seen.res !== qkey() + "fin") { seen.res = qkey() + "fin"; confetti(); vibrate(60); }
  }
  function render() {
    const key = screenKey();
    if (key.startsWith("q")) updatePw();
    if (key === lastScreen) { if (key.startsWith("task") || (key.startsWith("fr") && !key.startsWith("frmine") && !key.startsWith("frwait"))) { taskUpload(); updateChecks(); updateFreeNav(); updateFb(); } return; }
    const prev = lastScreen; lastScreen = key;
    if (key.startsWith("refl")) { closeSheet(); closeList(); closeViewer(); unfreeze(true); cancelAnimationFrame(raf); renderRefl(); return; }
    if (key.startsWith("frwait")) { app.innerHTML = `<div class="ply">${top()}<div class="pc"><div class="wait up"><div class="ring"></div><h1>${t_("Тапсырмалар жүктелуде…", "Загружаем задания…")}</h1></div></div></div>`; return; }
    if (key.startsWith("frmine")) { closeSheet(); renderMine(); return; }
    if (key.startsWith("fr")) { closeSheet(); cancelAnimationFrame(raf); renderFreeItem(); return; }
    if (!key.startsWith("q")) closeSheet();
    if (!key.startsWith("vote")) closeViewer();
    if (!(key.startsWith("q") || key.startsWith("locked"))) unfreeze(true);
    cancelAnimationFrame(raf);
    const r = RR();

    if (key === "join") {
      app.innerHTML = `<div class="ply"><div class="pc up">
        ${LESSON && LESSON.topic ? `<div class="kicker">${esc(LESSON.topic)}</div>` : ""}<h1>${esc(COURSE.joinTitle)}</h1>
        <p class="mut" style="margin:0 0 6px;font-size:16px">Аты-жөніңізді жазыңыз — мұғалім экранда көреді.</p>
        <input class="field codef" id="room" placeholder="КОД" maxlength="6" value="${esc(room)}" autocomplete="off" ${PARAMS.get("r") ? "readonly" : ""}>
        <input class="field" id="name" placeholder="Аты-жөні" maxlength="18" value="${esc(name)}" autocomplete="off">
        <button class="btn" id="go" style="height:58px;font-size:18px">Кіру</button></div></div>`;
      const go2 = () => {
        const rr = $("#room").value.toUpperCase().replace(/[^A-Z0-9]/g, ""), n = $("#name").value.replace(/\s+/g, " ").trim().slice(0, 18);
        if (rr.length < 4) return toast("Ойын кодын енгізіңіз");
        if (!n) return toast("Атыңызды жазыңыз");
        const changed = rr !== room; room = rr; name = n; joined = true;
        store.set("room", room); store.set("name", name); store.set("joinedRoom", room);
        lastScreen = ""; if (changed || !client) go(); else send({t: "join", name}); render();
      };
      $("#go").onclick = go2; $("#name").onkeydown = e => { if (e.key === "Enter") go2(); };
      return;
    }
    if (key === "wait0" || key.startsWith("lobby") || key === "kicked") {
      const kicked = key === "kicked", lobby = key.startsWith("lobby");
      app.innerHTML = `<div class="ply">${top()}<div class="pc"><div class="wait up">${kicked ? "" : `<div class="ring"></div>`}
        <h1>${kicked ? "Сіз ойыннан шығарылдыңыз" : !lobby ? "Ойынды іздеудеміз…" : "Сіз ойындасыз!"}</h1>
        <p class="mut" style="margin:0;font-size:17px">${kicked ? "Атыңызды өзгертіп, қайта кіріңіз." : !lobby ? "Код дұрыс па? " + esc(room) : "Келесі: " + esc(S.setName || SETS[S.set].short) + ". Мұғалім бастағанша күтіңіз."}</p>
        ${lobby ? goalBox(false) : ""}
        ${lobby && S.set === "practice" && COURSE.tool.url ? `<a class="btn ghost" href="${COURSE.tool.url}" target="_blank" rel="noopener">${ICON.ext}<span>${esc(COURSE.tool.name)} алдын ала ашу</span></a>` : ""}
        ${kicked || !lobby ? `<button class="btn ghost" id="back">Кодты/атты өзгерту</button>` : ""}</div></div></div>`;
      const b = $("#back"); if (b) b.onclick = () => { joined = false; store.del("joinedRoom"); if (kicked) { pid = rid(14); store.set("pid", pid); go(); } lastScreen = ""; render(); };
      return;
    }
    if (key.startsWith("task")) {
      app.innerHTML = `<div class="ply"><div class="pw-wrap">${top()}<div class="ptimer"><i id="pt"></i></div><div id="pzl" class="hidden pzl">Кідірту — уақыт тоқтатылды</div>
        <div class="pk">${esc(r.k)} · <span id="ptt"></span> ${lvlB(r.lvl)}</div><div class="pq up">${esc(r.title)}</div>${whyBox(r)}
        <div class="langsw"><span class="mut">${LANG_LABEL}</span>${LANGS.map(([k, t]) => `<button data-l="${k}" class="${lang() === k ? "on" : ""}">${t}</button>`).join("")}</div>
        <ol class="psteps">${r.steps.map(s => `<li>${esc(L(s, lang()))}</li>`).join("")}</ol>
        ${r.crit && r.crit.length ? `<div class="crit">${r.crit.map(c => `<span>${esc(c)}</span>`).join("")}</div>` : ""}
        ${r.table ? dataTable(r.table) : ""}
        ${r.hints && r.hints.length ? `<details class="exd"><summary>${t_("Кеңестер", "Подсказки")} (${r.hints.length})</summary><ul class="hints">${r.hints.map(h => `<li>${esc(L(h, lang()))}</li>`).join("")}</ul></details>` : ""}
        ${extraTips(r, lang())}
      ${r.ex ? `<details class="exd"><summary>${t_("Мысалды көру", "Посмотреть образец")}</summary><img src="${esc(exUrl(r.ex))}" alt="Мысал" onerror="this.parentNode.remove()"></details>` : ""}
        ${r.checks && r.checks.length ? checkForm(r) : ""}
        ${COURSE.tool.url ? `<a class="btn ghost" href="${COURSE.tool.url}" target="_blank" rel="noopener" style="width:100%;margin:12px 0">${ICON.ext}<span>${esc(COURSE.tool.name)} ашу</span></a>` : `<div class="mut" style="font-size:13px;margin:12px 0">${t_("Тапсырманы компьютердегі ", "Задание выполняйте в ")}${esc(COURSE.tool.name)}${t_(" бағдарламасында орындап, нәтижені экспорттаңыз немесе скриншот жасаңыз.", ", затем экспортируйте результат или сделайте скриншот.")}</div>`}
        <input type="file" id="file" accept="image/*" class="hidden">
        ${r.shot === false ? "" : `${r.checks && r.checks.length ? `<div class="edh" style="margin-top:6px">${t_("Скриншот", "Скриншот диаграммы")}</div>` : ""}<div id="upbox" class="upbox"></div>`}
        
        </div></div>`;
      document.querySelectorAll(".langsw button").forEach(b => b.onclick = () => { store.set("lang", b.dataset.l); lastScreen = ""; render(); });
      $("#file").onchange = async e => {
        const f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return;
        try { draft = {k: qkey(), data: await compressImage(f)}; taskUpload(); }
        catch (err) { toast("Бұл файлды ашу мүмкін болмады. JPG/PNG немесе скриншот таңдаңыз"); }
      };
      upSig = ""; taskUpload(); bindChecks(r); updateChecks();
      const cp = $("#copytbl"); if (cp) cp.onclick = () => copyText(r.table.head.join("\t") + "\n" + r.table.rows.map(x => x.join("\t")).join("\n"));
      const loop = () => { const el = $("#pt"); if (!el) return; const ms = S.paused ? (S.endsIn || 0) : deadline - performance.now(); el.style.transform = `scaleX(${Math.max(0, Math.min(1, ms / (r.t * 1000)))})`; el.style.background = S.paused ? "var(--a2)" : "";
        const pl = $("#pzl"); if (pl) pl.classList.toggle("hidden", !S.paused); const tt = $("#ptt"); if (tt) tt.textContent = fmtTime(Math.max(0, Math.ceil(ms / 1000))); raf = requestAnimationFrame(loop); };
      loop();
      return;
    }
    if (key.startsWith("q")) {
      app.innerHTML = `<div class="ply"><div class="pw-wrap">${top()}<div class="ptimer"><i id="pt"></i></div><div id="pzl" class="hidden pzl">Кідірту — уақыт тоқтатылды</div>
        <div class="pq up">${esc(L(r.q, lang()))}</div>
        <div class="answers">${r.a.map((a, i) => `<button class="ans t${i}" data-a="${i}">${SHAPES[i]}<span>${esc(L(a, lang()))}</span></button>`).join("")}</div>
        <div class="pw"><button class="pwb" id="pwfr">${ICON.fr}<span>Мұздату</span><span class="k" id="kfr"></span></button><button class="pwb" id="pwx2">${ICON.x2}<span>Екі есе</span><span class="k" id="kx2"></span></button><button class="pwb" id="pwff">${ICON.ff}<span>50/50</span><span class="k" id="kff"></span></button></div>
        <div class="shld" id="shld">${ICON.sh}<span></span></div></div></div>`;
      document.querySelectorAll(".ans").forEach(b => b.onclick = () => sendMc(+b.dataset.a));
      $("#pwfr").onclick = openSheet;
      $("#pwx2").onclick = () => send({t: "pw", k: "x2", qi: S.qi});
      $("#pwff").onclick = () => send({t: "pw", k: "ff", qi: S.qi});
      updatePw();
      const loop = () => { const el = $("#pt"); if (!el) return; const ms = S.paused ? (S.endsIn || 0) : deadline - performance.now(); el.style.transform = `scaleX(${Math.max(0, Math.min(1, ms / (r.t * 1000)))})`; el.style.background = S.paused ? "var(--a2)" : ""; const pl = $("#pzl"); if (pl) pl.classList.toggle("hidden", !S.paused); raf = requestAnimationFrame(loop); };
      loop();
      if (P && P.frozen && P.frozen.k === qkey() && P.frozen.id !== seen.frozen) { seen.frozen = P.frozen.id; freeze(P.frozen.by); }
      return;
    }
    if (key.startsWith("locked")) {
      const lk = (myLock && myLock.k === qkey()) ? myLock : P.locked;
      app.innerHTML = `<div class="ply">${top()}<div class="pc"><div class="wait up"><div class="ans t${lk.a}" style="width:96px;height:96px;justify-content:center;border-radius:20px;min-height:0">${SHAPES[lk.a].replace('class="shape"', 'class="shape" style="width:44px;height:44px"')}</div><h1>Жауап қабылданды</h1><p class="mut" style="margin:0;font-size:17px">Басқаларды күтеміз…</p></div></div></div>`;
      return;
    }
    if (key.startsWith("rv")) {
      const L = P && P.last && P.last.k === qkey() ? P.last : null, ok = L && L.ok, none = !L || L.a == null;
      app.innerHTML = `<div class="ply">${top()}<div class="res ${ok ? "good" : none ? "none" : "bad"} up">
        <div class="big disp">${ok ? "Дұрыс!" : none ? "Уақыт бітті" : "Қате"}</div>${ok ? `<div class="pts">+${L.pts}</div>` : ""}
        ${ok && P.streak > 1 ? `<div class="rk">${P.streak} рет қатарынан</div>` : ""}${!ok ? `<div class="rk">Дұрыс жауап: ${esc(L(r.a[r.c], lang()))}</div>` : ""}
        ${P ? `<div class="rk">${P.rank}-орын · ${P.of} ойыншы</div>` : ""}</div></div>`;
      if (seen.res !== qkey()) { seen.res = qkey(); if (ok) { confetti(); vibrate(60); } else if (!none) vibrate([60, 60, 60]); }
      return;
    }
    if (key.startsWith("review")) {
      const g = P && P.grade && P.grade.k === qkey() ? P.grade.g : null, sent = mySub(), img = sentLocal.k === qkey() ? sentLocal.data : null;
      app.innerHTML = `<div class="ply">${top()}<div class="pc"><div class="wait up">
        ${img ? `<img class="prev" src="${img}" alt="Сіздің жұмысыңыз" style="max-height:38vh">` : ""}
        <h1 style="font-size:28px">${sent ? "Мұғалім жұмыстарды қарап жатыр" : "Жұмыс жіберілмеді"}</h1>
        ${g ? `<div class="gbadge" style="background:${GRADE[g].c}">${GRADE[g].t}</div>` : sent ? `<p class="mut" style="margin:0;font-size:17px">Экранға қараңыз</p>` : `<p class="mut" style="margin:0;font-size:17px">Келесі тапсырмада үлгеріңіз!</p>`}
        ${fbBox()}
      </div></div></div>`;
      if (g === "best" && seen.res !== qkey() + "best") { seen.res = qkey() + "best"; confetti(); vibrate(60); }
      return;
    }
    if (key.startsWith("vote")) {
      const cands = S.cands || [];
      app.innerHTML = `<div class="ply">${top()}<div class="pw-wrap"><div class="pq up" style="margin-top:14px">Сыныптастардың жұмыстарын бағалаңыз</div>
        <p class="mut" style="margin:0 0 12px;font-size:14px">Әр жұмысқа 1–5 жұлдыз қойыңыз. Суретті үлкейту үшін басыңыз. Өзіңізді бағалай алмайсыз.</p>
        <div class="vgrid">${cands.map(c => { const th = THUMBS[c[0]], own = c[0] === pid;
          return `<div class="vcard ${own ? "own" : ""}" data-p="${esc(c[0])}"><button class="vimg" aria-label="${esc(c[1])} жұмысын ашу">${th && th.k === qkey() ? `<img src="${th.data}" alt="${esc(c[1])} жұмысы">` : `<span class="mut">Жүктелуде…</span>`}</button>
            <div class="vname">${esc(c[1])}${own ? " · сіз" : ""}</div>${own ? "" : starRow(c[0])}</div>`; }).join("") || `<p class="mut">Бағалайтын жұмыс жоқ</p>`}</div>
      </div></div>`;
      document.querySelectorAll(".vcard .vimg").forEach(b => b.onclick = () => { viewer = b.parentNode.dataset.p; drawViewer(); });
      bindStars(app);
      return;
    }
    if (S.phase === "board" || S.phase === "final") {
      const fin = S.phase === "final", L = P && P.last && P.last.k === qkey() ? P.last : null;
      const taskLine = L && isTask(r) ? (L.place ? t_("Орын", "Место") + ": " + L.place + " · +" + L.pts + (RU ? " очков" : " ұпай") : L.none ? "Жұмыс жіберілмеді" : `+${L.pts} ұпай${L.g === "best" ? " · үздік жұмыс" : L.g === "redo" ? " · пысықтау керек" : ""}${L.avg ? " · бағаңыз ★ " + String(L.avg).replace(".", ",") : ""}${L.fav ? " · сыныптастар таңдауы" : ""}`) : "";
      app.innerHTML = `<div class="ply">${top()}<div class="pc"><div class="wait up">
        <div class="big disp" style="font-size:88px">${P ? P.rank : "–"}</div><div class="mut" style="font-size:17px;margin-top:-6px">${P ? `орын · ${P.of} ойыншы` : ""}</div>
        ${taskLine ? `<div class="gbadge" style="background:var(--s2);color:var(--tx)">${esc(taskLine)}</div>` : ""}
        <h1 style="font-size:28px">${fin ? (S.set === "quiz" ? "Квиз аяқталды" : "Практика аяқталды") : "Экранға қараңыз"}</h1>
        <p class="mut" style="margin:0;font-size:17px">${P ? P.score + " ұпай" : ""}${fin && S.set === "quiz" ? " · келесі — практика" : fin ? " · Рахмет!" : ""}</p></div></div></div>`;
      if (fin && P && P.rank <= 3 && prev !== key) confetti();
    }
  }
  function updatePw() {
    if (!P || !S) return;
    const pw = P.pw || {fr: 0, x2: 0, ff: 0, sh: 0};
    const hid = P.hide && P.hide.k === qkey() ? P.hide.idx : [];
    document.querySelectorAll(".ans").forEach(b => b.classList.toggle("gone", hid.includes(+b.dataset.a)));
    const set = (id, n, on) => { const b = $("#pw" + id), k = $("#k" + id); if (!b) return; k.textContent = n > 0 ? "×" + n : ""; b.disabled = !(n > 0) || on; b.classList.toggle("on", !!on); if (on) b.style.opacity = 1; };
    set("fr", pw.fr, false); set("x2", pw.x2, P.x2on === qkey()); set("ff", pw.ff, hid.length > 0);
    const sh = $("#shld"); if (sh) sh.querySelector("span").textContent = pw.sh > 0 ? "Қалқан белсенді: бір мұздатудан қорғайды" : "Қалқан жоқ";
  }
  if (room) go();
  render();
}

if (typeof mqtt === "undefined") app.innerHTML = '<div class="ply"><div class="pc"><h1>Жүктелмеді</h1><p class="mut">Бетті жаңартыңыз.</p></div></div>';
else if (IS_HOST) Host(); else Player();
