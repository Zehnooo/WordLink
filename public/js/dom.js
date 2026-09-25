import icons from './icons.js';


export const chainListView = () => {

    const mainCon = newEl('div', null, 'chain-list-content', ['view-content']);
    const topBar = newEl('div', null, 'chain-list-actions', ['fx']);

    const title = newEl('h2', 'Chain Lists');

    const newListBtn = newEl('button', null, 'chain-list-create', ['ifx', 'p04', 'gp04', 'wa', 'ha', 'btn', 'ac', 'br04', 'bgt' ]);
    newListBtn.addEventListener('click', () => { console.log('New List Button'); });
    newListBtn.innerHTML = icons.buttons.plus + 'New List';

    const searchCon = newEl('div', null, 'chain-list-search-con', ['fx', 'ac']);
    const search = newEl('input', null, 'chain-list-search-input');
    search.addEventListener('input', (e) => { console.log(e.target.value) });
    const searchIcon = newEl('span');
        searchIcon.innerHTML = icons.misc.search;

    searchCon.append(search, searchIcon);
    topBar.append(title, newListBtn, searchCon);
    mainCon.append(topBar);
    return mainCon;
}

export const errorView = () => {
    const mainCon = newEl('div', null, 'error-content', ['view-content']);
    const title = newEl('h2', 'Error');
    const p = newEl('p', 'Failed to load content. Please try again.');
    mainCon.append(title, p);
    return mainCon;
}

const newEl = (type, text = null, id = null, classes = []) => {
        const x = document.createElement(type);
        if (text !== null) x.textContent = text;
        if (id !== null) x.id = id;
        if (classes.length) { classes.forEach(c => x.classList.add(c)); }
        return x;
}