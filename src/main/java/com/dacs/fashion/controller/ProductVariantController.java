package com.dacs.fashion.controller;

import com.dacs.fashion.dto.ProductVariantDTO;
import com.dacs.fashion.entity.Product;
import com.dacs.fashion.entity.ProductVariant;
import com.dacs.fashion.repository.ProductRepository;
import com.dacs.fashion.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/variants")
@RequiredArgsConstructor
public class ProductVariantController {

    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;

    @GetMapping("/product/{productId}")
    public List<ProductVariant> getByProduct(@PathVariable Long productId) {
        return variantRepository.findByProduct_ProductId(productId);
    }

    @PostMapping
    public ProductVariant create(@RequestBody ProductVariantDTO dto) {
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

    @PutMapping("/{id}")
    public ProductVariant update(@PathVariable Long id,
                                 @RequestBody ProductVariantDTO dto) {
        ProductVariant variant = variantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy biến thể"));

        variant.setSize(dto.getSize());
        variant.setColor(dto.getColor());
        variant.setSku(dto.getSku());
        variant.setPrice(dto.getPrice());
        variant.setStock(dto.getStock());
        variant.setStatus(dto.getStatus());

        return variantRepository.save(variant);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        variantRepository.deleteById(id);
        return "Xóa biến thể thành công";
    }
}