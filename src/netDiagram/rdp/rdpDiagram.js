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

class RdpParentLink extends ParentLink {
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

class RdpUpstreamLink extends NetLink {
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

class RdpDownstreamLink extends NetLink {
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


class RdpBidirectionalStreamLink extends NetLink {
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

class RdpReferenceLink extends NetLink {
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

class CpuLink extends NetLink {
    constructor(from, to) {
        super(from, "refFrom", to, "refTo");
        //this.note = 'c';
    }
    draw() {
        let edge = super.draw();

        edge.color = {};
        edge.color.color = '#949071'; // cREAM(dark)

        edge.arrows = {};
        edge.arrows.to = true;

        edge.smooth = {};
        edge.smooth.type = 'curvedCW';
        edge.smooth.roundness = 0.2;

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
        let items = xmlDoc.getElementsByTagName("object");
        let objects = {};

        // convert xml document to js data structure
        for (let item of items)
        {
            let object = {
                key: undefined,
                type: undefined,
                owner: undefined,
                children: [],
                downstream: [],
                upstream: [],
                references: [],
                data: []
            };

            object.key = item.getAttribute('name');
            for (let it of item.getElementsByTagName('type'))
            {
                object.type = it.textContent;
            }

            for (let it of item.getElementsByTagName('state'))
            {
                object.state = it.textContent;
            }

            for (let owner of item.getElementsByTagName('owner'))
            {
                for (let objectName of owner.getElementsByTagName('object_name'))
                {
                    object.parent = objectName.textContent;
                }
            }

            if (!object.type || !object.parent) {
                continue;
            }

            // children
            for (let children of item.getElementsByTagName('children'))
            {
                for (let name of children.getElementsByTagName('object_name'))
                {
                    object.children.push(name.textContent);
                }
            }

            // downstream
            for (let downstream of item.getElementsByTagName('downstream'))
            {
                for (let name of downstream.getElementsByTagName('object_name'))
                {
                    object.downstream.push(name.textContent);
                }
            }

            // upstream
            for (let upstream of item.getElementsByTagName('upstream'))
            {
                for (let name of upstream.getElementsByTagName('object_name'))
                {
                    object.upstream.push(name.textContent);
                }
            }

            // references
            for (let references of item.getElementsByTagName('references'))
            {
                for (let name of references.getElementsByTagName('object_name'))
                {
                    object.references.push(name.textContent);
                }
            }

            let nodeData = {};
            nodeData["key"] = object.key;
            nodeData["type"] = object.type;
            nodeData["state"] = object.state;
            nodeData["parent"] = object.parent;
            if (object.children.length) nodeData["children"] = object.children;
            if (object.upstream.length) nodeData["upstream"] = object.upstream;
            if (object.downstream.length) nodeData["downstream"] = object.downstream;
            if (object.references.length) nodeData["references"] = object.references;

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

            object.data = nodeData;
            objects[object.key] = object;
        }

        this.objects = objects;
        this.buildNodes();
        this.buildLinks();
        this.uniqLinks();
        this.buildFlows();
        this.buildBridges();
        this.uniqLinks();
        return true;
    }

    addLink(link) {
        if(!link || !link.fromNode || !link.toNode) {
            console.trace("invalid link", link);
            return;
        }
        this.links.push(link);
    }

    uniqLinks() {
        let temp = [];
        for(let ix of this.links) {
            let has = false;
            for(let it of temp) {
                //console.log(ix, it);
                if(ix.fromNode.id == it.fromNode.id &&
                    ix.toNode.id == it.toNode.id &&
                    ix.constructor.name == it.constructor.name) {
                    has = true;
                    break;
                }
            }
            if (!has) temp.push(ix);
        }

        this.links = temp;
    }

    findConnected(node, types) {
        let ret = [];
        if (!types) types = [];

        for (let link of this.links) {
            if(link.fromNode.id == node.id && types.includes(link.toNode.type)) {
                ret.push(link.toNode);
            }
            if(link.toNode.id == node.id && types.includes(link.fromNode.type)) {
                ret.push(link.fromNode);
            }
        }

        return ret;
    }

