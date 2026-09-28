import { newEl } from './dom.js';
import icons from './icons.js';

export const homeView = () => {
    const el = newEl('div', null, 'home-content', ['view-content']);
    el.append(homeMain());
    return { success: true, message: 'Home View built', view: 'home', el: el, loadableContent: false };
}

const homeMain = () => {
    const con = newEl('div');


    return con;
}

const practiceGame = () => {
    const list = ['ice', 'cream', 'cheese', 'cake', 'walk'];

}