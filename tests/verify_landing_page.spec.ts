import { test, expect } from 'playwright/test';

test.describe('Landing Page Verification', () => {
  test('should load the landing page, allow interaction, and verify modal logic', async ({ page }) => {
    // 1. Переход на страницу
    // Используем полный URL, который Vite предоставляет, включая базовый путь
    await page.goto('http://localhost:5174/uralsib-fin-test/', { waitUntil: 'networkidle' });

    // Добавляем логи для отладки
    console.log('Page loaded.');

    // Сохраняем HTML для анализа
    const htmlContent = await page.content();
    // console.log('HTML Content:', htmlContent); // Можно раскомментировать для детального просмотра HTML

    // Сохраняем скриншот для визуальной проверки
    await page.screenshot({ path: 'tests/screenshots/01_page_load.png' });
    console.log('Initial screenshot captured.');

    // 2. Проверка основного заголовка
    const heading = page.locator('h1', { hasText: 'Проверьте свою финансовую грамотность' });
    await expect(heading).toBeVisible({ timeout: 15000 }); // Увеличиваем таймаут
    console.log('Heading is visible.');

    // 3. Поиск и клик по кнопке "Пройти тест"
    const startButton = page.locator('button:has-text("Пройти тест")');
    await expect(startButton).toBeVisible({ timeout: 10000 }); // Увеличиваем таймаут для кнопки
    await expect(startButton).toBeEnabled();
    console.log('Start button is visible and enabled.');

    await startButton.click();
    console.log('Start button clicked.');

    // 4. Проверка появления модального окна
    await page.screenshot({ path: 'tests/screenshots/02_modal_open.png' });

    const modal = page.locator('[style*="background-color: rgb(37, 32, 48)"]'); // Локатор для модального окна по стилю
    await expect(modal).toBeVisible();

    const modalTitle = modal.locator('h2', { hasText: 'Вход в Уралсиб' });
    await expect(modalTitle).toBeVisible();
    console.log('Modal is visible.');

    // 5. Проверка наличия кнопок в модальном окне
    const loginButton = modal.locator('button:has-text("Войти")');
    const skipButton = modal.locator('button:has-text("Пропустить")');

    await expect(loginButton).toBeVisible();
    await expect(skipButton).toBeVisible();
    console.log('Modal buttons are visible.');

    // 6. Клик по кнопке "Пропустить"
    await skipButton.click();
    console.log('Skip button clicked.');

    // 7. Проверка, что модальное окно исчезло и мы перешли к тесту
    await page.screenshot({ path: 'tests/screenshots/03_test_flow.png' });
    await expect(modal).not.toBeVisible();

    const testFlowTitle = page.locator('h3', { hasText: 'Выберите категорию' });
    await expect(testFlowTitle).toBeVisible();
    console.log('Successfully navigated to the test flow.');
  });
});
