package com.equitly.dto;

import java.math.BigDecimal;

public class SettleRequest {

    private String friendId;
    private BigDecimal amount;
    private String groupId;

    public String getFriendId() { return friendId; }
    public BigDecimal getAmount() { return amount; }
    public String getGroupId() { return groupId; }

    public void setFriendId(String friendId) { this.friendId = friendId; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setGroupId(String groupId) { this.groupId = groupId; }
}