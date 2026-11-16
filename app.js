const KEY = "home-finder-v1";
const TYPES = ["證件", "電子產品", "藥物", "工具", "文件", "日常用品", "其他"];
const STATUSES = [
  { id: "in", label: "喺原位" },
  { id: "using", label: "用緊" },
  { id: "borrowed", label: "借出" },
  { id: "archived", label: "已封存" },
];

const ICONS = {
  證件: "🛂",
  電子產品: "🔌",
  藥物: "💊",
  工具: "🔧",
  文件: "📄",
  日常用品: "🏠",
  其他: "📦",
};

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
}

function now() {
  return new Date().toISOString();
}

function minutesAgo(n) {
  return new Date(Date.now() - n * 60 * 1000).toISOString();
}

function seed() {
  const a = { id: "m1", name: "成員一" };
  const b = { id: "m2", name: "成員二" };
  const locs = [
    { id: "l1", name: "大廳電視櫃", note: "左邊第二格", photo: "", updatedAt: now(), updatedBy: a.id },
    { id: "l2", name: "睡房衣櫃 · 第二格", note: "右邊內衣格上面", photo: "", updatedAt: now(), updatedBy: a.id },
    { id: "l3", name: "廚房吊櫃", note: "爐頭上方靠窗", photo: "", updatedAt: now(), updatedBy: b.id },
    { id: "l4", name: "玄關鞋櫃", note: "上層小盒", photo: "", updatedAt: now(), updatedBy: a.id },
    { id: "l5", name: "書房抽屜", note: "書枱右邊第一格", photo: "", updatedAt: now(), updatedBy: b.id },
  ];
  const items = [
    { id: "i1", name: "護照", aliases: "Passport", type: "證件", locationId: "l5", notes: "連同舊護照一齊放。", photos: [], status: "in", updatedAt: now(), updatedBy: a.id },
    { id: "i2", name: "充電線", aliases: "充電器, USB線", type: "電子產品", locationId: "l1", notes: "白色 USB-C 線，綁咗橡筋。", photos: [], status: "in", updatedAt: now(), updatedBy: b.id },
    { id: "i3", name: "常備藥箱", aliases: "藥、感冒藥", type: "藥物", locationId: "l3", notes: "有藥油同膠布。", photos: [], status: "in", updatedAt: now(), updatedBy: a.id },
    { id: "i4", name: "旅遊轉插", aliases: "轉插、萬用插", type: "電子產品", locationId: "l2", notes: "黑色細袋裝。", photos: [], status: "in", updatedAt: now(), updatedBy: a.id },
    { id: "i5", name: "保溫壺", aliases: "", type: "日常用品", locationId: "l3", notes: "", photos: [], status: "using", updatedAt: now(), updatedBy: b.id },
    { id: "i6", name: "後備鎖匙", aliases: "鎖匙、後備匙", type: "工具", locationId: "l4", notes: "藍色匙扣。", photos: [], status: "in", updatedAt: now(), updatedBy: a.id },
  ];
  const logs = [
    { id: "g1", at: minutesAgo(180), by: a.id, action: "add-loc", locationId: "l1", summary: "新增位置「大廳電視櫃」" },
    { id: "g2", at: minutesAgo(170), by: a.id, action: "add-loc", locationId: "l5", summary: "新增位置「書房抽屜」" },
    { id: "g3", at: minutesAgo(160), by: b.id, action: "add-loc", locationId: "l3", summary: "新增位置「廚房吊櫃」" },
    { id: "g4", at: minutesAgo(140), by: a.id, action: "add-item", itemId: "i1", locationId: "l5", summary: "新增物品「護照」，放喺書房抽屜" },
    { id: "g5", at: minutesAgo(120), by: b.id, action: "add-item", itemId: "i2", locationId: "l1", summary: "新增物品「充電線」，放喺大廳電視櫃" },
    { id: "g6", at: minutesAgo(90), by: a.id, action: "add-item", itemId: "i3", locationId: "l3", summary: "新增物品「常備藥箱」，放喺廚房吊櫃" },
    { id: "g7", at: minutesAgo(60), by: a.id, action: "add-item", itemId: "i4", locationId: "l2", summary: "新增物品「旅遊轉插」，放喺睡房衣櫃 · 第二格" },
    { id: "g8", at: minutesAgo(40), by: a.id, action: "add-item", itemId: "i6", locationId: "l4", summary: "新增物品「後備鎖匙」，放喺玄關鞋櫃" },
    { id: "g9", at: minutesAgo(25), by: b.id, action: "add-item", itemId: "i5", locationId: "l3", summary: "新增物品「保溫壺」，放喺廚房吊櫃" },
    { id: "g10", at: minutesAgo(10), by: b.id, action: "edit-item", itemId: "i5", locationId: "l3", summary: "改咗「保溫壺」：狀態由「喺原位」改為「用緊」" },
  ];
  return { members: [a, b], currentMemberId: a.id, locations: locs, items, logs };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    const data = JSON.parse(raw);
    if (!data.items || !data.locations) return seed();
    if (!Array.isArray(data.logs)) data.logs = [];
    return data;
  } catch {
    return seed();
  }
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

