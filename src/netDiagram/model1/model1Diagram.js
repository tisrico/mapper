import { NetXmlNode, NetXmlNodeAttribute, NetLink, NetDiagram } from "../netDiagram";

class Model1Attr extends NetXmlNodeAttribute {
  _drawPlainAttr(attrName, attrData)
  {
    var data = attrData.textContent.trim();
    var data_int = parseInt(data, 10);

    var draw_data = super._drawPlainAttr(attrName, attrData);
    if (data_int.toString() === data && data_int !== 0)
    {
      draw_data["children"] = [
        {"icon" : "jstree-file", "text": "bin: 0b" + data_int.toString(2)},
        {"icon" : "jstree-file", "text": "dec: " + data},
        {"icon" : "jstree-file", "text": "hex: 0x" + data_int.toString(16)}
      ];
    }

    return draw_data;
  }
}

class Model1Node extends NetXmlNode {
  constructor(id, type, key, data, attrMap) {
      super(id, type, key, data, attrMap);
      this.defaultAttrClass = Model1Attr;
  }

  getDisplayName() {
    return "<" + this.type + ">\n" + this.key;
  }

  getDisplayLevel() {
      var displayTemplate = model1DisplayTemplate[this.type].NodeTemplate;
      return displayTemplate.level;
  }

  draw() {
      var node_data = super.draw();

      if (!model1DisplayTemplate[this.type])
        return node_data;

      var displayTemplate = model1DisplayTemplate[this.type].NodeTemplate;
      if (!displayTemplate)
        return node_data;

      if (displayTemplate.level)
          node_data.level = displayTemplate.level;
      if (displayTemplate.color)
          node_data.color = displayTemplate.color;
      if (displayTemplate.margin)
          node_data.margin = displayTemplate.margin;
      if (displayTemplate.shape)
          node_data.shape = displayTemplate.shape;
      return node_data;
  }
}

class Model1Interface extends Model1Node {
  getDisplayName() {
      var name = super.getDisplayName();
      if (Model1Interface.getXmlItemValue(this.data, "type") != null) {
          var split_result = Model1Interface.getXmlItemValue(this.data, "type").split(":");
          if (split_result.length > 1)
            name +=  "\n" + split_result[1];
      }

      return name;
  }

  draw() {
      var node_data = super.draw();
      var displayTemplate = model1DisplayTemplate[this.type].NodeTemplate;
      var type = Model1Interface.getXmlItemValue(this.data, "type");

      const type_level_offset = {
        "bbfift:vlan-sub-interface" : 0,
        "ianaift:ethernetCsmacd"    : 1,
        "ianaift:ptm"               : 1,
        "ianaift:fastdsl"           : 2,
      };
      if (type_level_offset[type])
        node_data.level = type_level_offset[type] + (displayTemplate.level ? displayTemplate.level : 0);


      const type_color = {
        "bbfift:vlan-sub-interface" : null,
        "ianaift:ethernetCsmacd"    : "red",
        "ianaift:ptm"               : "red",
        "ianaift:fastdsl"           : "red",
      };

      if (type_color[type])
        node_data.color = type_color[type];

      return node_data;
  }
}

class Model1EgressRewrite extends Model1Node {
  static parseXml(className, id, type, keyName, data, attrMap) {
    if (data.children.length === 0)
      return null;

    /* Create nodes */
    return new className(id, type, "egress-rewrite", data, attrMap);
  }

  getDisplayName() {
      return ("<" + this.type + ">\n" + "EGRESS_REWRITE");
  }
}

class Model1Link extends NetLink {}

class Model1Diagram extends NetDiagram {
    static getXmlItemKeyName() {
        return "name";
    }

    constructor() {
        super(model1Template, Model1Diagram.getXmlItemKeyName());
        this.defaultNodeClass = Model1Node;
        this.defaultLinkCLass = Model1Link;
    }
}

export default Model1Diagram;

var model1Template = {
  "forwarder": {
    "ChildNode": {
      "port": {
        Link: [
          {
              PointerFromName: "sub-interface",
              PointerToName: "name",
              PointerType: "interface",
          },
        ],
      }
    }
  },
  "interface": {
    NodeClass: Model1Interface,
    Link: [
      {
          PointerFromName: "subif-lower-layer/interface",
          PointerToName: "name",
          PointerType: "interface",
      },
      {
          PointerFromName: "ptm/lower-layer-if",
          PointerToName: "name",
          PointerType: "interface",
      },
    ],
    "ChildNode": {
      "rule": {
        NodeClass: Model1Node,
      },
      "egress-rewrite":
      {
        NodeClass: Model1EgressRewrite,
      },
    }
  },
};

var model1DisplayTemplate = {
  "forwarder": {
    NodeTemplate: {
      margin: 30,
      level: 1,
      color: "#00FF00FF",
    },
  },
  "port": {
    NodeTemplate: {
      margin: 30,
      level: 2,
    },
  },
  "interface": {
    NodeTemplate: {
      margin: 30,
      level: 4,
    },
  },
  "rule": {
    NodeTemplate: {
      margin: 30,
      level: 3,
      color: "#9C9C9C",
    },
  },
  "egress-rewrite": {
    NodeTemplate: {
      margin: 30,
      level: 3,
      color: "#9C9C9C",
    },
  },
};


