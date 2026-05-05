package com.dacs.fashion.service;

import com.dacs.fashion.dto.OrderDTO;
import com.dacs.fashion.dto.OrderItemDTO;
import com.dacs.fashion.entity.*;
import com.dacs.fashion.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final VoucherRepository voucherRepository;
    private final ProductVariantRepository variantRepository;

    public List<Order> getAll() {
        return orderRepository.findAll();
    }

    public List<Order> getByUser(Long userId) {
        return orderRepository.findByUser_UserId(userId);
    }

    public Order getById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
    }

    public Order create(OrderDTO dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Order order = new Order();
        order.setUser(user);
        order.setAddress(dto.getAddress());
        order.setOrderStatus("PENDING");
        order.setTotalAmount(dto.getTotalAmount());
        order.setDiscountAmount(dto.getDiscountAmount());
        order.setFinalAmount(dto.getFinalAmount());
        order.setCreatedAt(LocalDateTime.now());

        if (dto.getVoucherId() != null) {
            Voucher voucher = voucherRepository.findById(dto.getVoucherId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy voucher"));
            order.setVoucher(voucher);
        }

        return orderRepository.save(order);
    }

    public OrderItem addOrderItem(Long orderId, OrderItemDTO dto) {
        Order order = getById(orderId);

        ProductVariant variant = variantRepository.findById(dto.getVariantId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy biến thể sản phẩm"));

        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setVariant(variant);
        item.setQuantity(dto.getQuantity());
        item.setUnitPrice(dto.getUnitPrice());
        item.setSubtotal(dto.getUnitPrice().multiply(BigDecimal.valueOf(dto.getQuantity())));

        return orderItemRepository.save(item);
    }

    public List<OrderItem> getOrderItems(Long orderId) {
        return orderItemRepository.findByOrder_OrderId(orderId);
    }

    public Order updateStatus(Long orderId, String status) {
        Order order = getById(orderId);
        order.setOrderStatus(status);
        return orderRepository.save(order);
    }

    public void delete(Long id) {
        orderRepository.deleteById(id);
    }
}