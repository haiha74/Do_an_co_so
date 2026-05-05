package com.dacs.fashion.service;

import com.dacs.fashion.entity.OrderItem;
import com.dacs.fashion.entity.Review;
import com.dacs.fashion.entity.User;
import com.dacs.fashion.repository.OrderItemRepository;
import com.dacs.fashion.repository.ReviewRepository;
import com.dacs.fashion.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;

    public List<Review> getAll() {
        return reviewRepository.findAll();
    }

    public List<Review> getByUser(Long userId) {
        return reviewRepository.findByUser_UserId(userId);
    }

    public Review getById(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá"));
    }

    public Review create(Long userId, Long orderItemId, Integer rating, String comment, String imageUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm đã mua"));

        Review review = new Review();
        review.setUser(user);
        review.setOrderItem(orderItem);
        review.setRating(rating);
        review.setComment(comment);
        review.setImageUrl(imageUrl);
        review.setCreatedAt(LocalDateTime.now());

        return reviewRepository.save(review);
    }

    public void delete(Long id) {
        reviewRepository.deleteById(id);
    }
}