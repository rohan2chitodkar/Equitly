package com.equitly.dto;

public class UserUpdateRequest {

    private String name;
    private String currency;
    private String oldPassword;
    private String newPassword;

    public String getName() { return name; }
    public String getCurrency() { return currency; }
    public String getOldPassword() { return oldPassword; }
    public String getNewPassword() { return newPassword; }

    public void setName(String name) { this.name = name; }
    public void setCurrency(String currency) { this.currency = currency; }
    public void setOldPassword(String oldPassword) { this.oldPassword = oldPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}