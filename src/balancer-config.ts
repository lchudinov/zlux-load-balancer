export interface BalancerConfig {
  servers: string[];
  https: {
    port: number,
    keys: string[];
    certs: string[];
  }
}