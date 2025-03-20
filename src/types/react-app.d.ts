/// <reference types="react" />
/// <reference types="react-dom" />

// This file sets up the React types for the project
// It ensures proper TypeScript compatibility with JSX

import * as React from 'react';

declare module 'react' {
  // Make sure FC is defined
  export type FC<P = {}> = React.FunctionComponent<P>;
  export type FunctionComponent<P = {}> = React.ComponentType<P>;
}

// Set up JSX types
declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode;
    }
    interface ElementAttributesProperty {
      props: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }
    
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Add React hook types in case the React version doesn't export them
declare module 'react' {
  // If useState is missing from React, add it
  export function useState<T>(initialState: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>];
  export function useState<T = undefined>(initialState?: undefined): [T | undefined, React.Dispatch<React.SetStateAction<T | undefined>>];
  
  // If useEffect is missing from React, add it
  export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
  
  // Other common hooks
  export function useContext<T>(context: React.Context<T>): T;
  export function useReducer<R extends React.Reducer<any, any>, I>(reducer: R, initializerArg: I, initializer: (arg: I) => React.ReducerState<R>): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>];
  export function useReducer<R extends React.Reducer<any, any>>(reducer: R, initialState: React.ReducerState<R>, initializer?: undefined): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>];
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: React.DependencyList): T;
  export function useMemo<T>(factory: () => T, deps: React.DependencyList | undefined): T;
  export function useRef<T = undefined>(initialValue: T): React.MutableRefObject<T>;
  export function useRef<T>(initialValue: T | null): React.RefObject<T>;
}

export {};
