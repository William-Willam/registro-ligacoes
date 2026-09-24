# Registro de Ligações — Atendimento

Página simples em HTML/CSS/JS puro (sem build, sem dependências) para registrar
ligações de atendimento. Os dados ficam salvos no navegador (localStorage) —
não há backend nem banco de dados.

## Como usar

- Abra `index.html` no navegador.
- Preencha a Data uma vez no topo.
- Para cada ligação: Telefone, Nome, e cole o bloco de texto (Situação /
  Verificado / Solução / Equipamento) na caixa "Colar aqui".
- Clique em **+ Nova ligação** para adicionar quantas ligações precisar.
- **Limpar tudo** apaga todas as ligações do dia (pede confirmação).

Os dados são salvos automaticamente a cada alteração, no navegador que você
está usando. Se abrir em outro computador ou navegador, os dados não
aparecem lá (fica só localStorage).

## Publicar no GitHub Pages

1. Crie um repositório novo no GitHub (ex.: `registro-ligacoes`).
2. Suba estes 3 arquivos (`index.html`, `style.css`, `script.js`) para a raiz
   do repositório — pelo site do GitHub (Add file → Upload files) ou via git:
   ```bash
   git init
   git add index.html style.css script.js
   git commit -m "Registro de ligações"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/registro-ligacoes.git
   git push -u origin main
   ```
3. No repositório, vá em **Settings → Pages**.
4. Em "Build and deployment", selecione **Source: Deploy from a branch**,
   branch **main**, pasta **/ (root)** → **Save**.
5. Depois de 1–2 minutos, o GitHub mostra o link, algo como:
   `https://SEU_USUARIO.github.io/registro-ligacoes/`

Pronto — a página fica acessível por esse link, inclusive pelo celular.
