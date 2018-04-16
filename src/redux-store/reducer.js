import { combineReducers } from 'redux';
import reduceReducers from 'reduce-reducers';
import checklistItems from '../redux-modules/checklistItems';
import proseMirror from '../redux-modules/proseMirror';

import rootReducer from './root';

const compositeReducer = combineReducers({
  checklistItems,
  proseMirror,
});

export default reduceReducers(
  rootReducer,
  compositeReducer,
);
