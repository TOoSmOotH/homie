# Homie Shared

Shared TypeScript types, utilities, and configurations for the Homie project.

## Overview

This package contains shared code that is used by both the frontend and backend applications. It includes:

- **TypeScript Types**: API response types, service interfaces, and data models
- **Utilities**: Common helper functions and constants
- **Configurations**: Shared configuration interfaces

## Installation

This package is part of the monorepo and is automatically linked via npm workspaces.

## Usage

### Importing Types

```typescript
// In backend
import { ApiResponse, VMInfo, ContainerInfo } from '@homie/shared';

// In frontend
import { ApiResponse, ServiceStatus } from '@/shared';
```

### Type Definitions

#### API Types

- `ApiResponse<T>` - Standardized API response format
- `ServiceStatus` - Service health and status information
- `VMInfo` - Virtual machine information
- `ContainerInfo` - Docker container information
- `ServiceConfig` - Service configuration settings
- `User` - User account information

#### Request/Response Types

- `LoginRequest` - User login credentials
- `LoginResponse` - Authentication response with token
- `DashboardMetrics` - Dashboard performance metrics

## Project Structure

```
shared/
├── src/
│   ├── types/
│   │   ├── api.types.ts     # API-related type definitions
│   │   └── index.ts         # Type exports
│   └── index.ts            # Main package exports
├── dist/                   # Compiled JavaScript output
├── package.json
└── tsconfig.json
```

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Type Checking

```bash
npm run type-check
```

## Adding New Types

1. Add type definitions to appropriate files in `src/types/`
2. Export from `src/types/index.ts`
3. Re-export from `src/index.ts`
4. Run `npm run build` to compile

## Best Practices

### Type Organization

- Group related types in the same file
- Use descriptive, specific type names
- Prefer interfaces over type aliases for object shapes
- Use union types for status enums

### Naming Conventions

- Use PascalCase for type names
- Use camelCase for property names
- Prefix interfaces with 'I' if needed for clarity
- Use descriptive suffixes (e.g., `Request`, `Response`, `Config`)

### Documentation

- Add JSDoc comments for complex types
- Document optional properties and their default values
- Include usage examples for important types

## Versioning

This package follows semantic versioning. Breaking changes should be avoided when possible, as they affect both frontend and backend applications.

## Testing

Add tests for utility functions in a `tests/` directory. Run tests with:

```bash
npm test
```

## Related Packages

- **Backend**: Uses these types for API responses and data models
- **Frontend**: Uses these types for API calls and component props