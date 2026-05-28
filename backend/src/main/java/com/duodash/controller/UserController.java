package com.duodash.controller;

import com.duodash.dto.UserDTO;
import com.duodash.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户控制器
 * 
 * @author Duo Dash Team
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 用户注册
     */
    @PostMapping("/register")
    public ResponseEntity<UserDTO> register(@RequestBody UserDTO.RegisterRequest request) {
        UserDTO user = userService.register(request);
        return ResponseEntity.ok(user);
    }

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public ResponseEntity<UserDTO> login(@RequestBody UserDTO.LoginRequest request) {
        UserDTO user = userService.login(request.getUsername(), request.getPassword());
        return ResponseEntity.ok(user);
    }

    /**
     * 获取用户信息
     */
    @GetMapping("/{userId}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long userId) {
        UserDTO user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }

    /**
     * 获取排行榜
     *
     * @param type  排序类型：wins(总胜场) / winRate(胜率) / fastestTime(极速)
     * @param limit 返回条数，默认 20
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<List<UserDTO.UserInfoResponse>> getLeaderboard(
            @RequestParam(defaultValue = "wins") String type,
            @RequestParam(defaultValue = "20") int limit) {
        List<UserDTO.UserInfoResponse> leaderboard = userService.getLeaderboard(type, limit);
        return ResponseEntity.ok(leaderboard);
    }
}