let state = load();
let photoDrafts = [];

function authCfg() {
  return window.HOME_FINDER_AUTH || {};
}
function isAuthed() {
  const { tokenKey, hash } = authCfg();
  if (!tokenKey || !hash) return false;
  return localStorage.getItem(tokenKey) === hash || sessionStorage.getItem(tokenKey) === hash;
}
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function tryLogin(password, remember) {
  const { salt, hash, tokenKey } = authCfg();
  const got = await sha256Hex(salt + password);
  if (got !== hash) return false;
  sessionStorage.setItem(tokenKey, hash);
  if (remember) localStorage.setItem(tokenKey, hash);
  else localStorage.removeItem(tokenKey);
  return true;
}
function logout() {
  const { tokenKey } = authCfg();
  if (tokenKey) {
    localStorage.removeItem(tokenKey);
    sessionStorage.removeItem(tokenKey);
  }
  render();
}
function renderLogin() {
  const root = document.getElementById("app");
  root.innerHTML = `
    <div class="login">
      <div class="brand"><b>喺邊</b><span>屋企嘢放咗喺邊</span></div>
      <form id="login-form" class="form login-card">
        <p>請輸入家庭密碼先進入。唔識密碼嘅人睇唔到清單。</p>
        <label class="field">家庭密碼<input name="password" type="password" required autocomplete="current-password"></label>
        <label class="remember"><input name="remember" type="checkbox" checked> 記住我（呢部電話下次唔使再輸入）</label>
        <p class="login-error hide" id="login-error">密碼不正確，請再試。</p>
        <button class="btn" type="submit">進入</button>
      </form>
    </div>`;
  const form = document.getElementById("login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const ok = await tryLogin(String(data.get("password") || ""), form.remember.checked);
    const err = document.getElementById("login-error");
    if (!ok) {
      err.classList.remove("hide");
      form.password.value = "";
      form.password.focus();
      return;
    }
    window.__formPhotosReady = false;
    render();
  });
}

function member(id) {
  return state.members.find((m) => m.id === id) || { name: "—" };
}
function loc(id) {
  return state.locations.find((l) => l.id === id);
}
function locName(id) {
  return loc(id)?.name || "未指定位置";
}
function addLog(entry) {
  if (!state.logs) state.logs = [];
  state.logs.unshift({
    id: uid(),
    at: now(),
    by: state.currentMemberId,
    ...entry,
  });
  if (state.logs.length > 500) state.logs.length = 500;
}
function sortLogs(list) {
  return [...list].sort((a, b) => (b.at || "").localeCompare(a.at || ""));
}
function relatedLogs({ itemId, locationId, limit = 8 }) {
  const list = sortLogs((state.logs || []).filter((e) => {
    if (itemId && e.itemId === itemId) return true;
    if (locationId && (e.locationId === locationId || e.locationIdFrom === locationId)) return true;
    return false;
  }));
  return limit ? list.slice(0, limit) : list;
}
function fmtLogTime(iso) {
  try {
    return new Date(iso).toLocaleString("zh-HK", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
function logCards(list, emptyText) {
  if (!list.length) return `<div class="empty">${emptyText}</div>`;
  return `<div class="log-list">${list.map((e) => {
    const href = e.itemId && item(e.itemId) ? `#/items/${e.itemId}` : e.locationId && loc(e.locationId) ? `#/locations/${e.locationId}` : "";
    const tag = href ? "button" : "div";
    const go = href ? ` data-go="${href}"` : "";
    return `<${tag} class="log-card"${go}>
      <time>${fmtLogTime(e.at)}</time>
      <b>${escapeHtml(member(e.by).name)}</b>
      <p>${escapeHtml(e.summary)}</p>
    </${tag}>`;
  }).join("")}</div>`;
}
function item(id) {
  return state.items.find((i) => i.id === id);
}
function statusLabel(id) {
  return (STATUSES.find((s) => s.id === id) || STATUSES[0]).label;
}
function fmtTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("zh-HK", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function route() {
  const hash = (location.hash || "#/").replace(/^#/, "") || "/";
  const parts = hash.split("/").filter(Boolean);
  return { path: "/" + parts.join("/"), parts };
}

function go(to) {
  location.hash = to;
}

const $ = (sel, el = document) => el.querySelector(sel);

function iconSearch() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></svg>`;
}
function svgNav(kind, on) {
  const c = "currentColor";
  if (kind === "find") return `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></svg>`;
  if (kind === "items") return `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>`;
  if (kind === "logs") return `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3.2 1.8"/></svg>`;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8"><path d="M12 21s7-6.2 7-11.2A7 7 0 0 0 5 9.8C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.3"/></svg>`;
}

