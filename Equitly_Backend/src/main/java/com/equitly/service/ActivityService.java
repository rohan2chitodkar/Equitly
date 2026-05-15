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
    private final ActivityMemberRepository
            activityMemberRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    public ActivityService(
            ActivityRepository activityRepository,
            ActivityMemberRepository
                    activityMemberRepository,
            GroupRepository groupRepository,
            UserRepository userRepository) {
        this.activityRepository = activityRepository;
        this.activityMemberRepository =
                activityMemberRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
    }

    // ════════════════════════════════════════
    // ── Helper — save activity members ──
    // ════════════════════════════════════════
    private void saveActivityMembers(
            Activity activity,
            List<String> userIds) {
        for (String userId : userIds) {
            ActivityMember am =
                    new ActivityMember(
                            activity, userId);
            activityMemberRepository.save(am);
        }
    }

    // ── Helper — get group member IDs ──
    private List<String> getGroupMemberIds(
            String groupId) {
        return groupRepository
                .findByIdWithMembers(groupId)
                .map(g -> g.getMembers().stream()
                        .map(User::getId)
                        .collect(Collectors.toList()))
                .orElse(new ArrayList<>());
    }

    // ════════════════════════════════════════
    // ── Get activities for user ──
    // ════════════════════════════════════════
    @Transactional(readOnly = true)
    public List<Activity> getActivitiesForUser(
            String userId) {
        try {
            return activityRepository
                    .findAllByUserId(userId);
        } catch (Exception e) {
            System.err.println(
                    "Failed to fetch activities: "
                    + e.getMessage());
            return new ArrayList<>();
        }
    }

    // ── Get activities as DTO ──
    @Transactional(readOnly = true)
    public List<ActivityResponseDto>
            getActivitiesForUserAsDto(String userId) {
        try {
            return activityRepository
                    .findAllByUserId(userId)
                    .stream()
                    .map(a -> toDtoForUser(a, userId))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println(
                    "Failed to fetch activities: "
                    + e.getMessage());
            return new ArrayList<>();
        }
    }

    // ════════════════════════════════════════
    // ── Convert Activity to DTO ──
    // ════════════════════════════════════════
    public ActivityResponseDto toDto(Activity a) {
        ActivityResponseDto dto =
                new ActivityResponseDto();
        dto.setId(a.getId());
        dto.setType(a.getType());
        dto.setDescription(a.getDescription());
        dto.setGroupName(a.getGroupName());
        dto.setExpenseDescription(
                a.getExpenseDescription());
        dto.setAmount(a.getAmount());
        dto.setYourShare(a.getYourShare());
        dto.setYourBalance(a.getYourBalance());
        dto.setTargetUserId(a.getTargetUserId());
        dto.setTargetUserName(a.getTargetUserName());
        dto.setCreatedAt(a.getCreatedAt());

        // ── Safely access performedBy ──
        try {
            if (a.getPerformedBy() != null) {
                dto.setPerformedById(
                        a.getPerformedBy().getId());
                dto.setPerformedByName(
                        a.getPerformedBy().getName());
            }
        } catch (Exception e) {
            System.err.println(
                "Could not load performedBy: "
                + e.getMessage());
        }

        return dto;
    }

    // ── Convert with personalized balance ──
    public ActivityResponseDto toDtoForUser(
            Activity a, String userId) {

        // Start with base dto
        ActivityResponseDto dto = toDto(a);

        // Override balance with personalized value
        // stored in activity_members for this user
        activityMemberRepository
                .findByActivityIdAndUserId(
                        a.getId(), userId)
                .ifPresent(am -> {
                    if (am.getYourBalance() != null) {
                        dto.setYourBalance(
                                am.getYourBalance());
                    }
                    if (am.getYourShare() != null) {
                        dto.setYourShare(
                                am.getYourShare());
                    }
                });

        return dto;
    }

    // ════════════════════════════════════════
    // ── Log expense added (with user IDs) ──
    // ════════════════════════════════════════
    @Transactional(propagation =
            Propagation.REQUIRES_NEW)
    public void logExpenseAddedWithUsers(
            Expense expense,
            String currentUserId,
            List<String> splitUserIds) {
        try {
            Activity activity = new Activity();
            activity.setType("EXPENSE_ADDED");
            activity.setPerformedBy(
                    expense.getCreatedBy());
            activity.setExpenseDescription(
                    expense.getDescription());
            activity.setAmount(expense.getAmount());
            activity.setGroupName(
                    expense.getGroup() != null
                    ? expense.getGroup().getName()
                    : null);
            activity.setOriginalGroupId(
                    expense.getGroup() != null
                    ? expense.getGroup().getId()
                    : null);
            activity.setDescription(
                    "{performer} added \"{expense}\"" +
                    (expense.getGroup() != null
                    ? " in \"" +
                      expense.getGroup().getName()
                      + "\""
                    : ""));

            if (expense.getGroup() != null) {
                groupRepository.findById(
                        expense.getGroup().getId())
                        .ifPresent(activity::setGroup);
            }

            Activity saved =
                    activityRepository.save(activity);

            // ── Build visibleTo list ──
            List<String> visibleTo =
                    new ArrayList<>();

            // Add creator
            if (!visibleTo.contains(currentUserId)) {
                visibleTo.add(currentUserId);
            }

            // Add payer
            if (expense.getPaidBy() != null) {
                String payerId =
                        expense.getPaidBy().getId();
                if (!visibleTo.contains(payerId)) {
                    visibleTo.add(payerId);
                }
            }

            // Add split user IDs from request
            splitUserIds.forEach(uid -> {
                if (!visibleTo.contains(uid)) {
                    visibleTo.add(uid);
                }
            });

            // Add from loaded splits too
            if (expense.getSplits() != null) {
                expense.getSplits().forEach(s -> {
                    String uid =
                            s.getUser().getId();
                    if (!visibleTo.contains(uid)) {
                        visibleTo.add(uid);
                    }
                });
            }

            // Group members fallback
            if (visibleTo.size() <= 1 &&
                    expense.getGroup() != null) {
                groupRepository.findByIdWithMembers(
                        expense.getGroup().getId())
                        .ifPresent(g ->
                            g.getMembers()
                             .forEach(m -> {
                                if (!visibleTo
                                    .contains(
                                        m.getId())) {
                                    visibleTo.add(
                                        m.getId());
                                }
                            }));
            }

            // ── Save personalized balance per user ──
            String paidById =
                    expense.getPaidBy() != null
                    ? expense.getPaidBy().getId()
                    : currentUserId;

            BigDecimal total = expense.getAmount();

	         // Build a map of userId → splitAmount
	         // from splitUserIds and splits for accuracy
	         java.util.Map<String, BigDecimal> splitAmountMap =
	                 new java.util.HashMap<>();
	
	         // From loaded splits
	         if (expense.getSplits() != null) {
	             expense.getSplits().forEach(split ->
	                 splitAmountMap.put(
	                     split.getUser().getId(),
	                     split.getAmount())
	             );
	         }
	
	         // From request splits if not loaded
	         if (splitAmountMap.isEmpty() &&
	                 !splitUserIds.isEmpty()) {
	             // Try to get from request body splits
	             // They are equal split so divide equally
	             if (!splitUserIds.isEmpty()) {
	                 BigDecimal equalShare = total.divide(
	                     new BigDecimal(splitUserIds.size()),
	                     2, java.math.RoundingMode.HALF_UP);
	                 splitUserIds.forEach(uid ->
	                     splitAmountMap.put(uid, equalShare));
	             }
	         }
	
	         System.out.println("Split amount map: "
	                 + splitAmountMap);
	
	         for (String uid : visibleTo) {
	             BigDecimal myShare = splitAmountMap
	                     .getOrDefault(uid, BigDecimal.ZERO);
	
	             BigDecimal myBalance;
	             if (uid.equals(paidById)) {
	                 // This user paid
	                 // → lent = total - own share
	                 myBalance = total.subtract(myShare);
	             } else {
	                 // This user owes their share
	                 myBalance = myShare.negate();
	             }
	
	             System.out.println("User: " + uid
	                     + " share: " + myShare
	                     + " balance: " + myBalance);
	
	             ActivityMember am =
	                     new ActivityMember(
	                             saved, uid,
	                             myBalance, myShare);
	             activityMemberRepository.save(am);
	         }

            System.out.println(
                    "Expense activity saved for: "
                    + visibleTo);

        } catch (Exception e) {
            System.err.println(
                    "Failed to log expense added: "
                    + e.getMessage());
            e.printStackTrace();
        }
    }

    // ════════════════════════════════════════
    // ── Log expense added (original) ──
    // ════════════════════════════════════════
    @Transactional(propagation =
            Propagation.REQUIRES_NEW)
    public void logExpenseAdded(
            Expense expense,
            String currentUserId) {
        // Delegate to the detailed method
        // with empty splitUserIds
        logExpenseAddedWithUsers(
                expense,
                currentUserId,
                new ArrayList<>());
    }

    // ════════════════════════════════════════
    // ── Log expense updated ──
    // ════════════════════════════════════════
    @Transactional(propagation =
            Propagation.REQUIRES_NEW)
    public void logExpenseUpdated(Expense expense) {
        try {
            Activity activity = new Activity();
            activity.setType("EXPENSE_UPDATED");
            activity.setPerformedBy(
                    expense.getCreatedBy());
            activity.setExpenseDescription(
                    expense.getDescription());
            activity.setAmount(expense.getAmount());
            activity.setGroupName(
                    expense.getGroup() != null
                    ? expense.getGroup().getName()
                    : null);
            activity.setOriginalGroupId(
                    expense.getGroup() != null
                    ? expense.getGroup().getId()
                    : null);
            activity.setDescription(
                    "{performer} updated " +
                    "\"{expense}\"" +
                    (expense.getGroup() != null
                    ? " in \"" +
                      expense.getGroup().getName()
                      + "\""
                    : ""));

            if (expense.getGroup() != null) {
                groupRepository.findById(
                        expense.getGroup().getId())
                        .ifPresent(activity::setGroup);
            }

            Activity saved =
                    activityRepository.save(activity);

            List<String> visibleTo =
                    new ArrayList<>();

            // Creator first
            if (expense.getCreatedBy() != null) {
                visibleTo.add(
                        expense.getCreatedBy()
                                .getId());
            }

            // Payer
            if (expense.getPaidBy() != null &&
                    !visibleTo.contains(
                        expense.getPaidBy().getId())) {
                visibleTo.add(
                        expense.getPaidBy().getId());
            }

            // Split members
            if (expense.getSplits() != null) {
                expense.getSplits().forEach(s -> {
                    String uid =
                            s.getUser().getId();
                    if (!visibleTo.contains(uid)) {
                        visibleTo.add(uid);
                    }
                });
            }

            // Group fallback
            if (visibleTo.size() <= 1 &&
                    expense.getGroup() != null) {
                groupRepository.findByIdWithMembers(
                        expense.getGroup().getId())
                        .ifPresent(g ->
                            g.getMembers()
                             .forEach(m -> {
                                if (!visibleTo
                                    .contains(
                                        m.getId())) {
                                    visibleTo.add(
                                        m.getId());
                                }
                            }));
            }

            if (!visibleTo.isEmpty()) {
                saveActivityMembers(saved, visibleTo);
            }

        } catch (Exception e) {
            System.err.println(
                    "Failed to log expense updated: "
                    + e.getMessage());
        }
    }

    // ════════════════════════════════════════
    // ── Log expense deleted ──
    // ════════════════════════════════════════
    @Transactional(propagation =
            Propagation.REQUIRES_NEW)
    public void logExpenseDeleted(Expense expense) {
        try {
            Activity activity = new Activity();
            activity.setType("EXPENSE_DELETED");
            activity.setPerformedBy(
                    expense.getCreatedBy());
            activity.setExpenseDescription(
                    expense.getDescription());
            activity.setAmount(expense.getAmount());
            activity.setGroupName(
                    expense.getGroup() != null
                    ? expense.getGroup().getName()
                    : null);
            activity.setDescription(
                    "{performer} deleted " +
                    "\"{expense}\"");

            Activity saved =
                    activityRepository.save(activity);

            List<String> visibleTo =
                    new ArrayList<>();

            // Creator first
            if (expense.getCreatedBy() != null) {
                visibleTo.add(
                        expense.getCreatedBy()
                                .getId());
            }

            // Payer
            if (expense.getPaidBy() != null &&
                    !visibleTo.contains(
                        expense.getPaidBy().getId())) {
                visibleTo.add(
                        expense.getPaidBy().getId());
            }

            // Split members
            if (expense.getSplits() != null) {
                expense.getSplits().forEach(s -> {
                    String uid =
                            s.getUser().getId();
                    if (!visibleTo.contains(uid)) {
                        visibleTo.add(uid);
                    }
                });
            }

            // Group fallback
            if (visibleTo.size() <= 1 &&
                    expense.getGroup() != null) {
                groupRepository.findByIdWithMembers(
                        expense.getGroup().getId())
                        .ifPresent(g ->
                            g.getMembers()
                             .forEach(m -> {
                                if (!visibleTo
                                    .contains(
                                        m.getId())) {
                                    visibleTo.add(
                                        m.getId());
                                }
                            }));
            }

            if (!visibleTo.isEmpty()) {
                saveActivityMembers(saved, visibleTo);
            }

        } catch (Exception e) {
            System.err.println(
                    "Failed to log expense deleted: "
                    + e.getMessage());
        }
    }

    // ════════════════════════════════════════
    // ── Log group created ──
    // ════════════════════════════════════════
    @Transactional(propagation =
            Propagation.REQUIRES_NEW)
    public void logGroupCreated(
            String groupId,
            String groupName,
            User creator) {
        try {
            Activity activity = new Activity();
            activity.setType("GROUP_CREATED");
            activity.setPerformedBy(creator);
            activity.setGroupName(groupName);
            activity.setOriginalGroupId(groupId);
            activity.setDescription(
                    "{performer} created group \""
                    + groupName + "\"");

            groupRepository.findById(groupId)
                    .ifPresent(activity::setGroup);

            Activity saved =
                    activityRepository.save(activity);

            List<String> memberIds =
                    getGroupMemberIds(groupId);
            if (!memberIds.contains(
                    creator.getId())) {
                memberIds.add(creator.getId());
            }
            saveActivityMembers(saved, memberIds);

        } catch (Exception e) {
            System.err.println(
                    "Failed to log group created: "
                    + e.getMessage());
        }
    }

    // ════════════════════════════════════════
    // ── Log group deleted ──
    // ════════════════════════════════════════
    @Transactional(propagation =
            Propagation.REQUIRES_NEW)
    public void logGroupDeletedWithId(
            String groupId,
            String groupName,
            User deletedBy) {
        try {
            Activity activity = new Activity();
            activity.setType("GROUP_DELETED");
            activity.setPerformedBy(deletedBy);
            activity.setGroupName(groupName);
            activity.setOriginalGroupId(groupId);
            activity.setDescription(
                    "{performer} deleted group \""
                    + groupName + "\"");

            Activity saved =
                    activityRepository.save(activity);

            List<String> memberIds =
                    getGroupMemberIds(groupId);
            if (!memberIds.contains(
                    deletedBy.getId())) {
                memberIds.add(deletedBy.getId());
            }
            saveActivityMembers(saved, memberIds);

        } catch (Exception e) {
            System.err.println(
                    "Failed to log group deleted: "
                    + e.getMessage());
        }
    }

    // Keep old method for compatibility
    @Transactional(propagation =
            Propagation.REQUIRES_NEW)
    public void logGroupDeleted(
            String groupName,
            User deletedBy) {
        try {
            Activity activity = new Activity();
            activity.setType("GROUP_DELETED");
            activity.setPerformedBy(deletedBy);
            activity.setGroupName(groupName);
            activity.setDescription(
                    "{performer} deleted group \""
                    + groupName + "\"");
            Activity saved =
                    activityRepository.save(activity);
            saveActivityMembers(saved,
                    List.of(deletedBy.getId()));
        } catch (Exception e) {
            System.err.println(
                    "Failed to log group deleted: "
                    + e.getMessage());
        }
    }

    // ════════════════════════════════════════
    // ── Log member added ──
    // ════════════════════════════════════════
    @Transactional(propagation =
            Propagation.REQUIRES_NEW)
    public void logMemberAdded(
            String groupId,
            String groupName,
            User addedBy,
            User newMember) {
        try {
            Activity activity = new Activity();
            activity.setType("MEMBER_ADDED");
            activity.setPerformedBy(addedBy);
            activity.setGroupName(groupName);
            activity.setTargetUserName(
                    newMember.getName());
            activity.setTargetUserId(
                    newMember.getId());
            activity.setOriginalGroupId(groupId);
            activity.setDescription(
                    "{performer} added {target} to \""
                    + groupName + "\"");

            groupRepository.findById(groupId)
                    .ifPresent(activity::setGroup);

            Activity saved =
                    activityRepository.save(activity);

            List<String> memberIds =
                    getGroupMemberIds(groupId);
            if (!memberIds.contains(
                    newMember.getId())) {
                memberIds.add(newMember.getId());
            }
            if (!memberIds.contains(
                    addedBy.getId())) {
                memberIds.add(addedBy.getId());
            }
            saveActivityMembers(saved, memberIds);

        } catch (Exception e) {
            System.err.println(
                    "Failed to log member added: "
                    + e.getMessage());
        }
    }

    // ════════════════════════════════════════
    // ── Log member left ──
    // ════════════════════════════════════════
    @Transactional(propagation =
            Propagation.REQUIRES_NEW)
    public void logMemberLeft(
            String groupId,
            String groupName,
            User member) {
        try {
            Activity activity = new Activity();
            activity.setType("MEMBER_LEFT");
            activity.setPerformedBy(member);
            activity.setGroupName(groupName);
            activity.setOriginalGroupId(groupId);
            activity.setDescription(
                    "{performer} left group \""
                    + groupName + "\"");

            groupRepository.findById(groupId)
                    .ifPresent(activity::setGroup);

            Activity saved =
                    activityRepository.save(activity);

            List<String> memberIds =
                    getGroupMemberIds(groupId);
            if (!memberIds.contains(
                    member.getId())) {
                memberIds.add(member.getId());
            }
            saveActivityMembers(saved, memberIds);

        } catch (Exception e) {
            System.err.println(
                    "Failed to log member left: "
                    + e.getMessage());
        }
    }

    // ════════════════════════════════════════
    // ── Log settlement ──
    // ════════════════════════════════════════
    @Transactional(propagation =
            Propagation.REQUIRES_NEW)
    public void logSettlement(
            Settlement settlement) {
        try {
            Activity activity = new Activity();
            activity.setType("SETTLEMENT");
            activity.setPerformedBy(
                    settlement.getPayer());
            activity.setAmount(
                    settlement.getAmount());
            activity.setTargetUserName(
                    settlement.getPayee().getName());
            activity.setTargetUserId(
                    settlement.getPayee().getId());

            String groupName =
                    settlement.getGroup() != null
                    ? settlement.getGroup().getName()
                    : null;
            activity.setGroupName(groupName);
            activity.setOriginalGroupId(
                    settlement.getGroup() != null
                    ? settlement.getGroup().getId()
                    : null);
            activity.setDescription(
                    "{performer} paid {target} ₹" +
                    settlement.getAmount()
                    .setScale(0,
                        java.math.RoundingMode
                            .HALF_UP)
                    .toPlainString() +
                    (groupName != null
                    ? " in \"" + groupName + "\""
                    : ""));

            if (settlement.getGroup() != null) {
                groupRepository.findById(
                        settlement.getGroup().getId())
                        .ifPresent(activity::setGroup);
            }

            Activity saved =
                    activityRepository.save(activity);

            // Both payer and payee see settlement
            saveActivityMembers(saved,
                    List.of(
                        settlement.getPayer().getId(),
                        settlement.getPayee().getId()
                    ));

        } catch (Exception e) {
            System.err.println(
                    "Failed to log settlement: "
                    + e.getMessage());
        }
    }
}