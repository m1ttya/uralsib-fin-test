import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the initial page
        await page.goto("http://localhost:5176/uralsib-fin-test/")

        # Take a screenshot of the initial page load
        await page.screenshot(path="jules-scratch/verification/01-initial-load-fix-attempt.png")

        # Check if the "Начать" button is visible and click it
        start_button = page.locator('button:has-text("Пройти тест")')
        await expect(start_button).to_be_visible()
        await start_button.click()

        # Take a screenshot after the login modal appears
        await page.screenshot(path="jules-scratch/verification/02-login-modal-visible.png")

        # Verify that the main container has 'overflow-hidden'
        main_container = page.locator('div.min-h-screen.w-full.bg-gray-900.text-white.h-screen.overflow-hidden')
        await expect(main_container).to_have_count(1)
        print("Verification successful: Background scrolling is disabled when the login modal is open.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