    buildBridges() {
        this.bridges = [];
        let self = this;

        this.iterateObjects((object)=>{
            let nodes = [];
            nodes.push(self.findNode(object.key));
            if (Array.isArray(object.downstream)) {
                for (let curr of object.downstream) {
                    nodes.push(self.findNode(curr));
                    // add its parent as well if they're of port type, as
                    // for vlan, the tx/rx is actually goes through the parent port
                    let parent = self.objects[curr].parent;
                    if (parent.indexOf("port/") == 0) {
                        nodes.push(self.findNode(parent));
                    }
                }
            }

            // find all nodes with direct relationships
            let related = [];
            for(let node of nodes) {
                //let node_types = ["egress_tm", "pbit_to_gem", "pbit_to_queue", "cpu", "tc_to_queue", "pbit_to_gem_table"];
                let node_types = ["cpu", "pbit_to_queue", "dscp_to_pbit"];
                let r = self.findConnected(node, node_types);
                related = related.concat(r);
            }

            nodes = nodes.concat(related);
            // unique the node list
            nodes = [... new Set(nodes)];

            // find nodes that connected to pbit_to_queue
            console.log(nodes);
            let p2q = nodes.find(n=>n.type == "pbit_to_queue");
            if (p2q) {
                console.log()
                for (let port of p2q.data.upstream) {
                    if (!nodes.find((n)=>n.key==port)) {
                        continue;
                    }

                    console.log("port", port);
                    port = self.findNode(port);
                    // check which child is in
                    for (let child of port.data.children) {
                        if (!nodes.find((n)=>n.key==child)) {
                            continue;
                        }

                        // child -> p2q -> port
                        let cls1 = RdpUpstreamLink;
                        let cls2 = RdpDownstreamLink;
                        if (port.key.indexOf("port/index=lan") == 0) {
                            cls1 = RdpDownstreamLink;
                            cls2 = RdpUpstreamLink;
                        }

                        self.addReplace(child, p2q, cls1);
                        self.addReplace(p2q, port, cls1);
                    }
                }
            }

            let bridge = {
                name: "br/" + object.key,
                nodes: nodes
            }
            // console.log(bridge);
            self.bridges.push(bridge);
        }, "bridge");
    }

    addReplace(from, to, cls) {
        console.log("addReplace", from, to, cls);
        for (let link of this.links) {
            if(link.constructor.name == cls.name &&
                ((link.fromNode.id == from.id && link.toNode.id == to.id) || (
                    link.fromNode.id == to.id && link.toNode.id == from.id))) {
                console.log('here we go');
                if(link.fromNode != from) {
                    link.fromNode = to;
                    link.toNode = from;
                console.log('here we go !');
                }
                else {
                    this.addLink(new cls(from, to));
                }
                return;
            }
        }
    }

    buildFlows() {
        this.flows = {
            up: this.buildUpstreamFlows(),
            down: this.buildDownstreamFlows()
        };
    }

    buildUpstreamFlows() {
        let flows = [];
        let self = this;

        this.iterateObjects((object)=>{
            if (object.key.indexOf("dir=us") == -1) {
                return;
            }
            let data = object.data;
            let config = data.cfg;
            let key_names = config.fields.split("+");

            if(config.type != "flow") {
                console.log("can't support none flow ic");
                return;
            }

            for(let index in data.flow) {
                let flow = {};
                let keys = data.flow[index].key;
                let result = data.flow[index].result;

                let pindexes = object.key.split("=");
                flow.name = "us/" + index + "@" + pindexes[pindexes.length-1];

                key_names.map((name)=>{
                    flow.name += "/" + name + "=" + keys[name];
                });

                let nodes = [];
                nodes.push(object.key);
                nodes.push(result.policer);
                nodes.push(result.tunnel);
                nodes.push(result.vlan_action);
                nodes.push(result.pbit_to_gem_table);

                if(result.action == "forward") {
                    nodes.push("gpon");
                }
                if(result.action == "cpu") {
                    nodes.push("cpu/index=host");
                }

                nodes.push("port/index=" + result.egress_port);
                nodes.push("port/index=" + keys.ingress_port);
                nodes.push("gem/index=" + result.wan_flow);

                let gem_key = "gem/index=" + result.wan_flow;
                let gem = self.objects[gem_key];
                if (gem) {
                    let tcont = self.objects[gem.data.us_cfg.tcont];
                    if (tcont) {
                        nodes.push(gem.data.us_cfg.tcont);
                        nodes.push(tcont.data.egress_tm);
                    }
                }

                nodes = [...new Set(nodes)];

                self.squeezIn("ingress_class", "egress_tm", "port/index=wan", nodes, "RdpUpstreamLink");
                self.squeezIn("ingress_class", "port/index=wan", "vlan_action", nodes, "RdpUpstreamLink");

                flow.nodes = [];
                nodes.map((n)=>{
                    let node = self.findNode(n);
                    if(!node) return;

                    flow.nodes.push(node);
                });

                flows.push(flow);
            }

        }, "ingress_class");

        return flows;
    }

