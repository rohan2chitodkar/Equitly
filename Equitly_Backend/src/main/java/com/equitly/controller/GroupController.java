package com.equitly.controller;

import com.equitly.model.*;
import com.equitly.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation
        .AuthenticationPrincipal;
import org.springframework.security.core.userdetails
        .UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;
    private final BalanceService balanceService;
    private final UserService userService;
    private final ExpenseService expenseService;

    public GroupController(
            GroupService groupService,
            BalanceService balanceService,
            UserService userService,
            ExpenseService expenseService) {
        this.groupService = groupService;
        this.balanceService = balanceService;
        this.userService = userService;
        this.expenseService = expenseService;
    }

    // ── Get all groups for current user ──
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>>
            getGroups(
            @AuthenticationPrincipal
            UserDetails userDetails) {

        User user = userService.getCurrentUser(
                userDetails.getUsername());
        List<Group> groups = groupService
                .getGroupsForUser(user.getId());

        List<Map<String, Object>> response =
                groups.stream()
                .map(g -> buildGroupMap(g, false))
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // ── Get single group with expenses ──
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getGroup(
            @PathVariable String id,
            @AuthenticationPrincipal
            UserDetails userDetails) {

        User user = userService.getCurrentUser(
                userDetails.getUsername());
        Group group = groupService.getById(
                id, user.getId());

        // Load expenses separately
        List<Expense> expenses =
                expenseService.getExpensesForGroup(id);

        Map<String, Object> response =
                buildGroupMap(group, false);

        // Add expenses
        List<Map<String, Object>> expenseList =
                expenses.stream()
                .map(this::buildExpenseMap)
                .collect(Collectors.toList());
        response.put("expenses", expenseList);

        return ResponseEntity.ok(response);
    }

    // ── Create group ──
    @PostMapping
    public ResponseEntity<Map<String, Object>>
            createGroup(
            @AuthenticationPrincipal
            UserDetails userDetails,
            @RequestBody Map<String, Object> body) {

        User user = userService.getCurrentUser(
                userDetails.getUsername());

        String name = (String) body.get("name");
        String emoji = (String) body.get("emoji");

        @SuppressWarnings("unchecked")
        List<String> memberIds =
                (List<String>) body.get("memberIds");

        Group group = groupService.createGroup(
                user.getId(), name, emoji, memberIds);

        return ResponseEntity.ok(
                buildGroupMap(group, false));
    }

    // ── Add member ──
    @PostMapping("/{id}/members")
    public ResponseEntity<Map<String, Object>>
            addMember(
            @PathVariable String id,
            @AuthenticationPrincipal
            UserDetails userDetails,
            @RequestBody Map<String, String> body) {

        User user = userService.getCurrentUser(
                userDetails.getUsername());

        Group group = groupService.addMember(
                id, user.getId(), body.get("email"));

        return ResponseEntity.ok(
                buildGroupMap(group, false));
    }

    // ── Remove member ──
    @DeleteMapping("/{id}/members/{memberId}")
    public ResponseEntity<Map<String, Object>>
            removeMember(
            @PathVariable String id,
            @PathVariable String memberId,
            @AuthenticationPrincipal
            UserDetails userDetails) {

        User user = userService.getCurrentUser(
                userDetails.getUsername());

        Group group = groupService.removeMember(
                id, user.getId(), memberId);

        return ResponseEntity.ok(
                buildGroupMap(group, false));
    }

    // ── Leave group ──
    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leaveGroup(
            @PathVariable String id,
            @AuthenticationPrincipal
            UserDetails userDetails) {

        User user = userService.getCurrentUser(
                userDetails.getUsername());

        groupService.leaveGroup(id, user.getId());

        return ResponseEntity.noContent().build();
    }

    // ── Delete group ──
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable String id,
            @AuthenticationPrincipal
            UserDetails userDetails) {

        User user = userService.getCurrentUser(
                userDetails.getUsername());

        groupService.deleteGroup(id, user.getId());

        return ResponseEntity.noContent().build();
    }

    // ── Get group balances (simplified) ──
    @GetMapping("/{id}/balances")
    public ResponseEntity<List<Map<String, Object>>>
            getGroupBalances(
            @PathVariable String id,
            @AuthenticationPrincipal
            UserDetails userDetails) {

        User user = userService.getCurrentUser(
                userDetails.getUsername());

        List<BalanceService.BalanceEntry> balances =
                balanceService.getSimplifiedGroupBalances(
                        id, user.getId());

        // Convert to plain maps to avoid serialization issues
        List<Map<String, Object>> response =
                balances.stream().map(b -> {
                    Map<String, Object> map =
                            new java.util.HashMap<>();
                    map.put("friendId", b.getFriendId());
                    map.put("friendName", b.getFriendName());
                    map.put("friendEmail",
                            b.getFriendEmail());
                    map.put("netAmount", b.getNetAmount());
                    return map;
                }).collect(java.util.stream
                        .Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // ── Check if group is settled ──
    @GetMapping("/{id}/settled")
    public ResponseEntity<Map<String, Object>>
            checkSettled(
            @PathVariable String id,
            @AuthenticationPrincipal
            UserDetails userDetails) {

        User user = userService.getCurrentUser(
                userDetails.getUsername());

        boolean fullySettled =
                groupService.isGroupFullySettled(id);
        boolean memberSettled =
                groupService.isMemberSettledInGroup(
                        id, user.getId());

        Map<String, Object> result =
                new java.util.HashMap<>();
        result.put("fullySettled", fullySettled);
        result.put("memberSettled", memberSettled);

        return ResponseEntity.ok(result);
    }

    // ── Helper — build group response map ──
    private Map<String, Object> buildGroupMap(
            Group g, boolean includeExpenses) {

        Map<String, Object> map =
                new java.util.LinkedHashMap<>();
        map.put("id", g.getId());
        map.put("name", g.getName());
        map.put("emoji", g.getEmoji());
        map.put("createdAt", g.getCreatedAt());

        // createdBy
        if (g.getCreatedBy() != null) {
            Map<String, Object> createdBy =
                    new java.util.HashMap<>();
            createdBy.put("id",
                    g.getCreatedBy().getId());
            createdBy.put("name",
                    g.getCreatedBy().getName());
            createdBy.put("email",
                    g.getCreatedBy().getEmail());
            map.put("createdBy", createdBy);
        }

        // members
        List<Map<String, Object>> members =
                new java.util.ArrayList<>();
        if (g.getMembers() != null) {
            g.getMembers().forEach(m -> {
                Map<String, Object> member =
                        new java.util.HashMap<>();
                member.put("id", m.getId());
                member.put("name", m.getName());
                member.put("email", m.getEmail());
                members.add(member);
            });
        }
        map.put("members", members);
        map.put("expenseCount",
                g.getExpenses() != null
                        ? g.getExpenses().size() : 0);

        if (includeExpenses && g.getExpenses() != null) {
            map.put("expenses",
                    g.getExpenses().stream()
                    .map(this::buildExpenseMap)
                    .collect(Collectors.toList()));
        } else {
            map.put("expenses", new ArrayList<>());
        }

        return map;
    }

    // ── Helper — build expense response map ──
    private Map<String, Object> buildExpenseMap(Expense e) {
	    Map<String, Object> exp =
	            new java.util.LinkedHashMap<>();
	    exp.put("id", e.getId());
	    exp.put("description", e.getDescription());
	    exp.put("amount", e.getAmount());
	    exp.put("category", e.getCategory());
	    exp.put("splitType", e.getSplitType());
	    exp.put("createdAt", e.getCreatedAt());
	
	    if (e.getPaidBy() != null) {
	        Map<String, Object> paidBy =
	                new java.util.HashMap<>();
	        paidBy.put("id", e.getPaidBy().getId());
	        paidBy.put("name", e.getPaidBy().getName());
	        exp.put("paidBy", paidBy);
	    }
	
	    if (e.getCreatedBy() != null) {
	        Map<String, Object> createdBy =
	                new java.util.HashMap<>();
	        createdBy.put("id",
	                e.getCreatedBy().getId());
	        createdBy.put("name",
	                e.getCreatedBy().getName());
	        exp.put("createdBy", createdBy);
	    }
	
	    if (e.getGroup() != null) {
	        Map<String, Object> group =
	                new java.util.HashMap<>();
	        group.put("id", e.getGroup().getId());
	        group.put("name", e.getGroup().getName());
	        exp.put("group", group);
	    }
	
	    // ── Splits — include BOTH formats ──
	    if (e.getSplits() != null) {
	        List<Map<String, Object>> splits =
	                e.getSplits().stream()
	                .map(s -> {
	                    Map<String, Object> split =
	                            new java.util.HashMap<>();
	                    // Format 1 — userId (flat)
	                    split.put("userId",
	                            s.getUser().getId());
	                    split.put("userName",
	                            s.getUser().getName());
	                    split.put("amount",
	                            s.getAmount());
	                    split.put("settled",
	                            s.isSettled());
	                    // Format 2 — user object (nested)
	                    Map<String, Object> userObj =
	                            new java.util.HashMap<>();
	                    userObj.put("id",
	                            s.getUser().getId());
	                    userObj.put("name",
	                            s.getUser().getName());
	                    split.put("user", userObj);
	                    return split;
	                })
	                .collect(java.util.stream
	                        .Collectors.toList());
	        exp.put("splits", splits);
	    }
	
	    return exp;
	}
}