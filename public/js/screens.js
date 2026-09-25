import { errorView } from "./dom.js";
import { chainListView, populateChainListTable } from './chainListDom.js';

export const changeScreen =  (screen) => {
    const screenEl = document.querySelector(`#${screen}`);
    if (!screenEl) { return { success: false, message: `Unknown screen: ${screen}` }; }
    document.querySelectorAll('.screen').forEach(screen => screen.setAttribute("hidden", "hidden"));
    const res = showContent(screenEl.id);
    if (res.success){ screenEl.removeAttribute("hidden"); }
    return { success: true, message: `Screen changed to ${screen}`, screen: screen, loadableContent: res.loadableContent }
}

const showContent = (screenId) => {
    const contentDiv = document.querySelector(`#${screenId}-content`);
    if (!contentDiv) { return { success: false, message: `Content Div for ${screenId} was not found.`}; }

    const screen = (screenContent[screenId] ?? screenContent['error-screen'])();
    if (!screen.success) { return { success: false, message: screen.message }; }
    if (screen.success) { contentDiv.replaceChildren(screen.el); }

    return { success: true, message: `Content for ${screenId} built.`, loadableContent: screen.loadableContent }
}

const screenContent = {
    //'home-screen': homeView,
    'chain-list-screen': chainListView,
    'error-screen': errorView,
}

export const loadContent = {
    'chain-list-screen': populateChainListTable,
}

/*
if (screen.loadableContent) {
        if (Object.hasOwn(loadContent, screenId)) {
            const load = await loadContent[screenId]();
            if (!load.success){ console.error(load.message); }
            document.querySelector('#placeholder').remove();
        }
    }
 */