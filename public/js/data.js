

export const loadData = async () => {
    try {
        const res = await fetch('./mock-data/lists.json');
        if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
        const data = await res.json();
        if (!data) console.error('failed to load data');
        return data;
    } catch (err) {
        console.error(err);
    }
}