const STORAGE_KEY = "registro-ligacoes-v1";

const entriesEl = document.getElementById("entries");
const template = document.getElementById("entryTemplate");
const dateInput = document.getElementById("logDate");
const saveStatus = document.getElementById("saveStatus");

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

function saveState() {
  const entries = [...entriesEl.querySelectorAll(".entry")].map((el) => ({
    telefone: el.querySelector(".f-telefone").value,
    nome: el.querySelector(".f-nome").value,
    colar: el.querySelector(".f-colar").value,
  }));
  const state = { date: dateInput.value, entries };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveStatus.textContent = "Salvo neste navegador";
  } catch (e) {
    console.error("Falha ao salvar:", e);
    saveStatus.textContent = "Não foi possível salvar";
  }
}

function scheduleSave() {
  saveStatus.textContent = "Salvando…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 400);
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

  entry.querySelectorAll("input, textarea").forEach((f) => {
    f.addEventListener("input", scheduleSave);
  });

  entry.querySelector(".remove-btn").addEventListener("click", () => {
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

// ---- init ----
const saved = loadState();
if (saved && saved.entries && saved.entries.length) {
  dateInput.value = saved.date || todayISO();
  saved.entries.forEach((e) => addEntry(e));
} else {
  dateInput.value = todayISO();
  addEntry();
}
