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

## To work on ##

### MVP: Backend ###

whamm backend:
- [ ] Get whamm running as a Rust library dependency
- [ ] Collect location metadata

extension frontend:
- [ ] Call whamm library
- [ ] Pass probe locations to extension
- [ ] Cache probes as `Map<Loc, Wat>`
- [ ] Print all activated probes to console

### MVP: UI ###

- [ ] Open script
- [ ] print app WAT in side-pane
- [ ] overlay something with probe metadata

### Improvements ###

- [ ] Execute Wasm code in a worker (make it async): [tutorial](https://code.visualstudio.com/blogs/2024/06/07/wasm-part2)
- [ ] Reduce duplicated effort for re-creating an Orca module on every `run` invocationß
