
export const errorView = () => {
    const el = newEl('div', null, 'error-content', ['view-content']);
    el.append(newEl('h2', 'Error'), newEl('p', 'Failed to load content. Please try again.'));
    return { success: true, message: 'Failed to load page, redirecting to error view', view: 'error', el };
}

export const newEl = (type, text = null, id = null, classes = []) => {
        const x = document.createElement(type);
        if (text !== null) x.textContent = text;
        if (id !== null) x.id = id;
        if (classes.length) { classes.forEach(c => x.classList.add(c)); }
        return x;
}