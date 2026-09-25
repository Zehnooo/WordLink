
export const errorView = () => {
    const mainCon = newEl('div', null, 'error-content', ['view-content']);
    const title = newEl('h2', 'Error');
    const p = newEl('p', 'Failed to load content. Please try again.');
    mainCon.append(title, p);
    return mainCon;
}

export const newEl = (type, text = null, id = null, classes = []) => {
        const x = document.createElement(type);
        if (text !== null) x.textContent = text;
        if (id !== null) x.id = id;
        if (classes.length) { classes.forEach(c => x.classList.add(c)); }
        return x;
}