import { combineReducers } from 'redux';
import reduceReducers from 'reduce-reducers';

import checklistItems from '../reduxModules/checklistItems';
import proseMirror from '../reduxModules/proseMirror';

import rootReducer from './root';

const compositeReducer = combineReducers({
  checklistItems,
  proseMirror,
});

export default reduceReducers(
  rootReducer,
  compositeReducer,
);
