package com.dacs.fashion.service;

import com.dacs.fashion.entity.Brand;
import com.dacs.fashion.repository.BrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BrandService {

    private final BrandRepository brandRepository;

    public List<Brand> getAll() {
        return brandRepository.findAll();
    }

    public Brand getById(Long id) {
        return brandRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thương hiệu"));
    }

    public Brand create(Brand brand) {
        return brandRepository.save(brand);
    }

    public Brand update(Long id, Brand data) {
        Brand brand = getById(id);
        brand.setBrandName(data.getBrandName());
        brand.setDescription(data.getDescription());
        brand.setStatus(data.getStatus());
        return brandRepository.save(brand);
    }

    public void delete(Long id) {
        brandRepository.deleteById(id);
    }
}