# CodeChef API

## Project Overview

CodeChef API is an unofficial Node.js and Express application that scrapes public CodeChef profile pages and turns them into a structured API plus embeddable widgets. The project exists to solve a practical problem: CodeChef exposes useful user information on its website, but it is not packaged in a convenient, stable, developer-friendly API for portfolio sites, analytics dashboards, college leaderboards, or competitive programming tools.

At a high level, the application does four things:

1. It fetches a public CodeChef user profile page.
2. It parses the page into structured JSON.
3. It caches the result to reduce repeated scraping.
4. It exposes the data through JSON endpoints and browser-rendered widgets.

The result is a small but very interview-friendly project because it combines backend architecture, HTML scraping, caching, rate limiting, route design, server-side rendering, third-party dependency management, and production deployment considerations.

This document is intentionally detailed. It is written not just as documentation for the project, but as a study guide for interviews. If you are asked to explain the project in an interview, this file should help you describe:

- what the app does,
- why it exists,
- how the request flow works,
- how the scraper works,
- how the cache and rate limiting protect the service,
- how the widgets are rendered,
- what the main tradeoffs are,
- what could be improved,
- and how to discuss system design around the project.

---

## Problem Statement

CodeChef presents user data such as rating, rank, contest history, and submission activity on its profile pages. That data is useful, but it is embedded in a website designed for humans, not machines. A developer who wants to:

- build a leaderboard,
- create a competitive programming dashboard,
- show rating history on a personal portfolio,
- display a submission heatmap,
- or fetch summary data for multiple users,

has to either manually scrape the website or copy the data by hand.

This project turns the public profile page into a reusable service.

Instead of forcing each consumer to parse CodeChef HTML on their own, the API centralizes the logic in one server. The server handles extraction, response shaping, caching, and a few presentation layers so that consumers can use simple HTTP requests and iframes.

---

## What the Project Provides

The codebase provides three user-facing layers:

### 1. JSON API

The main API lets clients fetch a CodeChef profile in structured form. It includes fields such as:

- user name,
- current rating,
- highest rating,
- star level,
- global rank,
- country rank,
- country name,
- profile image,
- total problems solved,
- contest count,
- last rating change,
- daily submission heatmap,
- and contest rating history.

### 2. Bulk Lookup Endpoint

The service also supports fetching multiple handles at once. That makes it useful for leaderboard pages and club dashboards where many profiles need to be resolved together.

### 3. Embeddable Widgets

The project exposes HTML pages that can be embedded in an iframe:

- a submission heatmap widget,
- and a rating graph widget.

These pages are designed to be dropped into personal sites or profile pages without requiring the consuming app to implement chart logic itself.

---

## Architecture Overview

The architecture is intentionally simple and practical:

- `index.js` boots the Express app.
- `routes/` defines the public HTTP surface.
- `controllers/` contains request handlers.
- `utils/codechefScraper.js` performs scraping, parsing, caching, and retry logic.
- `views/` contains the EJS pages used for the widgets.
- `static/` serves assets.

The request path is straightforward:

1. The client sends a request.
2. Express routes it to a controller.
3. The controller calls `getCodeChefData(handle)`.
4. The scraper checks the cache first.
5. If there is no cached entry, it fetches the CodeChef profile page.
6. Cheerio parses the HTML.
7. The scraper extracts the required fields.
8. The result is cached and returned.
9. The controller sends JSON or renders a widget page.

This is a classic example of a thin controller layer with a single shared service that owns the data extraction logic.

---

## Repository Structure

The top-level project is small and easy to reason about:

```text
Codechef-API/
├── index.js
├── package.json
├── README.md
├── Project.md
├── vercel.json
├── controllers/
│   ├── apiController.js
│   └── viewController.js
├── routes/
│   ├── apiRoutes.js
│   ├── legacyRoutes.js
│   └── viewRoutes.js
├── utils/
│   └── codechefScraper.js
├── views/
│   ├── heatmap.ejs
│   ├── home.ejs
│   └── rating.ejs
└── static/
		└── image/
```

There are also a couple of support files such as `a.html` and `debug_scraper.js`, which look like investigation or debugging artifacts rather than the main production flow.

