// based on:
// https://github.com/metacademy/directed-graph-creator
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
// DONE refactor into es6 class
// TODO refactor nodes into their own module?
// TODO refactor paths into their own module?
// TODO webpack scss

const BACKSPACE_KEY = 8;
const DELETE_KEY = 46;
const ENTER_KEY = 13;

function windowDimensions() {
  var docEl = document.documentElement,
    bodyEl = document.getElementsByTagName('body')[0];
  return {
    width: window.innerWidth || docEl.clientWidth || bodyEl.clientWidth,
    height: window.innerHeight || docEl.clientHeight || bodyEl.clientHeight
  };
}

class GraphCreator {
  /**
   * Creates a new GraphCreator object
   * @param {object} svg   svg object
   * @param {Array} nodes initial node data
   * @param {Array} paths initial edge data
   */
  constructor(svg, nodes, paths) {
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
     * collection of paths
     * @type {Array}
     */
    this.paths = paths || [];

    /**
     * Settings
     * @type {Object}
     * @property {String} graphClass - classname for the parent graph element
     * @property {String} connectClass - classname for nodes targeted during linking
     * @property {String} selectedClass - classname for selected nodes/paths
     * @property {String} nodeComponentClass - classname for nodes
     * @property {String} activeEditClass - id of the node being actively edited
     * @property {Number} nodeHeight - height for node components
     * @property {Number} nodeWidth - width for node components
     * @property {Number} nodeCorner - corner radius for node rectangles
     * @property {String} defaultTitle - default node title
     */
    this.settings = {
      graphClass: 'graph',
      connectClass: 'connect-target',
      selectedClass: 'selected',
      nodeComponentClass: 'node-component',
      activeEditClass: 'active-editing',
      nodeHeight: 100,
      nodeWidth: 100,
      nodeCorner: 25,
      defaultTitle: 'new state'
    };

    /**
     * stores graph state parameters
     * @type {Object}
     * @property {Object} selectedNode - currently selected node
     * @property {Object} selectedEdge - currently selected edge
     * @property {Object} mouseDownNode - d3 datum object when mouse down occurs on a node
     * @property {Object} mouseDownLink - d3 datum object when mouse down occurs on a link
     * @property {boolean} isDragging - true while node is being dragged
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

    // initialization sequence
    this.defineSymbols();
    this.initGraph();
    this.initDragLine();
    this.initSelections();
    this.initDragging();
    this.initZooming();
    this.initFileHandling();
    this.initDeleteButton();
    this.updateGraph();

    window.onresize = this.onWindowResize.bind(this);
  }

  /**
   * define reusable svg definitions for use in the graph editor
   */
  defineSymbols() {
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
  }

  /**
   * initialize the root graph element
   */
  initGraph() {
    /**
     * SVG graph group Element
     * @type {Element}
     */
    this.svgG = this.svg.append('g')
      .classed(this.settings.graphClass, true);
  }

  /**
   * initializes the line used to connect two nodes while shift dragging
   */
  initDragLine() {
    // displayed when dragging between nodes
    this.dragLine = this.svgG.append('svg:path')
      .attr('class', 'link dragline hidden')
      .attr('d', 'M0,0L0,0')
      .style('marker-end', 'url(#mark-end-arrow)');
  }

  /**
   * initialize the DOM and selections for paths and nodes
   */
  initSelections() {
    this.pathComponents = this.svgG.append('g').selectAll('g');
    this.nodeComponents = this.svgG.append('g').selectAll('g');
  }

  /**
   * initializes the dragging behavior
   */
  initDragging() {
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
  }

  /**
   * initializes zooming behavior
   */
  initZooming() {
    var zoomSvg = d3.behavior.zoom()
      .on('zoom', this.onZoom.bind(this))
      .on('zoomstart', this.onZoomStart.bind(this))
      .on('zoomend', this.onZoomEnd.bind(this));

    this.svg.call(zoomSvg).on('dblclick.zoom', null);
  }

  /**
   * initialize the file handling functionality and the buttons that trigger it.
   */
  initFileHandling() {
    var instance = this;
    // handle download data
    d3.select('#download-input').on('click', function () {
      graphExport(instance);
    });

    // handle uploaded data
    d3.select('#upload-input').on('click', function () {
      document.getElementById('hidden-file-upload').click();
    });
    d3.select('#hidden-file-upload').on('change', function () {
      graphImport(this, instance)
    });
  }

  /**
   * initialize the delete button's functionality
   */
  initDeleteButton() {
    d3.select('#delete-graph').on('click', function () {
      this.deleteGraph(false);
    }.bind(this));
  }

  /**
   * set the id count to a specific number
   */
  setIdCt(idct) {
    this.idct = idct;
  }

  /**
   * handles drag events
   */
  onDragMove(d) {
    this.state.isDragging = true;
    if (this.state.shiftNodeDrag) {
      var container = this.svgG.node();
      var x = d3.mouse(container)[0];
      var y = d3.mouse(container)[1];
      this.dragLine.attr('d', 'M' + d.x + ',' + d.y + 'L' + x + ',' + y);
    } else {
      d.x += d3.event.dx;
      d.y += d3.event.dy;
      this.updateGraph();
    }
  }

  /**
   * Clears the graph data and updates the graph
   */
  deleteGraph(skipPrompt) {
    var doDelete = true;
    if (!skipPrompt) {
      doDelete = window.confirm('Press OK to delete this graph');
    }
    if (doDelete) {
      this.nodes = [];
      this.paths = [];
      this.updateGraph();
    }
  }

  /**
   * select all text in element.
   * taken from http://stackoverflow.com/questions/6139107/programatically-select-text-in-a-contenteditable-html-element
   * @param {Element} el - element to select text element from
   */
  selectElementContents(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * insert svg line breaks
   * taken from http://stackoverflow.com/questions/13241475/how-do-i-include-newlines-in-labels-in-d3-charts
   * @param {Element} gEl   - graphical Element
   * @param {String}  title - title
   */
  insertTitleLinebreaks(gEl, title) {
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
  }

  //https://bl.ocks.org/mbostock/7555321
  wrap(text, width) {
    text.each(function() {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          y = text.attr("y"),
          tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", 0 + "em");

      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", lineHeight + "em").text(word);
        }
      }
    });
  }


