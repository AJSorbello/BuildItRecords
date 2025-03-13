#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// List of type packages to install
const typePackages = [
  "@types/babel__core",
  "@types/bcryptjs",
  "@types/bonjour",
  "@types/connect-history-api-fallback",
  "@types/cookiejar",
  "@types/cors",
  "@types/express",
  "@types/history",
  "@types/jest",
  "@types/lodash",
  "@types/methods",
  "@types/morgan",
  "@types/node",
  "@types/nodemailer",
  "@types/papaparse",
  "@types/path-browserify",
  "@types/pg",
  "@types/phoenix",
  "@types/react",
  "@types/react-dom",
  "@types/react-is",
  "@types/scheduler",
  "@types/source-list-map",
  "@types/spotify-web-api-node",
  "@types/styled-components",
  "@types/superagent",
  "@types/swagger-jsdoc",
  "@types/testing-library__jest-dom",
  "@types/testing-library__react",
  "@types/uglify-js",
  "@types/webpack-bundle-analyzer",
  "@types/webpack-sources",
  "@types/ws"
];

// Create a new directory for types if it doesn't exist
const typesDir = path.join(__dirname, 'src', 'types', 'custom');
if (!fs.existsSync(typesDir)) {
  fs.mkdirSync(typesDir, { recursive: true });
}

// Create custom declaration files for packages without official type definitions
const customTypeDeclarations = {
  'customize-cra': `declare module 'customize-cra' {
  import { Configuration } from 'webpack';
  export function override(...plugins: any[]): (config: Configuration) => Configuration;
  export function addBabelPlugin(plugin: any): (config: Configuration) => Configuration;
  export function addBabelPreset(preset: any): (config: Configuration) => Configuration;
  export function addWebpackAlias(alias: Record<string, string>): (config: Configuration) => Configuration;
  export function adjustStyleLoaders(callback: (rule: any) => void): (config: Configuration) => Configuration;
}`,
  'eslint-scope': `declare module 'eslint-scope' {
  const content: any;
  export default content;
}`,
  'estree': `declare module 'estree' {
  const content: any;
  export default content;
}`,
  'resolve': `declare module 'resolve' {
  function sync(id: string, opts?: any): string;
  function isCore(id: string): boolean;
  export { sync, isCore };
}`,
  'retry': `declare module 'retry' {
  export function operation(options?: any): any;
  export function timeouts(options?: any): number[];
}`,
  'tapable': `declare module 'tapable' {
  export class SyncHook {
    constructor(args?: string[]);
    tap(name: string, fn: Function): void;
    call(...args: any[]): any;
  }
  export class AsyncParallelHook {
    constructor(args?: string[]);
    tapAsync(name: string, fn: Function): void;
    tapPromise(name: string, fn: Function): void;
    callAsync(...args: any[]): any;
  }
}`,
  'webpack': `declare module 'webpack' {
  const webpack: any;
  export = webpack;
}`,
  'workbox-webpack-plugin': `declare module 'workbox-webpack-plugin' {
  export class GenerateSW {
    constructor(config?: any);
  }
  export class InjectManifest {
    constructor(config?: any);
  }
}`
};

console.log('Creating custom type declarations for packages without official type definitions...');
Object.entries(customTypeDeclarations).forEach(([packageName, declaration]) => {
  const filePath = path.join(typesDir, `${packageName}.d.ts`);
  fs.writeFileSync(filePath, declaration);
  console.log(`Created ${filePath}`);
});

// Update tsconfig.json to improve type resolution
try {
  const tsconfigPath = path.join(__dirname, 'tsconfig.json');
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  
  // Update typeRoots to include the new custom types
  if (!tsconfig.compilerOptions.typeRoots) {
    tsconfig.compilerOptions.typeRoots = [];
  }
  
  // Make sure our custom types directory is included
  if (!tsconfig.compilerOptions.typeRoots.includes('./src/types/custom')) {
    tsconfig.compilerOptions.typeRoots.push('./src/types/custom');
  }
  
  // Add skipLibCheck option
  tsconfig.compilerOptions.skipLibCheck = true;
  
  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  console.log('Updated tsconfig.json with custom type directories');
} catch (error) {
  console.error('Error updating tsconfig.json:', error);
}

// Install type packages
console.log('Installing TypeScript definition packages...');
try {
  execSync(`npm install --save-dev ${typePackages.join(' ')}`, { 
    stdio: 'inherit'
  });
  console.log('Successfully installed TypeScript definition packages');
} catch (error) {
  console.error('Error installing packages:', error);
}

console.log('Type definition setup complete!');
