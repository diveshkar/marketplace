export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${String(x)}`);
}

export * from './categories.js';
export * from './locations.js';
