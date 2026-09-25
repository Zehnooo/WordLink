import { hideScreens, switchScreen } from './screens.js';
import { setNavButtons, setNavIcons } from './nav.js';
console.log('hello wall');

hideScreens();
switchScreen('home-screen');
setNavIcons();
setNavButtons();