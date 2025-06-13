import { mount } from 'svelte'
import App from './sidebar.svelte'

const app = mount(App, {
  target: document.getElementById('main-body')!,
})

export default app
