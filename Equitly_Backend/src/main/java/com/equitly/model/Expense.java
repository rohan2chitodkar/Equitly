package com.equitly.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String category = "other";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SplitType splitType = SplitType.EQUAL;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paid_by_id", nullable = false)
    private User paidBy;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @JsonIgnore
    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseSplit> splits = new ArrayList<>();

    public enum SplitType { EQUAL, EXACT, PERCENTAGE, SHARES }

    public Expense() {}

    // Getters
    public String getId() { return id; }
    public String getDescription() { return description; }
    public BigDecimal getAmount() { return amount; }
    public String getCategory() { return category; }
    public SplitType getSplitType() { return splitType; }
    public User getPaidBy() { return paidBy; }
    public Group getGroup() { return group; }
    public User getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<ExpenseSplit> getSplits() { return splits; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setDescription(String description) { this.description = description; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setCategory(String category) { this.category = category; }
    public void setSplitType(SplitType splitType) { this.splitType = splitType; }
    public void setPaidBy(User paidBy) { this.paidBy = paidBy; }
    public void setGroup(Group group) { this.group = group; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public void setSplits(List<ExpenseSplit> splits) { this.splits = splits; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String description;
        private BigDecimal amount;
        private String category = "other";
        private SplitType splitType = SplitType.EQUAL;
        private User paidBy;
        private User createdBy;
        private Group group;

        public Builder description(String d) { this.description = d; return this; }
        public Builder amount(BigDecimal a) { this.amount = a; return this; }
        public Builder category(String c) { this.category = c; return this; }
        public Builder splitType(SplitType s) { this.splitType = s; return this; }
        public Builder paidBy(User u) { this.paidBy = u; return this; }
        public Builder createdBy(User u) { this.createdBy = u; return this; }
        public Builder group(Group g) { this.group = g; return this; }

        public Expense build() {
            Expense e = new Expense();
            e.description = this.description;
            e.amount = this.amount;
            e.category = this.category;
            e.splitType = this.splitType;
            e.paidBy = this.paidBy;
            e.createdBy = this.createdBy;
            e.group = this.group;
            return e;
        }
    }
}