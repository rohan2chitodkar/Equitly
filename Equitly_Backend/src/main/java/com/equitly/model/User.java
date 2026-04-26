package com.equitly.model;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String currency = "INR";

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @JsonIgnore
    @ManyToMany
    @JoinTable(
        name = "friendships",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "friend_id")
    )
    private Set<User> friends = new HashSet<>();

    @JsonIgnore
    @ManyToMany(mappedBy = "members")
    private Set<Group> groups = new HashSet<>();

    // Constructors
    public User() {}

    // Getters
    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getCurrency() { return currency; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Set<User> getFriends() { return friends; }
    public Set<Group> getGroups() { return groups; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setCurrency(String currency) { this.currency = currency; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setFriends(Set<User> friends) { this.friends = friends; }
    public void setGroups(Set<Group> groups) { this.groups = groups; }

    // Builder pattern (replaces @Builder)
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String name;
        private String email;
        private String password;
        private String currency = "INR";

        public Builder name(String name) { this.name = name; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder password(String password) { this.password = password; return this; }
        public Builder currency(String currency) { this.currency = currency; return this; }

        public User build() {
            User u = new User();
            u.name = this.name;
            u.email = this.email;
            u.password = this.password;
            u.currency = this.currency;
            return u;
        }
    }

    // UserDetails methods
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return List.of(); }
    @Override public String getUsername() { return email; }
    @Override public String getPassword() { return password; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}