function nav(active) {
  return `<nav class="nav">
    <button class="${active === "find" ? "on" : ""}" data-go="#/">${svgNav("find")}<span>搵</span></button>
    <button class="${active === "items" ? "on" : ""}" data-go="#/items">${svgNav("items")}<span>物品</span></button>
    <button class="${active === "locs" ? "on" : ""}" data-go="#/locations">${svgNav("locs")}<span>位置</span></button>
    <button class="${active === "logs" ? "on" : ""}" data-go="#/logs">${svgNav("logs")}<span>紀錄</span></button>
  </nav>`;
}

function thumbHTML(photos, type) {
  const src = photos && photos[0];
  if (src) return `<div class="thumb"><img src="${src}" alt=""></div>`;
  return `<div class="thumb">${ICONS[type] || "📦"}</div>`;
}

function visibleItems() {
  return state.items.filter((i) => i.status !== "archived");
}

function countAt(locationId) {
  return visibleItems().filter((i) => i.locationId === locationId).length;
}

function matchesQuery(it, q) {
  if (!q) return true;
  const locName = loc(it.locationId)?.name || "";
  const blob = [it.name, it.aliases, it.type, it.notes, locName, statusLabel(it.status)].join(" ").toLowerCase();
  return q.toLowerCase().split(/\s+/).every((w) => blob.includes(w));
}

function renderFind() {
  const q = decodeURIComponent(new URLSearchParams(location.hash.split("?")[1] || "").get("q") || "");
  const selectedLoc = new URLSearchParams(location.hash.split("?")[1] || "").get("loc") || "";
  let list = visibleItems();
  if (selectedLoc) list = list.filter((i) => i.locationId === selectedLoc);
  list = list.filter((i) => matchesQuery(i, q)).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  const locName = loc(selectedLoc)?.name;

  return `<div class="top">
      <div class="brand"><b>喺邊</b><span>屋企嘢放咗喺邊</span></div>
      <button class="chip-user" data-action="switch-user">${member(state.currentMemberId).name}</button>
    </div>
    <div class="demo-note">呢個係 V1 試用版。每次改動都會自動記下時間、邊個改同改咗咩；資料暫時只存喺呢部裝置。</div>
    <div class="search-wrap">
      <div class="search">${iconSearch()}<input id="q" type="search" placeholder="輸入關鍵字、類型或別名" value="${escapeAttr(q)}"></div>
    </div>
    <div class="section">
      <div class="section-h"><h2>按位置睇</h2><button class="linkish" data-go="#/locations">全部位置</button></div>
      <div class="horiz">
        ${state.locations.map((l) => `<button class="loc-chip ${selectedLoc === l.id ? "active" : ""}" data-go="#/?loc=${l.id}">
          <b>${escapeHtml(l.name)}</b><small>${countAt(l.id)} 件物品</small>
        </button>`).join("")}
      </div>
    </div>
    <div class="section">
      <div class="section-h"><h2>${locName ? escapeHtml(locName) + "有咩" : q ? "搜尋結果" : "最近更新"}</h2><span>${list.length} 件</span></div>
      ${list.length ? `<div class="card-list">${list.map(itemCard).join("")}</div>` : `<div class="empty">搵唔到符合嘅物品。<br>試下改關鍵字，或者新增一件。</div>`}
    </div>
    <button class="fab" data-go="#/items/new" aria-label="新增物品">＋</button>
    ${nav("find")}`;
}

