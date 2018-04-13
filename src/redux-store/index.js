import createSagaMiddleware from 'redux-saga';
import { applyMiddleware, compose, createStore } from 'redux';

import initialState from './initialState';
import reducer from './reducer';

export default () => {
  let store = null;

  const inner = () => {
    if (store !== null) {
      return store;
    }

    const sagaMiddleware = createSagaMiddleware();

    const middleware = applyMiddleware(
      sagaMiddleware
    );

    const composeEnhancers =
      window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose; // eslint-disable-line

    store = createStore(reducer, initialState, composeEnhancers(middleware));

    return store;
  };

  return inner();
};
