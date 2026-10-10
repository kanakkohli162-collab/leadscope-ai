package com.leadscope.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

// Starts the real app on a random free port (with the H2 test database) and sends
// real HTTP requests to it, exactly like Postman or the React app would.
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AuthFlowTests {

    @Value("${local.server.port}")
    private int port;

    private final HttpClient client = HttpClient.newHttpClient();

    @Test
    void signupThenLoginThenMe() throws Exception {
        HttpResponse<String> signup = post("/api/auth/signup",
                "{\"name\":\"Asha Verma\",\"email\":\"asha@test.com\",\"password\":\"secret123\",\"agencyName\":\"Verma Digital\"}");
        assertEquals(200, signup.statusCode());
        assertTrue(signup.body().contains("\"agencyName\":\"Verma Digital\""));
        assertTrue(!signup.body().contains("password"), "the password must never be sent back");

        HttpResponse<String> login = post("/api/auth/login",
                "{\"email\":\"asha@test.com\",\"password\":\"secret123\"}");
        assertEquals(200, login.statusCode());
        String token = extractToken(login.body());

        HttpResponse<String> me = get("/api/auth/me", token);
        assertEquals(200, me.statusCode());
        assertTrue(me.body().contains("\"email\":\"asha@test.com\""));
    }

    @Test
    void signupWithExistingEmailReturns409() throws Exception {
        String body = "{\"name\":\"Dup\",\"email\":\"dup@test.com\",\"password\":\"secret123\"}";
        post("/api/auth/signup", body);

        HttpResponse<String> again = post("/api/auth/signup", body);
        assertEquals(409, again.statusCode());
        assertTrue(again.body().contains("An account with this email already exists. Please sign in instead."));
    }

    @Test
    void loginWithUnknownEmailReturns404() throws Exception {
        HttpResponse<String> login = post("/api/auth/login",
                "{\"email\":\"nobody@test.com\",\"password\":\"secret123\"}");
        assertEquals(404, login.statusCode());
        assertTrue(login.body().contains("No account found with this email. Please sign up first."));
    }

    @Test
    void loginWithWrongPasswordReturns401() throws Exception {
        post("/api/auth/signup", "{\"name\":\"Ravi\",\"email\":\"ravi@test.com\",\"password\":\"secret123\"}");

        HttpResponse<String> login = post("/api/auth/login",
                "{\"email\":\"ravi@test.com\",\"password\":\"wrong-password\"}");
        assertEquals(401, login.statusCode());
        assertTrue(login.body().contains("Incorrect password. Please try again."));
    }

    @Test
    void protectedEndpointsNeedAToken() throws Exception {
        assertEquals(401, get("/api/leads", null).statusCode());
        assertEquals(401, get("/api/dashboard/summary", null).statusCode());
        assertEquals(401, get("/api/auth/me", null).statusCode());
    }

    @Test
    void invalidTokenIsRejected() throws Exception {
        HttpResponse<String> leads = get("/api/leads", "this-is-not-a-real-token");
        assertEquals(401, leads.statusCode());
        assertTrue(leads.body().contains("Please sign in to continue."));
    }

    @Test
    void validTokenOpensProtectedEndpoints() throws Exception {
        post("/api/auth/signup", "{\"name\":\"Neha\",\"email\":\"neha@test.com\",\"password\":\"secret123\"}");
        String token = extractToken(post("/api/auth/login",
                "{\"email\":\"neha@test.com\",\"password\":\"secret123\"}").body());

        assertEquals(200, get("/api/leads", token).statusCode());
        assertEquals(200, get("/api/dashboard/summary", token).statusCode());
    }

    // ---------- small helpers ----------

    private HttpResponse<String> post(String path, String json) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();
        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> get(String path, String token) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET();
        if (token != null) {
            builder.header("Authorization", "Bearer " + token);
        }
        return client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private String extractToken(String loginResponseBody) {
        Matcher matcher = Pattern.compile("\"token\":\"([^\"]+)\"").matcher(loginResponseBody);
        assertTrue(matcher.find(), "login response should contain a token");
        return matcher.group(1);
    }
}
