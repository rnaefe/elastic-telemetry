# Contributing to FiveM Logging System

First off, thank you for considering contributing to the FiveM Logging System! It is because of community contributions that open-source software can thrive and remain highly accessible. 

This document provides a comprehensive guide on how you can contribute to the project, from submitting bugs to creating pull requests.

---

## Code of Conduct

By participating in this project, you are expected to uphold general open-source standards of professionalism and respect. Please ensure your discussions in issues and pull requests remain constructive and on-topic.

## Development Setup

1. **Fork and Clone** the repository.
2. Ensure you have **Node.js (v22+)**, **MySQL**, and **ClickHouse (v24+)** installed.
3. Switch to your project directory and set up the backend:
    ```bash
    cd backend
    npm install
    cp env.example .env
    ```
4. Set up the dashboard:
    ```bash
    cd ../dashboard
    npm install
    cp env.example .env.local
    ```
5. Follow the `README.md` database schemas instructions or use your MySQL terminal to build the tables from `backend/database/schema.sql`.

## Workflow

All contributions follow a standard Pull Request (PR) model:

1. Create a descriptive branch (e.g., `feature/improved-stats` or `fix/search-pagination`).
2. Make your commits clear and atomic. Try to separate backend changes from dashboard changes if they are unrelated.
3. Push your branch to your forked repository.
4. Submit a Pull Request targeting the `main` branch.

## Code Standards

- **JavaScript Formatting:** This project primarily uses standard prettier formatting. Avoid excessive spacing and follow Next.js conventions for the `dashboard/` directory. Use consistent indentation and semicolons.
- **Lua Environment:** Ensure compatibility across updated FiveM distributions and try to avoid unnecessary memory overhead on standard loops (the project uses optimized EventHandlers instead of server ticks whenever possible).
- **Environment Variables:** Never commit secrets or `.env` files. If your Pull Request introduces new environment parameters, be sure to update `env.example`.

## Submitting Pull Requests

- **Describe Your Changes:** Provide a clear summary of your UI or database changes. If you made UI modifications, attaching screenshots helps reviewers process the PR significantly faster.
- **Backward Compatibility:** Ensure no breaking changes occurred in API contracts between the game server and the ingest backend. If a change is breaking, please flag it prominently in your PR description.

## Security Vulnerabilities

If you discover a vulnerability or security-related issue (especially regarding OAuth, JWT generation, ClickHouse SQL exposure, or unauthorized query access), please **do not open a public issue.** 

Instead, send a private message to the project maintainer or email directly. We aim to address security concerns immediately before public disclosure.
