package com.equitly.service;

import com.equitly.model.*;
import com.equitly.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final ActivityService activityService;

    public ExpenseService(
            ExpenseRepository expenseRepository,
            ExpenseSplitRepository expenseSplitRepository,
            UserRepository userRepository,
            GroupRepository groupRepository,
            ActivityService activityService) {
        this.expenseRepository = expenseRepository;
        this.expenseSplitRepository = expenseSplitRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.activityService = activityService;
    }

    // ── Get all expenses for user ──
    public List<Expense> getExpensesForUser(String userId) {
        return expenseRepository.findAllByUserId(userId);
    }

    // ── Get all expenses for group ──
    public List<Expense> getExpensesForGroup(String groupId) {
        return expenseRepository.findAllByGroupId(groupId);
    }

    // ── Create expense ──
    @Transactional
    public Expense createExpense(String currentUserId,
                                 Map<String, Object> request) {
        String paidById = (String) request.get("paidById");
        String description = (String) request.get("description");
        String categoryRaw = (String) request.get("category");
        String splitTypeRaw = (String) request.get("splitType");
        String groupId = (String) request.get("groupId");

        // Handle amount
        BigDecimal amount;
        Object amtObj = request.get("amount");
        if (amtObj instanceof Number) {
            amount = new BigDecimal(amtObj.toString());
        } else {
            amount = new BigDecimal(amtObj.toString());
        }

        // Handle splitType safely
        String splitType = "EQUAL";
        if (splitTypeRaw != null && !splitTypeRaw.isBlank()) {
            splitType = splitTypeRaw.toUpperCase();
        }

        String category = categoryRaw != null
                ? categoryRaw : "other";

        User paidBy = userRepository.findById(
                paidById != null ? paidById : currentUserId)
                .orElseThrow(() ->
                        new RuntimeException("Payer not found"));

        User createdBy = userRepository
                .findById(currentUserId)
                .orElseThrow();

        Expense expense = new Expense();
        expense.setDescription(description);
        expense.setAmount(amount);
        expense.setCategory(category);
        expense.setSplitType(splitType);
        expense.setPaidBy(paidBy);
        expense.setCreatedBy(createdBy);

        if (groupId != null && !groupId.isBlank()) {
            groupRepository.findById(groupId)
                    .ifPresent(expense::setGroup);
        }

        Expense saved = expenseRepository.save(expense);

     // Save splits FIRST
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> splits =
                (List<Map<String, Object>>) request
                        .get("splits");

        List<String> splitUserIds =
                new java.util.ArrayList<>();

        if (splits != null) {
            for (Map<String, Object> splitData : splits) {
                String userId = (String) splitData
                        .get("userId");
                Object splitAmtObj =
                        splitData.get("amount");
                BigDecimal splitAmount =
                        new BigDecimal(
                                splitAmtObj.toString());

                User splitUser = userRepository
                        .findById(userId)
                        .orElse(null);
                if (splitUser == null) continue;

                ExpenseSplit split = new ExpenseSplit();
                split.setExpense(saved);
                split.setUser(splitUser);
                split.setAmount(splitAmount);
                expenseSplitRepository.save(split);

                // Collect split user IDs
                if (!splitUserIds.contains(userId)) {
                    splitUserIds.add(userId);
                }
            }
        }

        // Reload with splits
        Expense withSplits = expenseRepository
                .findByIdWithSplits(saved.getId())
                .orElse(saved);

        // Log activity with explicit user IDs
        // Pass splitUserIds directly so they are
        // never missed even if splits don't load
        activityService.logExpenseAddedWithUsers(
                withSplits, currentUserId, splitUserIds);

        return withSplits;
    }

    // ── Update expense ──
    @Transactional
    public Expense updateExpense(String expenseId,
                                 String currentUserId,
                                 Map<String, Object> request) {
        Expense expense = expenseRepository
                .findById(expenseId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Expense not found"));

        if (!expense.getCreatedBy().getId()
                .equals(currentUserId)) {
            throw new RuntimeException(
                    "Not authorized to edit this expense");
        }

        // Update fields
        if (request.containsKey("description")) {
            expense.setDescription(
                    (String) request.get("description"));
        }
        if (request.containsKey("amount")) {
            expense.setAmount(new BigDecimal(
                    request.get("amount").toString()));
        }
        if (request.containsKey("category")) {
            expense.setCategory(
                    (String) request.get("category"));
        }
        if (request.containsKey("splitType")) {
            String st = (String) request.get("splitType");
            if (st != null && !st.isBlank()) {
                expense.setSplitType(st.toUpperCase());
            }
        }
        if (request.containsKey("paidById")) {
            String paidById = (String) request
                    .get("paidById");
            userRepository.findById(paidById)
                    .ifPresent(expense::setPaidBy);
        }

        Expense saved = expenseRepository.save(expense);

        // Update splits
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> splits =
                (List<Map<String, Object>>) request
                        .get("splits");

        if (splits != null) {
            // Delete old splits
            expenseSplitRepository.deleteByExpenseId(
                    expenseId);

            // Save new splits
            for (Map<String, Object> splitData : splits) {
                String userId = (String) splitData
                        .get("userId");
                BigDecimal splitAmount = new BigDecimal(
                        splitData.get("amount").toString());

                User splitUser = userRepository
                        .findById(userId)
                        .orElse(null);
                if (splitUser == null) continue;

                ExpenseSplit split = new ExpenseSplit();
                split.setExpense(saved);
                split.setUser(splitUser);
                split.setAmount(splitAmount);
                expenseSplitRepository.save(split);
            }
        }

        // Log activity
        activityService.logExpenseUpdated(saved);

        return expenseRepository
                .findByIdWithSplits(saved.getId())
                .orElse(saved);
    }

    // ── Delete expense ──
    @Transactional
    public void deleteExpense(String expenseId,
                              String currentUserId) {
        Expense expense = expenseRepository
                .findById(expenseId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Expense not found"));

        if (!expense.getCreatedBy().getId()
                .equals(currentUserId)) {
            throw new RuntimeException(
                    "Not authorized to delete this expense");
        }

        // Log before delete
        activityService.logExpenseDeleted(expense);

        expenseRepository.delete(expense);
    }
}