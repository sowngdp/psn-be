# Jun 6 Refactoring Tasks

This document captures actionable refactoring tasks identified after auditing the entire source code.

## 1. API Layer Cleanup
- Consolidate duplicate rate limiter middleware (`rate-limiter.js` vs `rateLimiter.js`).
- Standardize error handling middleware usage and integrate with core error handler.
- Remove unused or empty validator modules; centralize request validation patterns.

## 2. Routing & Controllers
- Align naming conventions for route files (`.routes.js` vs `.route.js`) and controller files.
- Extract common response formatting into core helpers; eliminate repeated response code.

## 3. Authentication & Authorization
- Unify JWT and Google OAuth implementations; remove redundant code in `auth.service.js` and `google-auth.service.js`.
- Centralize refresh-token logic in `key-token.service.js`, deprecate any duplicate token services.

## 4. Configuration Consolidation
- Merge overlapping configuration files (e.g. `config.firebase.js` vs `firebase.js`, `config.mongodb.js` vs `database.js`).
- Simplify environment loading in `env.js`; remove any direct `process.env` usage outside that module.

## 5. Database Models & Repositories
- Remove duplicated or deprecated models (`keytoken.model.js` vs `key-token.model.js`).
- Standardize repository layer: ensure each model has a corresponding repository in `src/db/repositories`.
- Eliminate unused models and update seed scripts accordingly.

## 6. Service Layer Refactor
- Consolidate AI services (`openai.service.js`, `gemini.service.js`, `chat.service.js`) into a single AI integration module.
- Simplify background-removal pipeline; extract image-processing steps to a dedicated utility.
- Merge recommendation modules (`recommendation.service.js` vs `recommendation-engine.service.js`) into one service.

## 7. Helpers & Utilities
- Deduplicate helper functions between `src/helpers` and `src/utils/helpers`.
- Unify logger implementation under a single module and remove legacy logger files.
- Prune unused constants and utility functions.

## 8. Project Structure & Naming
- Enforce consistent kebab-case file naming and singular folder names where appropriate.
- Flatten unnecessary nested directories in `src/api`, `src/db`, and `src/services`.

## 9. Documentation Updates
- Refresh Markdown docs (README, EXPLAIN_PROJECT.md, docs/overview.md) to reflect refactored architecture.
- Remove outdated code samples and commented-out blocks.

---
_Date: June 6, 2023_