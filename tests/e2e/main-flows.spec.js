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
  await expect(page.getByRole('button', { name: 'Nova assinatura' })).toBeEnabled();
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

  await expect(page.getByRole('listitem', { name: /Google One Arquivada/ })).toBeVisible();
  await expect(page.locator('.summary-grid')).toContainText('0,00');

  await page.reload();

  await expect(page.getByRole('list', { name: '2 assinaturas carregadas' })).toBeVisible();
  await expect(page.getByRole('listitem', { name: /Google One Arquivada/ })).toBeVisible();
  await expect(page.getByRole('listitem', { name: /Figma Trial Trial/ })).toBeVisible();
  await expect(page.getByText('1 trial perto do vencimento')).toBeVisible();
  await expect(page.locator('.summary-grid')).toContainText('0,00');
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
