(function(window) {
  var body = document.body;
  var doc = window.document.documentElement;
  var overlay = document.querySelector(".grid-overlay");
  var grid = document.querySelector(".grid");
  var figures = grid.querySelectorAll(".grid-item");
  var filterCtrls = document.querySelectorAll(".grid-filter a");
  var offset = getViewport("x");
  var masonry, loader, loaderTimeout;

  var support = { transitions: Modernizr.csstransitions },
    // transition end event name
    transEndEventNames = {
      WebkitTransition: "webkitTransitionEnd",
      MozTransition: "transitionend",
      OTransition: "oTransitionEnd",
      msTransition: "MSTransitionEnd",
      transition: "transitionend"
    },
    transEndEventName = transEndEventNames[Modernizr.prefixed("transition")],
    onEndTransition = function(el, callback) {
      var onEndCallbackFn = function(ev) {
        if (support.transitions) {
          if (ev.target != this) return;
          this.removeEventListener(transEndEventName, onEndCallbackFn);
        }
        if (callback && typeof callback === "function") {
          callback.call(this);
        }
      };
      if (support.transitions) {
        el.addEventListener(transEndEventName, onEndCallbackFn);
      } else {
        onEndCallbackFn();
      }
    };

  // Helper funcions

  function throttle(fn, delay) {
    var allowSample = true;

    return function(e) {
      if (allowSample) {
        allowSample = false;
        setTimeout(function() {
          allowSample = true;
        }, delay);
        fn(e);
      }
    };
  }

  function nextSibling(el) {
    var nextSibling = el.nextSibling;
    while (nextSibling && nextSibling.nodeType != 1) {
      nextSibling = nextSibling.nextSibling;
    }
    return nextSibling;
  }

  function extend(a, b) {
    for (var key in b) {
      if (b.hasOwnProperty(key)) {
        a[key] = b[key];
      }
    }
    return a;
  }

  // Grid Loader Object
  function GridLoader(el, options) {
    this.el = el;
    this.options = extend({}, this.options);
    extend(this.options, options);

    this.items = [].slice.call(this.el.querySelectorAll(".grid-item"));
    this.filters = [].slice.call(document.querySelectorAll(".grid-filter a"));
    this.filterIds = [];
    this.isFiltered = false;
    this.isExpanded = false;
    this.isAnimating = false;
    this.previewEl = nextSibling(this.el);
    this.closeCtrl = this.previewEl.querySelector("button.action--close");
    this.prevCtrl = this.previewEl.querySelector("button.action--prev");
    this.nextCtrl = this.previewEl.querySelector("button.action--next");
    this.previewDescriptionEl = this.previewEl.querySelector(
      ".description--preview"
    );

    this._init();
  }

  GridLoader.prototype.options = {
    pagemargin: 0,
    imgPosition: { x: 1, y: 1 },
    onInit: function(instance) {
      return false;
    },
    onResize: function(instance) {
      return false;
    },
    onOpenItem: function(instance, item) {
      return false;
    },
    onChangeItem: function(instance, currentItem, nextItem) {
      return false;
    },
    onCloseItem: function(instance, item) {
      return false;
    },
    onExpand: function(instance) {
      return false;
    },
    onFilter: function(instance, item) {
      return false;
    }
  };

  // Effect Options
  GridLoader.prototype.effect = {
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

  GridLoader.prototype._init = function() {
    this.options.onInit(this);

    var self = this;

    imagesLoaded(body, function() {
      masonry = new Masonry(grid, {
        itemSelector: ".grid-item",
        columnWidth: ".grid-sizer",
        percentPosition: true,
        gutter: 20,
        transitionDuration: 0
      });

      // show grid if all images are loaded
      body.classList.remove("loading");

      self._setOriginal();
      self._setClone();

      self._initEvents();

      self._render();
    });
  };

  GridLoader.prototype._initEvents = function() {
    var self = this;

    this.filters.forEach(function(item) {
      item.addEventListener("click", function(ev) {
        ev.preventDefault();
        self._filter(ev, item);
      });
    });

    this.items.forEach(function(item) {
      item.addEventListener("click", function(ev) {
        ev.preventDefault();
        self._openItem(ev, item);
      });
    });

    // close expanded image
    this.closeCtrl.addEventListener("click", function() {
      self._closeItem();
    });
    this.closeCtrl2.addEventListener("click", function() {
      self._closeItem();
    });
    // prev and next
    this.prevCtrl.addEventListener("click", function(ev) {
      self._changeItem(ev, "prev");
    });
    this.nextCtrl.addEventListener("click", function(ev) {
      self._changeItem(ev, "next");
    });

    // key bindings
    document.addEventListener("keydown", function(e) {
      if (self.isExpanded) {
        e.preventDefault();
        switch (e.which) {
          case 27:
            // ESC
            console.log('close');
            self._closeItem();
            break;
          case 37:
          case 40:
            // Left or Down
            self._changeItem(e, "prev");
            break;

          case 39:
          case 38:
            // Right or Up
            self._changeItem(e, "next");
            break;
          default:
            break;
        }
      }
    });

    window.addEventListener(
      "resize",
      throttle(function(ev) {
        // callback
        self.options.onResize(self);
      }, 10)
    );
  };

  GridLoader.prototype._render = function() {
    this._resetStyles();

    var self = this;
    var effectSettings = this.effect;
    var animeOpts = effectSettings.animeOpts;

    animeOpts.targets = effectSettings.sortTargetsFn && typeof effectSettings.sortTargetsFn === "function" ? [].slice.call(this.items).sort(effectSettings.sortTargetsFn) : this.items;
    anime.remove(animeOpts.targets);
    anime(animeOpts);
  };

  GridLoader.prototype._resetStyles = function() {
    this.el.style.WebkitPerspective = this.el.style.perspective = "none";
    [].slice.call(this.items).forEach(function(item) {
      var gItem = item.parentNode;
      item.style.opacity = 0;
      item.style.WebkitTransformOrigin = item.style.transformOrigin = "50% 50%";
      item.style.transform = "none";

      gItem.style.overflow = "";
    });
  };

  GridLoader.prototype._filter = function(ev, item) {
    
    this.filterIds = [];
    this.isFiltered = ev.target.className !== "all";

    var self = this;
    this.items.forEach(function(it) {
      if (ev.target.className !== "all" && !it.classList.contains(ev.target.className)) {
        it.style.display = "none";
      } else {
        it.style.display = "block";
        self.filterIds.push(self.items.indexOf(it));
      }
    });

    this.filters.forEach(function(fi) {
      fi.parentNode.className = fi.className === ev.target.className ? "active" : "";
    });

    console.log(ev.target.className, this.isFiltered);
    masonry.layout();
    self._render();
  };

  GridLoader.prototype._openItem = function(ev, item) {
    if (this.isAnimating || this.isExpanded) return;
    this.isAnimating = true;
    this.isExpanded = true;

    var gImg = item.querySelector("img");
    var gImgOffset = gImg.getBoundingClientRect();

    this.current = this.items.indexOf(item);
    this._setOriginal(item.querySelector("a").getAttribute("href"));
    this.options.onOpenItem(this, item);
    this._setClone(gImg.src, {
      width: gImg.offsetWidth,
      height: gImg.offsetHeight,
      left: gImgOffset.left,
      top: gImgOffset.top
    });

    // hide the original
    item.classList.add("grid-item--current");

    // calculate the transform value for the clone to animate to the full image view
    var win = this._getWinSize(),
      originalSizeArr = item.getAttribute("data-size").split("x"),
      originalSize = { width: originalSizeArr[0], height: originalSizeArr[1] },
      dx = (this.options.imgPosition.x > 0 ? 1 - Math.abs(this.options.imgPosition.x) : Math.abs(this.options.imgPosition.x)) * win.width + this.options.imgPosition.x * win.width / 2 - gImgOffset.left - 0.5 * gImg.offsetWidth,
      dy = (this.options.imgPosition.y > 0 ? 1 - Math.abs(this.options.imgPosition.y) : Math.abs(this.options.imgPosition.y)) * win.height + this.options.imgPosition.y * win.height / 2 - gImgOffset.top - 0.5 * gImg.offsetHeight,
      z = Math.min(Math.min(win.width * Math.abs(this.options.imgPosition.x) - this.options.pagemargin, originalSize.width - this.options.pagemargin) / gImg.offsetWidth, Math.min( win.height * Math.abs(this.options.imgPosition.y) - this.options.pagemargin, originalSize.height - this.options.pagemargin) / gImg.offsetHeight);

    // apply transform to the clone
    this.cloneImg.style.WebkitTransform = "translate3d(" + dx + "px, " + dy + "px, 0) scale3d(" + z + ", " + z + ", 1)";
    this.cloneImg.style.transform = "translate3d(" + dx + "px, " + dy + "px, 0) scale3d(" + z + ", " + z + ", 1)";

    // add the description if any
    var descriptionEl = item.querySelector("figcaption");
    if (descriptionEl) {
      this.previewDescriptionEl.innerHTML = descriptionEl.innerHTML;
    }

    var self = this;
    setTimeout(function() {
      // controls the elements inside the expanded view
      self.previewEl.classList.add("preview--open");
      // callback
      self.options.onExpand();
    }, 0);

    // after the clone animates..
    onEndTransition(this.cloneImg, function() {
      // when the original/large image is loaded..
      imagesLoaded(self.originalImg, function() {
        // close button just gets shown after the large image gets loaded
        self.previewEl.classList.add("preview--image-loaded");
        // animate the opacity to 1
        self.originalImg.style.opacity = 1;
        // and once that's done..
        onEndTransition(self.originalImg, function() {
          // reset cloneImg
          self.cloneImg.style.opacity = 0;
          self.cloneImg.style.WebkitTransform = "translate3d(0,0,0) scale3d(1,1,1)";
          self.cloneImg.style.transform = "translate3d(0,0,0) scale3d(1,1,1)";

          self.isAnimating = false;
        });
      });
    });
  };


  GridLoader.prototype._changeItem = function(e, direction) {

    if (!this.isExpanded || this.isAnimating) return;
    this.isAnimating = true;

    console.log(direction);
    var self = this;
    var currentItem, nextItem;
    var i = 0;
    // find out which item is next
    this.items.forEach(function(item) {
      if (item.classList.contains("grid-item--current")) {
        currentItem = item;
        if (direction === "prev") {
          // use only the shown items
          if (self.isFiltered) {
            nextItem = (self.filterIds.indexOf(i) === 0) ? self.items[self.filterIds[self.filterIds.length - 1]] : self.items[self.filterIds[self.filterIds.indexOf(i) - 1]];
          } else {
            nextItem = (i === 0) ? self.items[self.items.length - 1] : self.items[i - 1];
          }
        } else if (direction === "next") {
          // use only the shown items
          if (self.isFiltered) {
            nextItem = (self.filterIds.indexOf(i) < self.filterIds.length - 1 ) ? self.items[self.filterIds[self.filterIds.indexOf(i) + 1]] : self.items[self.filterIds[0]] ; 
          } else {
            nextItem = (i + 1 < self.items.length) ? self.items[i + 1] : self.items[0];
          }
        }
      }
      i++;
    });
    // switch the hidden item in the grid
    currentItem.classList.remove("grid-item--current");
    nextItem.classList.add("grid-item--current");
    // sitch the animation of the hidden items
    this.options.onChangeItem(this, currentItem, nextItem);

    // load the new original
    this.current = this.items.indexOf(nextItem);
    this._setOriginal(nextItem.querySelector("a").getAttribute("href"));

    // add the description if any
    var descriptionEl = nextItem.querySelector("figcaption");
    if (descriptionEl) {
      this.previewDescriptionEl.innerHTML = descriptionEl.innerHTML;
    }

    setTimeout(function() {
      // controls the elements inside the expanded view
      self.previewEl.classList.add("preview--open");
      // callback
      self.options.onExpand();
    }, 0);
    
    // when the new original image is loaded
    imagesLoaded(this.originalImg, function() {
      // animate to full opacity
      self.originalImg.style.opacity = 1;
      self.isAnimating = false;
    });    
  };


  GridLoader.prototype._setOriginal = function(src) {
    if (!src) {
      this.originalImg = document.createElement("img");
      this.originalImg.className = "original";
      this.originalImg.style.opacity = 0;
      this.originalImg.style.maxWidth =
        "calc(" +
        parseInt(Math.abs(this.options.imgPosition.x) * 100) +
        "vw - " +
        this.options.pagemargin +
        "px)";
      this.originalImg.style.maxHeight =
        "calc(" +
        parseInt(Math.abs(this.options.imgPosition.y) * 100) +
        "vh - " +
        this.options.pagemargin +
        "px)";
      // need it because of firefox
      this.originalImg.style.WebkitTransform =
        "translate3d(0,0,0) scale3d(1,1,1)";
      this.originalImg.style.transform = "translate3d(0,0,0) scale3d(1,1,1)";
      src = "";
      this.previewEl.appendChild(this.originalImg);
      this.closeCtrl2 = this.previewEl.querySelector(".original");
    }

    this.originalImg.setAttribute("src", src);
  };

  GridLoader.prototype._setClone = function(src, settings) {
    if (!src) {
      this.cloneImg = document.createElement("img");
      this.cloneImg.className = "clone";
      src = "";
      this.cloneImg.style.opacity = 0;
      this.previewEl.appendChild(this.cloneImg);
    } else {
      this.cloneImg.style.opacity = 1;
      // set top/left/width/height of grid item's image to the clone
      this.cloneImg.style.width = settings.width + "px";
      this.cloneImg.style.height = settings.height + "px";
      this.cloneImg.style.top = settings.top + "px";
      this.cloneImg.style.left = settings.left + "px";
    }

    this.cloneImg.setAttribute("src", src);
  };

  GridLoader.prototype._closeItem = function() {
    if (!this.isExpanded || this.isAnimating) return;
    this.isExpanded = false;
    this.isAnimating = true;

    // the grid item's image and its offset
    var gridItem = this.items[this.current],
      gridImg = gridItem.querySelector("img"),
      gridImgOffset = gridImg.getBoundingClientRect(),
      self = this;

    this.previewEl.classList.remove("preview--open");
    this.previewEl.classList.remove("preview--image-loaded");

    // callback
    this.options.onCloseItem(this, gridItem);

    // large image will animate back to the position of its grid's item
    this.originalImg.classList.add("animate");

    // set the transform to the original/large image
    var win = this._getWinSize(),
      dx = gridImgOffset.left + gridImg.offsetWidth / 2 - ((this.options.imgPosition.x > 0 ? 1 - Math.abs(this.options.imgPosition.x) : Math.abs(this.options.imgPosition.x)) * win.width + this.options.imgPosition.x * win.width / 2),
      dy = gridImgOffset.top + gridImg.offsetHeight / 2 - ((this.options.imgPosition.y > 0 ? 1 - Math.abs(this.options.imgPosition.y) : Math.abs(this.options.imgPosition.y)) * win.height + this.options.imgPosition.y * win.height / 2),
      z = gridImg.offsetWidth / this.originalImg.offsetWidth;

    this.originalImg.style.WebkitTransform = "translate3d(" + dx + "px, " + dy + "px, 0) scale3d(" + z + ", " + z + ", 1)";
    this.originalImg.style.transform = "translate3d(" + dx + "px, " + dy + "px, 0) scale3d(" + z + ", " + z + ", 1)";

    // once that's done..
    onEndTransition(this.originalImg, function() {
      // clear description
      self.previewDescriptionEl.innerHTML = "";

      // show original grid item
      gridItem.classList.remove("grid-item--current");
      //classie.remove(gridItem, 'grid__item--current');

      // fade out the original image
      setTimeout(function() {
        self.originalImg.style.opacity = 0;
      }, 60);

      // and after that
      onEndTransition(self.originalImg, function() {
        // reset original/large image
        self.originalImg.classList.remove("animate");
        self.originalImg.style.WebkitTransform = "translate3d(0,0,0) scale3d(1,1,1)";
        self.originalImg.style.transform = "translate3d(0,0,0) scale3d(1,1,1)";

        self.isAnimating = false;
      });
    });
  };

  function getViewport(axis) {
    var client, inner;

    if (axis === "x") {
      client = doc.clientWidth;
      inner = window.innerWidth;
    } else if (axis === "y") {
      client = doc.clientHeight;
      inner = window.innerHeight;
    }

    return client < inner ? inner : client;
  }

  GridLoader.prototype._getWinSize = function() {
    return {
      width: document.documentElement.clientWidth,
      height: window.innerHeight
    };
  };

  function loadImage(image, caption) {
    var ovImage = overlay.querySelector("img");
    var ovCaption = overlay.querySelector("figcaption");

    overlay.style.left = offset + "px";
    overlay.style.width = offset - 320 + "px";
    ovImage.src = image;
    ovCaption.innerHTML = caption.replace("<br>", " - ");

    imagesLoaded(overlay, function() {
      anime({
        targets: overlay,
        translateX: 0 - offset,
        easing: "easeInExpo"
      });
    });
  }

  function exitOverlay() {
    anime({
      targets: overlay,
      translateX: offset,
      easing: "easeOutExpo"
    });
  }

  window.GridLoader = GridLoader;

  new GridLoader(document.querySelector(".grid"), {
    imgPosition: {
      x: 1,
      y: -0.75
    },
    pagemargin: 80,
    onOpenItem: function(instance, item) {
      var win = { width: window.innerWidth, height: window.innerHeight };
      instance.items.forEach(function(el) {
        if (item != el) {
          var delay = Math.floor(Math.random() * 50);
          el.style.WebkitTransition = 'opacity .5s ' + delay + 'ms cubic-bezier(.7,0,.3,1), -webkit-transform .5s ' + delay + 'ms cubic-bezier(.7,0,.3,1)';
          el.style.transition = 'opacity .5s ' + delay + 'ms cubic-bezier(.7,0,.3,1), transform .5s ' + delay + 'ms cubic-bezier(.7,0,.3,1)';
          el.style.WebkitTransform = 'scale3d(0.1,0.1,1)';
          el.style.transform = 'scale3d(0.1,0.1,1)';
          el.style.opacity = 0;
        }
      });
    },
    onCloseItem: function(instance, item) {
      instance.items.forEach(function(el) {
        if (item != el) {
          el.style.WebkitTransition = 'opacity .4s, -webkit-transform .4s';
          el.style.transition = 'opacity .4s, transform .4s';
          el.style.WebkitTransform = 'scale3d(1,1,1)';
          el.style.transform = 'scale3d(1,1,1)';
          el.style.opacity = 1;

          onEndTransition(el, function() {
            el.style.transition = 'none';
            el.style.WebkitTransform = 'none';
          });
        }
      });
    },
    onChangeItem: function(instance, currentItem, nextItem) {
      instance.items.forEach(function(el) {
        if (currentItem === el) {
          // bring the current item to its animated size
          var delay = Math.floor(Math.random() * 50);
          el.style.WebkitTransition = 'opacity .5s ' + delay + 'ms cubic-bezier(.7,0,.3,1), -webkit-transform .5s ' + delay + 'ms cubic-bezier(.7,0,.3,1)';
          el.style.transition = 'opacity .5s ' + delay + 'ms cubic-bezier(.7,0,.3,1), transform .5s ' + delay + 'ms cubic-bezier(.7,0,.3,1)';
          el.style.WebkitTransform = 'scale3d(0.1,0.1,1)';
          el.style.transform = 'scale3d(0.1,0.1,1)';
          el.style.opacity = 0;
        }
        if (nextItem === el) {
          // bring the next item to its usual size
          el.style.WebkitTransition = 'opacity .4s, -webkit-transform .4s';
          el.style.transition = 'opacity .4s, transform .4s';
          el.style.WebkitTransform = 'scale3d(1,1,1)';
          el.style.transform = 'scale3d(1,1,1)';
          el.style.opacity = 1;

          onEndTransition(el, function() {
            el.style.transition = "none";
            el.style.transform = "none";
          });
        }
      });
    }
  });
})(window);
