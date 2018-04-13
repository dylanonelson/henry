import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { baseKeymap } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

const initialize = ({ dispatchTransaction }) => {
  const schema = new Schema({
    nodes: {
      // checkbox: {
      //   inline: true,
      //   toDOM(node) {
      //     return ;
      //   },
      // },
      checklistItem: {
        attrs: {
          itemId: {
            default: null,
          },
        },
        content: 'text*',
      },
      doc: {
        content: 'checklistItem+',
      },
      text: {
        inline: true,
      },
    },
  });

  const state = EditorState.create({
    plugins: [
      keymap(baseKeymap),
    ],
    schema,
  });

  const view = new EditorView(
    document.querySelector('#editor'),
    {
      dispatchTransaction: transaction => {
        dispatchTransaction(transaction, view);
      },
      nodeViews: {
        checklistItem: (node, editorView, getPos) => {
          const dom = document.createElement('div');
          dom.classList.add('checklist-item');
          const contentDOM = document.createElement('span');
          contentDOM.classList.add('checklist-content');
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.classList.add('checkbox');

          dom.appendChild(checkbox);
          dom.appendChild(contentDOM);

          return {
            contentDOM,
            dom,
          };
        },
      },
      state,
    },
  );

  window.view = view;

  return view;
};

export default initialize;
