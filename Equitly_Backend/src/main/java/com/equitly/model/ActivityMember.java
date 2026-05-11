package com.equitly.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "activity_members")
public class ActivityMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id",
                nullable = false)
    private Activity activity;

    @Column(name = "user_id", nullable = false)
    private String userId;

    // Store personalized balance per user
    @Column(name = "your_balance",
            precision = 12, scale = 2)
    private BigDecimal yourBalance;

    @Column(name = "your_share",
            precision = 12, scale = 2)
    private BigDecimal yourShare;

    public ActivityMember() {}

    public ActivityMember(Activity activity,
                          String userId) {
        this.activity = activity;
        this.userId = userId;
    }

    public ActivityMember(Activity activity,
                          String userId,
                          BigDecimal yourBalance,
                          BigDecimal yourShare) {
        this.activity = activity;
        this.userId = userId;
        this.yourBalance = yourBalance;
        this.yourShare = yourShare;
    }

    // Getters
    public String getId() { return id; }
    public Activity getActivity() { return activity; }
    public String getUserId() { return userId; }
    public BigDecimal getYourBalance() {
        return yourBalance;
    }
    public BigDecimal getYourShare() {
        return yourShare;
    }

    // Setters
    public void setActivity(Activity activity) {
        this.activity = activity;
    }
    public void setUserId(String userId) {
        this.userId = userId;
    }
    public void setYourBalance(
            BigDecimal yourBalance) {
        this.yourBalance = yourBalance;
    }
    public void setYourShare(BigDecimal yourShare) {
        this.yourShare = yourShare;
    }
}