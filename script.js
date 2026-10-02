const DATA_KEY = "registro-ligacoes-dados-v1";
const LAST_DATE_KEY = "registro-ligacoes-last-date";
const OLD_KEY = "registro-ligacoes-v1"; // formato antigo, usado para migração
const THEME_KEY = "registro-ligacoes-theme";

const entriesEl = document.getElementById("entries");
const template = document.getElementById("entryTemplate");
const dateInput = document.getElementById("logDate");
const dayPicker = document.getElementById("dayPicker");
const saveStatus = document.getElementById("saveStatus");
const summaryText = document.getElementById("summaryText");
const summaryPending = document.getElementById("summaryPending");

const newDayModal = document.getElementById("newDayModal");
const newDayText = document.getElementById("newDayText");
const newDayKeep = document.getElementById("newDayKeep");
const newDayFresh = document.getElementById("newDayFresh");

let saveTimer = null;
let activeDate = null;

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function formatDateBR(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

function hasAnyData(e) {
  return !!((e.telefone && e.telefone.trim()) || (e.nome && e.nome.trim()) || (e.colar && e.colar.trim()));
}

// ---------------- Armazenamento (histórico por dia) ----------------

function loadAllData() {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Falha ao ler dados salvos:", e);
    return {};
  }
}

function saveAllData(all) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(all));
    saveStatus.textContent = "Salvo neste navegador";
  } catch (e) {
    console.error("Falha ao salvar:", e);
    saveStatus.textContent = "Não foi possível salvar";
  }
}

function migrateLegacyIfNeeded() {
  if (localStorage.getItem(DATA_KEY)) return;
  const raw = localStorage.getItem(OLD_KEY);
  if (!raw) return;
  try {
    const old = JSON.parse(raw);
    if (old && old.date && Array.isArray(old.entries)) {
      const all = {};
      all[old.date] = old.entries;
      saveAllData(all);
      localStorage.removeItem(OLD_KEY);
    }
  } catch (e) {
    console.error("Falha ao migrar dados antigos:", e);
  }
}

function collectEntriesFromDOM() {
  return [...entriesEl.querySelectorAll(".entry")].map((el) => ({
    telefone: el.querySelector(".f-telefone").value,
    nome: el.querySelector(".f-nome").value,
    colar: el.querySelector(".f-colar").value,
    lancado: el.querySelector(".f-lancado").checked,
  }));
}

function persistActiveDay() {
  if (!activeDate) return;
  const all = loadAllData();
  all[activeDate] = collectEntriesFromDOM();
  saveAllData(all);
  refreshDayPicker();
  updateSummary();
}

function scheduleSave() {
  saveStatus.textContent = "Salvando…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persistActiveDay, 400);
}

// ---------------- Render ----------------

function updateSummary() {
  const cards = [...entriesEl.querySelectorAll(".entry")];
  const total = cards.length;
  const pending = cards.filter((el) => !el.querySelector(".f-lancado").checked).length;

  summaryText.textContent = total === 1 ? "1 ligação neste dia" : `${total} ligações neste dia`;

  if (pending > 0) {
    summaryPending.hidden = false;
    summaryPending.textContent = pending === 1 ? "1 não lançada" : `${pending} não lançadas`;
  } else {
    summaryPending.hidden = true;
  }
}

function renumber() {
  [...entriesEl.querySelectorAll(".entry")].forEach((el, i) => {
    el.querySelector(".entry-index").textContent = String(i + 1).padStart(2, "0");
  });
}

function formatLocalPhone(digits) {
  // DDD + número local (até 11 dígitos: 8 fixo ou 9 celular)
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  // Com código do país na frente (ex.: 55 47 996280066 = 13 dígitos) -> +55 (47) 99628-0066
  if (digits.length > 11) {
    const cc = digits.slice(0, 2);
    const rest = digits.slice(2);
    return `+${cc} ${formatLocalPhone(rest)}`;
  }
  return formatLocalPhone(digits);
}

function addEntry(data = {}) {
  const node = template.content.cloneNode(true);
  const entry = node.querySelector(".entry");

  entry.querySelector(".f-telefone").value = data.telefone ? formatPhone(data.telefone) : "";
  entry.querySelector(".f-nome").value = data.nome || "";
  entry.querySelector(".f-colar").value = data.colar || "";

  const lancadoBox = entry.querySelector(".f-lancado");
  lancadoBox.checked = !!data.lancado;
  entry.classList.toggle("is-lancado", lancadoBox.checked);

  entry.querySelectorAll("input, textarea").forEach((f) => {
    f.addEventListener("input", scheduleSave);
  });

  const telefoneInput = entry.querySelector(".f-telefone");
  telefoneInput.addEventListener("input", () => {
    const pos = telefoneInput.selectionStart;
    const before = telefoneInput.value.length;
    telefoneInput.value = formatPhone(telefoneInput.value);
    const after = telefoneInput.value.length;
    const diff = after - before;
    telefoneInput.selectionStart = telefoneInput.selectionEnd = Math.max(0, pos + diff);
  });

  lancadoBox.addEventListener("change", () => {
    entry.classList.toggle("is-lancado", lancadoBox.checked);
    persistActiveDay();
  });

  entry.querySelector(".remove-btn").addEventListener("click", () => {
    const nome = entry.querySelector(".f-nome").value.trim();
    const telefone = entry.querySelector(".f-telefone").value.trim();
    const hasData = nome || telefone || entry.querySelector(".f-colar").value.trim();
    if (hasData) {
      const label = nome || telefone || "esta ligação";
      if (!confirm(`Remover o registro de "${label}"? Essa ação não pode ser desfeita.`)) return;
    }
    entry.remove();
    renumber();
    persistActiveDay();
  });

  entriesEl.appendChild(node);
  renumber();
}

