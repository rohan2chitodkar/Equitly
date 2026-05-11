package com.equitly.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.equitly.model.Settlement;
import com.equitly.model.User;
import com.equitly.service.BalanceService;
import com.equitly.service.UserService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/balances")
public class BalanceController {

    private final BalanceService balanceService;
    private final UserService userService;
    
    public BalanceController(BalanceService balanceService, UserService userService) {
		this.balanceService = balanceService;
		this.userService = userService;
	}

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>>
            getBalances(
            @AuthenticationPrincipal
            UserDetails userDetails) {

        User user = userService.getCurrentUser(
                userDetails.getUsername());

        List<BalanceService.BalanceEntry> balances =
                balanceService.getBalances(user.getId());

        List<Map<String, Object>> response =
                balances.stream().map(b -> {
                    Map<String, Object> map =
                            new java.util.HashMap<>();
                    map.put("friendId", b.getFriendId());
                    map.put("friendName",
                            b.getFriendName());
                    map.put("friendEmail",
                            b.getFriendEmail());
                    map.put("netAmount", b.getNetAmount());
                    return map;
                }).collect(java.util.stream
                        .Collectors.toList());

        return ResponseEntity.ok(response);
    }

	@PostMapping("/settle")
	public ResponseEntity<Settlement> settle(
	        @AuthenticationPrincipal UserDetails userDetails,
	        @RequestBody Map<String, Object> body) {

	    User user = userService.getCurrentUser(
	            userDetails.getUsername());
	    String friendId = (String) body.get("friendId");
	    BigDecimal amount = new BigDecimal(
	            body.get("amount").toString());
	    String groupId = (String) body.get("groupId");

	    Settlement settlement = balanceService.settleUp(
	            user.getId(), friendId, amount, groupId);
	    return ResponseEntity.ok(settlement);
	}
}
