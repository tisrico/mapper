export var RdpConfigDiagramDisplay = {
  // keep default/all links the first member of this data structure
  "All Links": ["RdpParentLink", "RdpUpstreamLink", "RdpDownstreamLink", "RdpBidirectionalStreamLink", "RdpReferenceLink" ],
  "Traffic Links": ["RdpUpstreamLink", "RdpDownstreamLink", "RdpBidirectionalStreamLink"],
  "Upstream Links": ["RdpUpstreamLink"],
  "Downstream Links": ["RdpDownstreamLink"],
  "Bidirectional Links": ["RdpBidirectionalStreamLink"],
  "Ownership Links": ["RdpParentLink"],
  "Reference Links": ["RdpReferenceLink"],
  "None Traffic Links": ["RdpReferenceLink", "RdpParentLink"],
  filter_by_links: true,
};

export var RdpConfigVisDisplay = {
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
      nodeDistance: 280,
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
    hoverWidth: 6,
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
    navigationButtons: true,
  },
};

export var RdpConfigJsTreeDisplay = {
  core: {
    multiple: false,
    themes: {
      variant: "small",
      stripes: true,
    },
  },
  plugins: ["wholerow"],
};