    // a -> b => a -> c -> b
    squeezIn(a_, b_, c_, nodes, cls) {
        let a = nodes.find(n=> n.indexOf(a_) == 0);
        let b = nodes.find(n=> n.indexOf(b_) == 0);
        let c = nodes.find(n=> n.indexOf(c_) == 0);

        if(!a || !b || !c) {
            return;
        }

        let aNode = this.findNode(a);
        let bNode = this.findNode(b);
        let cNode = this.findNode(c);

        for (let li in this.links)  {
            let link = this.links[li];

            if (link.fromNode.id == aNode.id && link.toNode.id == bNode.id &&
                cls == link.constructor.name) {
                link.toNode = cNode;
                this.addLink( new link.constructor(cNode, bNode) );
                return;
            }
        }
    }

    buildDownstreamFlows() {
        let flows = [];
        let self = this;

        this.iterateObjects((object)=>{
            if (object.key.indexOf("dir=ds") == -1) {
                return;
            }
            let data = object.data;
            let config = data.cfg;
            let key_names = config.fields.split("+");

            if(config.type != "flow") {
                console.log("can't support none flow ic");
                return;
            }

            for(let index in data.flow) {
                let flow = {};
                let keys = data.flow[index].key;
                let result = data.flow[index].result;

                let pindexes = object.key.split("=");
                flow.name = "ds/" + index + "@" + pindexes[pindexes.length-1];

                key_names.map((name)=>{
                    flow.name += "/" + name + "=" + keys[name];
                });

                let nodes = [];
                nodes.push(object.key);
                nodes.push(result.policer);
                nodes.push(result.tunnel);
                nodes.push(result.vlan_action);

                let egress = "port/index=" + result.egress_port;
                nodes.push(egress);
                nodes.push("gem/index=" + keys.gem_flow);
                nodes.push("gpon");
                nodes.push("port/index=wan0");

                let egressNode = self.findNode(egress);
                if (egressNode) {
                    egressNode = egressNode.data;
                    for (let ref of egressNode.references) {
                        if (ref.indexOf("egress_tm/dir=ds") == 0) {
                            nodes.push(ref);
                        }
                    }
                    for (let child of egressNode.children) {
                        if (child.indexOf("egress_tm/dir=ds") == 0) {
                            nodes.push(child);
                        }
                    }
                }

                let lan_key = "port/index=" + result.egress_port;
                let lan = self.objects[lan_key];
                nodes = [...new Set(nodes)];

                this.makeConnection("gem", "ingress_class", RdpDownstreamLink, nodes);
                this.makeConnection("ingress_class", "port", RdpDownstreamLink, nodes);
                this.makeConnection("gpon", "gem", RdpDownstreamLink, nodes);

                this.squeezIn("gem", "ingress_class", "port/index=wan", nodes, "RdpDownstreamLink");
                this.squeezIn("ingress_class", "port/index=lan", "egress_tm", nodes, "RdpDownstreamLink");
                this.squeezIn("ingress_class", "egress_tm", "vlan_action", nodes, "RdpDownstreamLink");

                // add graph nodes
                flow.nodes = [];
                nodes.map((n)=>{
                    let node = self.findNode(n);
                    if(!node) return;

                    flow.nodes.push(node);
                });

                flows.push(flow);
            }

        }, "ingress_class");

        return flows;
    }

    //makeConnection("gem", "ingress_class", RdpDownstreamLink, nodes) {
    makeConnection(from_, to_, cls, nodes) {
        let from = nodes.find(n=>n.indexOf(from_) == 0);
        let to = nodes.find(n=>n.indexOf(to_) == 0);

        let fromNode = this.findNode(from);
        let toNode = this.findNode(to);

        for (let link of this.links) {
            if (link.constructor.name == cls.name &&
                ((link.fromNode.id == fromNode.id && link.toNode.id == toNode.id) ||
                (link.fromNode.id == toNode.id && link.toNode.id == fromNode.id))) {
                return;
            }
        }

        this.addLink(new cls(fromNode, toNode));
    }

    buildNodes() {
        for (let key in this.objects) {
            let object = this.objects[key];
            let nodeClass = this._getNodeClass(this.dataTemplate[object.type]);
            let node = new nodeClass(this._getNextNodeId(), object.type, object.key, object.data, RdpNodeAttribute);

            if (!this.nodes.hasOwnProperty(object.type)) {
                this.nodes[object.type] = [];
            }
            this.nodes[object.type].push(node);
            this.node_list.push(node);
            this.node_count ++;
        }
    }

    findNode(key) {
        return this.node_list.find(it => it.key == key);
    }

