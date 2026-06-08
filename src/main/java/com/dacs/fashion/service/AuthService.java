package com.dacs.fashion.service;

import com.dacs.fashion.dto.LoginDTO;
import com.dacs.fashion.dto.UserDTO;
import com.dacs.fashion.entity.User;
import com.dacs.fashion.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.dacs.fashion.config.JwtUtil;
import java.util.Map;


@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public User register(UserDTO dto) {

        if (dto.getPassword() == null || dto.getPassword().isBlank()) {
            throw new RuntimeException("Mật khẩu không được để trống");
        }

        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            throw new RuntimeException("Email không được để trống");
        }

        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã tồn tại");
        }

        User user = new User();
        user.setFullname(dto.getFullname());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));

        user.setPhone("");
        user.setAddress("");
        user.setRole("USER");
        user.setStatus("ACTIVE");

        return userRepository.save(user);
    }

    public Map<String, Object> login(LoginDTO dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại"));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new RuntimeException("Sai mật khẩu");
        }

        if(!"ACTIVE".equals(user.getStatus())){
            throw new RuntimeException("Tài khoản đã bị khóa");
        }
        String token = jwtUtil.generateToken(user);

        return Map.of(
                "token", token,
                "userId", user.getUserId(),
                "fullname", user.getFullname(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "status", user.getStatus()
        );
    }
}