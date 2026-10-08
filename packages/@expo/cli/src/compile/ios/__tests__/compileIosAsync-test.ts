import { Log } from '../../../log';
import { copyAsync, removeAsync } from '../../../utils/dir';
import { event } from '../../events';
import type { ResolvedOptions } from '../../resolveOptions';
import { compileIosAsync } from '../compileIosAsync';
import type { BuildProps } from '../resolveOptions';
import { resolveOptionsAsync } from '../resolveOptions';
import { buildAsync, getAppPathAsync } from '../xcodebuild';

jest.mock('../../../log');
jest.mock('../../../utils/dir');
jest.mock('../resolveOptions');
jest.mock('../xcodebuild');
jest.mock('../../events', () => {
  const done = jest.fn();
  return {
    event: Object.assign(jest.fn(), {
      span: jest.fn(() => done),
      error: jest.fn((error) => error),
    }),
  };
});

const mockPlatform = (value: typeof process.platform) =>
  Object.defineProperty(process, 'platform', {
    value,
  });

const platform = process.platform;

afterEach(() => {
  mockPlatform(platform);
});

const options: ResolvedOptions = { mode: 'development', outputType: 'app' };

const props: BuildProps = {
  ...options,
  configuration: 'Debug',
  xcodeProject: { name: '/app/ios/app.xcworkspace', isWorkspace: true },
  scheme: 'app',
  osType: 'iOS',
};

describe(compileIosAsync, () => {
  it(`asserts that the function only runs on darwin machines`, async () => {
    mockPlatform('win32');
    await expect(compileIosAsync('/app', options)).rejects.toThrow(/EXIT_CALLED/);
    expect(Log.exit).toHaveBeenCalledWith(expect.stringMatching(/eas build -p ios/));
    expect(resolveOptionsAsync).not.toHaveBeenCalled();
  });

  it(`builds the app`, async () => {
    mockPlatform('darwin');
    jest.mocked(resolveOptionsAsync).mockResolvedValueOnce(props);
    jest.mocked(getAppPathAsync).mockResolvedValueOnce('/DerivedData/app.app');
    await compileIosAsync('/app', options);
    expect(resolveOptionsAsync).toHaveBeenCalledWith('/app', options);
    expect(buildAsync).toHaveBeenCalledWith(props);
    expect(jest.mocked(event.span).mock.results[0]?.value).toHaveBeenCalledWith('build:done', {
      platform: 'ios',
      scheme: 'app',
      configuration: 'Debug',
    });
    expect(Log.log).toHaveBeenCalledWith(expect.stringContaining('Build complete'));
    expect(Log.log).toHaveBeenCalledWith(expect.stringContaining('Binary: /DerivedData/app.app'));
  });

  it(`copies the app to the output directory`, async () => {
    mockPlatform('darwin');
    jest.mocked(resolveOptionsAsync).mockResolvedValueOnce({ ...props, outputDir: '/app/build' });
    jest.mocked(getAppPathAsync).mockResolvedValueOnce('/DerivedData/app.app');
    await compileIosAsync('/app', options);
    expect(removeAsync).toHaveBeenCalledWith('/app/build/app.app');
    expect(jest.mocked(removeAsync).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(copyAsync).mock.invocationCallOrder[0]!
    );
    expect(copyAsync).toHaveBeenCalledWith('/DerivedData/app.app', '/app/build/app.app');
    expect(Log.log).toHaveBeenCalledWith(expect.stringContaining('Copied to /app/build/app.app'));
    expect(Log.log).toHaveBeenCalledWith(expect.stringContaining('Binary: /app/build/app.app'));
  });

  it(`reports a failed build`, async () => {
    mockPlatform('darwin');
    jest.mocked(resolveOptionsAsync).mockResolvedValueOnce(props);
    const error = new Error('build failed');
    jest.mocked(buildAsync).mockRejectedValueOnce(error);
    await expect(compileIosAsync('/app', options)).rejects.toBe(error);
    expect(event).toHaveBeenCalledWith('build:failed', { platform: 'ios', error });
  });
});
