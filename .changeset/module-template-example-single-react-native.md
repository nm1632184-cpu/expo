---
'expo-module-template': patch
---

Fixed the example app bundling a second copy of `react-native` and `expo` from the module's dependencies, which crashed it with `TypeError: property is not writable` when the module was created with pnpm.
