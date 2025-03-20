import React, { useState, useEffect } from 'react';
import { monitoringService, SystemHealth } from '../services/MonitoringService';
import { monitoredFetch, FetchErrorType, EnhancedFetchError } from '../utils/monitoredFetch';
import ApiErrorDisplay from './ApiErrorDisplay';

// Define the test result interface
interface TestResult {
  endpoint: string;
  success: boolean;
  error?: string;
  errorType?: FetchErrorType;
  data?: any;
  duration: number;
}

// Component props
interface ApiStatusTesterProps {
  onlyShowErrors?: boolean;
}

/**
 * A component to test API endpoints and display results
 */
const ApiStatusTester: React.FC<ApiStatusTesterProps> = ({ onlyShowErrors = false }) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  
  // Subscribe to health status updates
  useEffect(() => {
    const unsubscribe = monitoringService.subscribe(newHealth => {
      setHealth(newHealth);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Define the endpoints to test
  const endpoints = [
    { url: '/api/health', name: 'API Health', service: 'vercel' as const },
    { url: '/api/db-health', name: 'Database Health', service: 'database' as const },
    { url: 'https://builditrecords.onrender.com/api/health', name: 'Render API Health', service: 'render' as const },
  ];
  
  // Function to test a single endpoint
  const testEndpoint = async (endpoint: string, service?: 'vercel' | 'render' | 'database') => {
    const startTime = performance.now();
    
    try {
      const data = await monitoredFetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        service,
        timeout: 10000, // 10 seconds
        retries: 1
      });
      
      const duration = Math.round(performance.now() - startTime);
      
      return {
        endpoint,
        success: true,
        data,
        duration
      };
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      
      if (error instanceof EnhancedFetchError) {
        return {
          endpoint,
          success: false,
          error: error.message,
          errorType: error.type,
          data: error.responseBody,
          duration
        };
      } else {
        return {
          endpoint,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration
        };
      }
    }
  };
  
  // Function to test all endpoints
  const testAllEndpoints = async () => {
    setIsLoading(true);
    const newResults: TestResult[] = [];
    
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint.url, endpoint.service);
      newResults.push(result);
    }
    
    setResults(newResults);
    setIsLoading(false);
  };
  
  // Check if we have any errors
  const hasErrors = results.some(result => !result.success);
  
  return (
    <div style={{ margin: '20px 0' }}>
      {(!onlyShowErrors || hasErrors) && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>API Status Check</h3>
            <button
              onClick={testAllEndpoints}
              disabled={isLoading}
              style={{
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Testing...' : 'Test All Endpoints'}
            </button>
          </div>
          
          {hasErrors && <ApiErrorDisplay retryAction={testAllEndpoints} />}
          
          {results.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <h4>Test Results</h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'minmax(250px, 1fr) 80px 100px 1fr', 
                gap: '10px',
                backgroundColor: '#f5f5f5',
                padding: '10px',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                <div>Endpoint</div>
                <div>Status</div>
                <div>Response Time</div>
                <div>Details</div>
              </div>
              
              {results.map((result, index) => (
                <div 
                  key={index}
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'minmax(250px, 1fr) 80px 100px 1fr', 
                    gap: '10px',
                    backgroundColor: result.success ? '#f8fffa' : '#fff6f6',
                    border: `1px solid ${result.success ? '#d4edda' : '#f5c6cb'}`,
                    borderRadius: '4px',
                    padding: '10px',
                    marginTop: '5px',
                    fontSize: '14px'
                  }}
                >
                  <div>{result.endpoint}</div>
                  <div style={{ 
                    color: result.success ? 'green' : 'red',
                    fontWeight: 'bold'
                  }}>
                    {result.success ? 'Success' : 'Failed'}
                  </div>
                  <div>{result.duration}ms</div>
                  <div>
                    {result.success ? (
                      <pre style={{ 
                        fontSize: '12px', 
                        maxHeight: '100px', 
                        overflow: 'auto',
                        backgroundColor: '#f8f9fa',
                        padding: '5px',
                        borderRadius: '3px',
                        margin: 0
                      }}>
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    ) : (
                      <div>
                        <div style={{ color: 'red', marginBottom: '5px' }}>
                          {result.errorType ? `${result.errorType.toUpperCase()}: ` : ''}
                          {result.error}
                        </div>
                        {result.data && (
                          <pre style={{ 
                            fontSize: '12px', 
                            maxHeight: '100px', 
                            overflow: 'auto',
                            backgroundColor: '#f8f9fa',
                            padding: '5px',
                            borderRadius: '3px',
                            margin: 0
                          }}>
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {health && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: health.overall.status === 'healthy' ? '#d4edda' : 
                          health.overall.status === 'degraded' ? '#fff3cd' : '#f8d7da',
          borderRadius: '4px',
          color: health.overall.status === 'healthy' ? '#155724' :
                health.overall.status === 'degraded' ? '#856404' : '#721c24'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>System Health: {health.overall.status.toUpperCase()}</h4>
          <p>{health.overall.message}</p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
            {(Object.keys(health) as Array<keyof SystemHealth>)
              .filter(key => key !== 'overall')
              .map(key => (
                <div key={key} style={{ 
                  padding: '8px',
                  backgroundColor: health[key].status === 'healthy' ? '#d4edda' : 
                                health[key].status === 'degraded' ? '#fff3cd' : '#f8d7da',
                  borderRadius: '4px',
                  minWidth: '120px'
                }}>
                  <div style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{key}</div>
                  <div>{health[key].status}</div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiStatusTester;
