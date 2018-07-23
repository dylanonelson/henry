import { EditorView } from 'prosemirror-view';

import allSnapshotsTpl from '../webComponents/allSnapshots.html.tpl';
import currentStatusIconTpl from '../webComponents/currentStatusIcon.html.tpl';
import dropdownTpl from '../webComponents/dropdown.html.tpl'
import editorToolbarTpl from '../webComponents/editorToolbar.html.tpl';
import editorTpl from '../webComponents/editor.html.tpl';
import iconBtnTpl from '../webComponents/iconBtn.html.tpl';
import snapshotItemTpl from '../webComponents/snapshotItem.html.tpl';
import snapshotViewerTpl from '../webComponents/snapshotViewer.html.tpl';
import urlDialogTpl from '../webComponents/urlDialog.html.tpl';
import { dates } from '../util';
import { getRouter } from '../routes';

/**
 * Initialize a web component using a template element already in the document
 */
function fromTemplate(tpl) {
  if (this.rendered === true) return;
  this.appendChild(tpl.content.cloneNode(true));
  this.rendered = true;
}

/**
 * Navigate backwards in history
 */
function goBack() {
  window.history.back();
}

let componentsDefined = false;

export default () => {
  if (componentsDefined !== false) return;

  customElements.define('icon-btn', class IconBtn extends HTMLElement {
    constructor(displayStatus, dataStatus = displayStatus) {
      super();
      this.displayStatus = displayStatus;
      this.dataStatus = dataStatus;
    }

    connectedCallback() {
      fromTemplate.call(this, iconBtnTpl);
      this.addEventListener('click', this.click);
      this.icon.textContent = this.displayStatus.icon;
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.click);
    }

    get icon() {
      return this.querySelector('i');
    }

    get dataset() {
      return { statusId: this.dataStatus.id };
    }
  });

  customElements.define('current-status-icon', class extends HTMLElement {
    constructor(status) {
      super();
      this.status = status;
    }
    connectedCallback() {
      fromTemplate.call(this, currentStatusIconTpl);
      this.querySelector('i').textContent = this.status.icon;
    }
  });

  customElements.define('dropdown-menu', class extends HTMLElement {
    static get observedAttributes() {
      return ['open'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' })
        .appendChild(dropdownTpl.content.cloneNode(true));
      this.close = this.close.bind(this);
      this.handleButtonClick = this.handleButtonClick.bind(this);
      this.handleClick = this.handleClick.bind(this);
      this.handleDocumentClick = this.handleDocumentClick.bind(this);
    }

    attributeChangedCallback(name, prev, next) {
      this.menu.style.display = this.getAttribute('open') === 'true'
        ? 'block'
        : 'none';
    }

    close() {
      this.setAttribute('open', false);
    }

    connectedCallback() {
      this.menu.style.display = 'none';
      this.button.addEventListener('click', this.handleButtonClick);
      this.shadowRoot.addEventListener('click', this.handleClick);
      document.addEventListener('click', this.handleDocumentClick);
    }

    disconnectedCallback() {
      this.button.removeEventListener('click', this.handleButtonClick);
      this.shadowRoot.removeEventListener('click', this.handleClick);
      document.removeEventListener('click', this.handleDocumentClick);
    }

    handleButtonClick() {
      this.setAttribute('open', true);
    }

    handleClick(event) {
      event.fromDropdownMenu = true;
      const { target } = event;
      if (target.tagName.toLowerCase() === 'li') {
        this.dispatchEvent(new Event(target.id));
      }
    }

    handleDocumentClick(event) {
      if (event.fromDropdownMenu !== true) {
        this.setAttribute('open', false);
      }
    }

    get button() {
      return this.shadowRoot.querySelector('.dropdown-btn');
    }

    get menu() {
      return this.shadowRoot.querySelector('.dropdown-menu');
    }
  });

  customElements.define('all-snapshots', class extends HTMLElement {
    connectedCallback() {
      fromTemplate.call(this, allSnapshotsTpl);
      this.backButton.addEventListener('click', goBack);
    }

    disconnectedCallback() {
      this.backButton.removeEventListener('click', goBack);
    }

    get backButton() {
      return this.querySelector('i.back');
    }

    get snapshotList() {
      return this.querySelector('ol');
    }
  });

  customElements.define('snapshot-item', class extends HTMLElement {
    constructor(snapshot) {
      super();
      this.snapshot = snapshot;
    }

    connectedCallback() {
      fromTemplate.call(this, snapshotItemTpl);

      const created = new Date(this.snapshot.createdTs);
      const monthName = dates.getMonthName(created);
      const dayName = dates.getDayName(created);
      const dayNum = created.getDate();
      const createdIso = `${dates.getIsoDate(created)} ${dates.getIsoTime(created)}`;

      const archived = new Date(this.snapshot.lastModifiedTs);
      const archivedIso = `${dates.getIsoDate(archived)} ${dates.getIsoTime(archived)}`;

      this.title.textContent = this.snapshot.title
        ? this.snapshot.title
        : `${dayName}, ${monthName} ${dayNum}`;
      this.createdAt.textContent = createdIso;
      this.archivedAt.textContent = archivedIso;

      this.addEventListener('click', this.goToSnapshot);
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.goToSnapshot);
    }

    goToSnapshot() {
      getRouter().navigate(`./snapshots/${this.snapshot.id}`);
    }

    get title() {
      return this.querySelector('h3');
    }

    get createdAt() {
      return this.querySelector('.created-at p');
    }

    get archivedAt() {
      return this.querySelector('.archived-at p');
    }
  });

  customElements.define('pm-editor', class extends HTMLElement {
    connectedCallback() {
      fromTemplate.call(this, editorTpl);
    }

    get dropdownContainer() {
      return this.querySelector('.dropdown');
    }

    get editorContainer() {
      return this.querySelector('.editor');
    }

    get toolbarContainer() {
      return this.querySelector('.toolbar');
    }
  });

  customElements.define('snapshot-viewer', class extends HTMLElement {
    constructor(snapshot, editorProps) {
      super();
      this.snapshot = snapshot;
      this.editorProps = editorProps;
    }

    connectedCallback() {
      fromTemplate.call(this, snapshotViewerTpl);
      const created = new Date(this.snapshot.createdTs);
      const createdIso = `${dates.getIsoDate(created)} ${dates.getIsoTime(created)}`;
      const archived = new Date(this.snapshot.lastModifiedTs);
      const archivedIso = `${dates.getIsoDate(archived)} ${dates.getIsoTime(archived)}`;
      this.createdAt.textContent = createdIso;
      this.archivedAt.textContent = archivedIso;
      this.backButton.addEventListener('click', goBack);
      this.editorView = new EditorView(
        this.editorContainer,
        this.editorProps
      );
    }

    disconnectedCallback() {
      this.editorView.destroy();
      this.backButton.removeEventListener('click', goBack);
    }

    get archivedAt() {
      return this.querySelector('.archived-at p');
    }

    get backButton() {
      return this.querySelector('.back');
    }

    get createdAt() {
      return this.querySelector('.created-at p');
    }

    get editorContainer() {
      return this.querySelector('.editor');
    }
  });

  customElements.define('editor-toolbar', class extends HTMLElement {
    constructor({ onConnected, onDisconnected }) {
      super();
      this.onConnected = onConnected;
      this.onDisconnected = onDisconnected;
      this.handleClick = this.handleClick.bind(this);
    }

    connectedCallback() {
      fromTemplate.call(this, editorToolbarTpl)
      this.addEventListener('click', this.handleClick);
      this.onConnected();
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.handleClick);
      this.onDisconnected();
    }

    handleClick(e) {
      let dom = e.target;
      if (dom.tagName.toLowerCase() === 'i') {
        dom = dom.parentElement;
      }
      if (dom.tagName.toLowerCase() !== 'button') {
        return;
      }
      const action = dom.getAttribute('data-action');
      this.dispatchEvent(new Event(action));
    }
  });

  customElements.define('url-dialog', class extends HTMLElement {
    constructor({ onCancel, onOk, onRemove, text, url }) {
      super();
      this.onCancel = onCancel;
      this.onRemove = onRemove;
      this.onOk = onOk;
      this.handleCancelClick = this.handleCancelClick.bind(this);
      this.handleGlobalKeyPress = this.handleGlobalKeyPress.bind(this);
      this.handleOkClick = this.handleOkClick.bind(this);
      this.handleRemoveClick = this.handleRemoveClick.bind(this);
      this.textValue = text;
      this.urlValue = url;
    }

    handleCancelClick() {
      this.onCancel();
    }

    handleOkClick() {
      const text = this.textInput.value;
      const url = this.urlInput.value;
      if (text === '') {
        this.textInput.style.border = '1px solid red';
      } else {
        this.onOk({ text, url });
      }
    }

    handleRemoveClick() {
      const text = this.textInput.value;
      this.onRemove({ text });
    }

    connectedCallback() {
      fromTemplate.call(this, urlDialogTpl);
      this.cancelBtn.addEventListener('click', this.handleCancelClick);
      this.okBtn.addEventListener('click', this.handleOkClick);
      this.removeBtn.addEventListener('click', this.handleRemoveClick);
      this.textInput.value = this.textValue;
      this.urlInput.value = this.urlValue;
      if (!this.urlValue) {
        this.removeBtn.style.display = 'none';
      }

      document.body.addEventListener('keydown', this.handleGlobalKeyPress);

      this.urlInput.focus();
    }

    disconnectedCallback() {
      this.okBtn.removeEventListener('click', this.handleOkClick);
      this.cancelBtn.removeEventListener('click', this.handleCancelClick);
      this.removeBtn.removeEventListener('click', this.handleRemoveClick);

      document.body.removeEventListener('keydown', this.handleGlobalKeyPress);
    }

    handleGlobalKeyPress(e) {
      switch (e.which) {
        // esc
        case 27: {
          this.onCancel();
          break;
        }
        // return
        case 13: {
          this.handleOkClick();
          break;
        }
        default: {
          // do nothing
        }
      }
    }

    get cancelBtn() {
      return this.querySelector('button.cancel');
    }

    get okBtn() {
      return this.querySelector('button.ok');
    }

    get removeBtn() {
      return this.querySelector('button.remove');
    }

    get textInput() {
      return this.querySelector('input#text');
    }

    get urlInput() {
      return this.querySelector('input#url');
    }
  });

  componentsDefined = true;
};
