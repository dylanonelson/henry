import * as firebase from 'firebase';
import { getKeyValueTuple } from '../util';

export function getConnectionRef() {
  return firebase.database().ref('.info/connected');
}

export function readDatabaseConnection() {
  return new Promise((resolve, reject) => {
    getConnectionRef().once('value', snapshot => (
      resolve(snapshot.val())
    ))
  });
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

function getDocumentCacheRef(documentId) {
  return firebase.database()
    .ref(`${getUserUid()}/documents/${documentId}/documentCache`)
}

function getUserDocumentsRef(documentId) {
  return firebase.database()
    .ref(`${getUserUid()}/documents${documentId ? `/${documentId}` : ''}`);
}

function getDocumentSnapshotsRef(documentId) {
  return firebase.database()
    .ref(`${getUserUid()}/documents/${documentId}/snapshots`);
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

export function readDocumentSnapshots() {
  return readCurrentDocumentId()
    .then(documentId => new Promise((resolve, reject) => (
      getDocumentSnapshotsRef(documentId)
        .orderByKey()
        .limitToLast(25)
        .once('value', snapshot => resolve(snapshot.val()))
    )));
}

export function readCurrentDocumentCache() {
  return readCurrentDocumentId()
    .then(documentId => new Promise((resolve, reject) => {
      getDocumentCacheRef(documentId).once('value', snapshot => {
        resolve(snapshot.val());
      });
    }));
}

export function writeDocumentCache(documentId, lastTransactionId, editorState) {
  return getDocumentCacheRef(documentId).set({
    editorState,
    lastTransactionId,
  });
}

export function writeNewDocument(editorState) {
  const ref = getUserDocumentsRef();
  const key = ref.push().key;
  const ts = Date.now();
  const initialDocument = {
    editorState,
    lastTransactionId: -1,
  };
  const data = {
    [key]: {
      createdTs: ts,
      currentTransactionId: -1,
      documentCache: initialDocument,
      id: key,
      initialDocument,
      snapshots: {},
      transactions: {},
    },
  };

  ref.update(data);

  return writeNewSnapshot(key, -1, editorState).then(() => ([key, data]));
}

export function writeExistingDocument(documentId, editorState) {
  return readCurrentSnapshotId(documentId)
    .then(snapshotId => {
      const data = writeExistingSnapshot(documentId, snapshotId, { editorState });
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

export function readSnapshot(documentId, snapshotId) {
  return new Promise((resolve) => {
    getSnapshotsRef(documentId, snapshotId)
      .once('value', snapshot => {
        const value = snapshot.val();
        resolve(value);
      });
  });
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

export function getCurrentTransactionIdRef(documentId) {
  return getUserDocumentsRef(documentId).child('currentTransactionId');
}

export function writeCurrentTransactionId(documentId, transactionId) {
  return getCurrentTransactionIdRef(documentId).set(transactionId);
}

function getTitle(json) {
  try {
    const titleNode = json.doc.content.find(node => node.type === 'title');
    return titleNode.content
      .map(node => (node.type === 'text' && node.text) || '')
      .join('');
  } catch (e) {
    // Don't make this a blocking step
    return '';
  }
}

export function writeNewSnapshot(documentId, firstTransactionId, doc) {
  const ts = Date.now();
  const title = getTitle(doc);

  // Update the lastModifiedTs of the previous snapshot
  return readCurrentSnapshotId(documentId)
    .then(snapshotId => {
      if (snapshotId) {
        writeExistingSnapshot(
          documentId,
          snapshotId,
          {
            doc,
            lastModifiedTs: ts,
            lastTransactionId: firstTransactionId - 1,
            title,
          },
        );
      }
    })
    .then(() => {
      // Write a new snapshot
      const key = getSnapshotsRef(documentId).push().key;
      const data = {
        [key]: {
          createdTs: ts,
          editorState: doc,
          firstTransactionId,
          id: key,
          lastModifiedTs: ts,
        },
      };
      getSnapshotsRef(documentId).update(data);
      return [key, data];
    });
}

function writeExistingSnapshot(documentId, snapshotId, snapshotData) {
  const defaults = { lastModifiedTs: Date.now() };
  const data = Object.assign({}, defaults, snapshotData);
  getSnapshotsRef(documentId, snapshotId).update(data);
  return data;
}

export function getTransactionsRef(documentId) {
  return firebase.database()
    .ref(`${getUserUid()}/documents/${documentId}/transactions`);
}

export function readLatestTransaction() {
  return readCurrentDocumentId()
    .then(documentId => new Promise((resolve, reject) => {
      return getTransactionsRef(documentId)
        .orderByKey()
        .limitToLast(1)
        .once('value', snapshot => resolve(snapshot.val()));
    }));
}

export function writeInitialTransaction(documentId) {
  getTransactionsRef(documentId)
    .child('-1')
    .set({ steps: [] });
}
