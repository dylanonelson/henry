import firebaseInit from './firebaseInit';
import proseMirrorInit from './proseMirrorInit';
import webComponentsInit from './webComponentsInit';

export default () => {
  firebaseInit()
    .then(webComponentsInit)
    .then(proseMirrorInit);
};
