package com.equitly.model;

import jakarta.persistence.*;

@Entity
@Table(name = "activity_members")
public class ActivityMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @Column(name = "user_id", nullable = false)
    private String userId;

    public ActivityMember() {}

    public ActivityMember(Activity activity, String userId) {
        this.activity = activity;
        this.userId = userId;
    }

    // Getters
    public String getId() { return id; }
    public Activity getActivity() { return activity; }
    public String getUserId() { return userId; }

    // Setters
    public void setActivity(Activity activity) { this.activity = activity; }
    public void setUserId(String userId) { this.userId = userId; }
}