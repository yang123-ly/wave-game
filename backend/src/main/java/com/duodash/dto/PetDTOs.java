package com.duodash.dto;

import com.duodash.entity.Pet;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;

public final class PetDTOs {
  @Data
  public static class PetDTO {
    private Long id;
    private String name;
    private String species;
    private Integer level;
    private Integer exp;
    private Integer expToNextLevel;
    private String avatar;
    private Integer mood;
    private LocalDateTime createdAt;

    public static PetDTO from(Pet p) {
      PetDTO d = new PetDTO();
      d.setId(p.getId());
      d.setName(p.getName());
      d.setSpecies(p.getSpecies());
      d.setLevel(p.getLevel());
      d.setExp(p.getExp());
      d.setExpToNextLevel(p.getExpToNextLevel());
      d.setAvatar(p.getAvatar());
      d.setMood(p.getMood());
      d.setCreatedAt(p.getCreatedAt());
      return d;
    }

  }

  @Data
  public static  class CreateRequest {
    @NotBlank(message = "宠物名不能为空")
    @Size(min = 1,max = 16,message = "宠物名1-16个字")
    private  String name;

    @NotBlank(message = "请选择种类")
    @Pattern(regexp = "^(cat|dog|dragon|bird|rabbit)$", message = "种类必须是 cat/dog/dragon/bird/rabbit 之一")
    private String species;
    private String avatar;
  }

  @Data
  public static class RenameRequest {
    @NotBlank
    @Size(min = 1,max = 16,message = "宠物名1-16个字")
    private String name;
  }

  @Data
  public static class ExpRequest {
    @Min(value = 1,message = "经验增量必须 ≥ 1")
    @Max(value = 500, message = "经验增量必须 ≤ 500")
    private Integer delta;
  }
}
