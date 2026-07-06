package com.dacs.fashion.service;

import com.dacs.fashion.dto.CheckoutDTO;
import com.dacs.fashion.dto.CreateOrderDTO;
import com.dacs.fashion.entity.*;
import com.dacs.fashion.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductVariantRepository variantRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private VoucherService voucherService;

    @InjectMocks
    private OrderService orderService;

    private User user;
    private Cart cart;
    private CartItem cartItem;
    private ProductVariant variant;
    private CreateOrderDTO createOrderDTO;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setUserId(1L);
        user.setFullname("Tester");

        variant = new ProductVariant();
        variant.setVariantId(10L);
        variant.setSku("SKU-001");
        variant.setStatus("ACTIVE");
        variant.setStock(20);
        variant.setPrice(BigDecimal.valueOf(100000));

        cartItem = new CartItem();
        cartItem.setCartItemId(100L);
        cartItem.setVariant(variant);
        cartItem.setQuantity(2);

        cart = new Cart();
        cart.setCartId(1L);
        cart.setUser(user);
        cart.setItems(new ArrayList<>(List.of(cartItem)));

        createOrderDTO = new CreateOrderDTO();
        createOrderDTO.setUserId(1L);
        createOrderDTO.setAddress("Ha Noi");
        createOrderDTO.setVoucherCode(null);
    }

    @Test
    void createFromCart_WithValidCart_ShouldCreateOrder() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));
        when(variantRepository.findById(10L)).thenReturn(Optional.of(variant));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order result = orderService.createFromCart(createOrderDTO);

        assertNotNull(result);
        assertEquals(user, result.getUser());
        assertEquals("Ha Noi", result.getAddress());
        assertEquals("PENDING", result.getOrderStatus());
        assertEquals(BigDecimal.valueOf(200000), result.getTotalAmount());
        assertEquals(BigDecimal.valueOf(230000), result.getFinalAmount());
        assertEquals(18, variant.getStock());
        assertTrue(cart.getItems().isEmpty());

        verify(variantRepository).save(variant);
        verify(orderRepository).save(any(Order.class));
        verify(cartRepository).save(cart);
    }

    @Test
    void createFromCart_WhenUserNotFound_ShouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> orderService.createFromCart(createOrderDTO));

        assertEquals("Không tìm thấy user", ex.getMessage());
        verify(orderRepository, never()).save(any());
    }

    @Test
    void createFromCart_WhenCartNotFound_ShouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> orderService.createFromCart(createOrderDTO));

        assertEquals("Giỏ hàng trống", ex.getMessage());
        verify(orderRepository, never()).save(any());
    }

    @Test
    void createFromCart_WhenCartIsEmpty_ShouldThrowException() {
        cart.setItems(new ArrayList<>());

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> orderService.createFromCart(createOrderDTO));

        assertEquals("Giỏ hàng trống", ex.getMessage());
        verify(orderRepository, never()).save(any());
    }

    @Test
    void createFromCart_WhenQuantityInvalid_ShouldThrowException() {
        cartItem.setQuantity(0);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));
        when(variantRepository.findById(10L)).thenReturn(Optional.of(variant));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> orderService.createFromCart(createOrderDTO));

        assertEquals("Số lượng không hợp lệ", ex.getMessage());
        verify(orderRepository, never()).save(any());
    }

    @Test
    void createFromCart_WhenVariantInactive_ShouldThrowException() {
        variant.setStatus("INACTIVE");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));
        when(variantRepository.findById(10L)).thenReturn(Optional.of(variant));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> orderService.createFromCart(createOrderDTO));

        assertTrue(ex.getMessage().contains("Biến thể không hoạt động"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void createFromCart_WhenStockNotEnough_ShouldThrowException() {
        variant.setStock(1);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));
        when(variantRepository.findById(10L)).thenReturn(Optional.of(variant));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> orderService.createFromCart(createOrderDTO));

        assertTrue(ex.getMessage().contains("Không đủ tồn kho"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void createFromCart_WithFreeShipping_ShouldFinalAmountWithoutShippingFee() {
        variant.setPrice(BigDecimal.valueOf(1000000));
        cartItem.setQuantity(1);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));
        when(variantRepository.findById(10L)).thenReturn(Optional.of(variant));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order result = orderService.createFromCart(createOrderDTO);

        assertEquals(BigDecimal.valueOf(1000000), result.getTotalAmount());
        assertEquals(BigDecimal.valueOf(1000000), result.getFinalAmount());
    }

    @Test
    void createFromCart_WithValidVoucher_ShouldApplyDiscount() {
        Voucher voucher = new Voucher();
        voucher.setVoucherId(1L);
        voucher.setCode("SALE50");

        createOrderDTO.setVoucherCode("SALE50");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));
        when(variantRepository.findById(10L)).thenReturn(Optional.of(variant));
        when(voucherService.validateVoucher("SALE50", BigDecimal.valueOf(200000))).thenReturn(voucher);
        when(voucherService.calculateDiscount(voucher, BigDecimal.valueOf(200000)))
                .thenReturn(BigDecimal.valueOf(50000));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order result = orderService.createFromCart(createOrderDTO);

        assertEquals(voucher, result.getVoucher());
        assertEquals(BigDecimal.valueOf(50000), result.getDiscountAmount());
        assertEquals(BigDecimal.valueOf(180000), result.getFinalAmount());
    }

    @Test
    void checkout_WithCOD_ShouldCreateOrderAndUnpaidPayment() {
        CheckoutDTO dto = new CheckoutDTO();
        dto.setUserId(1L);
        dto.setFullname("Nguyen Van A");
        dto.setPhone("0900000000");
        dto.setAddress("Ha Noi");
        dto.setPaymentMethod("COD");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));
        when(variantRepository.findById(10L)).thenReturn(Optional.of(variant));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order result = orderService.checkout(dto);

        assertNotNull(result);
        assertEquals("PENDING", result.getOrderStatus());
        verify(paymentRepository).save(argThat(payment ->
                "COD".equals(payment.getPaymentMethod())
                        && "UNPAID".equals(payment.getPaymentStatus())
        ));
    }

    @Test
    void checkout_WithQR_ShouldSetPendingPayment() {
        CheckoutDTO dto = new CheckoutDTO();
        dto.setUserId(1L);
        dto.setFullname("Nguyen Van A");
        dto.setPhone("0900000000");
        dto.setAddress("Ha Noi");
        dto.setPaymentMethod("QR");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUser_UserId(1L)).thenReturn(Optional.of(cart));
        when(variantRepository.findById(10L)).thenReturn(Optional.of(variant));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order result = orderService.checkout(dto);

        assertEquals("PENDING_PAYMENT", result.getOrderStatus());
        verify(paymentRepository).save(argThat(payment ->
                "QR".equals(payment.getPaymentMethod())
                        && "PENDING".equals(payment.getPaymentStatus())
        ));
    }

    @Test
    void updateStatus_WithInvalidStatus_ShouldThrowException() {
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> orderService.updateStatus(1L, "INVALID", "staff01"));

        assertEquals("Trạng thái đơn hàng không hợp lệ", ex.getMessage());
        verify(orderRepository, never()).save(any());
    }

    @Test
    void updateStatus_WithValidStatus_ShouldUpdateOrder() {
        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderStatus("PENDING");

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order result = orderService.updateStatus(1L, "CONFIRMED", "staff01");

        assertEquals("CONFIRMED", result.getOrderStatus());
        assertEquals("staff01", result.getUpdatedByStaff());
        verify(orderRepository).save(order);
    }

    @Test
    void updateStatus_ToCancelled_ShouldRestoreStockAndCancelPayment() {
        ProductVariant orderVariant = new ProductVariant();
        orderVariant.setVariantId(10L);
        orderVariant.setStock(5);

        OrderItem orderItem = new OrderItem();
        orderItem.setVariant(orderVariant);
        orderItem.setQuantity(2);

        Payment payment = new Payment();
        payment.setPaymentStatus("PENDING");

        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderStatus("PENDING_PAYMENT");
        order.setItems(List.of(orderItem));
        order.setPayment(payment);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order result = orderService.updateStatus(1L, "CANCELLED", "staff01");

        assertEquals("CANCELLED", result.getOrderStatus());
        assertEquals(7, orderVariant.getStock());
        assertEquals("CANCELLED", payment.getPaymentStatus());

        verify(variantRepository).save(orderVariant);
        verify(paymentRepository).save(payment);
        verify(orderRepository).save(order);
    }

    @Test
    void markPaid_ShouldUpdateOrderAndPayment() {
        Payment payment = new Payment();
        payment.setPaymentStatus("PENDING");

        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderStatus("PENDING_PAYMENT");
        order.setPayment(payment);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order result = orderService.markPaid(1L);

        assertEquals("PAID", result.getOrderStatus());
        assertEquals("PAID", payment.getPaymentStatus());
        assertNotNull(payment.getPaidAt());

        verify(paymentRepository).save(payment);
        verify(orderRepository).save(order);
    }

    @Test
    void cancelExpiredPayOSOrders_ShouldCancelExpiredOrderAndRestoreStock() {
        ProductVariant orderVariant = new ProductVariant();
        orderVariant.setVariantId(10L);
        orderVariant.setStock(5);

        OrderItem orderItem = new OrderItem();
        orderItem.setVariant(orderVariant);
        orderItem.setQuantity(3);

        Payment payment = new Payment();
        payment.setPaymentStatus("PENDING");

        Order expiredOrder = new Order();
        expiredOrder.setOrderId(1L);
        expiredOrder.setOrderStatus("PENDING_PAYMENT");
        expiredOrder.setCreatedAt(LocalDateTime.now().minusMinutes(10));
        expiredOrder.setItems(List.of(orderItem));
        expiredOrder.setPayment(payment);

        when(orderRepository.findAll()).thenReturn(List.of(expiredOrder));

        orderService.cancelExpiredPayOSOrders();

        assertEquals("CANCELLED", expiredOrder.getOrderStatus());
        assertEquals(8, orderVariant.getStock());
        assertEquals("CANCELLED", payment.getPaymentStatus());

        verify(variantRepository).save(orderVariant);
        verify(paymentRepository).save(payment);
        verify(orderRepository).save(expiredOrder);
    }
}
// .\mvnw test -Dtest=OrderServiceTest