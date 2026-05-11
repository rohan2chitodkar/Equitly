package com.equitly.repository;

import com.equitly.model.ActivityMember;
import org.springframework.data.jpa.repository
        .JpaRepository;
import org.springframework.data.jpa.repository
        .Query;
import org.springframework.data.repository.query
        .Param;

import java.util.Optional;

public interface ActivityMemberRepository
        extends JpaRepository<ActivityMember,
                String> {

    @Query("SELECT am FROM ActivityMember am " +
           "WHERE am.activity.id = :activityId " +
           "AND am.userId = :userId")
    Optional<ActivityMember>
            findByActivityIdAndUserId(
            @Param("activityId") String activityId,
            @Param("userId") String userId);
}