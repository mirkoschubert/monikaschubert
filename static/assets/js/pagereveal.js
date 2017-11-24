(function(window) {
  function PageLoader(el, options) {
    this.el = el;
    this.items = this.el.querySelectorAll(".page-item");
  }

  PageLoader.prototype.effect = {
    sortTargetsFn: function(a, b) {
      var aBounds = a.getBoundingClientRect();
      var bBounds = b.getBoundingClientRect();

      return aBounds.left - bBounds.left || aBounds.top - bBounds.top;
    },
    animeOpts: {
      duration: function(t, i) {
        return 500 + i * 50;
      },
      easing: "easeOutExpo",
      delay: function(t, i) {
        return i * 20;
      },
      opacity: {
        value: [0, 1],
        duration: function(t, i) {
          return 250 + i * 50;
        },
        easing: "linear"
      },
      translateY: [400, 0]
    }
  };

  PageLoader.prototype._render = function() {
    this._resetStyles();

    var self = this;
    var effectSettings = this.effect;
    var animeOpts = effectSettings.animeOpts;

    animeOpts.targets =
      effectSettings.sortTargetsFn &&
      typeof effectSettings.sortTargetsFn === "function"
        ? [].slice.call(this.items).sort(effectSettings.sortTargetsFn)
        : this.items;
    anime.remove(animeOpts.targets);
    anime(animeOpts);
  };

  PageLoader.prototype._resetStyles = function() {
    this.el.style.WebkitPerspective = this.el.style.perspective = "none";
    [].slice.call(this.items).forEach(function(item) {
      var gItem = item.parentNode;
      item.style.opacity = 0;
      item.style.WebkitTransformOrigin = item.style.transformOrigin = "50% 50%";
      item.style.transform = "none";

      gItem.style.overflow = "";
    });
  };

  window.PageLoader = PageLoader;

  var body = document.body;
  var doc = window.document.documentElement;
  var page = document.querySelector(".page");
  var filterCtrls = document.querySelectorAll(".nav-pictures a");
  var offset = getViewport("x");
  var masonry, loader, loaderTimeout;

  function init() {
    imagesLoaded(body, function() {
      loader = new PageLoader(page);
      loader._render();

      body.classList.remove("loading");
    });
  }

  function getViewport(axis) {
    var client, inner;

    if (axis === "x") {
      client = doc["clientWidth"];
      inner = window["innerWidth"];
    } else if (axis === "y") {
      client = doc["clientHeight"];
      inner = window["innerHeight"];
    }

    return client < inner ? inner : client;
  }

  init();
})(window);
