package com.equitly.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "settlements")
public class Settlement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payer_id", nullable = false)
    private User payer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payee_id", nullable = false)
    private User payee;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Settlement() {}

    // Getters
    public String getId() { return id; }
    public User getPayer() { return payer; }
    public User getPayee() { return payee; }
    public BigDecimal getAmount() { return amount; }
    public Group getGroup() { return group; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setPayer(User payer) { this.payer = payer; }
    public void setPayee(User payee) { this.payee = payee; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setGroup(Group group) { this.group = group; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private User payer;
        private User payee;
        private BigDecimal amount;
        private Group group;

        public Builder payer(User u) { this.payer = u; return this; }
        public Builder payee(User u) { this.payee = u; return this; }
        public Builder amount(BigDecimal a) { this.amount = a; return this; }
        public Builder group(Group g) { this.group = g; return this; }

        public Settlement build() {
            Settlement s = new Settlement();
            s.payer = this.payer;
            s.payee = this.payee;
            s.amount = this.amount;
            s.group = this.group;
            return s;
        }
    }
}