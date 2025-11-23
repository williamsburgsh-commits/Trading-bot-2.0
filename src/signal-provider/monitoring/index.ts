export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: Date;
  services: Record<string, ServiceStatus>;
}

export interface ServiceStatus {
  name: string;
  status: 'up' | 'down';
  latency?: number;
  lastCheck: Date;
}

export interface IHealthMonitor {
  checkHealth(): Promise<HealthStatus>;
  registerService(name: string, checkFn: () => Promise<boolean>): void;
}

export interface Metrics {
  signalsGenerated: number;
  errorsCount: number;
  uptimeSeconds: number;
}

export interface IMetricsCollector {
  increment(metric: string, value?: number): void;
  gauge(metric: string, value: number): void;
  getMetrics(): Metrics;
}