    iterateObjects(cb, type) {
        Object.entries(this.objects).forEach((entry)=>{
            let object = entry[1];
            if(type && object.type != type) {
                return;
            }
            cb(object);
        });
    }

    buildLinks() {
        let self = this;

        // parent links
        this.iterateObjects((object)=>{
            let child_node = self.findNode(object.key);
            let parent_node = self.findNode(object.parent);

            if (!child_node || !parent_node) {
                return;
            }
            let link = new RdpParentLink(child_node, parent_node);
            self.addLink(link);
        });

        // children links, maybe duplicated?
        this.iterateObjects((object)=>{
            let parent_node = self.findNode(object.key);
            object.children.map((child)=>{
                let child_node = self.findNode(child);

                if (!child_node || !parent_node) {
                    return;
                }
                let link = new RdpParentLink(child_node, parent_node);
                //self.addLink(link);
            });
        });

        // upstream links
        this.iterateObjects((object)=>{
            let from_node = self.findNode(object.key);
            object.upstream.map((upstream)=>{
                let upstream_node = self.findNode(upstream);

                if (!from_node || !upstream_node) {
                    return;
                }

                let link = null;
                if (from_node.type == "vlan" && from_node.key.indexOf("gpon") != -1 &&
                    upstream_node.type == "bridge") {
                    link = new RdpUpstreamLink(upstream_node, from_node);
                }
                else {
                    link = new RdpUpstreamLink(from_node, upstream_node);
                }
                self.addLink(link);
            });
        });

        // downstream links
        this.iterateObjects((object)=>{
            let from_node = self.findNode(object.key);
            object.downstream.map((downstream)=>{
                let downstream_node = self.findNode(downstream);

                if (!from_node || !downstream_node) {
                    return;
                }

                let link = null;
                if(from_node.type == "bridge" && downstream.indexOf("gpon") != -1) {
                    link = new RdpDownstreamLink(downstream_node, from_node);
                }
                else {
                    link = new RdpDownstreamLink(from_node, downstream_node);
                }
                self.addLink(link);
            });
        });

        // references
        this.iterateObjects((object)=>{
            let from_node = self.findNode(object.key);
            object.references.map((reference)=>{
                let reference_node = self.findNode(reference);

                if (!from_node || !reference_node) {
                    return;
                }
                let link = new RdpReferenceLink(from_node, reference_node);
                self.addLink(link);
            });
        });

        function parse_ex(data, keys, level) {
            if (level == undefined) {
                level = 0;
            }

            // console.log(data, keys, level);
            let key = keys[level];
            if (key == "*") {
                let ret = [];
                for (let k in data) {
                    if (level == keys.length -1) {
                        ret = ret.concact(data[k]); 
                    }
                    else {
                        let r = parse_ex(data[k], keys, level + 1);
                        if(r) ret = ret.concat(r);
                    }
                }
                return ret;
            }

            if (level == keys.length -1) {
                return data[key];
            }
            else {
                return parse_ex(data[key], keys, level + 1);
            }
        }

        // linkables_ref_head
        for (let from_type in this.dataTemplate)
        {
            let linkables = this.dataTemplate[from_type].linkables_ref_head;
            if (!linkables) {
                continue;
            }

            this.iterateObjects((from_obj)=>{
                for (let linkable of linkables) {
                    if(linkable.filter &&
                        from_obj.key.indexOf(linkable.filter) == -1) {
                        continue;
                    }
                    let targets = parse_ex(from_obj.data, linkable.link_keys);
                    if (Array.isArray(targets)) {
                        targets.map((target)=>{
                            if(linkable.prefix) {
                                target = linkable.prefix + target;
                            }
                            target = self.objects[target];
                            for (;target && target.type != linkable.target_type;) {
                                //console.log(target);
                                target = target.references[0];
                                target = self.objects[target];
                            }
                            if(!target) {
                                return;
                            }

                            let from_node = self.findNode(from_obj.key);
                            let to_node = self.findNode(target.key);

                            let link = null;
                            if (!linkable.reversed) {
                                link = new linkable.link_class(from_node, to_node);
                            }
                            else {
                                link = new linkable.link_class(to_node, from_node);
                            }

                            self.addLink(link);
                        });
                    }
                }
            }, from_type);
        }

        // linkables_ex
        for (let from_type in this.dataTemplate)
        {
            let linkables = this.dataTemplate[from_type].linkables_ex;
            if (!linkables) {
                continue;
            }

            this.iterateObjects((from_obj)=>{
                for (let linkable of linkables) {
                    if(linkable.filter &&
                        from_obj.key.indexOf(linkable.filter) == -1) {
                        continue;
                    }
                    let targets = parse_ex(from_obj.data, linkable.link_keys);
                    // console.log(from_obj.key, targets);
                    if (Array.isArray(targets)) {
                        targets.map((target)=>{

                            if (linkable.fixed) {
                                if (target == linkable.match) {
                                    let from_node = self.findNode(from_obj.key);
                                    let to_node = self.findNode(linkable.fixed);

                                    if(from_node && to_node) {
                                        self.addLink(new linkable.link_class(from_node, to_node));
                                    }
                                }
                                return;
                            }

                            if (linkable.prefix) {
                                target = linkable.prefix + target;
                            }
                            let from_node = self.findNode(from_obj.key);
                            let to_node = self.findNode(target);

                            // console.log(from_obj.key, target);

                            let link = null;
                            if (!linkable.reversed) {
                                link = new linkable.link_class(from_node, to_node);
                            }
                            else {
                                link = new linkable.link_class(to_node, from_node);
                            }

                            self.addLink(link);
                        });
                    }
                }
            }, from_type);
        }

        // linkables
        for (let from_type in this.dataTemplate)
        {
            let linkables = this.dataTemplate[from_type].linkables;
            if (!linkables) {
                continue;
            }

            this.iterateObjects((from_obj)=>{
                for (let linkable of linkables) {
                    let to_data = from_obj.data;
                    if (linkable.permanent) {
                        to_data = linkable.fixed;
                    }
                    else {
                        linkable.link_keys.map((key)=>{to_data = to_data[key]});

                        if (!to_data) {
                            continue;
                        }

                        if (to_data == linkable.match) {
                            to_data = linkable.fixed;
                        }
                    }

                    let from_node = self.findNode(from_obj.key);
                    let to_node = self.findNode(to_data);

                    if(!from_node || !to_node) {
                        return;
                    }

                    let link = null;
                    if (!linkable.reversed) {
                        link = new linkable.link_class(from_node, to_node);
                    }
                    else {
                        link = new linkable.link_class(to_node, from_node);
                    }

                    self.addLink(link);
                }

            }, from_type);
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
            reversed: true
        },
        {
            link_class: RdpUpstreamLink,
            permanent: true,
            fixed: "gpon",
            reversed: false
        },
        {
            link_keys: ["ds_cfg", "destination"],
            link_class: RdpDownstreamLink,
            reversed: false,
            match: "omci",
            fixed: "cpu/index=host"
        }],
    },

