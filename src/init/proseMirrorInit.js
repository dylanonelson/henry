import { EditorState, TextSelection } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { baseKeymap } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

import { actions as proseMirrorActions } from '../redux-modules/proseMirror';
import { actions as checklistItemActions } from '../redux-modules/checklistItems';
import { cidFactory, isNodeType } from '../util';

const initialize = ({ store }) => {
  const schema = new Schema({
    nodes: {
      checklistItem: {
        attrs: {
          itemId: {
            default: cidFactory.createCid(),
          },
        },
        content: 'text*',
      },
      doc: {
        content: 'checklistItem*',
      },
      text: {
        inline: true,
      },
    },
  });

  function generateInitialItem() {
    const itemId = cidFactory.createCid();
    store.dispatch(checklistItemActions.createNew(itemId));
    return schema.nodes.checklistItem.create({ itemId }, schema.text(' '));
  }

  const state = EditorState.create({
    doc: schema.nodes.doc.create({}, [generateInitialItem()]),
    plugins: [
      keymap(Object.assign({}, baseKeymap, {
        Enter: (...args) => {
          const [state, dispatch] = args;
          const { selection, tr } = state;
          const { $from } = selection;
          const { parent } = $from;

          if (isNodeType(parent, 'checklistItem') === false) {
            return baseKeymap.Enter(...args);
          }

          if (selection instanceof TextSelection) {
            tr.deleteSelection()
          }

          const itemId = cidFactory.createCid();

          store.dispatch(checklistItemActions.createNew(itemId));

          tr.split($from.pos, 1, [{
            attrs: { itemId },
            type: schema.nodes.checklistItem,
          }]);

          dispatch(tr);

          return true;
        },
      })),
    ],
    schema,
  });

  const view = new EditorView(
    document.querySelector('#editor'),
    {
      decorations: state => {
        let decorations = [];
        state.doc.descendants((node, pos) => {
          if (node.type.name === 'checklistItem') {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('checkbox');

            decorations.push(
              new Decoration.widget(pos, checkbox)
            );

            return false;
          }
        });

        return DecorationSet.create(state.doc, decorations);
      },
      dispatchTransaction: transaction => {
        const action =
          proseMirrorActions.dispatchTransaction(transaction, view);
        store.dispatch(action);
      },
      nodeViews: {
        checklistItem: (node, editorView, getPos) => {
          const dom = document.createElement('div');
          dom.classList.add('checklist-item');
          const contentDOM = document.createElement('span');
          contentDOM.classList.add('checklist-content');

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

  store.subscribe(() => {
    const nextState = store.getState().proseMirror.editorState;

    if (nextState && view.state !== nextState) {
      view.updateState(nextState);
    }
  });

  window.view = view;

  return view;
};

export default initialize;
