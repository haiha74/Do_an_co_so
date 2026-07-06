package com.dacs.fashion.service;

import com.dacs.fashion.entity.Order;
import com.dacs.fashion.entity.OrderItem;
import com.dacs.fashion.entity.Review;
import com.dacs.fashion.entity.User;
import com.dacs.fashion.repository.OrderItemRepository;
import com.dacs.fashion.repository.ReviewRepository;
import com.dacs.fashion.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @InjectMocks
    private ReviewService reviewService;

    private User user;
    private User otherUser;
    private Order order;
    private OrderItem orderItem;
    private Review review;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setUserId(1L);
        user.setFullname("Tester");

        otherUser = new User();
        otherUser.setUserId(2L);
        otherUser.setFullname("Other User");

        order = new Order();
        order.setOrderId(1L);
        order.setUser(user);
        order.setOrderStatus("COMPLETED");

        orderItem = new OrderItem();
        orderItem.setOrderItemId(10L);
        orderItem.setOrder(order);

        review = new Review();
        review.setReviewId(100L);
        review.setUser(user);
        review.setOrderItem(orderItem);
        review.setRating(5);
        review.setComment("Sản phẩm tốt");
    }

    @Test
    void getAll_ShouldReturnReviews() {
        when(reviewRepository.findAllByOrderByCreatedAtDesc())
                .thenReturn(List.of(review));
        List<Review> result = reviewService.getAll();
        assertEquals(1, result.size());
        verify(reviewRepository).findAllByOrderByCreatedAtDesc();
    }

    @Test
    void getByUser_ShouldReturnUserReviews() {
        when(reviewRepository.findByUser_UserIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(review));
        List<Review> result = reviewService.getByUser(1L);
        assertEquals(1, result.size());
        verify(reviewRepository).findByUser_UserIdOrderByCreatedAtDesc(1L);
    }

    @Test
    void getById_WhenExists_ShouldReturnReview() {
        when(reviewRepository.findById(100L))
                .thenReturn(Optional.of(review));
        Review result = reviewService.getById(100L);
        assertEquals(100L, result.getReviewId());
        verify(reviewRepository).findById(100L);
    }

    @Test
    void getById_WhenNotExists_ShouldThrowException() {
        when(reviewRepository.findById(100L))
                .thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> reviewService.getById(100L));
        assertEquals("Không tìm thấy đánh giá", ex.getMessage());
    }

    @Test
    void create_WithValidData_ShouldCreateReview() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(orderItemRepository.findById(10L)).thenReturn(Optional.of(orderItem));
        when(reviewRepository.existsByOrderItem_OrderItemId(10L)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenAnswer(invocation -> invocation.getArgument(0));
        Review result = reviewService.create(
                1L,
                10L,
                5,
                "Sản phẩm tốt",
                "image.jpg"
        );
        assertEquals(user, result.getUser());
        assertEquals(orderItem, result.getOrderItem());
        assertEquals(5, result.getRating());
        assertEquals("Sản phẩm tốt", result.getComment());
        assertEquals("image.jpg", result.getImageUrl());
        assertNotNull(result.getCreatedAt());
        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    void create_WhenUserNotFound_ShouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> reviewService.create(1L, 10L, 5, "Tốt", null));
        assertEquals("Không tìm thấy user", ex.getMessage());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void create_WhenOrderItemNotFound_ShouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(orderItemRepository.findById(10L)).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> reviewService.create(1L, 10L, 5, "Tốt", null));
        assertEquals("Không tìm thấy order item", ex.getMessage());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void create_WhenRatingNull_ShouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(orderItemRepository.findById(10L)).thenReturn(Optional.of(orderItem));
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> reviewService.create(1L, 10L, null, "Tốt", null));
        assertEquals("Số sao phải từ 1 đến 5", ex.getMessage());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void create_WhenRatingLessThanOne_ShouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(orderItemRepository.findById(10L)).thenReturn(Optional.of(orderItem));
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> reviewService.create(1L, 10L, 0, "Tốt", null));
        assertEquals("Số sao phải từ 1 đến 5", ex.getMessage());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void create_WhenRatingGreaterThanFive_ShouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(orderItemRepository.findById(10L)).thenReturn(Optional.of(orderItem));
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> reviewService.create(1L, 10L, 6, "Tốt", null));
        assertEquals("Số sao phải từ 1 đến 5", ex.getMessage());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void create_WhenCommentNull_ShouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(orderItemRepository.findById(10L)).thenReturn(Optional.of(orderItem));
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> reviewService.create(1L, 10L, 5, null, null));
        assertEquals("Nội dung đánh giá không được để trống", ex.getMessage());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void create_WhenCommentBlank_ShouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(orderItemRepository.findById(10L)).thenReturn(Optional.of(orderItem));
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> reviewService.create(1L, 10L, 5, "   ", null));
        assertEquals("Nội dung đánh giá không được để trống", ex.getMessage());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void create_WhenOrderItemBelongsToOtherUser_ShouldThrowException() {
        order.setUser(otherUser);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(orderItemRepository.findById(10L)).thenReturn(Optional.of(orderItem));
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> reviewService.create(1L, 10L, 5, "Tốt", null));
        assertEquals("Bạn không có quyền đánh giá sản phẩm này", ex.getMessage());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void create_WhenOrderNotCompleted_ShouldThrowException() {
        order.setOrderStatus("PENDING");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(orderItemRepository.findById(10L)).thenReturn(Optional.of(orderItem));
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> reviewService.create(1L, 10L, 5, "Tốt", null));
        assertEquals("Chỉ được đánh giá đơn hàng đã hoàn thành", ex.getMessage());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void create_WhenReviewAlreadyExists_ShouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(orderItemRepository.findById(10L)).thenReturn(Optional.of(orderItem));
        when(reviewRepository.existsByOrderItem_OrderItemId(10L)).thenReturn(true);
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> reviewService.create(1L, 10L, 5, "Tốt", null));
        assertEquals("Sản phẩm này đã được đánh giá", ex.getMessage());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void delete_ShouldDeleteReview() {
        reviewService.delete(100L);

        verify(reviewRepository).deleteById(100L);
    }
}
// .\mvnw test -Dtest=ReviewServiceTest