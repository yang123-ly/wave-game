package com.duodash.repository;

import com.duodash.entity.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 游戏对局数据访问接口
 * 
 * @author Duo Dash Team
 */
@Repository
public interface GameSessionRepository extends JpaRepository<GameSession, Long> {

    /**
     * 根据房间ID查找对局
     */
    List<GameSession> findByRoomId(Long roomId);

    /**
     * 根据玩家ID查找对局
     */
    @Query("SELECT s FROM GameSession s WHERE s.player1Id = :playerId OR s.player2Id = :playerId")
    List<GameSession> findByPlayerId(@Param("playerId") Long playerId);

    /**
     * 查找玩家获胜的对局
     */
    List<GameSession> findByWinnerId(Long winnerId);

    /**
     * 查找指定时间范围内的对局
     */
    @Query("SELECT s FROM GameSession s WHERE s.startedAt BETWEEN :startTime AND :endTime")
    List<GameSession> findByTimeRange(@Param("startTime") LocalDateTime startTime, 
                                      @Param("endTime") LocalDateTime endTime);

    /**
     * 查找最近的对局
     */
    @Query("SELECT s FROM GameSession s ORDER BY s.startedAt DESC")
    List<GameSession> findRecentSessions(int limit);

    /**
     * 统计玩家的总对局数
     */
    @Query("SELECT COUNT(s) FROM GameSession s WHERE s.player1Id = :playerId OR s.player2Id = :playerId")
    long countByPlayerId(@Param("playerId") Long playerId);
}
