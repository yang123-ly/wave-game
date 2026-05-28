package com.duodash.service;

import com.duodash.dto.GameRoomDTO;
import com.duodash.entity.GameRoom;
import com.duodash.entity.User;
import com.duodash.repository.GameRoomRepository;
import com.duodash.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

/**
 * 游戏房间服务
 * 
 * @author Duo Dash Team
 */
@Service
@RequiredArgsConstructor
public class GameRoomService {

    private final GameRoomRepository gameRoomRepository;
    private final UserRepository userRepository;

    private static final Random random = new Random();

    /**
     * 创建游戏房间
     */
    @Transactional
    public GameRoomDTO createRoom(Long userId, GameRoomDTO.CreateRoomRequest request) {
        // 检查用户是否已在房间中
        if (gameRoomRepository.findByPlayerId(userId).isPresent()) {
            throw new RuntimeException("您已在其他房间中");
        }

        // 生成房间码
        String roomCode = generateRoomCode();

        GameRoom room = new GameRoom();
        room.setRoomCode(roomCode);
        room.setHostId(userId);
        room.setPlayer1Id(userId);
        room.setStatus(0); // 等待中
        room.setMode(request.getMode() != null ? request.getMode() : 1);
        room.setTheme(request.getTheme() != null ? request.getTheme() : "default");

        GameRoom savedRoom = gameRoomRepository.save(room);
        return convertToDTO(savedRoom);
    }

    /**
     * 加入房间
     */
    @Transactional
    public GameRoomDTO joinRoom(Long userId, String roomCode) {
        GameRoom room = gameRoomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("房间不存在"));

        if (!room.canJoin()) {
            throw new RuntimeException("房间已满或不可加入");
        }

        // 检查用户是否已在房间中
        if (gameRoomRepository.findByPlayerId(userId).isPresent()) {
            throw new RuntimeException("您已在其他房间中");
        }

        // 加入房间
        if (room.getPlayer1Id() == null) {
            room.setPlayer1Id(userId);
        } else {
            room.setPlayer2Id(userId);
        }

        GameRoom savedRoom = gameRoomRepository.save(room);
        return convertToDTO(savedRoom);
    }

    /**
     * 获取房间信息
     */
    public GameRoomDTO.RoomInfoResponse getRoomInfo(String roomCode) {
        GameRoom room = gameRoomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("房间不存在"));

        return convertToRoomInfoResponse(room);
    }

    /**
     * 获取所有等待中的房间
     */
    public List<GameRoomDTO.RoomInfoResponse> getWaitingRooms() {
        return gameRoomRepository.findWaitingRooms()
                .stream()
                .map(this::convertToRoomInfoResponse)
                .collect(Collectors.toList());
    }

    /**
     * 离开房间
     */
    @Transactional
    public void leaveRoom(Long userId) {
        gameRoomRepository.findByPlayerId(userId).ifPresent(room -> {
            if (room.getHostId().equals(userId)) {
                // 房主离开，取消房间
                room.setStatus(3);
            } else {
                // 普通玩家离开
                if (room.getPlayer1Id().equals(userId)) {
                    room.setPlayer1Id(null);
                } else {
                    room.setPlayer2Id(null);
                }
            }
            gameRoomRepository.save(room);
        });
    }

    /**
     * 开始游戏
     */
    @Transactional
    public void startGame(Long roomId) {
        GameRoom room = gameRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("房间不存在"));

        if (room.getPlayer1Id() == null || room.getPlayer2Id() == null) {
            throw new RuntimeException("房间玩家未满");
        }

        room.setStatus(1); // 进行中
        room.setStartedAt(java.time.LocalDateTime.now());
        gameRoomRepository.save(room);
    }

    /**
     * 结束房间
     */
    @Transactional
    public void endRoom(Long roomId) {
        GameRoom room = gameRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("房间不存在"));

        room.setStatus(2); // 已结束
        room.setEndedAt(java.time.LocalDateTime.now());
        gameRoomRepository.save(room);
    }

    /**
     * 生成房间码
     */
    private String generateRoomCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder roomCode = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            roomCode.append(chars.charAt(random.nextInt(chars.length())));
        }
        return roomCode.toString();
    }

    /**
     * 转换为DTO
     */
    private GameRoomDTO convertToDTO(GameRoom room) {
        GameRoomDTO dto = new GameRoomDTO();
        dto.setId(room.getId());
        dto.setRoomCode(room.getRoomCode());
        dto.setHostId(room.getHostId());
        dto.setPlayer1Id(room.getPlayer1Id());
        dto.setPlayer2Id(room.getPlayer2Id());
        dto.setStatus(room.getStatus());
        dto.setMode(room.getMode());
        dto.setTheme(room.getTheme());
        dto.setCreatedAt(room.getCreatedAt());
        dto.setStartedAt(room.getStartedAt());
        dto.setEndedAt(room.getEndedAt());
        return dto;
    }

    /**
     * 转换为房间信息响应
     */
    private GameRoomDTO.RoomInfoResponse convertToRoomInfoResponse(GameRoom room) {
        GameRoomDTO.RoomInfoResponse response = new GameRoomDTO.RoomInfoResponse();
        response.setId(room.getId());
        response.setRoomCode(room.getRoomCode());
        response.setHostId(room.getHostId());
        response.setStatus(room.getStatus());
        response.setMode(room.getMode());
        response.setTheme(room.getTheme());
        response.setPlayerCount(room.getPlayerCount());

        // 获取房主昵称
        if (room.getHostId() != null) {
            userRepository.findById(room.getHostId()).ifPresent(user -> 
                response.setHostNickname(user.getNickname())
            );
        }

        // 获取玩家1信息
        if (room.getPlayer1Id() != null) {
            response.setPlayer1Id(room.getPlayer1Id());
            userRepository.findById(room.getPlayer1Id()).ifPresent(user -> 
                response.setPlayer1Nickname(user.getNickname())
            );
        }

        // 获取玩家2信息
        if (room.getPlayer2Id() != null) {
            response.setPlayer2Id(room.getPlayer2Id());
            userRepository.findById(room.getPlayer2Id()).ifPresent(user -> 
                response.setPlayer2Nickname(user.getNickname())
            );
        }

        return response;
    }
}
