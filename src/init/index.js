import initializeProseMirror from './proseMirrorInit';
import initializeRedux from './reduxInit';

export default () => {
  initializeProseMirror({ store: initializeRedux() });
};
