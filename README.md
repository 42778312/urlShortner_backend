# URL Shortener Backend

A backend-only URL shortener API built with **NestJS**, **TypeScript**, **SQLite**, and **TypeORM**. Submit a long URL, get back a short code, and opening the short URL redirects (HTTP 302) to the original destination. Fully documented with Swagger/OpenAPI and runs entirely via Docker — no manual Node.js install required.

There is intentionally **no authentication, no user accounts, and no frontend** — this is a minimal, public REST API.

## Requirements

- [Docker](https://www.docker.com/) and Docker Compose (to run the app — no local Node.js needed)
- Node.js 20+ (only if you want to run outside Docker)

## Run

```bash
docker compose up --build
```

The API will be available at `http://localhost:3000`. The SQLite database file is persisted in a named Docker volume (`sqlite-data`), so data survives container restarts.

To run without Docker:

```bash
npm install
npm run start:dev
```

## API

All API endpoints are prefixed with `/api`, except the redirect endpoint, which is intentionally left clean.

| Method | Path              | Description                                    |
| ------ | ----------------- | ----------------------------------------------- |
| POST   | `/api/urls`        | Create a short URL from an original URL         |
| GET    | `/api/urls/:code`  | Look up a short URL's data (no redirect)         |
| GET    | `/api/health`       | Health check                                    |
| GET    | `/:code`            | Redirect (302) to the original URL              |

### `POST /api/urls`

Request body:

```json
{ "url": "https://example.com/some/long/url" }
```

Response `201 Created`:

```json
{
  "id": "uuid",
  "originalUrl": "https://example.com/some/long/url",
  "shortCode": "aB82xK",
  "shortUrl": "http://localhost:3000/aB82xK",
  "createdAt": "2026-09-07T10:00:00.000Z"
}
```

Returns `400 Bad Request` if `url` is missing, empty, or not a valid HTTP/HTTPS URL.

### `GET /api/urls/:code`

Returns the same shape as above for an existing short code, or `404 Not Found` if the code doesn't exist.

### `GET /:code`

Redirects with `302 Found` and a `Location` header pointing to the original URL. Returns `404 Not Found` (JSON body) if the code doesn't exist — it does not redirect for unknown codes.

### `GET /api/health`

```json
{ "status": "ok" }
```

## Swagger / OpenAPI

Interactive API docs are available at:

```
http://localhost:3000/api/docs
```

## Example

```bash
curl -X POST http://localhost:3000/api/urls \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.example.com"}'
```

If the response contains `"shortUrl": "http://localhost:3000/aB82xK"`, opening `http://localhost:3000/aB82xK` in a browser redirects to `https://www.example.com`.

## Database

SQLite, via TypeORM. The database file location is configurable with `DATABASE_PATH` (see `.env.example`), and defaults to `data/database.sqlite`. In Docker, this path is inside a persistent named volume so data isn't lost when the container restarts.

The `urls` table:

| Column      | Type      | Notes                          |
| ----------- | --------- | ------------------------------- |
| id          | uuid      | Primary key                     |
| originalUrl | text      | The full original URL           |
| shortCode   | varchar   | Unique, indexed                 |
| createdAt   | timestamp |                                  |
| updatedAt   | timestamp |                                  |

Short codes are 6 characters by default (configurable via `SHORT_CODE_LENGTH`), drawn from a URL-safe alphabet (`a-zA-Z0-9`). On a generation collision, the service retries with a new code; the database's unique constraint on `shortCode` is the final backstop.

## Environment Variables

See [`.env.example`](.env.example):

```env
PORT=3000
DATABASE_PATH=data/database.sqlite
BASE_URL=http://localhost:3000
SHORT_CODE_LENGTH=6
```

`BASE_URL` is used to build the `shortUrl` returned to clients — set it to your public-facing origin in production.

## Testing

```bash
npm run test       # unit tests
npm run test:e2e   # end-to-end tests (HTTP layer, in-memory SQLite)
```

## Project Structure

```
src/
├── main.ts
├── app.module.ts
├── urls/
│   ├── urls.module.ts
│   ├── urls.controller.ts
│   ├── urls.service.ts
│   ├── dto/
│   │   ├── create-url.dto.ts
│   │   └── url-response.dto.ts
│   └── entities/
│       └── url.entity.ts
├── redirect/
│   ├── redirect.module.ts
│   └── redirect.controller.ts
└── health/
    ├── health.module.ts
    └── health.controller.ts
```

## Notes on Security

- Only `http://` and `https://` URLs are accepted, with a length cap.
- The server never fetches or executes the submitted URL — it only stores it and issues a redirect. The browser performs the actual navigation.
