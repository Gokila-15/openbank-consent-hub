import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8080",
  realm: "openbank",
  clientId: "openbank-frontend",
});

export default keycloak;