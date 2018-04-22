import { EditorState, Plugin, Selection } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { baseKeymap } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

import * as persistence from '../persistence';
import { itemStatuses } from '../util';

function isNodeType(node, typeName) {
  return node.type.name === typeName;
}

const initialize = () => {
  const schema = new Schema({
    nodes: {
      checklist: {
        content: 'checklistItem+',
        toDOM(node) {
          return [
            'div',
            {
              'class': 'checklist',
            },
            0,
          ];
        },
      },
      checklistItem: {
        attrs: {
          status: {
            default: itemStatuses.ACTIVE.id,
          },
        },
        content: 'text*',
        draggable: true,
        placeholder: 'New item...',
      },
      doc: {
        content: 'title checklist',
      },
      text: {
        inline: true,
      },
      title: {
        content: 'text*',
        placeholder: 'Title',
        toDOM(node) {
          return [
            'h2',
            {
              'class': 'title',
            },
            0,
          ];
        },
      },
    },
  });

  const plugins = [
    keymap(Object.assign({}, baseKeymap, {
      Enter: (...args) => {
        const [state, dispatch] = args;
        const { selection, tr } = state;

        const currentNode = selection.$from.parent;

        if (isNodeType(currentNode, 'checklistItem')) {

          if (selection.empty === false) {
            tr.deleteSelection();
          }

          tr.split(selection.from, 1, [{
            attrs: currentNode.attrs,
            type: schema.nodes.checklistItem,
          }]);

          const pos = selection.from;
          const $pos = tr.doc.resolve(pos);
          // This will be the first node that we split
          const node = $pos.parent;

          // If it is the first item & it's empty, make it active
          if ($pos.index($pos.depth - 1) === 0 && node.content.size === 0) {
            tr.replaceWith(
              pos - 1,
              pos + 1,
              schema.nodes.checklistItem.create(),
            );
          }

          return dispatch(tr);
        }

        if (isNodeType(currentNode, 'title')) {
          const pos = selection.from;
          const $pos = tr.doc.resolve(pos);

          if (selection.empty && pos === $pos.end()) {
            // Add 2: 1 to leave title node and 1 to enter checklist node
            const nextPos = pos + 2;
            tr.insert(nextPos, schema.nodes.checklistItem.create());
            // Set selection inside new checklist item
            const $nextPos = tr.doc.resolve(nextPos);
            tr.setSelection(Selection.findFrom($nextPos, 1));
          }

          return dispatch(tr);
        }

        return baseKeymap.Enter(...args);
      },
    })),
    // Add [selected=true]
    new Plugin({
      props: {
        decorations: state => {
          let decorations = []
          const { doc, selection } = state;

          if (selection.empty && selection.anchor !== 0) {
            const $pos = doc.resolve(selection.anchor);
            decorations = [
              Decoration.node($pos.start() - 1, $pos.end() + 1, { selected: true }),
            ];
          }

          return DecorationSet.create(doc, decorations);
        },
      },
    }),
    // Add [data-placeholder]
    new Plugin({
      props: {
        decorations: state => {
          let decorations = [];
          const { doc } = state;
          doc.descendants((node, pos, parent) => {
            const $pos = doc.resolve(pos);
            if (
              node.isTextblock &&
              $pos.parentOffset === 0 &&
              node.content.size === 0 && (
                // Either this is the last child, or the child after it
                // is of a different type
                parent.lastChild.eq(node) ||
                parent.childAfter(pos + node.nodeSize).node.type !== node.type
              )
            ) {
              decorations.push(Decoration.node(pos, pos + node.nodeSize, {
                'data-placeholder': node.type.spec.placeholder,
              }));
            }
          });

          return DecorationSet.create(doc, decorations);
        },
      },
    }),
  ];

  const state = EditorState.create({
    plugins,
    schema,
  });

  const view = new EditorView(
    document.querySelector('#editor'),
    {
      nodeViews: {
        checklistItem: (node, editorView, getPos, decorations) => {
          const currentStatus = itemStatuses.valueOf(node.attrs.status);

          const controls = document.createElement('div');
          controls.classList.add('item-controls');
          if (currentStatus === itemStatuses.ACTIVE) {
            itemStatuses.values()
              .filter(value => value !== currentStatus)
              .forEach(status => {
                const button = new (customElements.get('icon-btn'))(status);
                controls.appendChild(button);
              });
          } else {
            controls.appendChild(
              new (customElements.get('icon-btn'))(itemStatuses.ACTIVE)
            );
          }

          controls.addEventListener('click', event => {
            const { statusId } = event.target.dataset;
            if (statusId === undefined || statusId === currentStatus.id) {
              return;
            }
            const tr = editorView.state.tr;
            const nextAttrs = Object.assign({}, node.attrs, {
              status: statusId,
            });

            const pos = getPos();
            const currentNode = editorView.state.doc.resolve(pos).nodeAfter;

            tr.delete(
              pos,
              pos + currentNode.nodeSize,
            );

            let lastPos = null;
            let nextPos = null;
            let posHasBeenFound = false;
            tr.doc.descendants((node, pos) => {
              if (node.type.name !== 'checklistItem' || posHasBeenFound) {
                return;
              }
              // The end of the current item
              lastPos = pos + node.nodeSize;
              const nodeStatus = itemStatuses.valueOf(node.attrs.status);
              const nextStatus = itemStatuses.valueOf(nextAttrs.status);
              if (nodeStatus.ordinal() >= nextStatus.ordinal()) {
                nextPos = pos;
                posHasBeenFound = true;
              }
            });

            const nextNode =
              schema.nodes.checklistItem.create(nextAttrs, currentNode.content);

            tr.insert(nextPos || lastPos, nextNode);

            editorView.dispatch(tr);
          }, { once: true });


          const contentDOM = document.createElement('div');
          contentDOM.classList.add('checklist-item-content');

          const dom = document.createElement('div');
          dom.classList.add('checklist-item');
          dom.classList.add('data-status', currentStatus.id);
          dom.appendChild(controls);
          dom.appendChild(contentDOM);

          if (currentStatus !== itemStatuses.ACTIVE) {
            dom.prepend(
              new (customElements.get('current-status-icon'))(currentStatus)
            );
          }

          return {
            contentDOM,
            dom,
          };
        },
      },
      state,
    },
  );

  persistence.readCurrentDocument(result => {
    let documentId;

    if (result === null) {
      documentId = persistence.writeNewDocument(view.state.toJSON())[0];
      persistence.writeCurrentDocument(documentId);
    } else {
      documentId = result[0];
      const doc = result[1].editorState;
      view.updateState(EditorState.fromJSON({
        plugins,
        schema,
      }, doc));
    }

    view.setProps({
      dispatchTransaction(transaction) {
        const nextState = view.state.apply(transaction);
        view.updateState(nextState);
        persistence.writeExistingDocument(documentId, view.state.toJSON());
      },
    });
  });

  window.view = view;

  return view;
};

export default initialize;
