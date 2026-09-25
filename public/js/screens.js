
export const changeScreen = (screen) => {
    document.querySelectorAll('.screen').forEach(screen => screen.setAttribute("hidden", "hidden"));
    document.querySelector(`#${screen}`).removeAttribute("hidden");
}