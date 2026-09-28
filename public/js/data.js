
// list data './mock-data/lists.json'

export const loadData = async (reference) => {
    try {
        const res = await fetch(reference);
        if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
        const data = await res.json();
        if (!data) console.error('failed to load data');
        return data;
    } catch (err) {
        console.error(err);
    }
}