---

## Tech Stack

The project uses a lightweight and classic Node.js stack:

- **Node.js** for runtime.
- **Express** for HTTP routing and middleware.
- **EJS** for server-side rendered widget pages.
- **Cheerio** for HTML parsing.
- **node-cache** for in-memory caching.
- **express-rate-limit** for basic traffic protection.
- **cors** to allow cross-origin access.

### Why this stack fits the project

This stack is a good fit because the project is fundamentally a scraping gateway and a small web service, not a large database-backed application. Express is enough for routing, Cheerio is ideal for parsing static HTML responses, and in-memory caching is sufficient for a simple deployment model where a cache hit avoids an expensive scrape.

---

## Application Startup

The application starts in `index.js`.

The startup sequence does the following:

1. Creates the Express app.
2. Installs a global rate limiter.
3. Enables CORS.
4. Configures EJS as the view engine.
5. Sets the `views` directory.
6. Serves the `static` directory.
7. Mounts API routes, view routes, and legacy routes.
8. Starts listening on the configured port.

### Middleware Order

The middleware order matters:

- The rate limiter is applied first, so abusive traffic is blocked before hitting the rest of the stack.
- CORS is enabled globally so browser clients and iframes can consume the API.
- The static directory is exposed so asset files can be served without extra routing.
- The view engine is configured before any route tries to render an EJS page.

### Why this order matters in practice

For a scraper-backed service, the expensive work happens during HTML fetch and parsing. Rate limiting early reduces damage from traffic spikes and simple abuse. Static assets and views are lightweight by comparison, but they are still configured once at startup to keep the runtime path simple.

---

## Route Organization

The route structure is intentionally split by responsibility.

### API Routes

Defined in `routes/apiRoutes.js`, these routes return JSON:

- `GET /api/users`
- `GET /api/rating/:handle`
- `GET /api/heatmap-data/:handle`

### View Routes

Defined in `routes/viewRoutes.js`, these routes render EJS pages:

- `GET /`
- `GET /heatmap/:handle`
- `GET /rating/:handle`

### Legacy Routes

Defined in `routes/legacyRoutes.js`, these routes preserve older URL patterns:

- `GET /handle/:handle`
- `GET /:handle`

This means the public surface supports both canonical profile endpoints and compatibility redirects.

---

## Request Flow in Detail

The most important concept in this project is the request flow.

### Example: Full Profile Request

When a client requests `/handle/someuser`, the following happens:

1. Express matches the legacy route.
2. `apiController.getUserProfile` runs.
3. The controller calls `getCodeChefData('someuser')`.
4. The scraper checks whether the result already exists in memory cache.
5. If cached, the data is returned immediately.
6. If not cached, the scraper fetches the public CodeChef user page.
7. Cheerio parses the HTML.
8. Specific selectors and embedded script fragments are used to extract profile fields.
9. The result is stored in cache.
10. The controller returns JSON to the client.

### Why this design is clean

The HTTP layer is thin and the data extraction logic is centralized. That separation makes the code easier to understand and easier to modify. For example, if the CodeChef markup changes, only the scraper should need updates rather than every route.

---

## Scraper Design

The heart of the project is `utils/codechefScraper.js`.

It contains two important functions:

- `fecher(handle)`
- `getCodeChefData(handle)`

### About the naming

The function is named `fecher`, which looks like a misspelling of “fetcher”. The intent is clear even if the name is unusual. In an interview, you can simply describe it as the fetch-and-parse layer.

### Main responsibilities of the scraper

The scraper is responsible for:

- fetching the profile HTML from CodeChef,
- validating the HTTP response,
- parsing the page with Cheerio,
- extracting structured fields,
- pulling the heatmap data from embedded JavaScript,
- pulling rating history from embedded JavaScript,
- handling temporary rate limiting from CodeChef,
- and caching successful responses in memory.

---

## HTML Fetching

The scraper requests the profile page at:

```text
https://www.codechef.com/users/{handle}
```

If the response status is not `200`, the scraper returns an error-shaped object with a status value.

### Why direct HTML fetching is used

CodeChef’s profile page already contains the data the project needs. Rather than depending on an unavailable official API, this project treats the website as the source of truth and extracts the relevant fields from the rendered HTML response.