function itemCard(it) {
  const l = loc(it.locationId);
  const badgeClass = it.status === "in" ? "" : it.status === "archived" ? "archive" : "out";
  return `<button class="item-card" data-go="#/items/${it.id}">
    ${thumbHTML(it.photos, it.type)}
    <div class="meta"><b>${escapeHtml(it.name)}</b><p>${escapeHtml(l ? l.name : "未指定位置")}${it.notes ? " · " + escapeHtml(it.notes) : ""}</p></div>
    <span class="badge ${badgeClass}">${statusLabel(it.status)}</span>
  </button>`;
}

function renderItems() {
  const type = new URLSearchParams(location.hash.split("?")[1] || "").get("type") || "";
  const showArchived = new URLSearchParams(location.hash.split("?")[1] || "").get("archived") === "1";
  let list = showArchived ? state.items.filter((i) => i.status === "archived") : visibleItems();
  if (type) list = list.filter((i) => i.type === type);
  list = list.sort((a, b) => a.name.localeCompare(b.name, "zh-HK"));
  return `<div class="page-head"><h1>物品</h1><button class="text-btn" data-go="#/items/new">新增</button></div>
    <div class="filters">
      <button class="pill ${!type && !showArchived ? "on" : ""}" data-go="#/items">全部</button>
      ${TYPES.map((t) => `<button class="pill ${type === t ? "on" : ""}" data-go="#/items?type=${encodeURIComponent(t)}">${t}</button>`).join("")}
      <button class="pill ${showArchived ? "on" : ""}" data-go="#/items?archived=1">已封存</button>
    </div>
    <div class="section">
      ${list.length ? `<div class="card-list">${list.map(itemCard).join("")}</div>` : `<div class="empty">呢類暫時未有物品。</div>`}
    </div>
    <button class="fab" data-go="#/items/new" aria-label="新增物品">＋</button>
    ${nav("items")}`;
}

function renderItem(id) {
  const it = item(id);
  if (!it) return notFound("搵唔到呢件物品");
  const l = loc(it.locationId);
  const photos = (it.photos || []).map((src) => `<img src="${src}" alt="">`).join("") || `<div class="ph"></div>`;
  return `<div class="page-head">
      <button class="icon-btn" data-go="#/items">返回</button>
      <h1></h1>
      <button class="text-btn" data-go="#/items/${it.id}/edit">修改</button>
    </div>
    <div class="detail">
      <div class="hero-photos">${photos}</div>
      <p class="kicker">${escapeHtml(it.type)} · 由${escapeHtml(member(it.updatedBy).name)}更新 ${fmtTime(it.updatedAt)}</p>
      <h2>${escapeHtml(it.name)}</h2>
      <div class="kv">
        <button data-go="#/locations/${it.locationId}"><span>位置</span><b>${escapeHtml(l ? l.name : "未指定")}</b></button>
        <div class="row"><span>狀態</span><b>${statusLabel(it.status)}</b></div>
        ${it.aliases ? `<div class="row"><span>別名／關鍵字</span><b>${escapeHtml(it.aliases)}</b></div>` : ""}
      </div>
      ${it.notes ? `<p class="notes">${escapeHtml(it.notes)}</p>` : ""}
      <div class="section-h" style="padding-top:16px"><h2>改動紀錄</h2><button class="linkish" data-go="#/logs">全部紀錄</button></div>
      ${logCards(relatedLogs({ itemId: it.id }), "呢件物品暫時未有改動紀錄。")}
      <div class="actions">
        ${it.status === "archived"
          ? `<button class="btn" data-action="restore-item" data-id="${it.id}">取消封存</button>`
          : `<button class="btn ghost" data-action="archive-item" data-id="${it.id}">封存</button>`}
        <button class="btn danger" data-action="delete-item" data-id="${it.id}">刪除</button>
      </div>
    </div>
    ${nav("items")}`;
}

