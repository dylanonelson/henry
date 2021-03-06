import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

import * as persistence from '../persistence';
import { transformObjectPrototypes } from '../util';
import {
  NEXT_TRANSACTION_ID,
  autofillTitle,
  getEditorView,
  getEditorViewDom,
  autofillSnapshot,
} from '../proseMirror';
import { getRouter } from '../routes';

export default () => {
  const pmEditor = getEditorViewDom();
  const menu = document.createElement('dropdown-menu');

  menu.addEventListener('all-snapshots', () => {
    getRouter().navigate('./snapshots');
  });

  menu.addEventListener('new-snapshot', () => {
    persistence.readDatabaseConnection().then(connected => {
      if (connected === false) {
        return Promise.reject(
          new Error('Cannot create new snapshot when offline')
        );
      }
      return persistence.readCurrentDocumentId();
    }).then(documentId => {
      return persistence.writeNewSnapshot(
        documentId,
        NEXT_TRANSACTION_ID.value,
        transformObjectPrototypes(getEditorView().state.toJSON())
      )
      .then(autofillSnapshot)
      .then(menu.close);
    }).catch(menu.close);
  });

  menu.addEventListener('autofill-title', () => {
    autofillTitle();
    menu.close();
  });

  menu.addEventListener('sign-out', () => {
    firebase.auth().signOut();
    window.location.reload();
  });

  pmEditor.dropdownContainer.appendChild(menu);
};
