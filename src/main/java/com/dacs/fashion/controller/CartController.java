package com.dacs.fashion.controller;

import com.dacs.fashion.dto.CartItemDTO;
import com.dacs.fashion.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import com.dacs.fashion.entity.User;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping("/{userId}")
    public ResponseEntity<?> getCart(@PathVariable Long userId, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();

        if (!currentUser.getUserId().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("message", "Không có quyền xem giỏ hàng này"));
        }

        return ResponseEntity.ok(cartService.getCart(userId));
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@RequestBody CartItemDTO dto, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        dto.setUserId(currentUser.getUserId());
        try {
            return ResponseEntity.ok(cartService.addToCart(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<?> updateQuantity(@PathVariable Long itemId,
                                            @RequestParam Integer quantity,
                                            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();

        if (!cartService.isItemOwner(itemId, currentUser.getUserId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Không có quyền sửa item này"));
        }
        try {
            return ResponseEntity.ok(cartService.updateQuantity(itemId, quantity));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<?> removeItem(@PathVariable Long itemId, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();

        if (!cartService.isItemOwner(itemId, currentUser.getUserId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Không có quyền xóa item này"));
        }
        try {
            cartService.removeItem(itemId);
            return ResponseEntity.ok(Map.of("message", "Đã xóa sản phẩm khỏi giỏ hàng"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/clear/{userId}")
    public ResponseEntity<?> clearCart(@PathVariable Long userId, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();

        if (!currentUser.getUserId().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("message", "Không có quyền xóa giỏ hàng này"));
        }
        try {
            cartService.clearCart(userId);
            return ResponseEntity.ok(cartService.getCart(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}