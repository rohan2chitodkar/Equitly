package com.equitly.dto;

import java.time.LocalDateTime;

public class AuthDtos {

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public String getPassword() { return password; }
        public void setEmail(String email) { this.email = email; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;

        public String getName() { return name; }
        public String getEmail() { return email; }
        public String getPassword() { return password; }
        public void setName(String name) { this.name = name; }
        public void setEmail(String email) { this.email = email; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class AuthResponse {
        private String token;
        private UserDto user;

        public AuthResponse(String token, UserDto user) {
            this.token = token;
            this.user = user;
        }

        public String getToken() { return token; }
        public UserDto getUser() { return user; }
        public void setToken(String token) { this.token = token; }
        public void setUser(UserDto user) { this.user = user; }

        public static class UserDto {
            private String id;
            private String name;
            private String email;
            private String currency;
            private LocalDateTime createdAt;

            public String getId() { return id; }
            public String getName() { return name; }
            public String getEmail() { return email; }
            public String getCurrency() { return currency; }
            public LocalDateTime getCreatedAt() { return createdAt; }
            public void setId(String id) { this.id = id; }
            public void setName(String name) { this.name = name; }
            public void setEmail(String email) { this.email = email; }
            public void setCurrency(String currency) { this.currency = currency; }
            public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        }
    }
}