import vis from "vis";

export class NetNodeAttribute {
  constructor(attrName, attrData) {
    this.attrName = attrName;
    this.attrData = attrData;
  }

  _drawPlainAttr(attrName, attrData) {
      return {
        "icon" : "jstree-file",
        "text": attrName + ": " + attrData.textContent.trim(),
      };
  }

  _draw(attrName, attrData) {
    if (attrData.children.length === 0) {
      return this._drawPlainAttr(attrName, attrData);
    }
    else {
      let info_list = [];
      for (let i = 0; i < attrData.children.length; i++) {
        let children = attrData.children[i];
        info_list.push(this._draw(children.tagName, children));
      }

      return {
        "icon": "jstree-file",
        "text": attrName,
        "state": { "opened" : true },
        "children": info_list,
      };
    }
  }

  draw() {
    return this._draw(this.attrName, this.attrData);
  }
}

export class NetNode {
    static getXmlItemValue(xmlItem, entry) {
      try { return xmlItem.getElementsByTagName(entry)[0].textContent; }
      catch (err) { return null; }
    }

    static parseKey(key) {
      return key;
    }

  static parseXml(className, id, type, keyName, data, attrMap) {
    let key = 0;
    if (keyName != null) {
      key = className.getXmlItemValue(data, keyName);
      if (key == null)
          return null;
    }

    key = className.parseKey(key);

    /* Create nodes */
    return new className(id, type, key, data, attrMap);
  }

  constructor(id, type, key, data, attrMap) {
    this.id = id; // Unique node ID

    this.type = type;
    this.key = key;
    this.data = data;

    this.links = [];

    this.defaultAttrClass = NetNodeAttribute;
    this.attrMap = attrMap;
    this.attributes = null;
  }

  getDisplayName() {
    return this.type + " " + this.key;
  }

  _getAttrClass(attrName) {
    if (this.attrMap && this.attrMap[attrName])
      return this.attrMap[attrName];
    else
      return this.defaultAttrClass;
  }

  draw() {
    // parse attrs (only when it is being drawed)
    if (this.attributes == null) {
      this.attributes = [];
      for (let i = 0; i < this.data.children.length; i++) {
        let children = this.data.children[i];
        let attrClass = this._getAttrClass(children.tagName);
        this.attributes.push(new attrClass(children.tagName, children));
      }
    }

    return {
      id: this.id,
      label: this.getDisplayName(),
    };
  }

  drawAttr(attrClassMap) {
    let info_list = [];

    // draw attrs
    if (this.attributes) {
      for (let i = 0; i < this.attributes.length; i++) {
        let attrData = this.attributes[i].draw();
        if (attrData != null)
          info_list.push(attrData);
      }
    }

    return {
      "text": this.getDisplayName(),
      "state": { "opened" : true },
      "children": info_list,
    };
  }

  _loadPointers(data, pointerFromNameList, pointerList) {
      if (!pointerFromNameList || pointerFromNameList.length === 0)
        return pointerList;

      let new_data = data.getElementsByTagName(pointerFromNameList[0]);
      if (new_data == null || new_data.length === 0) {
        return pointerList;
      }

      if (pointerFromNameList.length === 1) {
        for (let i = 0; i < new_data.length; i++) {
          pointerList.push(new_data[i].textContent);
        }
        return pointerList;
      }
      else {
        for (let i = 0; i < new_data.length; i++) {
          pointerList = pointerList.concat(this._loadPointers(new_data[i],
                    pointerFromNameList.slice(1, pointerFromNameList.length), pointerList));
        }
        return pointerList;
      }
  }

  loadLinkPointer(data, linkDesc) {
    if (!data)
      return null;

    /* Load pointer value */
    let pointerList = [];
    if ("PointerGetFunc" in linkDesc && linkDesc.PointerGetFunc) {
      pointerList.push(linkDesc.PointerGetFunc(data, linkDesc.PointerFromName));
    }
    else if ("PointerValue" in linkDesc) {
      pointerList.push(linkDesc.PointerValue);
    }
    else {
      pointerList = this._loadPointers(data, linkDesc.PointerFromName.split("/"), pointerList);
    }
    return pointerList;
  }

  loadLinkPointerType(data, linkDesc) {
    if (!this.data)
      return null;

    /* Load pointer_type value */
    let pointer_type;
    if ("PointerType" in linkDesc) {
      pointer_type = linkDesc.PointerType;
    }
    else if ("PointerTypeGetFunc" in linkDesc && linkDesc.PointerTypeGetFunc) {
      pointer_type = linkDesc.PointerTypeGetFunc(data, linkDesc.PointerFromName);
    }
    else if ("PointerTypeName" in linkDesc && "PointerTypeMap" in linkDesc)  {
      let tptype = data.getElementsByTagName(linkDesc.PointerTypeName)[0].textContent;
      pointer_type = linkDesc.PointerTypeMap[tptype];
    }
    return pointer_type;
  }

