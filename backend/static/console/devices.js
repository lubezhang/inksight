let deviceData = null;
let devicePage = 1;
let deviceRequest = 0;
let configRequest = 0;
let selectedDevice = null;
let deviceConfig = null;
let deviceDirty = false;
let deviceSaving = false;

const DEVICE_COPY = {
  zh: {
    navDevices: "设备列表", devicesSubtitle: "查看设备状态，管理每台设备的内容与运行配置。",
    devicesHint: "查看已绑定、已配置或上报过的设备，选择设备修改配置。",
    deviceSearch: "查找设备", deviceSearchPlaceholder: "MAC / 昵称 / 所属用户",
    deviceOnline: "在线", deviceOffline: "离线", onlineHint: "在线表示最近 15 分钟收到过心跳；休眠设备可能显示为离线。",
    devicesLoading: "正在加载设备…", devicesLoaded: "设备列表已更新。", devicesEmpty: "没有匹配的设备，请调整查询条件。",
    deviceName: "设备 / MAC", deviceOwner: "所属用户", deviceSeen: "最近心跳", deviceSignal: "电压 / 信号", deviceUnbound: "未绑定",
    deviceUnnamed: "未命名设备", editDevice: "修改配置", editingDevice: "设备配置", devicePending: "待设备更新",
    saveDevice: "保存配置", resetDevice: "撤销修改", unsavedChanges: "未保存",
    deviceSaveHint: "保存后设备将在下次连接时读取新配置；离线或休眠设备不会立即更新。",
    configLoading: "正在加载设备配置…", configNew: "该设备尚未保存配置，以下为默认值。",
    configSaved: "配置已保存，等待设备下次连接时更新。", discardDevice: "有尚未保存的修改，是否放弃？",
    basicConfig: "基本配置", contentConfig: "内容与刷新", locationConfig: "天气与位置", advancedConfig: "高级配置",
    nickname: "设备昵称", refreshStrategy: "刷新策略", refreshInterval: "刷新间隔（分钟）",
    random: "随机", cycle: "顺序轮播", time_slot: "时段规则", smart: "智能时段",
    modeLanguage: "内容语言", language: "兼容语言", zh: "中文", en: "英文", mixed: "中英混合",
    contentTone: "内容调性", positive: "积极", neutral: "中性", deep: "深度", humor: "幽默",
    city: "城市", latitude: "纬度", longitude: "经度", timezone: "时区（如 Asia/Shanghai）", admin1: "省 / 州", country: "国家",
    always_active: "始终保持活跃", is_focus_listening: "专注监听", memoText: "备忘录内容", enabledModes: "启用模式",
    modesHint: "至少选择一个模式；顺序轮播保留原有模式顺序，新选模式追加到末尾。",
    timeSlotRules: "时段规则（JSON 数组）", countdownEvents: "倒计时事件（JSON 数组）",
    characterTones: "角色调性（JSON 数组，最多 5 项）", modeOverrides: "各模式独立设置（JSON 对象）",
    advancedHint: '时段示例：[{"startHour":9,"endHour":18,"modes":["DAILY"]}]；倒计时示例：[{"name":"假期","date":"2027-01-01","type":"countdown"}]。各模式独立设置也支持 city、llm_provider、llm_model。模型密钥使用所属用户的账号设置。',
    modesRequired: "请至少选择一个内容模式。", invalidJson: "{field} 格式错误，应为 JSON {type}。", jsonArray: "数组", jsonObject: "对象",
    invalidDeviceInput: "配置校验失败：{fields}",
  },
  en: {
    navDevices: "Devices", devicesSubtitle: "View device status and manage content and runtime settings.",
    devicesHint: "Select a bound, configured, or reporting device to edit its settings.",
    deviceSearch: "Find a device", deviceSearchPlaceholder: "MAC / nickname / owner",
    deviceOnline: "Online", deviceOffline: "Offline", onlineHint: "Online means a heartbeat in the last 15 minutes. Sleeping devices may appear offline.",
    devicesLoading: "Loading devices…", devicesLoaded: "Device list updated.", devicesEmpty: "No matching devices. Try another filter.",
    deviceName: "Device / MAC", deviceOwner: "Owner", deviceSeen: "Last heartbeat", deviceSignal: "Voltage / signal", deviceUnbound: "Unbound",
    deviceUnnamed: "Unnamed device", editDevice: "Edit settings", editingDevice: "Device settings", devicePending: "Update pending",
    saveDevice: "Save settings", resetDevice: "Discard edits", unsavedChanges: "Unsaved",
    deviceSaveHint: "Settings apply on the next device connection. Offline or sleeping devices will update when they reconnect.",
    configLoading: "Loading device settings…", configNew: "No saved settings yet. Defaults are shown below.",
    configSaved: "Settings saved. Waiting for the next device connection.", discardDevice: "Discard your unsaved changes?",
    basicConfig: "General", contentConfig: "Content and refresh", locationConfig: "Weather and location", advancedConfig: "Advanced settings",
    nickname: "Device nickname", refreshStrategy: "Refresh strategy", refreshInterval: "Refresh interval (minutes)",
    random: "Random", cycle: "Cycle", time_slot: "Time slots", smart: "Smart schedule",
    modeLanguage: "Content language", language: "Legacy language", zh: "Chinese", en: "English", mixed: "Mixed",
    contentTone: "Content tone", positive: "Positive", neutral: "Neutral", deep: "Deep", humor: "Humorous",
    city: "City", latitude: "Latitude", longitude: "Longitude", timezone: "Time zone (e.g. Asia/Shanghai)", admin1: "Province / state", country: "Country",
    always_active: "Always active", is_focus_listening: "Focus listening", memoText: "Memo", enabledModes: "Enabled modes",
    modesHint: "Select at least one mode. Cycle keeps the existing order and appends newly selected modes.",
    timeSlotRules: "Time slots (JSON array)", countdownEvents: "Countdown events (JSON array)",
    characterTones: "Character tones (JSON array, up to 5)", modeOverrides: "Per-mode settings (JSON object)",
    advancedHint: 'Time slot: [{"startHour":9,"endHour":18,"modes":["DAILY"]}]. Countdown: [{"name":"Holiday","date":"2027-01-01","type":"countdown"}]. Per-mode settings support city, llm_provider, and llm_model. Model keys come from the owner’s account settings.',
    modesRequired: "Select at least one content mode.", invalidJson: "{field} must be a JSON {type}.", jsonArray: "array", jsonObject: "object",
    invalidDeviceInput: "Invalid settings: {fields}",
  },
};

