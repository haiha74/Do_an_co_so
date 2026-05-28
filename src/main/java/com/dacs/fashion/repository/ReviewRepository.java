package com.dacs.fashion.repository;

import com.dacs.fashion.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByUser_UserId(Long userId);
    boolean existsByOrderItem_OrderItemId(Long orderItemId);
}