# Step 1: build the app with Maven
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN for i in 1 2 3 4 5; do \
      mvn -q -DskipTests package && exit 0; \
      echo "Maven build failed (try $i of 5)"; \
      if [ "$i" -lt 5 ]; then echo "Retrying in 60 seconds..."; sleep 60; fi; \
    done; \
    echo "Maven build failed after 5 tries"; exit 1

# Step 2: run it with a small Java 21 image
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]