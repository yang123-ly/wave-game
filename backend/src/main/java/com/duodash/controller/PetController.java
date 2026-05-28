package com.duodash.controller;

import com.duodash.dto.PetDTOs;
import com.duodash.service.PetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 宠物 REST API
 *
 * 路径说明：application.yml 已配 server.servlet.context-path=/api，
 * 因此 @RequestMapping 不需要再带 /api 前缀。
 *
 * 当前用户：项目暂未启用 JWT 过滤器，临时通过 X-User-Id 请求头传递。
 * 前端 axios 拦截器会从 localStorage.user.id 自动注入。
 */
@RestController
@RequestMapping("/pets")
@RequiredArgsConstructor
public class PetController {

  private final PetService petService;

  /** 列出我的全部宠物 */
  @GetMapping
  public ResponseEntity<List<PetDTOs.PetDTO>> list(
      @RequestHeader("X-User-Id") Long userId) {
    return ResponseEntity.ok(petService.listMyPets(userId));
  }

  /** 收养新宠物 */
  @PostMapping
  public ResponseEntity<PetDTOs.PetDTO> create(
      @RequestHeader("X-User-Id") Long userId,
      @Valid @RequestBody PetDTOs.CreateRequest req) {
    return ResponseEntity.ok(petService.createPet(userId, req));
  }

  /** 改名 */
  @PatchMapping("/{id}")
  public ResponseEntity<PetDTOs.PetDTO> rename(
      @RequestHeader("X-User-Id") Long userId,
      @PathVariable Long id,
      @Valid @RequestBody PetDTOs.RenameRequest req) {
    return ResponseEntity.ok(petService.renamePet(userId, id, req));
  }

  /** 放生 */
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @RequestHeader("X-User-Id") Long userId,
      @PathVariable Long id) {
    petService.deletePet(userId, id);
    return ResponseEntity.noContent().build();
  }

  /** 训练加经验 */
  @PostMapping("/{id}/exp")
  public ResponseEntity<PetDTOs.PetDTO> addExp(
      @RequestHeader("X-User-Id") Long userId,
      @PathVariable Long id,
      @Valid @RequestBody PetDTOs.ExpRequest req) {
    return ResponseEntity.ok(petService.addExp(userId, id, req));
  }
}
