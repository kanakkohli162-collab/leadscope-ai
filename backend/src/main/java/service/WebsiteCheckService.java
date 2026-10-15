package com.leadscope.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.net.*;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Year;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Website Checker (Synopsis 8.5 "Digital Presence Analysis – website appears outdated").
 * Opens a business website once and reports: does it open, HTTPS, mobile-friendly,
 * speed, page description and how old the © year is. Score starts at 100 and loses
 * points for each problem.
 *
 * Safety: only public http/https websites are fetched. Every address (and every
 * redirect) is resolved first, and private / internal addresses are refused.
 */
@Service
public class WebsiteCheckService {

    private static final Duration TIMEOUT = Duration.ofSeconds(8);
    private static final int MAX_REDIRECTS = 3;
    private static final int MAX_BYTES = 1024 * 1024; // read at most 1 MB of HTML
    private static final String USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

    private static final Pattern VIEWPORT = Pattern.compile("<meta[^>]*name\\s*=\\s*[\"']?viewport", Pattern.CASE_INSENSITIVE);
    private static final Pattern DESCRIPTION = Pattern.compile("<meta[^>]*name\\s*=\\s*[\"']?description", Pattern.CASE_INSENSITIVE);
    private static final Pattern TITLE = Pattern.compile("<title[^>]*>(.*?)</title>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern COPYRIGHT = Pattern.compile("(©|&copy;|&#169;|copyright)(.{0,80})", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern YEAR = Pattern.compile("\\b(19[9]\\d|20\\d\\d)\\b");

    // Redirects are followed by hand, so each new address can be checked first
    private final HttpClient http = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NEVER)
            .connectTimeout(TIMEOUT)
            .build();

    private final ExecutorService readers = Executors.newCachedThreadPool(r -> {
        Thread t = new Thread(r, "website-check-reader");
        t.setDaemon(true);
        return t;
    });

    public Map<String, Object> check(String input) {
        return report(fetchSafely(input));
    }

    /** A fetched homepage, for other features (e.g. Contacts & social). `html` is empty when it did not open. */
    public record Page(boolean reachable, String finalUrl, String html, String problem) { }

    /** Opens a public website with the same safety rules as the checker (no private IPs, 8 s timeout, max 1 MB). */
    public Page fetchPage(String input) {
        Fetch f = fetchSafely(input);
        return new Page(f.reachable, f.finalUrl.toString(), f.reachable ? f.html : "", f.problem);
    }

    private Fetch fetchSafely(String input) {
        if (input == null || input.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter a website address.");
        }
        String text = input.trim();
        boolean schemeTyped = text.matches("(?i)^[a-z][a-z0-9+.-]*://.*");
        URI first = toUri(schemeTyped ? text : "https://" + text);

        Fetch fetch = fetch(first);
        // No scheme typed and https did not open → try plain http once
        if (!fetch.reachable && fetch.statusCode == null && !schemeTyped) {
            Fetch plain = fetch(toUri("http://" + text));
            if (plain.reachable || plain.statusCode != null) fetch = plain;
        }
        return fetch;
    }

    // ---------- fetching ----------

    private static class Fetch {
        boolean reachable;
        Integer statusCode;
        URI finalUrl;
        long loadTimeMs;
        String html = "";
        String problem; // why it did not open, in plain words
    }

    private Fetch fetch(URI start) {
        Fetch f = new Fetch();
        f.finalUrl = start;
        long begin = System.nanoTime();
        long deadline = begin + TIMEOUT.toNanos();
        URI current = start;

        try {
            for (int hop = 0; ; hop++) {
                checkPublic(current);
                long left = Math.max(1, (deadline - System.nanoTime()) / 1_000_000);
                HttpRequest req = HttpRequest.newBuilder(current)
                        .timeout(Duration.ofMillis(left))
                        .header("User-Agent", USER_AGENT)
                        .header("Accept", "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8")
                        .GET()
                        .build();
                HttpResponse<InputStream> res = http.send(req, HttpResponse.BodyHandlers.ofInputStream());
                f.statusCode = res.statusCode();
                f.finalUrl = current;

                String location = res.headers().firstValue("Location").orElse(null);
                if (res.statusCode() >= 300 && res.statusCode() < 400 && location != null) {
                    res.body().close();
                    if (hop >= MAX_REDIRECTS) {
                        f.problem = "Website sends visitors around in too many redirects";
                        return f;
                    }
                    current = current.resolve(location.trim().replace(" ", "%20"));
                    continue;
                }

                f.html = readLimited(res.body(), deadline);
                f.loadTimeMs = (System.nanoTime() - begin) / 1_000_000;
                f.reachable = res.statusCode() < 400;
                if (!f.reachable) f.problem = "Website shows an error page (code " + res.statusCode() + ")";
                return f;
            }
        } catch (BlockedAddress e) {
            f.statusCode = null;
            f.problem = "Website redirects to an address we can't check";
        } catch (HttpTimeoutException | TimeoutException e) {
            f.problem = "Website took too long to open (over 8 s)";
        } catch (UnknownHostException e) {
            f.statusCode = null;
            f.problem = "Website address does not exist";
        } catch (Exception e) {
            f.problem = "Website does not open";
        }
        f.loadTimeMs = (System.nanoTime() - begin) / 1_000_000;
        return f;
    }

    /** Reads at most 1 MB, and gives up when the 8-second deadline passes. */
    private String readLimited(InputStream in, long deadline) throws Exception {
        Future<byte[]> job = readers.submit(() -> {
            try (in) {
                return in.readNBytes(MAX_BYTES);
            }
        });
        try {
            long left = Math.max(1, deadline - System.nanoTime());
            return new String(job.get(left, TimeUnit.NANOSECONDS), StandardCharsets.UTF_8);
        } catch (TimeoutException e) {
            job.cancel(true);
            try { in.close(); } catch (IOException ignored) { }
            throw e;
        }
    }

    // ---------- safety ----------

    private static class BlockedAddress extends Exception { }

    private URI toUri(String text) {
        try {
            URI uri = new URI(text.replace(" ", "%20"));
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
            if (!scheme.equals("http") && !scheme.equals("https")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only website addresses (http or https) can be checked.");
            }
            if (uri.getHost() == null || !uri.getHost().contains(".")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That doesn't look like a website address. Try something like example.com");
            }
            checkPublic(uri);
            return uri;
        } catch (URISyntaxException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That doesn't look like a website address. Try something like example.com");
        } catch (BlockedAddress e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This address can't be checked. Please enter a public website.");
        } catch (UnknownHostException e) {
            return URI.create(text.replace(" ", "%20")); // fetch() reports "does not exist"
        }
    }

    /** Refuses anything that is not a public website: wrong scheme, odd port, or a private address. */
    private void checkPublic(URI uri) throws BlockedAddress, UnknownHostException {
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
        if (!scheme.equals("http") && !scheme.equals("https")) throw new BlockedAddress();
        int port = uri.getPort();
        if (port != -1 && port != 80 && port != 443) throw new BlockedAddress();
        String host = uri.getHost();
        if (host == null || host.equalsIgnoreCase("localhost") || host.toLowerCase().endsWith(".localhost")) {
            throw new BlockedAddress();
        }
        for (InetAddress a : InetAddress.getAllByName(host)) {
            if (isPrivate(a)) throw new BlockedAddress();
        }
    }

    private boolean isPrivate(InetAddress a) {
        if (a.isAnyLocalAddress() || a.isLoopbackAddress() || a.isLinkLocalAddress()
                || a.isSiteLocalAddress() || a.isMulticastAddress()) {
            return true; // 0.0.0.0, 127.x, ::1, 169.254.x, fe80::, 10.x, 172.16–31.x, 192.168.x
        }
        byte[] b = a.getAddress();
        if (b.length == 4) {
            int x = b[0] & 0xFF, y = b[1] & 0xFF;
            return x == 0                                // 0.0.0.0/8
                    || (x == 100 && y >= 64 && y <= 127) // 100.64.0.0/10 carrier NAT
                    || (x == 198 && (y == 18 || y == 19)) // 198.18.0.0/15 test networks
                    || x >= 240;                         // reserved + broadcast
        }
        return (b[0] & 0xFE) == 0xFC; // fc00::/7 private IPv6
    }

    // ---------- report ----------

    private Map<String, Object> report(Fetch f) {
        boolean https = "https".equalsIgnoreCase(f.finalUrl.getScheme());
        String html = f.html;
        boolean mobile = f.reachable && VIEWPORT.matcher(html).find();
        boolean description = f.reachable && DESCRIPTION.matcher(html).find();
        String title = f.reachable ? title(html) : null;
        Integer year = f.reachable ? copyrightYear(html) : null;
        int thisYear = Year.now().getValue();
        boolean outdated = year != null && thisYear - year >= 3;
        boolean slow = f.reachable && f.loadTimeMs > 3000;

        // Score: start at 100 and take points off for each problem
        int score = 100;
        if (!f.reachable) score -= 40;
        if (!https) score -= 20;
        if (!mobile) score -= 15;
        if (slow) score -= 10;
        if (!description) score -= 10;
        if (outdated) score -= 15;
        score = Math.max(0, score);

        List<String> issues = new ArrayList<>();
        if (!f.reachable) {
            issues.add(f.problem != null ? f.problem : "Website does not open");
            if (!https) issues.add("Not secure (no HTTPS)");
        } else {
            if (!https) issues.add("Not secure (no HTTPS)");
            if (!mobile) issues.add("Not mobile-friendly");
            if (slow) issues.add(String.format(Locale.ROOT, "Slow to load (%.1f s)", f.loadTimeMs / 1000.0));
            if (!description) issues.add("No page description for Google");
            if (outdated) issues.add("Looks outdated (© " + year + ")");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("reachable", f.reachable);
        result.put("statusCode", f.statusCode);
        result.put("finalUrl", f.finalUrl.toString());
        result.put("https", https);
        result.put("loadTimeMs", f.loadTimeMs);
        result.put("mobileFriendly", mobile);
        result.put("title", title);
        result.put("hasMetaDescription", description);
        result.put("copyrightYear", year);
        result.put("outdated", outdated);
        result.put("score", score);
        result.put("issues", issues);
        result.put("suggestion", suggestion(f.reachable, https, mobile, slow, description, outdated));
        return result;
    }

    private String suggestion(boolean reachable, boolean https, boolean mobile, boolean slow,
                              boolean description, boolean outdated) {
        if (!reachable) return "Offer to build a new website. Their current one does not open.";
        List<String> extras = new ArrayList<>();
        if (!mobile) extras.add("mobile support");
        if (!https) extras.add("HTTPS");
        if (slow) extras.add("faster loading");
        if (!description) extras.add("basic SEO");
        if (outdated || !mobile) {
            return "Offer a website redesign" + (extras.isEmpty() ? "" : " with " + joinWords(extras)) + ".";
        }
        if (!extras.isEmpty()) return "Offer a quick website fix: " + joinWords(extras) + ".";
        return "The website looks healthy. Offer other services like SEO or Google profile setup.";
    }

    private String joinWords(List<String> words) {
        if (words.size() == 1) return words.get(0);
        return String.join(", ", words.subList(0, words.size() - 1)) + " and " + words.get(words.size() - 1);
    }

    private String title(String html) {
        Matcher m = TITLE.matcher(html);
        if (!m.find()) return null;
        String t = m.group(1).replaceAll("\\s+", " ")
                .replace("&amp;", "&").replace("&#39;", "'").replace("&quot;", "\"")
                .replace("&lt;", "<").replace("&gt;", ">").trim();
        if (t.isEmpty()) return null;
        return t.length() > 120 ? t.substring(0, 120) + "…" : t;
    }

    /** Latest year written near "©" or "copyright" (future years are ignored). */
    private Integer copyrightYear(String html) {
        String text = html.replaceAll("(?is)<(script|style)[^>]*>.*?</\\1>", " ").replaceAll("<[^>]+>", " ");
        int thisYear = Year.now().getValue();
        Integer best = null;
        Matcher m = COPYRIGHT.matcher(text);
        while (m.find()) {
            Matcher y = YEAR.matcher(m.group(2));
            while (y.find()) {
                int year = Integer.parseInt(y.group(1));
                if (year <= thisYear && (best == null || year > best)) best = year;
            }
        }
        return best;
    }
}
