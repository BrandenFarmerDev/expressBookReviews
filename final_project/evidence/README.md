# Local API evidence

Run `npm start` in the `final_project/` directory, then from a second PowerShell window run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\capture-curl-evidence.ps1
```

The script captures local cURL requests for the public catalog, ISBN/author/title searches, registration, login, review creation/read/update/delete, and an attempted cross-user review update. It saves task-named excerpts plus the complete `curl-evidence.txt` transcript; bearer tokens and demo passwords are redacted. Run the script again any time to refresh those files.

See `submission-manifest.md` for all eleven course deliverable fields. The project is published at https://github.com/BrandenFarmerDev/expressBookReviews. The stable exact-commit `general.js` permalink is https://github.com/BrandenFarmerDev/expressBookReviews/blob/6ef184a8b9a69d802942d60f74d2e770d43a39ef/final_project/router/general.js. The public repository API verifies its parent as `ibm-developer-skills-network/expressBookReviews`; reproducible command and observed output are in `githubrepo.txt`.
