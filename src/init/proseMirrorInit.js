import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
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
      nodeViews: {
        checklistItem: (node, editorView, getPos) => {
          const dom = document.createElement('div');
          dom.classList.add('checklist-item');
          dom.classList.add(node.attrs.status.toLowerCase());

          const currentStatus = node.attrs.status;

          const icon = document.createElement('div');
          icon.classList.add('status-icon');
          const currentStatusObj = itemStatuses.valueOf(currentStatus);
          icon.textContent = currentStatusObj.iconText;
          icon.contentEditable = false;

          const controls = document.createElement('div');
          controls.classList.add('item-controls');
          itemStatuses.values()
            .filter(value => value.id !== currentStatus)
            .forEach(status => {
              const button = document.createElement('button');
              button.classList.add(`${status.id.toLowerCase()}-button`);
              button.dataset.statusId = status.id;
              button.textContent = status.buttonText;
              controls.appendChild(button);
            });

          controls.contentEditable = false;
          controls.addEventListener('click', event => {
            const { statusId } = event.target.dataset;
            if (statusId === undefined || statusId === currentStatus) {
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
              schema.nodes.checklistItem.create(nextAttrs, currentNode.content);

            tr.insert(nextPos, nextNode);

            editorView.dispatch(tr);
          }, { once: true });

          dom.appendChild(icon);
          dom.appendChild(controls);

          const contentDOM = document.createElement('span');
          contentDOM.classList.add('checklist-item-content');

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
