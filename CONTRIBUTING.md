# Contributing to VCode

Create a `feature/<topic>` branch from `develop` for each change. Open a pull request into `develop` with the goal of the change, the main decision, and what you verified. Use English commit messages such as `fix: preserve the cursor while navigating`.

Cut `release/<version>` from `develop` when the work for a release is ready. Verify it from a clean checkout, merge it into `main`, tag the merge, and merge the release back into `develop`. Start urgent fixes to a published version from `main` on `hotfix/<topic>` and merge them into both long-lived branches.

Run `npm ci`, `npm test`, `npm run format:check`, and `npm run build` before merging. Keep generated search indexes, build output, local notes, and dependencies out of commits. The README explains how to update reference data.
