import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { baseKeymap } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

import { itemStatuses } from '../util';

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
        content: 'title checklist notes',
      },
      notes: {
        content: 'paragraph+',
        toDOM(node) {
          return [
            'div',
            {
              'class': 'notes',
            },
            0,
          ];
        },
      },
      paragraph: {
        content: 'text*',
        toDOM(node) {
          return [
            'p',
            {
              'class': 'paragraph',
            },
            0,
          ];
        },
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
