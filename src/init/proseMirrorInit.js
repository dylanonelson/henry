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

            // Add complete checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = currentStatus === itemStatuses.COMPLETE.id
              ? true
              : false;
            checkbox.disabled = currentStatus === itemStatuses.CANCELED.id;
            checkbox.classList.add('checkbox');
            checkbox.addEventListener('change', () => {
              const tr = state.tr;
              const nextAttrs = Object.assign({}, node.attrs, {
                status: checkbox.checked === false
                  ? itemStatuses.ACTIVE.id
                  : itemStatuses.COMPLETE.id,
              });
              tr.replaceWith(
                pos,
                pos + node.nodeSize,
                schema.nodes.checklistItem.create(nextAttrs, node.content),
              );
              view.dispatch(tr);
            }, { once: true });

            decorations.push(
              Decoration.widget(pos, checkbox)
            );

            // Add activate button
            const button = document.createElement('button');
            button.classList.add('cancel-button');
            switch (currentStatus) {
              case itemStatuses.CANCELED.id: {
                button.textContent = 'activate';
                break;
              }
              case itemStatuses.ACTIVE.id: {
                button.textContent = 'cancel';
                break;
              }
              case itemStatuses.COMPLETE.id: {
                button.style.display = 'none';
                break;
              }
            }
            button.addEventListener('click', () => {
              const tr = state.tr;
              const nextAttrs = Object.assign({}, node.attrs, {
                status: currentStatus === itemStatuses.CANCELED.id
                  ? itemStatuses.ACTIVE.id
                  : itemStatuses.CANCELED.id,
              });
              tr.replaceWith(
                pos,
                pos + node.nodeSize,
                schema.nodes.checklistItem.create(nextAttrs, node.content),
              );
              view.dispatch(tr);
            });

            decorations.push(
              Decoration.widget(pos, button),
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
