package com.equitly.service;

import com.equitly.model.*;
import com.equitly.repository.ExpenseRepository;
import com.equitly.repository.GroupRepository;
import com.equitly.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final ActivityService activityService;

    public ExpenseService(ExpenseRepository expenseRepository,
                          UserRepository userRepository,
                          GroupRepository groupRepository,
                          ActivityService activityService) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.activityService = activityService;
    }

    public List<Expense> getExpensesForUser(String userId) {
        return expenseRepository.findAllByUserId(userId);
    }

    public List<Expense> getExpensesForGroup(String groupId) {
        return expenseRepository.findAllByGroupId(groupId);
    }

    @Transactional
    public Expense createExpense(String creatorId,
                                 String description,
                                 BigDecimal amount,
                                 String category,
                                 String paidById,
                                 String groupId,
                                 Expense.SplitType splitType,
                                 List<Map<String, Object>> splits) {

        if (description == null || description.isBlank())
            throw new RuntimeException("Description is required");
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new RuntimeException("Amount must be greater than zero");
        if (paidById == null || paidById.isBlank())
            throw new RuntimeException("Paid by user is required");
        if (splits == null || splits.isEmpty())
            throw new RuntimeException("Splits are required");

        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("Creator not found"));
        User paidBy = userRepository.findById(paidById)
                .orElseThrow(() -> new RuntimeException("Payer not found"));

        Expense expense = new Expense();
        expense.setDescription(description);
        expense.setAmount(amount);
        expense.setCategory(category != null ? category : "other");
        expense.setSplitType(splitType != null ? splitType : Expense.SplitType.EQUAL);
        expense.setPaidBy(paidBy);
        expense.setCreatedBy(creator);

        if (groupId != null && !groupId.isBlank()) {
            groupRepository.findById(groupId).ifPresent(expense::setGroup);
        }

        for (Map<String, Object> splitData : splits) {
            String userId = (String) splitData.get("userId");
            if (userId == null || userId.isBlank()) continue;
            BigDecimal splitAmount = new BigDecimal(
                    splitData.get("amount").toString());
            User splitUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException(
                            "Split user not found: " + userId));
            ExpenseSplit split = new ExpenseSplit();
            split.setExpense(expense);
            split.setUser(splitUser);
            split.setAmount(splitAmount);
            expense.getSplits().add(split);
        }

        Expense saved = expenseRepository.save(expense);

        // Log activity
        activityService.logExpenseAdded(saved, creatorId);

        return saved;
    }

    @Transactional
    public Expense updateExpense(String expenseId, String userId,
                                 String description, BigDecimal amount,
                                 String category, String paidById,
                                 Expense.SplitType splitType,
                                 List<Map<String, Object>> splits) {

        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (!expense.getCreatedBy().getId().equals(userId))
            throw new RuntimeException("Not authorized to edit this expense");

        expense.setDescription(description);
        expense.setAmount(amount);
        expense.setCategory(category);
        expense.setSplitType(splitType);

        User paidBy = userRepository.findById(paidById).orElseThrow();
        expense.setPaidBy(paidBy);

        expense.getSplits().clear();
        for (Map<String, Object> splitData : splits) {
            String uid = (String) splitData.get("userId");
            BigDecimal splitAmount = new BigDecimal(
                    splitData.get("amount").toString());
            User user = userRepository.findById(uid).orElseThrow();
            ExpenseSplit split = new ExpenseSplit();
            split.setExpense(expense);
            split.setUser(user);
            split.setAmount(splitAmount);
            expense.getSplits().add(split);
        }

        Expense updated = expenseRepository.save(expense);

        // Log activity
        activityService.logExpenseUpdated(updated);

        return updated;
    }

    @Transactional
    public void deleteExpense(String expenseId, String userId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        if (!expense.getCreatedBy().getId().equals(userId))
            throw new RuntimeException("Not authorized to delete this expense");

        // Log before deleting
        activityService.logExpenseDeleted(expense);

        expenseRepository.delete(expense);
    }
}