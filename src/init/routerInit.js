import * as persistence from '../persistence';
import { getEditorViewDom } from '../proseMirror';
import { initializeRouter, setContent } from '../routes';

export default () => {
  const router = initializeRouter();

  router.on('/snapshots', function() {
    const allSnapshots = document.createElement('all-snapshots');
    const SnapshotItem = customElements.get('snapshot-item');
    persistence.readCurrentDocument()
      .then(json => {
        const { snapshots } = json;
        const snapshotIds = Object.keys(snapshots);
        snapshotIds.forEach(snapshotId => {
          // Don't render the current snapshot into the list
          if (snapshotIds[snapshotIds.length - 1] === snapshotId) {
            return;
          }
          allSnapshots.snapshotList.appendChild(
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
