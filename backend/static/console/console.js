const $ = (id) => document.getElementById(id);

const I18N = {
  zh: {
    pageTitle: "InkSight 控制台",
    eyebrow: "InkSight Console",
    title: "后端运营看板",
    subtitle: "汇总 InkSight 的用户增长、设备活跃、渲染质量、内容创作与访问埋点。",
    username: "用户名",
    password: "密码",
    signIn: "登录",
    signOut: "退出",
    statusIdle: "请使用 root 账号登录以加载受保护的指标。设备 API 仍可通过 /api/* 访问。",
    statusLoading: "正在加载指标...",
    statusNeedLogin: "请使用 root 账号登录以加载指标。",
    statusNotRoot: "当前账号不是 root。",
    statusLoaded: "Root 会话已在此后端域名生效，已于 {time} 加载。",
    statusLoginRequired: "用户名和密码不能为空。",
    statusSigningIn: "正在登录...",
    statusSignInFailed: "登录失败：{message}",
    statusSignedOut: "已在此后端域名退出登录。",
    statusLoadFailed: "加载看板指标失败：{message}",
    metricUsers: "用户",
    metricDau: "日活",
    metricLoginUsers: "今日登录用户",
    metricActiveDevices: "今日活跃设备",
    metricRenders: "今日渲染",
    metricHeartbeats: "设备心跳",
    metricRenderHealth: "今日渲染健康",
    metricContent: "内容创作",
    metricDeviceUsers: "今日活跃设备用户",
    metricNewUsers: "14 日新增用户",
    metricRendersSeries: "14 日渲染量",
    metricActiveDeviceSeries: "14 日活跃设备",
    metricActivitySeries: "14 日用户活跃",
    metricTopModes: "7 日热门模式",
    metricTopEvents: "7 日用户事件",
    metricEventSummary: "用户事件总览",
    metricHistoricalVisits: "历史访问量",
    metricHistoricalVisitors: "历史访客数",
    metricEventsToday: "今日用户事件",
    metricEvents7d: "7 日用户事件",
    metricEventsTotal: "历史用户事件",
    trackingDataTitle: "埋点数据 · 统计自 2026-05-25",
    metricNotes: "统计口径",
    notesBody: "注册数来自 users；DAU/WAU/MAU 来自 user_activity_events；设备活跃来自心跳和渲染日志；渲染量、错误与 fallback 来自 render_logs。历史访问量和历史访客数含一次性 Nginx 粗估基线，后续增长以 page.view 埋点为准。",
    noData: "暂无数据",
    usersNote: "今日 +{today} / 7日 +{week} / 30日 +{month}",
    activeNote: "WAU {wau} / MAU {mau}",
    loginUsersNote: "DAU {dau} / WAU {wau} / MAU {mau}",
    devicesNote: "已绑定 {bound} / 7日活跃 {week}",
    rendersNote: "7日 {week} / 今日平均耗时 {avg}ms",
    heartbeatsNote: "今日设备心跳请求",
    renderHealthNote: "今日错误 {errors} / fallback 占比 {rate}",
    contentNote: "共享 {shared} / BYOK {byok}",
    deviceUsersNote: "已绑定用户 {withDevice} / 设备反推 24h 活跃",
    historicalVisitsNote: "统计自 {start}；后续使用埋点",
    historicalVisitorsNote: "IP+UA 去重；统计自 {start}",
    eventRows: "事件记录",
    colMode: "模式",
    colEvent: "事件",
    colRenders: "渲染次数",
    colCount: "次数",
    colEvents: "事件数",
    colPeriod: "周期",
    colPageviews: "访问量",
    colVisitors: "访客数",
    colLogins: "登录",
    periodToday: "今日",
    period7d: "7 日",
    periodTotal: "历史",
  },
  en: {
    pageTitle: "InkSight Console",
    eyebrow: "InkSight Console",
    title: "Backend pulse.",
    subtitle: "A daily operations view for InkSight user growth, device activity, render health, content creation, and tracking data.",
    username: "Username",
    password: "Password",
    signIn: "Sign in",
    signOut: "Sign out",
    statusIdle: "Sign in with a root account to load protected metrics. Device APIs remain available under /api/*.",
    statusLoading: "Loading metrics...",
    statusNeedLogin: "Sign in with a root account to load metrics.",
    statusNotRoot: "Current account is not root.",
    statusLoaded: "Root session is active on this backend domain. Loaded at {time}.",
    statusLoginRequired: "Username and password are required.",
    statusSigningIn: "Signing in...",
    statusSignInFailed: "Sign-in failed: {message}",
    statusSignedOut: "Signed out on this backend domain.",
    statusLoadFailed: "Failed to load console metrics: {message}",
    metricUsers: "Users",
    metricDau: "DAU",
    metricLoginUsers: "Login Users Today",
    metricActiveDevices: "Active Devices Today",
    metricRenders: "Renders Today",
    metricHeartbeats: "Heartbeats",
    metricRenderHealth: "Render Health Today",
    metricContent: "Content",
    metricDeviceUsers: "Active Device Users Today",
    metricNewUsers: "New Users 14d",
    metricRendersSeries: "Renders 14d",
    metricActiveDeviceSeries: "Active Devices 14d",
    metricActivitySeries: "User Activity 14d",
    metricTopModes: "Top Modes 7d",
    metricTopEvents: "User Events 7d",
    metricEventSummary: "Event Summary",
    metricHistoricalVisits: "Historical Visits",
    metricHistoricalVisitors: "Historical Visitors",
    metricEventsToday: "Events Today",
    metricEvents7d: "User Events 7d",
    metricEventsTotal: "Historical Events",
    trackingDataTitle: "Tracking Data · Since 2026-05-25",
    metricNotes: "Notes",
    notesBody: "Users come from users; DAU/WAU/MAU come from user_activity_events; device activity comes from heartbeats and render logs; renders, errors, and fallback counts come from render_logs. Historical visits and visitors include one-time Nginx estimate baselines; future growth uses page.view events.",
    noData: "No data yet.",
    usersNote: "+{today} today / +{week} 7d / +{month} 30d",
    activeNote: "WAU {wau} / MAU {mau}",
    loginUsersNote: "DAU {dau} / WAU {wau} / MAU {mau}",
    devicesNote: "{bound} bound / {week} active 7d",
    rendersNote: "{week} 7d / {avg}ms avg today",
    heartbeatsNote: "device heartbeats today",
    renderHealthNote: "{errors} errors today / {rate} fallback",
    contentNote: "{shared} shared / {byok} BYOK",
    deviceUsersNote: "{withDevice} bound users / device-derived 24h active",
    historicalVisitsNote: "since {start}; tracked going forward",
    historicalVisitorsNote: "distinct IP+UA since {start}",
    eventRows: "event rows",
    colMode: "Mode",
    colEvent: "Event",
    colRenders: "Renders",
    colCount: "Count",
    colEvents: "Events",
    colPeriod: "Period",
    colPageviews: "Views",
    colVisitors: "Visitors",
    colLogins: "Logins",
    periodToday: "Today",
    period7d: "7d",
    periodTotal: "All time",
  },
};

