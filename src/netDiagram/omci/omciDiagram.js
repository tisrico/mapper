import { NetNode, NetNodeAttribute, NetLink, NetDiagram } from "../netDiagram";
import {
  MibAttrUtil,
  MibAttrVlanTaggingBehaviour,
  MibAttrExtVlanDsMode,
  MibAttrVlanFilterList,
  MibAttrForwardOption,
} from "./omciAttribute.js";

class OmciMibAttr extends NetNodeAttribute {
  _drawPlainAttr(attrName, attrData) {
    let data = attrData.textContent.trim();
    let data_int = parseInt(data, 10);

    let draw_data = super._drawPlainAttr(attrName, attrData);
    if (data_int.toString() === data && data_int !== 0) {
      draw_data["children"] = [
        { icon: "jstree-file", text: "bin: 0b" + data_int.toString(2) },
        { icon: "jstree-file", text: "dec: " + data },
        { icon: "jstree-file", text: "hex: 0x" + data_int.toString(16) },
      ];
    }

    return draw_data;
  }

  draw() {
    if (this.attrData.children.length > 0) {
      if (this.attrData.attributes.getNamedItem("instance") === null)
        return null;
      else if (this.attrData.attributes.getNamedItem("nextInstance"))
        return null;
    }

    let draw_data = super.draw();
    return draw_data;
  }
}

class OmciMibAttrString extends OmciMibAttr {
  draw() {
    let draw_data = super.draw();
    if (this.MibAttrClass != null) {
      let attr = this.MibAttrClass.parse(this.attrData.textContent.trim());
      if (attr != null) {
        let dump = attr.dump().split("\n");
        draw_data["children"] = [];
        for (let i = 0; i < dump.length; i++) {
          if (dump[i].length === 0) continue;
          draw_data["children"].push({
            icon: "jstree-file",
            state: { opened: true },
            text: MibAttrUtil.htmlEntities(dump[i]),
          });
        }
      }
      draw_data["state"] = { opened: true };
    }
    return draw_data;
  }
}

class VlanFilterListAttr extends OmciMibAttrString {
  constructor(attrName, attrData) {
    super(attrName, attrData);
    this.MibAttrClass = MibAttrVlanFilterList;
  }
}

class DownstreamModeAttr extends OmciMibAttrString {
  constructor(attrName, attrData) {
    super(attrName, attrData);
    this.MibAttrClass = MibAttrExtVlanDsMode;
  }
}

class ForwardOptionAttr extends OmciMibAttrString {
  constructor(attrName, attrData) {
    super(attrName, attrData);
    this.MibAttrClass = MibAttrForwardOption;
  }
}

class OmciMibAttrHexString extends OmciMibAttr {
  _hex2a(hexString) {
    let str = "";
    for (
      let i = 0;
      i < hexString.length && hexString.substr(i, 2) !== "00";
      i += 2
    )
      str += String.fromCharCode(parseInt(hexString.substr(i, 2), 16));
    return str;
  }

  draw() {
    let draw_data = super.draw();
    draw_data["children"] = [
      {
        icon: "jstree-file",
        text: '"' + this._hex2a(this.attrData.textContent.trim()) + '"',
      },
    ];
    draw_data["state"] = { opened: true };
    return draw_data;
  }
}

class OmciMibAttrVendorProductCode extends OmciMibAttr {
  draw() {
    let draw_data = super.draw();
    let data = this.attrData.textContent.trim();
    let data_int = parseInt(data, 10);

    if (data_int.toString() === data) {
      draw_data["children"] = [
        // Vendor product code is presented in big-endian mode
        {
          icon: "jstree-file",
          text:
            data_int !== 0
              ? 'STR: "' +
                String.fromCharCode((data_int >> 8) & 0xff) +
                String.fromCharCode(data_int & 0xff) +
                '"'
              : "NOT_SET",
        },
        {
          icon: "jstree-file",
          text: "HEX: 0x" + ("0000" + data_int.toString(16)).slice(-4),
        },
      ];
    }

    draw_data["state"] = { opened: true };
    return draw_data;
  }
}

