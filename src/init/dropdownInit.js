import * as firebase from 'firebase';

import * as persistence from '../persistence';
import { getEditorView, filterInactiveItems } from '../proseMirror';

export default () => {
  const menu = document.createElement('dropdown-menu');

  menu.addEventListener('new-snapshot', () => {
    persistence.readCurrentDocument(result => {
      const view = getEditorView();
      const [documentId] = result;
      persistence.writeSnapshot(documentId, view.state.toJSON());
      filterInactiveItems();
      menu.close();
    });
  });

  menu.addEventListener('sign-out', () => {
    firebase.auth().signOut();
    window.location.reload();
  });

  document.querySelector('#dropdown').appendChild(menu);
};
