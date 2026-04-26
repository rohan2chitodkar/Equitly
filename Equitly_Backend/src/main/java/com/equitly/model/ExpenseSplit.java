package com.equitly.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "expense_splits")
public class ExpenseSplit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private boolean settled = false;

    public ExpenseSplit() {}

    // Getters
    public String getId() { return id; }
    public Expense getExpense() { return expense; }
    public User getUser() { return user; }
    public BigDecimal getAmount() { return amount; }
    public boolean isSettled() { return settled; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setExpense(Expense expense) { this.expense = expense; }
    public void setUser(User user) { this.user = user; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setSettled(boolean settled) { this.settled = settled; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Expense expense;
        private User user;
        private BigDecimal amount;
        private boolean settled = false;

        public Builder expense(Expense e) { this.expense = e; return this; }
        public Builder user(User u) { this.user = u; return this; }
        public Builder amount(BigDecimal a) { this.amount = a; return this; }
        public Builder settled(boolean s) { this.settled = s; return this; }

        public ExpenseSplit build() {
            ExpenseSplit es = new ExpenseSplit();
            es.expense = this.expense;
            es.user = this.user;
            es.amount = this.amount;
            es.settled = this.settled;
            return es;
        }
    }
}