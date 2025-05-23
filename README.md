# Link Saver + Auto-Summary

A full-stack application where users can save bookmarks with auto-generat## Environment Variables

### Backend
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT token generation
- `JINA_AI_KEY` - Jina AI API key for summarization

### Frontend
- `NEXT_PUBLIC_API_URL` - URL of the backend API (default: http://localhost:5000/api)
- `NEXT_PUBLIC_APP_NAME` - Application name for branding
- `NEXT_PUBLIC_DEFAULT_THEME` - Default theme setting (light/dark)

#### Frontend Tech Stack Details
- **Runtime Environment**: Node.js v14+
- **Framework**: Next.js 13 (React Framework)
- **Language**: JavaScript/TypeScript
- **Styling**: 
  - Tailwind CSS for utility-first styling
  - PostCSS for processing
  - CSS Modules for component styling
- **State Management**: React Hooks + Context API
- **Package Manager**: npm/yarn
- **Development Tools**:
  - ESLint for code linting
  - Prettier for code formatting
  - PostCSS for CSS processing
  - Autoprefixer for CSS compatibility

#### Build & Development
- Development server runs on port 3000
- Production builds are optimized for performance
- Automatic code splitting for optimal loading
- Static file serving from public directoryes using Jina AI.

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

The frontend is built with Next.js 13, React, and Tailwind CSS, providing a modern and responsive user interface with dark mode support.

#### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

#### Installation and Setup
1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

#### Frontend Features
- 🌓 Dark/Light mode theme support
- 🔐 Secure user authentication
- 📑 Intuitive bookmark management
- 🏷️ Tag-based organization system
- 🔍 Search and filter capabilities
- 📱 Fully responsive design
- 🎯 URL validation and metadata extraction
- 🔄 Real-time updates

#### Project Structure
```
frontend/
├── src/
│   ├── app/               # Next.js app directory
│   │   ├── globals.css    # Global styles
│   │   ├── layout.js      # Root layout with theme support
│   │   └── page.js        # Home page
│   ├── components/        # React components
│   │   ├── AddBookmarkForm.js
│   │   ├── BookmarkCard.js
│   │   ├── LoginForm.js
│   │   ├── RegisterForm.js
│   │   └── ThemeContext.js
│   └── utils/            # Utility functions
│       ├── Axios.js      # API client configuration
│       └── colors.js     # Color utilities
```

#### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

#### Tech Stack
- **Framework**: Next.js 13
- **UI Library**: React
- **Styling**: Tailwind CSS with dark mode
- **Icons**: React Icons
- **HTTP Client**: Axios
- **State Management**: React Hooks