function renderItemForm(id) {
  const it = id ? item(id) : null;
  if (!window.__formPhotosReady) {
    photoDrafts = it ? [...(it.photos || [])] : [];
    window.__formPhotosReady = true;
  }
  const usePhotos = photoDrafts;
  return `<div class="page-head">
      <button class="icon-btn" data-go="${it ? "#/items/" + it.id : "#/items"}">取消</button>
      <h1>${it ? "修改物品" : "新增物品"}</h1>
      <button class="text-btn" type="submit" form="item-form">儲存</button>
    </div>
    <form id="item-form" class="form" data-form="item" data-id="${it ? it.id : ""}">
      <label class="field">名稱<input name="name" required placeholder="例如：充電線" value="${escapeAttr(it?.name || "")}"></label>
      <label class="field">別名／關鍵字<input name="aliases" placeholder="例如：充電器、USB線" value="${escapeAttr(it?.aliases || "")}"></label>
      <label class="field">類型
        <select name="type">${TYPES.map((t) => `<option ${it?.type === t ? "selected" : ""}>${t}</option>`).join("")}</select>
      </label>
      <label class="field">位置
        <select name="locationId">
          <option value="">請選擇位置</option>
          ${state.locations.map((l) => `<option value="${l.id}" ${(it?.locationId || new URLSearchParams(location.hash.split("?")[1] || "").get("loc") || "") === l.id ? "selected" : ""}>${escapeHtml(l.name)}</option>`).join("")}
        </select>
      </label>
      <button type="button" class="linkish" data-go="#/locations/new" style="align-self:flex-start">＋ 新增位置到清單</button>
      <label class="field">狀態
        <select name="status">${STATUSES.filter((s) => s.id !== "archived").map((s) => `<option value="${s.id}" ${ (it?.status || "in") === s.id ? "selected" : ""}>${s.label}</option>`).join("")}</select>
      </label>
      <label class="field">備註<textarea name="notes" placeholder="顏色、盒、旁邊仲有咩">${escapeHtml(it?.notes || "")}</textarea></label>
      <div class="field"><span>相片</span>
        <div class="photo-row">
          ${usePhotos.map((src, i) => `<div class="shot"><img src="${src}" alt=""><button type="button" data-action="remove-photo" data-index="${i}">×</button></div>`).join("")}
          <label class="photo-add">影相或上傳
            <input type="file" accept="image/*" capture="environment" hidden data-action="add-photo">
          </label>
        </div>
      </div>
      <button class="btn" type="submit">儲存</button>
    </form>
    ${nav("items")}`;
}

function renderLocations() {
  const list = [...state.locations].sort((a, b) => a.name.localeCompare(b.name, "zh-HK"));
  return `<div class="page-head"><h1>位置</h1><button class="text-btn" data-go="#/locations/new">新增</button></div>
    <div class="section">
      <div class="card-list">
        ${list.map((l) => `<div class="loc-card">
          <button type="button" class="loc-main" data-go="#/locations/${l.id}">
            ${l.photo ? `<div class="thumb"><img src="${l.photo}" alt=""></div>` : `<div class="thumb">📍</div>`}
            <div class="meta"><b>${escapeHtml(l.name)}</b><p>${escapeHtml(l.note || "未有說明")} · ${countAt(l.id)} 件物品</p></div>
            <span class="badge">${countAt(l.id)}</span>
          </button>
          <div class="card-actions">
            <button type="button" class="linkish" data-go="#/locations/${l.id}/edit">改名／修改</button>
            <button type="button" class="linkish danger-link" data-action="delete-loc" data-id="${l.id}">刪除</button>
          </div>
        </div>`).join("") || `<div class="empty">未有位置。先寫間屋有邊啲位置。</div>`}
      </div>
    </div>
    <button class="fab" data-go="#/locations/new" aria-label="新增位置">＋</button>
    ${nav("locs")}`;
}

