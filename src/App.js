import React from "react";
import Mapper from "./components/mapper";
import "./App.css";

import OmciDataRequest from "./netDiagram/omci/omciDataRequest";
import OmciDiagram from "./netDiagram/omci/omciDiagram";
import {
  OmciConfigDiagramDisplay,
  OmciConfigVisDisplay,
  OmciConfigJsTreeDisplay,
} from "./netDiagram/omci/omciConfig";

import Model1DataRequest from "./netDiagram/model1/model1DataRequest";
import Model1Diagram from "./netDiagram/model1/model1Diagram";
import {
  Model1ConfigDiagramDisplay,
  Model1ConfigVisDisplay,
  Model1ConfigJsTreeDisplay,
} from "./netDiagram/model1/model1Config";

import RdpDataRequest from "./netDiagram/rdp/rdpDataRequest";
import RdpDiagram from "./netDiagram/rdp/rdpDiagram";
import {
  RdpConfigDiagramDisplay,
  RdpConfigVisDisplay,
  RdpConfigJsTreeDisplay,
} from "./netDiagram/rdp/rdpConfig";

function App(props) {
  let mode = props.mode;
  let dataRequestFunc = null;
  let diagramClass = null;
  let configVisDisplay = null;
  let configJsTreeDisplay = null;
  let configDiagramDisplay = null;

  if (mode === "OMCI") {
    dataRequestFunc = OmciDataRequest;
    diagramClass = OmciDiagram;
    configVisDisplay = OmciConfigVisDisplay;
    configJsTreeDisplay = OmciConfigJsTreeDisplay;
    configDiagramDisplay = OmciConfigDiagramDisplay;
  } else if (mode === "Model1") {
    dataRequestFunc = Model1DataRequest;
    diagramClass = Model1Diagram;
    configVisDisplay = Model1ConfigVisDisplay;
    configJsTreeDisplay = Model1ConfigJsTreeDisplay;
    configDiagramDisplay = Model1ConfigDiagramDisplay;
  } else if (mode === "RDP") {
    dataRequestFunc = RdpDataRequest;
    diagramClass = RdpDiagram;
    configVisDisplay = RdpConfigVisDisplay;
    configJsTreeDisplay = RdpConfigJsTreeDisplay;
    configDiagramDisplay = RdpConfigDiagramDisplay;
  } else {
    return <main className="container-fluid">Unsupported mode {mode}</main>;
  }

  return (
    <main className="container-fluid">
      <Mapper
        mode={mode}
        dataRequestFunc={dataRequestFunc}
        diagramClass={diagramClass}
        configVisDisplay={configVisDisplay}
        configJsTreeDisplay={configJsTreeDisplay}
        configDiagramDisplay={configDiagramDisplay}
      />
    </main>
  );
}

export default App;
