import * as persistence from '../persistence';
import {
  initializeEditorView,
  resetEditorState,
} from '../proseMirror';

const initialize = () => Promise.all([
  persistence.readCurrentSnapshot(),
  persistence.readCurrentDocumentId(),
]).then(([snapshotResult, documentId]) => new Promise((resolve, reject) => {
  const view = initializeEditorView();
  window.view = view;

  function setEditorDispatch(documentId) {
    view.setProps({
      dispatchTransaction(transaction) {
        const nextState = view.state.apply(transaction);
        view.updateState(nextState);
        persistence.writeExistingDocument(documentId, view.state.toJSON());
      },
    });
  }

  if (!documentId) {
    persistence.writeNewDocument(view.state.toJSON())
      .then(([key, data]) => {
        persistence.writeCurrentDocument(key);
        setEditorDispatch(key);
        resolve(view);
      })
  } else {
    const doc = snapshotResult[1].editorState;
    resetEditorState(doc);
    setEditorDispatch(documentId);
    resolve(view);
  }
}));

export default initialize;
