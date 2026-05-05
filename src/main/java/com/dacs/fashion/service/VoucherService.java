package com.dacs.fashion.service;

import com.dacs.fashion.entity.Voucher;
import com.dacs.fashion.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VoucherService {

    private final VoucherRepository voucherRepository;

    public List<Voucher> getAll() {
        return voucherRepository.findAll();
    }

    public Voucher getById(Long id) {
        return voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy voucher"));
    }

    public Voucher create(Voucher voucher) {
        return voucherRepository.save(voucher);
    }

    public Voucher update(Long id, Voucher data) {
        Voucher voucher = getById(id);
        voucher.setCode(data.getCode());
        voucher.setDiscountType(data.getDiscountType());
        voucher.setDiscountValue(data.getDiscountValue());
        voucher.setMinOrderValue(data.getMinOrderValue());
        voucher.setStartDate(data.getStartDate());
        voucher.setEndDate(data.getEndDate());
        voucher.setStatus(data.getStatus());

        return voucherRepository.save(voucher);
    }

    public void delete(Long id) {
        voucherRepository.deleteById(id);
    }
}