import { errorView } from "./dom.js";
import { chainListView, populateChainListTable } from './chainListDom.js';

export const changeScreen = async (screen) => {
    const screenEl = document.querySelector(`#${screen}`);
    if (!screenEl) { return { success: false, message: `Unknown screen: ${screen}` }; }

    document.querySelectorAll('.screen').forEach(screen => screen.setAttribute("hidden", "hidden"));
    const res = await showContent(screenEl.id);
    if (res.success){ screenEl.removeAttribute("hidden"); }
}

const showContent = async (screenId) => {
    const contentDiv = document.querySelector(`#${screenId}-content`);
    if (!contentDiv) { return { success: false, message: `Content Div for ${screenId} was not found.`}; }

    const screen = (screenContent[screenId] ?? screenContent['error-screen'])();

    if (!screen.success) { return { success: false, message: screen.message }; }
    if (screen.success) { contentDiv.replaceChildren(screen.el); }
    if (screen.loadableContent) {
        if (Object.hasOwn(loadContent, screenId)) {
            const load = await loadContent[screenId]();
            if (!load.success){ console.error(load.message); }
            document.querySelector('#placeholder').remove();
        }
    }


    return { success: true, message: `Content for ${screenId} built.` }
}

const screenContent = {
    //'home-screen': homeView,
    'chain-list-screen': chainListView,
    'error-screen': errorView,
}

const loadContent = {
    'chain-list-screen': populateChainListTable,
}

