export var OmciConfigDiagramDisplay = {
  MacBridgeServiceProfile: {
    AvoidNode: [],
    AvoidLink: {
      VirtualEthernetInterfacePoint: ["CircuitPack"],
      PptpEthernetUni: ["CircuitPack"],
      GemInterworkingTp: ["MacBridgePortConfigData"],

      // Avoid displaying objects from shared TCont to other MacBridgeServiceProfile
      MulticastGemInterworkingTp: ["MacBridgePortConfigData"],
      TCont: ["GemPortNetworkCtp"],
      PriorityQueueG: ["GemPortNetworkCtp"],
    },
  },
  OntG: {
    AvoidNode: [],
    AvoidLink: {
      PptpEthernetUni: "*",
      VirtualEthernetInterfacePoint: "*",
    },
  },
  OnuG: {
    AvoidNode: [],
    AvoidLink: {
      PptpEthernetUni: "*",
      VirtualEthernetInterfacePoint: "*",
    },
  },
};

export var OmciConfigVisDisplay = {
  layout: {
    hierarchical: {
      enabled: true,
      levelSeparation: 480,
      nodeSpacing: 60,
      treeSpacing: 90,
      blockShifting: false,
      edgeMinimization: false,
      parentCentralization: true,
      direction: "LR", // UD, DU, LR, RL
      sortMethod: "directed", // hubsize, directed
    },
  },
  physics: {
    enabled: true,
    hierarchicalRepulsion: {
      centralGravity: 0.0,
      springLength: 100,
      springConstant: 0.01,
      nodeDistance: 120,
      damping: 0.09,
    },
  },
  edges: {
    smooth: {
      type: "cubicBezier",
      forceDirection: "none",
      roundness: 0.6,
    },
    font: {
      align: "bottom",
      size: 26,
    },
  },
  nodes: {
    font: {
      size: 26,
    },
  },
  interaction: {
    hover: true,
    hoverConnectedEdges: true,
    tooltipDelay: 80,
  }
};

export var OmciConfigJsTreeDisplay = {
  core: {
    multiple: false,
    themes: {
      variant: "small",
      stripes: true,
    },
  },
  plugins: ["wholerow"],
};
