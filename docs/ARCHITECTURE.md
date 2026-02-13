# Architecture Overview

## State Management

The application uses React's built-in state management with `useState` hooks. No external state management library is used to keep the project simple and lightweight.

### Main State Objects

- **`request`**: Current request configuration (URL, method, headers, body)
- **`response`**: Last response data (status, headers, body, timing)
- **`savedRequests`**: Array of user-saved requests
- **`requestHistory`**: Automatic history of executed requests
- **`savedApiKeys`**: Encrypted storage of API keys
- **`logs`**: Application logs for debugging and monitoring

## Request Flow

1. **Input Validation**: URL and method validation before sending
2. **Header Processing**: Automatic API key injection for known services
3. **Request Execution**: Native fetch API with error handling
4. **Response Processing**: JSON parsing and timing calculation
5. **History Storage**: Automatic saving to localStorage
6. **Log Generation**: Success/error logging with timestamps

## Storage Strategy

### LocalStorage Structure
```javascript
{
  "savedRequests": SavedRequest[],
  "requestHistory": SavedRequest[],
  "savedApiKeys": SavedApiKey[],
  "language": "en" | "nl"
}
```

### Data Persistence
- All data is stored locally in the browser
- No external servers or databases
- Automatic backup through export/import functionality
- Data survives browser restarts

## Component Structure

The application uses a single-component architecture for simplicity:

- **App.tsx**: Main component containing all functionality
- **i18n/**: Translation files for internationalization
- **Types**: TypeScript interfaces for type safety

## Security Considerations

- API keys are stored in localStorage (browser-level security)
- No transmission of sensitive data to external servers
- Keys can be hidden/shown in the UI
- Export functionality allows secure backup

## Error Handling

- Network errors are caught and displayed
- Invalid JSON is handled gracefully
- User-friendly error messages
- Detailed logging for debugging