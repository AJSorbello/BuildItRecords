declare module 'customize-cra' {
  import { Configuration } from 'webpack';
  export function override(...plugins: any[]): (config: Configuration) => Configuration;
  export function addBabelPlugin(plugin: any): (config: Configuration) => Configuration;
  export function addBabelPreset(preset: any): (config: Configuration) => Configuration;
  export function addWebpackAlias(alias: Record<string, string>): (config: Configuration) => Configuration;
  export function adjustStyleLoaders(callback: (rule: any) => void): (config: Configuration) => Configuration;
}