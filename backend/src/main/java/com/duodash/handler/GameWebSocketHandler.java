package com.duodash.handler;

import com.duodash.entity.GameRoom;
import com.duodash.entity.GameSession;
import com.duodash.entity.TaskConfig;
import com.duodash.repository.GameRoomRepository;
import com.duodash.repository.GameSessionRepository;
import com.duodash.repository.TaskConfigRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 游戏 WebSocket 消息处理器
 * 
 * @author Duo Dash Team
 */
@Slf4j
@Component
public class GameWebSocketHandler {

    @Autowired
    private GameRoomRepository gameRoomRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private TaskConfigRepository taskConfigRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // 存储房间状态：roomId -> 状态
    private final Map<Long, GameRoomState> roomStates = new ConcurrentHashMap<>();
    // 存储玩家进度：sessionId -> (playerId -> taskIndex)
    private final Map<Long, Map<Long, Integer>> sessionProgress = new ConcurrentHashMap<>();

    @MessageMapping("/rooms/{roomId}/ready")
    public void onPlayerReady(@DestinationVariable Long roomId, @Payload ReadyMessage message) {
        log.info("Player {} is ready in room {}", message.getPlayerId(), roomId);

        GameRoomState state = roomStates.computeIfAbsent(roomId, this::createRoomState);
        state.addReadyPlayer(message.getPlayerId());

        // 发送房间状态更新
        RoomStatus status = new RoomStatus(roomId, new ArrayList<>(state.getReadyPlayers()), state.getTotalPlayers());
        messagingTemplate.convertAndSendToUser(String.valueOf(message.getPlayerId()), "/queue/room-status", status);
    }

    @MessageMapping("/rooms/{roomId}/start")
    public void onStartGame(@DestinationVariable Long roomId, @Payload StartGameMessage message) {
        log.info("Starting game in room {}", roomId);

        GameRoom room = gameRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found: " + roomId));

        // 生成任务序列
        List<TaskConfig> tasks = generateTaskSequence();

        // 创建游戏会话
        GameSession session = new GameSession();
        session.setRoomId(room.getId());
        session.setPlayer1Id(room.getPlayer1Id() != null ? room.getPlayer1Id() : 0L);
        session.setPlayer2Id(room.getPlayer2Id() != null ? room.getPlayer2Id() : 0L);
        session.setMode(room.getMode());
        session.setStatus(0);
        session.startGame();
        gameSessionRepository.save(session);

        // 更新房间状态
        GameRoomState state = roomStates.computeIfAbsent(roomId, this::createRoomState);
        state.setGameSession(session);
        state.setTaskSequence(tasks);

        // 初始化进度
        Map<Long, Integer> progress = new ConcurrentHashMap<>();
        progress.put(session.getPlayer1Id(), 0);
        progress.put(session.getPlayer2Id(), 0);
        sessionProgress.put(session.getId(), progress);

        // 发送游戏开始通知
        GameStartedMessage gameStarted = new GameStartedMessage(
                roomId,
                session.getId(),
                tasks,
                message.getPlayerId()
        );

        // 通知房间内所有玩家
        for (Long playerId : state.getReadyPlayers()) {
            messagingTemplate.convertAndSendToUser(String.valueOf(playerId), "/queue/game-started", gameStarted);
        }
    }

    @MessageMapping("/games/{sessionId}/task-result")
    public void onTaskResult(@DestinationVariable Long sessionId, @Payload TaskResultMessage message) {
        log.info("Task result received: sessionId={}, taskId={}, result={}",
                sessionId, message.getTaskId(), message.getResult());

        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

        GameRoomState state = roomStates.get(session.getRoomId());
        if (state == null) {
            log.warn("Room state not found for session {}", sessionId);
            return;
        }

        Map<Long, Integer> progress = sessionProgress.computeIfAbsent(sessionId, k -> new ConcurrentHashMap<>());
        int currentTaskIndex = progress.getOrDefault(message.getPlayerId(), 0);

        if ("SUCCESS".equals(message.getResult())) {
            currentTaskIndex++;
            progress.put(message.getPlayerId(), currentTaskIndex);

            // 累加用时
            if (message.getPlayerId().equals(session.getPlayer1Id())) {
                session.setPlayer1Time((session.getPlayer1Time() == null ? 0 : session.getPlayer1Time()) + (int) message.getTimeSpent());
            } else if (message.getPlayerId().equals(session.getPlayer2Id())) {
                session.setPlayer2Time((session.getPlayer2Time() == null ? 0 : session.getPlayer2Time()) + (int) message.getTimeSpent());
            }
            gameSessionRepository.save(session);

            // 检查是否完成所有任务
            if (currentTaskIndex >= state.getTaskSequence().size()) {
                endGame(session, message.getPlayerId());
            } else {
                // 发送下一个任务
                TaskConfig nextTask = state.getTaskSequence().get(currentTaskIndex);
                NextTaskMessage nextTaskMsg = new NextTaskMessage(sessionId, message.getPlayerId(), nextTask);
                messagingTemplate.convertAndSendToUser(String.valueOf(message.getPlayerId()), "/queue/next-task", nextTaskMsg);
            }
        } else {
            // 错误处理：记录错误次数
            if (message.getPlayerId().equals(session.getPlayer1Id())) {
                session.setPlayer1Errors((session.getPlayer1Errors() == null ? 0 : session.getPlayer1Errors()) + 1);
            } else if (message.getPlayerId().equals(session.getPlayer2Id())) {
                session.setPlayer2Errors((session.getPlayer2Errors() == null ? 0 : session.getPlayer2Errors()) + 1);
            }
            gameSessionRepository.save(session);
        }

        // 发送进度更新给所有玩家
        int player1Index = progress.getOrDefault(session.getPlayer1Id(), 0);
        int player2Index = progress.getOrDefault(session.getPlayer2Id(), 0);
        ProgressUpdateMessage progressMsg = new ProgressUpdateMessage(
                sessionId, player1Index, player2Index, state.getTaskSequence().size()
        );

        for (Long playerId : state.getReadyPlayers()) {
            messagingTemplate.convertAndSendToUser(String.valueOf(playerId), "/queue/progress-update", progressMsg);
        }
    }

