# Svelte for frontend

This project uses <b>Svelte</b> as the frontend for the VS Code webviews UI. Svelte is a compiler that compiles `.svelte` code to `.js` code, which we then use in our webviews.
This guide explains how to set up and work with the Svelte components inside this VSCode extension project.

### Getting started
1. Clone the repo if you haven't already and cd to the base directory.
2. Run the following commands from your terminal:
```bash
cd svelte
npm install
```

### Editing an existing root component
If you want to edit an existing `.svelte` file like `sidebar.svelte` inside of `svelte/src` and compile it to a `.js`, then modify the `.svelte` file, and run:
```bash
npx vite build --config vite.sidebar.config.js
```
The output will be placed in the `svelte/dist` directory. Look at `svelte/src/sidebar.ts` file. That will tell you where the compiled `.js` file will inject the content inside any HTML.
If you are interested in seeing how the compiled `.js` file is used in our sidebar webview, look at the `_get_html_content` method inside [`sidebarProvider.ts`](https://github.com/ejrgilbert/whamm-live/blob/main/src/sidebarProvider.ts)


### Creating a new root component
If you want to create your own `.svelte` file to use as a root component, then follow the following steps:
1. Create a .svelte file inside `svelte/src`. Let's say you created `app.svelte`.
2. Create a corresponding `.ts` file in `svelte/src`. This file should export the app from your `.svelte` file. The code should look something like this:
   ```typescript
   import { mount } from 'svelte'
   import App from './app.svelte'

    const app = mount(App, {
    target: document.getElementById('app')!,
    })

    export default app
   ```
3. Copy an existing config file like `vite.sidebar.config.js` and rename it:

```bash
cp vite.sidebar.config.js vite.app.config.js
```

Update the new config file to reflect the new entry points (input/output names, etc.).

4. Now, run:
   
```bash
npx vite build —config vite.app.config.ts
```
This should generate an `app.js` inside the `svelte/dist` directory. You can now use the compiled `app.js` file. 
> Note: Look at [`sidebarProvider.ts`](https://github.com/ejrgilbert/whamm-live/blob/main/src/sidebarProvider.ts) to understand how to use the `.js` file for any webview.