class SerialNumberAttr extends OmciMibAttrHexString {
  draw() {
    let data = this.attrData.textContent.trim();
    let data1 = data.slice(0, 8);
    let data2 = data.substr(8);
    let draw_data = super.draw();
    draw_data["children"] = [
      {
        icon: "jstree-file",
        text: "Hex(8): " + data1.toUpperCase() + "-" + data2.toUpperCase(),
      },
      {
        icon: "jstree-file",
        text:
          'STR(4)+HEX(4): "' + this._hex2a(data1) + data2.toUpperCase() + '"',
      },
      { icon: "jstree-file", text: 'STR(8): "' + this._hex2a(data) + '"' },
    ];
    draw_data["state"] = { opened: true };
    return draw_data;
  }
}

class OmciMibAttrBytePerSec extends OmciMibAttr {
  draw() {
    let data = this.attrData.textContent.trim();
    let data_byte = parseInt(data, 10);
    let data_bit = data_byte * 8;

    let draw_data = super.draw();
    draw_data["children"] = [
      { icon: "jstree-file", text: data_byte + " byte/s" },
      { icon: "jstree-file", text: data_bit + " bit/s" },
    ];

    draw_data["state"] = { opened: true };
    return draw_data;
  }
}

class VlanTaggingBehaviourAttr extends OmciMibAttr {
  draw() {
    if (this.attrData.children.length === 0) return null;

    let attr = MibAttrVlanTaggingBehaviour.parse(
      this.attrData.children[0].textContent.trim()
    );
    let draw_data = super.draw();

    if (draw_data && draw_data["children"][0]) {
      draw_data["children"][0]["children"] = [];
      let dump = attr.dump().split("\n");

      for (let i = 0; i < dump.length; i++) {
        draw_data["children"][0]["children"].push({
          icon: "jstree-file",
          state: { opened: true },
          text: MibAttrUtil.htmlEntities(dump[i]),
        });
      }
    }

    draw_data["children"][0]["state"] = { opened: true };
    return draw_data;
  }
}

class OmciMib extends NetNode {
  constructor(id, type, key, data, attrMap) {
    super(id, type, key, data, attrMap);
    this.defaultAttrClass = OmciMibAttr;
  }

  static parseKey(key) {
    return parseInt(key);
  }

  static parseXml(className, id, type, keyName, data, attrMap) {
    let new_obj = null;
    if (type === "X_BROADCOM_COM_OmciSystem") {
      new_obj = super.parseXml(className, id, type, null, data, attrMap);
    } else {
      new_obj = super.parseXml(className, id, type, keyName, data, attrMap);
    }

    return new_obj;
  }

  getDisplayName() {
    let displayTemplate = omciDisplayTemplate[this.type].NodeTemplate;
    if (displayTemplate.display_name)
      return displayTemplate.display_name + " " + this.key;
    else return this.type + " " + this.key;
  }

  draw() {
    let node_data = super.draw();

    node_data.shape = "box";
    node_data.margin = 12;
    node_data.font = { size: 24 };

    let g988_template = omciTemplate[this.type]["G988"];
    if (g988_template) {
      let title = "<div class='node_title'>";
      title +=
        "<div class='node_item node_key'>" + g988_template.name + "</div>";

      if (g988_template.class_id)
        title +=
          "<div class='node_item'>MeClass: " +
          g988_template.class_id +
          "</div>";
      title += "<div class='node_item'>MeId: " + this.key + "</div>";

      title += "<div class='node_item'>&nbsp;</div>";

      if (g988_template.chapter)
        title +=
          "<div class='node_item'>Chapter: " + g988_template.chapter + "</div>";

      if (g988_template.page)
        title +=
          "<div class='node_item'>Page: " + g988_template.page + "</div>";
      title += "</div>";

      node_data.title = title;
    }

    let displayTemplate = omciDisplayTemplate[this.type].NodeTemplate;
    if (displayTemplate.level) node_data.level = displayTemplate.level;
    if (displayTemplate.color) node_data.color = displayTemplate.color;
    if (displayTemplate.margin) node_data.margin = displayTemplate.margin;
    if (displayTemplate.shape) node_data.shape = displayTemplate.shape;
    return node_data;
  }

  drawAttr() {
    return super.drawAttr(omciTemplate[this.type]["AttrMap"]);
  }
}

class UniMib extends OmciMib {
  static getCircuitPackMeid(xmlItem, pointerName) {
    let meid = UniMib.getXmlItemValue(xmlItem, OmciDiagram.getXmlItemKeyName());
    if (!meid) return null;
    meid = parseInt(meid);
    return 0x0100 | (meid >> 8);
  }
}

