function fromTemplate(selector) {
  const tpl = document.querySelector(selector);
  this.appendChild(tpl.content.cloneNode(true));
}

let componentsDefined = false;

export default () => {
  if (componentsDefined !== false) return;

  customElements.define('icon-btn', class IconBtn extends HTMLElement {
    constructor(status) {
      super();
      this.status = status;
      this.addEventListener('click', this.click, { once: true });
    }
    connectedCallback() {
      fromTemplate.call(this, '.icon-btn-tpl');
      this.querySelector('i').textContent = this.status.icon;
    }
    get dataset() {
      return {
        statusId: this.status.id,
      };
    }
  });

  customElements.define('current-status-icon', class extends HTMLElement {
    constructor(status) {
      super();
      this.status = status;
    }
    connectedCallback() {
      fromTemplate.call(this, '.current-status-icon-tpl');
      this.querySelector('i').textContent = this.status.icon;
    }
  });

  customElements.define('dropdown-menu', class extends HTMLElement {
    static get observedAttributes() {
      return ['open'];
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
      fromTemplate.call(this, '.dropdown-tpl');

      this.menu = this.querySelector('.dropdown-menu');
      this.button = this.querySelector('.dropdown-btn');

      this.menu.style.display = 'none';

      this.button.addEventListener('click', () => {
        this.setAttribute('open', true);
      });

      this.addEventListener('click', event => {
        event.fromDropdownMenu = true;
        const { target } = event;
        if (target.tagName.toLowerCase() === 'li') {
          this.dispatchEvent(new Event(target.id));
        }
      });

      document.addEventListener('click', event => {
        if (event.fromDropdownMenu !== true) {
          this.setAttribute('open', false);
        }
      });
    }
  });

  componentsDefined = true;
};
