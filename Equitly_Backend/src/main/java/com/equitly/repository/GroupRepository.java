package com.equitly.repository;

import com.equitly.model.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GroupRepository extends JpaRepository<Group, String> {

    @Query(value = "SELECT DISTINCT g.* FROM user_groups g " +
                   "JOIN group_members gm ON g.id = gm.group_id " +
                   "WHERE gm.user_id = :userId " +
                   "ORDER BY g.created_at DESC",
           nativeQuery = true)
    List<Group> findAllByMemberId(@Param("userId") String userId);

    @Query("SELECT g FROM Group g " +
           "LEFT JOIN FETCH g.members " +
           "WHERE g.id = :id")
    Optional<Group> findByIdWithMembers(@Param("id") String id);
}