const CONFIG_GROUPS = [
  ["basicConfig", [
    ["nickname", "text", 'maxlength="32"'],
    ["always_active", "checkbox"], ["is_focus_listening", "checkbox"],
  ]],
  ["contentConfig", [
    ["refreshStrategy", ["random", "cycle", "time_slot", "smart"]],
    ["refreshInterval", "number", 'min="10" max="1440" required'],
    ["modeLanguage", ["zh", "en", "mixed"]],
    ["contentTone", ["positive", "neutral", "deep", "humor"]],
    ["memoText", "textarea"],
  ]],
  ["locationConfig", [
    ["city", "text", 'maxlength="40"'], ["timezone", "text", 'maxlength="64"'],
    ["latitude", "number", 'min="-90" max="90" step="any"'],
    ["longitude", "number", 'min="-180" max="180" step="any"'],
    ["admin1", "text", 'maxlength="64"'], ["country", "text", 'maxlength="64"'],
  ]],
];
const CONFIG_JSON_FIELDS = { timeSlotRules: "array", countdownEvents: "array", characterTones: "array", modeOverrides: "object" };

function setDeviceDirty(value) {
  deviceDirty = value;
  $("deviceDirty").hidden = !value;
}

function clearDevices() {
  deviceRequest++;
  configRequest++;
  deviceData = null;
  selectedDevice = null;
  deviceConfig = null;
  devicePage = 1;
  deviceSaving = false;
  setDeviceDirty(false);
  $("deviceEditor").hidden = true;
  $("deviceConfigFields").replaceChildren();
  $("deviceRecords").replaceChildren();
  $("deviceCount").textContent = "";
  $("deviceQuery").value = "";
  $("deviceStatus").value = "all";
  $("devicePrev").disabled = $("deviceNext").disabled = true;
}

