package com.equitly.repository;

import com.equitly.model.Activity;
import org.springframework.data.jpa.repository
        .JpaRepository;
import org.springframework.data.jpa.repository
        .Query;
import org.springframework.data.repository.query
        .Param;

import java.util.List;

public interface ActivityRepository
        extends JpaRepository<Activity, String> {

    @Query(value =
        "SELECT DISTINCT a.* " +
        "FROM activities a " +
        "JOIN activity_members am " +
        "ON am.activity_id = a.id " +
        "WHERE am.user_id = :userId " +
        "ORDER BY a.created_at DESC",
        nativeQuery = true)
    List<Activity> findAllByUserId(
            @Param("userId") String userId);
}