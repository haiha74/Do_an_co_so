package com.dacs.fashion.selenium;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class CartSeleniumTest extends BaseSeleniumTest {

    @SuppressWarnings("unchecked")
    private Map<String, Object> findActiveVariantInStock() {
        open("/");
        pause(3);

        Object result = ((JavascriptExecutor) driver).executeAsyncScript("""
            const done = arguments[arguments.length - 1];

            (async () => {
              const products = await fetch('/api/products').then(r => r.json());
              const activeProducts = products.filter(p => p.status === 'ACTIVE');

              for (const p of activeProducts) {
                try {
                  const variants = await fetch('/api/variants/product/' + p.productId).then(r => r.json());

                  const v = variants.find(x =>
                    x.status === 'ACTIVE'
                    && Number(x.stock || 0) > 0
                    && x.size
                    && x.color
                  );

                  if (v) {
                    done({
                      productId: p.productId,
                      productName: p.productName,
                      variantId: v.variantId,
                      size: v.size,
                      color: v.color,
                      stock: v.stock
                    });
                    return;
                  }
                } catch(e) {}
              }

              done(null);
            })().catch(e => done(null));
        """);

        assertNotNull(result,
                "Database cần có ít nhất 1 sản phẩm ACTIVE, biến thể ACTIVE và stock > 0");

        return (Map<String, Object>) result;
    }

    private void scrollTo(WebElement element) {
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({block: 'center'});",
                element
        );
        pause(3);
    }

    private void selectButtonByText(String text) {
        WebElement button = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[normalize-space()='" + text + "']")
        ));

        scrollTo(button);
        button.click();
        pause(3);

        takeScreenshot("selected-" + text);
    }

    private void addActiveProductToCartByUi() {
        Map<String, Object> variant = findActiveVariantInStock();

        loginAsUser();
        pause(3);

        open("/detail?productId=" + variant.get("productId"));
        pause(3);

        wait.until(ExpectedConditions.textToBePresentInElementLocated(
                By.tagName("body"),
                "Kích thước"
        ));

        takeScreenshot("product-detail");

        selectButtonByText(String.valueOf(variant.get("size")));

        wait.until(ExpectedConditions.textToBePresentInElementLocated(
                By.tagName("body"),
                "Màu sắc"
        ));

        selectButtonByText(String.valueOf(variant.get("color")));

        WebElement addButton = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[contains(normalize-space(),'Thêm vào giỏ')]")
        ));

        scrollTo(addButton);
        takeScreenshot("before-add-cart");

        addButton.click();
        pause(3);

        takeScreenshot("after-add-cart");

        open("/cart");
        pause(3);

        wait.until(ExpectedConditions.textToBePresentInElementLocated(
                By.tagName("body"),
                "Giỏ hàng"
        ));

        takeScreenshot("cart-after-add");
    }

    @Test
    void addProductToCart_thenCartPageShowsProduct() {
        addActiveProductToCartByUi();

        assertTrue(
                driver.getPageSource().contains("Giỏ hàng"),
                "Phải mở được trang giỏ hàng"
        );

        assertFalse(
                driver.getPageSource().contains("Giỏ hàng đang trống"),
                "Sau khi thêm sản phẩm, giỏ hàng không được rỗng"
        );

        assertFalse(
                driver.findElements(By.xpath("//button[normalize-space()='Xóa']")).isEmpty(),
                "Giỏ hàng phải hiển thị nút Xóa sản phẩm"
        );

        takeScreenshot("cart-test-success");
        pause(3);
    }

    @Test
    void removeProductFromCart_shouldUpdateCartUi() {
        addActiveProductToCartByUi();

        wait.until(ExpectedConditions.textToBePresentInElementLocated(
                By.tagName("body"),
                "Giỏ hàng"
        ));

        List<WebElement> removeButtons = wait.until(
                d -> d.findElements(By.xpath("//button[normalize-space()='Xóa']"))
        );

        assertFalse(removeButtons.isEmpty(), "Giỏ hàng phải có sản phẩm để xóa");

        scrollTo(removeButtons.get(0));
        takeScreenshot("before-remove-cart-item");

        removeButtons.get(0).click();
        pause(3);

        clickable(By.id("okConfirm")).click();
        pause(3);

        takeScreenshot("after-remove-cart-item");

        assertTrue(
                driver.getPageSource().contains("Giỏ hàng"),
                "Sau khi xóa vẫn phải ở trang giỏ hàng"
        );

        pause(3);
    }
}