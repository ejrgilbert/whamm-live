# whamm-live
Live programming with the [`Whamm` DSL](https://github.com/ejrgilbert/whamm)!


Whamm Live is a VSCode extension that provides live, bidirectional visibility between `Whamm` scripts and their instrumentation effects for the [`Wizard` engine](https://github.com/titzer/wizard-engine) target as well as other selected Wasm targets.

## Install
> [!NOTE]  
> This extension is not yet available on the VS Code Marketplace. You will need to manually install the `.vsix` file.

1. To get started, first download the `.vsix` file from the [releases](https://github.com/ejrgilbert/whamm-live/releases) page.

2. Open your terminal
```bash
code --install-extension path/to/live-whamm-x.y.z.vsix
```
Related Resource(s): [Install from a vsix](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace#_install-from-a-vsix)

## Guide

[GUIDE.md](./GUIDE.md)

## Development Setup
Want to contribute or test locally? Here's how to set it up:

1. Clone the repo:
```bash
git clone https://github.com/ejrgilbert/whamm-live.git
cd whamm-live
```

2. Configure `wit2s`

    1. Clone [vscode-wasm](https://github.com/microsoft/vscode-wasm)
    2. Build

    ```bash
    cd vscode-wasm
    npm install
    cd wasm-component-model
    npm run clean
    npm run compile
    chmod +x ./bin/wit2s
    # Test running the binary
    ./bin/wit2ts

    # Add `wit2s` to `PATH`
    export PATH="$PWD/bin:$PATH"
    ```

3. Setup svelte
```bash
    cd whamm-live/svelte
    npm install
    npm run build
```
For specific svelte stuff, look at [svelte/README.md](https://github.com/ejrgilbert/whamm-live/tree/main/svelte).

4. Setup `Whamm`
    1. Clone `Whamm`.
    2. Add `Whamm` to Live-Whamm's `Cargo.toml` file
```toml
whamm={path="path/to/whamm/repo"}
```

5. Finally, to start the extension:
```bash
npm install
cargo build
```
Run extension using `F5` key

### Improvements

- [ ] Execute Wasm code in a worker (make it async): [tutorial](https://code.visualstudio.com/blogs/2024/06/07/wasm-part2)
- [ ] Reduce duplicated effort for re-creating an Orca module on every `run` invocationß