Object.assign(I18N.zh, {
  consoleLabel: "管理控制台", navHome: "首页", navPairing: "配对码", sidebarNote: "设备、内容与每一次连接。",
  adminSignIn: "管理员登录", authHint: "使用具有 root 权限的账号继续。", refresh: "刷新",
  homeSubtitle: "查看用户增长、设备活跃与渲染运行情况。", pairingSubtitle: "查询配对状态，为设备生成或登记配对码。",
  createTitle: "生成配对码", createHint: "为设备生成新码，或登记设备屏幕上尚未上报的配对码。",
  deviceMac: "设备 MAC", customCode: "指定配对码（可选）", validity: "有效期", ttl10: "10 分钟", ttl30: "30 分钟", ttl60: "1 小时", ttl1440: "24 小时",
  generate: "生成配对码", createHelp: "留空则自动生成；指定码须为 6–16 位字母或数字。生成后交给用户登录并绑定设备。",
  newCode: "新配对码", copyCode: "复制配对码", recordsTitle: "配对记录", recordsHint: "保留近 30 天的已失效记录；时间以服务端为准。",
  searchLabel: "查找设备或配对码", searchPlaceholder: "MAC / 配对码", statusLabel: "状态", stateAll: "全部", stateActive: "有效", stateUsed: "已使用", stateExpired: "已失效",
  search: "查询", previous: "上一页", next: "下一页", colDevice: "配对码 / 设备", colSource: "来源", colCreated: "创建时间", colExpiry: "有效期至", colActions: "操作",
  sourceAdmin: "后台生成", sourcePortal: "设备配网", sourceRender: "屏幕生成", copy: "复制", expire: "失效", cancel: "取消", confirmExpire: "确认失效",
  expireTitle: "让配对码失效？", expireDescription: "配对码 {code} 将立即失效，用户将无法再用它绑定设备。已有设备绑定不受影响。",
  expireSuccess: "配对码已失效。", createSuccess: "配对码已生成，请在有效期内完成绑定。", copied: "配对码已复制。", copyFailed: "复制失败，请手动选中并复制配对码。",
  pairLoading: "正在加载配对记录…", pairLoaded: "配对记录已更新。", pairEmpty: "没有匹配的配对记录。可为设备生成新码，或调整查询条件。",
  pagination: "共 {total} 条 · 第 {page} / {pages} 页", expiresAt: "有效期至 {time}（服务端时间）", usedAt: "使用于 {time}",
  conflict: "这个配对码仍在有效期内，请换一个码或等待它失效。", notActive: "这个码已使用或失效，请刷新记录。",
  invalidInput: "请检查设备 MAC、配对码和有效期的格式。", requestFailed: "请求失败，请稍后重试（{status}）。", networkError: "无法连接服务，请检查网络后重试。",
  working: "处理中…", statusNeedLogin: "请登录管理员账号以继续。", statusNotRoot: "当前账号没有管理员权限，请切换具有 root 权限的账号。",
});
Object.assign(I18N.en, {
  consoleLabel: "Admin console", navHome: "Home", navPairing: "Pairing codes", sidebarNote: "Devices, content, and every connection.",
  adminSignIn: "Admin sign in", authHint: "Use an account with root access to continue.", refresh: "Refresh",
  homeSubtitle: "User growth, active devices, and rendering health.", pairingSubtitle: "Inspect pairing status and issue codes for devices.",
  createTitle: "Create pairing code", createHint: "Generate a new code or register a code shown on a device that has not reached the server.",
  deviceMac: "Device MAC", customCode: "Custom code (optional)", validity: "Valid for", ttl10: "10 minutes", ttl30: "30 minutes", ttl60: "1 hour", ttl1440: "24 hours",
  generate: "Create code", createHelp: "Leave blank to generate a code, or use 6–16 letters or digits. Users must sign in to pair their device.",
  newCode: "New pairing code", copyCode: "Copy code", recordsTitle: "Pairing records", recordsHint: "Inactive records retained for 30 days. All times use the server clock.",
  searchLabel: "Find device or code", searchPlaceholder: "MAC / pairing code", statusLabel: "Status", stateAll: "All", stateActive: "Active", stateUsed: "Used", stateExpired: "Inactive",
  search: "Search", previous: "Previous", next: "Next", colDevice: "Code / device", colSource: "Source", colCreated: "Created", colExpiry: "Expires", colActions: "Actions",
  sourceAdmin: "Admin console", sourcePortal: "Device setup", sourceRender: "Device display", copy: "Copy", expire: "Expire", cancel: "Cancel", confirmExpire: "Expire code",
  expireTitle: "Expire this code?", expireDescription: "Code {code} will stop working immediately. Existing device bindings will remain active.",
  expireSuccess: "Pairing code expired.", createSuccess: "Code created. Pair the device before it expires.", copied: "Code copied.", copyFailed: "Copy failed. Select and copy the code manually.",
  pairLoading: "Loading pairing records…", pairLoaded: "Pairing records updated.", pairEmpty: "No matching pairing records. Create a code or adjust your filters.",
  pagination: "{total} records · Page {page} / {pages}", expiresAt: "Expires {time} (server time)", usedAt: "Used {time}",
  conflict: "This code is still active. Choose another code or wait for it to expire.", notActive: "This code has been used or expired. Refresh the records.",
  invalidInput: "Check the MAC address, pairing code, and validity.", requestFailed: "Request failed. Try again ({status}).", networkError: "Cannot connect. Check your network and try again.",
  working: "Working…", statusNeedLogin: "Sign in with an admin account to continue.", statusNotRoot: "This account has no admin access. Use an account with the root role.",
});

