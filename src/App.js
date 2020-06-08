import React from "react";
import Mapper from "./components/mapper";
import "./App.css";

import OmciDiagram from "./netDiagram/omci/omciDiagram";
import {
  OmciConfigDiagramDisplay,
  OmciConfigVisDisplay,
  OmciConfigJsTreeDisplay,
} from "./netDiagram/omci/omciConfig";

import Model1Diagram from "./netDiagram/model1/model1Diagram";
import {
  Model1ConfigDiagramDisplay,
  Model1ConfigVisDisplay,
  Model1ConfigJsTreeDisplay,
} from "./netDiagram/model1/model1Config";

function App() {
  let mode = "OMCI";
  let diagramClass = null;
  let configVisDisplay = null;
  let configJsTreeDisplay = null;
  let configDiagramDisplay = null;

  if (mode === "OMCI") {
    diagramClass = OmciDiagram;
    configVisDisplay = OmciConfigVisDisplay;
    configJsTreeDisplay = OmciConfigJsTreeDisplay;
    configDiagramDisplay = OmciConfigDiagramDisplay;
  } else if (mode === "Model1") {
    diagramClass = Model1Diagram;
    configVisDisplay = Model1ConfigVisDisplay;
    configJsTreeDisplay = Model1ConfigJsTreeDisplay;
    configDiagramDisplay = Model1ConfigDiagramDisplay;
  } else {
    return <main className="container-fluid">Unsupported mode {mode}</main>;
  }

  return (
    <main className="container-fluid">
      <Mapper
        mode={mode}
        diagramClass={diagramClass}
        configVisDisplay={configVisDisplay}
        configJsTreeDisplay={configJsTreeDisplay}
        configDiagramDisplay={configDiagramDisplay}
      />
    </main>
  );
}

export default App;
