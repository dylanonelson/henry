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

const worker = new PromiseWorker(1000);

function sendTransactionToFirebase(documentId, view) {
  const sendable = sendableSteps(view.state);

  if (sendable === null) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const nextTransactionId = NEXT_TRANSACTION_ID.value;

    persistence.getTransactionsRef(documentId).child(nextTransactionId).transaction(child => {
      if (child) {
        return;
      } else {
        // Recalculate the sendable based on the view’s current state
        const sendable = sendableSteps(view.state);
        return {
          clientID: sendable.clientID,
          id: nextTransactionId,
          steps: sendable.steps.map(step => step.toJSON()),
        };
      }
    }, (err, success, snapshot) => {
      if (err) {
        console.error('There was an error committing a ProseMirror transaction to Firebase:');
        throw err;
      }
      if (success) {
        if (
          nextTransactionId !== 0 &&
          nextTransactionId % UPDATE_CACHE_INTERVAL === 0
        ) {
          persistence.writeDocumentCache(documentId, nextTransactionId, view.state.toJSON());
        }
        resolve(sendable);
      } else {
        reject();
      }
    });
  });
}

function subscribeToTransactions(documentId, view) {
  persistence.getTransactionsRef(documentId)
    .orderByKey()
    .startAt(NEXT_TRANSACTION_ID.value.toString())
    .on('child_added', snapshot => {
      const value = snapshot.val();
      console.debug('new transaction from Firebase:', value);
      NEXT_TRANSACTION_ID.increment();
      const pmTransaction = receiveTransaction(
        view.state,
        value.steps.map(step => Step.fromJSON(view.state.schema, step)),
        value.steps.map(() => value.clientID),
      );
      view.dispatch(pmTransaction);
  });
}

const initialize = () => Promise.all([
  persistence.readCurrentDocumentCache(),
  persistence.readCurrentDocumentId(),
]).then(([documentCache, documentId]) =>
  new Promise((resolve, reject) => {
    const view = initializeEditorView();
    window.view = view;

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
          resolve(key);
          return key;
        })
        .then(key => {
          persistence.writeInitialTransaction(key);
          subscribeToTransactions(key, view);
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
