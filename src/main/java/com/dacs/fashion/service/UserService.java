package com.dacs.fashion.service;

import com.dacs.fashion.dto.UserDTO;
import com.dacs.fashion.entity.User;
import com.dacs.fashion.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    }

    public User create(UserDTO dto) {
        User user = new User();
        user.setFullname(dto.getFullname());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setPassword(dto.getPassword());
        user.setRole(dto.getRole());
        user.setAddress(dto.getAddress());
        user.setStatus(dto.getStatus());

        return userRepository.save(user);
    }

    public User update(Long id, UserDTO dto) {
        User user = getById(id);
        user.setFullname(dto.getFullname());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setPassword(dto.getPassword());
        user.setRole(dto.getRole());
        user.setAddress(dto.getAddress());
        user.setStatus(dto.getStatus());

        return userRepository.save(user);
    }

    public void delete(Long id) {
        userRepository.deleteById(id);
    }
}