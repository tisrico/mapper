import {
    NetJsonNode,
    NetJsonNodeAttribute,
    NetLink,
    NetDiagram,
} from "../netDiagram";

class RdpNodeAttribute extends NetJsonNodeAttribute {}

class RdpNode extends NetJsonNode {
    constructor(id, type, key, data, attrMap) {
        super(id, type, key, data, attrMap);
        this.defaultAttrClass = RdpNodeAttribute;
    }

    draw() {
        var node_data = super.draw();

        if (!rdpDisplayTemplate[this.type])
        return node_data;

        var displayTemplate = rdpDisplayTemplate[this.type].NodeTemplate;
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

class RdpNodeFlow extends RdpNode {
    static getRelatedPort(input) {
        return "port/index=" + input;
    }

    static getRelatedGem(input) {
        return "gem/index=" + input;
    }
}

class RdpLink extends NetLink {}

class RdpDiagram extends NetDiagram {
    constructor() {
        super(rdpTempate, null);
        this.defaultNodeClass = RdpNode;
        this.defaultLinkCLass = RdpLink;
    }
}

class RdpNodeAttributeQueueCollapsed extends RdpNodeAttribute {
    draw() {
        let res = super.draw();
        res.state.opened = false;
        return res;
    }
}

class RdpNodeAttributeQueueCfg extends RdpNodeAttributeQueueCollapsed {
    draw() {
        let res = super.draw();
        let qidInfo =
            this.attrData.queue_id != null
                ? " - qid " + this.attrData.queue_id
                : "";
        res.text += qidInfo;
        return res;
    }
}

export default RdpDiagram;

var rdpTempate = {
    port: {
        Link: [
            {
                PointerFromName: "tm_cfg/egress_tm",
                PointerType: "egress_tm",
            }
        ]
    },
    gem: {
        Link: [
            {
                PointerFromName: "us_cfg/tcont",
                PointerType: "tcont",
            }
        ]
    },
    tcont: {
        Link: [
            {
                PointerFromName: "egress_tm",
                PointerType: "egress_tm",
            }
        ]
    },
    egress_tm: {
        ChildNode: {
            queue_cfg: {},
        },
        AttrMap: {
            queue_cfg: RdpNodeAttributeQueueCfg,
        },
    },
    ingress_class: {
        ChildNode: {
            flow: {
                NodeClass: RdpNodeFlow,
                Link: [
                    {
                        PointerFromName: "result/vlan_action",
                        PointerType: "vlan_action",
                    },

                    {
                        PointerFromName: "key/ingress_port",
                        PointerType: "port",
                        PointerConvertFunc: RdpNodeFlow.getRelatedPort,
                    },
                    {
                        PointerFromName: "key/gem_flow",
                        PointerType: "gem",
                        PointerConvertFunc: RdpNodeFlow.getRelatedGem,
                    },

                    {
                        PointerFromName: "result/egress_port",
                        PointerType: "port",
                        PointerConvertFunc: RdpNodeFlow.getRelatedPort,
                    },
                    {
                        PointerFromName: "result/wan_flow",
                        PointerType: "gem",
                        PointerConvertFunc: RdpNodeFlow.getRelatedGem,
                    },
                ]
            },
        },
        AttrMap: {
            flow: RdpNodeAttributeQueueCollapsed,
        },
    },
    vlan_action: {},
};

var rdpDisplayTemplate = {
    port: {
        NodeTemplate: {
            margin: 30,
            level: 6,
            color: "#00FF00FF",
        },
    },
    ingress_class: {
        NodeTemplate: {
            margin: 30,
            level: 2,
            color: "#9C9C9C",
        },
    },
    flow: {
        NodeTemplate: {
            margin: 30,
            level: 3,
            color: "#9C9C9C",
        },
    },
    vlan_action: {
        NodeTemplate: {
            margin: 30,
            level: 1,
        },
    },
    gem: {
        NodeTemplate: {
            margin: 30,
            level: 5,
        },
    },
    tcont: {
        NodeTemplate: {
            margin: 30,
            level: 6,
        },
    },
    egress_tm: {
        NodeTemplate: {
            margin: 30,
            level: 7,
            color: "#9C9C9C",
        },
    },
    queue_cfg: {
        NodeTemplate: {
            margin: 30,
            level: 8,
            color: "#9C9C9C",
        },
    }

};