    @MessageMapping("/rooms/{roomId}/leave")
    public void onPlayerLeave(@DestinationVariable Long roomId, @Payload LeaveMessage message) {
        log.info("Player {} leaving room {}", message.getPlayerId(), roomId);

        GameRoomState state = roomStates.get(roomId);
        if (state != null) {
            state.removePlayer(message.getPlayerId());

            RoomStatus status = new RoomStatus(roomId, new ArrayList<>(state.getReadyPlayers()), state.getTotalPlayers());
            for (Long playerId : state.getReadyPlayers()) {
                messagingTemplate.convertAndSendToUser(String.valueOf(playerId), "/queue/room-status", status);
            }
        }
    }

    private List<TaskConfig> generateTaskSequence() {
        List<TaskConfig> allTasks = taskConfigRepository.findAll();
        int taskCount = 5 + new Random().nextInt(4); // 5-8 个任务

        return allTasks.stream()
                .sorted(Comparator.comparingDouble(r -> Math.random()))
                .limit(taskCount)
                .collect(Collectors.toList());
    }

    private GameRoomState createRoomState(Long roomId) {
        GameRoom room = gameRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found: " + roomId));
        return new GameRoomState(roomId, room);
    }

    private void endGame(GameSession session, Long winnerId) {
        session.endGame(winnerId);
        gameSessionRepository.save(session);

        GameRoomState state = roomStates.get(session.getRoomId());
        if (state != null) {
            Map<Long, Integer> progress = sessionProgress.getOrDefault(session.getId(), new HashMap<>());
            int player1Index = progress.getOrDefault(session.getPlayer1Id(), 0);
            int player2Index = progress.getOrDefault(session.getPlayer2Id(), 0);

            GameEndedMessage ended = new GameEndedMessage(
                    session.getId(), winnerId, player1Index, player2Index
            );

            for (Long playerId : state.getReadyPlayers()) {
                messagingTemplate.convertAndSendToUser(String.valueOf(playerId), "/queue/game-ended", ended);
            }
        }
    }

    // 内部消息类
    public static class ReadyMessage {
        private Long playerId;
        public Long getPlayerId() { return playerId; }
        public void setPlayerId(Long playerId) { this.playerId = playerId; }
    }

    public static class StartGameMessage {
        private Long playerId;
        public Long getPlayerId() { return playerId; }
        public void setPlayerId(Long playerId) { this.playerId = playerId; }
    }

    public static class TaskResultMessage {
        private Long taskId;
        private String result;
        private Long playerId;
        private long timeSpent;

        public Long getTaskId() { return taskId; }
        public void setTaskId(Long taskId) { this.taskId = taskId; }
        public String getResult() { return result; }
        public void setResult(String result) { this.result = result; }
        public Long getPlayerId() { return playerId; }
        public void setPlayerId(Long playerId) { this.playerId = playerId; }
        public long getTimeSpent() { return timeSpent; }
        public void setTimeSpent(long timeSpent) { this.timeSpent = timeSpent; }
    }

    public static class LeaveMessage {
        private Long playerId;
        public Long getPlayerId() { return playerId; }
        public void setPlayerId(Long playerId) { this.playerId = playerId; }
    }

    public static class RoomStatus {
        private Long roomId;
        private List<Long> readyPlayers;
        private int totalPlayers;

        public RoomStatus() {}
        public RoomStatus(Long roomId, List<Long> readyPlayers, int totalPlayers) {
            this.roomId = roomId;
            this.readyPlayers = readyPlayers;
            this.totalPlayers = totalPlayers;
        }

        public Long getRoomId() { return roomId; }
        public void setRoomId(Long roomId) { this.roomId = roomId; }
        public List<Long> getReadyPlayers() { return readyPlayers; }
        public void setReadyPlayers(List<Long> readyPlayers) { this.readyPlayers = readyPlayers; }
        public int getTotalPlayers() { return totalPlayers; }
        public void setTotalPlayers(int totalPlayers) { this.totalPlayers = totalPlayers; }
    }

