package com.equitly.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.equitly.model.User;

import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u.friends FROM User u WHERE u.id = :userId")
    List<User> findFriendsByUserId(@Param("userId") String userId);

    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END " +
           "FROM User u JOIN u.friends f WHERE u.id = :userId AND f.id = :friendId")
    boolean areFriends(@Param("userId") String userId, @Param("friendId") String friendId);
}
