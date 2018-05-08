import { Step } from 'prosemirror-transform';
import { receiveTransaction, sendableSteps } from 'prosemirror-collab';

import * as persistence from '../persistence';
import { PromiseWorker } from '../util';
import {
  initializeEditorView,
  resetEditorState,
} from '../proseMirror';

const UPDATE_CACHE_INTERVAL = 50;

class NextBatchId {
  constructor(initial = 0) {
    this._value = initial;
  }

  get value() {
    return this._value;
  }

  set value(_value) {
    if (typeof _value === 'number') {
      this._value = _value;
    }
  }

  increment() {
    this.value += 1;
  }
}

const NEXT_BATCH_ID = new NextBatchId();

const worker = new PromiseWorker(1000);

function sendStepsToFirebase(documentId, view) {
  const sendable = sendableSteps(view.state);

  if (sendable === null) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const nextBatchId = NEXT_BATCH_ID.value;

    persistence.getStepBatchesRef(documentId).child(nextBatchId).transaction(child => {
      if (child) {
        return;
      } else {
        // Recalculate the sendable based on the view’s current state
        const sendable = sendableSteps(view.state);
        return {
          clientID: sendable.clientID,
          id: nextBatchId,
          steps: sendable.steps.map(step => step.toJSON()),
        };
      }
    }, (err, success, snapshot) => {
      if (err) {
        console.error('There was an error committing a ProseMirror transaction to Firebase:');
        throw err;
      }
      if (success) {
        if (nextBatchId % UPDATE_CACHE_INTERVAL === 0) {
          persistence.writeDocumentCache(documentId, nextBatchId, view.state.toJSON());
        }
        resolve(sendable);
      } else {
        reject();
      }
    });
  });
}

function subscribeToSteps(documentId, view) {
  persistence.getStepBatchesRef(documentId)
    .orderByKey()
    .startAt(NEXT_BATCH_ID.value.toString())
    .on('child_added', snapshot => {
      const value = snapshot.val();
      console.debug('new steps child:', value);
      NEXT_BATCH_ID.increment();
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

    if (documentCache && documentCache.lastStepId) {
      NEXT_BATCH_ID.value = documentCache.lastStepId + 1;
    }

    function setEditorDispatch(documentId) {
      view.setProps({
        dispatchTransaction(transaction) {
          const nextState = view.state.apply(transaction);
          view.updateState(nextState);
          persistence.writeExistingDocument(documentId, view.state.toJSON());

          // Collab
          if (worker.isWorking() === false) {
            worker.resolve(() => sendStepsToFirebase(documentId, view));
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
          persistence.writeInitialStep(key);
          subscribeToSteps(key, view);
        });
    } else {
      const doc = documentCache.editorState;
      resetEditorState(doc);
      setEditorDispatch(documentId);
      subscribeToSteps(documentId, view);
      resolve(view);
    }
}));

export default initialize;