    public static class GameStartedMessage {
        private Long roomId;
        private Long sessionId;
        private List<TaskConfig> taskSequence;
        private Long playerId;

        public GameStartedMessage() {}
        public GameStartedMessage(Long roomId, Long sessionId, List<TaskConfig> taskSequence, Long playerId) {
            this.roomId = roomId;
            this.sessionId = sessionId;
            this.taskSequence = taskSequence;
            this.playerId = playerId;
        }

        public Long getRoomId() { return roomId; }
        public void setRoomId(Long roomId) { this.roomId = roomId; }
        public Long getSessionId() { return sessionId; }
        public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
        public List<TaskConfig> getTaskSequence() { return taskSequence; }
        public void setTaskSequence(List<TaskConfig> taskSequence) { this.taskSequence = taskSequence; }
        public Long getPlayerId() { return playerId; }
        public void setPlayerId(Long playerId) { this.playerId = playerId; }
    }

    public static class NextTaskMessage {
        private Long sessionId;
        private Long playerId;
        private TaskConfig task;

        public NextTaskMessage() {}
        public NextTaskMessage(Long sessionId, Long playerId, TaskConfig task) {
            this.sessionId = sessionId;
            this.playerId = playerId;
            this.task = task;
        }

        public Long getSessionId() { return sessionId; }
        public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
        public Long getPlayerId() { return playerId; }
        public void setPlayerId(Long playerId) { this.playerId = playerId; }
        public TaskConfig getTask() { return task; }
        public void setTask(TaskConfig task) { this.task = task; }
    }

    public static class ProgressUpdateMessage {
        private Long sessionId;
        private int player1TaskIndex;
        private int player2TaskIndex;
        private int totalTasks;

        public ProgressUpdateMessage() {}
        public ProgressUpdateMessage(Long sessionId, int player1TaskIndex, int player2TaskIndex, int totalTasks) {
            this.sessionId = sessionId;
            this.player1TaskIndex = player1TaskIndex;
            this.player2TaskIndex = player2TaskIndex;
            this.totalTasks = totalTasks;
        }

        public Long getSessionId() { return sessionId; }
        public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
        public int getPlayer1TaskIndex() { return player1TaskIndex; }
        public void setPlayer1TaskIndex(int player1TaskIndex) { this.player1TaskIndex = player1TaskIndex; }
        public int getPlayer2TaskIndex() { return player2TaskIndex; }
        public void setPlayer2TaskIndex(int player2TaskIndex) { this.player2TaskIndex = player2TaskIndex; }
        public int getTotalTasks() { return totalTasks; }
        public void setTotalTasks(int totalTasks) { this.totalTasks = totalTasks; }
    }

    public static class GameEndedMessage {
        private Long sessionId;
        private Long winnerId;
        private int player1TaskIndex;
        private int player2TaskIndex;

        public GameEndedMessage() {}
        public GameEndedMessage(Long sessionId, Long winnerId, int player1TaskIndex, int player2TaskIndex) {
            this.sessionId = sessionId;
            this.winnerId = winnerId;
            this.player1TaskIndex = player1TaskIndex;
            this.player2TaskIndex = player2TaskIndex;
        }

        public Long getSessionId() { return sessionId; }
        public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
        public Long getWinnerId() { return winnerId; }
        public void setWinnerId(Long winnerId) { this.winnerId = winnerId; }
        public int getPlayer1TaskIndex() { return player1TaskIndex; }
        public void setPlayer1TaskIndex(int player1TaskIndex) { this.player1TaskIndex = player1TaskIndex; }
        public int getPlayer2TaskIndex() { return player2TaskIndex; }
        public void setPlayer2TaskIndex(int player2TaskIndex) { this.player2TaskIndex = player2TaskIndex; }
    }

    // 房间状态管理
    private static class GameRoomState {
        private final Long roomId;
        private final GameRoom room;
        private final Set<Long> readyPlayers = ConcurrentHashMap.newKeySet();
        private GameSession gameSession;
        private List<TaskConfig> taskSequence;

        public GameRoomState(Long roomId, GameRoom room) {
            this.roomId = roomId;
            this.room = room;
        }

        public void addReadyPlayer(Long playerId) {
            readyPlayers.add(playerId);
        }

        public void removePlayer(Long playerId) {
            readyPlayers.remove(playerId);
        }

        public Set<Long> getReadyPlayers() {
            return readyPlayers;
        }

        public int getTotalPlayers() {
            return readyPlayers.size();
        }

        public GameSession getGameSession() {
            return gameSession;
        }

        public void setGameSession(GameSession gameSession) {
            this.gameSession = gameSession;
        }

        public List<TaskConfig> getTaskSequence() {
            return taskSequence;
        }

        public void setTaskSequence(List<TaskConfig> taskSequence) {
            this.taskSequence = taskSequence;
        }
    }
}
