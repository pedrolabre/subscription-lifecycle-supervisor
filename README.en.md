<div align="right">
  <a href="./README.md">Português</a> &nbsp;•&nbsp; <b>English</b>
</div>

<div align="center">

![Subscription Lifecycle Supervisor Banner](./public/assets/banner-animated.en.svg)

</div>

<div align="center">

![Typing SVG](https://readme-typing-svg.demolab.com?font=Plus+Jakarta+Sans&weight=600&size=18&duration=3000&pause=1000&color=23dfa0&center=true&vCenter=true&width=750&lines=Billing+cycles+and+expiration+management;Local-first+dashboard+for+digital+subscriptions;Secure+persistence+via+IndexedDB;Works+offline+as+a+PWA)

</div>

<div align="center">

[![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](#technologies-used)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](#technologies-used)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](#technologies-used)
[![Vitest](https://img.shields.io/badge/Vitest-Ready-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](#tests-and-build)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](#tests-and-build)

</div>

---

**Subscription Lifecycle Supervisor** is a local-first SPA for tracking digital
subscriptions, free plans, educational benefits, and trial periods. Everything
runs in the browser: there is no backend, login, remote database, or mandatory
cloud synchronization.

<div align="center">

<table>
  <tr>
    <td align="center" valign="middle" width="80">
      <img src="./public/assets/logos/logo.svg" alt="Subscription Lifecycle Supervisor Icon" width="60" height="60">
    </td>
    <td>
      <strong>Subscription Lifecycle Supervisor</strong><br/>
      <small>Local-first dashboard for subscriptions, billing cycles, and trials.</small><br/>
      <a href="https://subscription-lifecycle-supervisor.vercel.app/" target="_blank">
        <img src="https://img.shields.io/badge/Open%20deploy-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Open deploy" height="20">
      </a>
    </td>
  </tr>
</table>

</div>

---

## Table of Contents

1. [MVP Status](#mvp-status)
2. [The Problem](#the-problem)
3. [The Solution](#the-solution)
4. [Delivered Features](#delivered-features)
5. [Security and Privacy](#security-and-privacy)
6. [Technologies Used](#technologies-used)
7. [How to Run Locally](#how-to-run-locally)
8. [Tests and Build](#tests-and-build)
9. [Project Structure](#project-structure)
10. [Post-MVP Roadmap](#post-mvp-roadmap)

---

## MVP Status

| Item | State |
| --- | --- |
| MVP | Complete |
| Documentation closure | 2026-08-13 |
| Deploy | https://subscription-lifecycle-supervisor.vercel.app/ |
| Architecture | Single-route Vue SPA, local-first |
| Persistence | IndexedDB via Dexie |
| Automated validation | Vitest, Vue Test Utils, Playwright, and GitHub Actions |
| Integrated post-MVP evolutions | Visual redesign, light theme, English UI, and UI modularization |

## The Problem

Monthly subscriptions, annual charges, free licenses that expire, and short
trials are easy to forget. The result is often a mix of unexpected charges,
duplicated services, and a lack of clarity about the real cost of digital life.

Spreadsheets solve part of the problem but add friction. Full financial apps can
be too much for users who only want to understand and track their subscriptions.

## The Solution

The project delivers a simple, visual, and local dashboard for subscription
cycles:

- **Clear dashboard:** normalized monthly total, yearly projection, counters,
  and trial alerts.
- **Fast registration:** paid, free, educational, or trial subscriptions with
  domain validation.
- **Complete lifecycle:** edit, end, archive, unarchive, and undo archive.
- **Local-first experience:** data persisted in the browser with IndexedDB.
- **Daily-use UI:** compact interface, light/dark theme, and Portuguese/English
  support.

## Delivered Features

- Accessible form modal with catalog selection, free service entry, and assisted
  metadata fill.
- Expanded local catalog with streaming, productivity, development, design, AI,
  education, and gaming services.
- Responsive cards with status, price, cycle, relevant date, visual identity,
  and trial-near-end alert.
- Confirmation dialog for lifecycle actions and toast for undoing archive.
- Pinia store with loading, empty, recoverable error, and loaded states.
- Local persistence with Dexie/IndexedDB.
- PWA with static build and offline shell.
- Dark theme by default, optional light theme, and public UI in Portuguese or
  English.
- Unit, component, and E2E tests for the main flows.
- CI with build, tests, lint, and Playwright in Chromium.

## Security and Privacy

- No data is sent to a first-party backend.
- There is no login, remote account, remote database, analytics, or cross-device
  synchronization.
- Subscriptions stay in the user's browser IndexedDB.
- Clearing site data in the browser also removes local records.
- External catalog logos are only a visual enhancement; when they do not load,
  the app uses a local fallback based on service initial and brand color.

## Technologies Used

- Vue 3 with Composition API.
- Vite 8.
- Modern JavaScript.
- Pinia.
- Dexie.js over IndexedDB.
- vite-plugin-pwa.
- Native modular CSS with design tokens.
- Vitest, Vue Test Utils, and Playwright.

## How to Run Locally

```bash
npm install
npm run dev
```

## Tests and Build

```bash
npm run build
npm run test
npm run lint
npm run test:e2e
```

To run E2E tests for the first time in this environment, install the browser
used by Playwright:

```bash
npx playwright install chromium
```

## Project Structure

Public structure tracked in Git:

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

## Post-MVP Roadmap

- Manual local backup export/import.
- Monthly financial history.
- Advanced filters by category, status, and cost.
- Local catalog and logo customization.
- Currency configuration.

---

<div align="center">
Built by <b>Pedro Labre</b>
</div>