  /**
   * remove paths associated with a node
   * @param {Object} node - node being removed
   */
  spliceLinksForNode(node) {
    var that = this,
      toSplice = this.paths.filter(function (l) {
        return (l.source === node || l.target === node);
      });
    toSplice.map(function (l) {
      that.paths.splice(that.paths.indexOf(l), 1);
    });
  }

  /**
   * replace the selected edge with a different selections
   * @param {Object} d3Path - new path to select
   * @param {Object} edgeData - data
   */
  replaceSelectEdge(d3Path, edgeData) {
    d3Path.classed(this.settings.selectedClass, true);
    if (this.state.selectedEdge) {
      this.removeSelectFromEdge();
    }
    this.state.selectedEdge = edgeData;
  }

  /**
   * replace the selected node with a different selections
   * @param {Object} d3Node - new node to select
   * @param {Object} nodeData - data
   */
  replaceSelectNode(d3Node, nodeData) {
    d3Node.classed(this.settings.selectedClass, true);
    if (this.state.selectedNode) {
      this.removeSelectFromNode();
    }
    this.state.selectedNode = nodeData;
  }

  /**
   * remove the selection from the currently selected node
   */
  removeSelectFromNode() {
    var that = this;
    this.nodeComponents.filter(function (d) {
      return d.id === that.state.selectedNode.id;
    }).classed(this.settings.selectedClass, false);
    this.state.selectedNode = null;
  }

  /**
   * remove the selection from the currently selected edge
   */
  removeSelectFromEdge() {
    var that = this;
    this.pathComponents.filter(function (d) {
      return d === that.state.selectedEdge;
    }).classed(this.settings.selectedClass, false);
    this.state.selectedEdge = null;
  }

  /**
   * Handles mousedown events on pathComponents
   */
  onPathMouseDown(d) {
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
  }

  /**
   * Handles mouseup events on pathComponents
   */
  onPathMouseUp(d) {
    this.state.mouseDownLink = null;
  }

  /**
   * Handles mousedown events on nodes
   */
  onNodeMouseDown(d) {
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
  }

  /**
   * Handles mouseout events on nodes
   */
  onNodeMouseOut(d) {
    d3.select(d3.event.currentTarget).classed(this.settings.connectClass, false);
  }

  /**
   * Handles mouseover events on nodes
   */
  onNodeMouseOver(d) {
    if (this.state.shiftNodeDrag) {
      d3.select(d3.event.currentTarget).classed(this.settings.connectClass, true);
    }
  }

