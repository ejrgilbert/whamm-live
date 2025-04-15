# whamm-live #
Live programming with the [`Whamm` DSL](https://github.com/ejrgilbert/whamm)!

## Setup ##

### Configure `wit2ts`
1. Clone: https://github.com/microsoft/vscode-wasm
2. Build
```bash
cd wasm-component-model
npm run clean
npm run compile
# Test running the binary
./bin/wit2ts
```
3. Add `wit2ts` to `PATH`