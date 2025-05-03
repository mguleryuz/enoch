# System Patterns

## Architecture Overview

The Enoch application is built as a modern React single-page application (SPA) with a focus on client-side processing. The system architecture follows these key patterns:

### Component Structure

- **Feature-based organization**: Components are organized by feature/functionality
- **Composition pattern**: UI components are composed from smaller, reusable components
- **Container/Presentation pattern**: Logic is separated from presentation where appropriate

## Key Design Patterns

1. **React Query for Data Fetching**

   - Used for managing data fetching, caching, and state
   - Provides loading, error, and success states for API requests

2. **UI Component Library**

   - Custom UI components (buttons, cards, tabs, etc.) for consistent styling
   - Components are organized in a `/components/ui` directory

3. **State Management**

   - React's useState for component-level state
   - React Query for server state
   - No global state management solution identified yet (Redux, Context, etc.)

4. **Translation Logic**
   - Dictionary-based lookup for direct translations
   - Fallback patterns for handling partial matches
   - Special handling for untranslatable words

## Component Relationships

```
EnochianTranslator
├── UI Components (Card, Button, etc.)
├── Translation Engine
│   ├── Dictionary Lookup
│   ├── Phonetic Conversion
│   └── Symbol Rendering
└── Root Analysis
```

## Data Flow

1. User inputs English text
2. Submit triggers translation process
3. Translation engine processes input against dictionary
4. Results are displayed in selected format (words, phonetic, symbols)
5. Optional root analysis is shown if requested

## Technical Decisions

- **Typescript**: Used for type safety and better developer experience
- **React**: For component-based UI development
- **React Query**: For data fetching and management
- **JSON Data Sources**: Dictionary and root data stored in JSON files
- **Responsive Design**: UI adapts to different screen sizes
- **Client-side Processing**: All translation happens on the client side