  /**
   * Places editable text on node in place of svg text
   */
  changeTextOfNode(d3node, d) {
    var that = this,
      settings = this.settings,
      htmlEl = d3node.node();

    d3node.selectAll('text').remove();

    var nodeBCR = htmlEl.getBoundingClientRect(),
      currentScale = nodeBCR.width / settings.nodeWidth,
      placementPadding = 0 * currentScale,
      useHW = settings.nodeWidth * currentScale; // currentScale > 1 ? nodeBCR.width * 0.71 : settings.nodeWidth * 1.42;

    // replace with editable content text
    var d3txt = this.svg.selectAll('foreignObject')
      .data([d])
      .enter()
      .append('foreignObject')
      .attr('x', nodeBCR.left + placementPadding)
      .attr('y', nodeBCR.top + placementPadding)
      .attr('height', useHW)
      .attr('width', useHW)
      .append('xhtml:p')
      .classed(settings.activeEditClass, true)
      .attr('contentEditable', 'true')
      .text(d.title)
      .on('mousedown', function (d) {
        d3.event.stopPropagation();
      })
      .on('keydown', function (d) {
        d3.event.stopPropagation();
        if (d3.event.keyCode == ENTER_KEY && !d3.event.shiftKey) {
          this.blur();
        }
      })
      .on('blur', function (d) {
        // update title on node component
        d.title = this.textContent;
        that.insertTitleLinebreaks(d3node, d.title);
        // remove editable content
        d3.select(this.parentElement).remove();
      });
    return d3txt;
  }

