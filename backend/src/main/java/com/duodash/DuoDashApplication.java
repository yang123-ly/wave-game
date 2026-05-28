package com.duodash;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 双人对决·极速任务王 - 后端应用入口
 * 
 * @author Duo Dash Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableScheduling
public class DuoDashApplication {

    public static void main(String[] args) {
        SpringApplication.run(DuoDashApplication.class, args);
    }
}
