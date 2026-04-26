package com.equitly.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "group_member_details")
public class GroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime joinedAt = LocalDateTime.now();

    public GroupMember() {}

    public GroupMember(Group group, User user) {
        this.group = group;
        this.user = user;
        this.joinedAt = LocalDateTime.now();
    }

    // Getters
    public String getId() { return id; }
    public Group getGroup() { return group; }
    public User getUser() { return user; }
    public LocalDateTime getJoinedAt() { return joinedAt; }

    // Setters
    public void setGroup(Group group) { this.group = group; }
    public void setUser(User user) { this.user = user; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
}