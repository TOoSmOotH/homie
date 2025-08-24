# Homie Frontend

React frontend application for the Home Lab Management application built with TypeScript and Vite.

## Features

- Modern React with TypeScript
- Responsive design with Tailwind CSS
- Real-time updates with WebSocket
- Component-based architecture
- React Query for data fetching
- React Router for navigation

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Preview production build:
   ```bash
   npm run preview
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests with Vitest
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── public/              # Static assets
│   └── index.html
├── src/
│   ├── components/      # React components
│   │   ├── common/     # Shared UI components
│   │   ├── dashboard/  # Dashboard components
│   │   ├── services/   # Service management components
│   │   ├── auth/       # Authentication components
│   │   ├── config/     # Configuration components
│   │   └── layout/     # Layout components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API service functions
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── styles/         # CSS and styling
│   ├── contexts/       # React contexts
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── tests/              # Test files
├── dist/               # Production build output
├── package.json
├── vite.config.ts      # Vite configuration
└── tailwind.config.js  # Tailwind CSS configuration
```

## Configuration

The application is configured via environment variables and the `vite.config.ts` file.

### Key Features

- **Routing**: React Router with protected routes
- **State Management**: React Query for server state
- **Styling**: Tailwind CSS with custom design system
- **Testing**: Vitest with React Testing Library
- **Build Tool**: Vite for fast development and optimized builds

## Component Architecture

### Common Components

- `Button` - Reusable button component
- `Card` - Content container with consistent styling
- `Modal` - Modal dialog component
- `Loading` - Loading spinner component

### Layout Components

- `Layout` - Main application layout
- `Header` - Application header with navigation
- `Sidebar` - Navigation sidebar

### Service Components

Organized by service type (Proxmox, Docker, Sonarr, etc.)

## API Integration

The frontend communicates with the backend API through service functions in the `services/` directory.

- `api.service.ts` - Core API client configuration
- `auth.service.ts` - Authentication API calls
- `websocket.service.ts` - WebSocket connection management

## Styling

The application uses Tailwind CSS with a custom design system defined in `globals.css`.

### Color Palette

- Primary: Blue tones for main actions
- Gray: Neutral colors for text and backgrounds
- Semantic colors for success, error, warning states

### Responsive Design

- Mobile-first approach
- Breakpoints: sm, md, lg, xl, 2xl
- Responsive navigation and layouts

## Development Guidelines

### Code Style

- Use functional components with hooks
- Follow TypeScript best practices
- Use descriptive component and function names
- Implement proper error boundaries

### Testing

- Write tests for critical functionality
- Use React Testing Library for component tests
- Mock API calls and external dependencies
- Aim for good test coverage

### Performance

- Use React.memo for expensive components
- Implement proper loading states
- Optimize bundle size with code splitting
- Use lazy loading for routes

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features with polyfills as needed
- Mobile browsers (iOS Safari, Chrome Mobile)