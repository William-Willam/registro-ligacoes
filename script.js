const STORAGE_KEY = "registro-ligacoes-v1";

const entriesEl = document.getElementById("entries");
const template = document.getElementById("entryTemplate");
const dateInput = document.getElementById("logDate");
const saveStatus = document.getElementById("saveStatus");
const summaryText = document.getElementById("summaryText");
const summaryPending = document.getElementById("summaryPending");

const newDayModal = document.getElementById("newDayModal");
const newDayText = document.getElementById("newDayText");
const newDayKeep = document.getElementById("newDayKeep");
const newDayFresh = document.getElementById("newDayFresh");

let saveTimer = null;

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Falha ao ler dados salvos:", e);
    return null;
  }
}

function currentState() {
  const entries = [...entriesEl.querySelectorAll(".entry")].map((el) => ({
    telefone: el.querySelector(".f-telefone").value,
    nome: el.querySelector(".f-nome").value,
    colar: el.querySelector(".f-colar").value,
    lancado: el.querySelector(".f-lancado").checked,
  }));
  return { date: dateInput.value, entries };
}

function saveState() {
  const state = currentState();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveStatus.textContent = "Salvo neste navegador";
  } catch (e) {
    console.error("Falha ao salvar:", e);
    saveStatus.textContent = "Não foi possível salvar";
  }
  updateSummary();
}

function scheduleSave() {
  saveStatus.textContent = "Salvando…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 400);
}

function updateSummary() {
  const cards = [...entriesEl.querySelectorAll(".entry")];
  const total = cards.length;
  const pending = cards.filter((el) => !el.querySelector(".f-lancado").checked).length;

  summaryText.textContent = total === 1 ? "1 ligação hoje" : `${total} ligações hoje`;

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

function addEntry(data = {}) {
  const node = template.content.cloneNode(true);
  const entry = node.querySelector(".entry");

  entry.querySelector(".f-telefone").value = data.telefone || "";
  entry.querySelector(".f-nome").value = data.nome || "";
  entry.querySelector(".f-colar").value = data.colar || "";

  const lancadoBox = entry.querySelector(".f-lancado");
  lancadoBox.checked = !!data.lancado;
  entry.classList.toggle("is-lancado", lancadoBox.checked);

  entry.querySelectorAll("input, textarea").forEach((f) => {
    f.addEventListener("input", scheduleSave);
  });

  lancadoBox.addEventListener("change", () => {
    entry.classList.toggle("is-lancado", lancadoBox.checked);
    saveState();
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
    saveState();
  });

  entriesEl.appendChild(node);
  renumber();
}

document.getElementById("addEntry").addEventListener("click", () => {
  addEntry();
  saveState();
  const cards = entriesEl.querySelectorAll(".entry");
  cards[cards.length - 1].querySelector(".f-telefone").focus();
});

document.getElementById("clearAll").addEventListener("click", () => {
  if (!confirm("Limpar todas as ligações registradas hoje? Essa ação não pode ser desfeita.")) return;
  entriesEl.innerHTML = "";
  addEntry();
  dateInput.value = todayISO();
  saveState();
});

dateInput.addEventListener("input", scheduleSave);

// ---- Exportar / Importar backup ----

document.getElementById("exportBtn").addEventListener("click", () => {
  const state = currentState();
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
      if (!confirm(`Importar ${state.entries.length} ligação(ões) de ${state.date || "data desconhecida"}? Isso substitui os dados atuais na tela.`)) return;
      entriesEl.innerHTML = "";
      dateInput.value = state.date || todayISO();
      state.entries.forEach((e) => addEntry(e));
      saveState();
    } catch (e) {
      alert("Não foi possível importar esse arquivo. Verifique se é um backup exportado por esta página.");
    }
  };
  reader.readAsText(file);
  importFile.value = "";
});

// ---- Detecção de novo dia ----

function formatDateBR(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

function offerNewDay(savedState) {
  const count = savedState.entries.length;
  newDayText.textContent =
    `As ligações salvas são de ${formatDateBR(savedState.date) || "um dia anterior"} (${count} registro${count === 1 ? "" : "s"}). ` +
    `Hoje é outro dia — quer manter esses registros na tela ou começar em branco?`;
  newDayModal.hidden = false;

  newDayKeep.onclick = () => {
    newDayModal.hidden = true;
    savedState.entries.forEach((e) => addEntry(e));
    updateSummary();
  };

  newDayFresh.onclick = () => {
    newDayModal.hidden = true;
    dateInput.value = todayISO();
    addEntry();
    saveState();
  };
}

// ---- init ----
const saved = loadState();
if (saved && saved.entries && saved.entries.length) {
  const today = todayISO();
  if (saved.date && saved.date !== today) {
    dateInput.value = today;
    offerNewDay(saved);
  } else {
    dateInput.value = saved.date || today;
    saved.entries.forEach((e) => addEntry(e));
  }
} else {
  dateInput.value = todayISO();
  addEntry();
}

updateSummary();
