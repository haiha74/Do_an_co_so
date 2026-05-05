package com.dacs.fashion.service;

import com.dacs.fashion.dto.ProductVariantDTO;
import com.dacs.fashion.entity.Product;
import com.dacs.fashion.entity.ProductVariant;
import com.dacs.fashion.repository.ProductRepository;
import com.dacs.fashion.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductVariantService {

    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;

    public List<ProductVariant> getAll() {
        return variantRepository.findAll();
    }

    public ProductVariant getById(Long id) {
        return variantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy biến thể sản phẩm"));
    }

    public List<ProductVariant> getByProduct(Long productId) {
        return variantRepository.findByProduct_ProductId(productId);
    }

    public ProductVariant create(ProductVariantDTO dto) {
        Product product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setSize(dto.getSize());
        variant.setColor(dto.getColor());
        variant.setSku(dto.getSku());
        variant.setPrice(dto.getPrice());
        variant.setStock(dto.getStock());
        variant.setStatus(dto.getStatus());

        return variantRepository.save(variant);
    }

    public ProductVariant update(Long id, ProductVariantDTO dto) {
        ProductVariant variant = getById(id);

        variant.setSize(dto.getSize());
        variant.setColor(dto.getColor());
        variant.setSku(dto.getSku());
        variant.setPrice(dto.getPrice());
        variant.setStock(dto.getStock());
        variant.setStatus(dto.getStatus());

        return variantRepository.save(variant);
    }

    public void delete(Long id) {
        variantRepository.deleteById(id);
    }
}