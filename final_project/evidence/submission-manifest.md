# Eleven-task submission manifest

This manifest tracks the eleven Option 1 artifacts described by the course rubric. Tasks 1–9 have reproducible local cURL snippets. Tasks 10–11 require a published fork, so their public proof fields intentionally remain pending; no fork, push, or submission has been performed.

| Task | Required artifact | Local evidence | Status / remaining field |
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
| 10 | Public GitHub URL for `general.js` with all four Axios retrievals | `generaljs-url.txt` | **Pending publication:** public URL not created |
| 11 | Public GitHub repo proof showing the official starter as parent | `githubrepo.txt` | **Pending publication:** no GitHub fork was created |

For Task 11, after publication, the requested proof command is `curl -s https://api.github.com/repos/<your-github-username>/expressBookReviews | jq '.parent.full_name'`; the expected parent is `ibm-developer-skills-network/expressBookReviews`.
