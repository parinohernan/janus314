/// <reference types="svelte" />

declare namespace svelte.JSX {
  interface HTMLAttributes<T> {
    'on:clickoutside'?: (event: CustomEvent) => void;
  }
} 