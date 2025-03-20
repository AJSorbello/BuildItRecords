import React, { useEffect, useState } from 'react';
import { testApiConfig } from '../utils/testApiConfig';

interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

const DebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Store original console methods
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };

    // Function to add a log entry to our state
    function addLogEntry(level: 'info' | 'warn' | 'error', args: any[]) {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');

      // Use functional update to avoid stale state issues in closures
      setLogs(prevLogs => [...prevLogs, {
        level,
        message,
        timestamp: new Date().toISOString()
      }].slice(-50)); // Keep only the last 50 logs
    }

    // Override console methods
    console.log = (...args: any[]) => {
      originalConsole.log(...args);
      addLogEntry('info', args);
    };

    console.warn = (...args: any[]) => {
      originalConsole.warn(...args);
      addLogEntry('warn', args);
    };

    console.error = (...args: any[]) => {
      originalConsole.error(...args);
      addLogEntry('error', args);
    };

    console.info = (...args: any[]) => {
      originalConsole.info(...args);
      addLogEntry('info', args);
    };

    // Cleanup function to restore original console methods
    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
    };
  }, []);

  // Function to clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Function to test API configuration
  const runApiTest = () => {
    console.log('Running API Configuration Test...');
    testApiConfig();
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isExpanded) {
    return (
      <div 
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          padding: '10px',
          background: '#333',
          color: '#fff',
          borderRadius: '5px',
          cursor: 'pointer',
          zIndex: 9999
        }}
        onClick={toggleExpanded}
      >
        Debug Console ({logs.length})
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: '80%',
        maxWidth: '800px',
        height: '300px',
        background: '#111',
        color: '#eee',
        borderRadius: '5px',
        overflow: 'hidden',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          background: '#333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>Debug Console ({logs.length} entries)</span>
        <div>
          <button
            style={{
              background: '#555',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              marginRight: '8px',
              borderRadius: '3px'
            }}
            onClick={runApiTest}
          >
            Test API Config
          </button>
          <button
            style={{
              background: '#555',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              marginRight: '8px',
              borderRadius: '3px'
            }}
            onClick={clearLogs}
          >
            Clear
          </button>
          <button
            style={{
              background: '#555',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '3px'
            }}
            onClick={toggleExpanded}
          >
            Minimize
          </button>
        </div>
      </div>
      <div
        style={{
          padding: '10px',
          overflow: 'auto',
          flexGrow: 1,
          fontFamily: 'monospace',
          fontSize: '14px'
        }}
      >
        {logs.map((log, index) => (
          <div
            key={index}
            style={{
              marginBottom: '6px',
              padding: '4px',
              borderRadius: '3px',
              background: 
                log.level === 'error' ? '#5a1e1e' : 
                log.level === 'warn' ? '#5a4e1e' : 
                '#1e3a5a'
            }}
          >
            <span style={{ fontSize: '12px', color: '#999' }}>
              {new Date(log.timestamp).toLocaleTimeString()}{' '}
            </span>
            <span style={{ 
              fontWeight: 'bold',
              color: 
                log.level === 'error' ? '#ff5f5f' : 
                log.level === 'warn' ? '#ffcf5f' : 
                '#5fcfff'
            }}>
              [{log.level.toUpperCase()}]{' '}
            </span>
            <span style={{ wordBreak: 'break-word' }}>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugConsole;
