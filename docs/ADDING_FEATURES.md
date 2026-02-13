# Adding Features Guide

## Adding New API Presets

To add a new API service preset:

1. **Add to presets array** in `App.tsx`:
```typescript
const presets: Preset[] = [
  // existing presets...
  {
    name: t('yourApiName'), // Add translation key
    url: 'https://api.yourservice.com/endpoint',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' // Will be filled by API key
    },
    body: JSON.stringify({
      // Default request body
    }, null, 2)
  }
];
```

2. **Add translations** in `src/i18n/en.ts` and `src/i18n/nl.ts`:
```typescript
export const en = {
  // existing translations...
  yourApiName: "Your API Service"
};
```

3. **Update loadPreset function** if special handling is needed:
```typescript
const loadPreset = (preset: Preset) => {
  setRequest({
    ...preset,
    headers: {
      ...preset.headers,
      // Add conditional headers based on service
      ...(preset.url.includes('yourservice.com') ? { 'x-api-key': apiKey } : {})
    }
  });
  addLog('info', `${t('presetLoaded')}: ${preset.name}`);
};
```

## Extending Logging

### Adding New Log Types

1. **Update LogEntry interface**:
```typescript
interface LogEntry {
  timestamp: string;
  type: 'info' | 'error' | 'success' | 'warning'; // Add new types
  message: string;
  details?: string;
}
```

2. **Add styling** for new log types:
```typescript
className={`p-2 mb-2 rounded-md ${
  log.type === 'error' ? 'bg-red-50 text-red-700' :
  log.type === 'success' ? 'bg-green-50 text-green-700' :
  log.type === 'warning' ? 'bg-yellow-50 text-yellow-700' : // New type
  'bg-gray-50 text-gray-700'
}`}
```

### Adding Log Filters

Add state for log filtering:
```typescript
const [logFilter, setLogFilter] = useState<string>('all');

// Filter logs in render
const filteredLogs = logs.filter(log => 
  logFilter === 'all' || log.type === logFilter
);
```

## Adding New UI Sections

### Creating a New Panel

1. **Add state** for the new feature:
```typescript
const [newFeatureData, setNewFeatureData] = useState<YourType[]>([]);
```

2. **Add the UI section**:
```typescript
<div className="mb-6 bg-white rounded-lg shadow-md p-4">
  <div className="flex items-center gap-2 mb-2">
    <YourIcon className="w-5 h-5 text-gray-600" />
    <h2 className="text-lg font-semibold">{t('yourFeatureName')}</h2>
  </div>
  {/* Your feature content */}
</div>
```

3. **Add translations** for all visible text

4. **Add localStorage persistence** if needed:
```typescript
useEffect(() => {
  const saved = localStorage.getItem('yourFeatureData');
  if (saved) {
    setNewFeatureData(JSON.parse(saved));
  }
}, []);

// Save when data changes
const saveYourFeature = (data: YourType[]) => {
  setNewFeatureData(data);
  localStorage.setItem('yourFeatureData', JSON.stringify(data));
};
```

## Adding New Languages

1. **Create translation file** `src/i18n/[lang].ts`:
```typescript
export const de = {
  title: "API Test Tool",
  // ... all translation keys
};
```

2. **Update index.ts**:
```typescript
import { de } from './de';

export type Language = 'en' | 'nl' | 'de';

const translations = { en, nl, de };
```

3. **Add to language selector**:
```typescript
<select value={currentLang} onChange={handleLanguageChange}>
  <option value="en">EN</option>
  <option value="nl">NL</option>
  <option value="de">DE</option>
</select>
```

## Best Practices

- **Keep it simple**: Don't over-engineer features
- **Add translations**: Always add i18n support for new text
- **Test thoroughly**: Test with different languages and data states
- **Document changes**: Update relevant documentation
- **Maintain consistency**: Follow existing patterns and styling