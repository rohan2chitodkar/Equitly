package com.equitly.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "user_groups")
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String emoji = "👥";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "group_members",
        joinColumns = @JoinColumn(name = "group_id"),
        inverseJoinColumns = @JoinColumn(
            name = "user_id")
    )
    private Set<User> members = new HashSet<>();

//    @JsonIgnore
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Expense> expenses = new ArrayList<>();

    public Group() {}

    // Getters
    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmoji() { return emoji; }
    public User getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Set<User> getMembers() { return members; }
    public List<Expense> getExpenses() { return expenses; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setEmoji(String emoji) { this.emoji = emoji; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public void setMembers(Set<User> members) { this.members = members; }
    public void setExpenses(List<Expense> expenses) { this.expenses = expenses; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String name;
        private String emoji = "👥";
        private User createdBy;

        public Builder name(String name) { this.name = name; return this; }
        public Builder emoji(String emoji) { this.emoji = emoji; return this; }
        public Builder createdBy(User createdBy) { this.createdBy = createdBy; return this; }

        public Group build() {
            Group g = new Group();
            g.name = this.name;
            g.emoji = this.emoji;
            g.createdBy = this.createdBy;
            return g;
        }
    }
}