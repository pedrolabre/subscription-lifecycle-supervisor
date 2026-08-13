<div align="right">
  <b>Português</b> &nbsp;•&nbsp; <a href="./README.en.md">English</a>
</div>

<div align="center">

![Subscription Lifecycle Supervisor Banner](./public/assets/banner-animated.svg)

</div>

<div align="center">

![Typing SVG](https://readme-typing-svg.demolab.com?font=Plus+Jakarta+Sans&weight=600&size=18&duration=3000&pause=1000&color=23dfa0&center=true&vCenter=true&width=750&lines=Controle+de+ciclos+de+cobran%C3%A7a+e+expira%C3%A7%C3%A3o;Painel+local-first+para+assinaturas+digitais;Persist%C3%AAncia+segura+via+IndexedDB;Funciona+offline+como+PWA)

</div>

<div align="center">

[![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](#tecnologias-usadas)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](#tecnologias-usadas)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](#tecnologias-usadas)
[![Vitest](https://img.shields.io/badge/Vitest-Ready-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](#testes-e-build)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](#testes-e-build)

</div>

---

**Subscription Lifecycle Supervisor** é uma SPA local-first para acompanhar
assinaturas digitais, planos gratuitos, benefícios educacionais e períodos de
teste. Tudo roda no navegador: não há backend, login, banco remoto ou
sincronização obrigatória em nuvem.

<div align="center">

<table>
  <tr>
    <td align="center" valign="middle" width="80">
      <img src="./public/assets/logos/logo.svg" alt="Subscription Lifecycle Supervisor Icon" width="60" height="60">
    </td>
    <td>
      <strong>Subscription Lifecycle Supervisor</strong><br/>
      <small>Painel local-first para assinaturas, ciclos de cobrança e trials.</small><br/>
      <a href="https://subscription-lifecycle-supervisor.vercel.app/" target="_blank">
        <img src="https://img.shields.io/badge/Abrir%20deploy-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Abrir deploy" height="20">
      </a>
    </td>
  </tr>
</table>

</div>

---

## Índice

1. [Status do MVP](#status-do-mvp)
2. [O Problema](#o-problema)
3. [A Solução](#a-solução)
4. [Funcionalidades Entregues](#funcionalidades-entregues)
5. [Segurança e Privacidade](#segurança-e-privacidade)
6. [Tecnologias Usadas](#tecnologias-usadas)
7. [Como Executar Localmente](#como-executar-localmente)
8. [Testes e Build](#testes-e-build)
9. [Estrutura do Projeto](#estrutura-do-projeto)
10. [Roadmap Pós-MVP](#roadmap-pós-mvp)

---

## Status do MVP

| Item | Estado |
| --- | --- |
| MVP | Concluído |
| Fechamento documental | 2026-08-13 |
| Deploy | https://subscription-lifecycle-supervisor.vercel.app/ |
| Arquitetura | SPA Vue de rota única, local-first |
| Persistência | IndexedDB via Dexie |
| Validação automatizada | Vitest, Vue Test Utils, Playwright e GitHub Actions |
| Evoluções pós-MVP integradas | Redesign visual, tema claro, interface em inglês e modularização da UI |

## O Problema

Assinaturas mensais, cobranças anuais, licenças gratuitas que expiram e trials
de poucos dias são fáceis de esquecer. O resultado costuma ser uma mistura de
cobranças inesperadas, serviços duplicados e falta de clareza sobre o custo
real da vida digital.

Planilhas resolvem parte do problema, mas adicionam atrito. Aplicativos
financeiros completos podem ser exagerados para quem só quer entender e
acompanhar assinaturas.

## A Solução

O projeto entrega um painel simples, visual e local para acompanhar ciclos de
assinaturas:

- **Dashboard claro:** total mensal normalizado, projeção anual, contadores e
  alertas de trial.
- **Cadastro rápido:** assinatura paga, gratuita, educacional ou trial com
  validação de domínio.
- **Ciclo de vida completo:** edição, encerramento, arquivamento,
  desarquivamento e desfazer arquivamento.
- **Experiência local-first:** dados persistidos no navegador com IndexedDB.
- **Uso recorrente:** UI compacta, tema claro/escuro e português/inglês.

## Funcionalidades Entregues

- Formulário em modal acessível com seleção por catálogo, serviço livre e
  preenchimento assistido.
- Catálogo local expandido com serviços de streaming, produtividade,
  desenvolvimento, design, IA, educação e games.
- Cards responsivos com status, preço, ciclo, data relevante, identidade visual
  e alerta de trial próximo do fim.
- Confirm dialog para ações de ciclo de vida e toast para desfazer
  arquivamento.
- Store Pinia com estados carregando, vazio, erro recuperável e dados
  carregados.
- Persistência local com Dexie/IndexedDB.
- PWA com build estático e shell offline.
- Tema escuro como padrão, tema claro opcional e interface pública em português
  ou inglês.
- Testes unitários, de componentes e E2E dos fluxos principais.
- CI com build, testes, lint e Playwright em Chromium.

## Segurança e Privacidade

- Nenhum dado é enviado para backend próprio.
- Não há login, conta remota, banco remoto, analytics ou sincronização entre
  dispositivos.
- As assinaturas ficam no IndexedDB do navegador do usuário.
- Limpar os dados do site no navegador também remove os registros locais.
- Logos externos do catálogo são apenas melhoria visual; quando não carregam, o
  app usa fallback local por inicial e cor de marca.

## Tecnologias Usadas

- Vue 3 com Composition API.
- Vite 8.
- JavaScript moderno.
- Pinia.
- Dexie.js sobre IndexedDB.
- vite-plugin-pwa.
- CSS nativo modular com design tokens.
- Vitest, Vue Test Utils e Playwright.

## Como Executar Localmente

```bash
npm install
npm run dev
```

## Testes e Build

```bash
npm run build
npm run test
npm run lint
npm run test:e2e
```

Para executar os testes E2E pela primeira vez neste ambiente, instale o browser
usado pelo Playwright:

```bash
npx playwright install chromium
```

## Estrutura do Projeto

Estrutura pública rastreada no Git:

```text
subscription-lifecycle-supervisor/
  .github/
    workflows/
  public/
    assets/
      logos/
    fonts/
      figtree/
  src/
    app/
    core/
      dates/
      money/
    domain/
      services/
      subscriptions/
    features/
      subscription-card/
      subscription-form/
    infrastructure/
      db/
      pwa/
      subscriptions/
    shared/
      components/
      i18n/
      styles/
      theme/
    stores/
      subscriptions/
  tests/
    e2e/
  index.html
  package.json
  package-lock.json
  README.md
  README.en.md
  vite.config.js
  playwright.config.js
  eslint.config.js
```

## Roadmap Pós-MVP

- Exportação/importação manual de backup local.
- Histórico financeiro por mês.
- Filtros avançados por categoria, status e custo.
- Personalização local de catálogo e logos.
- Configuração de moeda.

---

<div align="center">
Desenvolvido por <b>Pedro Labre</b>
</div>
