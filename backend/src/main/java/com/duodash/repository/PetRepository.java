package com.duodash.repository;

import com.duodash.entity.Pet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PetRepository extends JpaRepository<Pet, Long> {
    List<Pet> findByUserIdOrderByIdAsc(Long userId);
    Optional<Pet> findByIdAndUserId(Long id,Long userId);
    long countByUserId(Long userId);
}
