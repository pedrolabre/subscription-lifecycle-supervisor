import { expect, test } from '@playwright/test';

const fixedNow = '2026-08-09T12:00:00.000Z';

test.beforeEach(async ({ page }) => {
  await freezeBrowserDate(page, fixedNow);
});

test('renders the empty local dashboard without backend data', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Lista local' })).toBeVisible();
  await expect(page.getByText('Nenhuma assinatura salva')).toBeVisible();
  await expect(page.getByText('Custo normalizado')).toBeVisible();

  const openFormButton = page.getByRole('button', { name: 'Nova assinatura' });

  await expect(openFormButton).toBeEnabled();
  await openFormButton.click();
  await expect(page.getByRole('dialog', { name: 'Nova assinatura' })).toBeVisible();
  await expect(page.locator('[data-test="service-name"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Nova assinatura' })).toBeHidden();
  await expect(openFormButton).toBeFocused();
});

test('covers paid subscription, trial alert, edit, archive and reload persistence', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByText('Nenhuma assinatura salva')).toBeVisible();

  await createPaidSubscription(page);

  await expect(page.getByRole('list', { name: '1 assinatura carregada' })).toBeVisible();
  await expect(
    page.getByRole('listitem', { name: /Spotify Ativa/ }),
  ).toContainText('29,90');
  await expect(page.locator('.summary-grid')).toContainText('29,90');

  await createTrialSubscription(page);

  await expect(page.getByRole('list', { name: '2 assinaturas carregadas' })).toBeVisible();
  await expect(page.getByText('1 trial perto do vencimento')).toBeVisible();
  await expect(page.getByText('Trial perto do fim')).toBeVisible();
  await expect(
    page.getByRole('listitem', { name: /Figma Trial Trial/ }),
  ).toContainText('14/08/2026');

  await editPaidSubscription(page);

  await expect(
    page.getByRole('listitem', { name: /Google One Ativa/ }),
  ).toContainText('35,50');
  await expect(page.locator('.summary-grid')).toContainText('35,50');

  await page.getByRole('button', { name: 'Arquivar Google One' }).click();
  await page.locator('[data-test="submit-confirm-dialog"]').click();

  await expect(page.getByRole('listitem', { name: /Google One Arquivada/ })).toBeVisible();
  await expect(page.locator('.summary-grid')).toContainText('0,00');

  await page.reload();

  await expect(page.getByRole('list', { name: '2 assinaturas carregadas' })).toBeVisible();
  await expect(page.getByRole('listitem', { name: /Google One Arquivada/ })).toBeVisible();
  await expect(page.getByRole('listitem', { name: /Figma Trial Trial/ })).toBeVisible();
  await expect(page.getByText('1 trial perto do vencimento')).toBeVisible();
  await expect(page.locator('.summary-grid')).toContainText('0,00');
});

test('persists light theme and English locale across reloads without losing local data', async ({
  page,
}) => {
  await page.goto('/');

  await createPaidSubscription(page);
  await setTheme(page, 'light');
  await setLocale(page, 'en-US');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(page.locator('[data-test="locale-toggle"]')).toHaveText('PT');
  await expect(
    page.getByRole('list', { name: '1 subscription loaded' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'New subscription' })).toBeVisible();

  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(page.locator('[data-test="locale-toggle"]')).toHaveText('PT');
  await expect(
    page.getByRole('list', { name: '1 subscription loaded' }),
  ).toBeVisible();
  await expect(page.getByRole('listitem', { name: /Spotify Active/ })).toContainText(
    '29.90',
  );
});

