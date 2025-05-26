# PSN Backend API - Postman Collection

This folder contains Postman collection and environment for testing the PSN (Personal Style Network) Backend API.

## Files

- `PSN_Backend_API.postman_collection.json`: The Postman collection with all API endpoints
- `PSN_Backend_Environment.postman_environment.json`: Environment variables for the collection

## Setup Instructions

1. Install [Postman](https://www.postman.com/downloads/) if you haven't already
2. Import both the collection and environment files:
   - Click "Import" in Postman
   - Select the two JSON files or drag and drop them
3. Select the "PSN Backend Environment" from the environment dropdown in the top right corner

## Environment Variables

The collection uses the following environment variables:

- `baseUrl`: The base URL for the API (default: http://localhost:3000/api/v1)
- `testUserName`, `testUserEmail`, `testUserPassword`: Credentials for testing
- `accessToken`, `refreshToken`: Authentication tokens (set automatically after login)
- `userId`: Current user ID (set automatically after login)
- `itemId`, `outfitId`, `recommendationId`, `styleRuleId`, `chatId`: IDs for resources
- Various other variables for testing specific endpoints

## Using the Collection

### Authentication Flow

1. Start by sending the "Sign Up" request to create a test account (or use "Login" if you already have an account)
2. The "Login" request will automatically set the `accessToken`, `refreshToken` and `userId` variables when successful
3. All subsequent requests will use these tokens for authentication

### Testing API Endpoints

The collection is organized into folders by resource type:

- Authentication: User registration, login, token refresh, etc.
- User: Profile management
- Items: Clothing item management
- Item Uploads: Image processing for items
- Outfits: Outfit creation and management
- Recommendations: Outfit recommendation system
- Style Rules: Style rule management
- Weather: Weather information and related recommendations
- Chat: AI chat functionality for style advice and assistance

## Workflow Example

1. Register a new user with "Sign Up"
2. Login to get authentication tokens
3. Upload an image with "Process Image" to get an image URL
4. Create an item using the image URL
5. Create outfits with your items
6. Get recommendations based on weather or occasion
7. Use the chat feature to get AI-powered style advice

## Customizing

You can customize the environment variables by:
1. Clicking on the "Environment" tab in Postman
2. Selecting "PSN Backend Environment"
3. Modifying the values as needed
4. Clicking "Update"

## Troubleshooting

- If you get 401 Unauthorized errors, your token may have expired. Use the "Refresh Token" request to get a new access token
- Check the base URL in the environment variables if you can't connect to the API
- Ensure the server is running before testing API endpoints

### Chat Testing Flow

1. Send a message to AI using "Send Message" (the `chatId` will be set automatically)
2. Continue the conversation using the same endpoint
3. View chat history with "Get Chat History"
4. Get specific chat details with "Get Specific Chat"
5. Clear history when needed with the delete endpoints 