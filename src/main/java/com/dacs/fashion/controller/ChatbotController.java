package com.dacs.fashion.controller;

import com.dacs.fashion.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    public record ChatRequest(String message) {}

    public record ChatProduct(
            Long productId,
            Long variantId,
            String productName,
            BigDecimal price,
            String size,
            String color,
            Integer stock
    ) {}

    public record ChatResponse(
            String reply,
            List<ChatProduct> products
    ) {}

    @PostMapping("/message")
    public ChatResponse message(@RequestBody ChatRequest request) {
        if (request == null
                || request.message() == null
                || request.message().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng nhập nội dung tin nhắn"
            );
        }

        if (request.message().length() > 500) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tin nhắn không được vượt quá 500 ký tự"
            );
        }

        return chatbotService.reply(request.message().trim());
    }
}