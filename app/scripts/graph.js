import d3 from 'd3';
import GraphCreator from './graph/graph-creator';

function windowDimensions() {
  var docEl = document.documentElement,
    bodyEl = document.getElementsByTagName('body')[0];
  return {
    width: window.innerWidth || docEl.clientWidth || bodyEl.clientWidth,
    height: window.innerHeight || docEl.clientHeight || bodyEl.clientHeight
  };
}

var settings = {
  appendElSpec: '#graph'
};

// warn the user when leaving
window.onbeforeunload = function () {
  return 'Make sure to save your graph locally before leaving :-)';
};

var result = windowDimensions(),
  width = result.width,
  height = result.height;

var svg = d3.select(settings.appendElSpec)
  .append('svg')
  .attr('width', width)
  .attr('height', height);

var nodes = [
  {
    "id": 0,
    "title": "this is a very long state name omg",
    "x": 100,
    "y": 170,
    events: ['event1', 'event2', 'event3']
  },
  {
    "id": 1,
    "title": "new state",
    "x": 250,
    "y": 170,
    events: ['event1', 'event2']
  },
  {
    "id": 2,
    "title": "new state",
    "x": 400,
    "y": 170,
    events: ['event1']
   }
];

// TODO - passing this in, you can't move nodes, edges don't update
var edges = [
  {
    "source": { "id": 0, "title": "new state", "x": 286, "y": 170 },
    "target": { "id": 2, "title": "new state", "x": 724, "y": 178 }
  },
  {
    "source": { "id": 2, "title": "new state", "x": 724, "y": 178 },
    "target": { "id": 1, "title": "new state", "x": 945, "y": 95 }
  }
];

var graph = new GraphCreator(svg, nodes);

window.svg = svg;
window.graph = graph;
