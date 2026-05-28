package com.duodash.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * 游戏房间数据传输对象
 * 
 * @author Duo Dash Team
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameRoomDTO {

    private Long id;
    private String roomCode;
    private Long hostId;
    private Long player1Id;
    private Long player2Id;
    private Integer status; // 0-等待中, 1-进行中, 2-已结束, 3-已取消
    private Integer mode; // 1-本地对战, 2-在线匹配, 3-好友房间
    private String theme;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    /**
     * 创建房间请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRoomRequest {
        private Integer mode; // 1-本地对战, 2-在线匹配, 3-好友房间
        private String theme;
    }

    /**
     * 加入房间请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JoinRoomRequest {
        private String roomCode;
    }

    /**
     * 房间信息响应
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomInfoResponse {
        private Long id;
        private String roomCode;
        private Long hostId;
        private String hostNickname;
        private Long player1Id;
        private String player1Nickname;
        private Long player2Id;
        private String player2Nickname;
        private Integer status;
        private Integer mode;
        private String theme;
        private int playerCount;
    }
}
