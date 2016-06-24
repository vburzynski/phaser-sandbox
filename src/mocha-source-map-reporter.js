var Dot, parseLine, sourceMapper, superEpilogue;

sourceMapper = require('../node_modules/source-map-support/source-map-support');

Dot = require('../node_modules/grunt-mocha/node_modules/mocha/lib/reporters/dot.js');

export default Dot;

parseLine = function(line) {
  var _, file, frame, ref, row;
  ref = line.match(/file:\/\/\/(.*):(\d*)/), _ = ref[0], file = ref[1], row = ref[2];
  return frame = {
    getFileName: function() {
      return file;
    },
    getLineNumber: function() {
      return row;
    },
    getColumnNumber: function() {
      return 1;
    }
  };
};

superEpilogue = Dot.prototype.epilogue;

Dot.prototype.epilogue = function() {
  var i, len, ref, test;
  ref = this.failures;
  for (i = 0, len = ref.length; i < len; i++) {
    test = ref[i];
    test.err.stack = test.err.stack.split('\n').map(function(line) {
      var mapped;
      if (line.match(/^    at /)) {
        mapped = sourceMapper.wrapCallSite(parseLine(line));
        return line.replace(/file:\/\/\/(.*):(\d*)/, "file:///" + (mapped.getFileName()) + ":" + (mapped.getLineNumber()));
      } else {
        return line;
      }
    }).join('\n');
  }
  return superEpilogue.bind(this)();
};