<style>
* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: none;
  border: 0;
  box-shadow: none;
  box-sizing: border-box;
  color: inherit;
  font: inherit;
  margin: 0;
  outline: 0;
  padding: 0;
}
ol {
  list-style-type: none;
}
.material-icons {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;  /* Preferred icon size */
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;

  /* Support for all WebKit browsers. */
  -webkit-font-smoothing: antialiased;
  /* Support for Safari and Chrome. */
  text-rendering: optimizeLegibility;

  /* Support for Firefox. */
  -moz-osx-font-smoothing: grayscale;

  /* Support for IE. */
  font-feature-settings: 'liga';
}
.root {
  cursor: pointer;
  position: absolute;
  right: 15px;
  top: 31px;
  z-index: 1;
}
.dropdown-btn {
  border-radius: 50%;
  padding: 0px 6px;
}
.dropdown-btn i {
  line-height: 36px;
}
ol {
  background: #fff;
  border-radius: 2px;
  box-shadow:
    rgba(0, 0, 0, 0.12) 0px 1px 6px,
    rgba(0, 0, 0, 0.12) 0px 1px 4px;
  position: absolute;
  right: 0;
  width: 200px;
}
li {
  font-family: Roboto;
  font-size: 15px;
  padding: 12px 10px;

}
li:hover {
  background: rgba(0, 0, 0, 0.1);
}
</style>

<div class="root">
  <div class="dropdown-btn">
    <i class="material-icons">more_vert</i>
  </div>
  <div class="dropdown-menu">
    <ol>
      <li id="all-snapshots">All snapshots</li>
      <li id="new-snapshot">Autofill new snapshot</li>
      <li id="autofill-title">Autofill title</li>
      <li id="sign-out">Sign out</li>
    </ol>
  </div>
</div>
