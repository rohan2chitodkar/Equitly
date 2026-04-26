package com.equitly.repository;

import com.equitly.model.ActivityMember;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityMemberRepository
        extends JpaRepository<ActivityMember, String> {
}