This is a common pattern in unofficial data services, but it comes with an important tradeoff: the app depends on the stability of the target site’s markup.

---

## Parsing with Cheerio

After fetching the profile HTML, the scraper loads the markup into Cheerio.

Cheerio gives jQuery-like DOM traversal in Node.js without needing a browser runtime. That makes it fast and suitable for server-side scraping.

### Why Cheerio is a good choice here

Cheerio is lightweight and fast. It is ideal when the page HTML already contains most of the data and no JavaScript execution is needed to render the DOM. Since the project is only reading static markup and embedded script text, it does not need a full browser automation tool.

---

## Extracted Data Fields

The scraper extracts a rich profile object.

### Profile Image

The profile image is read from the user details container.

This is useful for frontend cards and widgets, and it makes the API more presentation-friendly.

### Name

The scraper first tries the newer selector in the header and then falls back to an older user-name selector.

This fallback logic is important because it shows that the code was written to survive UI changes on the CodeChef side.

### Current Rating

The current rating is read from the rating number element and converted into an integer.

### Highest Rating

The scraper finds the highest rating from a small text element near the rating header.

### Country Flag and Country Name

The profile includes both country-specific display information and country-specific ranking context.

### Global Rank and Country Rank

The scraper reads rank values from the rating ranks list.

It also handles the case where the rank is not numeric, such as `Inactive`, by leaving the value as a string rather than forcing a bad conversion.

### Star Level

The star badge is extracted from the rating text and normalized into a compact value such as `7★`.

### Total Problems Solved

The scraper reads the total solved count from a heading that contains the label `Total Problems Solved`.

### Contest Count

Contest count is derived from the length of the rating history array.

That is a nice example of computed data rather than directly scraped text.

### Last Rating Change

The scraper computes the most recent rating delta by comparing the last two contest entries. If only one contest exists, it compares the rating to the default starting value used in the code.

This gives clients a quick signal about the most recent performance trend.

### Heatmap Data

The heatmap is not scraped from visible DOM nodes. Instead, the scraper reads the embedded JavaScript variable holding daily submission stats, slices the relevant substring, and parses it as JSON.

### Rating History

The contest rating graph data is similarly extracted from an embedded JavaScript variable.

This is the most fragile part of the scraper because it depends on specific string patterns in the page source.

---

## Embedded Script Parsing

Two pieces of data are extracted from embedded scripts:

- `userDailySubmissionsStats`
- `all_rating`

These are found by searching the raw HTML string and then slicing out the JSON payload between known markers.

### Why this is brittle

This approach works as long as CodeChef keeps the same variable names and layout in the HTML. If the site changes the script format, the parser may break.

### Why it is still used

This kind of parsing is a practical engineering compromise. The data is already available in the page source, and parsing the script text is much lighter than rendering the page in a headless browser. For a project like this, the tradeoff between speed and fragility is reasonable as long as you understand the risk.

---

## Caching Strategy

The project uses `node-cache` for in-memory caching.

### Cache configuration

The cache is configured with:

- a TTL of one hour,
- and a periodic check interval.

### Why caching matters

Scraping is expensive for two reasons:

1. It increases response latency.
2. It increases pressure on the target website.

Caching fixes both problems for repeated requests. If the same handle is requested repeatedly, the service can respond from memory instead of refetching the profile page.

### Cache behavior

The scraper only stores successful responses. That means failed responses are not cached and can be retried later.

### Interview angle

In an interview, this is a strong place to discuss tradeoffs:

- in-memory cache is simple and fast,
- but it is not shared across multiple server instances,
- and it resets when the process restarts.

If the project grew, a distributed cache like Redis would be the natural next step.

---

## Retry Handling

The scraper includes a retry path for HTTP `429` responses.

If CodeChef rate limits the request, the scraper waits briefly and tries again.

### Why this exists

Scraping public sites often triggers rate limiting. A retry after a short delay can convert temporary throttling into a successful request without requiring the client to do anything special.

### Limitation

The retry logic is simple and only retries once after a delay. That is enough for a basic project, but it would be a candidate for improvement in a more robust production system.

---

## API Layer

