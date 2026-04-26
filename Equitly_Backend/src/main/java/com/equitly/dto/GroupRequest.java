package com.equitly.dto;

import java.util.List;

public class GroupRequest {

    private String name;
    private String emoji;
    private List<String> memberIds;

    public String getName() { return name; }
    public String getEmoji() { return emoji; }
    public List<String> getMemberIds() { return memberIds; }

    public void setName(String name) { this.name = name; }
    public void setEmoji(String emoji) { this.emoji = emoji; }
    public void setMemberIds(List<String> memberIds) { this.memberIds = memberIds; }
}