class PriorityQueueGMib extends OmciMib {
  static getRelatedPortMeid(xmlItem, pointerName) {
    let priority_queue_meid = PriorityQueueGMib.getXmlItemValue(
      xmlItem,
      OmciDiagram.getXmlItemKeyName()
    );
    let related_port_number = PriorityQueueGMib.getXmlItemValue(
      xmlItem,
      pointerName
    );

    if (!priority_queue_meid || !related_port_number) return null;
    priority_queue_meid = parseInt(priority_queue_meid);
    related_port_number = parseInt(related_port_number);

    if (priority_queue_meid >= 0 && priority_queue_meid <= 0x7fff) {
      /* Downstream */
      return related_port_number >> 16;
    } else if (priority_queue_meid >= 0x8000 && priority_queue_meid <= 0xffff) {
      /* Upstream */
      return 65536 + (related_port_number >> 16);
    }

    /* Invalid */
    return 65536;
  }

  static getRelatedPortType(xmlItem, pointerName) {
    let priority_queue_meid = PriorityQueueGMib.getXmlItemValue(
      xmlItem,
      OmciDiagram.getXmlItemKeyName()
    );
    if (!priority_queue_meid) return null;
    priority_queue_meid = parseInt(priority_queue_meid);
    if (priority_queue_meid >= 0 && priority_queue_meid <= 0x7fff) {
      /* Downstream */
      return "PptpEthernetUni|VirtualEthernetInterfacePoint";
    } else if (priority_queue_meid >= 0x8000 && priority_queue_meid <= 0xffff) {
      return "TCont";
    }
    return null;
  }
}

class OmciLink extends NetLink {
  draw() {
    let edge_data = super.draw();

    // Bend pbit links so they are overlapped
    if (
      this.fromNode.type === "MapperServiceProfile" &&
      this.fromAttr.search("InterworkTpPointerPriority") === 0
    ) {
      // charAt(0) -- > "InterworkTpPointerPriority0"
      let link_id = parseInt(
        this.fromAttr.charAt("InterworkTpPointerPriority".length)
      );
      let link_count = this.fromNode.links.length;
      let upper = link_id < link_count / 2;

      edge_data["smooth"] = {};
      edge_data["smooth"]["enabled"] = true;
      edge_data["smooth"]["type"] = upper ? "curvedCW" : "curvedCCW";
      edge_data["smooth"]["roundness"] = ((link_count - link_id) / 2) * 0.15;
    }

    return edge_data;
  }
}

class OmciDiagram extends NetDiagram {
  static getXmlItemKeyName() {
    return "ManagedEntityId";
  }

  constructor() {
    super(omciTemplate, OmciDiagram.getXmlItemKeyName());
    this.defaultNodeClass = OmciMib;
    this.defaultLinkCLass = OmciLink;
  }
}

export default OmciDiagram;

