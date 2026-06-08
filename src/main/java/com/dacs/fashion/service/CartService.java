package com.dacs.fashion.service;

import com.dacs.fashion.dto.CartItemDTO;
import com.dacs.fashion.entity.*;
import com.dacs.fashion.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository variantRepository;

    public Cart getCart(Long userId) {
        return cartRepository.findByUser_UserId(userId)
                .orElseGet(() -> createCart(userId));
    }

    public boolean isItemOwner(Long itemId, Long userId) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy item"));

        return item.getCart().getUser().getUserId().equals(userId);
    }

    private Cart createCart(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        Cart cart = new Cart();
        cart.setUser(user);
        return cartRepository.save(cart);
    }

    @Transactional
    public Cart addToCart(CartItemDTO dto) {
        Cart cart = getCart(dto.getUserId());

        ProductVariant variant = variantRepository.findById(dto.getVariantId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy variant"));

        int qty = dto.getQuantity() == null ? 1 : dto.getQuantity();

        if (qty <= 0) {
            throw new RuntimeException("Số lượng không hợp lệ");
        }

        if (!"ACTIVE".equalsIgnoreCase(variant.getStatus())) {
            throw new RuntimeException("Variant inactive");
        }

        if (variant.getStock() == null || variant.getStock() < qty) {
            throw new RuntimeException("Không đủ tồn kho");
        }

        CartItem item = cartItemRepository.findByCartAndVariant(cart, variant).orElse(null);

        if (item == null) {
            item = new CartItem();
            item.setCart(cart);
            item.setVariant(variant);
            item.setQuantity(qty);
        } else {
            int newQty = item.getQuantity() + qty;

            if (newQty > variant.getStock()) {
                throw new RuntimeException("Vượt quá tồn kho");
            }

            item.setQuantity(newQty);
        }

        cartItemRepository.save(item);
        return getCart(dto.getUserId());
    }

    @Transactional
    public Cart updateQuantity(Long itemId, Integer quantity) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy item"));

        Long userId = item.getCart().getUser().getUserId();

        if (quantity == null || quantity <= 0) {
            cartItemRepository.delete(item);
            cartItemRepository.flush();
            return getCart(userId);
        }

        ProductVariant variant = item.getVariant();

        if (quantity > variant.getStock()) {
            throw new RuntimeException("Vượt tồn kho");
        }

        item.setQuantity(quantity);
        cartItemRepository.save(item);

        return getCart(userId);
    }

    @Transactional
    public void removeItem(Long itemId) {
        if (itemId == null) {
            throw new RuntimeException("Thiếu itemId");
        }

        if (!cartItemRepository.existsById(itemId)) {
            throw new RuntimeException("Không tìm thấy item trong giỏ");
        }

        cartItemRepository.deleteCartItemByIdNative(itemId);
    }

    @Transactional
    public void clearCart(Long userId) {
        Cart cart = getCart(userId);

        for (CartItem item : cart.getItems()) {
            cartItemRepository.deleteById(item.getCartItemId());
        }

        cartItemRepository.flush();
    }
}