function renderDevices(data) {
  const pages = Math.max(1, Math.ceil(data.total / data.page_size));
  $("deviceCount").textContent = t("pagination", { total: fmt(data.total), page: data.page, pages });
  $("devicePrev").disabled = data.page <= 1;
  $("deviceNext").disabled = data.page >= pages;
  if (!data.items.length) {
    $("deviceRecords").innerHTML = `<p class="empty">${escapeHtml(t("devicesEmpty"))}</p>`;
    return;
  }
  const headers = ["deviceName", "statusLabel", "deviceOwner", "deviceSeen", "deviceSignal", "colActions"];
  $("deviceRecords").innerHTML = `<table class="pair-table device-table"><thead><tr>${headers.map((key) => `<th scope="col">${escapeHtml(t(key))}</th>`).join("")}</tr></thead><tbody>${data.items.map((row) => {
    const cells = [
      `<div><strong>${escapeHtml(row.nickname || t("deviceUnnamed"))}</strong><small class="mono">${escapeHtml(row.mac)}</small></div>`,
      `<div><span class="badge ${row.is_online ? "active" : ""}">${escapeHtml(t(row.is_online ? "deviceOnline" : "deviceOffline"))}</span>${row.pending_refresh ? `<small>${escapeHtml(t("devicePending"))}</small>` : ""}</div>`,
      `<div>${escapeHtml(row.owner || t("deviceUnbound"))}</div>`,
      `<div>${escapeHtml(serverDate(row.last_seen))}</div>`,
      `<div>${escapeHtml(row.battery_voltage == null ? "—" : `${Number(row.battery_voltage).toFixed(2)} V`)}<small>${escapeHtml(row.wifi_rssi == null ? "—" : `${row.wifi_rssi} dBm`)}</small></div>`,
      `<div><button type="button" class="secondary" data-edit-device="${escapeHtml(row.mac)}" ${deviceSaving ? "disabled" : ""}>${escapeHtml(t("editDevice"))}</button></div>`,
    ];
    return `<tr class="${row.mac === selectedDevice ? "selected" : ""}">${cells.map((cell, i) => `<td data-label="${escapeHtml(t(headers[i]))}">${cell}</td>`).join("")}</tr>`;
  }).join("")}</tbody></table>`;
}

async function loadDevices() {
  const epoch = authEpoch;
  const request = ++deviceRequest;
  setStatus(t("devicesLoading"));
  $("deviceRecords").setAttribute("aria-busy", "true");
  try {
    const params = new URLSearchParams({ q: $("deviceQuery").value.trim(), status: $("deviceStatus").value, page: String(devicePage), page_size: "20" });
    const data = await api(`/api/admin/devices?${params}`);
    if (epoch !== authEpoch || request !== deviceRequest) return;
    setAuthenticated(true);
    if (data.total && data.page > Math.ceil(data.total / data.page_size)) {
      devicePage = Math.ceil(data.total / data.page_size);
      return await loadDevices();
    }
    deviceData = data;
    renderDevices(data);
    if (currentPage === "devices") setStatus(t("devicesLoaded"));
  } catch (err) {
    if (epoch !== authEpoch || request !== deviceRequest) return;
    deviceData = null;
    $("deviceRecords").replaceChildren();
    $("deviceCount").textContent = "";
    $("devicePrev").disabled = $("deviceNext").disabled = true;
    setStatus(err.message, true);
  } finally {
    if (request === deviceRequest || !authenticated) $("deviceRecords").setAttribute("aria-busy", "false");
  }
}

