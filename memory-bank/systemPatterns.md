# System Patterns

## Architecture Overview

Enoch is built as a React-based single-page application (SPA) with TypeScript for type safety. The application follows a component-based architecture with clear separation of concerns.

## Core Components

### Translator Engine

The translator engine is the core of the application, responsible for converting English text to Enochian:

1. **Dictionary-based Translation**: Primary translation method using direct dictionary lookups
2. **Fallback Mechanisms**: Several fallback approaches are used when direct matches aren't found:

   - Fuzzy matching for partial word matches
   - Stemming for handling word variations (plurals, etc.)
   - Root construction for unknown words
   - Specialized handling for negation prefixes

3. **Negation Handling Pattern**:

   - Detects common English negation prefixes (im-, un-, non-, etc.)
   - Uses Enochian "OL-" prefix to negate words
   - Prevents incorrect partial matching (e.g., "immortal" won't match with "mortal")
   - Preserves semantic meaning in translations
   - Implementation consists of:
     - `handleNegationPrefixes` method for detecting and translating negated terms
     - `hasNegationPrefix` helper to prevent incorrect partial matches
     - Modifications to the fuzzy matching system to prioritize semantic correctness

4. **Output Formats**:
   - Enochian words (direct translation)
   - Phonetic representation (using Enochian letter names)
   - Symbolic representation (using Enochian symbols)

### UI Components

The UI is built with React components following a hierarchical structure:

1. **Container Components**: Manage state and data flow
2. **Presentation Components**: Handle visual rendering
3. **Specialized Components**:
   - Input components for text entry
   - Display components for showing translations
   - Analysis components for showing statistics and root meanings

## Data Management

1. **Data Loading**: React Query is used to fetch dictionary and root data
2. **State Management**: React's useState hook manages component-level state
3. **Data Transformation**: Various processing functions convert between formats

## Key Design Patterns

1. **Factory Pattern**: Creating different translation outputs based on input and options
2. **Strategy Pattern**: Using different translation approaches based on context
3. **Adapter Pattern**: Converting between various data representations
4. **Composition Pattern**: Building complex components from simpler ones
5. **Fallback Pattern**: Hierarchical approach to translation with multiple fallback strategies

## Project Structure

```
src/
├── components/     # React components
├── lib/           # Core library code (translator engine)
├── hooks/         # React custom hooks
├── routes/        # Application routes
├── styles/        # CSS and styling
public/
├── enochian_lexicon.json    # Dictionary data
├── enochian_root_table.json # Root data
```

## Testing Approach

1. **Unit Tests**: Testing individual components and functions
2. **Integration Tests**: Testing components working together
3. **Feature Tests**: Testing complete user workflows

## Development Workflow

1. Feature planning and specification
2. Component design and implementation
3. Testing and validation
4. Documentation updates
5. Deployment and monitoring