let lang = localStorage.getItem("inksight_console_lang") || "";
if (!I18N[lang]) {
  lang = (navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en";
}

let lastData = null;
let pairData = null;
let createdPair = null;
let authenticated = false;
let authEpoch = 0;
let pairRequest = 0;
let pairPage = 1;
let currentPage = "home";
let pendingExpiry = null;
let mutating = false;

function t(key, vars = {}) {
  let text = (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  Object.entries(vars).forEach(([name, value]) => {
    text = text.replaceAll(`{${name}}`, String(value));
  });
  return text;
}

function fmt(n) {
  if (n === null || n === undefined) return "--";
  return Number(n || 0).toLocaleString(lang === "zh" ? "zh-CN" : "en-US");
}

function pct(numerator, denominator) {
  const den = Number(denominator || 0);
  if (!den) return "0%";
  return `${((Number(numerator || 0) / den) * 100).toFixed(1)}%`;
}

function setStatus(text, isError = false) {
  const el = $("status");
  el.textContent = text;
  el.className = isError ? "status error" : "status";
}

function applyLang() {
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  document.title = t("pageTitle");
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  $("langZh").classList.toggle("active", lang === "zh");
  $("langEn").classList.toggle("active", lang === "en");
  updatePageChrome();
  if (pairData) renderPairCodes(pairData);
  if (createdPair) renderCreatedPair();
}

function setLang(next) {
  if (!I18N[next] || next === lang) return;
  lang = next;
  localStorage.setItem("inksight_console_lang", lang);
  applyLang();
  if (currentPage === "home" && lastData) render(lastData);
  else setStatus(t(authenticated ? "pairLoaded" : "statusNeedLogin"));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[char]);
}

function renderTable(rows, columns) {
  if (!rows || rows.length === 0) return `<p class="empty">${t("noData")}</p>`;
  const head = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("");
  const body = rows.map((row) => (
    `<tr>${columns.map((c) => `<td>${escapeHtml(row[c.key] ?? "")}</td>`).join("")}</tr>`
  )).join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderBars(id, rows, key = "count") {
  if (!rows || rows.length === 0) {
    $(id).innerHTML = `<p class="empty">${t("noData")}</p>`;
    return;
  }
  const ordered = [...rows].reverse();
  const max = Math.max(...ordered.map((d) => Number(d[key] || 0)), 1);
  $(id).innerHTML = ordered.map((d) => {
    const value = Number(d[key] || 0);
    const height = Math.max(8, Math.round((value / max) * 116));
    const day = String(d.day || "");
    return `<div class="bar" title="${escapeHtml(`${day}: ${value}`)}" style="height:${height}px"><b>${escapeHtml(fmt(value))}</b><span>${escapeHtml(day.slice(5))}</span></div>`;
  }).join("");
}

function eventRows(rows, fallbackTotal) {
  if (Array.isArray(rows)) return rows;
  if (fallbackTotal === null || fallbackTotal === undefined) return [];
  return [{ event_name: "all", count: fallbackTotal }];
}

function renderSummaryTable(rows) {
  const columns = [
    { key: "period", label: t("colPeriod") },
    { key: "pageviews", label: t("colPageviews") },
    { key: "visitors", label: t("colVisitors") },
    { key: "logins", label: t("colLogins") },
    { key: "events", label: t("colEvents") },
  ];
  return renderTable(rows, columns);
}

function render(data) {
  lastData = data;
  $("usersTotal").textContent = fmt(data.users.total);
  $("usersNote").textContent = t("usersNote", {
    today: fmt(data.users.today_new),
    week: fmt(data.users.new_7d),
    month: fmt(data.users.new_30d),
  });
  $("deviceUsers").textContent = fmt(data.users.device_active_24h);
  $("deviceUsersNote").textContent = t("deviceUsersNote", {
    withDevice: fmt(data.users.with_device),
  });
  $("devicesActive").textContent = fmt(data.devices.active_today);
  $("devicesNote").textContent = t("devicesNote", {
    bound: fmt(data.devices.bound),
    week: fmt(data.devices.active_7d),
  });
  $("rendersToday").textContent = fmt(data.rendering.today);
  $("rendersNote").textContent = t("rendersNote", {
    week: fmt(data.rendering.last_7d),
    avg: fmt(data.rendering.avg_ms_today),
  });
  $("heartbeatsToday").textContent = fmt(data.devices.heartbeats_today);
  $("heartbeatsNote").textContent = t("heartbeatsNote");
  $("renderErrors").innerHTML = `${fmt(data.rendering.fallback_today)} <span class="metric-unit">fallback</span>`;
  $("renderHealthNote").textContent = t("renderHealthNote", {
    errors: fmt(data.rendering.errors_today),
    rate: pct(data.rendering.fallback_today, data.rendering.today),
  });
  $("customModes").textContent = fmt(data.content.custom_modes);
  $("contentNote").textContent = t("contentNote", {
    shared: fmt(data.content.shared_modes),
    byok: fmt(data.content.users_with_llm_config),
  });
  $("loginUsersToday").textContent = fmt(data.users.login_users_today);
  $("loginUsersNote").textContent = t("loginUsersNote", {
    dau: fmt(data.users.dau),
    wau: fmt(data.users.wau),
    mau: fmt(data.users.mau),
  });

  renderBars("userBars", data.series.new_users);
  renderBars("renderBars", data.series.renders);
  renderBars("deviceBars", data.series.active_devices);
  renderBars("activityBars", data.series.activity_events, "active_users");
  $("topModes").innerHTML = renderTable(data.top.modes, [
    { key: "mode", label: t("colMode") },
    { key: "count", label: t("colRenders") },
  ]);
  $("historicalVisits").textContent = fmt(data.traffic.historical_visits.total);
  $("historicalVisitsNote").textContent = t("historicalVisitsNote", {
    start: data.traffic.historical_visits.start_date,
  });
  $("historicalVisitors").textContent = fmt(data.traffic.historical_visitors.total);
  $("historicalVisitorsNote").textContent = t("historicalVisitorsNote", {
    start: data.traffic.historical_visitors.start_date,
  });
  $("eventSummaryTable").innerHTML = renderSummaryTable([
    {
      period: t("periodToday"),
      pageviews: fmt(data.activity.pageviews_today),
      visitors: fmt(data.activity.visitors_today),
      logins: fmt(data.activity.logins_today),
      events: fmt(data.activity.events_today),
    },
    {
      period: t("period7d"),
      pageviews: fmt(data.activity.pageviews_7d),
      visitors: fmt(data.activity.visitors_7d),
      logins: fmt(data.activity.logins_7d),
      events: fmt(data.activity.events_7d),
    },
    {
      period: t("periodTotal"),
      pageviews: fmt(data.activity.pageviews_total),
      visitors: fmt(data.activity.visitors_total),
      logins: fmt(data.activity.logins_total),
      events: fmt(data.activity.events_total),
    },
  ]);
  setStatus(t("statusLoaded", { time: new Date().toLocaleString(lang === "zh" ? "zh-CN" : "en-US") }));
}

function updatePageChrome() {
  $("pageTitle").textContent = t(currentPage === "home" ? "navHome" : "navPairing");
  $("pageSubtitle").textContent = t(currentPage === "home" ? "homeSubtitle" : "pairingSubtitle");
  $("homePage").hidden = currentPage !== "home";
  $("pairingPage").hidden = currentPage !== "pairing";
  document.querySelectorAll("[data-page]").forEach((link) => {
    if (link.dataset.page === currentPage) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function setAuthenticated(value) {
  authenticated = value;
  $("authPanel").hidden = value;
  $("logout").hidden = !value;
  $("createPair").disabled = !value || mutating;
  if (value) return;
  authEpoch++;
  pairRequest++;
  lastData = null;
  pairData = null;
  createdPair = null;
  pendingExpiry = null;
  $("createdPair").hidden = true;
  $("pairRecords").replaceChildren();
  $("pairCount").textContent = "";
  $("pairMac").value = "";
  $("customCode").value = "";
  $("pairQuery").value = "";
  $("pairStatus").value = "all";
  pairPage = 1;
  $("pairPrev").disabled = true;
  $("pairNext").disabled = true;
  $("expireDialog").close();
  document.querySelectorAll("#homePage .metric-value, #homePage .metric-note, #homePage .mini-metrics strong, #homePage .mini-metrics span").forEach((el) => { el.textContent = "—"; });
  document.querySelectorAll("#homePage .bars, #homePage .table-wrap").forEach((el) => el.replaceChildren());
}

async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(path, { cache: "no-store", credentials: "same-origin", ...options });
  } catch {
    throw new Error(t("networkError"));
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 || res.status === 403) {
    setAuthenticated(false);
    throw new Error(t(res.status === 401 ? "statusNeedLogin" : "statusNotRoot"));
  }
  if (!res.ok) {
    const detail = data.detail || data.error;
    const key = detail === "pair_code_conflict" ? "conflict" : detail === "pair_code_not_active" ? "notActive" : res.status === 422 ? "invalidInput" : "requestFailed";
    throw new Error(t(key, { status: res.status }));
  }
  return data;
}

async function loadConsole() {
  const epoch = authEpoch;
  setStatus(t("statusLoading"));
  try {
    const data = await api("/api/admin/console/summary");
    if (epoch !== authEpoch) return;
    setAuthenticated(true);
    if (currentPage === "home") render(data);
  } catch (err) {
    setStatus(err.message, true);
  }
}

function serverDate(value) {
  return value ? String(value).replace("T", " ").slice(0, 19) : "—";
}

function renderCreatedPair() {
  $("createdPair").hidden = false;
  $("createdCode").textContent = createdPair.pair_code;
  $("createdExpiry").textContent = t("expiresAt", { time: serverDate(createdPair.expires_at) });
}

function renderPairCodes(data) {
  const pages = Math.max(1, Math.ceil(data.total / data.page_size));
  $("pairCount").textContent = t("pagination", { total: fmt(data.total), page: data.page, pages });
  $("pairPrev").disabled = data.page <= 1;
  $("pairNext").disabled = data.page >= pages;
  if (!data.items.length) {
    $("pairRecords").innerHTML = `<p class="empty">${escapeHtml(t("pairEmpty"))}</p>`;
    return;
  }
  const headers = ["colDevice", "statusLabel", "colSource", "colCreated", "colExpiry", "colActions"];
  const stateKey = { active: "stateActive", used: "stateUsed", expired: "stateExpired" };
  const sourceKey = { admin: "sourceAdmin", portal: "sourcePortal", render: "sourceRender" };
  $("pairRecords").innerHTML = `<table class="pair-table"><thead><tr>${headers.map((key) => `<th scope="col">${escapeHtml(t(key))}</th>`).join("")}</tr></thead><tbody>${data.items.map((row) => {
    const id = escapeHtml(row.id);
    const cells = [
      `<div><span class="mono pair-code">${escapeHtml(row.pair_code)}</span><small class="mono">${escapeHtml(row.mac)}</small></div>`,
      `<div><span class="badge ${escapeHtml(row.status)}">${escapeHtml(t(stateKey[row.status] || "stateExpired"))}</span>${row.used_at ? `<small>${escapeHtml(t("usedAt", { time: serverDate(row.used_at) }))}</small>` : ""}</div>`,
      `<div>${escapeHtml(sourceKey[row.source] ? t(sourceKey[row.source]) : row.source || "—")}</div>`,
      `<div>${escapeHtml(serverDate(row.created_at))}</div>`,
      `<div>${escapeHtml(serverDate(row.expires_at))}</div>`,
      `<div class="row-actions"><button type="button" class="secondary" data-copy="${id}" ${row.status !== "active" || mutating ? "disabled" : ""}>${escapeHtml(t("copy"))}</button><button type="button" class="danger" data-expire="${id}" ${row.status !== "active" || mutating ? "disabled" : ""}>${escapeHtml(t("expire"))}</button></div>`,
    ];
    return `<tr>${cells.map((cell, i) => `<td data-label="${escapeHtml(t(headers[i]))}">${cell}</td>`).join("")}</tr>`;
  }).join("")}</tbody></table>`;
}

async function loadPairCodes() {
  const epoch = authEpoch;
  const request = ++pairRequest;
  setStatus(t("pairLoading"));
  $("pairRecords").setAttribute("aria-busy", "true");
  try {
    const params = new URLSearchParams({ q: $("pairQuery").value.trim(), status: $("pairStatus").value, page: String(pairPage), page_size: "20" });
    const data = await api(`/api/admin/pair-codes?${params}`);
    if (epoch !== authEpoch || request !== pairRequest) return;
    setAuthenticated(true);
    if (data.total > 0 && (data.page - 1) * data.page_size >= data.total) {
      pairPage = Math.ceil(data.total / data.page_size);
      return await loadPairCodes();
    }
    pairData = data;
    renderPairCodes(data);
    setStatus(t("pairLoaded"));
  } catch (err) {
    if (request === pairRequest || !authenticated) {
      pairData = null;
      $("pairRecords").replaceChildren();
      $("pairCount").textContent = "";
      $("pairPrev").disabled = true;
      $("pairNext").disabled = true;
      setStatus(err.message, true);
    }
  } finally {
    if (request === pairRequest || !authenticated) $("pairRecords").setAttribute("aria-busy", "false");
  }
}

async function loadPage() {
  await (currentPage === "home" ? loadConsole() : loadPairCodes());
}

function navigate() {
  currentPage = location.hash === "#pairing" ? "pairing" : "home";
  updatePageChrome();
  loadPage();
}

function setMutating(value) {
  mutating = value;
  $("createPair").disabled = value || !authenticated;
  $("createPair").setAttribute("aria-busy", String(value));
  $("createPair").textContent = t(value ? "working" : "generate");
  if (pairData) renderPairCodes(pairData);
}

async function createPairCode(event) {
  event.preventDefault();
  if (!authenticated || mutating) return;
  const epoch = authEpoch;
  setMutating(true);
  createdPair = null;
  $("createdPair").hidden = true;
  try {
    const result = await api("/api/admin/pair-codes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mac: $("pairMac").value.trim().toUpperCase(), pair_code: $("customCode").value.trim().toUpperCase(), ttl_minutes: Number($("pairTtl").value) }),
    });
    if (epoch !== authEpoch) return;
    createdPair = result;
    renderCreatedPair();
    $("pairQuery").value = result.mac;
    $("pairStatus").value = "all";
    pairPage = 1;
    await loadPairCodes();
    if (epoch === authEpoch) setStatus(t("createSuccess"));
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    setMutating(false);
  }
}

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code);
    setStatus(t("copied"));
  } catch {
    setStatus(t("copyFailed"), true);
  }
}

