package com.equitly.repository;

import com.equitly.model.ExpenseSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ExpenseSplitRepository
        extends JpaRepository<ExpenseSplit, String> {

    @Modifying
    @Transactional
    @Query("DELETE FROM ExpenseSplit s " +
           "WHERE s.expense.id = :expenseId")
    void deleteByExpenseId(
            @Param("expenseId") String expenseId);
}