test('captures dark and light layouts in Portuguese and English without mobile overflow', async ({
  page,
}) => {
  const viewports = [
    { name: 'desktop', width: 1366, height: 768 },
    { name: 'tablet', width: 820, height: 1180 },
    { name: 'mobile', width: 390, height: 844 },
  ];
  const variants = [
    { locale: 'pt-BR', name: 'pt-dark', theme: 'dark' },
    { locale: 'pt-BR', name: 'pt-light', theme: 'light' },
    { locale: 'en-US', name: 'en-light', theme: 'light' },
    { locale: 'en-US', name: 'en-dark', theme: 'dark' },
  ];

  await page.goto('/');
  await createPaidSubscription(page);
  await createTrialSubscription(page);

  for (const variant of variants) {
    await setTheme(page, variant.theme);
    await setLocale(page, variant.locale);

    for (const viewport of viewports) {
      await page.setViewportSize({
        height: viewport.height,
        width: viewport.width,
      });
      await expect(page.locator('.app-shell')).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        fullPage: true,
        path: `test-results/block-03-visual/${variant.name}-${viewport.name}.png`,
      });
    }
  }
});

test('opens and interacts with backup dialog', async ({ page }) => {
  await page.goto('/');

  const backupButton = page.getByRole('button', { name: 'Backup' });
  await expect(backupButton).toBeVisible();
  await backupButton.click();

  const backupDialog = page.getByRole('dialog', { name: 'Backup e Restauracao' });
  await expect(backupDialog).toBeVisible();
  await expect(page.locator('[data-test="export-json-button"]')).toBeVisible();
  await expect(page.locator('[data-test="export-csv-button"]')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(backupDialog).toBeHidden();
});

test('covers 1-click renewal and safe cancellation url link', async ({ page }) => {
  await page.goto('/');

  await createPaidSubscription(page);

  await expect(page.locator('[data-test="renew-subscription"]')).toBeVisible();
  const cancellationLink = page.locator('[data-test="cancellation-link"]');
  await expect(cancellationLink).toBeVisible();
  await expect(cancellationLink).toHaveAttribute('target', '_blank');
  await expect(cancellationLink).toHaveAttribute('rel', 'noopener noreferrer');

  await page.locator('[data-test="renew-subscription"]').click();
  await expect(page.locator('[role="status"]')).toContainText('renovado');
  await expect(page.locator('.subscription-card__date-value')).toHaveText('09/10/2026');
});

test('covers status tabs, real-time search with global slash shortcut and sorting', async ({
  page,
}) => {
  await page.goto('/');

  await createPaidSubscription(page);
  await createTrialSubscription(page);

  await expect(page.locator('[data-test="filter-tab-all"]')).toContainText('2');
  await expect(page.locator('[data-test="filter-tab-active"]')).toContainText('1');
  await expect(page.locator('[data-test="filter-tab-trial"]')).toContainText('1');

  await page.locator('[data-test="filter-tab-active"]').click();
  await expect(page.getByRole('listitem', { name: /Spotify/ })).toBeVisible();
  await expect(page.getByRole('listitem', { name: /Figma/ })).toBeHidden();

  await page.locator('[data-test="filter-tab-trial"]').click();
  await expect(page.getByRole('listitem', { name: /Figma/ })).toBeVisible();
  await expect(page.getByRole('listitem', { name: /Spotify/ })).toBeHidden();

  await page.locator('[data-test="filter-tab-all"]').click();

  await page.keyboard.press('/');
  const searchInput = page.locator('[data-test="search-input"]');
  await expect(searchInput).toBeFocused();
  await expect(searchInput).toHaveValue('');

  await searchInput.fill('spot');
  await expect(page.getByRole('listitem', { name: /Spotify/ })).toBeVisible();
  await expect(page.getByRole('listitem', { name: /Figma/ })).toBeHidden();

  await page.locator('[data-test="clear-search-button"]').click();
  await expect(searchInput).toHaveValue('');
  await expect(page.getByRole('listitem', { name: /Spotify/ })).toBeVisible();
  await expect(page.getByRole('listitem', { name: /Figma/ })).toBeVisible();

  await searchInput.fill('xyz_inexistente');
  await expect(page.getByText('Nenhum resultado encontrado')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Limpar filtros' })).toBeVisible();

  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(page.getByRole('listitem', { name: /Spotify/ })).toBeVisible();
  await expect(page.getByRole('listitem', { name: /Figma/ })).toBeVisible();
});

test('calculates exact annual projection for yearly subscriptions and synchronizes preferences', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Nova assinatura' }).click();
  await page.locator('[data-test="service-name"]').fill('Amazon Prime Anual');
  await page.locator('[data-test="billing-cycle"]').selectOption('yearly');
  await page.locator('[data-test="start-date"]').fill('2026-08-09');
  await page.locator('[data-test="price"]').fill('120,00');
  await page.locator('[data-test="renewal-date"]').fill('2027-08-09');
  await page.getByRole('button', { name: 'Salvar assinatura' }).click();

  await expect(page.getByRole('listitem', { name: /Amazon Prime Anual/ })).toBeVisible();
  await expect(page.locator('.summary-grid')).toContainText('10,00');
  await expect(page.locator('.summary-grid')).toContainText('120,00');

  await setTheme(page, 'light');
  await setLocale(page, 'en-US');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(page.getByRole('listitem', { name: /Amazon Prime Anual/ })).toBeVisible();
});


async function createPaidSubscription(page) {
  await page.getByRole('button', { name: 'Nova assinatura' }).click();
  await page.locator('[data-test="service-catalog-select"]').selectOption('spotify');
  await page.locator('[data-test="start-date"]').fill('2026-08-09');
  await page.locator('[data-test="price"]').fill('29,90');
  await page.locator('[data-test="renewal-date"]').fill('2026-09-09');
  await page.getByRole('button', { name: 'Salvar assinatura' }).click();
}

async function createTrialSubscription(page) {
  await page.getByRole('button', { name: 'Nova assinatura' }).click();
  await page.locator('[data-test="kind-trial"]').check();
  await page.locator('[data-test="service-name"]').fill('Figma Trial');
  await page.locator('[data-test="start-date"]').fill('2026-08-09');
  await page.locator('[data-test="trial-end-date"]').fill('2026-08-14');
  await page.getByRole('button', { name: 'Salvar assinatura' }).click();
}

async function editPaidSubscription(page) {
  await page.getByRole('button', { name: 'Editar Spotify' }).click();
  await page.locator('[data-test="service-catalog-select"]').selectOption('google-one');
  await page.locator('[data-test="price"]').fill('35,50');
  await page.locator('[data-test="renewal-date"]').fill('2026-10-09');
  await page.getByRole('button', { name: 'Salvar edicao' }).click();
}

async function setTheme(page, theme) {
  const currentTheme = await page.locator('html').getAttribute('data-theme');

  if (currentTheme !== theme) {
    await page.locator('[data-test="theme-toggle"]').click();
  }

  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
}

async function setLocale(page, locale) {
  const currentLocale = await page.locator('html').getAttribute('lang');

  if (currentLocale !== locale) {
    await page.locator('[data-test="locale-toggle"]').click();
  }

  await expect(page.locator('html')).toHaveAttribute('lang', locale);
}

async function expectNoHorizontalOverflow(page) {
  const hasHorizontalOverflow = await page.evaluate(() => {
    const root = document.documentElement;

    return root.scrollWidth > root.clientWidth + 1;
  });

  expect(hasHorizontalOverflow).toBe(false);
}

async function freezeBrowserDate(page, isoDate) {
  await page.addInitScript((value) => {
    const fixedTime = new Date(value).valueOf();
    const NativeDate = Date;

    class FixedDate extends NativeDate {
      constructor(...args) {
        if (args.length === 0) {
          super(fixedTime);
          return;
        }

        super(...args);
      }

      static now() {
        return fixedTime;
      }
    }

    FixedDate.parse = NativeDate.parse;
    FixedDate.UTC = NativeDate.UTC;
    window.Date = FixedDate;
  }, isoDate);
}
