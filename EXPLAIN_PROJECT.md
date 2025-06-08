 # PSN-BE (Personal Style Network Backend)

 A high-level overview of the PSN-BE codebase: purpose, features, tech stack,
 structure, and getting started steps.

 ## 1. What is this project?

 PSN-BE is the backend API for Personal Style Network, a "smart wardrobe" app
 that lets users catalog clothing items, build and store outfits, and receive
 intelligent outfit recommendations based on style rules, weather, events, and more.

 ## 2. Key Features

 - **User Management:** Signup/login, JWT-based authentication, profile management.
 - **Wardrobe (Items):** CRUD operations for clothing/accessory items,
   categorization by color, type, season, etc.
 - **Outfit Management:** Create/update/delete outfits, add/remove items,
   usage history tracking.
 - **Style Rule Engine:** Define personal style rules (e.g., color or form matching),
   evaluate and score outfits.
 - **Smart Recommendations:** Outfit suggestions based on weather, events, routines.
 - **Event Scheduling:** Plan outfits for upcoming events, reminders, and history.
 - **Analytics & Reporting:** Usage statistics and reports to optimize wardrobe.

 ## 3. Technology Stack

 - **Node.js** & **Express.js** for the RESTful API
 - **MongoDB** with **Mongoose** ODM
 - **JWT** (JSON Web Tokens) for security
 - **bcrypt**, **Helmet** for password hashing and HTTP security
 - **Swagger** for auto-generated API documentation
 - **Jest** for testing
 - **Winston** for logging
 - **Firebase Storage** for file uploads
 - **@imgly** for image background removal

 ## 4. Codebase Structure

 ```
 .
 ├── README.md             # Overview and quickstart
 ├── EXPLAIN_PROJECT.md     # This explanation file
 ├── docs/                 # Design docs, TDD notes, task breakdowns
 ├── prompts/              # Development prompt templates
 ├── src/                  # Main application source code
 ├── tests/                # Unit and integration tests
 ├── logs/                 # Log output (Winston)
 ├── .env                  # Environment variables (ignored by Git)
 ├── .gitignore
 ├── package.json          # NPM scripts and dependencies
 └── yarn.lock / package-lock.json
 ```

 ### 4.1 src/ Layout

 ```
 src/
 ├── api/                  # HTTP layer (routes, controllers, validators, middleware)
 ├── auth/                 # Passport/JWT strategies and auth middleware
 ├── configs/              # Environment, DB, JWT, Swagger setup
 ├── core/                 # Standard success/error response helpers
 ├── db/                   # Mongoose models and seed scripts
 ├── helpers/              # Reusable utility functions
 ├── keys/                 # Cryptographic keys and certificates
 ├── services/             # Business logic and use-case implementations
 ├── utils/                # Miscellaneous utilities
 ├── app.js                # Express app initialization
 └── server.js             # Application entry point
 ```

 ## 5. Getting Started

 1. Install dependencies:
    ```bash
    npm install    # or yarn install
    ```
 2. Configure environment variables:
    ```bash
    cp .env.example .env
    # Edit .env (PORT, MONGODB_URI, JWT_SECRET, etc.)
    ```
 3. (Optional) Seed initial data:
    ```bash
    npm run seed   # or yarn seed
    ```
 4. Start development server:
    ```bash
    npm run dev    # or yarn dev
    ```
 5. Browse the API documentation:
    Open http://localhost:<PORT>/api-docs

 ## 6. Testing

 Run unit and integration tests with:

 ```bash
 npm test       # or yarn test
 ```

 ## 7. Deployment

 Build and run in production mode:

 ```bash
 npm run build
 npm start
 ```