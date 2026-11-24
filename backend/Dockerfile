# Step 1: build the app with Maven
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
# Maven Central rate-limits shared cloud build servers (HTTP 429 Too Many
# Requests), so read it through Google's public mirror instead.
COPY docker-settings.xml .
COPY pom.xml .
COPY src ./src
RUN mvn -q -s docker-settings.xml -DskipTests package

# Step 2: run it with a small Java 21 image
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
