package com.equitly.service;

import com.equitly.dto.AuthDtos;
import com.equitly.model.User;
import com.equitly.repository.UserRepository;
import com.equitly.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthDtos.AuthResponse register(
            AuthDtos.RegisterRequest request) {

        // Check email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException(
                    "Email already registered. Please login.");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        userRepository.save(user);
        String token = jwtUtil.generateToken(user);
        return new AuthDtos.AuthResponse(token, toDto(user));
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {

        // Check if email exists
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException(
                        "User not found. Please check your email."));

        // Check password
        if (!passwordEncoder.matches(
                request.getPassword(), user.getPassword())) {
            throw new RuntimeException(
                    "Password does not match. Please try again.");
        }

        String token = jwtUtil.generateToken(user);
        return new AuthDtos.AuthResponse(token, toDto(user));
    }

    private AuthDtos.AuthResponse.UserDto toDto(User u) {
        AuthDtos.AuthResponse.UserDto dto =
                new AuthDtos.AuthResponse.UserDto();
        dto.setId(u.getId());
        dto.setName(u.getName());
        dto.setEmail(u.getEmail());
        dto.setCurrency(u.getCurrency());
        dto.setCreatedAt(u.getCreatedAt());
        return dto;
    }
}