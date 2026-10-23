# Student Management System

A responsive browser-based student registry built with HTML, CSS, and vanilla JavaScript. This FA 2 project demonstrates an Agile workflow and an automated CI/CD pipeline using Node.js, npm, ESLint, Node's built-in test runner, and GitHub Actions.

## Features

- Add a student with a name, roll number, and course.
- Validate all required fields and reject duplicate roll numbers without regard to letter case.
- Search student records by name or roll number.
- Delete records and see the current total.
- Persist student records in browser `localStorage`.
- Display clear status feedback and render user-provided values with safe DOM text APIs.
- Run locally as a static site from the generated `dist/` directory.

## User stories

1. **Register a student:** As an administrator, I want to enter a student's name, roll number, and course so that their record is added to the registry.
2. **Protect record quality:** As an administrator, I want required fields validated and duplicate roll numbers rejected so that the registry remains complete and unique.
3. **Find a student:** As an administrator, I want to search by name or roll number so that I can locate a record quickly.
4. **Remove a student:** As an administrator, I want to delete a record so that outdated information can be removed.
5. **Retain and review records:** As an administrator, I want records saved in the browser and a visible student count so that records remain available on that device and totals are easy to review.

## Sprint planning

### Sprint 1 — Core student records

**Goal:** Deliver the basic student registry.

- Implement the responsive page and accessible student form.
- Add required-field validation and case-insensitive duplicate checks.
- Render records in a table and persist them in localStorage.
- **Sprint review:** Demonstrate adding valid records, validation feedback, duplicate rejection, and persistence after refresh.

### Sprint 2 — Search, quality, and delivery

**Goal:** Complete record management and automate verification and publishing.

- Add search, deletion, record count, and empty states.
- Add automated tests and ESLint.
- Add repeatable build and local server scripts.
- Configure GitHub Actions checks and GitHub Pages deployment.
- **Sprint review:** Demonstrate search and delete, run all local checks, and review the Pages deployment workflow.

## Acceptance criteria

- A record is added only when name, roll number, and course contain non-whitespace values.
- A roll number already present in the registry cannot be added again, including case-only variants.
- Search matches partial student names and roll numbers without case sensitivity.
- Deleting a student removes it from the displayed list and localStorage, and updates the count.
- Reloading the page restores valid saved records.
- Student-provided content is inserted as text, not interpreted as HTML.
- `npm test`, `npm run lint`, and `npm run build` complete successfully.
- A push to `main` is built and checked before GitHub Pages deployment.

## Definition of Done

- The user story meets its acceptance criteria and works with the existing page layout.
- Inputs are validated; feedback and controls are accessible; user content is rendered safely.
- Automated tests cover the relevant logic, and ESLint reports no errors.
- The application builds into `dist/` and can be served locally.
- Changes are reviewed in a pull request targeting `main`; required CI checks pass before merge.
- Documentation is updated when setup, behavior, or delivery changes.

## CI/CD pipeline

The workflow in `.github/workflows/ci-cd.yml` runs on pushes to `main`, pull requests targeting `main`, and manual dispatch:

1. Check out the repository.
2. Set up Node.js 22 with npm dependency caching.
3. Install the locked dependencies using `npm ci`.
4. Build the static site into `dist/`.
5. Run the automated tests and ESLint.
6. Upload the built site as a workflow artifact; for pushes to `main`, also create the official GitHub Pages artifact.
7. After all verification steps succeed on a push to `main`, deploy that artifact using the official GitHub Pages deployment action.

## Local setup and commands

Requirements: Node.js 22 or later and npm.

```sh
npm ci
npm test
npm run lint
npm run build
npm start
```

Then open [http://localhost:3000](http://localhost:3000). The server serves files from `dist/`, so run `npm run build` before `npm start`.

## GitHub repository and Pages setup

1. Create a GitHub repository and add this project at its root (do not put it inside another project folder).
2. Push the default branch as `main`, or create a pull request targeting `main` to run verification.
3. In the repository, open **Settings → Pages** and set the build/deployment source to **GitHub Actions**.
4. Ensure Actions are allowed to use the repository and that the default workflow permissions allow the workflow's explicitly declared `contents: read`, `pages: write`, and `id-token: write` job permissions.
5. Merge or push a verified change to `main`. The workflow deploys only after the build, tests, and lint pass. Find the published URL in the `github-pages` deployment environment or the completed workflow run.
6. Use **Actions → Student Management System CI/CD → Run workflow** for a manual verification run. Manual runs do not deploy; deployment is restricted to pushes to `main`.

The workflow uses GitHub's official Pages artifact and deployment actions and does not require repository secrets or embedded credentials.
