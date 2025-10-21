
import time
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    """
    Navigates through the app states and captures screenshots to verify the layout fix.
    """
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Go to the landing page and take a screenshot
        page.goto("http://localhost:5173/")
        page.wait_for_selector("h1", timeout=10000) # Wait for hero title
        page.screenshot(path="jules-scratch/verification/01-landing-page-fix.png", full_page=True)
        print("Screenshot 1: Landing page captured.")

        # 2. Click the 'Start Test' button to open the login modal
        start_button = page.get_by_role("button", name="Начать")
        expect(start_button).to_be_visible()
        start_button.click()

        # 3. Wait for the modal and take a screenshot
        # The modal itself has a blur backdrop, so we'll wait for an element inside it.
        login_modal_title = page.get_by_role("heading", name="Вход в Уралсиб")
        expect(login_modal_title).to_be_visible(timeout=5000)
        # Add a small delay for animations to complete
        time.sleep(1)
        page.screenshot(path="jules-scratch/verification/02-login-modal-fix.png")
        print("Screenshot 2: Login modal captured. Check for disabled scroll.")

        # 4. Click the 'Skip' button to proceed to the test flow
        skip_button = page.get_by_role("button", name="Пропустить")
        expect(skip_button).to_be_visible()
        skip_button.click()

        # 5. Wait for the test flow view and take a screenshot
        test_flow_question = page.locator("p.text-2xl") # Locator for the question text
        expect(test_flow_question).to_be_visible(timeout=5000)
        # Add a small delay for content to render
        time.sleep(1)
        page.screenshot(path="jules-scratch/verification/03-test-flow-fix.png")
        print("Screenshot 3: Test flow captured.")

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)

print("Verification script finished.")
