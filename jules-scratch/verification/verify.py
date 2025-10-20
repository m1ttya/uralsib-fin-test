from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # 1. Landing page
        page.goto("http://localhost:5173/")
        page.screenshot(path="jules-scratch/verification/01-landing-page.png", full_page=True)

        # 2. Login modal
        page.get_by_role("button", name="Пройти тест").click()
        page.wait_for_selector('text=Вход в Уралсиб')
        page.screenshot(path="jules-scratch/verification/02-login-modal.png", full_page=True)

        # 3. Test flow
        page.get_by_role("button", name="Пропустить").click()
        page.screenshot(path="jules-scratch/verification/03-test-flow.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    run()
