package com.duodash.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * 游戏对局实体
 * 
 * @author Duo Dash Team
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "game_session")
public class GameSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "player1_id", nullable = false)
    private Long player1Id;

    @Column(name = "player2_id", nullable = false)
    private Long player2Id;

    @Column(name = "winner_id")
    private Long winnerId;

    @Column(name = "mode", nullable = false)
    private Integer mode = 1; // 1-本地对战, 2-在线匹配, 3-好友房间

    @Column(name = "task_sequence_id", length = 50)
    private String taskSequenceId;

    @Column(name = "player1_time")
    private Integer player1Time;

    @Column(name = "player2_time")
    private Integer player2Time;

    @Column(name = "player1_errors")
    private Integer player1Errors = 0;

    @Column(name = "player2_errors")
    private Integer player2Errors = 0;

    @Column(name = "player1_perfect")
    private Integer player1Perfect = 0;

    @Column(name = "player2_perfect")
    private Integer player2Perfect = 0;

    @Column(name = "status", nullable = false)
    private Integer status = 0; // 0-进行中, 1-已结束

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
     * 结束对局
     */
    public void endGame(Long winnerId) {
        this.winnerId = winnerId;
        this.status = 1;
        this.endedAt = LocalDateTime.now();
    }

    /**
     * 开始对局
     */
    public void startGame() {
        this.startedAt = LocalDateTime.now();
    }
}
