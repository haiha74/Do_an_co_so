package com.dacs.fashion.selenium;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.openqa.selenium.By;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

class LoginSeleniumTest {

    private WebDriver driver;
    private WebDriverWait wait;

    private final String BASE_URL = "http://localhost:8080";

    @BeforeEach
    void setUp() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--start-maximized");

        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    @AfterEach
    void tearDown() throws InterruptedException {
        Thread.sleep(5000);

        if (driver != null) {
            driver.quit();
        }
    }

    private void takeScreenshot(String fileName) {
        try {
            File screenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);

            Path folder = Path.of("target/selenium-screenshots");
            Files.createDirectories(folder);

            Files.copy(
                    screenshot.toPath(),
                    folder.resolve(fileName)
            );
        } catch (Exception e) {
            System.out.println("Không thể chụp ảnh: " + e.getMessage());
        }
    }

    @Test
    void login_WithValidAccount_ShouldShowUserInfo() {
        driver.get(BASE_URL + "/auth");

        WebElement emailInput = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("loginEmail"))
        );

        WebElement passwordInput = driver.findElement(By.id("loginPassword"));

        emailInput.sendKeys("eniuu127@gmail.com");
        passwordInput.sendKeys("123456");

        driver.findElement(By.xpath("//button[contains(text(),'Đăng nhập')]")).click();

        WebElement helloText = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("//*[contains(text(),'Xin chào')]")
                )
        );

        takeScreenshot("login-success.png");

        assertTrue(helloText.getText().contains("Xin chào"));
    }

    @Test
    void login_WithInvalidAccount_ShouldShowErrorMessage() {
        driver.get(BASE_URL + "/auth");

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("loginEmail")))
                .sendKeys("wrong@gmail.com");

        driver.findElement(By.id("loginPassword")).sendKeys("wrongpass");

        driver.findElement(By.xpath("//button[contains(text(),'Đăng nhập')]")).click();

        WebElement message = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("authMsg"))
        );

        takeScreenshot("login-failed.png");

        assertFalse(message.getText().isBlank());
    }
}