var omciTemplate = {
  X_BROADCOM_COM_OmciSystem: {
    Link: [
      {
        PointerToName: "ManagedEntityId",
        PointerType: "Omci",
        PointerValue: 0,
      },
    ],
  },
  Omci: {
    G988: {
      name: "OMCI",
      class_id: 287,
      chapter: "9.12.8",
      page: 357,
    },
    Link: [
      {
        PointerToName: "ManagedEntityId",
        PointerType: "OltG",
        PointerValue: 0,
      },
    ],
  },
  OltG: {
    G988: {
      name: "OLT-G",
      class_id: 131,
      chapter: "9.12.2",
      page: 351,
    },
    AttrMap: {
      OltVendorId: OmciMibAttrHexString,
      EquipmentId: OmciMibAttrHexString,
      Version: OmciMibAttrHexString,
    },
  },
  AniG: {
    G988: {
      name: "ANI-G",
      class_id: 263,
      chapter: "9.2.1",
      page: 88,
    },
    Link: [
      {
        PointerFromName: "ManagedEntityId",
        PointerToName: "ManagedEntityId",
        PointerType: "Omci",
        PointerValue: 0,
      },
    ],
  },
  OntG: {
    G988: {
      name: "ONU-G",
      class_id: 256,
      chapter: "9.1.1",
      page: 55,
    },
    AttrMap: {
      VendorId: OmciMibAttrHexString,
      Version: OmciMibAttrHexString,
      SerialNumber: SerialNumberAttr,
    },
    Link: [
      {
        PointerFromName: "ManagedEntityId",
        PointerToName: "ManagedEntityId",
        PointerType: "AniG",
        PointerValue: 32769,
      },
    ],
  },
  Ont2G: {
    G988: {
      name: "ONU2-G",
      class_id: 257,
      chapter: "9.1.2",
      page: 59,
    },
    AttrMap: {
      EquipmentId: OmciMibAttrHexString,
      VendorProductCode: OmciMibAttrVendorProductCode,
    },
    Link: [
      {
        PointerFromName: "ManagedEntityId",
        PointerToName: "ManagedEntityId",
        PointerType: "OntG",
      },
    ],
  },
  OnuG: {
    G988: {
      name: "ONU-G",
      class_id: 256,
      chapter: "9.1.1",
      page: 55,
    },
    AttrMap: {
      VendorId: OmciMibAttrHexString,
      Version: OmciMibAttrHexString,
      SerialNumber: SerialNumberAttr,
    },
    Link: [
      {
        PointerFromName: "ManagedEntityId",
        PointerToName: "ManagedEntityId",
        PointerType: "AniG",
        PointerValue: 32769,
      },
    ],
  },
  Onu2G: {
    G988: {
      name: "ONU2-G",
      class_id: 257,
      chapter: "9.1.2",
      page: 59,
    },
    AttrMap: {
      EquipmentId: OmciMibAttrHexString,
      VendorProductCode: OmciMibAttrVendorProductCode,
    },
    Link: [
      {
        PointerFromName: "ManagedEntityId",
        PointerToName: "ManagedEntityId",
        PointerType: "OnuG",
      },
    ],
  },
  CardHolder: {
    G988: {
      name: "Cardholder",
      class_id: 5,
      chapter: "9.1.5",
      page: 67,
    },
    AttrMap: {
      ExpectedEquipmentId: OmciMibAttrHexString,
      ActualEquipmentId: OmciMibAttrHexString,
    },
    Link: [
      {
        PointerToName: "ManagedEntityId",
        PointerType: "OntG",
        PointerValue: 0,
      },
      {
        PointerToName: "ManagedEntityId",
        PointerType: "OnuG",
        PointerValue: 0,
      },
    ],
  },
  CircuitPack: {
    G988: {
      name: "CircuitPack",
      class_id: 6,
      chapter: "9.1.6",
      page: 73,
    },
    AttrMap: {
      SerialNumber: SerialNumberAttr,
      VendorId: OmciMibAttrHexString,
      EquipmentId: OmciMibAttrHexString,
    },
    Link: [
      {
        PointerFromName: "ManagedEntityId",
        PointerToName: "ManagedEntityId",
        PointerType: "CardHolder",
      },
    ],
  },
  SoftwareImage: {
    G988: {
      name: "Software Image",
      class_id: 7,
      chapter: "9.1.4",
      page: 63,
    },
    AttrMap: {
      Version: OmciMibAttrHexString,
    },
    Link: [
      {
        PointerToName: "ManagedEntityId",
        PointerType: "OntG",
        PointerValue: 0,
      },
      {
        PointerToName: "ManagedEntityId",
        PointerType: "OnuG",
        PointerValue: 0,
      },
    ],
  },

  MacBridgeServiceProfile: {
    G988: {
      name: "MAC bridge service profile",
      class_id: 45,
      chapter: "9.3.1",
      page: 116,
    },
  },
  Dot1agCFMStack: {
    G988: {
      name: "Dot1ag CFM stack",
      class_id: 305,
      chapter: "9.3.25",
      page: 165,
    },
    Link: [
      {
        PointerFromName: "ManagedEntityId",
        PointerToName: "ManagedEntityId",
        PointerType: "MacBridgeServiceProfile",
      },
    ],
  },
  Dot1RateLimiter: {
    G988: {
      name: "Dot1 rate limiter",
      class_id: 298,
      chapter: "9.3.18",
      page: 152,
    },
    Link: [
      {
        PointerFromName: "ParentMePointer",
        PointerToName: "ManagedEntityId",
        PointerTypeName: "TpType",
        PointerTypeMap: {
          "1": "MacBridgeServiceProfile",
          "2": "MapperServiceProfile",
        },
      },
      {
        PointerFromName: "UpstreamUnicastFloodRatePointer",
        PointerToName: "ManagedEntityId",
        PointerType: "GemTrafficDescriptor",
      },
      {
        PointerFromName: "UpstreamBroadcastFloodRatePointer",
        PointerToName: "ManagedEntityId",
        PointerType: "GemTrafficDescriptor",
      },
      {
        PointerFromName: "UpstreamMulticastPayloadRatePointer",
        PointerToName: "ManagedEntityId",
        PointerType: "GemTrafficDescriptor",
      },
    ],
  },
  MacBridgePortConfigData: {
    G988: {
      name: "MAC bridge port configuration data",
      class_id: 47,
      chapter: "9.3.4",
      page: 119,
    },
    Link: [
      {
        PointerFromName: "BridgeId",
        PointerToName: "ManagedEntityId",
        PointerType: "MacBridgeServiceProfile",
      },
      {
        PointerFromName: "ManagedEntityId",
        PointerToName: "ManagedEntityId",
        PointerType: "VlanTaggingFilterData",
      },
      {
        PointerFromName: "TpPointer",
        PointerToName: "ManagedEntityId",
        PointerTypeName: "TpType",
        PointerTypeMap: {
          "1": "PptpEthernetUni",
          "4": "IpHostConfigData|Ipv6HostConfigData",
          "3": "MapperServiceProfile",
          "5": "GemInterworkingTp",
          "6": "MulticastGemInterworkingTp",
          "11": "VirtualEthernetInterfacePoint",
        },
      },
      {
        PointerFromName: "OutTdPointer",
        PointerToName: "ManagedEntityId",
        PointerType: "GemTrafficDescriptor",
      },
      {
        PointerFromName: "InTdPointer",
        PointerToName: "ManagedEntityId",
        PointerType: "GemTrafficDescriptor",
      },
    ],
  },
  VlanTaggingFilterData: {
    G988: {
      name: "VLAN tagging filter data",
      class_id: 84,
      chapter: "9.3.11",
      page: 128,
    },
    AttrMap: {
      ForwardOperation: ForwardOptionAttr,
      VlanFilterList: VlanFilterListAttr,
    },
  },
  PoEControl: {
    G988: {
      name: "Power over Ethernet (PoE) control",
      class_id: 349,
      chapter: "9.5.6",
      page: 210,
    },
    Link: [
      {
        PointerFromName: "ManagedEntityId",
        PointerToName: "ManagedEntityId",
        PointerType: "PptpEthernetUni",
      },
    ],
  },
  PptpEthernetUni: {
    NodeClass: UniMib,
    G988: {
      name: "Physical path termination point Ethernet UNI",
      class_id: 11,
      chapter: "9.5.1",
      page: 200,
    },
    Link: [
      {
        PointerFromName: "ManagedEntityId",
        PointerToName: "ManagedEntityId",
        PointerType: "CircuitPack",
        PointerGetFunc: UniMib.getCircuitPackMeid,
      },
    ],
  },
  VirtualEthernetInterfacePoint: {
    NodeClass: UniMib,
    G988: {
      name: "Virtual Ethernet interface point",
      class_id: 329,
      chapter: "9.5.5",
      page: 208,
    },
    Link: [
      {
        PointerFromName: "ManagedEntityId",
        PointerToName: "ManagedEntityId",
        PointerType: "CircuitPack",
        PointerGetFunc: UniMib.getCircuitPackMeid,
      },
    ],
  },
  UniG: {
    G988: {
      name: "UNI-G",
      class_id: 264,
      chapter: "9.12.1",
      page: 349,
    },
    Link: [
      {
        PointerFromName: "ManagedEntityId",
        PointerToName: "ManagedEntityId",
        PointerType: "PptpEthernetUni|VirtualEthernetInterfacePoint",
      },
    ],
  },
  ExtendedVlanTaggingOperationConfigurationData: {
    G988: {
      name: "Extended VLAN tagging operation configuration data",
      class_id: 171,
      chapter: "9.3.13",
      page: 133,
    },
    AttrMap: {
      DownstreamMode: DownstreamModeAttr,
      ReceivedFrameVlanTaggingOperationTable: VlanTaggingBehaviourAttr,
    },
    Link: [
      {
        PointerFromName: "AssociatedManagedEntityPointer",
        PointerToName: "ManagedEntityId",
        PointerTypeName: "AssociationType",
        PointerTypeMap: {
          "0": "MacBridgePortConfigData",
          "2": "PptpEthernetUni",
          "10": "VirtualEthernetInterfacePoint",
        },
      },
    ],
  },
  ALUDownstreamVlanTagEgressBehaviourSupplemental: {
    G988: {
      name: "Downstream Vlan Tag Egress Behaviour Supplemental",
      class_id: 65305,
      chapter: null,
      page: 0,
    },
    Link: [
      {
        PointerFromName: "ManagedEntityId",
        PointerToName: "ManagedEntityId",
        PointerType: "PptpEthernetUni|VirtualEthernetInterfacePoint",
      },
    ],
  },

  IpHostConfigData: {
    G988: {
      name: "IP host config data",
      class_id: 134,
      chapter: "9.4.1",
      page: 190,
    },
  },
  Ipv6HostConfigData: {
    G988: {
      name: "IPv6 host config data",
      class_id: 347,
      chapter: "9.4.5",
      page: 196,
    },
  },
  TcpUdpConfigData: {
    G988: {
      name: "TCP/UDP config data",
      class_id: 136,
      chapter: "9.4.3",
      page: 194,
    },
    Link: [
      {
        PointerFromName: "IpHostPointer",
        PointerToName: "ManagedEntityId",
        PointerType: "IpHostConfigData",
      },
    ],
  },
  MapperServiceProfile: {
    // MibNodeClass: MapperServiceProfileMib,
    G988: {
      name: "IEEE 802.1p mapper service profile",
      class_id: 130,
      chapter: "9.3.10",
      page: 126,
    },
    Link: [
      {
        PointerFromName: "TpPointer",
        PointerToName: "ManagedEntityId",
        PointerTypeName: "TpType",
        PointerTypeMap: {
          "0": [
            {
              PointerFromName: "InterworkTpPointerPriority0",
              PointerToName: "ManagedEntityId",
              PointerType: "GemInterworkingTp",
              PointerNote: "Pbit-0",
            },
            {
              PointerFromName: "InterworkTpPointerPriority1",
              PointerToName: "ManagedEntityId",
              PointerType: "GemInterworkingTp",
              PointerNote: "Pbit-1",
            },
            {
              PointerFromName: "InterworkTpPointerPriority2",
              PointerToName: "ManagedEntityId",
              PointerType: "GemInterworkingTp",
              PointerNote: "Pbit-2",
            },
            {
              PointerFromName: "InterworkTpPointerPriority3",
              PointerToName: "ManagedEntityId",
              PointerType: "GemInterworkingTp",
              PointerNote: "Pbit-3",
            },
            {
              PointerFromName: "InterworkTpPointerPriority4",
              PointerToName: "ManagedEntityId",
              PointerType: "GemInterworkingTp",
              PointerNote: "Pbit-4",
            },
            {
              PointerFromName: "InterworkTpPointerPriority5",
              PointerToName: "ManagedEntityId",
              PointerType: "GemInterworkingTp",
              PointerNote: "Pbit-5",
            },
            {
              PointerFromName: "InterworkTpPointerPriority6",
              PointerToName: "ManagedEntityId",
              PointerType: "GemInterworkingTp",
              PointerNote: "Pbit-6",
            },
            {
              PointerFromName: "InterworkTpPointerPriority7",
              PointerToName: "ManagedEntityId",
              PointerType: "GemInterworkingTp",
              PointerNote: "Pbit-7",
            },
          ],
          "1": "PptpEthernetUni",
          "2": "IpHostConfigData",
        },
      },
    ],
  },
  MulticastGemInterworkingTp: {
    G988: {
      name: "Multicast GEM interworking termination point",
      class_id: 281,
      chapter: "9.2.5",
      page: 96,
    },
    Link: [
      {
        PointerFromName: "GemPortNetworkCtpConnPointer",
        PointerToName: "ManagedEntityId",
        PointerType: "GemPortNetworkCtp",
      },
      {
        PointerFromName: "InterworkingOption",
        PointerToName: "ManagedEntityId",
        PointerTypeMap: {
          "5": "MapperServiceProfile",
        },
      },
    ],
  },
  GemInterworkingTp: {
    G988: {
      name: "GEM interworking termination point",
      class_id: 266,
      chapter: "9.2.4",
      page: 94,
    },
    Link: [
      {
        PointerFromName: "GemPortNetworkCtpConnPointer",
        PointerToName: "ManagedEntityId",
        PointerType: "GemPortNetworkCtp",
      },
    ],
  },
  GemPortNetworkCtp: {
    G988: {
      name: "GEM port network CTP",
      class_id: 268,
      chapter: "9.2.3",
      page: 92,
    },
    Link: [
      {
        PointerFromName: "TContPointer",
        PointerToName: "ManagedEntityId",
        PointerType: "TCont",
      },
      {
        PointerFromName: "UpstreamTrafficManagementPointer",
        PointerToName: "ManagedEntityId",
        PointerType: "PriorityQueueG",
      },
      {
        PointerFromName: "DownstreamPriorityQueuePointer",
        PointerToName: "ManagedEntityId",
        PointerType: "PriorityQueueG",
      },
      {
        PointerFromName: "UpstreamTrafficDescriptorProfilePointer",
        PointerToName: "ManagedEntityId",
        PointerType: "GemTrafficDescriptor",
      },
      {
        PointerFromName: "DownstreamTrafficDescriptorProfilePointer",
        PointerToName: "ManagedEntityId",
        PointerType: "GemTrafficDescriptor",
      },
    ],
  },
  GemTrafficDescriptor: {
    G988: {
      name: "Traffic descriptor",
      class_id: 280,
      chapter: "9.2.12",
      page: 106,
    },
    AttrMap: {
      CIR: OmciMibAttrBytePerSec,
      PIR: OmciMibAttrBytePerSec,
      CBS: OmciMibAttrBytePerSec,
      PBS: OmciMibAttrBytePerSec,
    },
  },
  PriorityQueueG: {
    G988: {
      name: "Priority queue",
      class_id: 277,
      chapter: "9.2.10",
      page: 101,
    },
    Link: [
      {
        PointerFromName: "RelatedPort",
        PointerToName: "ManagedEntityId",
        PointerTypeGetFunc: PriorityQueueGMib.getRelatedPortType,
        PointerGetFunc: PriorityQueueGMib.getRelatedPortMeid,
      },
      {
        PointerFromName: "TrafficSchedulerGPointer",
        PointerToName: "ManagedEntityId",
        PointerType: "TrafficSchedulerG",
      },
    ],
  },
  TCont: {
    G988: {
      name: "T-CONT",
      class_id: 262,
      chapter: "9.2.2",
      page: 90,
    },
  },
  TrafficSchedulerG: {
    G988: {
      name: "Traffic scheduler",
      class_id: 278,
      chapter: "9.2.11",
      page: 105,
    },
    Link: [
      {
        PointerFromName: "TContPointer",
        PointerToName: "ManagedEntityId",
        PointerType: "TCont",
      },
    ],
  },

  MulticastSubscriberConfigInfo: {
    G988: {
      name: "Multicast subscriber config info",
      class_id: 310,
      chapter: "9.3.28",
      page: 176,
    },
    Link: [
      {
        PointerFromName: "ManagedEntityId",
        PointerToName: "ManagedEntityId",
        PointerType: "MacBridgePortConfigData|MapperServiceProfile",
      },
      {
        PointerFromName: "MulticastOperationsProfilePointer",
        PointerToName: "ManagedEntityId",
        PointerType: "MulticastOperationsProfile",
      },
    ],
  },
  MulticastOperationsProfile: {
    G988: {
      name: "Multicast operations profile",
      class_id: 309,
      chapter: "9.3.27",
      page: 169,
    },
  },
};

