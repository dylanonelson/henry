import firebaseInit from './firebaseInit';
import proseMirrorInit from './proseMirrorInit';
import webComponentsInit from './webComponentsInit';
import dropdownInit from './dropdownInit';

export default () => {
  firebaseInit()
    .then(webComponentsInit)
    .then(proseMirrorInit)
    .then(dropdownInit);
};
