import { useState, useEffect } from 'react';

export function DebugLog() {
  const [logs, setLogs] = useState<string[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Override console.log to capture logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (message: string, type: 'log' | 'error' | 'warn' = 'log') => {
      const timestamp = new Date().toLocaleTimeString();
      const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '✅';
      setLogs(prev => [...prev, `[${timestamp}] ${prefix} ${message}`].slice(-20));
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog(args.join(' '), 'log');
    };

    console.error = (...args) => {
      originalError(...args);
      addLog(args.join(' '), 'error');
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog(args.join(' '), 'warn');
    };

    // Add initial system info
    addLog(`User Agent: ${navigator.userAgent}`);
    addLog(`Platform: ${navigator.platform}`);
    addLog(`Screen: ${window.screen.width}x${window.screen.height}`);
    addLog(`SessionStorage available: ${(() => {
      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        return 'YES';
      } catch (e) {
        return 'NO (Private mode?)';
      }
    })()}`);

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-2 rounded-lg text-xs z-50"
      >
        🐛 Logs
      </button>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-black/90 text-green-400 font-mono text-xs p-4 z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white font-bold">Debug Logs</span>
        <button
          onClick={() => setVisible(false)}
          className="bg-red-600 text-white px-2 py-1 rounded"
        >
          ✕
        </button>
      </div>
      {logs.length === 0 && <p className="text-gray-400">Waiting for logs...</p>}
      {logs.map((log, i) => (
        <div key={i} className="mb-1 whitespace-pre-wrap break-words">
          {log}
        </div>
      ))}
    </div>
  );
}
