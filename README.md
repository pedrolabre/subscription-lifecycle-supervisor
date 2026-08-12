<div align="center">

![Subscription Lifecycle Supervisor Banner](./public/assets/banner-animated.svg)

</div>

<div align="center">

![Typing SVG](https://readme-typing-svg.demolab.com?font=Plus+Jakarta+Sans&weight=600&size=18&duration=3000&pause=1000&color=23dfa0&center=true&vCenter=true&width=750&lines=Controle+de+ciclos+de+cobran%C3%A7a+e+expira%C3%A7%C3%A3o;Painel+local-first+para+assinaturas+digitais;Persist%C3%AAncia+segura+via+IndexedDB;Funciona+offline+como+PWA)

</div>

<div align="center">

[![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](#-tecnologias)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](#-tecnologias)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](#-tecnologias)
[![Vitest](https://img.shields.io/badge/Vitest-Ready-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](#-tecnologias)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](#-validacao)

</div>

---

Subscription Lifecycle Supervisor e um painel local-first para acompanhar
assinaturas digitais, planos gratuitos, beneficios educacionais e periodos de
teste.

O objetivo do projeto e devolver controle sobre ciclos de cobranca e expiracao
sem exigir login, conexao bancaria, planilhas complexas ou sincronizacao em
nuvem. A aplicacao roda no navegador, persiste os dados em IndexedDB e funciona
como PWA depois de carregada/instalada.

<div align="center">

<table>
  <tr>
    <td align="center" valign="middle" width="80">
      <img src="./public/assets/logos/logo.svg" alt="Subscription Lifecycle Supervisor Icon" width="60" height="60">
    </td>
    <td>
      <strong>Subscription Lifecycle Supervisor</strong><br/>
      <small>Painel local-first para acompanhar assinaturas, planos e períodos de teste.</small><br/>
      <a href="https://subscription-lifecycle-supervisor.vercel.app/" target="_blank">
        <img src="https://img.shields.io/badge/Deploy%20na%20Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Deploy na Vercel" height="20">
      </a>
    </td>
  </tr>
</table>

</div>

---

## 📌 Índice Geral

1. [🎯 O Problema](#-o-problema)
2. [💡 A Solucao](#-a-solucao)
3. [✨ Funcionalidades do MVP](#-funcionalidades-do-mvp)
4. [🚧 Limites do MVP](#-limites-do-mvp)
5. [⚡ Tecnologias](#-tecnologias)
6. [🚀 Como Executar Localmente](#-como-executar-localmente)
7. [📦 Entrega Estatica](#-entrega-estatica)
8. [🧪 Validacao](#-validacao)
9. [📁 Estrutura do Projeto](#-estrutura-do-projeto)

---

## 🎯 O Problema

Assinaturas mensais, cobrancas anuais, licencas gratuitas que expiram e trials
de poucos dias sao faceis de esquecer. O resultado costuma ser uma mistura de
cobrancas inesperadas, servicos duplicados e falta de clareza sobre o custo
real da vida digital.

Planilhas resolvem parte do problema, mas adicionam atrito. Aplicativos
financeiros completos podem ser exagerados para quem so quer entender e
acompanhar assinaturas.

---

## 💡 A Solucao

O produto foi construido como uma aplicacao web simples, visual e local-first:

- **Visual-first:** assinaturas sao exibidas em cards claros, com status,
  valor, ciclo, data relevante e identidade visual do servico quando houver
  catalogo local.
- **Local-first:** os dados sao persistidos no navegador do usuario, sem
  backend, login ou banco remoto no MVP.
- **Foco no ciclo de vida:** o app prioriza renovacoes, trials perto do fim,
  assinaturas encerradas e itens arquivados.

---

## ✨ Funcionalidades do MVP

- Dashboard com custo mensal normalizado e projecao anual.
- Cadastro rapido de assinatura paga, gratuita, educacional ou trial.
- Catalogo local inicial de servicos conhecidos.
- Preenchimento assistido de nome, cor, categoria e logo local quando o servico
  existir no catalogo.
- Alerta visual para trials proximos do vencimento.
- Edicao, encerramento e arquivamento de assinaturas.
- Persistencia local via IndexedDB.
- Funcionamento offline como PWA.
- Testes automatizados unitarios/componentes e E2E dos fluxos principais.
- CI de validacao para build, testes, lint e E2E em Chromium.

---

## 🚧 Limites do MVP

O MVP nao inclui backend, login, conta remota, banco remoto, sincronizacao entre
dispositivos, analytics, notificacoes push reais, importacao/exportacao ou
chamadas externas de runtime. Os dados ficam no navegador do usuario; limpar os
dados do site no navegador tambem remove os registros locais.

---

## ⚡ Tecnologias

- Vue 3 com Composition API.
- Vite.
- JavaScript moderno.
- Pinia.
- Dexie.js sobre IndexedDB.
- vite-plugin-pwa.
- CSS modular com design tokens.
- Vitest, Vue Test Utils e Playwright.

---

## 🚀 Como Executar Localmente

Requisitos:

- Node.js 20.19 ou superior.
- npm.

Comandos principais:

```bash
npm install
npm run dev
npm run build
npm run test
npm run test:e2e
npm run lint
```

Para executar os testes E2E pela primeira vez neste ambiente, instale o browser
usado pelo Playwright:

```bash
npx playwright install chromium
```

---

## 📦 Entrega Estatica

O build de producao e gerado em `dist/`:

```bash
npm run build
```

O conteudo de `dist/` pode ser publicado em uma hospedagem estatica. O projeto
nao possui deploy automatico configurado, nao exige secrets e nao depende de
backend em runtime.

---

## 🧪 Validacao

Antes de entregar uma alteracao, rode:

```bash
npm run build
npm run test
npm run lint
npm run test:e2e
```

A CI em GitHub Actions executa a mesma validacao principal em `push` e
`pull_request` para `main`, incluindo instalacao do Chromium do Playwright no
ambiente de CI.

---

## 📁 Estrutura do Projeto

Estrutura publica atual:

```text
subscription-lifecycle-supervisor/
  .github/
    workflows/
      ci.yml
  .gitignore
  README.md
  eslint.config.js
  index.html
  package.json
  package-lock.json
  playwright.config.js
  vite.config.js
  public/
    icons/
      app-icon.svg
      pwa-icon-192.png
      pwa-icon-512.png
      pwa-maskable-512.png
  src/
    app/
      App.vue
      App.test.js
      main.js
    core/
      dates/
        dates.test.js
        index.js
      money/
        index.js
        money.test.js
    domain/
      services/
        catalog.js
        constants.js
        index.js
        lookup.js
        normalization.js
        service-catalog.test.js
      subscriptions/
        constants.js
        index.js
        normalization.js
        summary.js
        summary.test.js
        subscription.test.js
        validation.js
    features/
      subscription-card/
        SubscriptionCard.vue
        SubscriptionCard.test.js
        index.js
      subscription-form/
        NewSubscriptionForm.vue
        NewSubscriptionForm.test.js
        index.js
    infrastructure/
      db/
        database.js
        database.test.js
        index.js
        schema.js
        settingsSeed.js
      pwa/
        config.js
        config.test.js
      subscriptions/
        index.js
        mappers.js
        mappers.test.js
        repository.js
        repository.test.js
    stores/
      subscriptions/
        index.js
        store.js
        store.test.js
    shared/
      components/
        BaseButton.vue
        StatePanel.vue
        StatusBadge.vue
        SummaryMetric.vue
        index.js
        shared-components.test.js
      styles/
        base.css
        index.css
        tokens.css
  tests/
    e2e/
      main-flows.spec.js
```

Esta secao acompanha apenas a estrutura publica real do projeto e deve ser
atualizada quando arquivos e diretorios publicos forem criados, removidos,
movidos ou renomeados.

---
