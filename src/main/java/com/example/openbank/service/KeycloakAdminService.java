package com.example.openbank.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class KeycloakAdminService {

    @Value("${keycloak.admin.server-url}")
    private String keycloakServerUrl;

    // Realm where the service-account client exists
    @Value("${keycloak.admin.realm}")
    private String adminRealm;

    // Realm where OpenBank users and roles exist
    @Value("${keycloak.target.realm}")
    private String targetRealm;

    @Value("${keycloak.admin.client-id}")
    private String clientId;

    @Value("${keycloak.admin.client-secret}")
    private String clientSecret;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public KeycloakAdminService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    // =========================================================
    // CREATE CUSTOMER USER
    // =========================================================

    public void createCustomerUser(
            String username,
            String email,
            String firstName,
            String lastName,
            String password) {

        // Get admin token from MASTER realm
        String adminToken = getAdminToken();

        // Create user in OPENBANK realm
        String userId = createUser(
                adminToken,
                username,
                email,
                firstName,
                lastName,
                password
        );

        // Assign CUSTOMER role in OPENBANK realm
        assignCustomerRole(adminToken, userId);
    }

    // =========================================================
    // GET ADMIN TOKEN
    // =========================================================

    private String getAdminToken() {

        String tokenUrl =
                keycloakServerUrl
                        + "/realms/"
                        + adminRealm
                        + "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_FORM_URLENCODED
        );

        MultiValueMap<String, String> body =
                new LinkedMultiValueMap<>();

        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("grant_type", "client_credentials");

        HttpEntity<MultiValueMap<String, String>> request =
                new HttpEntity<>(body, headers);

        ResponseEntity<String> response =
                restTemplate.postForEntity(
                        tokenUrl,
                        request,
                        String.class
                );

        try {

            JsonNode json =
                    objectMapper.readTree(response.getBody());

            return json.get("access_token").asText();

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to obtain Keycloak admin token",
                    e
            );
        }
    }

    // =========================================================
    // CREATE USER IN OPENBANK REALM
    // =========================================================

    private String createUser(
            String adminToken,
            String username,
            String email,
            String firstName,
            String lastName,
            String password) {

        String url =
                keycloakServerUrl
                        + "/admin/realms/"
                        + targetRealm
                        + "/users";

        HttpHeaders headers = new HttpHeaders();

        headers.setBearerAuth(adminToken);

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        Map<String, Object> user =
                new HashMap<>();

        user.put("username", username);
        user.put("enabled", true);
        user.put("email", email);
        user.put("firstName", firstName);
        user.put("lastName", lastName);

        Map<String, Object> credential =
                new HashMap<>();

        credential.put("type", "password");
        credential.put("value", password);
        credential.put("temporary", false);

        user.put(
                "credentials",
                List.of(credential)
        );

        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(user, headers);

        ResponseEntity<Void> response =
                restTemplate.exchange(
                        url,
                        HttpMethod.POST,
                        request,
                        Void.class
                );

        if (!response.getStatusCode()
                .equals(HttpStatus.CREATED)) {

            throw new RuntimeException(
                    "Failed to create Keycloak user"
            );
        }

        String location =
                response.getHeaders()
                        .getFirst("Location");

        if (location == null) {

            throw new RuntimeException(
                    "Keycloak user created but user ID was not returned"
            );
        }

        return location.substring(
                location.lastIndexOf("/") + 1
        );
    }

    // =========================================================
    // ASSIGN CUSTOMER ROLE
    // =========================================================

    private void assignCustomerRole(
            String adminToken,
            String userId) {

        // Get CUSTOMER role from OPENBANK realm
        String roleUrl =
                keycloakServerUrl
                        + "/admin/realms/"
                        + targetRealm
                        + "/roles/CUSTOMER";

        HttpHeaders headers = new HttpHeaders();

        headers.setBearerAuth(adminToken);

        ResponseEntity<Map> roleResponse =
                restTemplate.exchange(
                        roleUrl,
                        HttpMethod.GET,
                        new HttpEntity<>(headers),
                        Map.class
                );

        Map<String, Object> role =
                roleResponse.getBody();

        if (role == null || role.get("id") == null) {

            throw new RuntimeException(
                    "CUSTOMER role not found in Keycloak"
            );
        }

        // Assign CUSTOMER role to the user
        String mappingUrl =
                keycloakServerUrl
                        + "/admin/realms/"
                        + targetRealm
                        + "/users/"
                        + userId
                        + "/role-mappings/realm";

        Map<String, Object> roleRepresentation =
                new HashMap<>();

        roleRepresentation.put(
                "id",
                role.get("id")
        );

        roleRepresentation.put(
                "name",
                "CUSTOMER"
        );

        HttpEntity<List<Map<String, Object>>> request =
                new HttpEntity<>(
                        List.of(roleRepresentation),
                        headers
                );

        ResponseEntity<Void> response =
                restTemplate.exchange(
                        mappingUrl,
                        HttpMethod.POST,
                        request,
                        Void.class
                );

        if (!response.getStatusCode()
                .equals(HttpStatus.NO_CONTENT)) {

            throw new RuntimeException(
                    "Failed to assign CUSTOMER role"
            );
        }
    }
}