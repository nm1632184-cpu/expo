// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const moduleRoot = path.resolve(__dirname, '..');

// The module's devDependencies install a second copy of packages such as react-native and expo in
// ../node_modules. Resolve the package imports in the module's own files from the example app, like
// an app that installs the module would, so that the bundle includes only one copy of each package.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Path of the importing file relative to the module root, e.g. `src/MyModule.ts`.
  const origin = path.relative(moduleRoot, context.originModulePath);
  const isModuleFile =
    // Not outside the module root. On Windows, a file on another drive gives an absolute path.
    !origin.startsWith('..') &&
    !path.isAbsolute(origin) &&
    // Not a dependency or a file of the example app. `[\\/]` matches Windows and POSIX separators.
    !/^(node_modules|example)[\\/]/.test(origin);
  // A package name such as `react-native`, not a relative or absolute file path.
  const isPackageImport = !moduleName.startsWith('.') && !path.isAbsolute(moduleName);
  if (isModuleFile && isPackageImport) {
    // Resolve as if the example app imported the package: Metro looks in ./node_modules first,
    // then falls back to ../node_modules for packages that only the module depends on.
    const originModulePath = path.join(__dirname, 'package.json');
    return context.resolveRequest({ ...context, originModulePath }, moduleName, platform);
  }
  // Metro's default resolution for all other imports.
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, './node_modules'),
  path.resolve(__dirname, '../node_modules'),
];

config.resolver.extraNodeModules = {
  '<%- project.slug %>': '..',
};

config.watchFolders = [path.resolve(__dirname, '..')];

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
