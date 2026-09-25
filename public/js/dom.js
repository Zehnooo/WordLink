


export const chainListView = () => {
    const mainCon = newEl('div', null, 'chain-list-content', ['view-content']);
    const title = newEl('h2', 'Chain Lists');

    mainCon.append(title);
    return mainCon;
}

const newEl = (type, text = null, id = null, classes = []) => {
        const x = document.createElement(type);
        if (text !== null) x.textContent = text;
        if (id !== null) x.id = id;
        if (classes.length) { classes.forEach(c => x.classList.add(c)); }
        return x;
}