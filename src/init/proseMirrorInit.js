import * as persistence from '../persistence';
import {
  initializeEditorView,
  resetEditorState,
} from '../proseMirror';

const initialize = () => new Promise((resolve, reject) => {
  persistence.readCurrentDocument(result => {
    const view = initializeEditorView();

    let documentId;

    if (result === null) {
      documentId = persistence.writeNewDocument(view.state.toJSON())[0];
      persistence.writeCurrentDocument(documentId);
    } else {
      documentId = result[0];
      const doc = result[1].editorState;
      resetEditorState(doc);
    }

    view.setProps({
      dispatchTransaction(transaction) {
        const nextState = view.state.apply(transaction);
        view.updateState(nextState);
        persistence.writeExistingDocument(documentId, view.state.toJSON());
      },
    });

    window.view = view;

    resolve(view);
  });
});

export default initialize;
