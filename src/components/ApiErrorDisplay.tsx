import * as React from 'react';
import { monitoringService, SystemHealth } from '../services/MonitoringService';

interface ApiErrorDisplayProps {
  retryAction?: () => void;
  customMessage?: string;
}

/**
 * A component to display API errors with retry functionality
 */
const ApiErrorDisplay: React.FC<ApiErrorDisplayProps> = ({ 
  retryAction,
  customMessage 
}) => {
  const [health, setHealth] = React.useState<SystemHealth | null>(null);
  const [showDetails, setShowDetails] = React.useState(false);
  
  React.useEffect(() => {
    // Subscribe to health updates
    const unsubscribe = monitoringService.subscribe(newHealth => {
      setHealth(newHealth);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // If all systems are healthy, no need to show this component
  if (!health || health.overall.status === 'healthy') {
    return null;
  }
  
  // Get the unhealthy systems to display specific errors
  const unhealthySystems = Object.entries(health)
    .filter(([key, status]) => key !== 'overall' && status.status === 'unhealthy')
    .map(([key, status]) => ({
      name: key,
      ...status
    }));
  
  const hasCorsError = unhealthySystems.some(system => 
    system.message.includes('CORS') || 
    (system.details && JSON.stringify(system.details).includes('CORS'))
  );
  
  return (
    <div 
      style={{
        padding: '15px',
        backgroundColor: '#fef6f6',
        border: '1px solid #f8d7da',
        borderRadius: '4px',
        marginBottom: '20px',
        color: '#721c24'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>
          {hasCorsError ? 'Cross-Origin Request Blocked' : 'API Connection Error'}
        </h3>
        {unhealthySystems.length > 0 && (
          <button 
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: 'none',
              border: 'none',
              color: '#721c24',
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'underline'
            }}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>
      
      <p>
        {customMessage || (hasCorsError ? 
          'The application cannot connect to the API server due to a cross-origin (CORS) error. This typically happens when the API server is not configured to accept requests from this domain.' : 
          'There was a problem connecting to the API server. This could be due to network issues or the server may be down.'
        )}
      </p>
      
      {showDetails && (
        <div 
          style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#f8d7da',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <h4 style={{ margin: '0 0 10px 0' }}>Technical Details</h4>
          {unhealthySystems.map((system, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <p><strong>{system.name}:</strong> {system.message}</p>
              {system.details && (
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  backgroundColor: '#fff', 
                  padding: '5px', 
                  borderRadius: '3px', 
                  fontSize: '12px' 
                }}>
                  {JSON.stringify(system.details, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
      
      {retryAction && (
        <div style={{ marginTop: '15px' }}>
          <button
            onClick={retryAction}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry Connection
          </button>
          <button
            onClick={() => monitoringService.checkAllServices()}
            style={{
              backgroundColor: 'transparent',
              color: '#721c24',
              border: '1px solid #721c24',
              padding: '8px 15px',
              borderRadius: '4px',
              marginLeft: '10px',
              cursor: 'pointer'
            }}
          >
            Check API Status
          </button>
        </div>
      )}
    </div>
  );
};

export default ApiErrorDisplay;
