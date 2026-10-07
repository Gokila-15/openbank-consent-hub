package com.example.openbank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class OpenbankApplication {

	public static void main(String[] args) {
		SpringApplication.run(OpenbankApplication.class, args);
	}

}

