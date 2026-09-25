import { errorView } from "./dom.js";
import { chainListView, populateChainListTable } from './chainListDom.js';

export const changeScreen = async (screen) => {
    const screenEl = document.querySelector(`#${screen}`);
    if (!screenEl) { console.error(`Unknown screen: ${screen}`); return; }

    document.querySelectorAll('.screen').forEach(screen => screen.setAttribute("hidden", "hidden"));
    await showContent(screenEl.id);
    screenEl.removeAttribute("hidden");
}

const showContent = async (screenId) => {
    const contentDiv = document.querySelector(`#${screenId}-content`);
    if (!contentDiv) { return { success: false, message: `Content Div for ${screenId} was not found.`}; }
    const render = screenContent[screenId] ?? screenContent['error-screen'];
    contentDiv.replaceChildren(render());
    if (Object.hasOwn(loadContent, screenId)) {
        const load = await loadContent[screenId]();
        if (!load.success){ console.error(load.message); }
        document.querySelector('#placeholder').remove();
    }
}

const screenContent = {
    //'home-screen': homeView,
    'chain-list-screen': chainListView,
    'error-screen': errorView,
}

const loadContent = {
    'chain-list-screen': populateChainListTable,
}

