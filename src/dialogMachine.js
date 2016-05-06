var _ = require('lodash'),
  DialogMachine;


DialogMachine = function (data) {
  this.data = data;
  this.nodeIndex = [];
  this.edgeIndex = [];
  this.currentNode = null;

  _.each(data.nodes, function (node, index) {
    this.nodeIndex[node.id] = index;
    node.edges = [];
  }.bind(this));

  _.each(data.edges, function (edge, index) {
    this.edgeIndex[edge.id] = index;
    var node = data.nodes[edge.from_node];
    node.edges.push(index);
  }.bind(this));
};

DialogMachine.prototype = {
  start: function () {
    var startId = this.data.start;
    this.setNode(startId);
    return this;
  },
  setNode: function (id) {
    var index = this.nodeIndex[id];
    this.currentNode = this.data.nodes[index];
    return this;
  },
  getDialog: function () {
    if (this.currentNode) {
      var edgeContent = _.map(this.currentNode.edges,
        function(edgeIndex) {
          return {
            text: this.data.edges[edgeIndex].content,
            edge: edgeIndex
          }
        }.bind(this));

        return {
          message: this.currentNode.content.message,
          text: this.currentNode.content.text,
          speaker: this.currentNode.content.speaker,
          options: edgeContent
        }
    } else {
      return null;
    }
  },
  activateEdge: function (id) {
    if (id in this.edgeIndex) {
      var edge_index = this.edgeIndex[id];
      var node_index = this.data.edges[edge_index].to_node;
      this.setNode(node_index);
    }
    return this;
  }
};
module.exports = DialogMachine;
