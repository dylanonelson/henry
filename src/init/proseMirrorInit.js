import { EditorState, TextSelection } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { baseKeymap } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

const cidFactory = () => {
  let factory = null;

  const getter = () => {
    if (factory !== null) {
      return factory;
    }

    let counter = 0;
    const createCid = () => {
      const nextId = `c${counter}`;
      counter += 1;
      return nextId;
    }

    factory = {
      createCid,
    };

    return factory;
  };

  return getter();
};

function isNodeType(node, typeName) {
  return (
    (node &&
    typeof typeName === 'string' &&
    node.type.name === typeName) ||
  false);
}

const initialize = ({ dispatchTransaction }) => {
  const schema = new Schema({
    nodes: {
      checklistItem: {
        attrs: {
          itemId: {
            default: cidFactory().createCid(),
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
      keymap(Object.assign({}, baseKeymap, {
        Enter: (...args) => {
          const [state, dispatch] = args;
          const { $from } = state.selection;
          const { parent } = $from;

          if (isNodeType(parent, 'checklistItem') === false) {
            return baseKeymap.Enter(...args);
          }

          const { selection, tr } = state;

          if (selection instanceof TextSelection) {
            tr.deleteSelection()
          }

          const itemId = cidFactory().createCid();

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
        dispatchTransaction(transaction, view);
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

  window.view = view;

  return view;
};

export default initialize;
