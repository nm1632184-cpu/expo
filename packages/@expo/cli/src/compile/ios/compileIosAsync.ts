import chalk from 'chalk';
import path from 'path';

import * as Log from '../../log';
import { copyAsync, removeAsync } from '../../utils/dir';
import { event } from '../events';
import type { ResolvedOptions } from '../resolveOptions';
import { resolveOptionsAsync } from './resolveOptions';
import { buildAsync, getAppPathAsync } from './xcodebuild';

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

  let binaryPath = await getAppPathAsync(props);
  if (props.outputDir) {
    binaryPath = await copyBinaryToOutputAsync(binaryPath, props.outputDir);
  }
  Log.log(chalk`\n{green ✓} Build complete`);
  Log.log(chalk`{bold Binary:} ${binaryPath}`);
}

async function copyBinaryToOutputAsync(binaryPath: string, outputDir: string): Promise<string> {
  const outputPath = path.join(outputDir, path.basename(binaryPath));
  if (outputPath === binaryPath) {
    return outputPath;
  }
  await removeAsync(outputPath);
  await copyAsync(binaryPath, outputPath);
  Log.log(chalk`{dim Copied to} ${outputPath}`);
  return outputPath;
}

function assertPlatform() {
  if (process.platform !== 'darwin') {
    Log.exit(
      chalk`iOS apps can only be built on macOS devices. Use {cyan eas build -p ios} to build in the cloud.`
    );
  }
}
