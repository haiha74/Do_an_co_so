package com.dacs.fashion.service;

import com.dacs.fashion.dto.CartItemDTO;
import com.dacs.fashion.entity.Cart;
import com.dacs.fashion.entity.CartItem;
import com.dacs.fashion.entity.ProductVariant;
import com.dacs.fashion.entity.User;
import com.dacs.fashion.repository.CartItemRepository;
import com.dacs.fashion.repository.CartRepository;
import com.dacs.fashion.repository.ProductVariantRepository;
import com.dacs.fashion.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository variantRepository;

    public Cart getCartByUser(Long userId) {
        return cartRepository.findByUser_UserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

                    Cart cart = new Cart();
                    cart.setUser(user);
                    return cartRepository.save(cart);
                });
    }

    public List<CartItem> getCartItems(Long userId) {
        Cart cart = getCartByUser(userId);
        return cartItemRepository.findByCart_CartId(cart.getCartId());
    }

    public CartItem addItem(Long userId, CartItemDTO dto) {
        Cart cart = getCartByUser(userId);

        ProductVariant variant = variantRepository.findById(dto.getVariantId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy biến thể sản phẩm"));

        CartItem item = new CartItem();
        item.setCart(cart);
        item.setVariant(variant);
        item.setQuantity(dto.getQuantity());

        return cartItemRepository.save(item);
    }

    public CartItem updateItem(Long cartItemId, CartItemDTO dto) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm trong giỏ"));

        item.setQuantity(dto.getQuantity());

        return cartItemRepository.save(item);
    }

    public void deleteItem(Long cartItemId) {
        cartItemRepository.deleteById(cartItemId);
    }

    public void clearCart(Long userId) {
        Cart cart = getCartByUser(userId);
        List<CartItem> items = cartItemRepository.findByCart_CartId(cart.getCartId());
        cartItemRepository.deleteAll(items);
    }
}