var omciDisplayTemplate = {
  OltG: {
    NodeTemplate: {
      level: 1,
      display_name: "OLT-G",
      margin: 10,
    },
  },
  X_BROADCOM_COM_OmciSystem: {
    NodeTemplate: {
      level: 2,
      display_name: "OmciSystemCfg",
      margin: 10,
      color: "#9C9C9C",
    },
  },
  Omci: {
    NodeTemplate: {
      level: 2,
      display_name: "OMCI",
      margin: 10,
    },
  },
  AniG: {
    NodeTemplate: {
      level: 3,
      display_name: "ANI-G",
      margin: 10,
    },
  },
  OntG: {
    NodeTemplate: {
      level: 4,
      display_name: "ONU-G",
      margin: 10,
    },
  },
  Ont2G: {
    NodeTemplate: {
      level: 4,
      display_name: "ONU2-G",
      margin: 10,
    },
  },
  OnuG: {
    NodeTemplate: {
      level: 4,
      display_name: "ONU-G",
      margin: 10,
    },
  },
  Onu2G: {
    NodeTemplate: {
      level: 4,
      display_name: "ONU2-G",
      margin: 10,
    },
  },
  CardHolder: {
    NodeTemplate: {
      level: 5,
      display_name: "Cardholder",
      margin: 10,
    },
  },
  CircuitPack: {
    NodeTemplate: {
      level: 6,
      display_name: "CircuitPack",
      margin: 10,
    },
  },
  SoftwareImage: {
    NodeTemplate: {
      level: 5,
      margin: 10,
      color: "#9C9C9C",
    },
  },

  MacBridgeServiceProfile: {
    NodeTemplate: {
      level: 1,
      margin: 30,
      color: "#00FF00FF",
    },
  },
  Dot1agCFMStack: {
    NodeTemplate: {
      level: 2,
      color: "#9C9C9C",
    },
  },
  Dot1RateLimiter: {
    NodeTemplate: {
      level: 2,
      color: "#9C9C9C",
    },
  },
  MacBridgePortConfigData: {
    NodeTemplate: {
      level: 2,
    },
  },
  VlanTaggingFilterData: {
    NodeTemplate: {
      level: 3,
      color: "yellow",
    },
  },
  PoEControl: {
    NodeTemplate: {
      level: 7,
    },
  },
  PptpEthernetUni: {
    NodeTemplate: {
      level: 7,
      color: "red",
      mass: 0.8,
      margin: 30,
    },
  },
  VirtualEthernetInterfacePoint: {
    NodeTemplate: {
      level: 7,
      color: "red",
      mass: 0.8,
      margin: 30,
    },
  },
  UniG: {
    NodeTemplate: {
      level: 9,
      mass: 0.8,
      margin: 30,
    },
  },
  ExtendedVlanTaggingOperationConfigurationData: {
    NodeTemplate: {
      display_name: "ExtVlanTaggingConfig",
      level: 6,
      margin: 30,
      color: "#9C9C9C",
    },
  },
  ALUDownstreamVlanTagEgressBehaviourSupplemental: {
    NodeTemplate: {
      display_name: "AluDsVlanTagEgressBehaviour",
      level: 6,
      color: "#9C9C9C",
    },
  },

  IpHostConfigData: {
    NodeTemplate: {
      level: 4,
      margin: 30,
      color: "red",
      mass: 0.8,
    },
  },
  Ipv6HostConfigData: {
    NodeTemplate: {
      level: 4,
      margin: 30,
      color: "red",
      mass: 0.8,
    },
  },
  TcpUdpConfigData: {
    NodeTemplate: {
      level: 5,
    },
  },
  MapperServiceProfile: {
    NodeTemplate: {
      level: 3,
    },
  },
  MulticastGemInterworkingTp: {
    NodeTemplate: {
      level: 4,
    },
  },
  GemInterworkingTp: {
    NodeTemplate: {
      level: 4,
    },
  },
  GemPortNetworkCtp: {
    NodeTemplate: {
      level: 5,
    },
  },
  GemTrafficDescriptor: {
    NodeTemplate: {
      level: 6,
      display_name: "Traffic descriptor",
      color: "#9C9C9C",
    },
  },
  PriorityQueueG: {
    NodeTemplate: {
      display_name: "Q",
      level: 8,
      shape: "ellipse",
      margin: 5,
    },
  },
  TCont: {
    NodeTemplate: {
      level: 7,
      margin: 30,
      color: "red",
      mass: 0.2,
    },
  },
  TrafficSchedulerG: {
    NodeTemplate: {
      level: 9,
      color: "#9C9C9C",
    },
  },

  MulticastSubscriberConfigInfo: {
    NodeTemplate: {
      level: 3,
    },
  },
  MulticastOperationsProfile: {
    NodeTemplate: {
      level: 4,
    },
  },
};
