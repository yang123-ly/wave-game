package com.duodash.handler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * 全局异常处理器
 * 把业务异常、参数校验异常、数据库唯一约束冲突等转换为友好的 JSON 响应
 *
 * @author Duo Dash Team
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 业务异常（用户名重复、密码错误、用户不存在等）
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException e) {
        log.warn("业务异常: {}", e.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    /**
     * 数据库唯一约束冲突（兜底，万一 Service 校验漏掉了）
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(DataIntegrityViolationException e) {
        log.warn("数据库约束冲突: {}", e.getMostSpecificCause().getMessage());
        String message = "数据已存在或不符合约束规则";
        String causeMsg = e.getMostSpecificCause().getMessage();
        if (causeMsg != null) {
            if (causeMsg.contains("uk_username")) {
                message = "用户名已存在";
            } else if (causeMsg.contains("uk_email")) {
                message = "邮箱已被注册";
            } else if (causeMsg.contains("uk_phone")) {
                message = "手机号已被注册";
            } else if (causeMsg.contains("uk_room_code")) {
                message = "房间号已存在";
            }
        }
        return buildResponse(HttpStatus.CONFLICT, message);
    }

    /**
     * 参数校验异常（@Valid 触发）
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .orElse("参数校验失败");
        return buildResponse(HttpStatus.BAD_REQUEST, message);
    }

    /**
     * 兜底异常（未预期的服务器内部错误）
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception e) {
        log.error("系统异常", e);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "服务器内部错误: " + e.getMessage());
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().format(TIME_FORMATTER));
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}