$("pairRecords").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || button.disabled || !authenticated || mutating) return;
  const row = pairData?.items.find((item) => item.id === (button.dataset.copy || button.dataset.expire));
  if (!row) return;
  if (button.dataset.copy) return copyCode(row.pair_code);
  pendingExpiry = row;
  $("expireDescription").textContent = t("expireDescription", { code: row.pair_code });
  $("expireDialog").showModal();
});
$("expireDialog").addEventListener("close", async () => {
  const row = pendingExpiry;
  pendingExpiry = null;
  if ($("expireDialog").returnValue !== "confirm" || !row || !authenticated || mutating) return;
  const epoch = authEpoch;
  setMutating(true);
  try {
    await api(`/api/admin/pair-codes/${encodeURIComponent(row.id)}`, { method: "DELETE" });
    if (epoch !== authEpoch) return;
    if (createdPair?.pair_code === row.pair_code) { createdPair = null; $("createdPair").hidden = true; }
    await loadPairCodes();
    if (epoch === authEpoch) setStatus(t("expireSuccess"));
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    setMutating(false);
  }
});

async function login(event) {
  event.preventDefault();
  setAuthenticated(false);
  setStatus(t("statusSigningIn"));
  $("login").disabled = true;
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: $("username").value.trim(), password: $("password").value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || t("statusSignInFailed", { message: `HTTP ${res.status}` }));
    $("password").value = "";
    await loadPage();
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    $("login").disabled = false;
  }
}

async function logout() {
  try {
    await api("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
    setStatus(t("statusSignedOut"));
  } catch (err) {
    setStatus(err.message, true);
  }
}

function trackPageview() {
  fetch("/api/analytics/pageview", {
    method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: location.pathname, source: "backend_console" }), keepalive: true,
  }).catch(() => {});
}

$("loginForm").addEventListener("submit", login);
$("logout").addEventListener("click", logout);
$("langZh").addEventListener("click", () => setLang("zh"));
$("langEn").addEventListener("click", () => setLang("en"));
$("refresh").addEventListener("click", loadPage);
$("createPairForm").addEventListener("submit", createPairCode);
$("pairFilter").addEventListener("submit", (event) => { event.preventDefault(); pairPage = 1; loadPairCodes(); });
$("pairPrev").addEventListener("click", () => { pairPage = Math.max(1, pairPage - 1); loadPairCodes(); });
$("pairNext").addEventListener("click", () => { pairPage++; loadPairCodes(); });
$("copyCreated").addEventListener("click", () => { if (createdPair) copyCode(createdPair.pair_code); });
window.addEventListener("hashchange", navigate);
setAuthenticated(false);
applyLang();
trackPageview();
navigate();