function renderLocation(id) {
  const l = loc(id);
  if (!l) return notFound("搵唔到呢個位置");
  const list = visibleItems().filter((i) => i.locationId === id);
  const archived = state.items.filter((i) => i.locationId === id && i.status === "archived");
  return `<div class="page-head">
      <button class="icon-btn" data-go="#/locations">返回</button>
      <h1>${escapeHtml(l.name)}</h1>
      <button class="text-btn" data-go="#/locations/${l.id}/edit">修改</button>
    </div>
    <div class="detail">
      <div class="hero-photos">${l.photo ? `<img src="${l.photo}" alt="">` : `<div class="ph"></div>`}</div>
      <p class="kicker">由${escapeHtml(member(l.updatedBy).name)}更新 ${fmtTime(l.updatedAt)}</p>
      <h2>${escapeHtml(l.name)}</h2>
      ${l.note ? `<p class="notes">${escapeHtml(l.note)}</p>` : ""}
      <div class="actions" style="margin-top:14px">
        <button class="btn" data-go="#/items/new?loc=${l.id}">喺呢度加物品</button>
        <button class="btn danger" data-action="delete-loc" data-id="${l.id}">刪除位置</button>
      </div>
      <div class="section-h" style="padding-top:18px"><h2>呢度有咩</h2><span>${list.length} 件</span></div>
      ${list.length ? `<div class="card-list">${list.map(itemCard).join("")}</div>` : `<div class="empty">呢個位置暫時未有物品。</div>`}
      ${archived.length ? `<p class="kicker" style="margin-top:16px">已封存 ${archived.length} 件</p>` : ""}
      <div class="section-h" style="padding-top:16px"><h2>改動紀錄</h2><button class="linkish" data-go="#/logs">全部紀錄</button></div>
      ${logCards(relatedLogs({ locationId: l.id }), "呢個位置暫時未有改動紀錄。")}
    </div>
    ${nav("locs")}`;
}

function renderLocForm(id) {
  const l = id ? loc(id) : null;
  if (!window.__formPhotosReady) {
    photoDrafts = l?.photo ? [l.photo] : [];
    window.__formPhotosReady = true;
  }
  return `<div class="page-head">
      <button class="icon-btn" data-go="${l ? "#/locations/" + l.id : "#/locations"}">取消</button>
      <h1>${l ? "修改位置" : "新增位置"}</h1>
      <button class="text-btn" type="submit" form="loc-form">儲存</button>
    </div>
    <form id="loc-form" class="form" data-form="location" data-id="${l ? l.id : ""}">
      <label class="field">位置名稱<input name="name" required placeholder="例如：睡房衣櫃 · 第二格" value="${escapeAttr(l?.name || "")}"></label>
      <label class="field">說明<textarea name="note" placeholder="邊邊、第幾格、點樣認">${escapeHtml(l?.note || "")}</textarea></label>
      <div class="field"><span>位置相片</span>
        <div class="photo-row">
          ${photoDrafts[0] ? `<div class="shot"><img src="${photoDrafts[0]}" alt=""><button type="button" data-action="remove-photo" data-index="0" aria-label="刪除相片">×</button></div>` : ""}
          <label class="photo-add">影相或上傳
            <input type="file" accept="image/*" capture="environment" hidden data-action="add-photo">
          </label>
        </div>
      </div>
      <button class="btn" type="submit">儲存</button>
    </form>
    ${nav("locs")}`;
}

function renderLogs() {
  const logs = sortLogs(state.logs || []);
  return `<div class="page-head"><h1>紀錄</h1></div>
    <div class="section">
      <p class="kicker" style="margin-bottom:10px">有改動就會自動記低，唔使另外再更新。</p>
      ${logCards(logs, "暫時未有紀錄。試下新增或修改一件物品，就會喺呢度出現。")}
    </div>
    ${nav("logs")}`;
}

function notFound(msg) {
  return `<div class="page-head"><button class="icon-btn" data-go="#/">返回</button><h1>搵唔到</h1></div>
    <div class="section"><div class="empty">${msg}</div></div>${nav("find")}`;
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(s) {
  return escapeHtml(s);
}

function render() {
  if (!isAuthed()) {
    renderLogin();
    return;
  }
  const r = route();
  const root = document.getElementById("app");
  const p = r.parts;
  let html;
  if (p[0] === "items" && p[1] === "new") html = renderItemForm(null);
  else if (p[0] === "items" && p[2] === "edit") html = renderItemForm(p[1]);
  else if (p[0] === "items" && p[1]) html = renderItem(p[1]);
  else if (p[0] === "items") html = renderItems();
  else if (p[0] === "locations" && p[1] === "new") html = renderLocForm(null);
  else if (p[0] === "locations" && p[2] === "edit") html = renderLocForm(p[1]);
  else if (p[0] === "locations" && p[1]) html = renderLocation(p[1]);
  else if (p[0] === "locations") html = renderLocations();
  else if (p[0] === "logs") html = renderLogs();
  else html = renderFind();
  root.innerHTML = html;
  bind();
}

function bind() {
  document.querySelectorAll("[data-go]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (el.tagName === "FORM") return;
      photoDrafts = [];
      go(el.getAttribute("data-go"));
    });
  });
  const q = document.getElementById("q");
  if (q) {
    q.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const locId = new URLSearchParams(location.hash.split("?")[1] || "").get("loc");
        const params = new URLSearchParams();
        if (q.value) params.set("q", q.value);
        if (locId) params.set("loc", locId);
        go("#/?" + params.toString());
      }
    });
  }
  document.querySelectorAll("[data-action]").forEach((el) => {
    const action = el.getAttribute("data-action");
    if (action === "add-photo") {
      el.addEventListener("change", async () => {
        const file = el.files && el.files[0];
        if (!file) return;
        const data = await compressImage(file);
        photoDrafts = [...photoDrafts, data];
        render();
      });
    } else {
      el.addEventListener("click", () => handleAction(action, el));
    }
  });
  document.querySelectorAll("form[data-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitForm(form);
    });
  });
}

