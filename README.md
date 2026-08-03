# Subscription Lifecycle Supervisor

Subscription Lifecycle Supervisor sera um painel local-first para acompanhar
assinaturas digitais, planos gratuitos, beneficios educacionais e periodos de
teste.

O objetivo do projeto e devolver controle sobre ciclos de cobranca e expiracao
sem exigir login, conexao bancaria, planilhas complexas ou sincronizacao em
nuvem. A aplicacao sera executada no navegador e os dados do usuario ficarao
armazenados localmente.

---

## O Problema

Assinaturas mensais, cobrancas anuais, licencas gratuitas que expiram e trials
de poucos dias sao faceis de esquecer. O resultado costuma ser uma mistura de
cobrancas inesperadas, servicos duplicados e falta de clareza sobre o custo
real da vida digital.

Planilhas resolvem parte do problema, mas adicionam atrito. Aplicativos
financeiros completos podem ser exagerados para quem so quer entender e
acompanhar assinaturas.

## A Solucao Pretendida

O produto sera construido como uma aplicacao web simples, visual e local-first:

- **Visual-first:** assinaturas serao exibidas em cards claros, com status,
  valor, ciclo, data relevante e identidade visual do servico quando houver
  catalogo local.
- **Local-first:** os dados serao persistidos no navegador do usuario, sem
  backend, login ou banco remoto no MVP.
- **Foco no ciclo de vida:** o app priorizara renovacoes, trials perto do fim,
  assinaturas encerradas e itens arquivados.

## Funcionalidades Planejadas

- Dashboard com custo mensal normalizado e projecao anual.
- Cadastro rapido de assinatura paga, gratuita, educacional ou trial.
- Catalogo local inicial de servicos conhecidos.
- Preenchimento assistido de nome, cor, categoria e logo local quando o servico
  existir no catalogo.
- Alerta visual para trials proximos do vencimento.
- Edicao, encerramento e arquivamento de assinaturas.
- Persistencia local via IndexedDB.
- Funcionamento offline como PWA.

## Tecnologias Previstas

A implementacao sera guiada pelo plano interno do projeto e deve usar:

- Vue 3 com Composition API.
- Vite.
- JavaScript moderno.
- Pinia.
- Dexie.js sobre IndexedDB.
- vite-plugin-pwa.
- CSS modular com design tokens.
- Vitest, Vue Test Utils e Playwright quando a base de testes existir.

## Como Executar Localmente

Requisitos:

- Node.js 20.19 ou superior.
- npm.

Comandos principais:

```bash
npm install
npm run dev
npm run build
npm run test
npm run lint
```

## Estrutura do Projeto

Estrutura publica atual:

```text
subscription-lifecycle-supervisor/
  .gitignore
  README.md
  eslint.config.js
  index.html
  package.json
  package-lock.json
  vite.config.js
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
```

Esta secao deve acompanhar apenas a estrutura publica real do projeto. Ela sera
atualizada conforme arquivos e diretorios publicos forem criados, removidos,
movidos ou renomeados durante a implementacao.
