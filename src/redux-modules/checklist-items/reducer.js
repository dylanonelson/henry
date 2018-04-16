import { handleActions } from 'redux-actions';
import { actions as proseMirrorActions } from '../proseMirror';

const reducerMap = {
  [proseMirrorActions.dispatchTransaction]: (previous = {}, action) => {
    return previous;
  },
};

const initialState = {};


export default handleActions(reducerMap, initialState);
