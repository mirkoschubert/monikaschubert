(function(window) {
  if ('standalone' in window.navigator && window.navigator.standalone) {
    var node = false;
    var remote = true;

    document.addEventListener('click', function(event) {
      node = event.target;
      while (node.nodeName !== 'A' && node.nodeName !== 'HTML') {
        node = node.parentNode;
      }
      if (
        'href' in node &&
        node.href.indexOf('http') !== -1 &&
        (node.href.indexOf(document.location.host) !== -1 || remote)
      ) {
        event.preventDefault();
        document.location.href = node.href;
      }
    });
  }
})(window);
