import * as firebase from 'firebase';

function getUserUid() {
  return firebase.auth().currentUser.uid;
}

function getUserPreferencesRef() {
  return firebase.database()
    .ref(`${getUserUid()}/preferences`)
}

function getCurrentDocumentRef() {
  return firebase.database()
    .ref(`${getUserUid()}/preferences/currentDocument`);
}

function getUserDocumentsRef(documentId) {
  return firebase.database()
    .ref(`${getUserUid()}/documents${documentId ? `/${documentId}` : ''}`);
}

export function readCurrentDocument(func) {
  getUserPreferencesRef()
    .once('value', preferencesSnapshot => {
      const preferences = preferencesSnapshot.val();
      if (!preferences || !preferences.currentDocument) {
        return func(null);
      }
      getUserDocumentsRef(preferences.currentDocument)
        .once('value', documentSnapshot => {
          func([preferences.currentDocument, documentSnapshot.val()]);
        })
    });
}

export function writeNewDocument(editorState) {
  const ref = getUserDocumentsRef();
  const key = ref.push().key;
  const ts = Date.now();
  const data = {
    [key]: { editorState, ts },
  };
  ref.update(data);
  return [key, data];
}

export function writeExistingDocument(documentId, editorState) {
  const ref = getUserDocumentsRef(documentId);
  const ts = Date.now();
  ref.update({ editorState, ts });
}

export function writeCurrentDocument(documentId) {
  getCurrentDocumentRef().set(documentId);
}

function getSnapshotsRef(documentId) {
  return firebase.database()
    .ref(`${getUserUid()}/documents/${documentId}/snapshots`)
}

export function writeSnapshot(documentId, document) {
  const ref = getSnapshotsRef(documentId);
  const key = ref.push().key;
  const ts = Date.now();
  const data = {
    [key]: { document, ts },
  };
  ref.update(data);
  return [key, data];
}