  static _splitLinkPointerType(pointerType) {
    if (!pointerType) {
      return null;
    }

    if (pointerType.indexOf("|") < 0) {
        return pointerType;
    }

    let pointerTypes = pointerType.split("|");
    for (let i = pointerTypes.length - 1; i >=0; i--) {
      pointerTypes[i] = pointerTypes[i].trim();
      if (pointerTypes[i].length === 0) {
        pointerTypes.splice(i, 1);
      }
    }

    return pointerTypes;
  }

  _loadLinkInfo(data, linkDescList) {
    let link_info = [];
    for (let i = 0; i < linkDescList.length; i++) {
      let linkDesc = linkDescList[i];
      let pointerList = this.loadLinkPointer(data, linkDesc);
      if (pointerList == null) {
        continue;
      }

      /* Load pointer type */
      let pointer_type = this.loadLinkPointerType(data, linkDesc);
      if (pointer_type == null) {
          continue;
      }

      if (Array.isArray(pointer_type)) {
        let link_info2 = this._loadLinkInfo(data, pointer_type);
        link_info = link_info.concat(link_info2);
      }
      else {
        let link_info_item = {
            pointer_from_name: linkDesc.PointerFromName,
            pointer_to_name: linkDesc.PointerToName,
            pointer_type: NetNode._splitLinkPointerType(pointer_type),
            pointer_list: pointerList,
        };
        if (linkDesc.PointerNote != null)
          link_info_item.note = linkDesc.PointerNote;
        link_info.push(link_info_item);
      }
    }

    return link_info;
  }

  loadLinkInfo() {
    if (this.data == null || this.templateInfo.Link == null)
      return [];
    return this._loadLinkInfo(this.data, this.templateInfo.Link);
  }
}

export class NetLink {
  constructor(fromNode, fromAttr, toNode, toAttr) {
    this.fromAttr = fromAttr;
    this.toAttr = toAttr;
    this.fromNode = fromNode;
    this.toNode = toNode;
  }

  draw() {
    return {
      from: this.fromNode.id,
      to: this.toNode.id,
      label: this.note ? this.note : "",
    };
  }
}

export class ParentLink extends NetLink {
  constructor(child, parent) {
    super(child, "parent", parent, "child");
  }
}

export class NetDiagram {
  constructor(xmlTemplate, xmlItemKeyName) {
    this.xmlTemplate = xmlTemplate;
    this.xmlItemKeyName = xmlItemKeyName;

    this.node_count = 0;
    this.nodes = {};
    this.node_list = [];
    this.links = [];
    this.xmlDoc = null;

    this.defaultNodeClass = NetNode;
    this.defaultLinkCLass = NetLink;
  }

  draw() {
      let nodes = new vis.DataSet([]);
      let edges = new vis.DataSet([]);

      for (let itemType in this.nodes) {
        for (let i = 0; i < this.nodes[itemType].length; i++) {
          nodes.add(this.nodes[itemType][i].draw())
        }
      }

      for (let i = 0; i < this.links.length; i++) {
        edges.add(this.links[i].draw())
      }

      return { nodes: nodes, edges: edges };
  }

  _findAvoidLink(fromType, toType, avoidLinkInfo) {
      if (!avoidLinkInfo ||
          avoidLinkInfo[fromType] == null)
          return false;

      if (Array.isArray(avoidLinkInfo[fromType]))
          return avoidLinkInfo[fromType].includes(toType);

      if (avoidLinkInfo[fromType] === "*" || avoidLinkInfo[fromType] === toType)
          return true;

      return false;
  }

  _drawNodeTree(data, startNode, visitedNodes, avoidNodeInfo, avoidLinkInfo) {
      if (!startNode ||
          (Array.isArray(avoidNodeInfo) && avoidNodeInfo.includes(startNode.type)))
          return data;

      if (visitedNodes[startNode.id] == null) {
          visitedNodes[startNode.id] = startNode.id;

          data.nodes.add(startNode.draw());

          for (let i = 0; i < startNode.links.length; i++) {
              let nextMib = null;
              if (startNode.links[i].fromNode.id === startNode.id) {
                  nextMib = startNode.links[i].toNode;

                  /* Only draw when it is a start link */
                  data.edges.add(startNode.links[i].draw());
              }
              else if (startNode.links[i].toNode.id === startNode.id) {
                  nextMib = startNode.links[i].fromNode;
              }

              if (nextMib && visitedNodes[nextMib.id] == null) {
                  if (!this._findAvoidLink(startNode.type, nextMib.type, avoidLinkInfo))
                      this._drawNodeTree(data, nextMib, visitedNodes, avoidNodeInfo, avoidLinkInfo);
              }
          }
      }

      return data;
  }

  drawNodeTree(startNodeType, startNodeKey, avoidNodeInfo, avoidLinkInfo) {
      let data = { nodes: new vis.DataSet([]), edges: new vis.DataSet([]) };
      let visitedNodes = {};
      return this._drawNodeTree(data, this.findNode(startNodeType, this.xmlItemKeyName, startNodeKey),
              visitedNodes, avoidNodeInfo, avoidLinkInfo);
  }

