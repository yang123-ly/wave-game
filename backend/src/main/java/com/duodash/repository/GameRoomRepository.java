package com.duodash.repository;

import com.duodash.entity.GameRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 游戏房间数据访问接口
 * 
 * @author Duo Dash Team
 */
@Repository
public interface GameRoomRepository extends JpaRepository<GameRoom, Long> {

    /**
     * 根据房间码查找房间
     */
    Optional<GameRoom> findByRoomCode(String roomCode);

    /**
     * 根据房主ID查找房间
     */
    List<GameRoom> findByHostId(Long hostId);

    /**
     * 查找所有等待中的房间
     */
    @Query("SELECT r FROM GameRoom r WHERE r.status = 0 AND r.mode = 2 ORDER BY r.createdAt DESC")
    List<GameRoom> findWaitingRooms();

    /**
     * 查找玩家所在的房间
     */
    @Query("SELECT r FROM GameRoom r WHERE r.player1Id = :playerId OR r.player2Id = :playerId")
    Optional<GameRoom> findByPlayerId(@Param("playerId") Long playerId);

    /**
     * 查找所有进行中的房间
     */
    List<GameRoom> findByStatus(Integer status);
}
