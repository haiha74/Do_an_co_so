package com.dacs.fashion.controller;

import com.dacs.fashion.dto.OrderDTO;
import com.dacs.fashion.dto.OrderItemDTO;
import com.dacs.fashion.entity.Order;
import com.dacs.fashion.entity.OrderItem;
import com.dacs.fashion.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public List<Order> getAll() {
        return orderService.getAll();
    }

    @GetMapping("/{id}")
    public Order getById(@PathVariable Long id) {
        return orderService.getById(id);
    }

    @GetMapping("/user/{userId}")
    public List<Order> getByUser(@PathVariable Long userId) {
        return orderService.getByUser(userId);
    }

    @PostMapping
    public Order create(@RequestBody OrderDTO dto) {
        return orderService.create(dto);
    }

    @PostMapping("/{orderId}/items")
    public OrderItem addOrderItem(@PathVariable Long orderId, @RequestBody OrderItemDTO dto) {
        return orderService.addOrderItem(orderId, dto);
    }

    @GetMapping("/{orderId}/items")
    public List<OrderItem> getOrderItems(@PathVariable Long orderId) {
        return orderService.getOrderItems(orderId);
    }

    @PutMapping("/{orderId}/status")
    public Order updateStatus(@PathVariable Long orderId, @RequestParam String status) {
        return orderService.updateStatus(orderId, status);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        orderService.delete(id);
        return "Xóa đơn hàng thành công";
    }
}