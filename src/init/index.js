import initializeProseMirror from './proseMirrorInit';
import initializeRedux from './reduxInit';

import { actions as proseMirrorActions } from '../redux-modules/proseMirror';

export default () => {
  const { dispatchTransaction } = proseMirrorActions;
  const store = initializeRedux();

  const view = initializeProseMirror({
    dispatchTransaction: (transaction, view) => {
      const action = dispatchTransaction(transaction, view);
      store.dispatch(action);
    },
  });

  store.subscribe(() => {
    const nextState = store.getState().proseMirror.editorState;

    if (view.state !== nextState) {
      view.updateState(nextState);
    }
  });
};
