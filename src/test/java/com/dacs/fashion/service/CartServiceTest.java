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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductVariantRepository variantRepository;

    @InjectMocks
    private CartService cartService;

    private User user;
    private Cart cart;
    private ProductVariant variant;
    private CartItem item;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setUserId(1L);
        user.setFullname("Tester");

        cart = new Cart();
        cart.setCartId(1L);
        cart.setUser(user);
        cart.setItems(new ArrayList<>());

        variant = new ProductVariant();
        variant.setVariantId(10L);
        variant.setSku("SKU-001");
        variant.setStatus("ACTIVE");
        variant.setStock(20);

        item = new CartItem();
        item.setCartItemId(100L);
        item.setCart(cart);
        item.setVariant(variant);
        item.setQuantity(2);
    }

    @Test
    void getCart_WhenCartExists_ShouldReturnCart() {
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));

        Cart result = cartService.getCart(1L);

        assertEquals(1L, result.getCartId());
        verify(cartRepository).findByUser_UserId(1L);
        verify(userRepository, never()).findById(any());
    }

    @Test
    void getCart_WhenCartNotExists_ShouldCreateCart() {
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        Cart result = cartService.getCart(1L);

        assertNotNull(result);
        assertEquals(user, result.getUser());
        verify(cartRepository).save(any(Cart.class));
    }

    @Test
    void addToCart_WithValidNewItem_ShouldSaveItem() {
        CartItemDTO dto = new CartItemDTO(1L, 10L, 3);

        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));
        when(variantRepository.findById(10L)).thenReturn(Optional.of(variant));
        when(cartItemRepository.findByCartAndVariant(cart, variant)).thenReturn(Optional.empty());

        Cart result = cartService.addToCart(dto);

        assertNotNull(result);
        verify(cartItemRepository).save(any(CartItem.class));
    }

    @Test
    void addToCart_WithExistingItem_ShouldIncreaseQuantity() {
        CartItemDTO dto = new CartItemDTO(1L, 10L, 3);

        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));
        when(variantRepository.findById(10L)).thenReturn(Optional.of(variant));
        when(cartItemRepository.findByCartAndVariant(cart, variant)).thenReturn(Optional.of(item));

        cartService.addToCart(dto);

        assertEquals(5, item.getQuantity());
        verify(cartItemRepository).save(item);
    }

    @Test
    void addToCart_WithQuantityZero_ShouldThrowException() {
        CartItemDTO dto = new CartItemDTO(1L, 10L, 0);

        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));
        when(variantRepository.findById(10L)).thenReturn(Optional.of(variant));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> cartService.addToCart(dto));

        assertEquals("Số lượng không hợp lệ", ex.getMessage());
        verify(cartItemRepository, never()).save(any());
    }

    @Test
    void addToCart_WithInactiveVariant_ShouldThrowException() {
        variant.setStatus("INACTIVE");

        CartItemDTO dto = new CartItemDTO(1L, 10L, 1);

        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));
        when(variantRepository.findById(10L)).thenReturn(Optional.of(variant));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> cartService.addToCart(dto));

        assertEquals("Variant inactive", ex.getMessage());
    }

    @Test
    void addToCart_WithOverStock_ShouldThrowException() {
        CartItemDTO dto = new CartItemDTO(1L, 10L, 30);

        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));
        when(variantRepository.findById(10L)).thenReturn(Optional.of(variant));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> cartService.addToCart(dto));

        assertEquals("Không đủ tồn kho", ex.getMessage());
    }

    @Test
    void updateQuantity_WithValidQuantity_ShouldUpdateItem() {
        when(cartItemRepository.findById(100L)).thenReturn(Optional.of(item));
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));

        Cart result = cartService.updateQuantity(100L, 5);

        assertNotNull(result);
        assertEquals(5, item.getQuantity());
        verify(cartItemRepository).save(item);
    }

    @Test
    void updateQuantity_WithZero_ShouldDeleteItem() {
        when(cartItemRepository.findById(100L)).thenReturn(Optional.of(item));
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));

        cartService.updateQuantity(100L, 0);

        verify(cartItemRepository).delete(item);
        verify(cartItemRepository).flush();
    }

    @Test
    void removeItem_WhenItemExists_ShouldDeleteNative() {
        when(cartItemRepository.existsById(100L)).thenReturn(true);

        cartService.removeItem(100L);

        verify(cartItemRepository).deleteCartItemByIdNative(100L);
    }

    @Test
    void removeItem_WhenItemIdNull_ShouldThrowException() {
        RuntimeException ex = assertThrows(RuntimeException.class, () -> cartService.removeItem(null));

        assertEquals("Thiếu itemId", ex.getMessage());
    }
    @Test
    void getCart_WhenUserNotFound_ShouldThrowException() {
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> cartService.getCart(1L));

        assertEquals("Không tìm thấy user", ex.getMessage());
        verify(cartRepository, never()).save(any());
    }

    @Test
    void addToCart_WhenVariantNotFound_ShouldThrowException() {
        CartItemDTO dto = new CartItemDTO(1L, 99L, 1);

        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));
        when(variantRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> cartService.addToCart(dto));

        assertEquals("Không tìm thấy variant", ex.getMessage());
        verify(cartItemRepository, never()).save(any());
    }

    @Test
    void addToCart_WithExistingItemOverStock_ShouldThrowException() {
        CartItemDTO dto = new CartItemDTO(1L, 10L, 19);

        item.setQuantity(2);
        variant.setStock(20);

        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));
        when(variantRepository.findById(10L)).thenReturn(Optional.of(variant));
        when(cartItemRepository.findByCartAndVariant(cart, variant)).thenReturn(Optional.of(item));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> cartService.addToCart(dto));

        assertEquals("Vượt quá tồn kho", ex.getMessage());
        verify(cartItemRepository, never()).save(item);
    }

    @Test
    void updateQuantity_WhenItemNotFound_ShouldThrowException() {
        when(cartItemRepository.findById(100L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> cartService.updateQuantity(100L, 5));

        assertEquals("Không tìm thấy item", ex.getMessage());
        verify(cartItemRepository, never()).save(any());
    }

    @Test
    void updateQuantity_WhenQuantityOverStock_ShouldThrowException() {
        variant.setStock(3);
        item.setQuantity(2);

        when(cartItemRepository.findById(100L)).thenReturn(Optional.of(item));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> cartService.updateQuantity(100L, 5));

        assertEquals("Vượt tồn kho", ex.getMessage());
        verify(cartItemRepository, never()).save(any());
    }

    @Test
    void removeItem_WhenItemNotExists_ShouldThrowException() {
        when(cartItemRepository.existsById(100L)).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> cartService.removeItem(100L));

        assertEquals("Không tìm thấy item trong giỏ", ex.getMessage());
        verify(cartItemRepository, never()).deleteCartItemByIdNative(any());
    }
}
// .\mvnw test -Dtest=CartServiceTest

// .\mvnw clean test