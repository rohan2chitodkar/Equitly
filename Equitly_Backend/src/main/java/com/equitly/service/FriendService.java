package com.equitly.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.equitly.model.User;
import com.equitly.repository.UserRepository;

import java.util.List;

@Service
public class FriendService {
    private final UserRepository userRepository;

    public FriendService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getFriends(String userId) {
        return userRepository.findFriendsByUserId(userId);
    }

    @Transactional
    public User addFriend(String currentUserId, String friendEmail) {
        User current = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User friend = userRepository.findByEmail(friendEmail)
                .orElseThrow(() -> new RuntimeException("No user found with email: " + friendEmail));

        if (current.getId().equals(friend.getId())) {
            throw new RuntimeException("You cannot add yourself as a friend");
        }
        if (userRepository.areFriends(currentUserId, friend.getId())) {
            throw new RuntimeException("Already friends");
        }

        // Bidirectional friendship
        current.getFriends().add(friend);
        friend.getFriends().add(current);
        userRepository.save(current);
        userRepository.save(friend);

        return friend;
    }

    @Transactional
    public void removeFriend(String currentUserId, String friendId) {
        User current = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new RuntimeException("Friend not found"));

        current.getFriends().remove(friend);
        friend.getFriends().remove(current);
        userRepository.save(current);
        userRepository.save(friend);
    }
}
