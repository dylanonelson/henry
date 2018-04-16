import { handleActions } from 'redux-actions';
import { dispatchTransaction } from './actions';

const reducerMap = {
  [dispatchTransaction]: (previous = {}, action) => {
    const { payload: { transaction, view } } = action;
    const editorState = view.state.apply(transaction);

    return Object.assign({}, previous, {
      editorState,
    });
  },
};

const initialState = {};

export default handleActions(reducerMap, initialState);
