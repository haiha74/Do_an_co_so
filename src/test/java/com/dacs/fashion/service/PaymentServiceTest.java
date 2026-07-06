package com.dacs.fashion.service;

import com.dacs.fashion.entity.Order;
import com.dacs.fashion.entity.Payment;
import com.dacs.fashion.repository.OrderRepository;
import com.dacs.fashion.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private PaymentService paymentService;

    private Payment payment;
    private Order order;

    @BeforeEach
    void setUp() {

        order = new Order();
        order.setOrderId(1L);

        payment = new Payment();
        payment.setPaymentId(1L);
        payment.setOrder(order);
        payment.setPaymentMethod("COD");
        payment.setPaymentStatus("UNPAID");
    }

    @Test
    void getAll_ShouldReturnList() {

        when(paymentRepository.findAll())
                .thenReturn(List.of(payment));

        List<Payment> result = paymentService.getAll();

        assertEquals(1, result.size());
        verify(paymentRepository).findAll();
    }

    @Test
    void getById_WhenExists_ShouldReturnPayment() {

        when(paymentRepository.findById(1L))
                .thenReturn(Optional.of(payment));

        Payment result = paymentService.getById(1L);

        assertEquals(1L, result.getPaymentId());
        verify(paymentRepository).findById(1L);
    }

    @Test
    void getById_WhenNotExists_ShouldThrowException() {

        when(paymentRepository.findById(1L))
                .thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> paymentService.getById(1L));

        assertEquals("Không tìm thấy thanh toán", ex.getMessage());
    }

    @Test
    void create_WhenOrderExists_ShouldCreatePayment() {

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(order));

        when(paymentRepository.save(any(Payment.class)))
                .thenAnswer(i -> i.getArgument(0));

        Payment result = paymentService.create(1L, "COD");

        assertEquals(order, result.getOrder());
        assertEquals("COD", result.getPaymentMethod());
        assertEquals("UNPAID", result.getPaymentStatus());

        verify(paymentRepository).save(any(Payment.class));
    }

    @Test
    void create_WhenOrderNotFound_ShouldThrowException() {
        when(orderRepository.findById(1L))
                .thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> paymentService.create(1L, "COD"));
        assertEquals("Không tìm thấy đơn hàng", ex.getMessage());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void updateStatus_ToPaid_ShouldUpdatePaidTime() {
        when(paymentRepository.findById(1L))
                .thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class)))
                .thenAnswer(i -> i.getArgument(0));
        Payment result = paymentService.updateStatus(1L, "PAID");
        assertEquals("PAID", result.getPaymentStatus());
        assertNotNull(result.getPaidAt());
        verify(paymentRepository).save(payment);
    }

    @Test
    void updateStatus_ToPending_ShouldUpdateStatus() {
        when(paymentRepository.findById(1L))
                .thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class)))
                .thenAnswer(i -> i.getArgument(0));
        Payment result = paymentService.updateStatus(1L, "PENDING");
        assertEquals("PENDING", result.getPaymentStatus());
        assertNull(result.getPaidAt());
        verify(paymentRepository).save(payment);
    }

    @Test
    void updateStatus_WithInvalidStatus_ShouldThrowException() {
        when(paymentRepository.findById(1L))
                .thenReturn(Optional.of(payment));
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> paymentService.updateStatus(1L, "ABC"));
        assertEquals("Trạng thái thanh toán không hợp lệ",
                ex.getMessage());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void delete_ShouldDeletePayment() {

        paymentService.delete(1L);

        verify(paymentRepository).deleteById(1L);
    }

}
// .\mvnw test -Dtest=PaymentServiceTest