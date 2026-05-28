package com.duodash.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * 游戏房间实体
 * 
 * @author Duo Dash Team
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "game_room")
public class GameRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_code", nullable = false, unique = true, length = 20)
    private String roomCode;

    @Column(name = "host_id", nullable = false)
    private Long hostId;

    @Column(name = "player1_id")
    private Long player1Id;

    @Column(name = "player2_id")
    private Long player2Id;

    @Column(name = "status", nullable = false)
    private Integer status = 0; // 0-等待中, 1-进行中, 2-已结束, 3-已取消

    @Column(name = "mode", nullable = false)
    private Integer mode = 1; // 1-本地对战, 2-在线匹配, 3-好友房间

    @Column(name = "theme", length = 50)
    private String theme = "default";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /**
     * 房间是否已满
     */
    public boolean isFull() {
        return player1Id != null && player2Id != null;
    }

    /**
     * 房间是否可加入
     */
    public boolean canJoin() {
        return status == 0 && !isFull();
    }

    /**
     * 获取当前玩家数量
     */
    public int getPlayerCount() {
        int count = 0;
        if (player1Id != null) count++;
        if (player2Id != null) count++;
        return count;
    }
}
