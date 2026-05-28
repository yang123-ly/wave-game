package com.duodash.service;

import com.duodash.dto.PetDTOs;
import com.duodash.entity.Pet;
import com.duodash.repository.PetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PetService {
  private static  final int MAX_PETS_PER_USER = 6;
  private final PetRepository petRepository;
  public List<PetDTOs.PetDTO> listMyPets (Long userId){
    return  petRepository.findByUserIdOrderByIdAsc(userId).stream()
      .map(PetDTOs.PetDTO::from)
      .collect(Collectors.toList());
  }

  @Transactional
  public PetDTOs.PetDTO createPet(Long userId, PetDTOs.CreateRequest req) {
    long count = petRepository.countByUserId(userId);
    if(count >= MAX_PETS_PER_USER) {
      throw new IllegalStateException("每人最多 " + MAX_PETS_PER_USER + " 只宠物");
    }
    // 2. 【构建对象】设置初始状态
    Pet pet = new Pet();
    pet.setUserId(userId);
    pet.setName(req.getName());
    pet.setSpecies(req.getSpecies());
    pet.setAvatar(req.getAvatar());
    pet.setLevel(1);       // 初始等级 1
    pet.setExp(0);         // 初始经验 0
    pet.setMood(80);       // 初始心情 80
    Pet saved = petRepository.save(pet);
    log.info("user {} adopted pet {} ({})", userId, saved.getId(), saved.getSpecies());
    return PetDTOs.PetDTO.from(saved);
  }
  private Pet getOwnedPet(Long userId,Long petId) {
    return petRepository.findByIdAndUserId(petId,userId)
      .orElseThrow(() -> new IllegalStateException("宠物不存在或无权操作"));
  }

  @Transactional
  public PetDTOs.PetDTO renamePet(Long userId, Long petId, PetDTOs.RenameRequest req) {
    Pet pet = getOwnedPet(userId,petId);
    pet.setName(req.getName());
    return PetDTOs.PetDTO.from(petRepository.save(pet));
  }

  /** 放生宠物 */
  @Transactional
  public void deletePet(Long userId, Long petId) {
    Pet pet = getOwnedPet(userId, petId);
    petRepository.delete(pet);
    log.info("user {} released pet {}", userId, petId);
  }

  /** 训练加经验，自动升级；同时 +10 心情（封顶 100） */
  @Transactional
  public PetDTOs.PetDTO addExp(Long userId, Long petId, PetDTOs.ExpRequest req) {
    Pet pet = getOwnedPet(userId, petId);
    int newExp = pet.getExp() + req.getDelta();
    while (newExp >= pet.getExpToNextLevel()) {
      newExp -= pet.getExpToNextLevel();
      pet.setLevel(pet.getLevel() + 1);
    }
    pet.setExp(newExp);
    pet.setMood(Math.min(100, pet.getMood() + 10));
    return PetDTOs.PetDTO.from(petRepository.save(pet));
  }

}