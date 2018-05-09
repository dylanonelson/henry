import moment from 'moment';
import { EditorView } from 'prosemirror-view';

import { getRouter } from '../routes';

/**
 * Initialize a web component using a template element already in the document
 */
function fromTemplate(selector) {
  const tpl = document.querySelector(selector);
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
      if (!this.rendered) fromTemplate.call(this, '.icon-btn-tpl');
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
      if (!this.rendered) fromTemplate.call(this, '.current-status-icon-tpl');
      this.querySelector('i').textContent = this.status.icon;
    }
  });

  customElements.define('dropdown-menu', class extends HTMLElement {
    static get observedAttributes() {
      return ['open'];
    }

    constructor() {
      super();
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
      if (!this.rendered) fromTemplate.call(this, '.dropdown-tpl');
      this.menu.style.display = 'none';
      this.button.addEventListener('click', this.handleButtonClick);
      this.addEventListener('click', this.handleClick);
      document.addEventListener('click', this.handleDocumentClick);
    }

    disconnectedCallback() {
      this.button.removeEventListener('click', this.handleButtonClick);
      this.removeEventListener('click', this.handleClick);
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
      return this.querySelector('.dropdown-btn');
    }

    get menu() {
      return this.querySelector('.dropdown-menu');
    }
  });

  customElements.define('all-snapshots', class extends HTMLElement {
    connectedCallback() {
      if (!this.rendered) fromTemplate.call(this, '.all-snapshots-tpl');
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
      if (!this.rendered) fromTemplate.call(this, '.snapshot-item-tpl');
      this.title.textContent = moment(this.snapshot.createdTs).format('dddd, MMMM D');
      this.createdAt.textContent = moment(this.snapshot.createdTs).format('YYYY-MM-DD HH:MM');
      this.archivedAt.textContent = moment(this.snapshot.lastModifiedTs).format('YYYY-MM-DD HH:MM');
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
      if (!this.rendered) fromTemplate.call(this, '.editor-tpl');
    }

    get dropdownContainer() {
      return this.querySelector('.dropdown');
    }

    get editorContainer() {
      return this.querySelector('.editor');
    }
  });

  customElements.define('snapshot-viewer', class extends HTMLElement {
    constructor(snapshot, editorProps) {
      super();
      this.snapshot = snapshot;
      this.editorProps = editorProps;
    }

    connectedCallback() {
      if (!this.rendered) fromTemplate.call(this, '.snapshot-viewer-tpl');
      this.createdAt.textContent = moment(this.snapshot.createdTs).format('YYYY-MM-DD HH:MM');
      this.archivedAt.textContent = moment(this.snapshot.lastModifiedTs).format('YYYY-MM-DD HH:MM');
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

  componentsDefined = true;
};
