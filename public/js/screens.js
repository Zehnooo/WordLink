import { chainListView, errorView } from "./dom.js";

export const changeScreen = (screen) => {
    const screenEl = document.querySelector(`#${screen}`);
    if (!screenEl) { console.error(`Unknown screen: ${screen}`); return; }

    document.querySelectorAll('.screen').forEach(screen => screen.setAttribute("hidden", "hidden"));
    showContent(screenEl.id);
    screenEl.removeAttribute("hidden");
}

const showContent = (screenId) => {
    const contentDiv = document.querySelector(`#${screenId}-content`);
    if (!contentDiv) { console.error(`Content Div for ${screenId} was not found.`); return; }
    const render = screenContent[screenId] ?? screenContent['error-screen'];
    contentDiv.replaceChildren(render());
}

const screenContent = {
    //'home-screen': homeView();
    'chain-list-screen': chainListView,
    'error-screen': errorView,
}