The API controllers live in `controllers/apiController.js`.

They are intentionally thin and focus on request validation, response shaping, and status codes.

### 1. `getUsers`

This endpoint supports bulk lookups.

#### Behavior

- Reads the `handles` query parameter.
- Splits the comma-separated list into individual handles.
- Rejects requests with more than 100 handles.
- Fetches each handle using the shared scraper.
- Removes heavy fields such as `heatMap` and `ratingData` from the bulk response.
- Returns an array of summary objects.

#### Why the heavy fields are removed

Heatmap data and rating history can be large. For a bulk endpoint, sending those arrays for every user would be expensive and unnecessary for many leaderboard use cases.

### 2. `getUserRating`

Returns only the `ratingData` array for a single handle.

This is useful when a client wants the contest history without the rest of the profile payload.

### 3. `getUserHeatmap`

Returns only the `heatMap` array for a single handle.

This is useful when a client only needs the activity heatmap.

### 4. `getUserProfile`

Returns the full profile object.

#### Special behavior

- If the handle is `favicon.ico`, the controller returns an invalid-handle response.
- If the scraper fails, the controller returns a `404` response.
- If the client provides `fields`, the controller filters the response to just those keys.

#### Field filtering

The `fields` query parameter makes the endpoint more flexible. A client can request only the fields it needs instead of downloading the entire object.

That is a good design choice because it shows the API was built with practical consumption in mind.

### 5. `redirectHandle`

This route preserves legacy behavior.

If the path looks like a handle and does not include a dot, the controller redirects to `/handle/{handle}`.

If the path is not valid, it returns an error object explaining how to correct the URL.

#### Why this route matters

Legacy compatibility is a real-world concern. If users bookmarked older URLs or if other tools linked to the old style, redirects prevent broken links and preserve backward compatibility.

---

## Route Surface and Endpoint Reference

### Full Profile

```http
GET /handle/{username}
```

Returns the full structured profile object.

### Filtered Profile

```http
GET /handle/{username}?fields=name,currentRating,stars
```

Returns only the requested fields if they exist.

### Bulk Profiles

```http
GET /api/users?handles=user1,user2,user3
```

Returns lightweight summary objects for multiple handles.

### Rating History Only

```http
GET /api/rating/{username}
```

Returns only contest rating history.

### Heatmap Only

```http
GET /api/heatmap-data/{username}
```

Returns only the daily submission heatmap.

### Widget Pages

```http
GET /heatmap/{username}
GET /rating/{username}
```

These render embeddable pages rather than JSON.

---

## Widget Layer

The widget layer is handled by `controllers/viewController.js` and the EJS templates in `views/`.

### Home Page

The root route renders `home.ejs`.

This is likely the public landing page for the service.

### Heatmap Widget

The heatmap widget is rendered through `heatmap.ejs`.

The controller passes:

- `handle`
- `theme`

The theme supports a `night` option, otherwise it defaults to `day`.

### Rating Widget

The rating widget is rendered through `rating.ejs`.

This page loads the user’s rating history and draws a chart in the browser.

### Why server-rendered widget pages are useful

An iframe-based widget is easy for consumers because they only need a URL, not a full SDK or client integration. This lowers adoption friction and makes the project more shareable.

---

## Deployment Story

The project includes `vercel.json`, which indicates a deployment path on Vercel.

### Why Vercel fits this project

The app is lightweight, stateless, and HTTP-centric. That makes it a good match for serverless or edge-friendly deployment patterns.

### Deployment implications

There are some important consequences of this choice:

- in-memory cache only persists for the life of the process,
- multiple instances may not share cache state,
- and cold starts can affect the first request after idle time.

Even with those limitations, this deployment style is acceptable for a small public API project.

---

## Security and Safety Considerations

Even though the project is simple, it still has several engineering concerns worth mentioning in interviews.

### Rate Limiting

The app uses a global limiter of 1000 requests per minute.

That helps protect both the server and the target site from unnecessary load.

### CORS

CORS is enabled so frontend apps and widget embeds can call the API from different origins.

### Input Validation

The code performs only lightweight validation. That is enough for a small project, but it also means the service depends on well-formed handle input.