  findNode(itemType, key, value) {
    let node_list = this.nodes[itemType];
    if (!node_list)
      return null;

    for (let i = 0; i < node_list.length; i++) {
      let tmp_val = node_list[i].data.getElementsByTagName(key)[0];
      if (!tmp_val)
        continue;

      // Use string to compare
      if (tmp_val.textContent === value.toString()) {
        return node_list[i];
      }
    }

    return null;
  }

  _getNodeClass(templateInfo) {
    if (templateInfo.NodeClass)
      return templateInfo.NodeClass;
    else
      return this.defaultNodeClass;
  }

  _getLinkClass(templateInfo) {
    if (templateInfo.LinkClass)
      return templateInfo.LinkClass;
    else
      return this.defaultLinkCLass;
  }

  _getNextNodeId() {
    return this.node_count + 1;
  }

  createNode(parent, itemClass, itemType, itemData, templateInfo) {
    /* Create nodes */
    let new_node = itemClass.parseXml(itemClass, 0, itemType,
                                  this.xmlItemKeyName, itemData, templateInfo["AttrMap"]);
    if (new_node == null)
      return null;

    new_node.templateInfo = templateInfo;
    new_node.parent = parent;

    let new_node_list = [new_node];

    if (templateInfo["ChildNode"]) {
      for (let childType in templateInfo["ChildNode"]) {
        let childItems = itemData.getElementsByTagName(childType);
        if (childItems) {
          for (let i = 0; i < childItems.length; i++) {
            let nodeClass = this._getNodeClass(templateInfo["ChildNode"][childType]);
            let newNodeList = this.createNode(new_node, nodeClass, childType, childItems.item(i), templateInfo["ChildNode"][childType]);
            if (newNodeList == null || newNodeList.length === 0)
              continue;

            new_node_list = new_node_list.concat(newNodeList);
          }
        }
      }
    }

    return new_node_list;
  }

  getNode(id) {
    if (id === 0 || id - 1 >= this.node_list.length)
      return null;

    return this.node_list[id - 1];
  }

  parseXml(xmlString) {
    if (xmlString == null)
      return false;

    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(xmlString, "text/xml");

    let link_info = {};

    /* Parse info from XML, create nodes and record link info */
    for (let itemType in this.xmlTemplate) {
      let items = xmlDoc.getElementsByTagName(itemType);
      if (items)
      {
        this.nodes[itemType] = [];
        link_info[itemType] = [];
        for (let i = 0; i < items.length; i++)
        {
          /* Get node class */
          let nodeClass = this._getNodeClass(this.xmlTemplate[itemType]);
          let newNodeList = this.createNode(null, nodeClass, itemType,
                                items.item(i), this.xmlTemplate[itemType]);
          if (newNodeList == null)
            continue;

          for (let j = 0; j < newNodeList.length; j++) {
            let curr_new_node = newNodeList[j];
            let curr_type = curr_new_node.type;

            curr_new_node.id = this._getNextNodeId();

            if (this.nodes[curr_type] == null)
              this.nodes[curr_type] = [];

            this.nodes[curr_type].push(curr_new_node);
            this.node_list.push(curr_new_node);
            this.node_count++;

            /* Link info to nodes needs to be 1:1 */
            if (link_info[curr_type] == null)
              link_info[curr_type] = [];

            let tmp = curr_new_node.loadLinkInfo();
            link_info[curr_type].push(tmp);
          }
        }
      }
    }

    /* Create actual links */
    for (let itemType in link_info) {
      /* Previously node list and link list were created 1:1 */
      let node_list = this.nodes[itemType];
      let link_list = link_info[itemType];
      for (let i = 0; i < link_list.length; i++) {
        let from = node_list[i];

        if (from.parent) {
          let to = from.parent;
          let new_link = new ParentLink(from, to);
          this.links.push(new_link);
          from.links.push(new_link);
          to.links.push(new_link);
        }

        for (let j = 0; j < link_list[i].length; j++) {
          let link_info_item = link_list[i][j];
          for (let k = 0; k < link_info_item.pointer_list.length; k++) {
            let to = null;
            if (typeof link_info_item.pointer_type == "string") {
              to = this.findNode(link_info_item.pointer_type,
                                  link_info_item.pointer_to_name,
                                  link_info_item.pointer_list[k]);
            }
            else if (Array.isArray(link_info_item.pointer_type)) {
              let l = 0;
              while (to == null && l < link_info_item.pointer_type.length) {
                to = this.findNode(link_info_item.pointer_type[l],
                                    link_info_item.pointer_to_name,
                                    link_info_item.pointer_list[k]);
                l++;
              }
            }

            if (from && to) {
              let linkClass = this._getLinkClass(from.templateInfo);
              let new_link = new linkClass(from, link_info_item.pointer_from_name,
                                         to, link_info_item.pointer_to_name);
              if (link_info_item.note)
                new_link.note = link_info_item.note;
              this.links.push(new_link);

              from.links.push(new_link);
              to.links.push(new_link);
            }
          }
        }
      }
    }

    this.xmlDoc = xmlDoc;
    return true;
  }
}



