FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY target/openbank-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-Duser.timezone=Asia/Kolkata", "-jar", "app.jar"]