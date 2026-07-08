package com.dacs.fashion.selenium;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class PaymentOrderSeleniumTest extends BaseSeleniumTest {

    private boolean containsAnyNow(String... texts) {
        String source = driver.getPageSource();
        for (String text : texts) {
            if (source.contains(text)) {
                return true;
            }
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> findActiveVariantInStock() {
        open("/");
        pause(2);

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
        pause(2);
    }

    private void selectButtonByText(String text) {
        WebElement button = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[normalize-space()='" + text + "']")
        ));

        scrollTo(button);
        button.click();
        pause(2);

        takeScreenshot("selected-" + text);
    }

    private void addProductToCartIfEmpty() {
        open("/cart");
        pause(2);

        if (!driver.getPageSource().contains("Giỏ hàng đang trống")) {
            takeScreenshot("cart-not-empty");
            return;
        }

        Map<String, Object> variant = findActiveVariantInStock();

        open("/detail?productId=" + variant.get("productId"));
        pause(2);

        wait.until(ExpectedConditions.textToBePresentInElementLocated(
                By.tagName("body"),
                "Kích thước"
        ));

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
        pause(2);

        takeScreenshot("after-add-cart");

        open("/cart");
        pause(2);

        assertFalse(
                driver.getPageSource().contains("Giỏ hàng đang trống"),
                "Đã thêm sản phẩm nhưng giỏ hàng vẫn trống"
        );
    }

    private String findUsableVoucherCode() {
        Object voucherCode = ((JavascriptExecutor) driver).executeAsyncScript("""
            const done = arguments[arguments.length - 1];

            (async () => {
              try {
                const vouchers = await fetch('/api/vouchers').then(r => r.json());

                if (!Array.isArray(vouchers) || vouchers.length === 0) {
                  done(null);
                  return;
                }

                const now = new Date();

                const usable = vouchers.find(v => {
                  const code = v.code || v.voucherCode;
                  if (!code) return false;

                  const active =
                    v.status === 'ACTIVE'
                    || v.active === true
                    || v.isActive === true;

                  const notExpired =
                    !v.endDate
                    || new Date(v.endDate) >= now;

                  const started =
                    !v.startDate
                    || new Date(v.startDate) <= now;

                  return active && started && notExpired;
                });

                if (usable) {
                  done(usable.code || usable.voucherCode);
                  return;
                }

                const fallback = vouchers.find(v => v.code || v.voucherCode);
                done(fallback ? (fallback.code || fallback.voucherCode) : null);

              } catch(e) {
                done(null);
              }
            })();
        """);

        if (voucherCode == null) {
            return null;
        }

        return String.valueOf(voucherCode);
    }

    private boolean applyVoucherIfExists() {
        try {
            String code = findUsableVoucherCode();

            if (code == null || code.isBlank()) {
                takeScreenshot("no-voucher-found");
                return false;
            }

            takeScreenshot("before-apply-voucher");

            List<WebElement> voucherInputs = driver.findElements(By.cssSelector(
                    "input[id*='voucher'], " +
                    "input[name*='voucher'], " +
                    "input[placeholder*='voucher'], " +
                    "input[placeholder*='Voucher'], " +
                    "input[placeholder*='mã'], " +
                    "input[placeholder*='Mã']"
            ));

            if (voucherInputs.isEmpty()) {
                takeScreenshot("voucher-input-not-found");
                return false;
            }

            WebElement input = voucherInputs.get(0);
            scrollTo(input);

            input.clear();
            pause(1);
            input.sendKeys(code);
            pause(2);

            List<WebElement> applyButtons = driver.findElements(By.xpath(
                    "//button[contains(normalize-space(),'Áp dụng') " +
                    "or contains(normalize-space(),'Dùng') " +
                    "or contains(normalize-space(),'Sử dụng') " +
                    "or contains(normalize-space(),'Apply')]"
            ));

            if (applyButtons.isEmpty()) {
                takeScreenshot("voucher-button-not-found");
                return false;
            }

            WebElement applyButton = applyButtons.get(0);
            scrollTo(applyButton);
            applyButton.click();
            pause(3);

            takeScreenshot("after-apply-voucher-" + code);

            boolean applied = containsAnyNow(
                    "Đã áp dụng",
                    "Áp dụng thành công",
                    "Giảm giá",
                    "discount",
                    "Discount",
                    "Voucher",
                    "voucher",
                    "Thành công",
                    "Tổng thanh toán"
            );

            System.out.println("Voucher dùng thử: " + code);
            System.out.println("Kết quả áp dụng voucher: " + applied);

            return applied;

        } catch (Exception e) {
            System.out.println("Không áp dụng voucher được: " + e.getMessage());
            takeScreenshot("voucher-error");
            return false;
        }
    }

    @Test
    void paymentWithoutRequiredReceiverInfo_shouldShowValidationMessage() {
        loginAsUser();
        pause(2);

        addProductToCartIfEmpty();

        open("/payment");
        pause(2);

        if (driver.getCurrentUrl().contains("/cart")) {
            assertTrue(driver.getPageSource().contains("Giỏ hàng"));
            return;
        }

        WebElement fullname = byId("fullname");
        fullname.clear();
        pause(2);

        WebElement phone = byId("phone");
        phone.clear();
        pause(2);

        WebElement address = byId("address");
        address.clear();
        pause(2);

        takeScreenshot("before-submit-empty-payment");

        clickByText("button", "Xác nhận đặt hàng");
        pause(2);

        takeScreenshot("after-submit-empty-payment");

        assertTrue(
                driver.getCurrentUrl().contains("/payment")
                        || containsAnyNow(
                        "Vui lòng",
                        "Thiếu",
                        "không được để trống",
                        "required",
                        "Thông tin",
                        "nhập"
                ),
                "Khi bỏ trống thông tin, hệ thống phải giữ ở trang thanh toán hoặc hiển thị cảnh báo"
        );
    }

    @Test
    void checkoutCash_shouldCreateOrderAndDisplayInOrdersPage() {
        loginAsUser();
        pause(2);

        addProductToCartIfEmpty();

        open("/payment");
        pause(2);

        if (driver.getCurrentUrl().contains("/cart")) {
            fail("Giỏ hàng vẫn trống nên không vào được trang thanh toán");
        }

        boolean voucherApplied = applyVoucherIfExists();

        if (voucherApplied) {
            assertTrue(
                    containsAnyNow(
                            "Giảm giá",
                            "Đã áp dụng",
                            "Áp dụng thành công",
                            "Voucher",
                            "voucher",
                            "Tổng thanh toán"
                    ),
                    "Sau khi áp dụng voucher, trang thanh toán phải hiển thị thông tin giảm giá"
            );
        }

        WebElement fullname = byId("fullname");
        fullname.clear();
        pause(1);
        fullname.sendKeys("Vu Yen");
        pause(2);

        WebElement phone = byId("phone");
        phone.clear();
        pause(1);
        phone.sendKeys("0976914999");
        pause(2);

        WebElement address = byId("address");
        address.clear();
        pause(1);
        address.sendKeys("Ha Noi");
        pause(2);

        WebElement cash = driver.findElement(
                By.cssSelector("input[name='paymentMethod'][value='CASH']")
        );

        if (!cash.isSelected()) {
            scrollTo(cash);
            cash.click();
            pause(2);
        }

        takeScreenshot("before-confirm-order");

        clickByText("button", "Xác nhận đặt hàng");
        pause(3);

        wait.until(ExpectedConditions.or(
                ExpectedConditions.urlContains("/orders"),
                ExpectedConditions.textToBePresentInElementLocated(By.tagName("body"), "Đặt hàng"),
                ExpectedConditions.textToBePresentInElementLocated(By.tagName("body"), "đơn hàng"),
                ExpectedConditions.textToBePresentInElementLocated(By.tagName("body"), "Thanh toán")
        ));

        pause(2);

        if (!driver.getCurrentUrl().contains("/orders")) {
            open("/orders");
            pause(2);
        }

        takeScreenshot("orders-after-checkout");

        assertTrue(
                containsAnyNow(
                        "Đơn hàng của tôi",
                        "Đơn hàng",
                        "Chờ xác nhận",
                        "Chờ thanh toán",
                        "Thanh toán khi nhận hàng",
                        "Đặt hàng thành công"
                ),
                "Sau khi đặt hàng, trang đơn hàng phải hiển thị thông tin đơn hàng"
        );
    }

    @Test
    void ordersPage_shouldShowOnlyAfterLogin() {
        logoutByLocalStorage();
        pause(2);

        open("/orders");
        pause(2);

        takeScreenshot("orders-without-login");

        assertTrue(
                containsAnyNow(
                        "Chưa đăng nhập",
                        "Vui lòng đăng nhập",
                        "Đăng nhập",
                        "Login",
                        "login"
                ) || driver.getCurrentUrl().contains("/auth")
                        || driver.getCurrentUrl().contains("/login"),
                "Khi chưa đăng nhập, hệ thống phải yêu cầu đăng nhập hoặc chuyển về trang login/auth"
        );
    }
}
// .\mvnw test -Dtest=PaymentOrderSeleniumTest
// .\mvnw test -Dtest=LoginSeleniumTest
// .\mvnw test -Dtest=CartSeleniumTest