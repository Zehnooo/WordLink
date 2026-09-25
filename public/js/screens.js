
export const hideScreens = () => {
    document.querySelectorAll('.screen').forEach(screen => screen.setAttribute("hidden", "hidden"));
}

export const switchScreen = (screen) => {
    document.querySelector(`#${screen}`).removeAttribute("hidden");
}