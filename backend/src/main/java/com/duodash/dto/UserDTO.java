package com.duodash.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * 用户数据传输对象
 * 
 * @author Duo Dash Team
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {

    private Long id;
    private String username;
    private String nickname;
    private String avatarUrl;
    private String email;
    private String phone;
    private Integer totalWins;
    private Integer totalLosses;
    private Double winRate;
    private Integer bestTime;
    private Integer level;
    private Long experience;
    private LocalDateTime lastLoginAt;

    /**
     * 用户注册请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        private String username;
        private String password;
        private String nickname;
        private String email;
        private String phone;
    }

    /**
     * 用户登录请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String username;
        private String password;
    }

    /**
     * 用户信息响应
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfoResponse {
        private Long id;
        private String username;
        private String nickname;
        private String avatarUrl;
        private Integer totalWins;
        private Integer totalLosses;
        private Double winRate;
        private Integer bestTime;
        private Integer level;
        private Long experience;
    }
}
