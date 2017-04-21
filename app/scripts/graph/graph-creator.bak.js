// boilerplate: https://github.com/metacademy/directed-graph-creator
//
// Similar visual FSM Editors
// - Playmaker
//   - http://www.hutonggames.com/
// - UE4 FSM System
//   - https://forums.unrealengine.com/showthread.php?116032-UFSM-Finite-State-Machine
//   - https://gumroad.com/l/ygExa#
// - Behaviour Machine
//   - https://www.assetstore.unity3d.com/en/#!/content/20280
// - JointJS FSM
//   - http://www.jointjs.com/demos/fsa
// - Sharepoint state machine workflow
//   - http://odetocode.com/aimages/workflow/7/figure16.png

import d3 from 'd3';
import graphExport from './graph-export';
import graphImport from './graph-import';

// DONE refactor graph export
// DONE refactor graph import
// TODO refactor nodes into their own module?
// TODO refactor edges into their own module?

function windowDimensions() {
  var docEl = document.documentElement,
    bodyEl = document.getElementsByTagName('body')[0];
  return {
    width: window.innerWidth || docEl.clientWidth || bodyEl.clientWidth,
    height: window.innerHeight || docEl.clientHeight || bodyEl.clientHeight
  };
}

/**
 * Creates a new GraphCreator object
 * @class
 * @param {object} svg   svg object
 * @param {Array} nodes initial node data
 * @param {Array} edges initial edge data
 */
function GraphCreator(svg, nodes, edges) {
  var that = this;

  /**
   * id counter
   * @type {Number}
   * @member
   */
  this.idct = 0;

  /**
   * collection of nodes
   * @type {Array}
   * @member
   */
  this.nodes = nodes || [];

  /**
   * collection of edges
   * @type {Array}
   */
  this.edges = edges || [];

  /**
   * stores graph state parameters
   * @type {Object}
   * @property {Object} selectedNode - currently selected node
   * @property {Object} selectedEdge - currently selected edge
   * @property {Object} mouseDownNode - d3 datum object when mouse down occurs on a node
   * @property {Object} mouseDownLink - d3 datum object when mouse down occurs on a link
   * @property {boolean} isDragging - true while circle is being dragged
   * @property {boolean} isZooming - true while zooming
   * @property {Number} lastKeyDown - id of the last key pressed
   * @property {boolean} shiftNodeDrag - true when shift is held down when node is clicked
   * @property {String} selectedText - NOT IN USE
   */
  this.state = {
    selectedNode: null,
    selectedEdge: null,
    mouseDownNode: null,
    mouseDownLink: null,
    isDragging: false,
    isZooming: false,
    lastKeyDown: -1,
    shiftNodeDrag: false,
    selectedText: null
  };

  /**
   * SVG DOM element
   * @type {Element}
   */
  this.svg = svg;

  this.defineSymbols();
  this.initGraph();
  this.initDragLine();
  this.initSelections();
  this.initDragging();
  this.initZooming();
  this.initFileHandling();
  this.initDeleteButton();

  // listen for resize
  window.onresize = this.onWindowResize.bind(this);
}

