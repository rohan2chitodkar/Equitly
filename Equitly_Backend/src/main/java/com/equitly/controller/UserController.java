package com.equitly.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.equitly.model.User;
import com.equitly.service.UserService;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    
    public UserController(UserService userService) {
		this.userService = userService;
	}

	@GetMapping("/me")
    public ResponseEntity<User> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getCurrentUser(userDetails.getUsername()));
    }

    @PutMapping("/me")
    public ResponseEntity<User> updateMe(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        User user = userService.getCurrentUser(userDetails.getUsername());
        User updated = userService.updateProfile(user.getId(), body);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        User user = userService.getCurrentUser(userDetails.getUsername());
        userService.changePassword(user.getId(), body.get("oldPassword"), body.get("newPassword"));
        return ResponseEntity.noContent().build();
    }
}
