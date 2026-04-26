package com.equitly.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "activities")
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String type;
    // Types: EXPENSE_ADDED, EXPENSE_UPDATED, EXPENSE_DELETED,
    //        GROUP_CREATED, GROUP_DELETED, MEMBER_ADDED, MEMBER_LEFT,
    //        SETTLEMENT

    @Column(length = 500)
    private String description;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User performedBy;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", foreignKey = @ForeignKey(
        name = "FK_activity_group",
        foreignKeyDefinition = "FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE SET NULL"
    ))
    private Group group;

    @Column
    private String groupName;

    @Column
    private String expenseDescription;

    @Column
    private java.math.BigDecimal amount;

    @Column
    private java.math.BigDecimal yourShare;

    // positive = you get back, negative = you owe
    @Column
    private java.math.BigDecimal yourBalance;

    @Column
    private String targetUserName;
    
    @Column
    private String targetUserId;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "original_group_id")
    private String originalGroupId;
    
    @JsonIgnore
    @OneToMany(mappedBy = "activity",
               cascade = CascadeType.ALL,
               orphanRemoval = true)
    private List<ActivityMember> activityMembers = new ArrayList<>();

    public Activity() {}

    // Getters
    public String getId() { return id; }
    public String getType() { return type; }
    public String getDescription() { return description; }
    public User getPerformedBy() { return performedBy; }
    public Group getGroup() { return group; }
    public String getGroupName() { return groupName; }
    public String getExpenseDescription() { return expenseDescription; }
    public java.math.BigDecimal getAmount() { return amount; }
    public java.math.BigDecimal getYourShare() { return yourShare; }
    public java.math.BigDecimal getYourBalance() { return yourBalance; }
    public String getTargetUserName() { return targetUserName; }
    public String getTargetUserId() { return targetUserId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getOriginalGroupId() { return originalGroupId; }
    public List<ActivityMember> getActivityMembers() {
        return activityMembers;
    }

    // Setters
    public void setType(String type) { this.type = type; }
    public void setDescription(String description) { this.description = description; }
    public void setPerformedBy(User performedBy) { this.performedBy = performedBy; }
    public void setGroup(Group group) { this.group = group; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public void setExpenseDescription(String expenseDescription) { this.expenseDescription = expenseDescription; }
    public void setAmount(java.math.BigDecimal amount) { this.amount = amount; }
    public void setYourShare(java.math.BigDecimal yourShare) { this.yourShare = yourShare; }
    public void setYourBalance(java.math.BigDecimal yourBalance) { this.yourBalance = yourBalance; }
    public void setTargetUserId(String targetUserId) { this.targetUserId = targetUserId; }
    public void setTargetUserName(String targetUserName) { this.targetUserName = targetUserName; }
    public void setOriginalGroupId(String originalGroupId) {
        this.originalGroupId = originalGroupId;
    }
    public void setActivityMembers(List<ActivityMember> activityMembers) {
        this.activityMembers = activityMembers;
    }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Activity a = new Activity();

        public Builder type(String type) { a.type = type; return this; }
        public Builder description(String description) { a.description = description; return this; }
        public Builder performedBy(User user) { a.performedBy = user; return this; }
        public Builder group(Group group) { a.group = group; return this; }
        public Builder groupName(String name) { a.groupName = name; return this; }
        public Builder expenseDescription(String desc) { a.expenseDescription = desc; return this; }
        public Builder amount(java.math.BigDecimal amount) { a.amount = amount; return this; }
        public Builder yourShare(java.math.BigDecimal share) { a.yourShare = share; return this; }
        public Builder yourBalance(java.math.BigDecimal balance) { a.yourBalance = balance; return this; }
        public Builder targetUserName(String name) { a.targetUserName = name; return this; }

        public Activity build() { return a; }
    }
}