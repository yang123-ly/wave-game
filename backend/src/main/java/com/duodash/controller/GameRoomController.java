package com.duodash.controller;

import com.duodash.dto.GameRoomDTO;
import com.duodash.service.GameRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 游戏房间控制器
 * 
 * @author Duo Dash Team
 */
@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
public class GameRoomController {

    private final GameRoomService gameRoomService;

    /**
     * 创建房间
     */
    @PostMapping
    public ResponseEntity<GameRoomDTO> createRoom(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody GameRoomDTO.CreateRoomRequest request) {
        GameRoomDTO room = gameRoomService.createRoom(userId, request);
        return ResponseEntity.ok(room);
    }

    /**
     * 加入房间
     */
    @PostMapping("/join")
    public ResponseEntity<GameRoomDTO> joinRoom(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody GameRoomDTO.JoinRoomRequest request) {
        GameRoomDTO room = gameRoomService.joinRoom(userId, request.getRoomCode());
        return ResponseEntity.ok(room);
    }

    /**
     * 获取房间信息
     */
    @GetMapping("/{roomCode}")
    public ResponseEntity<GameRoomDTO.RoomInfoResponse> getRoomInfo(@PathVariable String roomCode) {
        GameRoomDTO.RoomInfoResponse room = gameRoomService.getRoomInfo(roomCode);
        return ResponseEntity.ok(room);
    }

    /**
     * 获取所有等待中的房间
     */
    @GetMapping("/waiting")
    public ResponseEntity<List<GameRoomDTO.RoomInfoResponse>> getWaitingRooms() {
        List<GameRoomDTO.RoomInfoResponse> rooms = gameRoomService.getWaitingRooms();
        return ResponseEntity.ok(rooms);
    }

    /**
     * 离开房间
     */
    @DeleteMapping
    public ResponseEntity<Void> leaveRoom(@RequestHeader("X-User-Id") Long userId) {
        gameRoomService.leaveRoom(userId);
        return ResponseEntity.ok().build();
    }

    /**
     * 开始游戏
     */
    @PostMapping("/{roomId}/start")
    public ResponseEntity<Void> startGame(@PathVariable Long roomId) {
        gameRoomService.startGame(roomId);
        return ResponseEntity.ok().build();
    }

    /**
     * 结束房间
     */
    @PostMapping("/{roomId}/end")
    public ResponseEntity<Void> endRoom(@PathVariable Long roomId) {
        gameRoomService.endRoom(roomId);
        return ResponseEntity.ok().build();
    }
}
