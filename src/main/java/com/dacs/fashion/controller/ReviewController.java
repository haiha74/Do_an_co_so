package com.dacs.fashion.controller;

import com.dacs.fashion.entity.Review;
import com.dacs.fashion.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public List<Review> getAll() {
        return reviewService.getAll();
    }

    @GetMapping("/{id}")
    public Review getById(@PathVariable Long id) {
        return reviewService.getById(id);
    }

    @GetMapping("/user/{userId}")
    public List<Review> getByUser(@PathVariable Long userId) {
        return reviewService.getByUser(userId);
    }

    @PostMapping
    public Review create(@RequestParam Long userId,
                         @RequestParam Long orderItemId,
                         @RequestParam Integer rating,
                         @RequestParam String comment,
                         @RequestParam(required = false) String imageUrl) {
        return reviewService.create(userId, orderItemId, rating, comment, imageUrl);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        reviewService.delete(id);
        return "Xóa đánh giá thành công";
    }
}