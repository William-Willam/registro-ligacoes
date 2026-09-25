<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Registro de Ligações — Atendimento</title>
<link rel="stylesheet" href="style.css">
</head>
<body>

  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        <span class="brand-mark">●</span>
        <div>
          <h1>Registro de Ligações</h1>
          <p class="brand-sub">Suporte Técnico · Autotrac</p>
        </div>
      </div>
      <label class="date-field">
        <span>Data</span>
        <input type="date" id="logDate">
      </label>
    </div>
  </header>

  <div class="summary-bar">
    <div class="summary-inner">
      <span id="summaryText">0 ligações hoje</span>
      <span id="summaryPending" class="pending-badge" hidden></span>
    </div>
  </div>

  <main class="container">
    <div id="entries"></div>

    <button id="addEntry" class="add-btn" type="button">
      <span class="add-btn-icon">+</span> Nova ligação
    </button>
  </main>

  <footer class="bottombar">
    <div class="bottombar-left">
      <button id="clearAll" class="ghost-btn" type="button">Limpar tudo</button>
      <button id="exportBtn" class="ghost-btn" type="button">Exportar backup</button>
      <button id="importBtn" class="ghost-btn" type="button">Importar</button>
      <input type="file" id="importFile" accept="application/json" hidden>
    </div>
    <span class="save-status" id="saveStatus">Salvo neste navegador</span>
  </footer>

  <template id="entryTemplate">
    <article class="entry" data-id="">
      <div class="entry-head">
        <span class="entry-index">01</span>
        <div class="entry-fields">
          <label>
            <span>Telefone</span>
            <input type="tel" class="f-telefone" placeholder="(00) 00000-0000">
          </label>
          <label>
            <span>Nome</span>
            <input type="text" class="f-nome" placeholder="Nome do cliente">
          </label>
        </div>
        <button class="remove-btn" type="button" title="Remover ligação">✕</button>
      </div>
      <label class="paste-field">
        <span>Colar aqui</span>
        <textarea class="f-colar" rows="5" placeholder="Situação:&#10;Verificado:&#10;Solução:&#10;Equipamento:"></textarea>
      </label>
      <label class="lancado-field">
        <input type="checkbox" class="f-lancado">
        <span>Lançado no sistema</span>
      </label>
    </article>
  </template>

  <div class="modal-overlay" id="newDayModal" hidden>
    <div class="modal">
      <h2>Novo dia detectado</h2>
      <p id="newDayText"></p>
      <div class="modal-actions">
        <button id="newDayKeep" class="ghost-btn" type="button">Manter ligações antigas</button>
        <button id="newDayFresh" class="primary-btn" type="button">Começar o dia em branco</button>
      </div>
    </div>
  </div>

  <script src="script.js"></script>
</body>
</html>
