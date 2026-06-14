import os

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.ui import WebDriverWait

SELENIUM_URL = os.getenv("SELENIUM_URL", "http://localhost:4444/wd/hub")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

pytestmark = pytest.mark.skipif(
    not os.getenv("CI"),
    reason="E2E tests only run in CI with selenium service",
)

CREATE_BTN = (By.XPATH, "//button[text()='Create Event']")


@pytest.fixture
def driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Remote(command_executor=SELENIUM_URL, options=options)
    yield driver
    driver.quit()


def fill_mui_field(driver, label_text, value):
    xpath = (
        f"//label[contains(text(), '{label_text}')]"
        f"/ancestor::div[contains(@class, 'MuiFormControl-root')]"
        f"//input | //textarea"
    )
    elem = WebDriverWait(driver, 10).until(
        expected_conditions.presence_of_element_located((By.XPATH, xpath))
    )
    elem.clear()
    elem.send_keys(value)


class TestE2E:
    def test_homepage_loads(self, driver):
        driver.get(FRONTEND_URL)
        WebDriverWait(driver, 10).until(
            expected_conditions.presence_of_element_located((By.TAG_NAME, "h5"))
        )

    def test_create_and_view_event(self, driver):
        driver.get(f"{FRONTEND_URL}/new")
        WebDriverWait(driver, 10).until(
            expected_conditions.presence_of_element_located(CREATE_BTN)
        )

        fill_mui_field(driver, "Name", "CI E2E Event")
        fill_mui_field(driver, "Description", "Created by Selenium in CI")
        fill_mui_field(driver, "Date", "2026-12-31")
        fill_mui_field(driver, "Max Capacity", "50")

        driver.find_element(*CREATE_BTN).click()
        WebDriverWait(driver, 10).until(
            expected_conditions.presence_of_element_located(
                (By.XPATH, "//*[text()='CI E2E Event']")
            )
        )
        assert "CI E2E Event" in driver.page_source
        assert "Created by Selenium in CI" in driver.page_source

    def test_register_flow(self, driver):
        driver.get(f"{FRONTEND_URL}/new")
        WebDriverWait(driver, 10).until(
            expected_conditions.presence_of_element_located(CREATE_BTN)
        )

        fill_mui_field(driver, "Name", "Register Test Event")
        fill_mui_field(driver, "Description", "Test registration flow")
        fill_mui_field(driver, "Date", "2026-12-25")
        fill_mui_field(driver, "Max Capacity", "10")

        driver.find_element(*CREATE_BTN).click()
        WebDriverWait(driver, 10).until(
            expected_conditions.presence_of_element_located(
                (By.XPATH, "//h5[text()='Register']")
            )
        )

        fill_mui_field(driver, "Name", "Alice")
        fill_mui_field(driver, "Email", "alice@e2e.test")

        driver.find_element(By.XPATH, "//button[text()='Register']").click()

        WebDriverWait(driver, 10).until(
            expected_conditions.presence_of_element_located(
                (By.XPATH, "//*[contains(text(), 'Successfully registered')]")
            )
        )