function renderEntries(entries) {
  entriesEl.innerHTML = "";
  if (entries.length === 0) {
    addEntry();
  } else {
    entries.forEach((e) => addEntry(e));
  }
  updateSummary();
}

// ---------------- Troca de dia ----------------

function switchToDate(newDate, { skipPersistOld = false } = {}) {
  if (!skipPersistOld) persistActiveDay();
  activeDate = newDate;
  localStorage.setItem(LAST_DATE_KEY, newDate);
  const all = loadAllData();
  dateInput.value = newDate;
  renderEntries(all[newDate] || []);
  refreshDayPicker();
}

function refreshDayPicker() {
  const all = loadAllData();
  const dates = Object.keys(all)
    .filter((d) => (all[d] || []).some(hasAnyData))
    .sort((a, b) => (a < b ? 1 : -1));

  dayPicker.innerHTML = '<option value="">Dias salvos…</option>';
  dates.forEach((d) => {
    const count = all[d].filter(hasAnyData).length;
    const opt = document.createElement("option");
    opt.value = d;
    const label = d === activeDate ? `${formatDateBR(d)} (atual)` : formatDateBR(d);
    opt.textContent = `${label} · ${count}`;
    dayPicker.appendChild(opt);
  });
}

dateInput.addEventListener("change", () => {
  if (dateInput.value) switchToDate(dateInput.value);
});

dayPicker.addEventListener("change", () => {
  if (dayPicker.value) switchToDate(dayPicker.value);
  dayPicker.value = "";
});

document.getElementById("addEntry").addEventListener("click", () => {
  addEntry();
  persistActiveDay();
  const cards = entriesEl.querySelectorAll(".entry");
  cards[cards.length - 1].querySelector(".f-telefone").focus();
});

document.getElementById("clearAll").addEventListener("click", () => {
  if (!confirm("Limpar todas as ligações deste dia? Essa ação não pode ser desfeita.")) return;
  entriesEl.innerHTML = "";
  addEntry();
  persistActiveDay();
});

// ---------------- Exportar / Importar backup ----------------

document.getElementById("exportBtn").addEventListener("click", () => {
  const state = { date: activeDate, entries: collectEntriesFromDOM() };
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `registro-ligacoes_${state.date || todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

const importFile = document.getElementById("importFile");
document.getElementById("importBtn").addEventListener("click", () => importFile.click());

importFile.addEventListener("change", () => {
  const file = importFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const state = JSON.parse(reader.result);
      if (!state || !Array.isArray(state.entries)) throw new Error("formato inválido");
      const targetDate = state.date || todayISO();
      if (!confirm(`Importar ${state.entries.length} ligação(ões) para o dia ${formatDateBR(targetDate)}? Isso substitui os dados desse dia.`)) return;
      const all = loadAllData();
      all[targetDate] = state.entries;
      saveAllData(all);
      switchToDate(targetDate, { skipPersistOld: true });
    } catch (e) {
      alert("Não foi possível importar esse arquivo. Verifique se é um backup exportado por esta página.");
    }
  };
  reader.readAsText(file);
  importFile.value = "";
});

// ---------------- Atalho de teclado ----------------

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    document.getElementById("addEntry").click();
  }
  if (e.key === "Escape" && !newDayModal.hidden) {
    hideNewDayModal();
  }
});

newDayModal.addEventListener("click", (e) => {
  if (e.target === newDayModal) hideNewDayModal();
});

function hideNewDayModal() {
  newDayModal.hidden = true;
}

// ---------------- Detecção de dia anterior ----------------

function offerPreviousDay(prevDate, prevEntries) {
  const count = prevEntries.filter(hasAnyData).length;
  newDayText.textContent =
    `Você tinha ligações salvas em ${formatDateBR(prevDate)} (${count} registro${count === 1 ? "" : "s"}). ` +
    `Quer ver esse dia agora ou começar hoje em branco?`;
  newDayKeep.textContent = `Ver ${formatDateBR(prevDate)}`;
  newDayModal.hidden = false;

  newDayKeep.onclick = () => {
    hideNewDayModal();
    switchToDate(prevDate, { skipPersistOld: true });
  };

  newDayFresh.onclick = () => {
    hideNewDayModal();
  };
}

// ---------------- Tema claro/escuro ----------------

const themeToggle = document.getElementById("themeToggle");

function systemPrefersDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme) {
  if (theme) {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  const isDark = theme ? theme === "dark" : systemPrefersDark();
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  themeToggle.title = isDark ? "Mudar para tema claro" : "Mudar para tema escuro";
}

themeToggle.addEventListener("click", () => {
  const current = localStorage.getItem(THEME_KEY);
  const currentlyDark = current ? current === "dark" : systemPrefersDark();
  const next = currentlyDark ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

applyTheme(localStorage.getItem(THEME_KEY));

// ---------------- Init ----------------

migrateLegacyIfNeeded();

const today = todayISO();
const allData = loadAllData();
const lastDate = localStorage.getItem(LAST_DATE_KEY);

activeDate = today;
localStorage.setItem(LAST_DATE_KEY, today);
dateInput.value = today;
renderEntries(allData[today] || []);
refreshDayPicker();

if (lastDate && lastDate !== today && (allData[lastDate] || []).some(hasAnyData)) {
  offerPreviousDay(lastDate, allData[lastDate]);
}