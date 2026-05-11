package com.equitly.repository;

import com.equitly.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ExpenseRepository
        extends JpaRepository<Expense, String> {

    @Query("SELECT DISTINCT e FROM Expense e " +
           "LEFT JOIN FETCH e.splits s " +
           "LEFT JOIN FETCH s.user " +
           "WHERE e.group.id = :groupId " +
           "ORDER BY e.createdAt DESC")
    List<Expense> findAllByGroupId(
            @Param("groupId") String groupId);

    @Query("SELECT DISTINCT e FROM Expense e " +
           "LEFT JOIN FETCH e.splits s " +
           "LEFT JOIN FETCH s.user " +
           "LEFT JOIN FETCH e.paidBy " +
           "WHERE e.paidBy.id = :userId " +
           "OR s.user.id = :userId " +
           "ORDER BY e.createdAt DESC")
    List<Expense> findAllByUserId(
            @Param("userId") String userId);

    @Query("SELECT e FROM Expense e " +
           "LEFT JOIN FETCH e.splits s " +
           "LEFT JOIN FETCH s.user " +
           "LEFT JOIN FETCH e.paidBy " +
           "LEFT JOIN FETCH e.createdBy " +
           "WHERE e.id = :id")
    Optional<Expense> findByIdWithSplits(
            @Param("id") String id);
    
    @Query("SELECT e FROM Expense e " +
    	       "LEFT JOIN FETCH e.splits s " +
    	       "LEFT JOIN FETCH s.user " +
    	       "LEFT JOIN FETCH e.paidBy " +
    	       "WHERE e.description = :description " +
    	       "AND e.createdAt = :createdAt " +
    	       "AND (e.paidBy.id = :userId " +
    	       "OR EXISTS (SELECT sp FROM ExpenseSplit sp " +
    	       "WHERE sp.expense = e " +
    	       "AND sp.user.id = :userId))")
    	java.util.Optional<com.equitly.model.Expense>
    	        findByDescriptionAndUserId(
    	        @Param("description") String description,
    	        @Param("userId") String userId,
    	        @Param("createdAt")
    	        java.time.LocalDateTime createdAt);
}