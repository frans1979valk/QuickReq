import React, { useState, useEffect } from 'react';
import { Send, Save, History, Settings, Key, BrainCircuit, AlertCircle, Download, Upload, Star, Trash2, Clock, Plus, Eye, EyeOff, Globe } from 'lucide-react';
import { t, setLanguage, getCurrentLanguage, Language } from './i18n';

interface RequestData {
  url: string;
  method: string;
  headers: { [key: string]: string };
  body: string;
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: { [key: string]: string };
  data: any;
  time: number;
}

interface LogEntry {
  timestamp: string;
  type: 'info' | 'error' | 'success';
  message: string;
  details?: string;
}

interface Preset {
  name: string;
  url: string;
  method: string;
  headers: { [key: string]: string };
  body: string;
}

interface SavedRequest {
  name: string;
  request: RequestData;
  timestamp: string;
}

interface SavedApiKey {
  name: string;
  key: string;
  timestamp: string;
}

function App() {
  const [request, setRequest] = useState<RequestData>({
    url: '',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    body: ''
  });
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [activeTab, setActiveTab] = useState('headers');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
  const [requestHistory, setRequestHistory] = useState<SavedRequest[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [savedApiKeys, setSavedApiKeys] = useState<SavedApiKey[]>([]);
  const [showSaveApiKeyDialog, setShowSaveApiKeyDialog] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [showApiKeys, setShowApiKeys] = useState<{[key: string]: boolean}>({});
  const [currentLang, setCurrentLang] = useState<Language>(getCurrentLanguage());

  useEffect(() => {
    const saved = localStorage.getItem('savedRequests');
    if (saved) {
      setSavedRequests(JSON.parse(saved));
    }
    const history = localStorage.getItem('requestHistory');
    if (history) {
      setRequestHistory(JSON.parse(history));
    }
    const keys = localStorage.getItem('savedApiKeys');
    if (keys) {
      setSavedApiKeys(JSON.parse(keys));
    }
    setLanguage(currentLang);
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    setLanguage(lang);
    // Force re-render by updating state
    window.location.reload();
  };

  const addLog = (type: 'info' | 'error' | 'success', message: string, details?: string) => {
    setLogs(prev => [{
      timestamp: new Date().toISOString(),
      type,
      message,
      details
    }, ...prev].slice(0, 100));
  };

  const presets: Preset[] = [
    {
      name: t('anthropicChat'),
      url: 'https://api.anthropic.com/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        messages: [{ role: "user", content: "Hello, Claude!" }],
        max_tokens: 1024
      }, null, 2)
    },
    {
      name: t('jsonPlaceholder'),
      url: 'https://jsonplaceholder.typicode.com/posts',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: ''
    },
    {
      name: t('httpBin'),
      url: 'https://httpbin.org/anything',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }, null, 2)
    }
  ];

  const loadPreset = (preset: Preset) => {
    setRequest({
      ...preset,
      headers: {
        ...preset.headers,
        ...(preset.url.includes('anthropic.com') ? { 'x-api-key': apiKey } : {})
      }
    });
    addLog('info', `${t('presetLoaded')}: ${preset.name}`);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = e.target.value;
    setApiKey(newApiKey);
    if (request.url.includes('anthropic.com')) {
      setRequest(prev => ({
        ...prev,
        headers: {
          ...prev.headers,
          'x-api-key': newApiKey
        }
      }));
    }
  };

  const handleSendRequest = async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      addLog('info', t('sendingRequest', { method: request.method, url: request.url }));

      if (!request.url) {
        throw new Error(t('urlRequired'));
      }

      const options: RequestInit = {
        method: request.method,
        headers: request.headers
      };

      if (request.method !== 'GET' && request.body) {
        options.body = request.body;
      }

      const response = await fetch(request.url, options);
      const data = await response.json();
      const endTime = performance.now();
      const time = Math.round(endTime - startTime);

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        time
      });

      const historyEntry: SavedRequest = {
        name: new Date().toLocaleString(),
        request: { ...request },
        timestamp: new Date().toISOString()
      };
      const updatedHistory = [historyEntry, ...requestHistory].slice(0, 50);
      setRequestHistory(updatedHistory);
      localStorage.setItem('requestHistory', JSON.stringify(updatedHistory));

      addLog(
        response.ok ? 'success' : 'error',
        t('responseReceived', { status: response.status.toString(), statusText: response.statusText }),
        `Time: ${time}ms`
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      addLog('error', t('requestFailed'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveRequest = () => {
    if (!saveName) return;
    const newSavedRequest: SavedRequest = {
      name: saveName,
      request: { ...request },
      timestamp: new Date().toISOString()
    };
    const updated = [...savedRequests, newSavedRequest];
    setSavedRequests(updated);
    localStorage.setItem('savedRequests', JSON.stringify(updated));
    setShowSaveDialog(false);
    setSaveName('');
    addLog('success', `${t('requestSaved')} "${saveName}"`);
  };

  const loadSavedRequest = (saved: SavedRequest) => {
    setRequest(saved.request);
    addLog('info', `${t('loadedSavedRequest')}: ${saved.name}`);
  };

  const deleteSavedRequest = (index: number) => {
    const updated = savedRequests.filter((_, i) => i !== index);
    setSavedRequests(updated);
    localStorage.setItem('savedRequests', JSON.stringify(updated));
    addLog('info', t('savedRequestDeleted'));
  };

  const exportRequests = () => {
    const data = JSON.stringify({ savedRequests, requestHistory }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api-requests-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog('success', t('requestsExported'));
  };

  const importRequests = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.savedRequests) {
          setSavedRequests(data.savedRequests);
          localStorage.setItem('savedRequests', JSON.stringify(data.savedRequests));
        }
        if (data.requestHistory) {
          setRequestHistory(data.requestHistory);
          localStorage.setItem('requestHistory', JSON.stringify(data.requestHistory));
        }
        addLog('success', t('requestsImported'));
      } catch (err) {
        addLog('error', t('importFailed'), t('invalidFileFormat'));
      }
    };
    reader.readAsText(file);
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', t('logsCleared'));
  };

  const saveApiKey = () => {
    if (!newApiKeyName || !apiKey) return;
    const newSavedKey: SavedApiKey = {
      name: newApiKeyName,
      key: apiKey,
      timestamp: new Date().toISOString()
    };
    const updated = [...savedApiKeys, newSavedKey];
    setSavedApiKeys(updated);
    localStorage.setItem('savedApiKeys', JSON.stringify(updated));
    setShowSaveApiKeyDialog(false);
    setNewApiKeyName('');
    addLog('success', `${t('apiKeySaved')} "${newApiKeyName}"`);
  };

  const loadApiKey = (saved: SavedApiKey) => {
    setApiKey(saved.key);
    if (request.url.includes('anthropic.com')) {
      setRequest(prev => ({
        ...prev,
        headers: {
          ...prev.headers,
          'x-api-key': saved.key
        }
      }));
    }
    addLog('info', `${t('loadedApiKey')}: ${saved.name}`);
  };

  const deleteApiKey = (index: number) => {
    const updated = savedApiKeys.filter((_, i) => i !== index);
    setSavedApiKeys(updated);
    localStorage.setItem('savedApiKeys', JSON.stringify(updated));
    addLog('info', t('apiKeyDeleted'));
  };

  const toggleApiKeyVisibility = (index: number) => {
    setShowApiKeys(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Send className="w-6 h-6" />
            {t('title')}
          </h1>
          <div className="mt-2 flex gap-2 items-center">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              {t('saveRequest')}
            </button>
            <button
              onClick={exportRequests}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              {t('export')}
            </button>
            <label className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-1 cursor-pointer">
              <Upload className="w-4 h-4" />
              {t('import')}
              <input
                type="file"
                accept=".json"
                onChange={importRequests}
                className="hidden"
              />
            </label>
            <div className="flex items-center gap-2 ml-auto">
              <Globe className="w-4 h-4 text-gray-600" />
              <select
                value={currentLang}
                onChange={(e) => handleLanguageChange(e.target.value as Language)}
                className="px-2 py-1 text-sm border rounded-md"
              >
                <option value="en">EN</option>
                <option value="nl">NL</option>
              </select>
            </div>
          </div>
        </header>

        {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <h2 className="text-lg font-semibold mb-4">{t('saveRequest')}</h2>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={t('enterRequestName')}
                className="w-full px-3 py-2 border rounded-md mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={saveRequest}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">{t('apiKeys')}</h2>
            </div>
            <button
              onClick={() => setShowSaveApiKeyDialog(true)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              {t('addApiKey')}
            </button>
          </div>
          
          <div className="flex gap-2 items-center mb-4">
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={handleApiKeyChange}
              placeholder={t('enterApiKey')}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              {showApiKey ? t('hide') : t('show')}
            </button>
          </div>

          {savedApiKeys.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {savedApiKeys.map((saved, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex-1">
                    <div className="font-medium">{saved.name}</div>
                    <div className="text-sm text-gray-500">
                      {showApiKeys[index] ? saved.key : '••••••••••••••••'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleApiKeyVisibility(index)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      {showApiKeys[index] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => loadApiKey(saved)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteApiKey(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showSaveApiKeyDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <h2 className="text-lg font-semibold mb-4">{t('saveApiKey')}</h2>
              <input
                type="text"
                value={newApiKeyName}
                onChange={(e) => setNewApiKeyName(e.target.value)}
                placeholder={t('enterApiKeyName')}
                className="w-full px-3 py-2 border rounded-md mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowSaveApiKeyDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={saveApiKey}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">{t('apiPresets')}</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            {presets.map(preset => (
              <button
                key={preset.name}
                onClick={() => loadPreset(preset)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {savedRequests.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">{t('savedRequests')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {savedRequests.map((saved, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <button
                    onClick={() => loadSavedRequest(saved)}
                    className="text-left flex-1 hover:text-blue-600"
                  >
                    {saved.name}
                  </button>
                  <button
                    onClick={() => deleteSavedRequest(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {requestHistory.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">{t('requestHistory')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {requestHistory.map((history, index) => (
                <button
                  key={index}
                  onClick={() => loadSavedRequest(history)}
                  className="text-left p-2 bg-gray-50 rounded-md hover:bg-gray-100"
                >
                  <div className="font-medium truncate">{history.request.method} {history.request.url}</div>
                  <div className="text-sm text-gray-500">{new Date(history.timestamp).toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex gap-2 mb-4">
                <select
                  value={request.method}
                  onChange={(e) => setRequest({ ...request, method: e.target.value })}
                  className="px-3 py-2 border rounded-md bg-gray-50"
                >
                  {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={request.url}
                  onChange={(e) => setRequest({ ...request, url: e.target.value })}
                  placeholder={t('enterUrl')}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <button
                  onClick={handleSendRequest}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? t('sending') : t('send')}
                </button>
              </div>

              <div className="border rounded-md">
                <div className="flex border-b">
                  {[t('headers'), t('body')].map((tab, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTab(index === 0 ? 'headers' : 'body')}
                      className={`px-4 py-2 ${activeTab === (index === 0 ? 'headers' : 'body') ? 'bg-gray-100 border-b-2 border-blue-600' : ''}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="p-4">
                  {activeTab === 'headers' && (
                    <textarea
                      placeholder={t('enterHeaders')}
                      value={JSON.stringify(request.headers, null, 2)}
                      onChange={(e) => {
                        try {
                          const headers = JSON.parse(e.target.value);
                          setRequest({ ...request, headers });
                        } catch {} // Allow invalid JSON while typing
                      }}
                      className="w-full h-48 font-mono text-sm p-2 border rounded-md"
                    />
                  )}
                  {activeTab === 'body' && (
                    <textarea
                      placeholder={t('enterRequestBody')}
                      value={request.body}
                      onChange={(e) => setRequest({ ...request, body: e.target.value })}
                      className="w-full h-48 font-mono text-sm p-2 border rounded-md"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <History className="w-5 h-5" />
                  {t('requestLogs')}
                </h2>
                <button
                  onClick={clearLogs}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  {t('clearLogs')}
                </button>
              </div>
              <div className="h-48 overflow-auto">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2 mb-2 rounded-md ${
                      log.type === 'error' ? 'bg-red-50 text-red-700' :
                      log.type === 'success' ? 'bg-green-50 text-green-700' :
                      'bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {log.type === 'error' && <AlertCircle className="w-4 h-4" />}
                      <span className="text-sm font-medium">{log.message}</span>
                    </div>
                    {log.details && (
                      <div className="mt-1 text-sm opacity-75">{log.details}</div>
                    )}
                    <div className="text-xs opacity-50 mt-1">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">{t('response')}</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            {response && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2 py-1 rounded-md text-sm ${
                    response.status < 300 ? 'bg-green-100 text-green-800' :
                    response.status < 400 ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {response.status} {response.statusText}
                  </span>
                  <span className="text-sm text-gray-500">{response.time}ms</span>
                </div>
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">{t('responseHeaders')}</h3>
                  <pre className="bg-gray-50 p-2 rounded-md text-sm overflow-auto max-h-32">
                    {JSON.stringify(response.headers, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">{t('responseBody')}</h3>
                  <pre className="bg-gray-50 p-2 rounded-md text-sm overflow-auto max-h-96">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;