### Scraping Risk

Because the project depends on a third-party website, it inherits the target’s availability, markup stability, and rate limiting behavior.

This is the biggest operational risk in the system.

---

## Data Model

There is no database in the project.

That is an important architectural fact.

### Why no database is used

The source of truth already exists externally on CodeChef. The service is not creating or updating user state. It is only reading and transforming public data.

### What this means

The app is essentially a read-through cache and rendering layer:

- fetch public page,
- parse it,
- return the extracted data.

This keeps the project small and easy to deploy.

---

## Strengths of the Design

This project has several strong design qualities.

### 1. Separation of concerns

Routing, controller logic, scraping, and rendering are separated cleanly.

### 2. Single data extraction path

All consumers go through one scraper function, which prevents duplicated parsing logic.

### 3. Cache-first behavior

Repeated requests are fast and cheaper to serve.

### 4. Multiple API shapes

The service supports full profiles, filtered profiles, bulk lookups, and specialized endpoints.

### 5. Usable presentation layer

The iframe widgets are practical and make the project more than just a JSON API.

---

## Weaknesses and Tradeoffs

Every project has tradeoffs, and this one has a few very discussable ones.

### 1. Fragile scraping

If CodeChef changes its HTML structure or embedded variable names, parsing may fail.

### 2. In-memory cache only

Cache is fast but not durable or shared.

### 3. Limited observability

The code logs some parsing errors, but it does not yet have structured logging, tracing, or metrics.

### 4. Minimal retry strategy

Only a simple retry is implemented for rate-limited requests.

### 5. Environment-dependent widget URL

One of the widget pages uses a hardcoded production API URL, which is convenient for deployment but less flexible in local or alternative environments.

These are not necessarily flaws for a project of this size. In interviews, they are opportunities to demonstrate judgment.

---

## Why This Architecture Was a Good Choice

If you need to justify the architecture in an interview, the strongest argument is that the design matches the problem.

The problem is not to manage complex user state or multiple write workflows. The problem is to expose a stable read interface on top of public profile pages.

Given that constraint, the chosen architecture is efficient because it:

- avoids unnecessary database complexity,
- keeps the app small and deployable,
- centralizes scraping logic,
- supports caching from day one,
- and offers both API and widget-based consumption.

That combination gives the project real utility while staying manageable for a solo or small-team implementation.

---

## How to Explain the Project in an Interview

Here is a concise narrative you can use.

> This project is an unofficial CodeChef profile API built with Express. It fetches public CodeChef profile pages, parses the HTML with Cheerio, extracts rating, rank, contest history, and activity data, caches successful responses in memory, and exposes the data through JSON endpoints and embeddable widgets. I separated the route layer, controller layer, and scraper layer so the system stays maintainable. The main engineering challenge was scraping data from a third-party website while handling rate limits, changing markup, and repeated requests efficiently.

That answer covers the project at a high level while naturally leading into deeper questions.

---

## System Design Discussion

This project is small, but it still supports a meaningful system design conversation.

### Scalability

The current design can serve moderate traffic because:

- the cache reduces repeated work,
- the app is stateless apart from in-memory cache,
- and the heavy operation is a single external fetch plus parse.

However, scalability is limited by the scraper’s dependence on the upstream site and by the single-process nature of `node-cache`.

### Horizontal Scaling

If the app were deployed with multiple instances, each instance would have its own cache. That means the same handle could be scraped multiple times across instances.

#### Better scaling approach

The next step would be a shared cache such as Redis, combined with a queue or request coalescing to prevent duplicate scrapes for the same handle.

### Reliability

Reliability depends on external HTML stability. To improve it, you could:

- make selectors more resilient,
- avoid hardcoded string offsets where possible,
- add fallback parsers,
- and implement better error reporting when the page structure changes.

### Latency

Caching is the biggest latency optimization. A cache hit is significantly faster than refetching and reparsing the profile page.

### Cost Control

The service is lightweight enough to run cheaply. This is a good example of a project where architecture is chosen to minimize complexity rather than maximize theoretical generality.

### Observability

If production use increased, the following would help:

- structured logs,
- request IDs,
- scrape failure metrics,
- cache hit ratio tracking,
- and alerting on repeated parse failures.

