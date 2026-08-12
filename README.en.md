<div align="center">

![Subscription Lifecycle Supervisor Banner](./public/assets/banner-animated.en.svg)

</div>

<div align="center">

![Typing SVG](https://readme-typing-svg.demolab.com?font=Plus+Jakarta+Sans&weight=600&size=18&duration=3000&pause=1000&color=23dfa0&center=true&vCenter=true&width=750&lines=Billing+cycles+and+expiration+management;Local-first+dashboard+for+digital+subscriptions;Secure+persistence+via+IndexedDB;Works+offline+as+a+PWA)

</div>

<div align="center">

[![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](#-technologies)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](#-technologies)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](#-technologies)
[![Vitest](https://img.shields.io/badge/Vitest-Ready-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](#-technologies)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](#-validation)

</div>

---

Subscription Lifecycle Supervisor is a local-first dashboard to track digital subscriptions, free plans, educational benefits, and trial periods.

The goal of the project is to return control over billing and expiration cycles without requiring logins, bank connections, complex spreadsheets, or cloud synchronization. The application runs in the browser, persists data in IndexedDB, and works as a PWA once loaded/installed.

<div align="center">

<table>
  <tr>
    <td align="center" valign="middle" width="80">
      <img src="./public/assets/logos/logo.svg" alt="Subscription Lifecycle Supervisor Icon" width="60" height="60">
    </td>
    <td>
      <strong>Subscription Lifecycle Supervisor</strong><br/>
      <small>Local-first dashboard to track subscriptions, plans, and trial periods.</small><br/>
      <a href="https://subscription-lifecycle-supervisor.vercel.app/" target="_blank">
        <img src="https://img.shields.io/badge/Deploy%20on%20Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Deploy on Vercel" height="20">
      </a>
    </td>
  </tr>
</table>

</div>

---

## 📌 Table of Contents

1. [🎯 The Problem](#-the-problem)
2. [💡 The Solution](#-the-solution)
3. [✨ MVP Features](#-mvp-features)
4. [🚧 MVP Limitations](#-mvp-limitations)
5. [⚡ Technologies](#-technologies)
6. [🚀 How to Run Locally](#-how-to-run-locally)
7. [📦 Static Delivery](#-static-delivery)
8. [🧪 Validation](#-validation)
9. [📁 Project Structure](#-project-structure)

---

## 🎯 The Problem

Monthly subscriptions, annual charges, free licenses that expire, and short trials are easy to forget. The result is often a mix of unexpected charges, duplicated services, and a lack of clarity about the real cost of digital life.

Spreadsheets solve part of the problem but add friction. Full-fledged financial apps can be overkill for those who just want to understand and track their subscriptions.

---

## 💡 The Solution

The product was built as a simple, visual, and local-first web application:

- **Visual-first:** subscriptions are displayed in clear cards, with status, value, cycle, relevant dates, and the service's visual identity when available in the local catalog.
- **Local-first:** data is persisted in the user's browser, with no backend, login, or remote database in the MVP.
- **Lifecycle focus:** the app prioritizes renewals, trials nearing expiration, ended subscriptions, and archived items.

---

## ✨ MVP Features

- Dashboard with normalized monthly costs and annual projections.
- Quick registration for paid, free, educational, or trial subscriptions.
- Initial local catalog of known services.
- Assisted auto-fill of name, color, category, and local logo when the service exists in the catalog.
- Visual alerts for trials nearing expiration.
- Editing, ending, and archiving of subscriptions.
- Local persistence via IndexedDB.
- Offline support as a PWA.
- Automated unit/component tests and E2E tests for core flows.
- CI validation for build, tests, lint, and E2E in Chromium.

---

## 🚧 MVP Limitations

The MVP does not include a backend, login, remote account, remote database, cross-device synchronization, analytics, real push notifications, import/export, or external runtime calls. Data stays in the user's browser; clearing site data in the browser also removes local records.

---

## ⚡ Technologies

- Vue 3 with Composition API.
- Vite.
- Modern JavaScript.
- Pinia.
- Dexie.js over IndexedDB.
- vite-plugin-pwa.
- Modular CSS with design tokens.
- Vitest, Vue Test Utils, and Playwright.

---

## 🚀 How to Run Locally

Requirements:

- Node.js 20.19 or higher.
- npm.

Main commands:

```bash
npm install
npm run dev
npm run build
npm run test
npm run test:e2e
npm run lint
```

To run E2E tests for the first time in this environment, install the browser used by Playwright:

```bash
npx playwright install chromium
```

---

## 📦 Static Delivery

The production build is generated in `dist/`:

```bash
npm run build
```

The content in `dist/` can be published to a static host. The project has no automated deployment configured, requires no secrets, and does not depend on a runtime backend.

---

## 🧪 Validation

Before delivering a change, run:

```bash
npm run build
npm run test
npm run lint
npm run test:e2e
```

The GitHub Actions CI runs the same core validation on `push` and `pull_request` to `main`, including the installation of Playwright's Chromium in the CI environment.

---

## 📁 Project Structure

Current public structure:

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

This section tracks only the actual public structure of the project and should be updated when public files and directories are created, removed, moved, or renamed.

---
