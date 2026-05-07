package com.equitly.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.equitly.model.Expense;
import com.equitly.model.Group;
import com.equitly.model.User;
import com.equitly.service.BalanceService;
import com.equitly.service.ExpenseService;
import com.equitly.service.GroupService;
import com.equitly.service.UserService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;
    private final BalanceService balanceService;
    private final UserService userService;
    private final ExpenseService expenseService;

    public GroupController(GroupService groupService,
                           BalanceService balanceService,
                           UserService userService,
                           ExpenseService expenseService) {
        this.groupService = groupService;
        this.balanceService = balanceService;
        this.userService = userService;
        this.expenseService = expenseService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getGroups(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getCurrentUser(userDetails.getUsername());
        List<Group> groups = groupService.getGroupsForUser(user.getId());

        List<Map<String, Object>> response = groups.stream()
                .map(g -> {
                    Map<String, Object> map = new java.util.LinkedHashMap<>();
                    map.put("id", g.getId());
                    map.put("name", g.getName());
                    map.put("emoji", g.getEmoji());
                    map.put("createdAt", g.getCreatedAt());

                    // Members count
                    List<Map<String, Object>> members = new java.util.ArrayList<>();
                    if (g.getMembers() != null) {
                        g.getMembers().forEach(m -> {
                            Map<String, Object> member = new java.util.HashMap<>();
                            member.put("id", m.getId());
                            member.put("name", m.getName());
                            member.put("email", m.getEmail());
                            members.add(member);
                        });
                    }
                    map.put("members", members);

                    // CreatedBy
                    if (g.getCreatedBy() != null) {
                        Map<String, Object> createdBy = new java.util.HashMap<>();
                        createdBy.put("id", g.getCreatedBy().getId());
                        createdBy.put("name", g.getCreatedBy().getName());
                        map.put("createdBy", createdBy);
                    }

                    // Expense count
                    map.put("expenseCount",
                            g.getExpenses() != null ? g.getExpenses().size() : 0);

                    return map;
                })
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(response);
    }

	@GetMapping("/{id}")
	public ResponseEntity<Map<String, Object>> getGroup(
	        @PathVariable String id,
	        @AuthenticationPrincipal UserDetails userDetails) {
	    User user = userService.getCurrentUser(userDetails.getUsername());
	    Group group = groupService.getById(id, user.getId());

	    // Load expenses separately to avoid circular reference
	    List<Expense> expenses = expenseService.getExpensesForGroup(id);

	    // Build response manually
	    Map<String, Object> response = new java.util.LinkedHashMap<>();
	    response.put("id", group.getId());
	    response.put("name", group.getName());
	    response.put("emoji", group.getEmoji());
	    response.put("createdAt", group.getCreatedAt());

	    // CreatedBy
	    if (group.getCreatedBy() != null) {
	        Map<String, Object> createdBy = new java.util.HashMap<>();
	        createdBy.put("id", group.getCreatedBy().getId());
	        createdBy.put("name", group.getCreatedBy().getName());
	        createdBy.put("email", group.getCreatedBy().getEmail());
	        response.put("createdBy", createdBy);
	    }

	    // Members
	    List<Map<String, Object>> members = group.getMembers().stream()
	            .map(m -> {
	                Map<String, Object> member = new java.util.HashMap<>();
	                member.put("id", m.getId());
	                member.put("name", m.getName());
	                member.put("email", m.getEmail());
	                return member;
	            })
	            .collect(java.util.stream.Collectors.toList());
	    response.put("members", members);

	    // Expenses — build simple map to avoid circular reference
	    List<Map<String, Object>> expenseList = expenses.stream()
	            .map(e -> {
	                Map<String, Object> exp = new java.util.LinkedHashMap<>();
	                exp.put("id", e.getId());
	                exp.put("description", e.getDescription());
	                exp.put("amount", e.getAmount());
	                exp.put("category", e.getCategory());
	                exp.put("splitType", e.getSplitType());
	                exp.put("createdAt", e.getCreatedAt());

	                if (e.getPaidBy() != null) {
	                    Map<String, Object> paidBy = new java.util.HashMap<>();
	                    paidBy.put("id", e.getPaidBy().getId());
	                    paidBy.put("name", e.getPaidBy().getName());
	                    exp.put("paidBy", paidBy);
	                }

	                List<Map<String, Object>> splits = e.getSplits().stream()
	                        .map(s -> {
	                            Map<String, Object> split = new java.util.HashMap<>();
	                            split.put("userId", s.getUser().getId());
	                            split.put("userName", s.getUser().getName());
	                            split.put("amount", s.getAmount());
	                            split.put("settled", s.isSettled());
	                            return split;
	                        })
	                        .collect(java.util.stream.Collectors.toList());
	                exp.put("splits", splits);

	                return exp;
	            })
	            .collect(java.util.stream.Collectors.toList());
	    response.put("expenses", expenseList);

	    return ResponseEntity.ok(response);
	}

    @PostMapping
    public ResponseEntity<Group> createGroup(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        User user = userService.getCurrentUser(userDetails.getUsername());
        String name = (String) body.get("name");
        String emoji = (String) body.get("emoji");

        @SuppressWarnings("unchecked")
        List<String> memberIds = (List<String>) body.get("memberIds");

        Group group = groupService.createGroup(user.getId(), name, emoji, memberIds);
        return ResponseEntity.ok(group);
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<Group> addMember(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        User user = userService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(groupService.addMember(id, user.getId(), body.get("email")));
    }

    @DeleteMapping("/{id}/members/{memberId}")
    public ResponseEntity<Group> removeMember(
            @PathVariable String id,
            @PathVariable String memberId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(groupService.removeMember(id, user.getId(), memberId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getCurrentUser(userDetails.getUsername());
        groupService.deleteGroup(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/balances")
    public ResponseEntity<List<BalanceService.BalanceEntry>> getGroupBalances(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getCurrentUser(userDetails.getUsername());
        // Use simplified balances instead of raw balances
        return ResponseEntity.ok(
                balanceService.getSimplifiedGroupBalances(id, user.getId()));
    }
    
    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leaveGroup(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getCurrentUser(userDetails.getUsername());
        groupService.leaveGroup(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/settled")
    public ResponseEntity<Map<String, Object>> checkSettled(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getCurrentUser(
                userDetails.getUsername());

        boolean fullySettled = groupService.isGroupFullySettled(id);
        boolean memberSettled = groupService
                .isMemberSettledInGroup(id, user.getId());

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("fullySettled", fullySettled);
        result.put("memberSettled", memberSettled);

        return ResponseEntity.ok(result);
    }
}