  /**
   * Handles mouseup events on nodes
   */
  onNodeMouseUp(d) {
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
      var filtRes = this.pathComponents.filter(function (d) {
        if (d.source === newEdge.target && d.target === newEdge.source) {
          this.paths.splice(this.paths.indexOf(d), 1);
        }
        return d.source === newEdge.source && d.target === newEdge.target;
      });
      if (!filtRes[0].length) {
        this.paths.push(newEdge);
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
  }

  /**
   * Handles mousedown event on main SVG
   */
  onSVGMouseDown() {
    this.state.graphMouseDown = true;
  }

  makeNode() {
    var d3txt, txtNode,
      xycoords = d3.mouse(this.svgG.node()),
      d = {
        id: this.idct++,
        title: this.settings.defaultTitle,
        x: xycoords[0],
        y: xycoords[1]
      };
    this.nodes.push(d);
    this.updateGraph();

    // make title of  immediently editable
    d3txt = this.change.textOfNode(this.nodeComponents.filter(function (dval) {
      return dval.id === d.id;
    }), d);
    txtNode = d3txt.node();
    this.selectElementContents(txtNode);
    txtNode.focus();
  }

  /**
   * Handles mouseup event on main SVG
   */
  onSVGMouseUp() {
    var state = this.state;
    if (state.isZooming) {
      // zoomed not clicked
      state.isZooming = false;
    } else if (state.graphMouseDown && d3.event.shiftKey) {
      // clicked not dragged from svg
      this.makeNode();
    } else if (state.shiftNodeDrag) {
      // dragged from node
      state.shiftNodeDrag = false;
      this.dragLine.classed('hidden', true);
    }
    state.graphMouseDown = false;
  }

  /**
   * Handles keydown event on main svg
   * @return {null}
   */
  onSVGKeyDown() {
    // make sure repeated key presses don't register for each keydown
    if (this.state.lastKeyDown !== -1) {
      return;
    }

    this.state.lastKeyDown = d3.event.keyCode;

    switch (d3.event.keyCode) {
    case BACKSPACE_KEY:
    case DELETE_KEY:
      d3.event.preventDefault();
      this.deleteSelected()
      break;
    }
  }

  /**
   * Deletes the currently selected Node or Edge
   */
  deleteSelected() {
    if (this.state.selectedNode) {
      this.nodes.splice(this.nodes.indexOf(this.state.selectedNode), 1);
      this.spliceLinksForNode(this.state.selectedNode);
      this.state.selectedNode = null;
      this.updateGraph();
    } else if (this.state.selectedEdge) {
      this.paths.splice(this.paths.indexOf(this.state.selectedEdge), 1);
      this.state.selectedEdge = null;
      this.updateGraph();
    }
  }

  /**
   * Handles the keyup event on the main SVG
   */
  onSVGKeyUp() {
    this.state.lastKeyDown = -1;
  }

  /**
   * Propogates data changes to the graph
   */
  updateGraph() {
    this.updateGraphPaths();
    this.updateGraphNodes();
  }

  /**
   * Propogates changes to the path data to the graph
   */
  updateGraphPaths() {
    var that = this,
      settings = this.settings,
      state = this.state;

    function graphPathDescription(d) {
      return 'M' + d.source.x + ',' + d.source.y + 'L' + d.target.x + ',' + d.target.y;
    }

    this.pathComponents = this.pathComponents.data(this.paths, function (d) {
      return String(d.source.id) + '+' + String(d.target.id);
    });
    var pathComponents = this.pathComponents;

    // update existing pathComponents
    pathComponents.style('marker-end', 'url(#end-arrow)')
      .classed(settings.selectedClass, function (d) {
        return d === state.selectedEdge;
      })
      .attr('d', graphPathDescription);

    // add new pathComponents
    pathComponents.enter()
      .append('path')
      .style('marker-end', 'url(#end-arrow)')
      .classed('link', true)
      .attr('d', graphPathDescription)
      .on('mousedown', this.onPathMouseDown.bind(this))
      .on('mouseup', this.onPathMouseUp.bind(this));

    // remove old links
    pathComponents.exit().remove();
  }

  /**
   * Propogates changes to the node data to the graph
   */
  updateGraphNodes() {
    var that = this,
      settings = this.settings,
      state = this.state;

    function nodePathDescription(d) {
      return 'translate(' + d.x + ',' + d.y + ')';
    }

    function idKey(d) {
      return d.id;
    }
    // update existing nodes
    this.nodeComponents = this.nodeComponents.data(this.nodes, idKey);
    this.nodeComponents.attr('transform', nodePathDescription);

    // grab new nodes not in the DOM and append a new group element for each
    var newGs = this.nodeComponents.enter().append('g');

    newGs.classed(settings.nodeComponentClass, true)
      .attr('transform', nodePathDescription)
      .on('mouseover', this.onNodeMouseOver.bind(this))
      .on('mouseout', this.onNodeMouseOut.bind(this))
      .on('mousedown', this.onNodeMouseDown.bind(this))
      .on('mouseup', this.onNodeMouseUp.bind(this))
      .call(this.drag);

    newGs.append('rect')
      .attr('height', String(settings.nodeHeight))
      .attr('width', String(settings.nodeWidth))
      .attr('x', -settings.nodeWidth / 2)
      .attr('y', -settings.nodeHeight / 2)
      .attr('rx', settings.nodeCorner)
      .attr('ry', settings.nodeCorner);

    newGs.each(function(d, i){
      console.log(d.events);
      //var selection = d3.select(this).data(d.events).enter().append('rect');
      var sel = d3.select(this).append('g')
        .selectAll('g')
        .data(d.events)
        .enter().append('g');

      sel.attr('transform', function(d, i) {
        return 'translate(' + 0 + ',' + (settings.nodeHeight / 2 + (i * 20) + 10) + ')';
      });

      sel.append('rect')
        .classed('event', true)
        .attr('height', String(20))
        .attr('width', String(settings.nodeWidth))
        .attr('x', -settings.nodeWidth / 2)
        .attr('y', -10);

      sel.each(function (d) {
        d3.select(this).append('text')
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'central')
          .text(d);
      });
    });

    newGs.each(function (d) {
      var text = d3.select(this).append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'text-before-edge')
        .text(d.title);

      that.wrap(text, settings.nodeWidth);
      // text.attr('y', function(d) {
      //   return String(-(1.1*3) / 2) + 'em';
      // });
    });

    // remove old nodes
    this.nodeComponents.exit().remove();
  }

  /**
   * Handles zoom behavior on the graph
   */
  onZoom() {
    if (d3.event.sourceEvent.shiftKey) {
      // TODO  the internal d3 state is still changing
      return false;
    } else {
      this.state.isZooming = true;
      d3.select('.' + this.settings.graphClass)
        .attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
    }
    return true;
  }

  /**
   * Handles the zoom start event
   */
  onZoomStart() {
    var ael = d3.select('.' + this.settings.activeEditClass).node();
    if (ael) {
      ael.blur();
    }
    if (!d3.event.sourceEvent.shiftKey) {
      d3.select('body').style('cursor', 'move');
    }
  }

  /**
   * Handles the zoom end event
   */
  onZoomEnd() {
    d3.select('body').style('cursor', 'auto');
  }

  /**
   * Handles window resize events and is responsible for updating the size of
   * the svg DOM element
   */
  onWindowResize() {
    var result = windowDimensions();
    this.svg.attr('width', result.width).attr('height', result.height);
  }
}

export default GraphCreator;
