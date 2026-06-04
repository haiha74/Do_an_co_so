package com.dacs.fashion.repository;

import com.dacs.fashion.entity.ProductView;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductViewRepository extends JpaRepository<ProductView, Long> {
    List<ProductView> findByUser_UserId(Long userId);
}