function configField([key, type, attrs = ""]) {
  const label = `<span data-i18n="${key}">${escapeHtml(t(key))}</span>`;
  const id = `cfg-${key}`;
  if (type === "checkbox") return `<label class="check-field"><input id="${id}" type="checkbox" />${label}</label>`;
  let input;
  if (Array.isArray(type)) input = `<select id="${id}">${type.map((value) => `<option value="${value}" data-i18n="${value}">${escapeHtml(t(value))}</option>`).join("")}</select>`;
  else if (type === "textarea") input = `<textarea id="${id}" rows="4"></textarea>`;
  else input = `<input id="${id}" type="${type}" ${attrs} />`;
  return `<label class="${type === "textarea" ? "full" : ""}">${label}${input}</label>`;
}

function fillDeviceConfig(data) {
  const config = data.config;
  $("deviceConfigFields").innerHTML = CONFIG_GROUPS.map(([title, fields]) => `<fieldset class="config-group"><legend data-i18n="${title}">${escapeHtml(t(title))}</legend><div class="config-grid">${fields.map(configField).join("")}</div></fieldset>`).join("")
    + `<fieldset class="config-group"><legend data-i18n="enabledModes">${escapeHtml(t("enabledModes"))}</legend><p class="hint" data-i18n="modesHint">${escapeHtml(t("modesHint"))}</p><div id="deviceModes" class="mode-options"></div></fieldset>`
    + `<details><summary data-i18n="advancedConfig">${escapeHtml(t("advancedConfig"))}</summary><p class="hint" data-i18n="advancedHint">${escapeHtml(t("advancedHint"))}</p><div class="config-grid">${Object.keys(CONFIG_JSON_FIELDS).map((key) => configField([key, "textarea"])).join("")}</div></details>`;
  for (const [, fields] of CONFIG_GROUPS) {
    for (const [key, type] of fields) {
      if (type === "checkbox") $(`cfg-${key}`).checked = Boolean(config[key]);
      else $(`cfg-${key}`).value = config[key] ?? "";
    }
  }
  for (const key of Object.keys(CONFIG_JSON_FIELDS)) $(`cfg-${key}`).value = JSON.stringify(config[key], null, 2);
  const modes = new Map(data.modes.map((mode) => [mode.mode_id, mode.display_name]));
  for (const mode of config.modes) if (!modes.has(mode)) modes.set(mode, mode);
  $("deviceModes").innerHTML = [...modes].map(([id, name]) => `<label class="check-field"><input type="checkbox" name="deviceMode" value="${escapeHtml(id)}" ${config.modes.includes(id) ? "checked" : ""} /><span>${escapeHtml(name)} <small class="hint">${escapeHtml(id)}</small></span></label>`).join("");
  $("deviceConfigFields").disabled = false;
  $("saveDevice").disabled = $("resetDevice").disabled = false;
  $("deviceConfigStatus").className = "hint";
  $("deviceConfigStatus").textContent = data.has_config ? "" : t("configNew");
  setDeviceDirty(false);
}

async function selectDevice(mac) {
  if (!authenticated || deviceSaving) return;
  if (deviceDirty && !window.confirm(t("discardDevice"))) return;
  const epoch = authEpoch;
  const request = ++configRequest;
  selectedDevice = mac;
  deviceConfig = null;
  setDeviceDirty(false);
  $("deviceEditor").hidden = false;
  $("deviceEditorTitle").textContent = t("editingDevice");
  $("editingMac").textContent = mac;
  $("deviceConfigFields").replaceChildren();
  $("deviceConfigFields").disabled = true;
  $("saveDevice").disabled = $("resetDevice").disabled = true;
  $("deviceConfigStatus").textContent = t("configLoading");
  if (deviceData) renderDevices(deviceData);
  try {
    const data = await api(`/api/admin/devices/${encodeURIComponent(mac)}/config`);
    if (epoch !== authEpoch || request !== configRequest) return;
    deviceConfig = data;
    fillDeviceConfig(data);
    $("deviceEditor").scrollIntoView({ block: "start" });
    $("cfg-nickname").focus({ preventScroll: true });
  } catch (err) {
    if (epoch === authEpoch && request === configRequest) {
      $("deviceConfigStatus").className = "hint error";
      $("deviceConfigStatus").textContent = err.message;
    }
  }
}

