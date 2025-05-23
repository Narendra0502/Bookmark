# Link Saver + Auto-Summary

A full-stack application where users can save bookmarks with auto-generated summaries using Jina AI.

## Project Architecture

- **Frontend**: Next.js
- **Backend**: Node.js + Express REST API
- **Database**: MongoDB via Mongoose
- **Authentication**: JWT

## Features

- User authentication (signup/login)
- Bookmark saving with metadata extraction
- AI-powered auto-summarization using Jina AI
- Bookmark listing with filtering and reordering
- Tag-based organization

## Setup Instructions

### Backend

1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file with your environment variables
4. Start the server: `npm start`

### Frontend

1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Environment Variables

### Backend
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT token generation
- `JINA_API_KEY` - Jina AI API key for summarization

### Frontend
- `NEXT_PUBLIC_API_URL` - URL of the backend API
