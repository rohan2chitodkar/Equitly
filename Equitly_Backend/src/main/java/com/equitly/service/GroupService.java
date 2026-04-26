package com.equitly.service;

import com.equitly.model.*;
import com.equitly.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final ActivityService activityService;
    private final GroupMemberRepository groupMemberRepository;

    public GroupService(GroupRepository groupRepository,
                        UserRepository userRepository,
                        ExpenseRepository expenseRepository,
                        ActivityService activityService,
                        GroupMemberRepository groupMemberRepository) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.expenseRepository = expenseRepository;
        this.activityService = activityService;
        this.groupMemberRepository = groupMemberRepository;
    }

    public List<Group> getGroupsForUser(String userId) {
        List<Group> groups = groupRepository.findAllByMemberId(userId);
        System.out.println("Groups for user " + userId + ": " + groups.size());
        groups.forEach(g -> System.out.println(" - " + g.getName()));
        return groups;
    }

    public Group getById(String groupId, String userId) {
        Group group = groupRepository.findByIdWithMembers(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        boolean isMember = group.getMembers().stream()
                .anyMatch(m -> m.getId().equals(userId));
        if (!isMember) throw new RuntimeException("Access denied");
        return group;
    }

    @Transactional
    public Group createGroup(String creatorId, String name,
                             String emoji, List<String> memberIds) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Group group = new Group();
        group.setName(name);
        group.setEmoji(emoji != null ? emoji : "👥");
        group.setCreatedBy(creator);
        group.getMembers().add(creator);

        if (memberIds != null) {
            for (String memberId : memberIds) {
                userRepository.findById(memberId)
                        .ifPresent(u -> group.getMembers().add(u));
            }
        }

        Group saved = groupRepository.save(group);

        // Track join time for creator
        GroupMember creatorMember = new GroupMember(saved, creator);
        creatorMember.setJoinedAt(saved.getCreatedAt());
        groupMemberRepository.save(creatorMember);

        // Track join time for initial members
        if (memberIds != null) {
            for (String memberId : memberIds) {
                userRepository.findById(memberId).ifPresent(u -> {
                    GroupMember gm = new GroupMember(saved, u);
                    gm.setJoinedAt(saved.getCreatedAt());
                    groupMemberRepository.save(gm);
                });
            }
        }

        // Log activity
        activityService.logGroupCreated(saved.getId(), saved.getName(), creator);

        return saved;
    }

    @Transactional
    public Group addMember(String groupId, String currentUserId,
                           String memberEmail) {
        Group group = groupRepository.findByIdWithMembers(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        boolean isMember = group.getMembers().stream()
                .anyMatch(m -> m.getId().equals(currentUserId));
        if (!isMember) throw new RuntimeException("Access denied");

        User addedBy = userRepository.findById(currentUserId).orElseThrow();
        User newMember = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new RuntimeException(
                        "No user found with email: " + memberEmail));

        boolean alreadyMember = group.getMembers().stream()
                .anyMatch(m -> m.getId().equals(newMember.getId()));
        if (alreadyMember) throw new RuntimeException(
                newMember.getName() + " is already in this group");

        group.getMembers().add(newMember);
        Group saved = groupRepository.save(group);

        // Track exact join time for new member
        GroupMember gm = new GroupMember(saved, newMember);
        gm.setJoinedAt(LocalDateTime.now());
        groupMemberRepository.save(gm);

        // Log activity
        activityService.logMemberAdded(
                saved.getId(), saved.getName(), addedBy, newMember);

        return saved;
    }

    @Transactional
    public Group removeMember(String groupId, String currentUserId,
                              String memberId) {
        Group group = getById(groupId, currentUserId);
        group.getMembers().removeIf(m -> m.getId().equals(memberId));

        // Remove from group_members tracking table
        groupMemberRepository.findByGroupIdAndUserId(groupId, memberId)
                .ifPresent(groupMemberRepository::delete);

        return groupRepository.save(group);
    }

    @Transactional
    public void deleteGroup(String groupId, String currentUserId) {
        Group group = getById(groupId, currentUserId);

        if (!group.getCreatedBy().getId().equals(currentUserId))
            throw new RuntimeException(
                    "Only the group creator can delete it");

        if (!isGroupFullySettled(groupId))
            throw new RuntimeException(
                    "Cannot delete group. All members must settle first.");

        String groupName = group.getName();
        User deletedBy = userRepository.findById(currentUserId)
                .orElseThrow();

        // ── Log BEFORE deleting ──
        // This saves all member IDs in activity_members table
        // So even after group is deleted, all members see this activity
        activityService.logGroupDeletedWithId(
                groupId, groupName, deletedBy);

        // Now delete the group
        groupRepository.delete(group);
    }

    @Transactional
    public void leaveGroup(String groupId, String userId) {
        Group group = getById(groupId, userId);

        if (group.getCreatedBy().getId().equals(userId))
            throw new RuntimeException(
                    "You are the creator. Delete the group instead.");

        if (!isMemberSettledInGroup(groupId, userId))
            throw new RuntimeException(
                    "Settle your balance before leaving.");

        User member = userRepository.findById(userId).orElseThrow();
        String savedGroupName = group.getName();
        String savedGroupId = group.getId();

        activityService.logMemberLeft(savedGroupId, savedGroupName, member);

        group.getMembers().removeIf(m -> m.getId().equals(userId));
        groupRepository.save(group);

        // Remove join tracking
        groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .ifPresent(groupMemberRepository::delete);
    }

    public boolean isGroupFullySettled(String groupId) {
        var expenses = expenseRepository.findAllByGroupId(groupId);
        if (expenses.isEmpty()) return true;

        java.util.Map<String, BigDecimal> netMap = new java.util.HashMap<>();
        for (var expense : expenses) {
            String paidById = expense.getPaidBy().getId();
            for (var split : expense.getSplits()) {
                String splitUserId = split.getUser().getId();
                if (paidById.equals(splitUserId)) continue;
                netMap.merge(paidById, split.getAmount(), BigDecimal::add);
                netMap.merge(splitUserId,
                        split.getAmount().negate(), BigDecimal::add);
            }
        }

        for (BigDecimal balance : netMap.values()) {
            if (balance.abs().compareTo(new BigDecimal("0.01")) > 0)
                return false;
        }
        return true;
    }

    public boolean isMemberSettledInGroup(String groupId, String userId) {
        var expenses = expenseRepository.findAllByGroupId(groupId);
        if (expenses.isEmpty()) return true;

        BigDecimal net = BigDecimal.ZERO;
        for (var expense : expenses) {
            String paidById = expense.getPaidBy().getId();
            for (var split : expense.getSplits()) {
                String splitUserId = split.getUser().getId();
                if (paidById.equals(splitUserId)) continue;
                if (paidById.equals(userId))
                    net = net.add(split.getAmount());
                else if (splitUserId.equals(userId))
                    net = net.subtract(split.getAmount());
            }
        }
        return net.abs().compareTo(new BigDecimal("0.01")) <= 0;
    }
    
    private void logGroupDeletedActivity(String groupId, String groupName,
            User deletedBy,
            List<String> memberIds) {
    	try {
			activityService.logGroupDeleted(groupName, deletedBy);
		} catch (Exception e) {
			System.err.println("Failed to log group deleted: " + e.getMessage());
		}
    }
}