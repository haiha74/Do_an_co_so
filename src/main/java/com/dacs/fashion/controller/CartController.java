package com.dacs.fashion.controller;

import com.dacs.fashion.dto.CartItemDTO;
import com.dacs.fashion.entity.Cart;
import com.dacs.fashion.entity.CartItem;
import com.dacs.fashion.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carts")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping("/user/{userId}")
    public Cart getCartByUser(@PathVariable Long userId) {
        return cartService.getCartByUser(userId);
    }

    @GetMapping("/user/{userId}/items")
    public List<CartItem> getCartItems(@PathVariable Long userId) {
        return cartService.getCartItems(userId);
    }

    @PostMapping("/user/{userId}/items")
    public CartItem addItem(@PathVariable Long userId, @RequestBody CartItemDTO dto) {
        return cartService.addItem(userId, dto);
    }

    @PutMapping("/items/{cartItemId}")
    public CartItem updateItem(@PathVariable Long cartItemId, @RequestBody CartItemDTO dto) {
        return cartService.updateItem(cartItemId, dto);
    }

    @DeleteMapping("/items/{cartItemId}")
    public String deleteItem(@PathVariable Long cartItemId) {
        cartService.deleteItem(cartItemId);
        return "Xóa sản phẩm khỏi giỏ hàng thành công";
    }

    @DeleteMapping("/user/{userId}/clear")
    public String clearCart(@PathVariable Long userId) {
        cartService.clearCart(userId);
        return "Xóa toàn bộ giỏ hàng thành công";
    }
}