import {
    NetJsonNode,
    NetJsonNodeAttribute,
    NetLink,
    NetDiagram,
} from "../netDiagram";

class RdpNodeAttribute extends NetJsonNodeAttribute {}
class RdpNode extends NetJsonNode {}
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
    port: {},
    gem: {},
    tcont: {},
    egress_tm: {
        ChildNode: {
            queue_cfg: {},
        },
        AttrMap: {
            queue_cfg: RdpNodeAttributeQueueCfg,
            queue_stat: RdpNodeAttributeQueueCollapsed,
        },
    },
    ingress_class: {
        ChildNode: {
            flow: {},
        },
    },
};
