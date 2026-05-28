package com.dacs.fashion.service;

import com.dacs.fashion.dto.ProductDTO;
import com.dacs.fashion.entity.Brand;
import com.dacs.fashion.entity.Category;
import com.dacs.fashion.entity.Product;
import com.dacs.fashion.repository.BrandRepository;
import com.dacs.fashion.repository.CategoryRepository;
import com.dacs.fashion.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;

    public List<Product> getAll() {
        return productRepository.findAll();
    }

    public Product getById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
    }

    public List<Product> search(String keyword) {
        return productRepository.findByProductNameContaining(keyword);
    }

    public List<Product> getByCategory(Long categoryId) {
        return productRepository.findByCategory_CategoryId(categoryId);
    }

    public Product create(ProductDTO dto) {
        Product product = new Product();

        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));

        product.setCategory(category);

        if (dto.getBrandId() != null) {
            Brand brand = brandRepository.findById(dto.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thương hiệu"));
            product.setBrand(brand);
        }

        product.setProductName(dto.getProductName());
        product.setDescription(dto.getDescription());
        product.setBasePrice(dto.getBasePrice());
        product.setStatus(dto.getStatus());

        return productRepository.save(product);
    }

    public Product update(Long id, ProductDTO dto) {
        Product product = getById(id);

        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));

        product.setCategory(category);

        if (dto.getBrandId() != null) {
        Brand brand = brandRepository.findById(dto.getBrandId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thương hiệu"));
        product.setBrand(brand);
    } else {
        product.setBrand(null);
    }

        product.setProductName(dto.getProductName());
        product.setDescription(dto.getDescription());
        product.setBasePrice(dto.getBasePrice());
        product.setStatus(dto.getStatus());

        return productRepository.save(product);
    }

    public void delete(Long id) {
        productRepository.deleteById(id);
    }
}