    tcont: {
        linkables: [{
            link_keys: ["egress_tm"],
            link_class: RdpUpstreamLink,
            reversed: true
        }],
    },

    vlan: {
        linkables_ex: [{
            link_keys: ["ingress_filter", "*", "enabled"],
            link_class: CpuLink,
            reversed: false,
            match: "yes",
            fixed: "cpu/index=host"
        },
        {
            link_keys: ["mac_lookup_cfg", "sal_miss_action"],
            link_class: CpuLink,
            reversed: false,
            match: "host",
            fixed: "cpu/index=host"
        },
        {
            link_keys: ["mac_lookup_cfg", "dal_miss_action"],
            link_class: CpuLink,
            reversed: false,
            match: "host",
            fixed: "cpu/index=host"
        },
        ]
    },

    ingress_class: {
        linkables_ex: [{
            filter: "dir=us",
            link_keys: ["flow", "*", "key", "ingress_port"],
            prefix: "port/index=",
            link_class: RdpUpstreamLink,
            reversed: true
        },
        {
            filter: "dir=us",
            link_keys: ["flow", "*", "result", "egress_port"],
            prefix: "port/index=",
            link_class: RdpUpstreamLink,
            reversed: false,
        },
        {
            filter: "dir=us",
            link_keys: ["flow", "*", "result", "pbit_to_gem"],
            link_class: RdpUpstreamLink,
            reversed: false,
            parse_table_index: true, // parse pbit_to_gem data;
        }],
        linkables_ref_head: [{
            filter: "dir=us",
            link_keys: ["flow", "*", "result", "wan_flow"],
            prefix: "gem/index=",
            link_class: RdpUpstreamLink,
            target_type: "egress_tm",
            reversed: false
        }],
    },

    port: {
        linkables_ex: [{
            link_keys: ["ingress_filter", "*", "enabled"],
            link_class: CpuLink,
            reversed: false,
            match: "yes",
            fixed: "cpu/index=host"
        }],
        linkables: [{
            link_keys: ["tm_cfg", "egress_tm"],
            link_class: RdpDownstreamLink,
            reversed: true
        }],
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

