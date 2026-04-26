package com.equitly.repository;

import com.equitly.model.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SettlementRepository
        extends JpaRepository<Settlement, String> {

    @Query("SELECT s FROM Settlement s " +
           "WHERE s.payer.id = :userId " +
           "OR s.payee.id = :userId " +
           "ORDER BY s.createdAt DESC")
    List<Settlement> findAllByUserId(@Param("userId") String userId);

    @Query("SELECT s FROM Settlement s " +
           "WHERE (s.payer.id = :userId OR s.payee.id = :userId) " +
           "AND s.group.id = :groupId " +
           "ORDER BY s.createdAt DESC")
    List<Settlement> findAllByUserIdAndGroupId(
            @Param("userId") String userId,
            @Param("groupId") String groupId);
}