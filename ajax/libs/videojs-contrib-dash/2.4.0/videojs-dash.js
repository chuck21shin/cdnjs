/*! videojs-contrib-dash - v2.4.0 - 2016-07-07
 * Copyright (c) 2016 Brightcove  */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else if (typeof self !== "undefined"){
    module.exports = self;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
(function (global){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _globalWindow = require('global/window');

var _globalWindow2 = _interopRequireDefault(_globalWindow);

var _videoJs = (typeof window !== "undefined" ? window['videojs'] : typeof global !== "undefined" ? global['videojs'] : null);

var _videoJs2 = _interopRequireDefault(_videoJs);

var _dashjs = (typeof window !== "undefined" ? window['dashjs'] : typeof global !== "undefined" ? global['dashjs'] : null);

var _dashjs2 = _interopRequireDefault(_dashjs);

var isArray = function isArray(a) {
  return Object.prototype.toString.call(a) === '[object Array]';
};

/**
 * videojs-contrib-dash
 *
 * Use Dash.js to playback DASH content inside of Video.js via a SourceHandler
 */

var Html5DashJS = (function () {
  function Html5DashJS(source, tech, options) {
    _classCallCheck(this, Html5DashJS);

    // Get options from tech if not provided for backwards compatibility
    options = options || tech.options_;

    var player = _videoJs2['default'](options.playerId);

    this.tech_ = tech;
    this.el_ = tech.el();
    this.elParent_ = this.el_.parentNode;

    // Do nothing if the src is falsey
    if (!source.src) {
      return;
    }

    // While the manifest is loading and Dash.js has not finished initializing
    // we must defer events and functions calls with isReady_ and then `triggerReady`
    // again later once everything is setup
    tech.isReady_ = false;

    if (Html5DashJS.updateSourceData) {
      source = Html5DashJS.updateSourceData(source);
    }

    var manifestSource = source.src;
    this.keySystemOptions_ = Html5DashJS.buildDashJSProtData(source.keySystemOptions);

    // Save the context after the first initialization for subsequent instances
    Html5DashJS.context_ = Html5DashJS.context_ || {};

    // reuse MediaPlayer if it already exists
    if (!this.mediaPlayer_) {
      this.mediaPlayer_ = _dashjs2['default'].MediaPlayer(Html5DashJS.context_).create();
    }

    // Log MedaPlayer messages through video.js
    if (Html5DashJS.useVideoJSDebug) {
      _videoJs2['default'].log.warn('useVideoJSDebug has been deprecated.' + ' Please switch to using beforeInitialize.');
      Html5DashJS.useVideoJSDebug(this.mediaPlayer_);
    }

    if (Html5DashJS.beforeInitialize) {
      Html5DashJS.beforeInitialize(player, this.mediaPlayer_);
    }

    // Must run controller before these two lines or else there is no
    // element to bind to.
    this.mediaPlayer_.initialize();

    // Apply any options that are set
    if (options.dash && options.dash.limitBitrateByPortal) {
      this.mediaPlayer_.setLimitBitrateByPortal(true);
    } else {
      this.mediaPlayer_.setLimitBitrateByPortal(false);
    }

    this.mediaPlayer_.attachView(this.el_);

    // Dash.js autoplays by default, video.js will handle autoplay
    this.mediaPlayer_.setAutoPlay(false);

    // Attach the source with any protection data
    this.mediaPlayer_.setProtectionData(this.keySystemOptions_);
    this.mediaPlayer_.attachSource(manifestSource);

    this.tech_.triggerReady();
  }

  /*
   * Iterate over the `keySystemOptions` array and convert each object into
   * the type of object Dash.js expects in the `protData` argument.
   *
   * Also rename 'licenseUrl' property in the options to an 'serverURL' property
   */

  Html5DashJS.buildDashJSProtData = function buildDashJSProtData(keySystemOptions) {
    var output = {};

    if (!keySystemOptions || !isArray(keySystemOptions)) {
      return output;
    }

    for (var i = 0; i < keySystemOptions.length; i++) {
      var keySystem = keySystemOptions[i];
      var options = _videoJs2['default'].mergeOptions({}, keySystem.options);

      if (options.licenseUrl) {
        options.serverURL = options.licenseUrl;
        delete options.licenseUrl;
      }

      output[keySystem.name] = options;
    }

    return output;
  };

  Html5DashJS.prototype.dispose = function dispose() {
    if (this.mediaPlayer_) {
      this.mediaPlayer_.reset();
    }
  };

  return Html5DashJS;
})();

_videoJs2['default'].DashSourceHandler = function () {
  return {
    canHandleSource: function canHandleSource(source) {
      var dashExtRE = /\.mpd/i;

      if (_videoJs2['default'].DashSourceHandler.canPlayType(source.type)) {
        return 'probably';
      } else if (dashExtRE.test(source.src)) {
        return 'maybe';
      } else {
        return '';
      }
    },

    handleSource: function handleSource(source, tech, options) {
      return new Html5DashJS(source, tech, options);
    },

    canPlayType: function canPlayType(type) {
      return _videoJs2['default'].DashSourceHandler.canPlayType(type);
    }
  };
};

_videoJs2['default'].DashSourceHandler.canPlayType = function (type) {
  var dashTypeRE = /^application\/dash\+xml/i;
  if (dashTypeRE.test(type)) {
    return 'probably';
  }

  return '';
};

// Only add the SourceHandler if the browser supports MediaSourceExtensions
if (!!_globalWindow2['default'].MediaSource) {
  _videoJs2['default'].getComponent('Html5').registerSourceHandler(_videoJs2['default'].DashSourceHandler(), 0);
}

_videoJs2['default'].Html5DashJS = Html5DashJS;
exports['default'] = Html5DashJS;
module.exports = exports['default'];

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"global/window":1}]},{},[2]);
