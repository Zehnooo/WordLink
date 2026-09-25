import icons from './icons.js';
import { changeScreen } from "./screens.js";

export const setNavIcons = () => {
    document.querySelectorAll('.icon').forEach(navBtn => {
        let id = navBtn.id.replace('-icon', '').replace('-list', '');
        navBtn.innerHTML = icons.nav[id];
    });
}

export const setNavButtons = () => {
    document.querySelectorAll('nav>ul>li>button').forEach(navBtn => {
        navBtn.addEventListener('click', () => { changeScreen(navBtn.dataset.screen); });
    });
}