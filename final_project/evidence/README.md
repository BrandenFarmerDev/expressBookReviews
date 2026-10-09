# Local API evidence

Run `npm start` in the `final_project/` directory, then from a second PowerShell window run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\capture-curl-evidence.ps1
```

The script captures local cURL requests for the public catalog, ISBN/author/title searches, registration, login, review creation/read/update/delete, and an attempted cross-user review update. It saves task-named excerpts plus the complete `curl-evidence.txt` transcript; bearer tokens and demo passwords are redacted. Run the script again any time to refresh those files.

See `submission-manifest.md` for all eleven course deliverable fields. The public `general.js` URL and fork-parent proof remain pending until a later publication step.
