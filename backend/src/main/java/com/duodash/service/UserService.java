package com.duodash.service;

import com.duodash.dto.UserDTO;
import com.duodash.entity.User;
import com.duodash.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 用户服务
 * 
 * @author Duo Dash Team
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 用户注册
     */
    @Transactional
    public UserDTO register(UserDTO.RegisterRequest request) {
        // 检查用户名是否已存在
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }

        // 检查邮箱是否已存在
        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("邮箱已被注册");
        }

        // 检查手机号是否已存在
        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("手机号已被注册");
        }

        // 创建用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNickname(request.getNickname());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setTotalWins(0);
        user.setTotalLosses(0);
        user.setLevel(1);
        user.setExperience(0L);
        user.setStatus(1);

        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    /**
     * 用户登录
     */
    public UserDTO login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("密码错误");
        }

        if (user.getStatus() == 0) {
            throw new RuntimeException("账号已被禁用");
        }

        // 更新最后登录时间
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        return convertToDTO(user);
    }

    /**
     * 根据ID获取用户信息
     */
    public UserDTO getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        return convertToDTO(user);
    }

    /**
     * 获取排行榜
     *
     * @param type  排序类型：wins / winRate / fastestTime
     * @param limit 返回条数
     */
    public List<UserDTO.UserInfoResponse> getLeaderboard(String type, int limit) {
        int safeLimit = Math.max(1, Math.min(100, limit));
        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(0, safeLimit);

        List<User> users;
        switch (type == null ? "wins" : type) {
            case "winRate":
                users = userRepository.findTopByWinRate(pageable);
                break;
            case "fastestTime":
                users = userRepository.findTopByFastestTime(pageable);
                break;
            case "wins":
            default:
                users = userRepository.findTopByWins(pageable);
                break;
        }
        return users.stream()
                .map(this::convertToUserInfoResponse)
                .collect(Collectors.toList());
    }

    /**
     * 更新用户战绩
     */
    @Transactional
    public void updateGameResult(Long userId, boolean isWin, Integer gameTime) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        if (isWin) {
            user.setTotalWins(user.getTotalWins() + 1);
            // 更新最快通关时间
            if (user.getBestTime() == null || gameTime < user.getBestTime()) {
                user.setBestTime(gameTime);
            }
        } else {
            user.setTotalLosses(user.getTotalLosses() + 1);
        }

        // 增加经验值
        user.setExperience(user.getExperience() + 100);

        // 升级逻辑
        int newLevel = 1 + (int) (user.getExperience() / 1000);
        if (newLevel > user.getLevel()) {
            user.setLevel(newLevel);
        }

        userRepository.save(user);
    }

    /**
     * 转换为DTO
     */
    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setNickname(user.getNickname());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setTotalWins(user.getTotalWins());
        dto.setTotalLosses(user.getTotalLosses());
        dto.setWinRate(user.getWinRate());
        dto.setBestTime(user.getBestTime());
        dto.setLevel(user.getLevel());
        dto.setExperience(user.getExperience());
        dto.setLastLoginAt(user.getLastLoginAt());
        return dto;
    }

    /**
     * 转换为用户信息响应
     */
    private UserDTO.UserInfoResponse convertToUserInfoResponse(User user) {
        return new UserDTO.UserInfoResponse(
                user.getId(),
                user.getUsername(),
                user.getNickname(),
                user.getAvatarUrl(),
                user.getTotalWins(),
                user.getTotalLosses(),
                user.getWinRate(),
                user.getBestTime(),
                user.getLevel(),
                user.getExperience()
        );
    }
}
