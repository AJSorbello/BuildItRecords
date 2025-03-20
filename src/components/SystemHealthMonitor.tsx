import * as React from 'react';
import { monitoringService, SystemHealth, HealthStatus } from '../services/MonitoringService';

interface SystemHealthMonitorProps {
  minimized?: boolean;
  onToggleMinimize?: () => void;
  showAlways?: boolean;
}

// Component to display system health status
const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({ 
  minimized = true, 
  onToggleMinimize,
  showAlways = false
}) => {
  const [health, setHealth] = React.useState<SystemHealth | null>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  
  React.useEffect(() => {
    // Subscribe to health status updates
    const unsubscribe = monitoringService.subscribe((newHealth: SystemHealth) => {
      setHealth(newHealth);
      
      // Show the monitor if any service is unhealthy or degraded
      const hasIssues = Object.values(newHealth)
        .some(status => status.status === 'unhealthy' || status.status === 'degraded');
      
      if (hasIssues || showAlways) {
        setVisible(true);
      }
    });
    
    // Initial health check
    monitoringService.checkAllServices();
    
    return () => {
      unsubscribe();
    };
  }, [showAlways]);
  
  // Format timestamp to readable time
  const formatTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Unknown';
    }
  };
  
  // Get status icon and color
  const getStatusInfo = (s: HealthStatus): { icon: string, color: string } => {
    switch (s.status) {
      case 'healthy':
        return { icon: '✓', color: '#10b981' };
      case 'degraded':
        return { icon: '⚠️', color: '#f59e0b' };
      case 'unhealthy':
        return { icon: '✕', color: '#ef4444' };
      default:
        return { icon: '?', color: '#6b7280' };
    }
  };
  
  // If there's no health data or the monitor shouldn't be visible, don't render
  if (!health || (!visible && !showAlways)) {
    return null;
  }
  
  // Count issues by status
  const issues = Object.entries(health)
    .filter(([key, data]) => key !== 'overall' && data.status !== 'healthy')
    .reduce((acc, [_, data]) => {
      acc[data.status] = (acc[data.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  
  const issueCount = Object.values(issues).reduce((sum, count) => sum + count, 0);
  
  // Check if the system is healthy overall
  const isHealthy = health.overall.status === 'healthy';
  
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        borderRadius: '8px',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '12px',
        maxWidth: minimized ? '200px' : '400px',
        maxHeight: minimized ? '40px' : '80vh',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        zIndex: 9999,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${isHealthy ? '#10b981' : health.overall.status === 'degraded' ? '#f59e0b' : '#ef4444'}`
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: isHealthy ? '#0f766e' : health.overall.status === 'degraded' ? '#b45309' : '#b91c1c',
          cursor: 'pointer'
        }}
        onClick={onToggleMinimize}
      >
        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>System Status: {health.overall.status.toUpperCase()}</span>
          {!isHealthy && issueCount > 0 && (
            <span style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.3)', 
              borderRadius: '4px', 
              padding: '2px 6px',
              fontSize: '10px'
            }}>
              {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0',
              fontSize: '14px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              monitoringService.checkAllServices();
            }}
            title="Refresh Status"
          >
            🔄
          </button>
          <span style={{ cursor: 'pointer' }}>
            {minimized ? '▼' : '▲'}
          </span>
        </div>
      </div>
      
      {!minimized && (
        <div style={{ padding: '12px', maxHeight: '70vh', overflowY: 'auto' }}>
          <div>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', paddingBottom: '4px' }}>
              Service Status
            </div>
            
            {Object.entries(health)
              .filter(([key]) => key !== 'overall')
              .map(([key, status]) => {
                const statusInfo = getStatusInfo(status);
                return (
                  <div 
                    key={key}
                    style={{ 
                      marginBottom: '8px', 
                      padding: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (key === 'vercel' || key === 'render' || key === 'database') {
                        monitoringService.checkServiceHealth(key);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {key} <span style={{ color: statusInfo.color }}>{statusInfo.icon}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {status.timestamp ? formatTime(status.timestamp) : 'Unknown'}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '11px', marginTop: '4px', color: 'rgba(255, 255, 255, 0.9)' }}>
                      {status.message}
                    </div>
                    
                    {status.lastSuccessful && (
                      <div style={{ fontSize: '10px', marginTop: '4px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        Last Success: {formatTime(status.lastSuccessful)}
                      </div>
                    )}
                    
                    {status.details && expanded && (
                      <pre style={{ 
                        fontSize: '10px', 
                        marginTop: '8px',
                        padding: '4px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '4px',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                      }}>
                        {JSON.stringify(status.details, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}
              
            <button
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '8px',
                fontSize: '11px'
              }}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealthMonitor;
