import { EditorState } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { baseKeymap } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

import { itemStatuses } from '../util';

const initialize = () => {
  const schema = new Schema({
    nodes: {
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
      decorations: state => {
        let decorations = [];
        state.doc.descendants((node, pos) => {
          if (node.type.name === 'checklistItem') {
            const currentStatus = node.attrs.status;

            const div = document.createElement('div');
            div.classList.add('item-controls');
            itemStatuses.values()
              .filter(value => value.id !== currentStatus)
              .forEach(status => {
                const button = document.createElement('button');
                button.classList.add(`${status.id.toLowerCase()}-button`);
                button.dataset.statusId = status.id;
                button.textContent = status.buttonText;
                div.appendChild(button);
              });

            div.addEventListener('click', event => {
              const { statusId } = event.target.dataset;
              if (statusId === undefined || statusId === currentStatus) {
                return;
              }
              const tr = state.tr;
              const nextAttrs = Object.assign({}, node.attrs, {
                status: statusId,
              });

              tr.delete(
                pos,
                pos + node.nodeSize,
              );

              let nextPos = tr.doc.content.size;
              let posHasBeenFound = false;
              tr.doc.descendants((node, pos) => {
                if (node.type.name !== 'checklistItem' || posHasBeenFound) {
                  return;
                }
                const nodeStatus = itemStatuses.valueOf(node.attrs.status);
                const nextStatus = itemStatuses.valueOf(nextAttrs.status);
                if (nodeStatus.ordinal() >= nextStatus.ordinal()) {
                  nextPos = pos;
                  posHasBeenFound = true;
                }
              });

              const nextNode =
                schema.nodes.checklistItem.create(nextAttrs, node.content);

              tr.insert(nextPos, nextNode);

              view.dispatch(tr);
            }, { once: true });

            decorations.push(
              Decoration.widget(pos, div),
            );

            return false;
          }
        });

        return DecorationSet.create(state.doc, decorations);
      },
      nodeViews: {
        checklistItem: (node, editorView, getPos) => {
          const dom = document.createElement('div');
          dom.classList.add('checklist-item');
          dom.classList.add(node.attrs.status.toLowerCase());
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
