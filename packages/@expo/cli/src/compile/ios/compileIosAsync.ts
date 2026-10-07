import chalk from 'chalk';

import * as Log from '../../log';
import { event } from '../events';
import type { ResolvedOptions } from '../resolveOptions';
import { resolveOptionsAsync } from './resolveOptions';
import { buildAsync } from './xcodebuild';

export async function compileIosAsync(projectRoot: string, options: ResolvedOptions) {
  assertPlatform();

  const props = await resolveOptionsAsync(projectRoot, options);

  const done = event.span();
  try {
    await buildAsync(props);
  } catch (error) {
    event('build:failed', { platform: 'ios', error: event.error(error as Error) });
    throw error;
  }
  done('build:done', {
    platform: 'ios',
    scheme: props.scheme,
    configuration: props.configuration,
  });
}

function assertPlatform() {
  if (process.platform !== 'darwin') {
    Log.exit(
      chalk`iOS apps can only be built on macOS devices. Use {cyan eas build -p ios} to build in the cloud.`
    );
  }
}