async function handleAction(action, el) {
  const id = el.getAttribute("data-id");
  if (action === "switch-user") {
    showMemberSheet();
  } else if (action === "remove-photo") {
    const i = Number(el.getAttribute("data-index"));
    if (Number.isInteger(i) && i >= 0) photoDrafts.splice(i, 1);
    render();
  } else if (action === "archive-item") {
    const it = item(id);
    if (!it) return;
    it.status = "archived";
    touch(it);
    addLog({ action: "archive-item", itemId: it.id, locationId: it.locationId, summary: `封存「${it.name}」` });
    save(state);
    go("#/items");
  } else if (action === "restore-item") {
    const it = item(id);
    if (!it) return;
    it.status = "in";
    touch(it);
    addLog({ action: "restore-item", itemId: it.id, locationId: it.locationId, summary: `取消封存「${it.name}」，狀態改為喺原位` });
    save(state);
    render();
  } else if (action === "delete-item") {
    if (!confirm("確定刪除呢件物品？刪除後唔能還原，如只係暫時唔用，建議改用封存。")) return;
    const it = item(id);
    const name = it?.name || "物品";
    const locationId = it?.locationId || "";
    state.items = state.items.filter((i) => i.id !== id);
    addLog({ action: "delete-item", itemId: id, locationId, summary: `刪除物品「${name}」` });
    save(state);
    go("#/items");
  } else if (action === "delete-loc") {
    const n = visibleItems().filter((i) => i.locationId === id).length;
    if (n && !confirm(`呢個位置仲有 ${n} 件物品。刪除後，呢啲物品會變成未指定位置。確定刪除？`)) return;
    if (!n && !confirm("確定刪除呢個位置？")) return;
    const l = loc(id);
    const name = l?.name || "位置";
    state.locations = state.locations.filter((x) => x.id !== id);
    state.items.forEach((i) => {
      if (i.locationId === id) i.locationId = "";
    });
    addLog({ action: "delete-loc", locationId: id, summary: `刪除位置「${name}」${n ? `，原有 ${n} 件物品改為未指定位置` : ""}` });
    save(state);
    go("#/locations");
  }
}

function touch(obj) {
  obj.updatedAt = now();
  obj.updatedBy = state.currentMemberId;
}

