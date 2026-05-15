# ══════════════════════════════════════
# Stage 1 — Build using Maven
# No mvnw needed — uses system Maven
# ══════════════════════════════════════
FROM maven:3.9-eclipse-temurin-17-alpine \
    AS build

WORKDIR /app

# Copy pom.xml first for dependency caching
COPY pom.xml .

# Download all dependencies
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the JAR file
RUN mvn clean package -DskipTests -B

# ══════════════════════════════════════
# Stage 2 — Run the app
# Smaller image — only JRE needed
# ══════════════════════════════════════
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8081

# Run with production profile
ENTRYPOINT ["java", \
    "-jar", \
    "-Dspring.profiles.active=prod", \
    "app.jar"]