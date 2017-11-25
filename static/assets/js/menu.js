(function(window) {

  var menu = document.querySelector(".nav-group");
  var gridLinks = [].slice.call(menu.querySelectorAll(".grid-filter a"));
  var openCtrl = document.querySelector("button.action--open");
  var closeCtrl = document.querySelector(".nav-group button.action--close");
  var isOpen = false;

  openCtrl.addEventListener("click", function() {
    _show();
    if (isOpen) {
      gridLinks.forEach(function(item) {
        item.addEventListener("click", () => _hide());
      });
    }
  });

  closeCtrl.addEventListener("click", () => _hide());

  function _show() {
    if (isOpen) return;
    menu.style.display = "block";
    setTimeout(() => {
      menu.classList.add("nav-group--open");
    }, 0);
    isOpen = true;
  }

  function _hide() {
    if (!isOpen) return;
    console.log('hide');
    setTimeout(() => {
      menu.classList.remove("nav-group--open");
    }, 0);
    menu.style.display = "none";
    isOpen = false;
  }


})(window);