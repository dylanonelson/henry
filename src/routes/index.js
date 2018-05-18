import Navigo from 'navigo';

let router = null;

export function initializeRouter() {
  if (router !== null) {
    return router;
  }
  router = new Navigo();
  return router;
}

export function getRouter() {
  if (router === null) {
    throw new Error('The router hasn\'t been initialized yet');
  }

  return router;
}

function getRoot() {
  return document.querySelector('#app');
}

export function setContent(dom) {
  const { children } = getRoot();
  for (let idx = 0; idx < children.length; idx++) {
    const child = children[idx];
    child.remove();
  }
  getRoot().appendChild(dom);
}
