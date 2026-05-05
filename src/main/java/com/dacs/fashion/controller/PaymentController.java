package com.dacs.fashion.controller;

import com.dacs.fashion.entity.Payment;
import com.dacs.fashion.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public List<Payment> getAll() {
        return paymentService.getAll();
    }

    @GetMapping("/{id}")
    public Payment getById(@PathVariable Long id) {
        return paymentService.getById(id);
    }

    @PostMapping
    public Payment create(@RequestParam Long orderId,
                          @RequestParam String method) {
        return paymentService.create(orderId, method);
    }

    @PutMapping("/{id}/status")
    public Payment updateStatus(@PathVariable Long id,
                                @RequestParam String status) {
        return paymentService.updateStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        paymentService.delete(id);
        return "Xóa thanh toán thành công";
    }
}