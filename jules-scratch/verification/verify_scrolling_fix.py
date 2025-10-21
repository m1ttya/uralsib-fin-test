
from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    # Corrected URL with base path
    page.goto("http://localhost:5173/uralsib-fin-test/")

    # Screenshot right after loading to debug
    page.screenshot(path="jules-scratch/verification/00-initial-load.png")

    # 1. Landing Page
    start_button = page.get_by_role("button", name="Начать")
    expect(start_button).to_be_visible(timeout=20000) # Increased timeout
    page.screenshot(path="jules-scratch/verification/01-landing-page.png")
    start_button.click()

    # 2. Login Modal
    continue_button = page.get_by_role("button", name="Продолжить")
    expect(continue_button).to_be_visible()

    # **Verification of the fix**: Check if the main container has overflow: hidden
    main_container = page.locator("div.h-screen.overflow-hidden")
    expect(main_container).to_have_count(1, timeout=5000)

    page.screenshot(path="jules-scratch/verification/02-login-modal.png")
    continue_button.click()

    # 3. Test Flow
    # Wait for the question text to be visible
    question_text = page.locator("p.text-2xl.font-bold.text-gray-800")
    expect(question_text).to_be_visible()
    page.screenshot(path="jules-scratch/verification/03-test-flow.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