GraphCreator.prototype.defineSymbols = function() {
  var defs = this.svg.append('svg:defs');

  // define arrow markers for graph links
  defs.append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', '32')
    .attr('markerWidth', 3.5)
    .attr('markerHeight', 3.5)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5');

  // define arrow markers for leading arrow
  defs.append('svg:marker')
    .attr('id', 'mark-end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 7)
    .attr('markerWidth', 3.5)
    .attr('markerHeight', 3.5)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5');
};

GraphCreator.prototype.initGraph = function() {
  /**
   * SVG graph group Element
   * @type {Element}
   */
  this.svgG = this.svg.append('g')
    .classed(this.settings.graphClass, true);
};

GraphCreator.prototype.initDragLine = function() {
  // displayed when dragging between nodes
  this.dragLine = this.svgG.append('svg:path')
    .attr('class', 'link dragline hidden')
    .attr('d', 'M0,0L0,0')
    .style('marker-end', 'url(#mark-end-arrow)');
};

GraphCreator.prototype.initSelections = function() {
  this.paths = this.svgG.append('g').selectAll('g');
  this.circles = this.svgG.append('g').selectAll('g');
};

GraphCreator.prototype.initDragging = function() {
  /**
   * Drag Behavior
   * @type {Object}
   */
  this.drag = d3.behavior.drag()
    .origin(function (d) {
      return { x: d.x, y: d.y };
    })
    .on('drag', this.onDragMove.bind(this))
    .on('dragend', function () {});

  // listen for key events
  d3.select(window).on('keydown', this.onSVGKeyDown.bind(this))
    .on('keyup', this.onSVGKeyUp.bind(this));

  this.svg.on('mousedown', this.onSVGMouseDown.bind(this));
  this.svg.on('mouseup', this.onSVGMouseUp.bind(this));
};

GraphCreator.prototype.initZooming = function() {
  var zoomSvg = d3.behavior.zoom()
    .on('zoom', this.onZoom.bind(this))
    .on('zoomstart', this.onZoomStart.bind(this))
    .on('zoomend', this.onZoomEnd.bind(this));

  this.svg.call(zoomSvg).on('dblclick.zoom', null);
};

GraphCreator.prototype.initFileHandling = function() {
  var instance = this;
  // handle download data
  d3.select('#download-input').on('click', function() {
    graphExport(instance);
  });

  // handle uploaded data
  d3.select('#upload-input').on('click', function () {
    document.getElementById('hidden-file-upload').click();
  });
  d3.select('#hidden-file-upload').on('change', function() {
    graphImport(this, instance)
  });
};

GraphCreator.prototype.initDeleteButton = function() {
  d3.select('#delete-graph').on('click', function () {
    this.deleteGraph(false);
  }.bind(this));
};

GraphCreator.prototype.setIdCt = function (idct) {
  this.idct = idct;
};

GraphCreator.prototype.settings = {
  selectedClass: 'selected',
  connectClass: 'connect-target',
  circleGClass: 'node-component',
  graphClass: 'graph',
  activeEditId: 'active-editing',
  BACKSPACE_KEY: 8,
  DELETE_KEY: 46,
  ENTER_KEY: 13,
  nodeRadius: 50,
  nodeCorner: 25,
  defaultTitle: 'random variable'
};

/* PROTOTYPE FUNCTIONS */

GraphCreator.prototype.onDragMove = function (d) {
  this.state.isDragging = true;
  if (this.state.shiftNodeDrag) {
    this.dragLine.attr('d', 'M' + d.x + ',' + d.y + 'L' + d3.mouse(this.svgG.node())[0] + ',' + d3.mouse(this.svgG.node())[1]);
  } else {
    d.x += d3.event.dx;
    d.y += d3.event.dy;
    this.updateGraph();
  }
};

GraphCreator.prototype.deleteGraph = function (skipPrompt) {
  var doDelete = true;
  if (!skipPrompt) {
    doDelete = window.confirm('Press OK to delete this graph');
  }
  if (doDelete) {
    this.nodes = [];
    this.edges = [];
    this.updateGraph();
  }
};

/* select all text in element: taken from http://stackoverflow.com/questions/6139107/programatically-select-text-in-a-contenteditable-html-element */
GraphCreator.prototype.selectElementContents = function (el) {
  var range = document.createRange();
  range.selectNodeContents(el);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
};

/* insert svg line breaks: taken from http://stackoverflow.com/questions/13241475/how-do-i-include-newlines-in-labels-in-d3-charts */
GraphCreator.prototype.insertTitleLinebreaks = function (gEl, title) {
  var words = title.split(/\s+/g),
    nwords = words.length;
  var el = gEl.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-' + (nwords - 1) * 7.5);

  for (var i = 0; i < words.length; i++) {
    var tspan = el.append('tspan').text(words[i]);
    if (i > 0)
      tspan.attr('x', 0).attr('dy', '15');
  }
};

// remove edges associated with a node
GraphCreator.prototype.spliceLinksForNode = function (node) {
  var that = this,
    toSplice = this.edges.filter(function (l) {
      return (l.source === node || l.target === node);
    });
  toSplice.map(function (l) {
    that.edges.splice(that.edges.indexOf(l), 1);
  });
};

GraphCreator.prototype.replaceSelectEdge = function (d3Path, edgeData) {
  d3Path.classed(this.settings.selectedClass, true);
  if (this.state.selectedEdge) {
    this.removeSelectFromEdge();
  }
  this.state.selectedEdge = edgeData;
};

GraphCreator.prototype.replaceSelectNode = function (d3Node, nodeData) {
  d3Node.classed(this.settings.selectedClass, true);
  if (this.state.selectedNode) {
    this.removeSelectFromNode();
  }
  this.state.selectedNode = nodeData;
};

GraphCreator.prototype.removeSelectFromNode = function () {
  var that = this;
  this.circles.filter(function (cd) {
    return cd.id === that.state.selectedNode.id;
  }).classed(this.settings.selectedClass, false);
  this.state.selectedNode = null;
};

GraphCreator.prototype.removeSelectFromEdge = function () {
  var that = this;
  this.paths.filter(function (cd) {
    return cd === that.state.selectedEdge;
  }).classed(this.settings.selectedClass, false);
  this.state.selectedEdge = null;
};

GraphCreator.prototype.onPathMouseDown = function (d) {
  var d3path = d3.select(d3.event.currentTarget);
  var state = this.state;
  d3.event.stopPropagation();
  state.mouseDownLink = d;

  if (state.selectedNode) {
    this.removeSelectFromNode();
  }

  var prevEdge = state.selectedEdge;
  if (!prevEdge || prevEdge !== d) {
    this.replaceSelectEdge(d3path, d);
  } else {
    this.removeSelectFromEdge();
  }
};

GraphCreator.prototype.onPathMouseUp = function (d) {
  this.state.mouseDownLink = null;
};

GraphCreator.prototype.onNodeMouseDown = function (d) {
  var d3node = d3.select(d3.event.currentTarget);
  var state = this.state;
  d3.event.stopPropagation();
  state.mouseDownNode = d;
  if (d3.event.shiftKey) {
    state.shiftNodeDrag = d3.event.shiftKey;
    // reposition dragged directed edge
    this.dragLine.classed('hidden', false)
      .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
  }
};

GraphCreator.prototype.onNodeMouseOut = function (d) {
  d3.select(d3.event.currentTarget).classed(this.settings.connectClass, false);
};

GraphCreator.prototype.onNodeMouseOver = function (d) {
  if (this.state.shiftNodeDrag) {
    d3.select(d3.event.currentTarget).classed(this.settings.connectClass, true);
  }
};

/* place editable text on node in place of svg text */
GraphCreator.prototype.changeTextOfNode = function (d3node, d) {
  var that = this,
    settings = this.settings,
    htmlEl = d3node.node();
  d3node.selectAll('text').remove();
  var nodeBCR = htmlEl.getBoundingClientRect(),
    curScale = nodeBCR.width / settings.nodeRadius,
    placePad = 5 * curScale,
    useHW = curScale > 1 ? nodeBCR.width * 0.71 : settings.nodeRadius * 1.42;
  // replace with editableconent text
  var d3txt = this.svg.selectAll('foreignObject')
    .data([d])
    .enter()
    .append('foreignObject')
    .attr('x', nodeBCR.left + placePad)
    .attr('y', nodeBCR.top + placePad)
    .attr('height', 2 * useHW)
    .attr('width', useHW)
    .append('xhtml:p')
    .attr('id', settings.activeEditId)
    .attr('contentEditable', 'true')
    .text(d.title)
    .on('mousedown', function (d) {
      d3.event.stopPropagation();
    })
    .on('keydown', function (d) {
      d3.event.stopPropagation();
      if (d3.event.keyCode == settings.ENTER_KEY && !d3.event.shiftKey) {
        this.blur();
      }
    })
    .on('blur', function (d) {
      d.title = this.textContent;
      that.insertTitleLinebreaks(d3node, d.title);
      d3.select(this.parentElement).remove();
    });
  return d3txt;
};

// mouseup on nodes
GraphCreator.prototype.onNodeMouseUp = function (d) {
  var d3node = d3.select(d3.event.currentTarget);
  var state = this.state,
    settings = this.settings;
  // reset the states
  state.shiftNodeDrag = false;
  d3node.classed(settings.connectClass, false);

  var mouseDownNode = state.mouseDownNode;

  if (!mouseDownNode) return;

  this.dragLine.classed('hidden', true);

  if (mouseDownNode !== d) {
    // we're in a different node: create new edge for mousedown edge and add to graph
    var newEdge = { source: mouseDownNode, target: d };
    var filtRes = this.paths.filter(function (d) {
      if (d.source === newEdge.target && d.target === newEdge.source) {
        this.edges.splice(this.edges.indexOf(d), 1);
      }
      return d.source === newEdge.source && d.target === newEdge.target;
    });
    if (!filtRes[0].length) {
      this.edges.push(newEdge);
      this.updateGraph();
    }
  } else {
    // we're in the same node
    if (state.isDragging) {
      // dragged, not clicked
      state.isDragging = false;
    } else {
      // clicked, not dragged
      if (d3.event.shiftKey) {
        // shift-clicked node: edit text content
        var d3txt = this.changeTextOfNode(d3node, d);
        var txtNode = d3txt.node();
        this.selectElementContents(txtNode);
        txtNode.focus();
      } else {
        if (state.selectedEdge) {
          this.removeSelectFromEdge();
        }
        var prevNode = state.selectedNode;

        if (!prevNode || prevNode.id !== d.id) {
          this.replaceSelectNode(d3node, d);
        } else {
          this.removeSelectFromNode();
        }
      }
    }
  }
  state.mouseDownNode = null;
};

// mousedown on main svg
GraphCreator.prototype.onSVGMouseDown = function () {
  this.state.graphMouseDown = true;
};

// mouseup on main svg
GraphCreator.prototype.onSVGMouseUp = function () {
  var state = this.state;
  if (state.isZooming) {
    // dragged not clicked
    state.isZooming = false;
  } else if (state.graphMouseDown && d3.event.shiftKey) {
    // clicked not dragged from svg
    var xycoords = d3.mouse(this.svgG.node()),
      d = {
        id: this.idct++,
        title: this.settings.defaultTitle,
        x: xycoords[0],
        y: xycoords[1]
      };
    this.nodes.push(d);
    this.updateGraph();
    // make title of text immediently editable
    var d3txt = this.changeTextOfNode(this.circles.filter(function (dval) {
        return dval.id === d.id;
      }), d),
      txtNode = d3txt.node();
    this.selectElementContents(txtNode);
    txtNode.focus();
  } else if (state.shiftNodeDrag) {
    // dragged from node
    state.shiftNodeDrag = false;
    this.dragLine.classed('hidden', true);
  }
  state.graphMouseDown = false;
};

// keydown on main svg
/**
 * Handles keydown event on main svg
 * @return {null}
 */
GraphCreator.prototype.onSVGKeyDown = function () {
  var settings = this.settings;

  // make sure repeated key presses don't register for each keydown
  if (this.state.lastKeyDown !== -1) {
    return;
  }

  this.state.lastKeyDown = d3.event.keyCode;

  switch (d3.event.keyCode) {
  case settings.BACKSPACE_KEY:
  case settings.DELETE_KEY:
    d3.event.preventDefault();
    this.deleteSelected()
    break;
  }
};

GraphCreator.prototype.deleteSelected = function () {
  if (this.state.selectedNode) {
    this.nodes.splice(this.nodes.indexOf(this.state.selectedNode), 1);
    this.spliceLinksForNode(this.state.selectedNode);
    this.state.selectedNode = null;
    this.updateGraph();
  } else if (this.state.selectedEdge) {
    this.edges.splice(this.edges.indexOf(this.state.selectedEdge), 1);
    this.state.selectedEdge = null;
    this.updateGraph();
  }
};

GraphCreator.prototype.onSVGKeyUp = function () {
  this.state.lastKeyDown = -1;
};

// call to propagate changes to graph
GraphCreator.prototype.updateGraph = function () {
  this.updateGraphPaths();
  this.updateGraphCircles();
};

GraphCreator.prototype.updateGraphPaths = function () {
  var that = this,
    settings = this.settings,
    state = this.state;

  this.paths = this.paths.data(this.edges, function (d) {
    return String(d.source.id) + '+' + String(d.target.id);
  });
  var paths = this.paths;

  // update existing paths
  paths.style('marker-end', 'url(#end-arrow)')
    .classed(settings.selectedClass, function (d) {
      return d === state.selectedEdge;
    })
    .attr('d', function (d) {
      return 'M' + d.source.x + ',' + d.source.y + 'L' + d.target.x + ',' + d.target.y;
    });

  // add new paths
  paths.enter()
    .append('path')
    .style('marker-end', 'url(#end-arrow)')
    .classed('link', true)
    .attr('d', function (d) {
      return 'M' + d.source.x + ',' + d.source.y + 'L' + d.target.x + ',' + d.target.y;
    })
    .on('mousedown', this.onPathMouseDown.bind(this))
    .on('mouseup', this.onPathMouseUp.bind(this));

  // remove old links
  paths.exit().remove();
};

GraphCreator.prototype.updateGraphCircles = function () {
  var that = this,
    settings = this.settings,
    state = this.state;

  // update existing nodes
  this.circles = this.circles.data(this.nodes, function (d) {
    return d.id;
  });
  this.circles.attr('transform', function (d) {
    return 'translate(' + d.x + ',' + d.y + ')';
  });

  // grab new nodes not in the DOM and append a new group element for each
  var newGs = this.circles.enter().append('g');

  newGs.classed(settings.circleGClass, true)
    .attr('transform', function (d) {
      return 'translate(' + d.x + ',' + d.y + ')';
    })
    .on('mouseover', this.onNodeMouseOver.bind(this))
    .on('mouseout', this.onNodeMouseOut.bind(this))
    .on('mousedown', this.onNodeMouseDown.bind(this))
    .on('mouseup', this.onNodeMouseUp.bind(this))
    .call(this.drag);

  newGs.append('rect')
    .attr('height', String(settings.nodeRadius * 2))
    .attr('width', String(settings.nodeRadius * 2))
    .attr('x', -settings.nodeRadius)
    .attr('y', -settings.nodeRadius)
    .attr('rx', settings.nodeCorner)
    .attr('ry', settings.nodeCorner);

  newGs.each(function (d) {
    that.insertTitleLinebreaks(d3.select(this), d.title);
  });

  // remove old nodes
  this.circles.exit().remove();
};

GraphCreator.prototype.onZoom = function () {
  if (d3.event.sourceEvent.shiftKey) {
    // TODO  the internal d3 state is still changing
    return false;
  } else {
    this.state.isZooming = true;
    d3.select('.' + this.settings.graphClass)
      .attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
  }
  return true;
};

GraphCreator.prototype.onZoomStart = function () {
  var ael = d3.select('#' + this.settings.activeEditId).node();
  if (ael) {
    ael.blur();
  }
  if (!d3.event.sourceEvent.shiftKey) {
    d3.select('body').style('cursor', 'move');
  }
};

GraphCreator.prototype.onZoomEnd = function () {
  d3.select('body').style('cursor', 'auto');
};

GraphCreator.prototype.onWindowResize = function () {
  var result = windowDimensions();
  this.svg.attr('width', result.width).attr('height', result.height);
};

export default GraphCreator;
