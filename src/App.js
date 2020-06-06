import React from "react";
import Mapper from "./components/mapper"
import "./App.css";

import OmciDiagram from "./netDiagram/omci/omciDiagram";
import { OmciConfigDiagramDisplay, OmciConfigVisDisplay } from "./netDiagram/omci/omciConfig";

function App() {
  return (
    <main className="container-fluid">
      <Mapper
        mode="OMCI"
        diagramClass={OmciDiagram}
        configVisDisplay={OmciConfigVisDisplay}
        configDiagramDisplay={OmciConfigDiagramDisplay}
        />
    </main>
  );
}

export default App;
