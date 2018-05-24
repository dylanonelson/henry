import { redo, undo } from 'prosemirror-history';
import { TextSelection } from 'prosemirror-state';

import { getEditorView, getEditorViewDom } from '../proseMirror';

export default () => {
  const EditorToolbar = customElements.get('editor-toolbar');
  const toolbar = new EditorToolbar();
  const viewDom = getEditorViewDom();
  const view = getEditorView();

  toolbar.addEventListener('undo', () => {
    undo(view.state, view.dispatch);
  });

  toolbar.addEventListener('redo', () => {
    redo(view.state, view.dispatch);
  });

  toolbar.addEventListener('link', () => {
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

    const UrlDialog = customElements.get('url-dialog');
    const urlDialog = new UrlDialog({
      onCancel() {
        document.body.removeChild(urlDialog);
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
        document.body.removeChild(urlDialog);
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
        document.body.removeChild(urlDialog);
      },
      text,
      url,
    });

    document.body.appendChild(urlDialog);
  });

  viewDom.toolbarContainer.appendChild(toolbar);
}
