package com.equitly.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    @Column
    private String category;

    // splitType stored as plain String — NOT enum
    @Column(name = "split_type")
    private String splitType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paid_by_id")
    private User paidBy;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @OneToMany(mappedBy = "expense",
               cascade = CascadeType.ALL,
               orphanRemoval = true)
    private List<ExpenseSplit> splits = new ArrayList<>();

    @Column(name = "receipt_filename")
    private String receiptFilename;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Expense() {}

    // ── Getters ──
    public String getId() { return id; }
    public String getDescription() { return description; }
    public BigDecimal getAmount() { return amount; }
    public String getCategory() { return category; }
    public String getSplitType() { return splitType; }
    public User getPaidBy() { return paidBy; }
    public Group getGroup() { return group; }
    public User getCreatedBy() { return createdBy; }
    public List<ExpenseSplit> getSplits() { return splits; }
    public String getReceiptFilename() {
        return receiptFilename;
    }
    public LocalDateTime getCreatedAt() { return createdAt; }

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
    public void setPaidBy(User paidBy) {
        this.paidBy = paidBy;
    }
    public void setGroup(Group group) {
        this.group = group;
    }
    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }
    public void setSplits(List<ExpenseSplit> splits) {
        this.splits = splits;
    }
    public void setReceiptFilename(String receiptFilename) {
        this.receiptFilename = receiptFilename;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}