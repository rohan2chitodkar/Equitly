package com.equitly.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ActivityResponseDto {

    private String id;
    private String type;
    private String description;
    private String performedById;
    private String performedByName;
    private String groupName;
    private String expenseDescription;
    private BigDecimal amount;
    private BigDecimal yourShare;
    private BigDecimal yourBalance;
    private String targetUserId;
    private String targetUserName;
    private LocalDateTime createdAt;

    public ActivityResponseDto() {}

    // ── Getters ──
    public String getId() { return id; }
    public String getType() { return type; }
    public String getDescription() { return description; }
    public String getPerformedById() { return performedById; }
    public String getPerformedByName() { return performedByName; }
    public String getGroupName() { return groupName; }
    public String getExpenseDescription() { return expenseDescription; }
    public BigDecimal getAmount() { return amount; }
    public BigDecimal getYourShare() { return yourShare; }
    public BigDecimal getYourBalance() { return yourBalance; }
    public String getTargetUserId() { return targetUserId; }
    public String getTargetUserName() { return targetUserName; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // ── Setters ──
    public void setId(String id) { this.id = id; }
    public void setType(String type) { this.type = type; }
    public void setDescription(String description) {
        this.description = description;
    }
    public void setPerformedById(String performedById) {
        this.performedById = performedById;
    }
    public void setPerformedByName(String performedByName) {
        this.performedByName = performedByName;
    }
    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }
    public void setExpenseDescription(String expenseDescription) {
        this.expenseDescription = expenseDescription;
    }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setYourShare(BigDecimal yourShare) {
        this.yourShare = yourShare;
    }
    public void setYourBalance(BigDecimal yourBalance) {
        this.yourBalance = yourBalance;
    }
    public void setTargetUserId(String targetUserId) {
        this.targetUserId = targetUserId;
    }
    public void setTargetUserName(String targetUserName) {
        this.targetUserName = targetUserName;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}