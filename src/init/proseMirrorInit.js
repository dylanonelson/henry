import { Step } from 'prosemirror-transform';
import { receiveTransaction, sendableSteps } from 'prosemirror-collab';

import * as persistence from '../persistence';
import { PromiseWorker } from '../util';
import {
  NEXT_TRANSACTION_ID,
  initializeEditorView,
  resetEditorState,
} from '../proseMirror';

const UPDATE_CACHE_INTERVAL = 50;

/**
 * Send uncommitted transactions to Firebase
 *
 * @param {number} documentId
 * @param {EditorView} view
 * @returns {Promise}
 */
function sendTransactionToFirebase(documentId, view) {
  const sendable = sendableSteps(view.state);

  if (sendable === null) {
    return Promise.resolve();
  }

  return persistence.readDatabaseConnection()
    .then(isConnected => new Promise((resolve, reject) => {
      const nextTransactionId = NEXT_TRANSACTION_ID.value;
      console.debug(`attempting to save a new transaction at id ${nextTransactionId}`);

      if (isConnected === false) {
        return reject(new Error('Firebase is offline'));
      }

      persistence.getTransactionsRef(documentId).child(nextTransactionId).transaction(child => {
        if (child) {
          return;
        }

        return {
          clientID: sendable.clientID,
          id: nextTransactionId,
          steps: sendable.steps.map(step => step.toJSON()),
        };
      }, (err, success, snapshot) => {
        if (err) {
          console.error(`There was an error committing a ProseMirror transaction to Firebase: ${err}`);
          return reject(err);
        }
        if (success) {
          if (
            nextTransactionId !== 0 &&
            nextTransactionId % UPDATE_CACHE_INTERVAL === 0
          ) {
            persistence.writeDocumentCache(
              documentId,
              nextTransactionId,
              view.state.toJSON(),
            );
          }
          receiveFirebaseTransaction(view, snapshot.val());
          persistence.writeCurrentTransactionId(documentId, snapshot.val().id);
          return resolve(snapshot);
        }

        return reject(new Error(
          `There was an error committing transaction to firebase at id ${nextTransactionId}`,
        ));
      });
    }));
}

function receiveFirebaseTransaction(view, transaction) {
  console.debug('new transaction from Firebase:', transaction);
  NEXT_TRANSACTION_ID.value = transaction.id + 1;
  const pmTransaction = receiveTransaction(
    view.state,
    transaction.steps.map(step => Step.fromJSON(view.state.schema, step)),
    transaction.steps.map(() => transaction.clientID),
  );
  view.dispatch(pmTransaction);
}

function subscribeToTransactions(documentId, view) {
  persistence.getCurrentTransactionIdRef(documentId)
    .on('value', snapshot => {
      const transactionId = snapshot.val();
      if (transactionId !== (NEXT_TRANSACTION_ID.value - 1)) {
        persistence.getTransactionsRef(documentId)
          .orderByChild('id')
          .startAt(NEXT_TRANSACTION_ID.value)
          .once('value', snapshots => {
            snapshots.forEach(snapshot => {
              receiveFirebaseTransaction(view, snapshot.val());
            });
          });
      }
    });
}

const initialize = () => Promise.all([
  persistence.readCurrentDocumentCache(),
  persistence.readCurrentDocumentId(),
]).then(([documentCache, documentId]) =>
  new Promise((resolve, reject) => {
    const view = window.app.view = initializeEditorView();
    const worker = window.app.worker = new PromiseWorker(1000);

    if (documentCache && documentCache.lastTransactionId) {
      NEXT_TRANSACTION_ID.value = documentCache.lastTransactionId + 1;
    }

    function setEditorDispatch(documentId) {
      view.setProps({
        dispatchTransaction(transaction) {
          const nextState = view.state.apply(transaction);
          view.updateState(nextState);
          persistence.writeExistingDocument(documentId, view.state.toJSON());

          // Collab
          if (worker.isWorking() === false) {
            worker.resolve(() => sendTransactionToFirebase(documentId, view));
          }
        },
      });
    }

    if (!documentId) {
      persistence.writeNewDocument(view.state.toJSON())
        .then(([key, data]) => {
          persistence.writeCurrentDocument(key);
          setEditorDispatch(key);
          return key;
        })
        .then(key => {
          persistence.writeInitialTransaction(key);
          subscribeToTransactions(key, view);
          resolve(key);
        });
    } else {
      const doc = documentCache.editorState;
      resetEditorState(doc);
      setEditorDispatch(documentId);
      subscribeToTransactions(documentId, view);
      resolve(view);
    }
}));

export default initialize;
