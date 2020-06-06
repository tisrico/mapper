import React, { Component } from "react";
import Split from "react-split";
import vis from "vis";
import Menu from "./menu";

import "./css/mapper.css";

class Mapper extends Component {
    state = {
        settings: {
            physics: true,
            show_all: false,
        },

        data: null,

        views: [],
        selectedView: null,
    };

    handleTogglePhysics = () => {
        const settings = { ...this.state.settings };
        settings.physics = !settings.physics;
        this.setState({ settings });
    };

    handleToggleShowAll = () => {
        const settings = { ...this.state.settings };
        settings.show_all = !settings.show_all;

        this.state.show_all = settings.show_all;
        this.setState({ settings });
        this.showNetwork();
    };

    handleLoadedData = (xmlData) => {
        if (this.loadedXmlData(xmlData))
            this.showNetwork();
    };

    handleSelectView = (view) => {
        this.state.selectedView = view;
        this.setState({ selectedView: view });
        this.showNetwork();
    };

    render() {
        const { settings, selectedView, views } = this.state;

        if (!this.diagramRef)
            this.diagramRef = React.createRef();

        if (!this.attributeRef)
            this.attributeRef = React.createRef();

        return (
            <div>
                <Menu
                    title={this.props.mode + " Mapper"}
                    settings={settings}
                    onLoadedData={this.handleLoadedData}
                    onTogglePhysics={this.handleTogglePhysics}
                    onToggleShowAll={this.handleToggleShowAll}
                    views={views}
                    selectedView={selectedView}
                    onSelectView={this.handleSelectView}
                />
                <div className="m-2"></div>
                <Split
                    sizes={[75, 25]}
                    minSize={[480, 240]}
                    expandToMin={false}
                    gutterSize={10}
                    gutterAlign="center"
                    direction="horizontal"
                    cursor="col-resize"
                >
                    <div className="split split-left" ref={this.diagramRef}></div>
                    <div className="split split-right" ref={this.attributeRef}></div>
                </Split>
            </div>
        );
    }

    loadedXmlData(xmlData) {
        this.diagram = new this.props.diagramClass();
        if (!this.diagram.parseXml(xmlData))
            return false;

        /* Get views */
        let views = [];
        for (let key in this.props.configDiagramDisplay) {
          for (let i = 0; i < this.diagram.nodes[key].length; i++) {
            let mib = this.diagram.nodes[key][i];
            let option = key + " " + mib.key;
            views.push(option);
          }
        }

        this.setState({
            views: views,
            selectedView: views[0]
        });
        return true;
    }

    showNetwork() {
        let displayTreeRoot = null;
        if (!this.state.show_all && this.state.selectedView != null) {
            let selected = this.state.selectedView.split(" ");
            if (selected.length === 2) {
              displayTreeRoot = {type: selected[0], key: selected[1]};
            }
        }

        let data = null;
        if (displayTreeRoot == null) {
            data = this.diagram.draw();
        }
        else {
            data = this.diagram.drawNodeTree(displayTreeRoot.type, displayTreeRoot.key,
                        this.props.configDiagramDisplay[displayTreeRoot.type]["AvoidNode"],
                        this.props.configDiagramDisplay[displayTreeRoot.type]["AvoidLink"]);
        }

        if (data) {
            const container = this.diagramRef.current;
            if (container) {
                let visConfig = {...this.props.configVisDisplay};
                visConfig.physics.enabled = this.state.settings.physics;
                this.visNetwork = new vis.Network(container, data, visConfig);
            }
        }
    }
}

export default Mapper;
