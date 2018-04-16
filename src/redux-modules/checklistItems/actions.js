import { createAction } from 'redux-actions';

const CREATE_NEW = 'checklistItems/CREATE_NEW';

export const createNew = createAction(CREATE_NEW, itemId => ({ itemId }));
