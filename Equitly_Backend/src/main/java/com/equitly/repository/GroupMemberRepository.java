package com.equitly.repository;

import com.equitly.model.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, String> {

    @Query("SELECT gm FROM GroupMember gm " +
           "WHERE gm.group.id = :groupId " +
           "AND gm.user.id = :userId")
    Optional<GroupMember> findByGroupIdAndUserId(
            @Param("groupId") String groupId,
            @Param("userId") String userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM GroupMember gm " +
           "WHERE gm.group.id = :groupId " +
           "AND gm.user.id = :userId")
    void deleteByGroupIdAndUserId(
            @Param("groupId") String groupId,
            @Param("userId") String userId);
}