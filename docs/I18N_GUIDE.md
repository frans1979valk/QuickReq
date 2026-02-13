# Internationalization Guide

## Overview

The application uses a minimal, custom i18n solution without external dependencies. It supports multiple languages with a simple translation key system.

## Current Languages

- **English (en)**: Default language
- **Dutch (nl)**: Secondary language

## Translation Files

### File Structure
```
src/i18n/
├── index.ts      # Main i18n logic and types
├── en.ts         # English translations
└── nl.ts         # Dutch translations
```

### Translation Object Structure
```typescript
export const en = {
  // Header
  title: "API Testing Tool",
  saveRequest: "Save Request",
  
  // Messages with parameters
  sendingRequest: "Sending {method} request to {url}",
  
  // All other translation keys...
};
```

## Adding New Languages

### 1. Create Translation File

Create `src/i18n/[langCode].ts`:
```typescript
export const fr = {
  title: "Outil de Test API",
  saveRequest: "Sauvegarder la Requête",
  // ... copy all keys from en.ts and translate
};
```

### 2. Update Type Definitions

In `src/i18n/index.ts`:
```typescript
export type Language = 'en' | 'nl' | 'fr'; // Add new language

import { fr } from './fr'; // Import new translation
const translations = { en, nl, fr }; // Add to translations object
```

### 3. Add to Language Selector

In `App.tsx`, update the language dropdown:
```typescript
<select value={currentLang} onChange={handleLanguageChange}>
  <option value="en">EN</option>
  <option value="nl">NL</option>
  <option value="fr">FR</option>
</select>
```

## Using Translations

### Basic Usage
```typescript
import { t } from './i18n';

// Simple translation
const title = t('title');

// Translation with parameters
const message = t('sendingRequest', { 
  method: 'POST', 
  url: 'https://api.example.com' 
});
```

### In JSX
```typescript
<h1>{t('title')}</h1>
<button>{t('saveRequest')}</button>
<p>{t('sendingRequest', { method: request.method, url: request.url })}</p>
```

## Translation Guidelines

### Key Naming Convention
- Use camelCase for translation keys
- Group related keys with prefixes when logical
- Keep keys descriptive but concise

```typescript
// Good
title: "API Testing Tool"
saveRequest: "Save Request"
sendingRequest: "Sending {method} request to {url}"

// Avoid
btn1: "Save"
msg: "Request sent"
```

### Parameter Usage
For dynamic content, use parameters:
```typescript
// Translation
responseReceived: "Response received ({status} {statusText})"

// Usage
t('responseReceived', { 
  status: response.status.toString(), 
  statusText: response.statusText 
})
```

### Fallback Strategy
The system automatically falls back to English if:
- Translation key doesn't exist in current language
- Current language file is missing
- Invalid language is selected

## Language Persistence

- Selected language is saved to localStorage
- Language preference persists across browser sessions
- Default language is English if no preference is saved

## Testing Translations

### Manual Testing
1. Switch between languages using the dropdown
2. Verify all text is translated
3. Check parameter substitution works correctly
4. Test with missing translation keys

### Adding New Translation Keys

When adding new features:

1. **Add to English first** (source of truth):
```typescript
// en.ts
newFeature: "New Feature"
newFeatureDescription: "This is a new feature"
```

2. **Add to all other languages**:
```typescript
// nl.ts
newFeature: "Nieuwe Functie"
newFeatureDescription: "Dit is een nieuwe functie"
```

3. **Use in component**:
```typescript
<h2>{t('newFeature')}</h2>
<p>{t('newFeatureDescription')}</p>
```

## Common Patterns

### Conditional Text
```typescript
// Translation
status: "Status: {isOnline}"

// Usage
t('status', { isOnline: isOnline ? t('online') : t('offline') })
```

### Pluralization (Simple)
```typescript
// Translations
itemCount: "{count} item"
itemCountPlural: "{count} items"

// Usage
const key = count === 1 ? 'itemCount' : 'itemCountPlural';
t(key, { count: count.toString() })
```

## Performance Considerations

- Translation files are imported statically (no dynamic loading)
- No external dependencies or network requests
- Minimal runtime overhead
- Language switching requires page reload for simplicity