import {
    NetJsonNode,
    NetJsonNodeAttribute,
    NetLink,
    NetDiagram,
} from "../netDiagram";

class RdpLink extends NetLink {}
class RdpNodeAttribute extends NetJsonNodeAttribute {}

class RdpNode extends NetJsonNode {
    constructor(id, type, key, data, attrMap) {
        super(id, type, key, data, attrMap);
        this.defaultAttrClass = RdpNodeAttribute;
    }

    draw() {
        var node_data = super.draw();
        node_data.shape = "box";
        node_data.margin = 20;
        node_data.font = { size: 26 };

        if (!rdpDisplayTemplate[this.type]) return node_data;

        var displayTemplate = rdpDisplayTemplate[this.type].NodeTemplate;
        if (!displayTemplate) return node_data;

        if (displayTemplate.level) node_data.level = displayTemplate.level;
        if (displayTemplate.color) node_data.color = displayTemplate.color;
        if (displayTemplate.margin) node_data.margin = displayTemplate.margin;
        if (displayTemplate.shape) node_data.shape = displayTemplate.shape;
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

class RdpNodeGem extends RdpNode {
    getDisplayName() {
        return this.key + "\n(port " + this.getDataContent("gem_port") + ")";
    }
}

class RdpNodeEgressTm extends RdpNode {
    getDisplayName() {
        return this.key + "\n(" + this.getDataContent("mode") + ")";
    }
}

class RdpNodeEgressIngressClass extends RdpNode {
    getDisplayName() {
        if (this.data['cfg'] && this.data['cfg']['prty'])
            return this.key + "\n(prty " + this.data['cfg']['prty'] + ")";
        else
            return super.getDisplayName();
    }
}

class RdpNodeQueueCfg extends RdpNode {
    getDisplayName() {
        return this.key + " - qid " + this.getDataContent("queue_id");
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

class RdpNodeAttributePackets extends RdpNodeAttributeQueueCollapsed {
    draw() {
        let res = super.draw();
        let packetInfo = "";
        packetInfo +=
            this.attrData.packets != null ? "p" + this.attrData.packets : "";

        if (this.attrData.bytes != null) {
            if (packetInfo !== "")
                packetInfo += ", "

            packetInfo += "b" + this.attrData.bytes;
        }

        if (packetInfo !== "")
            packetInfo = " - " + packetInfo;

        res.text += packetInfo;
        return res;
    }
}

class RdpDiagram extends NetDiagram {
    constructor() {
        super(rdpTempate, null);
        this.defaultNodeClass = RdpNode;
        this.defaultLinkCLass = RdpLink;
    }
}

export default RdpDiagram;

var rdpTempate = {
    port: {
        Link: [
            {
                PointerFromName: "tm_cfg/egress_tm",
                PointerType: "egress_tm",
            },
        ],
    },
    gem: {
        NodeClass: RdpNodeGem,
        Link: [
            {
                PointerFromName: "us_cfg/tcont",
                PointerType: "tcont",
            },
        ],
    },
    tcont: {
        Link: [
            {
                PointerFromName: "egress_tm",
                PointerType: "egress_tm",
            },
        ],
    },
    egress_tm: {
        NodeClass: RdpNodeEgressTm,
        ChildNode: {
            queue_cfg: {
                NodeClass: RdpNodeQueueCfg,
            },
        },
        AttrMap: {
            queue_cfg: RdpNodeAttributeQueueCfg,
            queue_stat: {
                passed: RdpNodeAttributePackets,
                discarded: RdpNodeAttributePackets,
            }
        },
    },
    ingress_class: {
        NodeClass: RdpNodeEgressIngressClass,
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
                ],
            },
        },
        AttrMap: {
            flow: RdpNodeAttributeQueueCollapsed,
            flow_stat: RdpNodeAttributePackets,
        },
    },
    vlan_action: {},
};

var rdpDisplayTemplate = {
    port: {
        NodeTemplate: {
            margin: 30,
            level: 6,
            color: "red",
        },
    },
    ingress_class: {
        NodeTemplate: {
            level: 2,
            color: "#9C9C9C",
        },
    },
    flow: {
        NodeTemplate: {
            level: 3,
            shape: "ellipse",
        },
    },
    vlan_action: {
        NodeTemplate: {
            level: 1,
        },
    },
    gem: {
        NodeTemplate: {
            level: 5,
        },
    },
    tcont: {
        NodeTemplate: {
            color: "red",
            level: 6,
        },
    },
    egress_tm: {
        NodeTemplate: {
            level: 7,
        },
    },
    queue_cfg: {
        NodeTemplate: {
            level: 8,
            shape: "ellipse",
        },
    },
};
