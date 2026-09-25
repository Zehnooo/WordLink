import { newEl } from './dom.js';
import icons from './icons.js';
import { loadData } from './data.js';

export const chainListView = () => {
    const mainCon = newEl('div', null, 'chain-list-content', ['view-content']);
    const header = chainListHeader();
    const table = chainListTable();

    mainCon.append(header, table);
    return mainCon;
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
    let filter = 'All';
    ['ALL', 'VERIFIED', 'DRAFTS'].forEach(type => {
        const cleanName = type.toLowerCase();
        const b = newEl('button', type, `filter-${cleanName}`, ['p04']);
        b.type = 'button';
        b.dataset.filter = cleanName;
        filter = type;
    });
    const listRoot = newEl('div', null, 'list-data');
    listRoot.append(newEl('div', 'Loading lists...', 'placeholder'));

    filterCon.append(filter);
    con.append(filterCon, listRoot);
    return con;
}

const chainListTableItem = (listItem) => {
    const itemStatus = listItem.verified ? 'verified' : 'unverified';
    const simpleName = listItem.name.replace(' ', '-').toLowerCase();

    const row = newEl('div', null, `row-${listItem.id}`);
    const con = newEl('div', null, null, ['fx', 'ac', 'w', 'gp1']);

    const verified = newEl('span', null, null, [itemStatus]);
    const number = newEl('span', String(listItem.id) ?? 'null');
    const name = newEl('p', listItem.name ?? '--');
    const wordCount = newEl('span', `${listItem.words.length} / 5` ?? 'null / 5');
    const editBtn = newEl('button', null, `${simpleName}-edit`);
    editBtn.innerHTML = icons.buttons.edit + 'Edit';

    con.append(verified, number, name, wordCount, editBtn);
    row.append(con);
    return row;
}

export const populateChainListTable = async () => {
    const lists = await loadData();
    if (!lists || !lists.length) { return { success: false, message: 'Error loading lists. No lists found.' }; }
    const table = document.querySelector('#list-data');
    if (!table) { return { success: false, message: 'Error, could not find list table.' }; }
    lists.forEach(item => table.append(chainListTableItem(item)));
    return { success: true, message: `Table populated with ${lists.length} lists` };
}