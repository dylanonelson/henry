import * as firebase from 'firebase';

function getKeyValueTuple(obj) {
  if (!obj) {
    return [];
  }
  const [key] = Object.keys(obj);
  return [key, obj[key]];
}

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

export function readCurrentDocumentId() {
  return new Promise((resolve, reject) => {
    getUserPreferencesRef()
      .once('value', snapshot => {
        const value = snapshot.val();
        resolve(value && value.currentDocument);
      });
  });
}

export function readCurrentDocument() {
  return readCurrentDocumentId()
    .then(documentId => new Promise((resolve, reject) => {
      if (documentId) {
        getUserDocumentsRef(documentId).once('value', snapshot => {
          resolve(snapshot.val());
        });
      } else {
        resolve(null);
      }
    }));
}

export function writeNewDocument(editorState) {
  const ref = getUserDocumentsRef();
  const key = ref.push().key;
  const ts = Date.now();
  const data = {
    [key]: { createdTs: ts, id: key, snapshots: {} },
  };
  ref.update(data);

  return writeNewSnapshot(key, editorState).then(() => ([key, data]));
}

export function writeExistingDocument(documentId, editorState) {
  return readCurrentSnapshotId(documentId)
    .then(snapshotId => {
      const data = writeExistingSnapshot(documentId, snapshotId, editorState);
      return data;
    });
}

export function writeCurrentDocument(documentId) {
  getCurrentDocumentRef().set(documentId);
}

function getSnapshotsRef(documentId, snapshotId) {
  return firebase.database()
    .ref(`${getUserUid()}/documents/${documentId}/snapshots${snapshotId ? `/${snapshotId}`: ''}`)
}

function getCurrentSnapshotRef(documentId) {
  return firebase.database()
    .ref(`${getUserUid()}/documents/${documentId}/snapshots`)
    .orderByKey()
    .limitToLast(1);
}

export function readCurrentSnapshotId(documentId) {
  return new Promise((resolve, reject) => {
    getCurrentSnapshotRef(documentId).once('value', snapshot => {
      const value = snapshot.val();
      if (value) {
        const [key] = getKeyValueTuple(value);
        resolve(key);
      } else {
        resolve(null);
      }
    });
  });
}

export function readCurrentSnapshot() {
  return readCurrentDocumentId()
    .then(documentId => new Promise((resolve, reject) => {
      getCurrentSnapshotRef(documentId).once('value', snapshot => {
        const value = snapshot.val();
        resolve(value ? getKeyValueTuple(value) : null);
      });
    }));
}

export function writeNewSnapshot(documentId, document) {
  const ts = Date.now();

  // Update the lastModifiedTs of the previous snapshot
  return readCurrentSnapshotId(documentId)
    .then(snapshotId => {
      if (snapshotId) {
        writeExistingSnapshot(documentId, snapshotId, document, ts);
      }
    })
    .then(() => {
      // Write a new snapshot
      const key = getSnapshotsRef(documentId).push().key;
      const data = {
        [key]: {
          createdTs: ts,
          editorState: document,
          id: key,
          lastModifiedTs: ts,
        },
      };
      getSnapshotsRef(documentId).update(data);
      return [key, data];
    });
}

function writeExistingSnapshot(documentId, snapshotId, editorState, ts) {
  const lastModifiedTs = ts || Date.now();
  const data = { editorState, lastModifiedTs };
  getSnapshotsRef(documentId, snapshotId).update(data);
  return data;
}
