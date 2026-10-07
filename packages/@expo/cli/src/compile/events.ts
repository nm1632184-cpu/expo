import { events } from '2g';
import type { SerializedError } from '2g';

import type { Platform } from './resolveOptions';

declare module '2g' {
  interface EventRegistry {
    'compile:build:done': {
      platform: Platform;
      scheme: string;
      configuration: string;
    };
    'compile:build:failed': {
      platform: Platform;
      error: SerializedError;
    };
  }
}

export const event = events('compile');
