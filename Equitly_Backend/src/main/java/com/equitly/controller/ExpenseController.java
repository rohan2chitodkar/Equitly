package com.equitly.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.equitly.model.Expense;
import com.equitly.model.User;
import com.equitly.service.ExpenseService;
import com.equitly.service.UserService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;
    private final UserService userService;
    
    public ExpenseController(ExpenseService expenseService, UserService userService) {
		this.expenseService = expenseService;
		this.userService = userService;
	}

	@GetMapping
    public ResponseEntity<List<Expense>> getExpenses(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String groupId) {
        User user = userService.getCurrentUser(userDetails.getUsername());
        List<Expense> expenses = groupId != null
                ? expenseService.getExpensesForGroup(groupId)
                : expenseService.getExpensesForUser(user.getId());
        return ResponseEntity.ok(expenses);
    }

    @PostMapping
    public ResponseEntity<Expense> createExpense(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        User user = userService.getCurrentUser(userDetails.getUsername());

        String description = (String) body.get("description");
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String category = (String) body.get("category");
        String paidById = (String) body.get("paidById");
        String groupId = (String) body.get("groupId");
        Expense.SplitType splitType = body.get("splitType") != null
                ? Expense.SplitType.valueOf(
                    body.get("splitType").toString().toUpperCase())
                : Expense.SplitType.EQUAL;

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> splits = (List<Map<String, Object>>) body.get("splits");

        Expense expense = expenseService.createExpense(
                user.getId(), description, amount, category, paidById, groupId, splitType, splits);
        return ResponseEntity.ok(expense);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Expense> updateExpense(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {

        User user = userService.getCurrentUser(userDetails.getUsername());

        String description = (String) body.get("description");
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String category = (String) body.get("category");
        String paidById = (String) body.get("paidById");

        Expense.SplitType splitType = body.get("splitType") != null
                ? Expense.SplitType.valueOf(
                    body.get("splitType").toString().toUpperCase())
                : Expense.SplitType.EQUAL;

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> splits =
                (List<Map<String, Object>>) body.get("splits");

        Expense updated = expenseService.updateExpense(
                id, user.getId(), description, amount,
                category, paidById, splitType, splits);

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getCurrentUser(userDetails.getUsername());
        expenseService.deleteExpense(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/activity")
    public ResponseEntity<List<Map<String, Object>>> getActivity(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getCurrentUser(userDetails.getUsername());
        List<Expense> expenses = expenseService.getExpensesForUser(user.getId());

        List<Map<String, Object>> activity = new java.util.ArrayList<>();
        for (Expense e : expenses) {
            Map<String, Object> item = new java.util.HashMap<>();
            item.put("type", "expense");
            item.put("description", e.getPaidBy().getName() + " added \"" + e.getDescription() + "\" — ₹" + e.getAmount());
            item.put("createdAt", e.getCreatedAt().toString());
            activity.add(item);
        }

        return ResponseEntity.ok(activity);
    }
}
