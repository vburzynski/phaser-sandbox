export default function (graph) {
  var saveEdges = [];
  graph.edges.forEach(function (val, i) {
    saveEdges.push({
      source: val.source.id,
      target: val.target.id
    });
  });

  var json = window.JSON.stringify({
    'nodes': graph.nodes,
    'edges': saveEdges
  }, null, 2);

  var blob = new Blob([json], { type: 'text/plain;charset=utf-8' });

  saveAs(blob, 'mydag.json');
}
