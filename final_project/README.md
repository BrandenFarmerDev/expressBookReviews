# Express Book Reviews

This IBM starter-based project is a REST API for browsing a 10-book catalog and managing per-user reviews. It keeps the original book dataset and runs locally with Express. Public users can list or search books; registered users can log in with a JWT or session and add, change, and delete only their own reviews.

## Run locally

From `final_project/`:

```sh
npm install
npm test
npm start
```

The API listens on `http://localhost:5000` by default. Set `PORT`, `JWT_SECRET`, and `SESSION_SECRET` to configure the local service. The fallback secrets are for local development; use unique environment secrets before any deployment. The in-memory user and review stores reset when the process stops.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Return all books |
| GET | `/isbn/:isbn` | Find one book by the starter catalog key |
| GET | `/author/:author` | Case-insensitive author substring search |
| GET | `/title/:title` | Case-insensitive title substring search |
| GET | `/review/:isbn` | Return reviews for a book |
| POST | `/register` | Register a username and password |
| POST | `/customer/login` | Log in; returns a JWT and establishes a session cookie |
| POST | `/customer/auth/review/:isbn` | Create a review, once per user and book |
| PUT | `/customer/auth/review/:isbn` | Add or replace the signed-in user's review (starter rubric route) |
| PATCH | `/customer/auth/review/:isbn` | Modify an existing review owned by the signed-in user |
| DELETE | `/customer/auth/review/:isbn` | Delete the signed-in user's review |

Send authenticated requests with `Authorization: Bearer <token>` or use the session cookie from the same login. For the starter's review-add route, `PUT /customer/auth/review/:isbn?review=<text>` accepts the review text in the query; JSON body `{ "review": "..." }` is also supported. `PATCH` uses a JSON body. Reviews are stored by username, so one user cannot modify or delete another user's entry. Passwords are salted and hashed in memory. Prototype-sensitive usernames such as `__proto__` and `constructor` are reserved.

## Tests and Axios examples

`npm test` runs the local Node test suite, covering public searches, registration, login, review ownership, both session and JWT authentication, and all four Axios retrieval helpers. With the server running, `node router/general.js` executes the Axios Promise-based examples for all books, ISBN, author, and title; set `BOOKSHOP_BASE_URL` to use another local port.

## Reproducible cURL evidence

With `npm start` running in one terminal, execute:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\capture-curl-evidence.ps1
```

The script uses `curl.exe` against the local API and writes redacted request/response evidence to `evidence/curl-evidence.txt`. It creates temporary local demo accounts and does not contact any external service.
