import dropdownInit from './dropdownInit';
import firebaseInit from './firebaseInit';
import proseMirrorInit from './proseMirrorInit';
import routerInit from './routerInit';
import toolbarInit from './toolbarInit';
import webComponentsInit from './webComponentsInit';
import { fadeOutLoading } from 'loading';

export default () => {
  window.app = {};
  Promise.all([firebaseInit(), webComponentsInit()])
    .then(proseMirrorInit)
    .then(() => (
      Promise.all([dropdownInit(), toolbarInit(), routerInit()])
    ))
    .then(fadeOutLoading);
};
