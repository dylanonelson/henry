import dropdownInit from './dropdownInit';
import firebaseInit from './firebaseInit';
import proseMirrorInit from './proseMirrorInit';
import routerInit from './routerInit';
import webComponentsInit from './webComponentsInit';

export default () => {
  firebaseInit()
    .then(webComponentsInit)
    .then(proseMirrorInit)
    .then(dropdownInit)
    .then(routerInit);
};
