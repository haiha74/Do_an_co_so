package com.dacs.fashion.selenium;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

import static org.junit.jupiter.api.Assertions.*;

class LoginSeleniumTest extends BaseSeleniumTest {

    @Test
    void login_WithValidAccount_ShouldShowUserInfo() {
        open("/auth");
        WebElement emailInput = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("loginEmail"))
        );
        WebElement passwordInput = driver.findElement(By.id("loginPassword"));
        emailInput.sendKeys(EMAIL);
        passwordInput.sendKeys(PASSWORD);
        driver.findElement(By.xpath("//button[contains(text(),'Đăng nhập')]")).click();
        WebElement helloText = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("//*[contains(text(),'Xin chào')]")
                )
        );
        takeScreenshot("login-success");
        assertTrue(helloText.getText().contains("Xin chào"));
    }
    @Test
    void login_WithInvalidAccount_ShouldShowErrorMessage() {
        open("/auth");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("loginEmail")))
                .sendKeys("wrong@gmail.com");

        driver.findElement(By.id("loginPassword")).sendKeys("wrongpass");
        driver.findElement(By.xpath("//button[contains(text(),'Đăng nhập')]")).click();
        WebElement message = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("authMsg"))
        );
        takeScreenshot("login-failed");
        assertFalse(message.getText().isBlank());
    }
}
