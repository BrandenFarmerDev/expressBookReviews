# Eleven-task submission manifest

This manifest tracks the eleven Option 1 artifacts described by the course rubric. Tasks 1–9 have reproducible local cURL snippets. Tasks 10–11 now have public, verified evidence. No course submission was made.

| Task | Required artifact | Evidence / public URL | Status |
|---|---|---|---|
| 1 | `getallbooks` cURL and output | `getallbooks.txt` | Captured locally; ready to use |
| 2 | `getbooksbyISBN` cURL and output | `getbooksbyISBN.txt` | Captured locally; ready to use |
| 3 | `getbooksbyauthor` cURL and output | `getbooksbyauthor.txt` | Captured locally; ready to use |
| 4 | `getbooksbytitle` cURL and output | `getbooksbytitle.txt` | Captured locally; ready to use |
| 5 | `getbookreview` cURL and output | `getbookreview.txt` | Captured locally; ready to use |
| 6 | `register` cURL and output | `register.txt` | Captured locally; ready to use |
| 7 | `login` cURL and output | `login.txt` | Captured locally; JWT redacted in saved output |
| 8 | `reviewadded` cURL and output | `reviewadded.txt` | Captured locally; demonstrates query-parameter PUT and modification |
| 9 | `deletereview` cURL and output | `deletereview.txt` | Captured locally; ready to use |
| 10 | Public GitHub URL for `general.js` with all four Axios retrievals | [Exact-commit permalink](https://github.com/BrandenFarmerDev/expressBookReviews/blob/6ef184a8b9a69d802942d60f74d2e770d43a39ef/final_project/router/general.js) | Published and verified; raw file matches local source |
| 11 | Public GitHub repo proof showing the official starter as parent | `githubrepo.txt`; [public repository API](https://api.github.com/repos/BrandenFarmerDev/expressBookReviews) | Verified parent: `ibm-developer-skills-network/expressBookReviews` |

Published repository: https://github.com/BrandenFarmerDev/expressBookReviews
Published branch: `ibm-express-book-reviews-final-project`
Published commit: `6ef184a8b9a69d802942d60f74d2e770d43a39ef`

The repository API parent proof can be reproduced with:

```sh
curl.exe -sS https://api.github.com/repos/BrandenFarmerDev/expressBookReviews | jq ".parent.full_name"
```

Expected output:

```text
"ibm-developer-skills-network/expressBookReviews"
```