function submitForm(form) {
  const kind = form.getAttribute("data-form");
  const id = form.getAttribute("data-id");
  const data = new FormData(form);
  if (kind === "item") {
    const prev = id ? { ...item(id), photos: [...(item(id).photos || [])] } : null;
    const rec = id ? item(id) : { id: uid(), photos: [] };
    rec.name = String(data.get("name") || "").trim();
    rec.aliases = String(data.get("aliases") || "").trim();
    rec.type = String(data.get("type") || "其他");
    rec.locationId = String(data.get("locationId") || "");
    rec.status = String(data.get("status") || "in");
    rec.notes = String(data.get("notes") || "").trim();
    rec.photos = [...photoDrafts];
    if (!rec.name) return;
    if (prev) {
      const changes = [];
      if (prev.name !== rec.name) changes.push(`名稱由「${prev.name}」改為「${rec.name}」`);
      if (prev.aliases !== rec.aliases) changes.push("更新咗別名／關鍵字");
      if (prev.type !== rec.type) changes.push(`類型由「${prev.type}」改為「${rec.type}」`);
      if (prev.locationId !== rec.locationId) changes.push(`位置由「${locName(prev.locationId)}」改為「${locName(rec.locationId)}」`);
      if (prev.status !== rec.status) changes.push(`狀態由「${statusLabel(prev.status)}」改為「${statusLabel(rec.status)}」`);
      if (prev.notes !== rec.notes) changes.push("更新咗備註");
      if ((prev.photos || []).join() !== rec.photos.join()) {
        changes.push(rec.photos.length > (prev.photos || []).length ? "新增咗相片" : rec.photos.length ? "更新咗相片" : "移除咗相片");
      }
      if (changes.length) {
        addLog({
          action: "edit-item",
          itemId: rec.id,
          locationId: rec.locationId,
          locationIdFrom: prev.locationId,
          summary: `改咗「${rec.name}」：${changes.join("；")}`,
        });
      }
    } else {
      addLog({
        action: "add-item",
        itemId: rec.id,
        locationId: rec.locationId,
        summary: `新增物品「${rec.name}」${rec.locationId ? "，放喺" + locName(rec.locationId) : ""}`,
      });
    }
    touch(rec);
    if (!id) state.items.push(rec);
    save(state);
    photoDrafts = [];
    go("#/items/" + rec.id);
  } else {
    const prev = id ? { ...loc(id) } : null;
    const rec = id ? loc(id) : { id: uid(), photo: "" };
    rec.name = String(data.get("name") || "").trim();
    rec.note = String(data.get("note") || "").trim();
    rec.photo = photoDrafts[0] || "";
    if (!rec.name) return;
    if (prev) {
      const changes = [];
      if (prev.name !== rec.name) changes.push(`名稱由「${prev.name}」改為「${rec.name}」`);
      if (prev.note !== rec.note) changes.push("更新咗說明");
      if ((prev.photo || "") !== (rec.photo || "")) changes.push(rec.photo ? "更新咗位置相片" : "移除咗位置相片");
      if (changes.length) {
        addLog({ action: "edit-loc", locationId: rec.id, summary: `改咗位置「${rec.name}」：${changes.join("；")}` });
      }
    } else {
      addLog({ action: "add-loc", locationId: rec.id, summary: `新增位置「${rec.name}」` });
    }
    touch(rec);
    if (!id) state.locations.push(rec);
    save(state);
    photoDrafts = [];
    go("#/locations/" + rec.id);
  }
}

function showMemberSheet() {
  const wrap = document.createElement("div");
  wrap.className = "sheet";
  wrap.innerHTML = `<div class="panel">
    <h3>而家用緊邊個身分</h3>
    ${state.members.map((m) => `<button class="member" data-mid="${m.id}">${escapeHtml(m.name)}${m.id === state.currentMemberId ? "（使用中）" : ""}</button>`).join("")}
    <form data-rename="1" class="form" style="padding:8px 0 0">
      <label class="field">改顯示名稱
        <input name="name" value="${escapeAttr(member(state.currentMemberId).name)}">
      </label>
      <button class="btn" type="submit">儲存名稱</button>
    </form>
    <button class="btn ghost" data-logout="1" style="width:100%;margin-top:8px">登出呢部電話</button>
  </div>`;
  wrap.addEventListener("click", (e) => {
    if (e.target === wrap) wrap.remove();
    const mid = e.target.closest("[data-mid]")?.getAttribute("data-mid");
    if (mid) {
      state.currentMemberId = mid;
      save(state);
      wrap.remove();
      render();
    }
  });
  wrap.querySelector("[data-logout]")?.addEventListener("click", () => {
    wrap.remove();
    logout();
  });
  wrap.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = String(new FormData(e.target).get("name") || "").trim();
    const m = member(state.currentMemberId);
    const prev = m.name;
    if (name && name !== prev) {
      m.name = name;
      addLog({ action: "rename-member", summary: `將顯示名稱由「${prev}」改為「${name}」` });
    }
    save(state);
    wrap.remove();
    render();
  });
  document.body.appendChild(wrap);
}

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1200;
        let { width, height } = img;
        if (width > max || height > max) {
          const scale = Math.min(max / width, max / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

window.addEventListener("hashchange", () => {
  const path = route().path;
  if (!path.includes("/new") && !path.includes("/edit")) {
    photoDrafts = [];
    window.__formPhotosReady = false;
  }
  render();
});
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
render();
