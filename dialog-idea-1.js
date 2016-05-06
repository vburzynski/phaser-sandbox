var json = {
  // keys for string interpolation, might also be provided or overwritten by intepreter/engine or i18n
  "keys": {
    "player1": "John Smith",
    "npc1": "Mary Sue"
  },

  // acts as a specialized FSM?
  // nodes in the conversation/dialog graph
  "nodes/states": [
    {
      "id": "node1",
      "content": "", // text, object id, i18n key, etc specifying content to display above choices
      "onEnter": "", // string or array of strings, specifying event(s) to fire when entering node
      "onExit": "", // string or array of strings, specifying event(s) to fire when exiting node, before edge/transition
      "edges/transitions": ["edge1","edge2"] // perhaps this could be dynamically generated looking at all "from_nodes" in edges
    }
  ],

  // edges connecting each node
  "edges/transitions": [
    {
      "id": "edge1",
      "from_node": "node1",
      "to_node": "node2",

      // choice provided in selection GUI (text, id, i18n key etc...)
      "choice": "",
      // content displayed (or content id, i18n key, or cinematic object) on screen when selected
      "content": "",

      // actions/events to trigger/emit in succession
      // possibly something like mediator.js
      "events": [
        "background:set:19382982374",
        "cinematic:1:play",
        "cinematic:2:play"
      ]

      // allow edges to be traveled along only once?
      // specify lifetime of edge in number of times travel is permitted?
      // rule(s) specifying when edge is active. ex: when certain conditions are met?
      // effects of this choice?
    },
    {
      "id": "edge2",
      "from_node": "node1",
      "to_node": "node3"
    }
  ],

  // if conversation json needs logic,
  // could provide a register of variables with initial values.
  // this could play into the rules and effects of a choice/transition/edge
  "register": {
    "param1": true,
    "param2": false,
    "param3": 1
  },

  "commands": [
    // option:
    {
      "command": "SET",
      "operand1": "param1",
      "operand2": true
    },

    // another option, instruction sets that are parsed & interpreted
    "INCREMENT param1", // increment param1 by 1
    "INCREMENT param1 2", // increment param1 by 2
    "MOVE param1 param2", // set param1 to equal param2
    "ADD param3 param4", // add to param3 the contents of param4
    "SUBTRACT param3 param4",
    "MULTIPLY param3 param4",
    "DIVIDE param4 param3",
    "AND param4 param3",
    "OR param1 param2",
    "OR param1 param2",
    "NOT param1",
    "CALL methodName",
    "EMIT eventName"

    //another option:
    "param1 += 1",
    "param1 = 2",
    "param1 = param2",
    "param1 += param4"
    "param3 -= param4 + 5"

    // evil eval?
  ]
}
