import * as firebase from 'firebase';

import * as persistence from '../persistence';
import { getEditorView, getEditorViewDom, filterInactiveItems } from '../proseMirror';
import { getRouter } from '../routes';

export default () => {
  const pmEditor = getEditorViewDom();
  const menu = document.createElement('dropdown-menu');

  menu.addEventListener('all-snapshots', () => {
    getRouter().navigate('./snapshots');
  });

  menu.addEventListener('new-snapshot', () => {
    persistence.readCurrentDocumentId().then(documentId => {
      const view = getEditorView();
      persistence.writeNewSnapshot(documentId, view.state.toJSON());
      filterInactiveItems();
      menu.close();
    });
  });

  menu.addEventListener('sign-out', () => {
    firebase.auth().signOut();
    window.location.reload();
  });

  pmEditor.dropdownContainer.appendChild(menu);
};
