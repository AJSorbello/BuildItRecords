/**
 * MonitoringService.ts
 * A service for monitoring API and database health across Vercel, Render, and PostgreSQL
 */

import { databaseService } from './DatabaseService';
import { getApiBaseUrl } from '../utils/apiConfig';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  message: string;
  timestamp: string;
  details?: Record<string, any>;
  lastSuccessful?: string;
  retryCount?: number;
}

export interface SystemHealth {
  vercel: HealthStatus;
  render: HealthStatus;
  database: HealthStatus;
  overall: HealthStatus;
}

export type ServiceType = 'vercel' | 'render' | 'database';

class MonitoringService {
  private static instance: MonitoringService;
  private healthStatus: SystemHealth;
  private listeners: Array<(health: SystemHealth) => void> = [];
  private retryIntervals: Record<ServiceType, number> = {
    vercel: 0,
    render: 0,
    database: 0
  };
  private maxRetryAttempts = 3;
  private retryDelayMs = 5000; // 5 seconds

  private constructor() {
    this.healthStatus = {
      vercel: this.createDefaultHealthStatus(),
      render: this.createDefaultHealthStatus(),
      database: this.createDefaultHealthStatus(),
      overall: this.createDefaultHealthStatus()
    };
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private createDefaultHealthStatus(): HealthStatus {
    return {
      status: 'unknown',
      message: 'Health check not performed yet',
      timestamp: new Date().toISOString(),
      retryCount: 0
    };
  }

  /**
   * Check the health of a specific service
   * @param service The service to check (vercel, render, database)
   * @returns Promise<HealthStatus> The health status of the service
   */
  public async checkServiceHealth(service: ServiceType): Promise<HealthStatus> {
    console.log(`[MonitoringService] Checking health of ${service} service`);
    let healthStatus: HealthStatus;

    try {
      switch (service) {
        case 'vercel':
          healthStatus = await this.checkVercelHealth();
          break;
        case 'render':
          healthStatus = await this.checkRenderHealth();
          break;
        case 'database':
          healthStatus = await this.checkDatabaseHealth();
          break;
        default:
          throw new Error(`Unknown service type: ${service}`);
      }
    } catch (error) {
      console.error(`[MonitoringService] Error checking ${service} health:`, error);
      healthStatus = {
        status: 'unhealthy',
        message: `Error checking health: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
        retryCount: (this.healthStatus[service].retryCount || 0) + 1
      };

      // Implement retry logic
      if ((healthStatus.retryCount || 0) <= this.maxRetryAttempts) {
        this.scheduleRetry(service);
      }
    }

    // Update the health status
    this.healthStatus[service] = healthStatus;
    this.updateOverallHealth();
    this.notifyListeners();

    return healthStatus;
  }

  /**
   * Check the health of the Vercel deployment
   */
  private async checkVercelHealth(): Promise<HealthStatus> {
    try {
      // For Vercel, we can use the window location to check if we're running on Vercel
      // and if the application is loading properly
      const isVercel = typeof window !== 'undefined' && 
                      window.location.hostname.includes('vercel.app');

      if (isVercel) {
        // For a more thorough check, you could call a specific health endpoint
        const response = await fetch('/api/health', {
          method: 'GET',
          cache: 'no-cache'
        });

        if (response.ok) {
          return {
            status: 'healthy',
            message: 'Vercel deployment is healthy',
            timestamp: new Date().toISOString(),
            lastSuccessful: new Date().toISOString(),
            retryCount: 0
          };
        } else {
          return {
            status: 'degraded',
            message: `Vercel health check failed with status ${response.status}`,
            timestamp: new Date().toISOString(),
            details: { statusCode: response.status },
            retryCount: (this.healthStatus.vercel.retryCount || 0) + 1
          };
        }
      } else {
        // We're not running on Vercel, so just return a healthy status
        return {
          status: 'healthy',
          message: 'Not running on Vercel, assuming healthy',
          timestamp: new Date().toISOString(),
          lastSuccessful: new Date().toISOString(),
          retryCount: 0
        };
      }
    } catch (error) {
      console.error('[MonitoringService] Error checking Vercel health:', error);
      return {
        status: 'unhealthy',
        message: `Vercel health check error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
        retryCount: (this.healthStatus.vercel.retryCount || 0) + 1
      };
    }
  }

  /**
   * Check the health of the Render API
   */
  private async checkRenderHealth(): Promise<HealthStatus> {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const healthEndpoint = `${apiBaseUrl}/health`;
      
      console.log(`[MonitoringService] Checking Render health at ${healthEndpoint}`);
      
      const response = await fetch(healthEndpoint, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          status: 'healthy',
          message: 'Render API is responding correctly',
          timestamp: new Date().toISOString(),
          details: data as Record<string, any>,
          lastSuccessful: new Date().toISOString(),
          retryCount: 0
        };
      } else {
        return {
          status: 'unhealthy',
          message: `Render API returned status ${response.status}`,
          timestamp: new Date().toISOString(),
          details: { statusCode: response.status },
          retryCount: (this.healthStatus.render.retryCount || 0) + 1
        };
      }
    } catch (error) {
      console.error('[MonitoringService] Error checking Render health:', error);
      return {
        status: 'unhealthy',
        message: `Render health check error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
        retryCount: (this.healthStatus.render.retryCount || 0) + 1
      };
    }
  }

  /**
   * Check the health of the PostgreSQL database
   */
  private async checkDatabaseHealth(): Promise<HealthStatus> {
    try {
      // We'll use a simple API call that requires database access
      // If it succeeds, we know the database is working
      const result = await databaseService.fetchApi('db-health', {
        method: 'GET',
        cache: 'no-cache'
      });

      if (result.success) {
        return {
          status: 'healthy',
          message: 'Database connectivity confirmed',
          timestamp: new Date().toISOString(),
          details: result.data as Record<string, any>,
          lastSuccessful: new Date().toISOString(),
          retryCount: 0
        };
      } else {
        return {
          status: 'unhealthy',
          message: `Database health check failed: ${result.message}`,
          timestamp: new Date().toISOString(),
          details: { error: result.message },
          retryCount: (this.healthStatus.database.retryCount || 0) + 1
        };
      }
    } catch (error) {
      console.error('[MonitoringService] Error checking database health:', error);
      return {
        status: 'unhealthy',
        message: `Database health check error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
        retryCount: (this.healthStatus.database.retryCount || 0) + 1
      };
    }
  }

  /**
   * Update the overall system health based on individual service health
   */
  private updateOverallHealth(): void {
    const services = ['vercel', 'render', 'database'] as const;
    const unhealthyServices = services.filter(service => 
      this.healthStatus[service].status === 'unhealthy');
    const degradedServices = services.filter(service => 
      this.healthStatus[service].status === 'degraded');
    const unknownServices = services.filter(service => 
      this.healthStatus[service].status === 'unknown');

    if (unhealthyServices.length > 0) {
      this.healthStatus.overall = {
        status: 'unhealthy',
        message: `System is unhealthy: ${unhealthyServices.join(', ')} service(s) are down`,
        timestamp: new Date().toISOString(),
        details: {
          unhealthyServices: unhealthyServices.map(service => ({
            name: service,
            status: this.healthStatus[service]
          }))
        }
      };
    } else if (degradedServices.length > 0) {
      this.healthStatus.overall = {
        status: 'degraded',
        message: `System is degraded: ${degradedServices.join(', ')} service(s) are experiencing issues`,
        timestamp: new Date().toISOString(),
        details: {
          degradedServices: degradedServices.map(service => ({
            name: service,
            status: this.healthStatus[service]
          }))
        }
      };
    } else if (unknownServices.length > 0) {
      this.healthStatus.overall = {
        status: 'unknown',
        message: `System health is unknown: ${unknownServices.join(', ')} service(s) have not been checked`,
        timestamp: new Date().toISOString()
      };
    } else {
      this.healthStatus.overall = {
        status: 'healthy',
        message: 'All systems operational',
        timestamp: new Date().toISOString(),
        lastSuccessful: new Date().toISOString()
      };
    }
  }

  /**
   * Update the health status of a specific service directly
   * @param service The service to update
   * @param healthStatus The new health status
   */
  public updateServiceHealth(service: ServiceType, healthStatus: Partial<HealthStatus>): void {
    // Ensure the timestamp is always set
    if (!healthStatus.timestamp) {
      healthStatus.timestamp = new Date().toISOString();
    }

    // Merge with existing status
    this.healthStatus[service] = {
      ...this.healthStatus[service],
      ...healthStatus
    };

    // Update the overall system health
    this.updateOverallHealth();

    // Notify subscribers
    this.notifyListeners();

    // Log the update
    console.log(`[MonitoringService] Updated ${service} health status: ${healthStatus.status || this.healthStatus[service].status}`);
  }

  /**
   * Subscribe to health status updates
   * @param listener A function to call when health status changes
   * @returns A function to unsubscribe
   */
  public subscribe(listener: (health: SystemHealth) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately notify with current status
    listener(this.healthStatus);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of health status changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.healthStatus);
      } catch (error) {
        console.error('[MonitoringService] Error in health status listener:', error);
      }
    });
  }

  /**
   * Schedule a retry for a service health check
   */
  private scheduleRetry(service: ServiceType): void {
    const retryCount = this.healthStatus[service].retryCount || 0;
    const delay = this.retryDelayMs * Math.pow(2, retryCount - 1); // Exponential backoff
    
    console.log(`[MonitoringService] Scheduling retry for ${service} in ${delay}ms (attempt ${retryCount})`);
    
    // Clear any existing retry interval
    if (this.retryIntervals[service]) {
      clearTimeout(this.retryIntervals[service]);
    }
    
    // Schedule the retry
    this.retryIntervals[service] = window.setTimeout(() => {
      console.log(`[MonitoringService] Retrying health check for ${service}`);
      this.checkServiceHealth(service).catch(error => {
        console.error(`[MonitoringService] Retry failed for ${service}:`, error);
      });
    }, delay);
  }

  /**
   * Check the health of all services
   */
  public async checkAllServices(): Promise<SystemHealth> {
    console.log('[MonitoringService] Checking health of all services');
    
    // Run all health checks in parallel
    await Promise.all([
      this.checkServiceHealth('vercel'),
      this.checkServiceHealth('render'),
      this.checkServiceHealth('database')
    ]);
    
    return this.healthStatus;
  }

  /**
   * Get the current health status
   */
  public getHealthStatus(): SystemHealth {
    return this.healthStatus;
  }

  /**
   * Start periodic health checks
   * @param intervalMs The interval in milliseconds between health checks
   * @returns A function to stop the health checks
   */
  public startPeriodicHealthChecks(intervalMs = 60000): () => void {
    console.log(`[MonitoringService] Starting periodic health checks every ${intervalMs}ms`);
    
    // Perform an initial health check
    this.checkAllServices().catch(error => {
      console.error('[MonitoringService] Initial health check failed:', error);
    });
    
    // Set up the interval
    const intervalId = window.setInterval(() => {
      this.checkAllServices().catch(error => {
        console.error('[MonitoringService] Periodic health check failed:', error);
      });
    }, intervalMs);
    
    // Return a function to stop the health checks
    return () => {
      window.clearInterval(intervalId);
      
      // Also clear any pending retry intervals
      Object.keys(this.retryIntervals).forEach(service => {
        clearTimeout(this.retryIntervals[service as ServiceType]);
      });
    };
  }
}

// Export the singleton instance
export const monitoringService = MonitoringService.getInstance();

// Also export the class as the default export
export default MonitoringService;
