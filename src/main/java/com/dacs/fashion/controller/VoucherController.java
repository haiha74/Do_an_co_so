package com.dacs.fashion.controller;

import com.dacs.fashion.entity.Voucher;
import com.dacs.fashion.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    @GetMapping
    public List<Voucher> getAll() {
        return voucherService.getAll();
    }

    @GetMapping("/{id}")
    public Voucher getById(@PathVariable Long id) {
        return voucherService.getById(id);
    }

    @PostMapping
    public Voucher create(@RequestBody Voucher voucher) {
        return voucherService.create(voucher);
    }

    @PutMapping("/{id}")
    public Voucher update(@PathVariable Long id, @RequestBody Voucher voucher) {
        return voucherService.update(id, voucher);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        voucherService.delete(id);
        return "Xóa voucher thành công";
    }
}