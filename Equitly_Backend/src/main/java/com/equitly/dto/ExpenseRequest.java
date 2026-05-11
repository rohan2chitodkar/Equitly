package com.equitly.dto;

import java.math.BigDecimal;
import java.util.List;

public class ExpenseRequest {

    private String description;
    private BigDecimal amount;
    private String category;

    // Plain String — NOT Expense.SplitType enum
    private String splitType;

    private String paidById;
    private String groupId;
    private List<SplitRequest> splits;

    public ExpenseRequest() {}

    // ── Getters ──
    public String getDescription() { return description; }
    public BigDecimal getAmount() { return amount; }
    public String getCategory() { return category; }
    public String getSplitType() { return splitType; }
    public String getPaidById() { return paidById; }
    public String getGroupId() { return groupId; }
    public List<SplitRequest> getSplits() { return splits; }

    // ── Setters ──
    public void setDescription(String description) {
        this.description = description;
    }
    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
    public void setCategory(String category) {
        this.category = category;
    }
    public void setSplitType(String splitType) {
        this.splitType = splitType;
    }
    public void setPaidById(String paidById) {
        this.paidById = paidById;
    }
    public void setGroupId(String groupId) {
        this.groupId = groupId;
    }
    public void setSplits(List<SplitRequest> splits) {
        this.splits = splits;
    }

    // ── Inner class for split data ──
    public static class SplitRequest {
        private String userId;
        private BigDecimal amount;

        public SplitRequest() {}

        public String getUserId() { return userId; }
        public BigDecimal getAmount() { return amount; }

        public void setUserId(String userId) {
            this.userId = userId;
        }
        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }
    }
}