---

## Possible Production Improvements

If you were asked how to evolve this into a more robust production service, here are strong answers.

### 1. Replace in-memory cache with Redis

This would support multiple instances and persistence across restarts.

### 2. Add stronger schema validation

You could validate scraper output with a schema to catch unexpected missing fields.

### 3. Improve retry strategy

Use exponential backoff and maybe a circuit-breaker style policy for upstream failures.

### 4. Add structured logging and monitoring

This would make debugging easier when CodeChef’s page layout changes.

### 5. Make widget URLs environment-aware

Use a configurable base URL rather than hardcoding a production domain in the client-side template.

### 6. Add tests

Tests would be especially valuable for:

- parsing logic,
- field filtering,
- route behavior,
- and error cases.

### 7. Add a fallback strategy for missing selectors

This would make the scraper more resilient to changes in CodeChef’s HTML.

---

## Interview Questions You May Get

### Why did you choose scraping instead of an official API?

Because the project targets public profile data that is already available on CodeChef, and the goal was to package that data into a reusable service. The scraper approach was the only practical option for this use case.

### Why use Cheerio instead of Puppeteer or Playwright?

Cheerio is lighter and faster because the needed data already exists in the HTML response. A browser automation tool would add overhead without much benefit for this specific page structure.

### Why cache in memory?

It was the simplest way to reduce repeated scraping and improve response time. For a small deployment, in-memory caching is easy to implement and very fast.

### What are the limitations of that cache?

It is not shared across instances and it resets when the process restarts. A distributed cache would be better for larger scale.

### What is the biggest risk in the project?

The target website can change its markup or rate limit behavior, which can break the parser or reduce reliability.

### How would you make it more production-ready?

I would add shared caching, better retries, structured logging, schema validation, and test coverage for the parsing logic.

### Why split controllers and utilities?

It keeps HTTP handling separate from data extraction, which makes the code easier to maintain and easier to change.

### How does the bulk endpoint avoid sending too much data?

It removes the heavy arrays like heatmap and rating history before returning summaries.

---

## Good Talking Points for a Demo

If you are presenting this project, focus on the following sequence:

1. Explain the motivation.
2. Show the route surface.
3. Describe the scraper and cache.
4. Demonstrate a full profile request.
5. Demonstrate filtered fields.
6. Demonstrate the bulk endpoint.
7. Show the heatmap widget.
8. Show the rating graph widget.
9. Finish with tradeoffs and future improvements.

This structure keeps the presentation technical but clear.

---

## Example Response Shape

A full profile response typically looks like this conceptually:

```json
{
	"success": true,
	"status": 200,
	"profile": "https://...",
	"name": "Some User",
	"currentRating": 2134,
	"highestRating": 2178,
	"countryFlag": "https://...",
	"countryName": "India",
	"globalRank": 1234,
	"countryRank": 99,
	"stars": "5★",
	"totalProblemsSolved": 348,
	"contestCount": 42,
	"lastRatingChange": 37,
	"heatMap": [],
	"ratingData": []
}
```

The exact values depend on the handle, but this illustrates the shape of the object returned by the scraper and controller.

---

## Notes on Maintainability

The project is easy to understand because it avoids unnecessary abstraction.

That is a strength, but it means maintainability relies on discipline:

- keep all scraping logic in the utility layer,
- keep routes thin,
- avoid duplicating parsing logic elsewhere,
- and update the README and this Project.md when behavior changes.

This project is a good example of “simple but not simplistic.”

---

## Summary

CodeChef API is an unofficial scraping-based service that converts public CodeChef profile pages into a reusable API and widget system. The codebase is small, but it touches many practical backend topics:

- Express routing and middleware,
- HTML scraping with Cheerio,
- in-memory caching,
- rate limiting,
- server-side rendering with EJS,
- iframe-based widgets,
- deployment on Vercel,
- and engineering tradeoffs around third-party dependency.

From an interview perspective, the strongest thing about this project is not its size but its clarity. You can explain exactly how the data moves through the system, why each piece exists, what the bottlenecks are, and how you would evolve it into a more resilient production system.

That makes it a strong project to present, study, and discuss.
