package com.duodash.repository;

import com.duodash.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 用户数据访问接口
 * 
 * @author Duo Dash Team
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * 根据用户名查找用户
     */
    Optional<User> findByUsername(String username);

    /**
     * 根据邮箱查找用户
     */
    Optional<User> findByEmail(String email);

    /**
     * 根据手机号查找用户
     */
    Optional<User> findByPhone(String phone);

    /**
     * 检查用户名是否存在
     */
    boolean existsByUsername(String username);

    /**
     * 检查邮箱是否存在
     */
    boolean existsByEmail(String email);

    /**
     * 检查手机号是否存在
     */
    boolean existsByPhone(String phone);

    /**
     * 按总胜场排序
     */
    @Query("SELECT u FROM User u WHERE u.status = 1 " +
           "ORDER BY u.totalWins DESC, u.bestTime ASC NULLS LAST")
    java.util.List<User> findTopByWins(org.springframework.data.domain.Pageable pageable);

    /**
     * 按胜率排序（仅取 totalWins+totalLosses >= 1 的用户，避免 0/0）
     * winRate 表达式：totalWins * 1.0 / (totalWins + totalLosses)
     */
    @Query("SELECT u FROM User u WHERE u.status = 1 AND (u.totalWins + u.totalLosses) > 0 " +
           "ORDER BY (u.totalWins * 1.0 / (u.totalWins + u.totalLosses)) DESC, u.totalWins DESC")
    java.util.List<User> findTopByWinRate(org.springframework.data.domain.Pageable pageable);

    /**
     * 按最快通关时间排序（bestTime 为空的排在最后）
     */
    @Query("SELECT u FROM User u WHERE u.status = 1 AND u.bestTime IS NOT NULL " +
           "ORDER BY u.bestTime ASC")
    java.util.List<User> findTopByFastestTime(org.springframework.data.domain.Pageable pageable);
}
