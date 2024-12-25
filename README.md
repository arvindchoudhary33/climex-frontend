# CLIMEX - Climate Risk Analysis Dashboard

## Features

- 📊 Real-time climate data visualization
- 🌡️ Temperature analysis across multiple regions
- 📑 World Bank document analysis
- 💹 Climate-economic impact assessment
- 👥 User management system
- 🌓 Dark/Light theme support

## Prerequisites

- Node.js version 22.x or higher
- npm version 10.x or higher

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Routing**: React Router v7
- **Charts**: Recharts
- **Icons**: Lucide React

## Setup and Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/climex.git
cd climex
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```env
VITE_BACKEND_URL=backend_url
```

4. Run the development server:

```bash
npm run dev
```

## Environment Variables

The application requires one environment variable:

- `VITE_BACKEND_URL`: The URL of your backend API server

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
climex/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── contexts/      # React contexts
│   ├── utils/         # Utility functions
│   └── types/         # TypeScript type definitions
├── public/           # Static assets
└── .env             # Environment variables
```

## UI Components

The project uses [shadcn/ui](https://ui.shadcn.com/) for UI components. Key components include:

- Button
- Card
- Dialog
- Tabs
- Alert
- Table
- Form elements

## Authentication

The application includes a complete authentication system with:

- User login
- Role-based access control (User/Super Admin)
- Protected routes
- Token-based authentication

## Development Guide

1. **Adding New Components**

   - Use the shadcn/ui CLI to add new components:

   ```bash
   npx shadcn-ui add [component-name]
   ```

2. **Styling Guidelines**

   - Use Tailwind CSS utilities
   - Follow dark/light theme patterns
   - Use shadcn/ui components for consistency

3. **API Integration**
   - All API calls should use the centralized API utility
   - Handle errors appropriately
   - Include proper loading states
