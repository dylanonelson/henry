import { EditorState, Plugin } from 'prosemirror-state';

import * as persistence from '../persistence';
import {
  buildPlugins,
  buildSchema,
  buildNodeViews,
  getEditorViewDom,
} from '../proseMirror';
import { initializeRouter, setContent } from '../routes';

export default () => {
  const router = initializeRouter();

  router.on('/snapshots/:snapshotId', function({ snapshotId }) {
    persistence.readCurrentDocumentId()
      .then(documentId => {
        return persistence.readSnapshot(documentId, snapshotId);
      })
      .then(snapshot => {
        const state = EditorState.fromJSON(
          {
            plugins: buildPlugins(new Plugin({
              filterTransaction() {
                return false;
              },
            })),
            schema: buildSchema(),
          },
          snapshot.editorState
        );
        const editorProps = {
          editable: () => false,
          nodeViews: buildNodeViews(),
          state,
        };
        const SnapshotViewer = customElements.get('snapshot-viewer');
        const snapshotViewer = new SnapshotViewer(snapshot, editorProps);
        setContent(snapshotViewer);
      });
  });

  router.on('/snapshots', function() {
    const allSnapshots = document.createElement('all-snapshots');
    const SnapshotItem = customElements.get('snapshot-item');
    persistence.readDocumentSnapshots()
      .then(snapshots => {
        const snapshotIds = Object.keys(snapshots);
        snapshotIds.forEach(snapshotId => {
          // Don't render the current snapshot into the list
          if (snapshotIds[snapshotIds.length - 1] === snapshotId) {
            return;
          }
          allSnapshots.snapshotList.prepend(
            new SnapshotItem(snapshots[snapshotId])
          );
        });
      });
    setContent(allSnapshots);
  });

  router.on(function() {
    const viewDom = getEditorViewDom();
    setContent(viewDom);
  });

  router.resolve();
}
