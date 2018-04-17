import { createAction } from 'redux-actions';

const DISPATCH_TRANSACTION = 'proseMirror/DISPATCH_TRANSACTION';

export const dispatchTransaction = createAction(DISPATCH_TRANSACTION, (transaction, view) => {
  return {
    transaction,
    view,
  };
});
