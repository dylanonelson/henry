export function getLoadingDom() {
  return document.querySelector('#loading');
}

export function fadeOutLoading() {
  const dom = getLoadingDom();
  dom.classList.add('fade');
  setTimeout(() => {
    dom.classList.remove('active');
  }, 500);
}
