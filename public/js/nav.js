import icons from './icons.js';
import {changeScreen, loadContent} from "./screens.js";

export const setNavIcons = () => {
    document.querySelectorAll('.icon').forEach(navBtn => {
        let id = navBtn.id.replace('-icon', '').replace('-list', '');
        navBtn.innerHTML = icons.nav[id];
    });
}

export const setNavButtons = () => {
    document.querySelectorAll('nav>ul>li>button').forEach(navBtn => {
        navBtn.addEventListener('click', async () => {
            const res= changeScreen(navBtn.dataset.screen);
            if (!res.loadableContent) return;
            document.querySelector('#placeholder').remove();
            await loadContent[res.screen]();
        });
    });
}