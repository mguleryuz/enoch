# Tech Context

## Technology Stack

The Enoch application is built using the following core technologies:

### Frontend

- **React**: JavaScript library for building user interfaces
- **TypeScript**: Typed superset of JavaScript
- **Vite**: Build tool and development server
- **React Query**: Data fetching and state management library
- **Lucide Icons**: Modern icon set
- **Sonner**: Toast notification system

### UI Framework

- Custom component library organized in `/components/ui`
- Appears to use a design system similar to shadcn/ui

### Data Storage

- JSON data files for Enochian lexicon and root tables
- Client-side data processing and storage

## Development Setup

The project appears to be set up with:

- **Bun**: JavaScript runtime and package manager (as indicated by bun.lock)
- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking

## Key Dependencies

Based on the codebase examination:

```
React ecosystem:
- react
- react-dom
- @tanstack/react-query (for data fetching)

UI components:
- lucide-react (for icons)
- sonner (for toast notifications)

Dev tools:
- typescript
- eslint
- prettier
- vite
```

## Project Structure

The project follows a standard React application structure:

- `/src`: Source code
  - `/components`: React components
    - `/ui`: Reusable UI components
  - Other component directories organized by feature
- `/public`: Static assets including Enochian data files

## Build & Deploy

No specific build or deployment information was identified in the analyzed code.

## Data Requirements

The application relies on two main data files:

1. `enochian_lexicon.json`: Dictionary mapping between English and Enochian words
2. `enochian_root_table.json`: Information about Enochian letter roots and meanings

These files must be present in the /public directory to be served as static assets.
