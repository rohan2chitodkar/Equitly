package com.equitly.service;

import com.equitly.dto.ActivityResponseDto;
import com.equitly.model.*;
import com.equitly.repository.ActivityMemberRepository;
import com.equitly.repository.ActivityRepository;
import com.equitly.repository.GroupRepository;
import com.equitly.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final ActivityMemberRepository activityMemberRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    public ActivityService(ActivityRepository activityRepository,
                           ActivityMemberRepository activityMemberRepository,
                           GroupRepository groupRepository,
                           UserRepository userRepository) {
        this.activityRepository = activityRepository;
        this.activityMemberRepository = activityMemberRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
    }

    // ── Helper — save who can see this activity ──
    private void saveActivityMembers(Activity activity,
                                     List<String> userIds) {
        for (String userId : userIds) {
            ActivityMember am = new ActivityMember(activity, userId);
            activityMemberRepository.save(am);
        }
    }

    // ── Helper — get all member IDs of a group ──
    private List<String> getGroupMemberIds(String groupId) {
        return groupRepository.findByIdWithMembers(groupId)
                .map(g -> g.getMembers().stream()
                        .map(User::getId)
                        .collect(Collectors.toList()))
                .orElse(new ArrayList<>());
    }

    // ── Get all activities for user ──
    public List<Activity> getActivitiesForUser(String userId) {
        try {
            return activityRepository.findAllByUserId(userId);
        } catch (Exception e) {
            System.err.println("Failed to fetch activities: "
                    + e.getMessage());
            return new ArrayList<>();
        }
    }

    // ── Get activities as DTO ──
    public List<ActivityResponseDto> getActivitiesForUserAsDto(
            String userId) {
        try {
            return activityRepository.findAllByUserId(userId)
                    .stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Failed to fetch activities as DTO: "
                    + e.getMessage());
            return new ArrayList<>();
        }
    }

    // ── Convert Activity to DTO ──
    public ActivityResponseDto toDto(Activity a) {
        ActivityResponseDto dto = new ActivityResponseDto();
        dto.setId(a.getId());
        dto.setType(a.getType());
        dto.setDescription(a.getDescription());
        dto.setGroupName(a.getGroupName());
        dto.setExpenseDescription(a.getExpenseDescription());
        dto.setAmount(a.getAmount());
        dto.setYourShare(a.getYourShare());
        dto.setYourBalance(a.getYourBalance());
        dto.setTargetUserId(a.getTargetUserId());
        dto.setTargetUserName(a.getTargetUserName());
        dto.setCreatedAt(a.getCreatedAt());
        if (a.getPerformedBy() != null) {
            dto.setPerformedById(a.getPerformedBy().getId());
            dto.setPerformedByName(a.getPerformedBy().getName());
        }
        return dto;
    }

    // ── Log expense added ──
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logExpenseAdded(Expense expense, String currentUserId) {
        try {
            BigDecimal yourShare = BigDecimal.ZERO;
            BigDecimal yourBalance = BigDecimal.ZERO;

            if (expense.getSplits() != null) {
                for (ExpenseSplit split : expense.getSplits()) {
                    if (split.getUser().getId().equals(currentUserId)) {
                        yourShare = split.getAmount();
                        break;
                    }
                }
            }

            boolean youPaid = expense.getPaidBy() != null &&
                    expense.getPaidBy().getId().equals(currentUserId);

            yourBalance = youPaid
                    ? expense.getAmount().subtract(yourShare)
                    : yourShare.negate();

            Activity activity = new Activity();
            activity.setType("EXPENSE_ADDED");
            activity.setPerformedBy(expense.getCreatedBy());
            activity.setExpenseDescription(expense.getDescription());
            activity.setAmount(expense.getAmount());
            activity.setYourShare(yourShare);
            activity.setYourBalance(yourBalance);
            activity.setGroupName(expense.getGroup() != null
                    ? expense.getGroup().getName() : null);
            activity.setOriginalGroupId(expense.getGroup() != null
                    ? expense.getGroup().getId() : null);
            activity.setDescription(
                    "{performer} added \"{expense}\"" +
                    (expense.getGroup() != null
                            ? " in " + expense.getGroup().getName()
                            : "")
            );

            if (expense.getGroup() != null) {
                groupRepository.findById(expense.getGroup().getId())
                        .ifPresent(activity::setGroup);
            }

            Activity saved = activityRepository.save(activity);

            // Save who can see this activity
            List<String> visibleTo = new ArrayList<>();
            // Add all split members
            if (expense.getSplits() != null) {
                expense.getSplits().forEach(s ->
                        visibleTo.add(s.getUser().getId()));
            }
            // Add payer if not already included
            if (expense.getPaidBy() != null &&
                    !visibleTo.contains(expense.getPaidBy().getId())) {
                visibleTo.add(expense.getPaidBy().getId());
            }
            // Add creator if not already included
            if (expense.getCreatedBy() != null &&
                    !visibleTo.contains(expense.getCreatedBy().getId())) {
                visibleTo.add(expense.getCreatedBy().getId());
            }

            saveActivityMembers(saved, visibleTo);

        } catch (Exception e) {
            System.err.println("Failed to log expense added: "
                    + e.getMessage());
        }
    }

    // ── Log expense updated ──
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logExpenseUpdated(Expense expense) {
        try {
            Activity activity = new Activity();
            activity.setType("EXPENSE_UPDATED");
            activity.setPerformedBy(expense.getCreatedBy());
            activity.setExpenseDescription(expense.getDescription());
            activity.setAmount(expense.getAmount());
            activity.setGroupName(expense.getGroup() != null
                    ? expense.getGroup().getName() : null);
            activity.setOriginalGroupId(expense.getGroup() != null
                    ? expense.getGroup().getId() : null);
            activity.setDescription(
                    "{performer} updated \"{expense}\"" +
                    (expense.getGroup() != null
                            ? " in " + expense.getGroup().getName()
                            : "")
            );

            if (expense.getGroup() != null) {
                groupRepository.findById(expense.getGroup().getId())
                        .ifPresent(activity::setGroup);
            }

            Activity saved = activityRepository.save(activity);

            // Save members who can see this
            List<String> visibleTo = new ArrayList<>();
            if (expense.getSplits() != null) {
                expense.getSplits().forEach(s ->
                        visibleTo.add(s.getUser().getId()));
            }
            if (expense.getCreatedBy() != null &&
                    !visibleTo.contains(
                            expense.getCreatedBy().getId())) {
                visibleTo.add(expense.getCreatedBy().getId());
            }

            saveActivityMembers(saved, visibleTo);

        } catch (Exception e) {
            System.err.println("Failed to log expense updated: "
                    + e.getMessage());
        }
    }

    // ── Log expense deleted ──
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logExpenseDeleted(Expense expense) {
        try {
            Activity activity = new Activity();
            activity.setType("EXPENSE_DELETED");
            activity.setPerformedBy(expense.getCreatedBy());
            activity.setExpenseDescription(expense.getDescription());
            activity.setAmount(expense.getAmount());
            activity.setGroupName(expense.getGroup() != null
                    ? expense.getGroup().getName() : null);
            activity.setDescription(
                    "{performer} deleted \"{expense}\""
            );

            Activity saved = activityRepository.save(activity);

            // Save members
            List<String> visibleTo = new ArrayList<>();
            if (expense.getSplits() != null) {
                expense.getSplits().forEach(s ->
                        visibleTo.add(s.getUser().getId()));
            }
            if (expense.getCreatedBy() != null &&
                    !visibleTo.contains(
                            expense.getCreatedBy().getId())) {
                visibleTo.add(expense.getCreatedBy().getId());
            }

            saveActivityMembers(saved, visibleTo);

        } catch (Exception e) {
            System.err.println("Failed to log expense deleted: "
                    + e.getMessage());
        }
    }

    // ── Log group created ──
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logGroupCreated(String groupId, String groupName,
                                User creator) {
        try {
            Activity activity = new Activity();
            activity.setType("GROUP_CREATED");
            activity.setPerformedBy(creator);
            activity.setGroupName(groupName);
            activity.setOriginalGroupId(groupId);
            activity.setDescription(
                    "{performer} created group \"" + groupName + "\""
            );

            groupRepository.findById(groupId)
                    .ifPresent(activity::setGroup);

            Activity saved = activityRepository.save(activity);

            // All group members can see this
            List<String> memberIds = getGroupMemberIds(groupId);
            if (!memberIds.contains(creator.getId())) {
                memberIds.add(creator.getId());
            }
            saveActivityMembers(saved, memberIds);

        } catch (Exception e) {
            System.err.println("Failed to log group created: "
                    + e.getMessage());
        }
    }

    // ── Log group deleted ──
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logGroupDeletedWithId(String groupId, String groupName,
                                      User deletedBy) {
        try {
            Activity activity = new Activity();
            activity.setType("GROUP_DELETED");
            activity.setPerformedBy(deletedBy);
            activity.setGroupName(groupName);
            activity.setOriginalGroupId(groupId);
            activity.setDescription(
                    "{performer} deleted group \"" + groupName + "\""
            );
            // Don't set group FK — it's about to be deleted

            Activity saved = activityRepository.save(activity);

            // ── Save ALL group members BEFORE group is deleted ──
            // This is the key fix — we store who was in the group
            // right now, before the delete happens
            List<String> memberIds = getGroupMemberIds(groupId);
            if (!memberIds.contains(deletedBy.getId())) {
                memberIds.add(deletedBy.getId());
            }
            saveActivityMembers(saved, memberIds);

        } catch (Exception e) {
            System.err.println("Failed to log group deleted: "
                    + e.getMessage());
        }
    }

    // Keep old method for compatibility
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logGroupDeleted(String groupName, User deletedBy) {
        try {
            Activity activity = new Activity();
            activity.setType("GROUP_DELETED");
            activity.setPerformedBy(deletedBy);
            activity.setGroupName(groupName);
            activity.setDescription(
                    "{performer} deleted group \"" + groupName + "\""
            );
            Activity saved = activityRepository.save(activity);
            saveActivityMembers(saved,
                    List.of(deletedBy.getId()));
        } catch (Exception e) {
            System.err.println("Failed to log group deleted: "
                    + e.getMessage());
        }
    }

    // ── Log member added ──
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logMemberAdded(String groupId, String groupName,
                               User addedBy, User newMember) {
        try {
            Activity activity = new Activity();
            activity.setType("MEMBER_ADDED");
            activity.setPerformedBy(addedBy);
            activity.setGroupName(groupName);
            activity.setTargetUserName(newMember.getName());
            activity.setTargetUserId(newMember.getId());
            activity.setOriginalGroupId(groupId);
            activity.setDescription(
                    "{performer} added {target} to \""
                    + groupName + "\""
            );

            groupRepository.findById(groupId)
                    .ifPresent(activity::setGroup);

            Activity saved = activityRepository.save(activity);

            // All current group members + new member can see this
            List<String> memberIds = getGroupMemberIds(groupId);
            if (!memberIds.contains(newMember.getId())) {
                memberIds.add(newMember.getId());
            }
            if (!memberIds.contains(addedBy.getId())) {
                memberIds.add(addedBy.getId());
            }
            saveActivityMembers(saved, memberIds);

        } catch (Exception e) {
            System.err.println("Failed to log member added: "
                    + e.getMessage());
        }
    }

    // ── Log member left ──
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logMemberLeft(String groupId, String groupName,
                              User member) {
        try {
            Activity activity = new Activity();
            activity.setType("MEMBER_LEFT");
            activity.setPerformedBy(member);
            activity.setGroupName(groupName);
            activity.setOriginalGroupId(groupId);
            activity.setDescription(
                    "{performer} left group \"" + groupName + "\""
            );

            groupRepository.findById(groupId)
                    .ifPresent(activity::setGroup);

            Activity saved = activityRepository.save(activity);

            // All current members + the leaving member can see this
            List<String> memberIds = getGroupMemberIds(groupId);
            if (!memberIds.contains(member.getId())) {
                memberIds.add(member.getId());
            }
            saveActivityMembers(saved, memberIds);

        } catch (Exception e) {
            System.err.println("Failed to log member left: "
                    + e.getMessage());
        }
    }

    // ── Log settlement ──
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logSettlement(Settlement settlement) {
        try {
            Activity activity = new Activity();
            activity.setType("SETTLEMENT");
            activity.setPerformedBy(settlement.getPayer());
            activity.setAmount(settlement.getAmount());
            activity.setTargetUserName(settlement.getPayee().getName());
            activity.setTargetUserId(settlement.getPayee().getId());

            // Include group name if settlement is in a group
            String groupName = settlement.getGroup() != null
                    ? settlement.getGroup().getName() : null;
            activity.setGroupName(groupName);
            activity.setOriginalGroupId(
                    settlement.getGroup() != null
                            ? settlement.getGroup().getId() : null);

            activity.setDescription(
                    "{performer} paid {target} " +
                    formatAmount(settlement.getAmount()) +
                    (groupName != null ? " in " + groupName : "")
            );

            // Set group reference
            if (settlement.getGroup() != null) {
                groupRepository.findById(
                        settlement.getGroup().getId())
                        .ifPresent(activity::setGroup);
            }

            Activity saved = activityRepository.save(activity);

            // Both payer and payee see this activity
            saveActivityMembers(saved, List.of(
                    settlement.getPayer().getId(),
                    settlement.getPayee().getId()
            ));

        } catch (Exception e) {
            System.err.println("Failed to log settlement: "
                    + e.getMessage());
        }
    }

    private String formatAmount(BigDecimal amount) {
        return "₹" + amount.setScale(0,
                java.math.RoundingMode.HALF_UP).toPlainString();
    }
}