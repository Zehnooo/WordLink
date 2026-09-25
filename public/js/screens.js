import { chainListView } from "./dom.js";

export const changeScreen = (screen) => {
    document.querySelectorAll('.screen').forEach(screen => screen.setAttribute("hidden", "hidden"));
    const screenEl = document.querySelector(`#${screen}`);
    showContent(screenEl.id);
    screenEl.removeAttribute("hidden");
}

const showContent = (screenId) => {
    const contentDiv = document.querySelector(`#${screenId}-content`);
    contentDiv.replaceChildren();
    contentDiv.append(screenContent[screenId]);
}

const screenContent = {
    //'home-screen': homeView();
    'chain-list-screen': chainListView(),
}