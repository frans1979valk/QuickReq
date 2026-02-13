# Storage Model Documentation

## Overview

The application uses browser localStorage for all data persistence. This provides offline functionality and ensures user data remains private and local.

## Storage Keys

### Primary Storage Keys
- `savedRequests`: User-saved API requests
- `requestHistory`: Automatic history of executed requests  
- `savedApiKeys`: Encrypted API keys with names
- `language`: Selected interface language

## Data Structures

### SavedRequest
```typescript
interface SavedRequest {
  name: string;           // User-defined name
  request: RequestData;   // Complete request configuration
  timestamp: string;      // ISO timestamp of creation
}
```

### RequestData
```typescript
interface RequestData {
  url: string;                        // API endpoint URL
  method: string;                     // HTTP method (GET, POST, etc.)
  headers: { [key: string]: string }; // Request headers
  body: string;                       // Request body (JSON string)
}
```

### SavedApiKey
```typescript
interface SavedApiKey {
  name: string;      // User-defined name for the key
  key: string;       // The actual API key
  timestamp: string; // ISO timestamp of creation
}
```

### LogEntry
```typescript
interface LogEntry {
  timestamp: string;           // ISO timestamp
  type: 'info' | 'error' | 'success'; // Log level
  message: string;             // Main log message
  details?: string;            // Optional additional details
}
```

## Storage Operations

### Reading Data
```typescript
// Get saved requests
const saved = localStorage.getItem('savedRequests');
const savedRequests = saved ? JSON.parse(saved) : [];

// Get request history
const history = localStorage.getItem('requestHistory');
const requestHistory = history ? JSON.parse(history) : [];

// Get API keys
const keys = localStorage.getItem('savedApiKeys');
const savedApiKeys = keys ? JSON.parse(keys) : [];

// Get language preference
const language = localStorage.getItem('language') || 'en';
```

### Writing Data
```typescript
// Save requests
localStorage.setItem('savedRequests', JSON.stringify(savedRequests));

// Save history (limited to 50 entries)
const updatedHistory = [newEntry, ...requestHistory].slice(0, 50);
localStorage.setItem('requestHistory', JSON.stringify(updatedHistory));

// Save API keys
localStorage.setItem('savedApiKeys', JSON.stringify(savedApiKeys));

// Save language
localStorage.setItem('language', selectedLanguage);
```

## Data Limits

### Browser Limits
- localStorage typically has 5-10MB limit per domain
- Each request/response can be several KB
- Automatic cleanup prevents storage overflow

### Application Limits
- **Request History**: Limited to 50 most recent entries
- **Saved Requests**: No hard limit (user managed)
- **API Keys**: No hard limit (user managed)
- **Logs**: Limited to 100 most recent entries (in memory only)

## Data Migration

### Version Compatibility
The application handles missing or malformed data gracefully:

```typescript
// Safe data loading with fallbacks
const loadSavedData = () => {
  try {
    const saved = localStorage.getItem('savedRequests');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn('Failed to load saved requests:', error);
    return [];
  }
};
```

### Schema Changes
When adding new fields to existing interfaces:

1. **Backward Compatible**: Add optional fields
2. **Default Values**: Provide sensible defaults
3. **Migration Function**: Transform old data if needed

```typescript
// Example migration for new field
const migrateSavedRequests = (requests: any[]): SavedRequest[] => {
  return requests.map(req => ({
    ...req,
    timestamp: req.timestamp || new Date().toISOString() // Add missing timestamp
  }));
};
```

## Export/Import Format

### Export Structure
```json
{
  "savedRequests": [
    {
      "name": "Test API Call",
      "request": {
        "url": "https://api.example.com/test",
        "method": "GET",
        "headers": { "Content-Type": "application/json" },
        "body": ""
      },
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "requestHistory": [...],
  "savedApiKeys": [
    {
      "name": "Production API",
      "key": "sk-...",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Import Process
1. **File Validation**: Check JSON format
2. **Schema Validation**: Verify required fields
3. **Data Merging**: Combine with existing data
4. **Storage Update**: Save to localStorage

## Security Considerations

### API Key Storage
- Keys stored in plain text in localStorage
- Browser-level security (same-origin policy)
- No transmission to external servers
- User responsible for key security

### Data Privacy
- All data remains local to user's browser
- No analytics or tracking
- No external data transmission (except API calls)
- User controls all data through export/import

## Cleanup and Maintenance

### Automatic Cleanup
```typescript
// History cleanup (keeps last 50)
const cleanupHistory = (history: SavedRequest[]) => {
  return history.slice(0, 50);
};

// Log cleanup (keeps last 100, in memory only)
const cleanupLogs = (logs: LogEntry[]) => {
  return logs.slice(0, 100);
};
```

### Manual Cleanup
Users can:
- Delete individual saved requests
- Delete individual API keys
- Clear request history (via export/import with empty data)
- Clear all data (browser developer tools)

## Troubleshooting

### Common Issues
1. **Storage Full**: Browser shows quota exceeded error
2. **Corrupted Data**: JSON parse errors on load
3. **Missing Data**: localStorage cleared by browser/user

### Recovery Strategies
1. **Export Early**: Regular exports for backup
2. **Graceful Degradation**: App works with empty storage
3. **Error Handling**: Try/catch around all storage operations
4. **User Feedback**: Clear error messages for storage issues