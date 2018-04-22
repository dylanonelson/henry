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

  componentsDefined = true;
};
