package com.equitly.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.equitly.model.User;
import com.equitly.service.FriendService;
import com.equitly.service.UserService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    private final FriendService friendService;
    private final UserService userService;
    
    public FriendController(FriendService friendService, UserService userService) {
		this.friendService = friendService;
		this.userService = userService;
	}

	@GetMapping
    public ResponseEntity<List<User>> getFriends(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(friendService.getFriends(user.getId()));
    }

    @PostMapping
    public ResponseEntity<User> addFriend(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        User user = userService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(friendService.addFriend(user.getId(), body.get("email")));
    }

    @DeleteMapping("/{friendId}")
    public ResponseEntity<Void> removeFriend(
            @PathVariable String friendId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getCurrentUser(userDetails.getUsername());
        friendService.removeFriend(user.getId(), friendId);
        return ResponseEntity.noContent().build();
    }
}