function collectDeviceConfig() {
  const result = { ...deviceConfig.config };
  for (const [, fields] of CONFIG_GROUPS) {
    for (const [key, type] of fields) {
      const input = $(`cfg-${key}`);
      result[key] = type === "checkbox" ? input.checked : type === "number" ? (input.value === "" ? null : Number(input.value)) : input.value;
    }
  }
  const checked = [...document.querySelectorAll('[name="deviceMode"]:checked')].map((el) => el.value);
  if (!checked.length) throw new Error(t("modesRequired"));
  result.modes = [...result.modes.filter((mode) => checked.includes(mode)), ...checked.filter((mode) => !result.modes.includes(mode))];
  for (const [key, type] of Object.entries(CONFIG_JSON_FIELDS)) {
    let parsed;
    try { parsed = JSON.parse($(`cfg-${key}`).value); } catch { /* report below */ }
    if (type === "array" ? !Array.isArray(parsed) : !parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      $(`cfg-${key}`).closest("details").open = true;
      $(`cfg-${key}`).focus();
      throw new Error(t("invalidJson", { field: t(key), type: t(type === "array" ? "jsonArray" : "jsonObject") }));
    }
    result[key] = parsed;
  }
  return result;
}

async function saveDeviceConfig(event) {
  event.preventDefault();
  if (!authenticated || !deviceConfig || deviceSaving) return;
  let config;
  try { config = collectDeviceConfig(); } catch (err) {
    $("deviceConfigStatus").className = "hint error";
    $("deviceConfigStatus").textContent = err.message;
    return;
  }
  const epoch = authEpoch;
  const request = configRequest;
  deviceSaving = true;
  $("deviceConfigFields").disabled = true;
  $("saveDevice").disabled = $("resetDevice").disabled = true;
  $("saveDevice").setAttribute("aria-busy", "true");
  if (deviceData) renderDevices(deviceData);
  try {
    await api(`/api/admin/devices/${encodeURIComponent(selectedDevice)}/config`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config),
    });
    if (epoch !== authEpoch || request !== configRequest) return;
    deviceConfig = { ...deviceConfig, config, has_config: true };
    setDeviceDirty(false);
    await loadDevices();
    if (epoch !== authEpoch) return;
    $("deviceConfigStatus").className = "hint";
    $("deviceConfigStatus").textContent = t("configSaved");
  } catch (err) {
    if (epoch === authEpoch) {
      $("deviceConfigStatus").className = "hint error";
      $("deviceConfigStatus").textContent = err.message;
    }
  } finally {
    deviceSaving = false;
    $("saveDevice").setAttribute("aria-busy", "false");
    $("deviceConfigFields").disabled = !authenticated || !deviceConfig;
    $("saveDevice").disabled = $("resetDevice").disabled = !authenticated || !deviceConfig;
    if (deviceData) renderDevices(deviceData);
  }
}

function initDevices() {
  Object.assign(I18N.zh, DEVICE_COPY.zh);
  Object.assign(I18N.en, DEVICE_COPY.en);
  $("deviceFilter").addEventListener("submit", (event) => { event.preventDefault(); devicePage = 1; loadDevices(); });
  $("devicePrev").addEventListener("click", () => { devicePage = Math.max(1, devicePage - 1); loadDevices(); });
  $("deviceNext").addEventListener("click", () => { devicePage++; loadDevices(); });
  $("deviceRecords").addEventListener("click", (event) => {
    const button = event.target.closest("[data-edit-device]");
    if (button && !button.disabled) selectDevice(button.dataset.editDevice);
  });
  $("deviceConfigForm").addEventListener("input", () => { setDeviceDirty(true); $("deviceConfigStatus").textContent = ""; });
  $("deviceConfigForm").addEventListener("submit", saveDeviceConfig);
  $("resetDevice").addEventListener("click", () => {
    if (deviceConfig && (!deviceDirty || window.confirm(t("discardDevice")))) fillDeviceConfig(deviceConfig);
  });
  window.addEventListener("beforeunload", (event) => { if (deviceDirty || deviceSaving) { event.preventDefault(); event.returnValue = ""; } });
}
