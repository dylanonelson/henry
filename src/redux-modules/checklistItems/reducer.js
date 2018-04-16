import { handleActions } from 'redux-actions';

import itemStatuses from './itemStatuses';
import { createNew } from './actions';

const reducerMap = {
  [createNew]: (previous = {}, action) => {
    const { itemId } = action.payload;

    return Object.assign({}, previous, {
      [itemId]: {
        itemId,
        status: itemStatuses.CREATED.id,
      },
    });
  },
};

const initialState = {};


export default handleActions(reducerMap, initialState);
