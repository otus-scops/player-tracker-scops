// ==UserScript==
// @id             iitc-plugin-PlayerTrackerLabel
// @name           IITC Plugin: Player Tracker Label
// @category       Layer
// @version        1.6.16.20220201.224101
// @namespace      465951658
// @author         465951658
// @updateURL      https://465951658.bitbucket.io/ktA18nVsBF/pT6DbQawHe/PlayerTrackerLabel.meta.js
// @downloadURL    https://465951658.bitbucket.io/ktA18nVsBF/pT6DbQawHe/PlayerTrackerLabel.user.js
// @description    add name label to player tracker
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://intel.ingress.com/*
// @include        http://intel.ingress.com/*
// @match          https://intel.ingress.com/*
// @match          http://intel.ingress.com/*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
  'use strict';
  /* eslint-env jquery */

  // ensure plugin framework is there, even if iitc is not yet loaded
  if (typeof window.plugin !== 'function') window.plugin = function () { };

  //PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
  //(leaving them in place might break the 'About IITC' page or break update checks)
  plugin_info.buildName = '465951658';
  plugin_info.dateTimeVersion = '20220201.224101';
  plugin_info.pluginId = 'playerTrackerLabel';
  //END PLUGIN AUTHORS NOTE

  // PLUGIN START ////////////////////////////////////////////////////////
  /* change log
   * 1.6.16: setting version 2
   *         change setting load/save sequence
   *         mobile:iOS:setting dialog keep value on returning from remarked players dialog
   * 1.5.15: Change namespace implement.
   *         change implementation to fit label layer active state to player tracker on separateLayer mode
   *         support playerTrackerCustomizer
   *         specify dialog id (to fix dialog not to be overlap)
   *         mobile: dialog transition behavior for iOS.
   *         mobile: on displaying the setting dialog from the tool palette, return to map display.
   * 1.4.14: including remarks setting in setting dialog
   *         support intel.ingress.com
   * 1.3.13: set dialog default focus
   * 1.2.12: change namespace
   * 1.2.11: support remarked player name alias, combine overlapped label
   * 1.1.10: label horizontal/vertical Align setting
   * 1.0.9:  change version expresson (major.minor.build)
   * 0.2.0:  separate remarked player function to RemarkPlayer plugin
   * 0.1.2:  Do not display labels when the zoom factor is lower than PLAYER_TRACKER_MIN_ZOOM
   * 0.1.0:  remarck player description
   * 0.0.4:  separate layer option: label can be drawn on a label layer (changed by setting)
   * 0.0.3:  first public version: 
   * 0.0.2:  add remarked player function
   * 0.0.1:  initial version
   */
  /////////////////////////////////////////////////////////////////////////////
  // namespace window.plugin.remarkPlayer
  // use own namespace for plugin
  window.plugin.playerTrackerLabel = {};
  window.plugin.playerTrackerLabel.loadCompleated = false;
  /////////////////////////////////////////////////////////////////////////////
  // namespace window.plugin.remarkPlayer
  (function (playerTrackerLabel) {
    /////////////////////////////////////////////////////////////////////////////
    // external value
    playerTrackerLabel.initialized = false;
    playerTrackerLabel.supportPlayerTrackerCustomizer = true; // always true
  
    /////////////////////////////////////////////////////////////////////////////
    // values
    // layer
    var labelLayerEnl_ = null;
    var labelLayerRes_ = null;
    var labelLayerEnlEnable_ = true;
    var labelLayerResEnable_ = true;
    /////////////////////////////////////////////////////////////////////////////
    // CONST VALUES
    /////////////////////////////////////////////////////////////////////////////
    const LAYER_NAME_ENLIGHTENED = 'Player Tracker Label Enlightened';
    const LAYER_NAME_RESISTANCE = 'Player Tracker Label Resistance';

    const KEY_STORAGE = 'plugin-playerTrackerLabel';

    const LABEL_PADDING = 2; // px
    const PLAYER_TRACKER_MARCKER_WIDTH = 25; // px
    const PLAYER_TRACKER_MARCKER_HEIGHT = 41; // px

    const LABEL_CIMBINE_DISTANCE = 20; // px
    /////////////////////////////////////////////////////////////////////////////
    // setting values
    const VerticalAlign = {
      Top: 'top',
      Middle: 'middle',
      Bottom: 'bottom',
    };
    const HorizontalAlign = {
      Left: 'left',
      Center: 'center',
      Right: 'right',
    };
    const RemarksFilter = {
      None: 'none',
      Remark: 'remark',
      NotRemark: 'notRemark',
      Highlight: 'highlight',
      NotHighlight: 'notHighlight',
      RemarkExceptHighlight: 'remarkExceptHighlight',
    };

    const SETTING_DEFAULT = {
      separateLayerFlag: false,
      labelFontSize: 12, // label font size (px)
      labelVerticalAlign: VerticalAlign.Top,
      labelHorizontalAlign: HorizontalAlign.Center,
      // labelFilterByRemarkPlayer: RemarksFilter.None,
    };
    var setting_ = {};
    /////////////////////////////////////////////////////////////////////////////
    // setup
    /////////////////////////////////////////////////////////////////////////////
    var setupRetryCount_ = 0;
    var setupStarted_ = false;

    playerTrackerLabel.setup = function () {
      // wait for initialization of a PlayerTracker plug-in.
      if (setupStarted_) {
        console.log('playerTrackerLabel:allready initialized.');
        return;
      }
      console.log('playerTrackerLabel:setup:start.');
      if (!checkPluginsReferencedBySetupIsLoded()) {
        setupRetryCount_++;
        if (setupRetryCount_ <= 20) {
          console.log('playerTrackerLabel:setup:This plugin requires player tracker.. retry...');
          setTimeout(window.plugin.playerTrackerLabel.setup, 500);
        }
        else {
          console.log('playerTrackerLabel:setup:This plugin requires player tracker.');
        }
        return;
      }
      setupStarted_ = true;

      // Initialize this plugin ///
      // local strage
      setupStorage();
      setting_ = loadSetting();

      // setting
      if (setting_.separateLayerFlag) {
        console.log('playerTrackerLabel:separateLayerFlag mode');
      }
      console.log('playerTrackerLabel:font:' + setting_.labelFontSize + ' vert:' + setting_.labelVerticalAlign + ' Hor:' + setting_.labelHorizontalAlign);
      // console.log('playerTrackerLabel:filter:' + setting_.labelFilterByRemarkPlayer);

      // style sheat
      $('<style>').prop('type', 'text/css').html(''
        + '.playerTrackerLabel {'
          + 'color:black;'
          + 'font-size:' + setting_.labelFontSize + 'px;'
          // + 'line-height:' + (setting_.labelFontSize + 1) + 'px;'
          + 'line-height:' + (setting_.labelFontSize) + 'px;'
          + 'text-align:center;'
          + 'margin:0; padding:0px;'
          // + 'padding:' + LABEL_PADDING + 'px;'
          + 'overflow:visible;'
          //+ 'overflow:hidden;'
          + 'white-space:nowrap;'
          //+ 'border-style:solid;border-width:thin;'
          + 'pointer-events:none;'
        + '}'
        + '.playerTrackerLabel-textbox {'
          + 'position: relative;'
          + 'width: 100%;'
          + 'height: 100%;'
          + 'margin:0; padding:0;'
          //+ 'border-style:solid;border-width:thin;'
          + 'text-align: center;'
        + '}'
        + '.playerTrackerLabel-textbox-inner {'
          + 'position: absolute;'
          + 'width: 100%;'
          + 'margin:0; padding:0;'
          + 'text-align: '+ setting_.labelHorizontalAlign + ';'
          // + 'text-align: center;'
          //+ 'bottom: 0;'
          //+ 'border-style:solid;border-width:thin;'
        + '}'
          // Enl: 92d181, 70cc43, 91DA6D, 01EE01
          // Res: bec0f7, 969AF8, 9A9AFF, 00B7FF
        + '.playerTrackerLabel-text-Enl {color:black; text-shadow:1px 1px #91DA6D,1px -1px #91DA6D,-1px 1px #91DA6D,-1px -1px #91DA6D, 0 0 5px #91DA6D;}'
        + '.playerTrackerLabel-text-Res {color:black; text-shadow:1px 1px #9A9AFF,1px -1px #9A9AFF,-1px 1px #9A9AFF,-1px -1px #9A9AFF, 0 0 5px #9A9AFF;}'
  //      + '.playerTrackerLabel-text-Enl {color:black; text-shadow:1px 1px #92d181,1px -1px #70cc43,-1px 1px #92d181,-1px -1px #92d181, 0 0 5px #92d181;}'
  //      + '.playerTrackerLabel-text-Res {color:black; text-shadow:1px 1px #bec0f7,1px -1px #bec0f7,-1px 1px #bec0f7,-1px -1px #bec0f7, 0 0 5px #bec0f7;}'
        + '.playerTrackerLabel-text-Enl-highlight {color:red; text-shadow:1px 1px #91DA6D,1px -1px #91DA6D,-1px 1px #91DA6D,-1px -1px #91DA6D, 0 0 5px #91DA6D;}'
        + '.playerTrackerLabel-text-Res-highlight {color:red; text-shadow:1px 1px #9A9AFF,1px -1px #9A9AFF,-1px 1px #9A9AFF,-1px -1px #9A9AFF, 0 0 5px #9A9AFF;}'
  //      + '.playerTrackerLabel-text-Enl-highlight {color:red; text-shadow:1px 1px #92d181,1px -1px #70cc43,-1px 1px #92d181,-1px -1px #92d181, 0 0 5px #92d181;}'
  //      + '.playerTrackerLabel-text-Res-highlight {color:red; text-shadow:1px 1px #bec0f7,1px -1px #bec0f7,-1px 1px #bec0f7,-1px -1px #bec0f7, 0 0 5px #bec0f7;}'

        // dialog
        + '.playerTrackerLabel-dialog-groupDiv { margin:10px auto; } '
        + '.playerTrackerLabel-dialog-linkButton { display:inline-block; color:#ffce00; border:1px solid #ffce00; padding:2px 5px; margin:10x auto; text-align:center; background:rgba(8,48,78,.9); }'
        + '.playerTrackerLabel-dialog-linkButtonBlock { display:block; color:#ffce00; border:1px solid #ffce00; padding:3px 0; margin:10px auto; width:80%; text-align:center; background:rgba(8,48,78,.9); }'
      ).appendTo('head');
      // 7E81D5
      
      if (!window.plugin.playerTrackerCustomizer) {
        // toolbox
        $('#toolbox').append(' <a id="playerTrackerLabel-toolboxCommand" title="Player Label Options">Player Label</a>');
        $('#playerTrackerLabel-toolboxCommand').click(toolboxUI);
      }

      // utility
      setupUtility();

      // layer
      setupLayerGroup();

      // hook
      window.addHook('publicChatDataAvailable', handleData);
      window.addHook('iitcLoaded', onIitcLoaded);

      playerTrackerLabel.initialized = true;
      // setup end
      console.log('playerTrackerLabel:setup:Compleated.');
    };
    // setup
    var setup = window.plugin.playerTrackerLabel.setup;

    ///////////////////////////////////////////////////////////////////////////
    // 
    var onIitcLoaded = function() {
      // Leaflet Event
      if (setting_.separateLayerFlag) {
        if (!window.useAndroidPanes()) {
          window.map.on('layeradd', onLayerAdd);
          window.map.on('layerremove', onLayerRemove);
        }
        window.map.on('zoomend', onZoomEnd);
      }
    };

    ///////////////////////////////////////////////////////////////////////////// 
    // Reference Plugin
    ///////////////////////////////////////////////////////////////////////////// 
    var checkPluginsReferencedBySetupIsLoded = function() {
      return checkPlayerTrackerPluginLoded();
    };
    var checkPlayerTrackerPluginLoded = function() {
      return window.plugin.playerTracker && window.plugin.playerTracker.drawnTracesRes && window.plugin.playerTracker.drawnTracesEnl;
    };
    var checkRemarkPlayerPluginLoded = function() {
      return window.plugin.remarkPlayer && window.plugin.remarkPlayer.initialized;
    };
    /////////////////////////////////////////////////////////////////////////////
    // draw label
    /////////////////////////////////////////////////////////////////////////////
    playerTrackerLabel.drawData = function () {
      if (!window.plugin.playerTracker) {
        return;
      }
      var getLatLng = window.plugin.playerTracker.getLatLngFromEvent; // getLatLngFromEvent func
      var ago = window.plugin.playerTracker.ago; // ago func
      var isTouchDev = window.isTouchDevice();
      var split = PLAYER_TRACKER_MAX_TIME / 4;
      var now = new Date().getTime();
      var labelDataList = [];

      $.each(window.plugin.playerTracker.stored, function (plrname, playerData) {
        // process each player
        if (!playerData || playerData.events.length === 0) {
          console.warn('broken player data for plrname=' + plrname);
          return true;
        }
        var evLength = playerData.events.length;
        var last = playerData.events[evLength - 1];
        var latlng = getLatLng(last);
        var point = window.map.project(latlng);
        var cls;
        var text;
        var remarkFlag = false;
        var highlightFlag = false;
        var remarkData = playerTrackerLabel.getRemarkPlayerData(plrname);
        if (remarkData === null) {
          // RemarkPlayer library is desable
          text = plrname;
          remarkFlag = false;
          highlightFlag = false;
        }
        else {
          // RemarkPlayer library is enable
          remarkFlag = remarkData.remark;
          if (remarkData.nameString) {
            text = remarkData.nameString;
          }
          else {
            text = plrname;
          }
          highlightFlag = remarkData.highlight;

          /*
          // remark Filter
          switch (setting_.labelFilterByRemarkPlayer) {
            case RemarksFilter.Remark:
              if (!remarkFlag) { return; }
              break;
            case RemarksFilter.NotRemark:
              if (remarkFlag) { return; }
              break;
            case RemarksFilter.Highlight:
              if (!highlightFlag) { return; }
              break;
            case RemarksFilter.NotHighlight:
              if (highlightFlag) { return; }
              break;
            case RemarksFilter.RemarkExceptHighlight:
              if (!remarkFlag) { return; }
              if (highlightFlag) { return; }
              break;
            case RemarksFilter.None:
            default:
              break;
          }
          */
        }
        text = text + '(' + ago(last.time, now) + ')';
        var width = measureTextWidth(text);
  //      var width = measureTextWidth(text) + (LABEL_PADDING * 2);
  //      var width = text.length * setting_.labelFontSize / 2 + LABEL_PADDING * 2;
        var height = setting_.labelFontSize;
        //console.log('font:' + setting_.labelFontSize + ', w:' + width + ', h:'+ height);
        var textHtml = window.plugin.playerTrackerLabel.buildPlayerLabelHtml(text, playerData.team, highlightFlag);
        var layer = (playerData.team === 'RESISTANCE' ? labelLayerRes_ : labelLayerEnl_);

        // check and store overlapped data
        var labelData = null;
        var i, len = labelDataList.length;
        for (i = 0; i < len; i++) {
          var ld = labelDataList[i];
          if (ld.team != playerData.team) { continue; }
          if (ArrayIndexOf(ld.names, plrname) >= 0) {
            continue;
          }
          if (ld.point.distanceTo(point) <= LABEL_CIMBINE_DISTANCE) {
            //console.log("overlapping player:" + plrname);
            //console.log(ld);
            labelData = ld;
            break;
          }
        }
        if (labelData == null) { // first label on point
          var names = [];
          names.push(plrname);
          labelData = {
            id: 0,
            html: textHtml,
            names: names,
            team: playerData.team,
            latlng: latlng,
            point: point,
            height: height,
            width: width,
          };
          labelDataList.push(labelData);
        }
        else { // same point label is exists
          textHtml = labelData.html + '<br/>' + textHtml; // combine text
          latlng = new L.LatLng(
                    labelData.latlng.lat + (latlng.lat - labelData.latlng.lat)/(labelData.names.length + 1),
                    labelData.latlng.lng + (latlng.lng - labelData.latlng.lng)/(labelData.names.length + 1)
          );
          point = window.map.project(latlng);
          height = labelData.height + height;
          width = (labelData.width > width) ? labelData.width : width;

          labelData.html = textHtml;
          labelData.names.push(plrname);
          labelData.latlng = latlng;
          labelData.point = point;
          labelData.height = height;
          labelData.width = width;

          if (labelData.id > 0) {
            layer.removeLayer(labelData.id); // remove previously drawn label
          }
        }
        //console.log(labelData);

        var vertical;
        if (setting_.labelVerticalAlign === VerticalAlign.Bottom) {
          vertical = 0;
        }
        else if (setting_.labelVerticalAlign === VerticalAlign.Middle) {
          vertical = (PLAYER_TRACKER_MARCKER_HEIGHT + height) / 2 + 1;
        }
        else { // setting_.labelVerticalAlign === VerticalAlign.Top
          vertical = PLAYER_TRACKER_MARCKER_HEIGHT + height + 1;
        }
        var horizontal;
        if (setting_.labelHorizontalAlign === HorizontalAlign.Left) {
          horizontal = 0;
        }
        else if (setting_.labelHorizontalAlign === HorizontalAlign.Right) {
          horizontal = width;
        }
        else { // setting_.labelHorizontalAlign === HorizontalAlign.Center
          horizontal = width / 2;
        }
        //console.log("v:" + vertical + ", h:"+ horizontal);
        var marker = L.marker(latlng, {
          icon: L.divIcon({
            className: 'playerTrackerLabel',
            html: window.plugin.playerTrackerLabel.buildMarkerHtml(textHtml),
            iconAnchor: [horizontal, vertical],
            iconSize: [width, height],
          })
        });
        layer.addLayer(marker);
        labelData.id = layer.getLayerId(marker)
        // window.registerMarkerForOMS(marker);
        if (!isTouchDev) { window.setupTooltips($(marker._icon)); }
      });
      labelDataList = [];
    };

    // handle data
    playerTrackerLabel.buildPlayerLabelHtml = function(text, team, highlight) {
      var textStyle = '';
      if (highlight) {
        textStyle = (team === 'RESISTANCE' ? 'playerTrackerLabel-text-Res-highlight' : 'playerTrackerLabel-text-Enl-highlight');
      }
      else {
        textStyle = (team === 'RESISTANCE' ? 'playerTrackerLabel-text-Res' : 'playerTrackerLabel-text-Enl');
      }
      return '<span class="' + textStyle + '">' + text + '</span>';
    };

    playerTrackerLabel.buildMarkerHtml = function(playerLabel) {
      return '<div class="playerTrackerLabel-textbox"><div class="playerTrackerLabel-textbox-inner"><span>' + playerLabel + '</span></div></div>';
    };

    // handle data
    var handleData = function (data) {
      if (!window.plugin.playerTracker) { return; }
      if (window.map.getZoom() < window.PLAYER_TRACKER_MIN_ZOOM) { return; }
      //console.log('playerTrackerLabel:handleData [count:' + Object.keys(window.plugin.playerTracker.stored).length + '].');
      try {
        if (setting_.separateLayerFlag) {
          labelLayerEnl_.clearLayers();
          labelLayerRes_.clearLayers();
          if (window.useAndroidPanes()) {
            checkAndFitChangePlayerTrackerLayerState();
          }
        }
        playerTrackerLabel.drawData();
      }
      catch(e) {
        console.log('playerTrackerLabel:handleData:error occurrd.');
      }
      //console.log('playerTrackerLabel:handleData end.');
    };

    var setupLayerGroup = function () {
      if (setting_.separateLayerFlag) {
        labelLayerEnl_ = new L.LayerGroup();
        labelLayerRes_ = new L.LayerGroup();
        // to avoid any favouritism, we'll put the player's own faction layer first
        if (PLAYER.team === 'RESISTANCE') {
          window.addLayerGroup(LAYER_NAME_RESISTANCE, labelLayerRes_, true);
          window.addLayerGroup(LAYER_NAME_ENLIGHTENED, labelLayerEnl_, true);
        } else {
          window.addLayerGroup(LAYER_NAME_ENLIGHTENED, labelLayerEnl_, true);
          window.addLayerGroup(LAYER_NAME_RESISTANCE, labelLayerRes_, true);
        }
      }
      else {
        labelLayerEnl_ = window.plugin.playerTracker.drawnTracesEnl;
        labelLayerRes_ = window.plugin.playerTracker.drawnTracesRes;
      }
    };

    /////////////////////////////////////////////////////////////////////////////
    // remark
    playerTrackerLabel.getRemarkPlayerData = function (name) {
      if (!checkRemarkPlayerPluginLoded()) { return null; }
      return {
            nameString: window.plugin.remarkPlayer.getRemarkPlayerCombinedNameHtmlString(name, false),
            remark: window.plugin.remarkPlayer.isRemarkPlayer(name),
            highlight: window.plugin.remarkPlayer.getRemarkPlayerHighlightFlag(name),
            };
    };

    var dialogRemarkPlayers = function (option) {
      if (!checkRemarkPlayerPluginLoded()) { return; }
      window.plugin.remarkPlayer.remarkPlayersDialog(option);
    };

    /////////////////////////////////////////////////////////////////////////////
    // label layer state
    /////////////////////////////////////////////////////////////////////////////
    var getOverlayLayer = function(name) {
      var layers = window.layerChooser.getLayers();
      var overlayLayers = layers.overlayLayers;
      var layer = overlayLayers.find(function(layer) { return layer.name === this; }, name);
      return layer;
    };
    var getOverlayLayerId = function(name) {
      var layer = getOverlayLayer(name);
      return layer.layerId;
    };
    var showOverlayLayer = function(id, show) {
      //setTimeout(function() {
        window.layerChooser.showLayer(id, show);
      //}, 50);
    };

    // layer id 
    var labelLayerEnlId_ = undefined;
    var labelLayerResId_ = undefined;

    var getEnlLayerId = function() {
      if (labelLayerEnlId_ === undefined) {
        labelLayerEnlId_ = getOverlayLayerId(LAYER_NAME_ENLIGHTENED);
      }
      return labelLayerEnlId_;
    };
    var getResLayerId = function() {
      if (labelLayerResId_ === undefined) {
        labelLayerResId_ = getOverlayLayerId(LAYER_NAME_RESISTANCE);
      }
      return labelLayerResId_;
    };

    // layer active
    var getEnlTrackerLayerActive = function() {
      return window.map.hasLayer(window.plugin.playerTracker.drawnTracesEnl);
    };
    var getResTrackerLayerActive = function() {
      return window.map.hasLayer(window.plugin.playerTracker.drawnTracesRes);
    };
    var getEnlLayerActive = function() {
      return window.map.hasLayer(labelLayerEnl_);
    };
    var getResLayerActive = function() {
      return window.map.hasLayer(labelLayerRes_);
    };

    // layerChooser enable/disable
    var layerChooserSetState = function(id, name, enable, active) {
      if (window.useAndroidPanes()) {
        showOverlayLayer(id, active);
        return;
      }
      var layerSelectorTitleSpan = $('.leaflet-control-layers-selector + span:contains("' + name + '")');
      if (!layerSelectorTitleSpan) { return; }
      var layerSelector = layerSelectorTitleSpan.parent();
      if (!layerSelector) { return; }
      var input = layerSelector.children('input');
      if (enable) {
        layerSelector.removeClass('disabled').attr('title', '');
      }
      else {
        layerSelector.addClass('disabled').attr('title', 'Player Tracker layer desabled.');
      }
      if (active) {
        input.prop("checked", true);
      }
      else {
        input.prop("checked", false);
      }
    };

    // layer state
    var changeEnlLayerState = function(enable, active) {
      layerChooserSetState(getEnlLayerId(), LAYER_NAME_ENLIGHTENED, enable, active);
    };
    var changeResLayerState = function(enable, active) {
      layerChooserSetState(getResLayerId(), LAYER_NAME_RESISTANCE, enable, active);
    };

    // sync(fit) label layer state with player tracker layer state
    var checkAndFitChangePlayerTrackerLayerState = function() {
      if (!setting_.separateLayerFlag) { return; }
      // Enlightened
      if (!getEnlTrackerLayerActive() && getEnlLayerActive()) {
        console.log('playerTrackerLabel.onChangePlayerTrackerLayerState:Change Enl');
        changeEnlLayerState(false, false);
      }
      // Resistance
      if (!getResTrackerLayerActive() && getResLayerActive()) {
        console.log('playerTrackerLabel.onChangePlayerTrackerLayerState:Change Res');
        changeResLayerState(false, false);
      }
    };

    /////////////////////////////////////////////////////////////////////////////
    // Leaflet event
    /////////////////////////////////////////////////////////////////////////////
    var onLayerAdd = function (data) {
      if (!setting_.separateLayerFlag) { return; }
      // console.log('playerTrackerLabel:onLayerAdd');
      if (data.layer === window.plugin.playerTracker.drawnTracesEnl) {
        console.log('playerTrackerLabel:onLayerAdd:playerTracker:Enl');
        changeEnlLayerState(true, labelLayerEnlEnable_);
      }
      else if (data.layer === window.plugin.playerTracker.drawnTracesRes) {
        console.log('playerTrackerLabel:onLayerAdd:playerTracker:Res');
        changeResLayerState(true, labelLayerResEnable_);
      }
    };

    var onLayerRemove = function (data) {
      if (!setting_.separateLayerFlag) { return; }
      // console.log('playerTrackerLabel:onLayerRemove');
      if (data.layer === window.plugin.playerTracker.drawnTracesEnl) {
        console.log('playerTrackerLabel:onLayerRemove:playerTrackerEnl');
        labelLayerEnlEnable_ = getEnlLayerActive();
        changeEnlLayerState(false, false);
      }
      else if (data.layer === window.plugin.playerTracker.drawnTracesRes) {
        console.log('playerTrackerLabel:onLayerRemove:playerTracker:Res');
        labelLayerResEnable_ = getResLayerActive();
        changeResLayerState(false, false);
      }
    };

    var onZoomEnd = function () {
      if (!setting_.separateLayerFlag) { return; }
      // console.log('playerTrackerLabel:onZoomEnd');
      if (window.map.getZoom() < window.PLAYER_TRACKER_MIN_ZOOM) {
        labelLayerEnl_.clearLayers();
        labelLayerRes_.clearLayers();
      }
    };

    /////////////////////////////////////////////////////////////////////////////
    // toolbox
    /////////////////////////////////////////////////////////////////////////////
    var toolboxUI = function () {
      if(window.useAndroidPanes()){ window.show('map'); }
      dialogSetting();
    };

    playerTrackerLabel.dialogSettingBuildHtml = function() {
      return '' 
      + '<div>font size: <input type="number" id="playerTrackerLabel-dialogSetting-labelFontSize" min="5" max="30" step="1"></input></div>'
      + '<div><dl>'
      + '<dt>align:</dt>'
      + '<dd>vertical: '
      + '<select id="playerTrackerLabel-dialogSetting-labelVerticalAlign">'
      + '<option value="' + VerticalAlign.Top + '">top</option>'
      + '<option value="' + VerticalAlign.Middle + '">middle</option>'
      + '<option value="' + VerticalAlign.Bottom + '">bottom</option>'
      + '</select>'
      + '</dd>'
      + '<dd>horizontal: '
      + '<select id="playerTrackerLabel-dialogSetting-labelHorizontalAlign">'
      + '<option value="' + HorizontalAlign.Left + '">left</option>'
      + '<option value="' + HorizontalAlign.Center + '">center</option>'
      + '<option value="' + HorizontalAlign.Right + '">right</option>'
      + '</select>'
      + '</dd>'
      + '</dl></div>'
      + '<div class="playerTrackerLabel-dialog-groupDiv" id="playerTrackerLabel-dialogSetting-remarkPlayer"><dl>'
      + '<dt>remarks:</dt>'
      + '<dd><a class="playerTrackerLabel-dialog-linkButton" id="playerTrackerLabel-dialogSetting-RemarkPlayerSetting">remarked players</a></dd>'
      /*
      + '<dd>display filter: '
      + '<select id="playerTrackerLabel-dialogSetting-labelFilterByRemarkPlayer">'
      + '<option value="' + RemarksFilter.None + '">none</option>'
      + '<option value="' + RemarksFilter.Remark + '">remark</option>'
      + '<option value="' + RemarksFilter.Highlight + '">highlight</option>'
      + '<option value="' + RemarksFilter.NotRemark + '">not remark</option>'
      + '<option value="' + RemarksFilter.NotHighlight + '">not highlight</option>'
      + '<option value="' + RemarksFilter.RemarkExceptHighlight + '">remark except highlight</option>'
      + '</select>'
      + '</dd>'
      */
      + '</dl></div>'
      + '<div class="playerTrackerLabel-dialog-groupDiv"><input type="checkbox" id="playerTrackerLabel-dialogSetting-SeparateLayer">draw labels on own layer</input></div>'
    };

    playerTrackerLabel.dialogSettingOnOpen = function(dlgEventData) {
      console.log('playerTrackerLabel:dialogSettingOnOpen');
      // set cueent setting value
      var setting = loadSetting();
      dialogSettingSetValues(setting);

      // click action
      if (checkRemarkPlayerPluginLoded()) {
        $('#playerTrackerLabel-dialogSetting-RemarkPlayerSetting').on('click', dlgEventData, dialogSettingOnRemarkPlayerSetting);
      }
      else {
        $('#playerTrackerLabel-dialogSetting-remarkPlayer').hide();
      }
    };

    playerTrackerLabel.dialogSettingOnOk = function() {
      console.log('playerTrackerLabel:dialogSettingOnOk');
      var setting = loadSetting();
      var valuesResult = dialogSettingGetValues(setting);
      if (valuesResult.saveFlag) {
        saveSetting(valuesResult.setting);
      }
    };

    var dialogSettingOnRemarkPlayerSetting = function(dialogSettingEventData) {
      var setting = loadSetting();
      var valuesResult = dialogSettingGetValues(setting);
      var saveValuesData = {};
      if (dialogSettingEventData.data.dlgSaveValuesFunc) {
        saveValuesData = dialogSettingEventData.data.dlgSaveValuesFunc();
      }
      dialogRemarkPlayers({
        onPreOpen: function(eventData) {
          if (platformIsModalDialogOnly()) {
            // iOS iitc has a limitation that only one dialog can be shown at a time
            // close dialogSetting dialog
            dialogSettingEventData.data.dlg.dialog('close');
          }
        },
        onClose: function(eventData) {
          if (platformIsModalDialogOnly()) {
            // iOS iitc has a limitation that only one dialog can be shown at a time
            // re-open dialog
            dialogSettingEventData.data.dlgReOpenFunc();
            dialogSettingSetValues(valuesResult.setting);
            if (dialogSettingEventData.data.dlgRestoreValuesFunc) {
              dialogSettingEventData.data.dlgRestoreValuesFunc(saveValuesData);
            }
          }
        },
      });
    };
    
    var dialogSettingSetValues = function(setting) {
      if (!setting) {
        setting = SETTING_DEFAULT;
      }
      $('#playerTrackerLabel-dialogSetting-SeparateLayer').prop("checked", setting.separateLayerFlag);
      $('#playerTrackerLabel-dialogSetting-labelFontSize').val(setting.labelFontSize);
      $('#playerTrackerLabel-dialogSetting-labelVerticalAlign').val(setting.labelVerticalAlign);
      $('#playerTrackerLabel-dialogSetting-labelHorizontalAlign').val(setting.labelHorizontalAlign);
      // $('#playerTrackerLabel-dialogSetting-labelFilterByRemarkPlayer').val(setting.labelFilterByRemarkPlayer);
    };

    var dialogSettingGetValues = function(setting) {
      // copy current
      if (setting) {
        setting = $.extend(true, {}, setting);
      }
      else {
        setting = $.extend(true, {}, SETTING_DEFAULT);
      }
      var saveFlag = false;
      var value;

      value = $('#playerTrackerLabel-dialogSetting-SeparateLayer').prop('checked');
      if (value !== setting.separateLayerFlag) {
        setting.separateLayerFlag = value;
        saveFlag = true;
      }
      value = Number($('#playerTrackerLabel-dialogSetting-labelFontSize').val());
      if (value != setting.labelFontSize) {
        setting.labelFontSize = value;
        saveFlag = true;
      }
      value = $('#playerTrackerLabel-dialogSetting-labelVerticalAlign').val();
      if (value != setting.labelVerticalAlign) {
        setting.labelVerticalAlign = value;
        saveFlag = true;
      }
      value = $('#playerTrackerLabel-dialogSetting-labelHorizontalAlign').val();
      if (value != setting.labelHorizontalAlign) {
        setting.labelHorizontalAlign = value;
        saveFlag = true;
      }
      /*
      value = $('#playerTrackerLabel-dialogSetting-labelFilterByRemarkPlayer').val();
      if (value != setting.labelFilterByRemarkPlayer) {
        setting.labelFilterByRemarkPlayer = value;
        saveFlag = true;
      }
      */
      return { setting:setting, saveFlag:saveFlag };
    };

    var dialogSetting = function () {
      var html = '<div>' + 
        playerTrackerLabel.dialogSettingBuildHtml() +
        '<div><p>All settings will be effective after reload.</p></div>' +
        '</div>';

      var dlg = window.dialog({
        html: html,
        dialogClass: 'playerTrackerLabel-dialogSetting',
        id: 'playerTrackerLabel-dialogSetting',
        title: 'Setting',
        buttons: {
          'OK' : function() { 
            playerTrackerLabel.dialogSettingOnOk();
            $(this).dialog('close');
          },
          'Cancel' : function() { $(this).dialog('close'); }
        },
      });
      playerTrackerLabel.dialogSettingOnOpen({dlg:dlg, dlgReOpenFunc:dialogSetting});
      // focus
      dlg.siblings('.ui-dialog-buttonpane').find('button:eq(0)').focus();
    };

    /////////////////////////////////////////////////////////////////////////////
    // local storage access
    /////////////////////////////////////////////////////////////////////////////
    const STORAGE_KEY_VERSION = 'Version';
    const STORAGE_KEY_SETTING = 'setting';

    const V1_KEY_STORAGE = 'plugin-player-tracker-label';
    const V1_STORAGE_KEY_SETTINGS = 'settings';
    const V1_SETTING_SEPARATE_LAYER = 'SeparateLayer';
    const V1_SETTING_LABEL_FONT_SIZE = 'LabelFontSize';
    const V1_SETTING_LABEL_VERTICAL_ALIGN = 'LabelVerticalAlign';
    const V1_SETTING_LABEL_HORIZONTAL_ALIGN = 'LabelHorizontalAlign';

    // storage data
    var storageData_ = {};
    // Version
    const STORAGE_VERSION_000 = 0;
    const STORAGE_VERSION_001 = 1;
    const STORAGE_VERSION_002 = 2;
    // Cureent Version
    const STORAGE_VERSION = STORAGE_VERSION_002;

    // clear strage data
    var clearStorage = function () {
      localStorage.removeItem(KEY_STORAGE);
    };

    // setup strage data
    var setupStorage = function () {
      var saveFlag = false;
      var storageData;
      if (localStorage[KEY_STORAGE] == null) {
        if (localStorage[V1_KEY_STORAGE] == null) {
          // new strage data
          storageData = {};
          storageData[STORAGE_KEY_VERSION] = STORAGE_VERSION;
          saveFlag = true;
        }
        else {
          // load V1 strage data
          storageData = JSON.parse(localStorage[V1_KEY_STORAGE]);
        }
      }
      else {
        // load strage data
        storageData = JSON.parse(localStorage[KEY_STORAGE]);
      }
      if (storageData[STORAGE_KEY_VERSION] == null) {
        // if storage version is undefined then storage version is zero
        storageData[STORAGE_KEY_VERSION] = STORAGE_VERSION_000;
      }
      if (storageData[STORAGE_KEY_VERSION] < STORAGE_VERSION) {
        // migrate storage data
        saveFlag = migrateStorage(storageData);
      }
      /*
      * setup default
      */
      // settings
      if (storageData[STORAGE_KEY_SETTING] == null) {
        storageData[STORAGE_KEY_SETTING] = {};
        saveFlag = true;
      }
      var setting = storageData[STORAGE_KEY_SETTING];
      for (var key in SETTING_DEFAULT) {
        if (!setting.hasOwnProperty(key)) {
          setting[key] = SETTING_DEFAULT[key];
          saveFlag = true;
        }
      }
      /*
      * save
      */
      if (saveFlag) {
        localStorage[KEY_STORAGE] = JSON.stringify(storageData);
      }
    };

    // migrate strage data to current version
    var migrateStorage = function (storageData) {
      if (storageData[STORAGE_KEY_VERSION] >= STORAGE_VERSION) {
        // Migration is not need
        return false;
      }
      console.log('playerTrackerLabel:migrateStorage Start');
      console.log(storageData);
      var saveFlag = false;
      // version 0 -> version 1
      if (storageData[STORAGE_KEY_VERSION] <= STORAGE_VERSION_000) {
        console.log('playerTrackerLabel:migrateStorage:0->1');
        // remarked player management function has been separated into RemarkPlayer plugin
        // here it only convert the settings of the old version to the newest pre-separateing settings
        var STORAGE_KEY_REMARK_PLAYERS = 'remarkPlayers';
        var list = storageData[STORAGE_KEY_REMARK_PLAYERS];
        var remarks = {};
        var i, len = list.length;
        for (i = 0; i < len; i++) {
          remarks[list[i]] = {};
        }
        // delete old
        delete storageData[STORAGE_KEY_REMARK_PLAYERS];
        if (storageData[V1_STORAGE_KEY_SETTINGS] != null) {
          delete storageData[V1_STORAGE_KEY_SETTINGS];
        }
        // set version
        storageData[STORAGE_KEY_VERSION] = STORAGE_VERSION_001;
        storageData[STORAGE_KEY_REMARK_PLAYERS] = remarks;
        saveFlag = true;
      }
      // version 1 -> version 2
      if (storageData[STORAGE_KEY_VERSION] <= STORAGE_VERSION_001) {
        console.log('playerTrackerLabel:migrateStorage:1->2');
        if (storageData[V1_STORAGE_KEY_SETTINGS] != null) {
          var settingsV1 = storageData[V1_STORAGE_KEY_SETTINGS];
          storageData[STORAGE_KEY_SETTING] = {};
          saveFlag = true;
          var settingV2 = storageData[STORAGE_KEY_SETTING]
          if (settingsV1[V1_SETTING_SEPARATE_LAYER]) {
            settingV2.separateLayerFlag = settingsV1[V1_SETTING_SEPARATE_LAYER];
          }
          if (settingsV1[V1_SETTING_LABEL_FONT_SIZE]) {
            settingV2.labelFontSize = settingsV1[V1_SETTING_LABEL_FONT_SIZE];
          }
          if (settingsV1[V1_SETTING_LABEL_VERTICAL_ALIGN]) {
            settingV2.labelVerticalAlign = settingsV1[V1_SETTING_LABEL_VERTICAL_ALIGN];
          }
          if (settingsV1[V1_SETTING_LABEL_HORIZONTAL_ALIGN]) {
            settingV2.labelHorizontalAlign = settingsV1[V1_SETTING_LABEL_HORIZONTAL_ALIGN];
          }
          // delete old
          delete storageData[V1_STORAGE_KEY_SETTINGS];
          // set version
          storageData[STORAGE_KEY_VERSION] = STORAGE_VERSION_002;
        }
      }
      console.log(storageData);
      console.log('playerTrackerLabel:migrateStorage End');

      return saveFlag;
    };

    var loadSetting = function () {
      var storageData = JSON.parse(localStorage[KEY_STORAGE]);
      return storageData[STORAGE_KEY_SETTING];
    };

    var saveSetting = function (setting) {
      var storageData = JSON.parse(localStorage[KEY_STORAGE]);
      storageData[STORAGE_KEY_SETTING] = setting;
      localStorage[KEY_STORAGE] = JSON.stringify(storageData);
    };

    ////////////////////////////////////////////////////////////////////////
    // utility
    var isiOS_ = false;
    var isAndroid_ = false;
    var isModalDialogOnly_ = false; 

    var setupUtility = function () {
      isiOS_ = navigator.userAgent.match(/iPhone|iPad|iPod/i)?true:false;
      isAndroid_ = navigator.userAgent.match(/Android.*Mobile/)?true:false;
      isModalDialogOnly_ = isiOS_ && window.useAndroidPanes();

      $('<span id="playerTrackerLabel-MeasureText" class="playerTrackerLabel playerTrackerLabel-text-Enl" style="visibility:hidden;position:absolute;white-space:nowrap;"></span>').appendTo('body');

      // for debug
      if (window.plugin.debug && window.plugin.debug.debugValues) {
        if (window.plugin.debug.debugValues.isiOS != undefined) {
          isiOS_ = window.plugin.debug.debugValues.isiOS;
        }
        if (window.plugin.debug.debugValues.isAndroid != undefined) {
          isAndroid_ = window.plugin.debug.debugValues.isAndroid;
        }
        if (window.plugin.debug.debugValues.isModalDialogOnly != undefined) {
          isModalDialogOnly_ = window.plugin.debug.debugValues.isModalDialogOnly;
        }
      }
    };
    var platformIsiOS = function() { return isiOS_; };
    var platformIsAndroid = function() { return isAndroid_; };
    var platformIsModalDialogOnly = function() { return isModalDialogOnly_; };

    var measureTextWidth = function (text) {
      var element = $('#playerTrackerLabel-MeasureText');
      var width = element.text(text).get(0).offsetWidth;
      element.empty();
      return width;
    };

    var ArrayIndexOf = function (array, val) {
      var i, len = array.length, result = -1;
      for (i = 0; i < len; i++) {
        if (array[i] === val) {
          result = i;
          break;
        }
      }
      return result;
    };

    // namespace END //////////////////////////////////////////////////////////
  }(window.plugin.playerTrackerLabel));

  /////////////////////////////////////////////////////////////////////////////
  // setup
  /////////////////////////////////////////////////////////////////////////////
  var setup = function() {
    window.plugin.playerTrackerLabel.setup();
  };
  window.plugin.playerTrackerLabel.loadCompleated = true;

  // PLUGIN END //////////////////////////////////////////////////////////

  setup.info = plugin_info; //add the script info data to the function as a property
  if (!window.bootPlugins) window.bootPlugins = [];
  window.bootPlugins.push(setup);
  // if IITC has already booted, immediately run the 'setup' function
  if (window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('(' + wrapper + ')(' + JSON.stringify(info) + ');'));
(document.body || document.head || document.documentElement).appendChild(script);

