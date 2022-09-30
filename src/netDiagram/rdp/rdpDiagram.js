import {
    NetNodeAttribute,
    NetLink,
    NetDiagram,
    NetNode,
    ParentLink,
} from "../netDiagram";

class RdpLink extends NetLink {}
class RdpNodeAttribute extends NetNodeAttribute {
    _getAttrData(attrData) {
        return attrData.toString();
    }

    _draw(attrName, attrData, attrMap) {
        if (attrData instanceof Array) {
            /* Draw list */
            return this._drawAttrTree(attrName,
                attrData.map((child, i) => this._draw(`[${i}]`, child)));
        } else if (attrData instanceof Object) {
            /* Draw object */
            let attrChildList = [];
            for (let key of Object.keys(attrData)) {
                if (attrMap && key in attrMap) {
                    if (typeof attrMap[key] === 'function') {
                        /* If a class is found, use that class to draw (and no more attrMap) */
                        let attrObj = new attrMap[key](key, attrData[key], null);
                        attrChildList.push(attrObj.draw());
                    }
                    else {
                        /* Otherwise use default _draw go to into next level */
                        attrChildList.push(this._draw(key, attrData[key], attrMap[key]));
                    }
                }
                else {
                    /* No attrMap, use default _draw */
                    attrChildList.push(this._draw(key, attrData[key], null));
                }
            }

            return this._drawAttrTree(attrName, attrChildList);
        } else {
            /* Draw plain attr */
            return this._drawPlainAttr(attrName, attrData);
        }
    }
}

export class NetRdpNode extends NetNode {
    static parseJson(className, id, type, key, data, attrMap) {
        return new className(id, type, key, data, attrMap);
    }

    constructor(id, type, key, data, attrMap) {
        super(id, type, key, data, attrMap);
        this.defaultAttrClass = RdpNodeAttribute;
    }

    _getRealAttrName(attrName) {
        let match = attrName.match(/^(.+)\[.+\]$/);
        if (match) {
            attrName = match[1];
        }
        return attrName;
    }

    _getDataContent(data, key) {
        return data[key]
    }

    _iterateData(data, callbackFunc) {
        if (typeof callbackFunc !== 'function') return;
        for (let key of Object.keys(data)) {
            if (key.endsWith("_help_")) {
                continue;
            }
            callbackFunc(key, data[key], data[key + "_help_"]);
        }
    }
}

class RdpNode extends NetRdpNode {
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

