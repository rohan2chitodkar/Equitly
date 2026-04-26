package com.equitly.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.equitly.model.Expense;

import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, String> {

    @Query("SELECT DISTINCT e FROM Expense e " +
           "JOIN FETCH e.paidBy " +
           "JOIN FETCH e.splits s " +
           "JOIN FETCH s.user " +
           "WHERE e.createdBy.id = :userId OR s.user.id = :userId " +
           "ORDER BY e.createdAt DESC")
    List<Expense> findAllByUserId(@Param("userId") String userId);

    @Query("SELECT DISTINCT e FROM Expense e " +
           "JOIN FETCH e.paidBy " +
           "JOIN FETCH e.splits s " +
           "JOIN FETCH s.user " +
           "WHERE e.group.id = :groupId " +
           "ORDER BY e.createdAt DESC")
    List<Expense> findAllByGroupId(@Param("groupId") String groupId);
}
