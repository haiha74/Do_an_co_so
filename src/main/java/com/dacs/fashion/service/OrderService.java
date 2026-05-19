package com.dacs.fashion.service;

import com.dacs.fashion.dto.CreateOrderDTO;
import com.dacs.fashion.entity.*;
import com.dacs.fashion.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
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

    public Order createFromCart(CreateOrderDTO dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        Cart cart = cartRepository.findByUser_UserId(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Giỏ hàng trống"));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new RuntimeException("Giỏ hàng trống");
        }

        BigDecimal total = BigDecimal.ZERO;

        Order order = new Order();
        order.setUser(user);
        order.setAddress(dto.getAddress());
        order.setOrderStatus("PENDING");
        order.setCreatedAt(LocalDateTime.now());
        order.setDiscountAmount(BigDecimal.ZERO);

        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem cartItem : cart.getItems()) {
            ProductVariant variant = cartItem.getVariant();

            if (!"ACTIVE".equals(variant.getStatus())) {
                throw new RuntimeException("Biến thể không hoạt động: " + variant.getSku());
            }

            if (variant.getStock() < cartItem.getQuantity()) {
                throw new RuntimeException("Không đủ tồn kho: " + variant.getSku());
            }

            BigDecimal price = variant.getPrice();
            BigDecimal lineTotal = price.multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            total = total.add(lineTotal);

            variant.setStock(variant.getStock() - cartItem.getQuantity());
            variantRepository.save(variant);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setVariant(variant);
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPrice(price);

            orderItems.add(orderItem);
        }

        BigDecimal shipping = total.compareTo(BigDecimal.valueOf(999000)) >= 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(30000);

        order.setTotalAmount(total);
        order.setFinalAmount(total.add(shipping));
        order.setItems(orderItems);

        Order savedOrder = orderRepository.save(order);

        cart.getItems().clear();
        cartRepository.save(cart);

        return savedOrder;
    }

    public Order updateStatus(Long orderId, String status) {
        Order order = getById(orderId);
        order.setOrderStatus(status);
        return orderRepository.save(order);
    }
}