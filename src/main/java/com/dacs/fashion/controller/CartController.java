package com.dacs.fashion.controller;

import com.dacs.fashion.dto.CartItemDTO;
import com.dacs.fashion.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping("/{userId}")
    public ResponseEntity<?> getCart(@PathVariable Long userId) {
        return ResponseEntity.ok(cartService.getCart(userId));
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@RequestBody CartItemDTO dto) {
        try {
            return ResponseEntity.ok(cartService.addToCart(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<?> updateQuantity(@PathVariable Long itemId,
                                            @RequestParam Integer quantity) {
        try {
            return ResponseEntity.ok(cartService.updateQuantity(itemId, quantity));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<?> removeItem(@PathVariable Long itemId) {
        try {
            cartService.removeItem(itemId);
            return ResponseEntity.ok(Map.of("message", "Đã xóa sản phẩm khỏi giỏ hàng"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/clear/{userId}")
    public ResponseEntity<?> clearCart(@PathVariable Long userId) {
        try {
            cartService.clearCart(userId);
            return ResponseEntity.ok(cartService.getCart(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}