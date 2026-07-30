// BIN_OP: * / ^ max
// UN_OP: -

import { JNode } from "./libs/jgrad/jgrad.js";

// FUNC: max
export class UncNet {
  constructor() {
    this.p = null;
    this.name2weight = {};
  }
  get parameters() {
    return Object.values(this.name2weight);
  }
  build(root, rng = Math) {
    this.p = null;
    this.name2weight = {};

    function walk(node, ctx) {
      const { type, value, children } = node;
      const cnodes = children?.map((cnode) => walk(cnode, ctx));
      // build node
      let gnode = null;
      if (type === "BIN_OP" || type === "FUNC") {
        const op2name = {
          "*": "mul",
          "/": "div",
          "+": "add",
          "-": "sub",
          // '^': "pow",
          max: "max",
          min: "min",
        };
        if (op2name[value]) {
          gnode = new JNode(cnodes, op2name[value]);
        } else if (value === "^") {
          gnode = new JNode([cnodes[0]], "pow", { n: +cnodes[1].value });
        }
      } else if (type === "UN_OP" && value === "-") {
        gnode = new JNode(cnodes, "neg");
      } else if (type === "NUM") {
        gnode = JNode.fromValue(+value);
      } else if (type === "VAR") {
        if (value !== "p") {
          if (!(value in ctx.name2weight)) {
            ctx.name2weight[value] = JNode.fromValue(rng.random() * 2 - 1);
          }
          gnode = ctx.name2weight[value];
        } else {
          if (!ctx.p) {
            ctx.p = JNode.fromValue(0.1);
          }
          gnode = ctx.p;
        }
      }
      if (!gnode) {
        throw new Error(`Cannot handle node: ${type} ${value}`);
      }
      return gnode;
    }
    const res = walk(root, this);
    return res;
  }
}


function network2vis(root, params) {
  const paramSet = new Set(params);
  const nodesArr = [];
  const edgesArr = [];
  let nodeIdx = 1;
  function walkNode(node, parentIdx = -1) {
    let labelParts = [];
    if (node._op) {
      labelParts.push(node._op);
    } else if (paramSet.has(node)) {
      labelParts.push("weight");
    } else {
      labelParts.push("value");
    }
    labelParts.push(`grad: ${node._grad}`);
    labelParts.push(`data: ${node.data}`);
    const label = labelParts.join("\n");
    const n = {
      id: nodeIdx++,
      label: label,
    };
    nodesArr.push(n);
    const e = { from: parentIdx, to: n.id, width: 1, arrows: "to" };
    edgesArr.push(e);
    node._prev?.forEach((c) => walkNode(c, n.id));
  }
  walkNode(root);
  const data = {
    nodes: new vis.DataSet(nodesArr),
    edges: new vis.DataSet(edgesArr),
  };
  return data;
}

export function plotNetwork(root, params, networkEl) {
  const data = network2vis(root, params);
  networkEl.innerHTML = "";
  const options = {
    layout: {
      hierarchical: {
        direction: "UD",
        sortMethod: "directed",
      },
    },
  };
  const network = new vis.Network(networkEl, data, options);
  return network;
}