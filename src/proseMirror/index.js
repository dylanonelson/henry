import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { EditorState, Plugin, Selection } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { baseKeymap } from 'prosemirror-commands';
import { collab } from 'prosemirror-collab';
import { history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { marks as BasicSchemaMarks } from 'prosemirror-schema-basic';

import { Counter, itemStatuses } from '../util';

export const NEXT_TRANSACTION_ID = new Counter();

export function isNodeType(node, typeName) {
  return node.type.name === typeName;
}

let schema = null;

export function buildSchema() {
  if (schema !== null) {
    return schema;
  }
  schema = new Schema({
    marks: {
      link: Object.assign(BasicSchemaMarks.link, {
        inclusive: true,
      }),
    },
    nodes: {
      checklist: {
        content: 'checklistItem+',
        marks: '_',
        parseDOM: [{ tag: 'div.checklist' }],
        toDOM(node) {
          return ['div', { 'class': 'checklist' }, 0];
        },
      },
      checklistItem: {
        attrs: {
          status: {
            default: itemStatuses.ACTIVE.id,
          },
        },
        content: 'text*',
        marks: '_',
        parseDOM: [{
          getAttrs(dom) {
            return JSON.parse(dom.dataset['attrs']);
          },
          tag: 'div.checklist-item',
        }],
        placeholder: 'New item...',
        toDOM(node) {
          return [
            'div',
            {
              class: 'checklist-item',
              'data-attrs': JSON.stringify(node.attrs),
            },
            0,
          ];
        },
      },
      doc: {
        content: 'title checklist',
        marks: '_',
      },
      text: {
        inline: true,
        marks: '_',
      },
      title: {
        content: 'text*',
        marks: '',
        placeholder: 'Title',
        toDOM(node) {
          return ['h2', { 'class': 'title' }, 0];
        },
      },
    },
  });

  return schema;
}

let clientId = null;

export function getClientId() {
  if (clientId !== null) {
    return clientId;
  }

  clientId = Math.floor(Math.random() * 0xFFFFFFFF);
  return clientId;
}

export function buildPlugins(...withPlugins) {
  const schema = buildSchema();
  const plugins = [
    collab({
      clientID: getClientId(),
    }),
    history(),
    keymap(Object.assign({}, baseKeymap, {
      Enter: (...args) => {
        const [state, dispatch] = args;
        const { selection, tr } = state;

        tr.scrollIntoView();

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
          const decorations = []
          const { doc, selection } = state;
          const { from, to } = selection;

          doc.nodesBetween(from, to, (node, pos) => {
            decorations.push(Decoration.node(pos, pos + node.nodeSize, { selected: true }));
          });

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
              // It's a node that contains text
              node.isTextblock &&
              // It's the first child of its parent
              $pos.parentOffset === 0 &&
              // It's empty
              node.content.size === 0 && (
                // It is the last child of its parent
                parent.content.size === node.nodeSize ||
                // The child after it is of a different type
                parent.childAfter($pos.index($pos.depth) + node.nodeSize).node.type !== node.type
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
    ...withPlugins,
  ];

  return plugins;
}

function buildEditorState() {
  const state = EditorState.create({
    plugins: buildPlugins(),
    schema: buildSchema(),
  });

  return state;
}

export function buildNodeViews() {
  const IconBtn = customElements.get('icon-btn');

  const nodeViews = {
    checklistItem: (node, editorView, getPos, decorations) => {
      const currentStatus = itemStatuses.valueOf(node.attrs.status);

      const controls = document.createElement('div');
      controls.classList.add('item-controls');
      if (currentStatus === itemStatuses.ACTIVE) {
        [
          itemStatuses.DEFERRED,
          itemStatuses.CANCELED,
        ].forEach(status => {
          controls.appendChild(new IconBtn(status));
        });
      }

      const toggle = document.createElement('div');
      toggle.contentEditable = false;
      toggle.classList.add('current-status-icon');
      let toggleBtn;
      if (currentStatus === itemStatuses.ACTIVE) {
        toggleBtn = new IconBtn(currentStatus, itemStatuses.COMPLETE);
      } else {
        toggleBtn = new IconBtn(currentStatus);
      }
      toggle.appendChild(toggleBtn);

      const handler = event => {
        let { statusId } = event.target.dataset;

        if (statusId === undefined) {
          return;
        }
        if (statusId === currentStatus.id) {
          statusId = itemStatuses.ACTIVE.id;
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
          if (nodeStatus.ordinal() > nextStatus.ordinal()) {
            nextPos = pos;
            posHasBeenFound = true;
          }
        });

        const nextNode =
          schema.nodes.checklistItem.create(nextAttrs, currentNode.content);

        tr.insert(nextPos || lastPos, nextNode);

        editorView.dispatch(tr);

        if (viewHadFocusBeforeClick) {
          editorView.focus();
        }
      };

      controls.addEventListener('click', handler);
      toggleBtn.addEventListener('click', handler);

      const contentDOM = document.createElement('div');
      contentDOM.classList.add('checklist-item-content');

      const dom = document.createElement('div');
      dom.classList.add('checklist-item');
      dom.classList.add('data-status', currentStatus.id);
      if (decorations.some(deco => deco.spec.selected)) {
        dom.setAttribute('selected', true);
      }
      dom.appendChild(toggle);
      dom.appendChild(controls);
      dom.appendChild(contentDOM);

      return {
        contentDOM,
        destroy() {
          controls.removeEventListener('click', handler);
          toggleBtn.addEventListener('click', handler);
        },
        dom,
      };
    },
    link: node => {
      const { href, title } = node.attrs;

      function sendToUrl() {
        window.open(href, title);
      }

      const dom = document.createElement('a');
      dom.addEventListener('click', sendToUrl);

      return {
        destroy() {
          dom.removeEventListener('click', sendToUrl);
        },
        dom,
      };
    },
  };

  return nodeViews;
}

export function buildEditorProps() {
  const props = {
    nodeViews: buildNodeViews(),
    // Height of toolbar + bottom padding of single item
    scrollMargin: 65,
    // Height of toolbar
    scrollThreshold: 52,
    state: buildEditorState(),
  };

  return props;
}

let view = null;
let viewDom = null;
let viewHadFocusBeforeClick = false;

export function initializeEditorView() {
  if (view !== null) {
    return view;
  }

  const PMEditor = customElements.get('pm-editor');

  viewDom = new PMEditor();

  document.body.appendChild(viewDom);

  view = new EditorView(
    viewDom.editorContainer,
    buildEditorProps(),
  );

  view.dom.spellcheck = false;

  document.body.removeChild(viewDom);

  // Track when a click has unfocused the editor view so we can restore focus when necessary
  document.addEventListener('mousedown', () => {
    viewHadFocusBeforeClick = view.hasFocus();
  });

  return view;
}

export function getEditorView() {
  if (view === null) {
    throw new Error('The editor view hasn\'t been initialized yet');
  }

  return view;
}

export function getEditorViewDom() {
  if (viewDom === null) {
    throw new Error('The editor view hasn\'t been initialized yet');
  }

  return viewDom;
}

export function resetEditorState(json) {
  const view = getEditorView();
  view.updateState(EditorState.fromJSON({
    plugins: buildPlugins(),
    schema: buildSchema(),
  }, json));
}

export function filterInactiveItems() {
  const view = getEditorView();
  const { state } = view;
  const { tr } = state;

  state.doc.descendants((node, pos) => {
    if (isNodeType(node, 'checklistItem') === false) {
      return;
    }

    if (node.attrs.status !== itemStatuses.ACTIVE.id && node.attrs.status !== itemStatuses.DEFERRED.id) {
      const deleteAt = tr.mapping.map(pos);
      tr.delete(deleteAt, deleteAt + node.nodeSize);
    } else if (node.attrs.status === itemStatuses.DEFERRED.id) {
      const replaceAt = tr.mapping.map(pos);
      const nextNode = state.schema.nodes.checklistItem.create(
        { status: itemStatuses.ACTIVE.id },
        node.content
      );
      tr.replaceWith(replaceAt, replaceAt + node.nodeSize, nextNode);
    }
  });

  view.dispatch(tr);
}
