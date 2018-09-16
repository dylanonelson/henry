import { redo, undo } from 'prosemirror-history';
import { TextSelection } from 'prosemirror-state';

import { getEditorView, getEditorViewDom, isNodeType } from '../proseMirror';

let dialog = null;

function linkDialogIsOpen() {
  return dialog !== null;
}

/*
 * ProseMirror command that cuts the entire checklist node or nodes that are currently selected.
 *
 * @param {EditorState} state
 * @param {function} dispatch
 * @returns {boolean}
 */
function cutCurrentNodes(state, dispatch) {
  const { doc, selection, tr } = state;
  const { $from, $to } = selection;

  if (!isNodeType($from.parent, 'checklistItem') || !isNodeType($to.parent, 'checklistItem')) {
    return false;
  }

  if (!dispatch) {
    return true;
  }

  // The positions encompassing the start and end of the selected items
  const endpoints = [
    $from.start() - 1,
    $to.end() + 1,
  ].map(ep => (
    doc.resolve(ep)
  ));

  dispatch(tr.setSelection(new TextSelection(...endpoints)));

  document.execCommand('cut');

  return true;
}

export default () => {
  const EditorToolbar = customElements.get('editor-toolbar');
  const UrlDialog = customElements.get('url-dialog');
  const viewDom = getEditorViewDom();
  const view = getEditorView();

  function closeLinkDialog() {
    if (linkDialogIsOpen()) {
      document.body.removeChild(dialog);
      dialog = null;
    }
  }

  function openLinkDialog() {
    // If it's already open, bail out
    if (linkDialogIsOpen()) return;

    const { state } = view;
    const { selection } = state;
    const { schema } = state;
    // Make sure the selection is within a single checklistItem node
    if (
      selection.$from.end() !== selection.$to.end() ||
      selection.$to.start() !== selection.$from.start() ||
      selection.$from.parent.type.name !== 'checklistItem'
    ) {
      return;
    }

    let url = '';
    let nextFrom = selection.$from;
    let nextTo = selection.$to;

    if (selection.empty) {
      const { nodeAfter, nodeBefore } = selection.$from;
      if (nodeAfter && nodeAfter.marks.length) {
        nextFrom = view.state.doc.resolve(selection.from - selection.$from.textOffset);
        nextTo = view.state.doc.resolve(selection.from + nodeAfter.nodeSize);
        url = nodeAfter.marks[0].attrs.href;
      } else if (nodeBefore && nodeBefore.marks.length) {
        nextFrom = view.state.doc.resolve(selection.from - nodeBefore.nodeSize);
        nextTo = view.state.doc.resolve(nextFrom.pos + nodeBefore.nodeSize);
        url = nodeBefore.marks[0].attrs.href;
      }
    } else {
      const selectedMarks = selection.$from.marksAcross(selection.$to);
      if (selectedMarks && selectedMarks.length > 0) {
        const [firstMark] = selectedMarks;
        url = firstMark.attrs.href;

        const { nodeAfter } = selection.$to;
        if (nodeAfter && nodeAfter.marks.length) {
          nextTo = view.state.doc.resolve(selection.to + nodeAfter.nodeSize);
        }
        const { nodeBefore } = selection.$from;
        if (nodeBefore && nodeBefore.marks.length) {
          nextFrom = view.state.doc.resolve(selection.from - nodeBefore.nodeSize);
        }
      }
    }

    const tr = state.tr;
    tr.setSelection(new TextSelection(nextFrom, nextTo));
    view.dispatch(tr);

    const text = view.state.doc.textBetween(nextFrom.pos, nextTo.pos);

    const urlDialog = new UrlDialog({
      onCancel() {
        closeLinkDialog();
      },
      onOk({ text, url }) {
        const { link } = schema.marks;
        const mark = schema.mark(link, { href: url, title: text });
        const textNode = schema.text(text, [mark]);
        const tr = view.state.tr;
        tr.replaceWith(
          view.state.selection.from,
          view.state.selection.to,
          textNode
        );
        view.dispatch(tr);
        closeLinkDialog();
      },
      onRemove({ text }) {
        const textNode = schema.text(text);
        const tr = view.state.tr;
        tr.replaceWith(
          view.state.selection.from,
          view.state.selection.to,
          textNode
        );
        view.dispatch(tr);
        closeLinkDialog();
      },
      text,
      url,
    });

    dialog = urlDialog;
    document.body.appendChild(urlDialog);
  }

  function handleGlobalEvents(e) {
    if (linkDialogIsOpen()) return;
    const k = e.which === 75;
    const z = e.which === 90;
    const x = e.which === 88;
    const y = e.which === 89;
    const meta = e.getModifierState('Meta');
    const shift = e.getModifierState('Shift');
    if (z && meta) {
      undo(view.state, view.dispatch);
    } else if (y && meta) {
      redo(view.state, view.dispatch);
    } else if (meta && k) {
      openLinkDialog();
    } else if (meta && shift && x) {
      cutCurrentNodes(view.state, view.dispatch);
    }
  }

  const toolbar = new EditorToolbar({
    onConnected() {
      document.body.addEventListener('keydown', handleGlobalEvents);
    },
    onDisconnected() {
      document.body.removeEventListener('keydown', handleGlobalEvents);
    },
  });

  toolbar.addEventListener('undo', () => {
    undo(view.state, view.dispatch);
  });

  toolbar.addEventListener('redo', () => {
    redo(view.state, view.dispatch);
  });

  toolbar.addEventListener('link', openLinkDialog);

  toolbar.addEventListener('cut', () => {
    cutCurrentNodes(view.state, view.dispatch);
  });

  viewDom.toolbarContainer.appendChild(toolbar);
}
