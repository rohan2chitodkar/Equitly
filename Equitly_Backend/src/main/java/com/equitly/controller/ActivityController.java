package com.equitly.controller;

import com.equitly.dto.ActivityResponseDto;
import com.equitly.model.User;
import com.equitly.service.ActivityService;
import com.equitly.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activity")
public class ActivityController {

    private final ActivityService activityService;
    private final UserService userService;

    public ActivityController(ActivityService activityService,
                              UserService userService) {
        this.activityService = activityService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<ActivityResponseDto>> getActivity(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getCurrentUser(userDetails.getUsername());

        List<ActivityResponseDto> activities =
                activityService.getActivitiesForUserAsDto(user.getId());

        // Personalize descriptions for this specific user
        activities.forEach(a ->
                a.setDescription(
                        personalizeDescription(a, user.getId(),
                                user.getName())
                )
        );

        return ResponseEntity.ok(activities);
    }

    private String personalizeDescription(ActivityResponseDto a,
                                          String currentUserId,
                                          String currentUserName) {
        String desc = a.getDescription();
        if (desc == null) return "";

        // ── Performer display name ──
        String performerDisplay;
        if (a.getPerformedById() != null &&
                a.getPerformedById().equals(currentUserId)) {
            performerDisplay = "You";
        } else {
            performerDisplay = a.getPerformedByName() != null
                    ? a.getPerformedByName() : "Someone";
        }

        // ── Target display name ──
        String targetDisplay;
        if (a.getTargetUserId() != null &&
                a.getTargetUserId().equals(currentUserId)) {
            targetDisplay = "you";
        } else {
            targetDisplay = a.getTargetUserName() != null
                    ? a.getTargetUserName() : "someone";
        }

        // ── Replace placeholders ──
        desc = desc.replace("{performer}", performerDisplay);
        desc = desc.replace("{target}", targetDisplay);

        // Replace expense placeholder
        if (a.getExpenseDescription() != null) {
            desc = desc.replace("{expense}", a.getExpenseDescription());
        }

        // ── Fix grammar edge cases ──

        // "You added you to group" → "You added yourself to group"
        if (desc.contains("You added you")) {
            desc = desc.replace("You added you", "You added yourself");
        }

        // "You paid you" → "You paid yourself"
        if (desc.contains("You paid you")) {
            desc = desc.replace("You paid you", "You paid yourself");
        }

        // "You left group" stays as is ✅
        // "You created group" stays as is ✅
        // "You deleted group" stays as is ✅

        // ── Capitalize first letter ──
        if (!desc.isEmpty()) {
            desc = Character.toUpperCase(desc.charAt(0))
                    + desc.substring(1);
        }

        return desc;
    }
}