package com.equitly.controller;

import com.equitly.model.Expense;
import com.equitly.model.User;
import com.equitly.service.ExpenseService;
import com.equitly.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation
        .AuthenticationPrincipal;
import org.springframework.security.core.userdetails
        .UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;
    private final UserService userService;

    public ExpenseController(
            ExpenseService expenseService,
            UserService userService) {
        this.expenseService = expenseService;
        this.userService = userService;
    }

    // ── Get all expenses ──
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>>
            getExpenses(
            @AuthenticationPrincipal
            UserDetails userDetails,
            @RequestParam(required = false)
            String groupId) {

        User user = userService.getCurrentUser(
                userDetails.getUsername());

        List<Expense> expenses = groupId != null
                ? expenseService.getExpensesForGroup(groupId)
                : expenseService.getExpensesForUser(
                        user.getId());

        return ResponseEntity.ok(
                expenses.stream()
                        .map(this::toMap)
                        .collect(java.util.stream
                                .Collectors.toList()));
    }

    // ── Create expense ──
    @PostMapping
    public ResponseEntity<Map<String, Object>>
            createExpense(
            @AuthenticationPrincipal
            UserDetails userDetails,
            @RequestBody Map<String, Object> body) {

        User user = userService.getCurrentUser(
                userDetails.getUsername());

        Expense expense = expenseService.createExpense(
                user.getId(), body);

        return ResponseEntity.ok(toMap(expense));
    }

    // ── Update expense ──
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>>
            updateExpense(
            @PathVariable String id,
            @AuthenticationPrincipal
            UserDetails userDetails,
            @RequestBody Map<String, Object> body) {

        User user = userService.getCurrentUser(
                userDetails.getUsername());

        Expense expense = expenseService.updateExpense(
                id, user.getId(), body);

        return ResponseEntity.ok(toMap(expense));
    }

    // ── Delete expense ──
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable String id,
            @AuthenticationPrincipal
            UserDetails userDetails) {

        User user = userService.getCurrentUser(
                userDetails.getUsername());

        expenseService.deleteExpense(id, user.getId());

        return ResponseEntity.noContent().build();
    }

    // ── Convert Expense to safe Map ──
    private Map<String, Object> toMap(Expense e) {
        Map<String, Object> map =
                new java.util.LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("description", e.getDescription());
        map.put("amount", e.getAmount());
        map.put("category", e.getCategory());
        map.put("splitType", e.getSplitType());
        map.put("createdAt", e.getCreatedAt());

        if (e.getPaidBy() != null) {
            Map<String, Object> paidBy =
                    new java.util.HashMap<>();
            paidBy.put("id", e.getPaidBy().getId());
            paidBy.put("name", e.getPaidBy().getName());
            paidBy.put("email", e.getPaidBy().getEmail());
            map.put("paidBy", paidBy);
        }

        if (e.getCreatedBy() != null) {
            Map<String, Object> createdBy =
                    new java.util.HashMap<>();
            createdBy.put("id",
                    e.getCreatedBy().getId());
            createdBy.put("name",
                    e.getCreatedBy().getName());
            map.put("createdBy", createdBy);
        }

        if (e.getGroup() != null) {
            Map<String, Object> group =
                    new java.util.HashMap<>();
            group.put("id", e.getGroup().getId());
            group.put("name", e.getGroup().getName());
            map.put("group", group);
        }

        // Splits — include BOTH formats
        if (e.getSplits() != null) {
            List<Map<String, Object>> splits =
                    e.getSplits().stream().map(s -> {
                Map<String, Object> split =
                        new java.util.HashMap<>();
                split.put("userId",
                        s.getUser().getId());
                split.put("userName",
                        s.getUser().getName());
                split.put("amount", s.getAmount());
                split.put("settled", s.isSettled());
                // Also include user object
                Map<String, Object> userObj =
                        new java.util.HashMap<>();
                userObj.put("id", s.getUser().getId());
                userObj.put("name",
                        s.getUser().getName());
                split.put("user", userObj);
                return split;
            }).collect(java.util.stream
                    .Collectors.toList());
            map.put("splits", splits);
        }

        return map;
    }
}