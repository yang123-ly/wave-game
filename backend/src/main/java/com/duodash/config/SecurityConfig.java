package com.duodash.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * 安全配置
 * 
 * @author Duo Dash Team
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.disable())
            // 注意：context-path=/api 已生效，此处路径不需要再带 /api 前缀
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/users/register", "/users/login").permitAll()
                .requestMatchers("/rooms/**").permitAll()
                .requestMatchers("/tasks/**").permitAll()
                .requestMatchers("/leaderboard/**").permitAll()
                .requestMatchers("/ws-game/**").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                .anyRequest().permitAll()  // 开发期：开放所有接口，后续可改为 authenticated()
            );
        return http.build();
    }
}
