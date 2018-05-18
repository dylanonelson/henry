import dropdownInit from './dropdownInit';
import firebaseInit from './firebaseInit';
import proseMirrorInit from './proseMirrorInit';
import routerInit from './routerInit';
import webComponentsInit from './webComponentsInit';
import { fadeOutLoading } from 'loading';

export default () => {
  Promise.all([firebaseInit(), webComponentsInit()])
    .then(proseMirrorInit)
    .then(dropdownInit)
    .then(routerInit)
    .then(fadeOutLoading);
};
