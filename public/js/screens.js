import { chainListView, errorView } from "./dom.js";

export const changeScreen = (screen) => {
    document.querySelectorAll('.screen').forEach(screen => screen.setAttribute("hidden", "hidden"));
    const screenEl = document.querySelector(`#${screen}`);
    showContent(screenEl.id);
    screenEl.removeAttribute("hidden");
}

const showContent = (screenId) => {
    const contentDiv = document.querySelector(`#${screenId}-content`);
    let render = screenContent[screenId];
    if (!contentDiv || !render) render = screenContent['error-screen'];
    contentDiv.replaceChildren();
    contentDiv.append(render());
}

const screenContent = {
    //'home-screen': homeView();
    'chain-list-screen': chainListView,
    'error-screen': errorView,
}

