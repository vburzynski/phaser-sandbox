export default function (el, graph) {
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    var uploadFile = el.files[0];
    var filereader = new window.FileReader();

    filereader.onload = function () {
      var txtRes = filereader.result;

      try {
        var jsonObj = JSON.parse(txtRes);
        graph.deleteGraph(true);
        graph.nodes = jsonObj.nodes;
        graph.setIdCt(jsonObj.nodes.length + 1);
        var newEdges = jsonObj.edges;
        newEdges.forEach(function (e, i) {
          newEdges[i] = {
            source: graph.nodes.filter(function (n) {
              return n.id == e.source;
            })[0],
            target: graph.nodes.filter(function (n) {
              return n.id == e.target;
            })[0]
          };
        });
        graph.edges = newEdges;
        graph.updateGraph();
      } catch (err) {
        window.alert('Error parsing uploaded file\nerror message: ' + err.message);
        return;
      }
    };

    filereader.readAsText(uploadFile);
  } else {
    alert('Your browser won\'t let you save this graph -- try upgrading your browser to IE 10+ or Chrome or Firefox.');
  }
}
