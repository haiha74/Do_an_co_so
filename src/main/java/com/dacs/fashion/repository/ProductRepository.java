package com.dacs.fashion.repository;

import com.dacs.fashion.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByProductNameContaining(String keyword);

    List<Product> findByCategory_CategoryId(Long categoryId);
}