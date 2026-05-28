package com.duodash.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "pet")
public class Pet {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id",nullable = false)
  private Long userId;

  @Column(name = "name",nullable = false)
  private String name;

  @Column(name = "species",nullable = false)
  private String species;

  @Column(name = "level",nullable = false)
  private Integer level = 1;

  @Column(name = "exp", nullable = false)
  private Integer exp = 0;

  @Column(name = "avatar", length = 255)
  private String avatar;

  @Column(name = "mood", nullable = false)
  private Integer mood = 80;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  protected  void onUpdate() {
    updatedAt = LocalDateTime.now();
  }

  public int getExpToNextLevel() {
    return 100 * level;
  }
}
