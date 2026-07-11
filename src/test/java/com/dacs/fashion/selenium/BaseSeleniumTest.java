package com.dacs.fashion.selenium;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestInfo;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

public abstract class BaseSeleniumTest {

    protected WebDriver driver;
    protected WebDriverWait wait;
    protected final String BASE_URL = System.getProperty("baseUrl", "http://localhost:8080");
    protected final String EMAIL = System.getProperty("test.email", "eniuu127@gmail.com");
    protected final String PASSWORD = System.getProperty("test.password", "123456");
    private String testName;
    private int screenshotIndex = 1;
    private static final int MIN_DELAY_SECONDS = 2;

    @BeforeEach
    void setUp(TestInfo testInfo) {
        this.testName = testInfo.getTestMethod()
                .map(method -> method.getName())
                .orElse("selenium-test");
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--start-maximized");
        options.addArguments("--remote-allow-origins=*");
        options.addArguments("--force-device-scale-factor=0.9");
        options.addArguments("--high-dpi-support=0.9");
        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, Duration.ofSeconds(20));
        waitForPageLoad();
        takeScreenshot("start");
    }
    @AfterEach
    void tearDown() {
        if (driver != null) {
            takeScreenshot("end");
            pause(2);
            driver.quit();
        }
    }
    protected void open(String path) {
        driver.get(BASE_URL + path);
        waitForPageLoad();
        takeScreenshot("open-" + cleanFileName(path));
    }
    protected WebElement byId(String id) {
        WebElement element = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id(id)));
        waitForPageLoad();
        takeScreenshot("find-id-" + id);
        return element;
    }
    protected WebElement clickable(By locator) {
        WebElement element = wait.until(ExpectedConditions.elementToBeClickable(locator));
        return element;
    }
    protected void clickByText(String tag, String text) {
        By locator = By.xpath("//" + tag + "[contains(normalize-space(), '" + text + "')]");
        WebElement element = clickable(locator);

        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({block: 'center'});", element
        );
        element.click();
        waitForPageLoad();
        takeScreenshot("click-" + cleanFileName(text));
    }
    protected boolean pageContains(String text) {
        boolean result = wait.until(d -> d.getPageSource().contains(text));
        takeScreenshot("check-" + cleanFileName(text));
        return result;
    }
    protected void loginAsUser() {
        open("/auth");
        byId("loginEmail").clear();
        byId("loginEmail").sendKeys(EMAIL);
        byId("loginPassword").clear();
        byId("loginPassword").sendKeys(PASSWORD);
        takeScreenshot("before-login");
        clickByText("button", "Đăng nhập");
        wait.until(d -> ((JavascriptExecutor) d).executeScript("return localStorage.getItem('ha_user')") != null);
        wait.until(ExpectedConditions.or(
                ExpectedConditions.urlContains("/auth"),
                ExpectedConditions.textToBePresentInElementLocated(By.tagName("body"), "Xin chào")
        ));
        waitForPageLoad();
        takeScreenshot("login-success");
    }
    protected void logoutByLocalStorage() {
        driver.get(BASE_URL + "/");
        ((JavascriptExecutor) driver).executeScript(
                "localStorage.removeItem('ha_user'); localStorage.removeItem('ha_cart');");
        waitForPageLoad();
        takeScreenshot("logout");
    }
    protected List<WebElement> findAll(By locator) {
        return driver.findElements(locator);
    }
    protected void pause(int seconds) {
        try {
            Thread.sleep(Math.max(seconds, MIN_DELAY_SECONDS) * 1000L);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
    protected void waitForPageLoad() {
        try {
            wait.until(d -> ((JavascriptExecutor) d)
                    .executeScript("return document.readyState").equals("complete"));
        } catch (Exception e) {
            System.out.println("Cảnh báo: Không thể đợi trang load: " + e.getMessage());
        }
    }
    protected void takeScreenshot(String stepName) {
        try {
            waitForPageLoad();    
            Thread.sleep(500);
            File screenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
            Path folder = Path.of("target", "selenium-screenshots");
            Files.createDirectories(folder);
            String time = LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
            String fileName = String.format(
                    "%02d-%s-%s-%s.png",
                    screenshotIndex++,
                    cleanFileName(testName),
                    cleanFileName(stepName),
                    time
            );
            Files.copy(
                    screenshot.toPath(),
                    folder.resolve(fileName)
            );

        } catch (Exception e) {
            System.out.println("Không thể chụp màn hình: " + e.getMessage());
        }
    }
    private String cleanFileName(String value) {
        if (value == null || value.isBlank()) {
            return "empty";
        }
        return value
                .replaceAll("[^a-zA-Z0-9-_]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}