    getDisplayName() {
        return this.key;
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
export class RdpParentLink extends ParentLink {
    constructor(child, parent) {
        super(child, parent);
        //this.note = 'p';
    }

    draw() {
        let edge = super.draw();

        edge.color = {};
        edge.color.color = 'pink'; // pINK

        edge.arrows = {};
        edge.arrows.to = true;

        edge.smooth = {};
        edge.smooth.type = 'curvedCW';
        edge.smooth.roundness = 0.2;

        edge.dashes = true;
        edge.width = 2;

        return edge;
    }
}

export class RdpUpstreamLink extends NetLink {
    constructor(from, to) {
        super(from, "usFrom", to, "usTo");
        //this.note = 'u';
    }
    draw() {
        let edge = super.draw();

        edge.color = {};
        edge.color.color = '#4B019C'; // uLTRA VIOLET

        edge.arrows = {};
        edge.arrows.to = true;

        edge.smooth = {};
        edge.smooth.type = 'curvedCW';
        edge.smooth.roundness = 0.2;

        edge.width = 4;
        return edge;
    }
}

export class RdpDownstreamLink extends NetLink {
    constructor(from, to) {
        super(from, "dsFrom", to, "dsTo");
        //this.note = 'd';
    }
    draw() {
        let edge = super.draw();

        edge.color = {};
        edge.color.color =  '#130000'; //dIESEL

        edge.arrows = {};
        edge.arrows.to = true;

        edge.smooth = {};
        edge.smooth.type = 'curvedCW';
        edge.smooth.roundness = 0.2;

        edge.width = 4;
        return edge;
    }
}


export class RdpBidirectionalStreamLink extends NetLink {
    constructor(from, to) {
        super(from, "bsFrom", to, "bsTo");
        //this.note = 'b';
    }
    draw() {
        let edge = super.draw();

        edge.color = {};
        edge.color.color =  '#CD7F32'; //bRONZE

        edge.arrows = {};
        edge.arrows.to = true;
        edge.arrows.from = true;

        edge.smooth = {};
        edge.smooth.type = 'curvedCW';
        edge.smooth.roundness = 0.2;

        edge.width = 4;
        return edge;
    }
}

export class RdpReferenceLink extends NetLink {
    constructor(from, to) {
        super(from, "refFrom", to, "refTo");
        //this.note = 'd';
    }
    draw() {
        let edge = super.draw();

        edge.color = {};
        edge.color.color = 'red'; // rED

        edge.arrows = {};
        edge.arrows.to = true;

        edge.smooth = {};
        edge.smooth.type = 'curvedCW';
        edge.smooth.roundness = 0.2;

        edge.dashes = true;
        edge.width = 2;

        return edge;
    }
}


class RdpDiagram extends NetDiagram {
    constructor() {
        super(rdpTempate, "key");
        this.defaultNodeClass = RdpNode;
        this.defaultLinkCLass = RdpLink;
    }

    parseJson(jsonString) {
        return false;
    }

    parseXml(xmlString) {
        if (xmlString == null)
            return false;

        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(xmlString, "text/xml");
        let link_info = {};
        let items = xmlDoc.getElementsByTagName("object");

        // add nodes
        for (let item of items)
        {
            let itemType = "";
            for (let it of item.getElementsByTagName('type'))
            {
                itemType = it.textContent;
            }

            if (itemType == "")
                continue;

            let nodeClass = this._getNodeClass(this.dataTemplate[itemType]);
            let nodeKey = item.getAttribute('name');

            let nodeData = {};
            nodeData["key"] = nodeKey;
            nodeData["type"] = itemType;

            for (let attributes of item.getElementsByTagName("attributes"))
            {
                for (let attribute of attributes.children)
                {
                    let attribute_name = attribute.tagName;
                    let attribute_help = "";
                    let attribute_value = {};

                    for (let help of attribute.getElementsByTagName("help")) {
                        attribute_help = help.textContent;
                    }

                    for (let value of attribute.getElementsByTagName("value")) {
                        let v = value.textContent;
                        if (v[0] == "{") {
                            v = JSON.parse(v);
                        }

                        let index = value.getAttribute("index");
                        if (index === null) {
                            attribute_value = v;
                        }
                        else {
                            attribute_value[index] = v;
                        }
                    }

                    nodeData[attribute_name + "_help_"] = attribute_help;
                    nodeData[attribute_name] = attribute_value;
                }
            }

            let node = new nodeClass(this._getNextNodeId(), itemType, nodeKey, nodeData, RdpNodeAttribute);

            if (!this.nodes.hasOwnProperty(itemType)) {
                this.nodes[itemType] = [];
            }
            this.nodes[itemType].push(node);
            this.node_list.push(node);
            this.node_count ++;
        }

        // add edges, tbd
        for (let item of items)
        {
            let from_name = item.getAttribute('name');
            let from_node = this.node_list.find(it => it.key == from_name);

            for (let owner of item.getElementsByTagName('owner'))
            {
                for (let objectName of owner.getElementsByTagName('object_name'))
                {
                    let parent_name = objectName.textContent;
                    let parent_node = this.node_list.find(it => it.key == parent_name);
                    if (parent_node) {
                        let link = new RdpParentLink(from_node, parent_node);
                        this.links.push(link);
                    }
                }
            }

            for (let children of item.getElementsByTagName('children'))
            {
                for (let objectName of children.getElementsByTagName('object_name'))
                {
                    let child_name = objectName.textContent;
                    let child_node = this.node_list.find(it => it.key == child_name);
                    if (child_node) {
                        let link = new RdpParentLink(child_node, from_node);
                        //this.links.push(link);
                    }
                }
            }

            for (let upstream of item.getElementsByTagName('upstream'))
            {
                for (let objectName of upstream.getElementsByTagName('object_name'))
                {
                    let upstream_name = objectName.textContent;
                    let upstream_node = this.node_list.find(it => it.key == upstream_name);
                    if (upstream_node) {
                        console.log(from_node, upstream_node);
                        let link = null;

                        if (from_node.type == "vlan" && from_node.key.indexOf("gpon") != -1 &&
                            upstream_node.type == "bridge") {
                            link = new RdpDownstreamLink(from_node, upstream_node);
                        }
                        else {
                            link = new RdpUpstreamLink(from_node, upstream_node);
                        }
                        this.links.push(link);
                    }
                }
            }

            for (let downstream of item.getElementsByTagName('downstream'))
            {
                for (let objectName of downstream.getElementsByTagName('object_name'))
                {
                    let downstream_name = objectName.textContent;
                    let downstream_node = this.node_list.find(it => it.key == downstream_name);
                    if (downstream_node) {
                        let link = null;
                        if(from_node.type == "bridge") {
                            if (downstream_name.indexOf("gpon") != -1) {
                                link = new RdpUpstreamLink(from_node, downstream_node);
                            }
                            else {
                                link = new RdpDownstreamLink(from_node, downstream_node);
                            }
                        }
                        else {
                            link = new RdpDownstreamLink(from_node, downstream_node);
                        }
                        this.links.push(link);
                    } 
                }
            }

            for (let references of item.getElementsByTagName('references'))
            {
                for (let objectName of references.getElementsByTagName('object_name'))
                {
                    let reference_name = objectName.textContent;
                    let reference_node = this.node_list.find(it => it.key == reference_name);
                    if (reference_node) {
                        let link = new RdpReferenceLink(from_node, reference_node);
                        this.links.push(link);
                    }
                }
            }
        }

        for (let item of items)
        {
            let from_name = item.getAttribute('name');
            let from_type = "";
            let from_node = this.node_list.find(it => it.key == from_name);

            for (let it of item.getElementsByTagName('type'))
            {
                from_type = it.textContent;
            }


            // add gpon to gem downstreamlink
            if (from_type == "gpon") {
                let enabled_gem_ids = [];
                let from_data = from_node.data;
                for (let gem_index in from_data.gem_enable) {
                    if (from_data.gem_enable[gem_index] ==  "yes") {
                        enabled_gem_ids.push(gem_index);
                    }
                }

                if (enabled_gem_ids.length && from_data.gem_ds_cfg) {
                    for (let gem_index of enabled_gem_ids) {
                        if (from_data.gem_ds_cfg.hasOwnProperty(gem_index)) {
                            let gem_port = from_data.gem_ds_cfg[gem_index].port;
                            for (let to_item of items) {
                                let to_name = to_item.getAttribute('name');
                                let to_type = "";

                                for (let to_item_it of to_item.getElementsByTagName('type'))
                                {
                                    to_type = to_item_it.textContent;
                                }

                                if(to_type != "gem") {
                                    continue;
                                }

                                let to_node = this.node_list.find(it => it.key == to_name);

                                if(to_node.data && to_node.data.gem_port == gem_port) {
                                    let link = new RdpDownstreamLink(from_node, to_node);
                                    this.links.push(link);
                                    //console.log(link);
                                    break;
                                }
                            }
                        }
                    }
                }
                continue;
            }

            if (!this.dataTemplate.hasOwnProperty(from_type)) {
                continue;
            }

            var linkables = this.dataTemplate[from_type].linkables;

            for(let linkable of linkables)
            {
                let data = from_node.data;
                linkable.link_keys.map((key)=>{data = data[key]});

                if(!data) {
                    continue;
                }

                if (data == linkable.match) {
                    data = linkable.fixed;
                }

                let to_node = this.node_list.find(it => it.key == data);
                if(!to_node) {
                    continue;
                }

                let link = null;
                if (!linkable.reversed) {
                    link = new linkable.link_class(from_node, to_node);
                }
                else {
                    link = new linkable.link_class(to_node, from_node);
                }
                //console.log(link);
                this.links.push(link);
            }
        }

        return true;
    }
}

export default RdpDiagram;

var rdpTempate = {
    gem: {
        linkables: [{
            link_keys: ["us_cfg", "tcont"],
            link_class: RdpUpstreamLink,
            reversed: false 
        },
        {
            link_keys: ["ds_cfg", "destination"],
            link_class: RdpDownstreamLink,
            reversed: false,
            match: "omci",
            fixed: "cpu/index=host"
        }
        ],
    },

    tcont: {
        linkables: [{
            link_keys: ["egress_tm"],
            link_class: RdpUpstreamLink,
            reversed: true
        }],
    },

    egress_tm: {
        linkables: [{
            link_keys: ["wan_type"],
            link_class: RdpUpstreamLink,
            reversed: false
        }],
    },

    port: {
        linkables: [{
            link_keys: ["wan_type"],
            link_class: RdpBidirectionalStreamLink,
            reversed: false
        },
        {
            link_keys: ["cpu_obj"],
            link_class: RdpBidirectionalStreamLink,
            reversed: false
        },
        {
            link_keys: ["tm_cfg", "egress_tm"],
            link_class: RdpDownstreamLink,
            reversed: false
        },

        ],
    },
};

var rdpDisplayTemplate = {};
var unused = {
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
