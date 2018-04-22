import { EditorState, Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { baseKeymap } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

import { itemStatuses } from '../util';

const SELECTED_NODE_CLASS = 'selected';

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
      },
      doc: {
        content: 'title checklist',
      },
      text: {
        inline: true,
      },
      title: {
        content: 'text*',
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

  const state = EditorState.create({
    plugins: [
      keymap(baseKeymap),
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
    ],
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
          dom.appendChild(controls);
          dom.appendChild(contentDOM);

          return {
            contentDOM,
            deselectNode() {
              dom.classList.remove(SELECTED_NODE_CLASS);
            },
            dom,
            selectNode() {
              dom.classList.add(SELECTED_NODE_CLASS);
            },
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
