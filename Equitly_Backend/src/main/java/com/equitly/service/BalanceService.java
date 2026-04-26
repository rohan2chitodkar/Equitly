package com.equitly.service;

import com.equitly.model.*;
import com.equitly.repository.ExpenseRepository;
import com.equitly.repository.GroupRepository;
import com.equitly.repository.SettlementRepository;
import com.equitly.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class BalanceService {

    private final ExpenseRepository expenseRepository;
    private final SettlementRepository settlementRepository;
    private final UserRepository userRepository;
    private final ActivityService activityService;
    private final GroupRepository groupRepository;

    public BalanceService(ExpenseRepository expenseRepository,
	            SettlementRepository settlementRepository,
	            UserRepository userRepository,
	            ActivityService activityService,
	            GroupRepository groupRepository) {
		this.expenseRepository = expenseRepository;
		this.settlementRepository = settlementRepository;
		this.userRepository = userRepository;
		this.activityService = activityService;
		this.groupRepository = groupRepository;
	}

    /**
     * Returns net balance between currentUser and each other user.
     * Positive = other user owes currentUser.
     * Negative = currentUser owes other user.
     *
     * Algorithm:
     * For each expense:
     *   - paidBy paid the full amount
     *   - each split user owes their share to paidBy
     *   - we track net between EACH PAIR of users
     */
    public List<BalanceEntry> getBalances(String currentUserId) {
        List<Expense> expenses = expenseRepository
                .findAllByUserId(currentUserId);
        List<Settlement> settlements = settlementRepository
                .findAllByUserId(currentUserId);

        // net[otherUserId] = amount other user owes currentUser
        // positive = they owe me
        // negative = I owe them
        Map<String, BigDecimal> net = new HashMap<>();
        Map<String, User> userCache = new HashMap<>();

        // ── Process expenses ──
        for (Expense expense : expenses) {
            String paidById = expense.getPaidBy().getId();
            userCache.put(paidById, expense.getPaidBy());

            for (ExpenseSplit split : expense.getSplits()) {
                User splitUser = split.getUser();
                String splitUserId = splitUser.getId();
                userCache.put(splitUserId, splitUser);

                // Skip if payer is also the split user (their own share)
                if (paidById.equals(splitUserId)) continue;

                BigDecimal amount = split.getAmount();

                if (paidById.equals(currentUserId)) {
                    // I paid → splitUser owes me
                    net.merge(splitUserId, amount, BigDecimal::add);

                } else if (splitUserId.equals(currentUserId)) {
                    // Someone else paid → I owe paidBy
                    net.merge(paidById,
                            amount.negate(), BigDecimal::add);
                }
                // If neither payer nor split user is currentUser,
                // skip — not relevant to current user's balance
            }
        }

        // ── Process settlements ──
        for (Settlement settlement : settlements) {
            String payerId = settlement.getPayer().getId();
            String payeeId = settlement.getPayee().getId();
            BigDecimal amount = settlement.getAmount();

            userCache.put(payerId, settlement.getPayer());
            userCache.put(payeeId, settlement.getPayee());

            if (payerId.equals(currentUserId)) {
                // I paid someone → reduces what I owe them
                // or increases what they owe me
                net.merge(payeeId, amount, BigDecimal::add);

            } else if (payeeId.equals(currentUserId)) {
                // Someone paid me → reduces what they owe me
                net.merge(payerId,
                        amount.negate(), BigDecimal::add);
            }
        }

        // ── Build result list ──
        List<BalanceEntry> result = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : net.entrySet()) {
            String otherUserId = entry.getKey();
            BigDecimal balance = entry.getValue()
                    .setScale(2, RoundingMode.HALF_UP);

            // Skip self and zero balances
            if (otherUserId.equals(currentUserId)) continue;
            if (balance.abs().compareTo(
                    new BigDecimal("0.01")) < 0) continue;

            User other = userCache.get(otherUserId);
            if (other == null) {
                other = userRepository.findById(otherUserId)
                        .orElse(null);
            }
            if (other == null) continue;

            result.add(new BalanceEntry(
                    other.getId(),
                    other.getName(),
                    other.getEmail(),
                    balance
            ));
        }

        // Sort: people who owe you first, then people you owe
        result.sort((a, b) ->
                b.getNetAmount().compareTo(a.getNetAmount()));

        return result;
    }

    /**
     * Group-specific balances — same logic but only for group expenses
     */
    public List<BalanceEntry> getGroupBalances(String groupId,
                                               String currentUserId) {
        List<Expense> expenses = expenseRepository
                .findAllByGroupId(groupId);

        Map<String, BigDecimal> net = new HashMap<>();
        Map<String, User> userCache = new HashMap<>();

        for (Expense expense : expenses) {
            String paidById = expense.getPaidBy().getId();
            userCache.put(paidById, expense.getPaidBy());

            for (ExpenseSplit split : expense.getSplits()) {
                User splitUser = split.getUser();
                String splitUserId = splitUser.getId();
                userCache.put(splitUserId, splitUser);

                if (paidById.equals(splitUserId)) continue;

                BigDecimal amount = split.getAmount();

                if (paidById.equals(currentUserId)) {
                    net.merge(splitUserId, amount, BigDecimal::add);
                } else if (splitUserId.equals(currentUserId)) {
                    net.merge(paidById,
                            amount.negate(), BigDecimal::add);
                }
            }
        }

        List<BalanceEntry> result = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : net.entrySet()) {
            String otherUserId = entry.getKey();
            BigDecimal balance = entry.getValue()
                    .setScale(2, RoundingMode.HALF_UP);

            if (otherUserId.equals(currentUserId)) continue;
            if (balance.abs().compareTo(
                    new BigDecimal("0.01")) < 0) continue;

            User other = userCache.get(otherUserId);
            if (other == null) continue;

            result.add(new BalanceEntry(
                    other.getId(),
                    other.getName(),
                    other.getEmail(),
                    balance
            ));
        }

        result.sort((a, b) ->
                b.getNetAmount().compareTo(a.getNetAmount()));

        return result;
    }

    /**
     * Settle up between two users
     */
    @Transactional
    public Settlement settleUp(String currentUserId,
                               String friendId,
                               BigDecimal amount,
                               String groupId) {
        User payer = userRepository.findById(currentUserId)
                .orElseThrow();
        User payee = userRepository.findById(friendId)
                .orElseThrow(() -> new RuntimeException(
                        "Friend not found"));

        Settlement settlement = new Settlement();
        settlement.setPayer(payer);
        settlement.setPayee(payee);
        settlement.setAmount(amount);

        // Save group reference if provided
        if (groupId != null && !groupId.isBlank()) {
            groupRepository.findById(groupId)
                    .ifPresent(settlement::setGroup);
        }

        Settlement saved = settlementRepository.save(settlement);

        // Log activity
        activityService.logSettlement(saved);

        return saved;
    }

    // ── BalanceEntry DTO ──
    public static class BalanceEntry {
        private String friendId;
        private String friendName;
        private String friendEmail;
        private BigDecimal netAmount;

        public BalanceEntry(String friendId, String friendName,
                            String friendEmail,
                            BigDecimal netAmount) {
            this.friendId = friendId;
            this.friendName = friendName;
            this.friendEmail = friendEmail;
            this.netAmount = netAmount;
        }

        public String getFriendId() { return friendId; }
        public String getFriendName() { return friendName; }
        public String getFriendEmail() { return friendEmail; }
        public BigDecimal getNetAmount() { return netAmount; }

        public void setFriendId(String friendId) {
            this.friendId = friendId;
        }
        public void setFriendName(String friendName) {
            this.friendName = friendName;
        }
        public void setFriendEmail(String friendEmail) {
            this.friendEmail = friendEmail;
        }
        public void setNetAmount(BigDecimal netAmount) {
            this.netAmount = netAmount;
        }
    }
    
    /**
     * Simplified group balances using debt minimization algorithm.
     * Reduces number of transactions needed to settle all debts.
     */
    public List<BalanceEntry> getSimplifiedGroupBalances(
            String groupId, String currentUserId) {

        List<Expense> expenses = expenseRepository
                .findAllByGroupId(groupId);
        List<Settlement> settlements = settlementRepository
                .findAllByUserId(currentUserId);

        if (expenses.isEmpty()) return new ArrayList<>();

        // Step 1: Calculate net balance for EVERY member
        Map<String, BigDecimal> netBalances = new HashMap<>();
        Map<String, User> userCache = new HashMap<>();

        for (Expense expense : expenses) {
            String paidById = expense.getPaidBy().getId();
            userCache.put(paidById, expense.getPaidBy());

            BigDecimal paidByShare = BigDecimal.ZERO;

            for (ExpenseSplit split : expense.getSplits()) {
                userCache.put(split.getUser().getId(), split.getUser());
                if (split.getUser().getId().equals(paidById)) {
                    paidByShare = split.getAmount();
                }
            }

            BigDecimal paidByLent = expense.getAmount()
                    .subtract(paidByShare);
            netBalances.merge(paidById, paidByLent, BigDecimal::add);

            for (ExpenseSplit split : expense.getSplits()) {
                String splitUserId = split.getUser().getId();
                if (splitUserId.equals(paidById)) continue;
                netBalances.merge(splitUserId,
                        split.getAmount().negate(), BigDecimal::add);
            }
        }

        // Step 2: Apply settlements
        for (Settlement settlement : settlements) {
            String payerId = settlement.getPayer().getId();
            String payeeId = settlement.getPayee().getId();
            BigDecimal amount = settlement.getAmount();

            userCache.put(payerId, settlement.getPayer());
            userCache.put(payeeId, settlement.getPayee());

            // Check if both users are in this group
            boolean payerInGroup = netBalances.containsKey(payerId);
            boolean payeeInGroup = netBalances.containsKey(payeeId);

            if (payerInGroup && payeeInGroup) {
                // Payer paid payee → reduces payer's debt
                // and reduces payee's credit
                netBalances.merge(payerId, amount, BigDecimal::add);
                netBalances.merge(payeeId,
                        amount.negate(), BigDecimal::add);
            }
        }

        // Step 3: Simplify debts
        List<Map.Entry<String, BigDecimal>> creditors = netBalances
                .entrySet().stream()
                .filter(e -> e.getValue().compareTo(
                        new BigDecimal("0.01")) > 0)
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .collect(java.util.stream.Collectors.toList());

        List<Map.Entry<String, BigDecimal>> debtors = netBalances
                .entrySet().stream()
                .filter(e -> e.getValue().compareTo(
                        new BigDecimal("-0.01")) < 0)
                .sorted((a, b) -> a.getValue().compareTo(b.getValue()))
                .collect(java.util.stream.Collectors.toList());

        BigDecimal[] creditAmounts = creditors.stream()
                .map(Map.Entry::getValue)
                .toArray(BigDecimal[]::new);
        BigDecimal[] debtAmounts = debtors.stream()
                .map(e -> e.getValue().negate())
                .toArray(BigDecimal[]::new);

        List<SimplifiedDebt> simplifiedDebts = new ArrayList<>();
        int ci = 0, di = 0;

        while (ci < creditors.size() && di < debtors.size()) {
            BigDecimal settle = creditAmounts[ci].min(debtAmounts[di]);

            simplifiedDebts.add(new SimplifiedDebt(
                    debtors.get(di).getKey(),
                    creditors.get(ci).getKey(),
                    settle.setScale(2, RoundingMode.HALF_UP)
            ));

            creditAmounts[ci] = creditAmounts[ci].subtract(settle);
            debtAmounts[di] = debtAmounts[di].subtract(settle);

            if (creditAmounts[ci].compareTo(
                    new BigDecimal("0.01")) < 0) ci++;
            if (debtAmounts[di].compareTo(
                    new BigDecimal("0.01")) < 0) di++;
        }

        // Step 4: Convert to BalanceEntry for currentUser
        List<BalanceEntry> result = new ArrayList<>();
        for (SimplifiedDebt debt : simplifiedDebts) {
            User fromUser = userCache.get(debt.fromUserId);
            User toUser = userCache.get(debt.toUserId);
            if (fromUser == null || toUser == null) continue;

            if (debt.fromUserId.equals(currentUserId)) {
                result.add(new BalanceEntry(
                        toUser.getId(), toUser.getName(),
                        toUser.getEmail(),
                        debt.amount.negate()
                ));
            } else if (debt.toUserId.equals(currentUserId)) {
                result.add(new BalanceEntry(
                        fromUser.getId(), fromUser.getName(),
                        fromUser.getEmail(),
                        debt.amount
                ));
            }
        }

        result.sort((a, b) ->
                b.getNetAmount().compareTo(a.getNetAmount()));

        return result;
    }

    // ── Inner class for simplified debt ──
    private static class SimplifiedDebt {
        String fromUserId;  // person who owes
        String toUserId;    // person who is owed
        BigDecimal amount;

        SimplifiedDebt(String from, String to, BigDecimal amount) {
            this.fromUserId = from;
            this.toUserId = to;
            this.amount = amount;
        }
    }
}