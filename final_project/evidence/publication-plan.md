# Deferred publication plan

This is a local preparation record only. No fork, Git remote, push, public repository, pull request, or course submission has been created.

## Proposed GitHub locations

- Official source: `https://github.com/ibm-developer-skills-network/expressBookReviews`
- Fork creation page: `https://github.com/ibm-developer-skills-network/expressBookReviews/fork`
- Proposed public fork/repository: `https://github.com/BrandenFarmerDev/expressBookReviews`
- Proposed branch after push: `ibm-express-book-reviews-final-project`
- Proposed public `general.js` URL on that branch: `https://github.com/BrandenFarmerDev/expressBookReviews/blob/ibm-express-book-reviews-final-project/final_project/router/general.js`
- If later merged into the default branch, the file URL would be: `https://github.com/BrandenFarmerDev/expressBookReviews/blob/main/final_project/router/general.js`

## Steps after explicit authorization

1. Create the fork from the official source using the fork creation page above.
2. Add the fork as a separate remote so the existing `origin` continues to identify the IBM starter: `git remote add fork https://github.com/BrandenFarmerDev/expressBookReviews.git`.
3. Push the already-reviewed local branch: `git push -u fork ibm-express-book-reviews-final-project`.
4. Confirm the fork parent with `curl -s https://api.github.com/repos/BrandenFarmerDev/expressBookReviews | jq '.parent.full_name'`; expect `"ibm-developer-skills-network/expressBookReviews"`.
5. Open the proposed branch `general.js` URL and record that public URL for the course Task 10 artifact. Task 11 uses the parent-response output above.

Current local branch: `ibm-express-book-reviews-final-project`. Record its commit SHA from the final review result before any publication step.
