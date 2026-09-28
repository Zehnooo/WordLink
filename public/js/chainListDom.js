import { newEl } from './dom.js';
import icons from './icons.js';
import { loadData } from './data.js';
import { List } from './List.js';

export const chainListView = () => {
    const el = newEl('div', null, 'chain-list-content', ['view-content']);
    el.append(chainListHeader(), chainListTable());
    return { success: true, message: 'Chain List View built', view: 'chain-list', el: el, loadableContent: true };
}

const chainListHeader = () => {
    const con = newEl('div', null, 'chain-list-main', ['fx', 'fdc', 'w']);
    const newCon = newEl('div', null, null, ['fx', 'w']);

    const title = newEl('h2', 'Chain Lists');

    const newListBtn = newEl('button', null, 'chain-list-create', ['ifx', 'p04', 'gp04', 'wa', 'ha', 'btn', 'ac', 'br04', 'bgt' ]);
    newListBtn.addEventListener('click', () => { console.log('New List Button'); });
    newListBtn.innerHTML = icons.buttons.plus + 'New List';

    const searchCon = newEl('div', null, 'chain-list-search-con', ['fx', 'ac', 'w']);
    const search = newEl('input', null, 'chain-list-search-input');
    search.type = 'search';
    search.placeholder = 'Search lists...';
    search.addEventListener('input', (e) => { console.log(e.target.value) });
    const searchIcon = newEl('span');
    searchIcon.innerHTML = icons.misc.search;

    newCon.append(title, newListBtn);
    searchCon.append(search, searchIcon);
    con.append(newCon, searchCon);
    return con;
}

const chainListTable = () => {
    const con = newEl('div');
    const filterCon = newEl('div', null, 'filters', ['fx', 'p1', 'gp1']);
    ['ALL', 'VERIFIED', 'DRAFTS'].forEach(type => {
        const cleanName = type.toLowerCase();
        const b = newEl('button', type, `filter-${cleanName}`, ['p04']);
        b.type = 'button';
        b.dataset.filter = cleanName;
        b.addEventListener('click', () => { console.log('Filter', type); });
        filterCon.append(b);
    });
    const listRoot = newEl('div', null, 'list-data');
    listRoot.append(newEl('div', 'Loading lists...', 'placeholder'));

    con.append(filterCon, listRoot);
    return con;
}

const chainListTableItem = (listItem) => {
    const itemStatus = listItem.verified ? 'verified' : 'unverified';

    const row = newEl('div', null, `row-${listItem.id}`);
    const con = newEl('div', null, null, ['fx', 'ac', 'w', 'gp1']);

    const verified = newEl('div', null, null, [itemStatus, 'list-status']);
    const name = newEl('p', listItem.title ?? '--');
    const wordCount = newEl('span', `${listItem.words?.length ?? 0} / 5`);
    const editBtn = newEl('button', null, `${listItem.id}-edit`);
    editBtn.innerHTML = icons.buttons.edit + 'Edit';
    editBtn.addEventListener('click', () => { console.log(`Edit: ${listItem.id ?? null} - ${listItem.title ?? null}`); });

    con.append(name, wordCount, verified, editBtn);
    row.append(con);
    return row;
}

export const populateChainListTable = async () => {
    const table = document.querySelector('#list-data');
    if (!table) { return { success: false, message: 'Error, could not find list table.' }; }

    const data = await loadData('./mock-data/lists.json');
    const lists = [];
    data.forEach(item => lists.push(new List(item.name, item.words)));
    if (!lists || !lists.length) {
        table.replaceChildren(newEl('div', 'No lists found.'));
        return { success: false, message: 'Error loading lists. No lists found.' }; }

    table.replaceChildren();
    lists.forEach(item => table.append(chainListTableItem(item)));
    return { success: true, message: `Table populated with ${lists.length} lists`, result: lists };
}