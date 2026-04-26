package com.equitly.dto;

import com.equitly.model.Expense;
import java.math.BigDecimal;
import java.util.List;

public class ExpenseRequest {

    private String description;
    private BigDecimal amount;
    private String category;
    private String paidById;
    private String groupId;
    private Expense.SplitType splitType;
    private List<SplitRequest> splits;

    public String getDescription() { return description; }
    public BigDecimal getAmount() { return amount; }
    public String getCategory() { return category; }
    public String getPaidById() { return paidById; }
    public String getGroupId() { return groupId; }
    public Expense.SplitType getSplitType() { return splitType; }
    public List<SplitRequest> getSplits() { return splits; }

    public void setDescription(String description) { this.description = description; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setCategory(String category) { this.category = category; }
    public void setPaidById(String paidById) { this.paidById = paidById; }
    public void setGroupId(String groupId) { this.groupId = groupId; }
    public void setSplitType(Expense.SplitType splitType) { this.splitType = splitType; }
    public void setSplits(List<SplitRequest> splits) { this.splits = splits; }

    public static class SplitRequest {
        private String userId;
        private BigDecimal amount;

        public String getUserId() { return userId; }
        public BigDecimal getAmount() { return amount; }
        public void setUserId(String userId) { this.userId = userId; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }
}