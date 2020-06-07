import React, { Component } from "react";
import Split from "react-split";
import vis from "vis";
import "vis/dist/vis-network.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";

import TreeView from "./treeView";
import Menu from "./menu";
import "./css/mapper.css";

class Mapper extends Component {
    state = {
        settings: {
            physics: this.props.configVisDisplay.physics.enabled,
            show_all: false,
        },

        views: [],
        selectedView: null,

        treeData: [],
        treeConfig: {...this.props.configJsTreeDisplay},
    };

    componentDidMount() {
        this.visNetworkRef = React.createRef();
    }

    handleTogglePhysics = () => {
        const settings = { ...this.state.settings };
        settings.physics = !settings.physics;

        this.state.settings.physics = settings.physics;
        this.setState({ settings });
        this.showNetwork();
    };

    handleToggleShowAll = () => {
        const settings = { ...this.state.settings };
        settings.show_all = !settings.show_all;

        this.state.settings.show_all = settings.show_all;
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

    handleSelectNode = (visNetworkObj) => {
        let selected = this.diagram.getNode(visNetworkObj.nodes[0]);
        if (selected)
            this.showNetworkInfo([selected.drawAttr()]);
    };

    handleDeselectNode = (visNetworkObj) => {
        this.showNetworkInfo(null);
    };

    loadedXmlData(xmlData) {
        let t0 = performance.now();

        this.diagram = new this.props.diagramClass();
        if (!this.diagram.parseXml(xmlData)) return false;

        /* Get views */
        let views = [];
        for (let key in this.props.configDiagramDisplay) {
            for (let i = 0; i < this.diagram.nodes[key].length; i++) {
                let mib = this.diagram.nodes[key][i];
                let option = key + " " + mib.key;
                views.push(option);
            }
        }

        let t1 = performance.now();
        this.networkInfo = {
            id: 1,
            text: this.props.mode + " Diagram Info",
            state: { opened: true },
            children: [
                {
                    icon: "jstree-file",
                    text: "Data load time: " + parseInt(t1 - t0) + "ms",
                },
                {
                    icon: "jstree-file",
                    text: "Total node: " + this.diagram.node_count,
                },
                {
                    icon: "jstree-file",
                    text: "Total link: " + this.diagram.links.length,
                },
            ],
        };

        this.setState({
            views: views,
            selectedView: views[0],
        });
        return true;
    }

    showNetwork() {
        if (!this.diagram)
            return;

        var t0 = performance.now();

        let displayTreeRoot = null;
        if (!this.state.settings.show_all && this.state.selectedView != null) {
            let selected = this.state.selectedView.split(" ");
            if (selected.length === 2) {
                displayTreeRoot = { type: selected[0], key: selected[1] };
            }
        }

        let data = null;
        if (displayTreeRoot == null) {
            data = this.diagram.draw();
        } else {
            data = this.diagram.drawNodeTree(
                displayTreeRoot.type,
                displayTreeRoot.key,
                this.props.configDiagramDisplay[displayTreeRoot.type][
                    "AvoidNode"
                ],
                this.props.configDiagramDisplay[displayTreeRoot.type][
                    "AvoidLink"
                ]
            );
        }

        const container = this.visNetworkRef.current;
        if (!container) {
            return;
        }

        let config = {...this.props.configVisDisplay};
        config.physics.enabled = this.state.settings.physics;

        this.visNetwork = new vis.Network(container, data, config);
        this.visNetwork.on("selectNode", this.handleSelectNode);
        this.visNetwork.on("deselectNode", this.handleDeselectNode);

        let t1 = performance.now();
        this.displayInfo = {
            id: 2,
            text: "Displayed " + this.props.mode + " diagram",
            state: { opened: true },
            children: [
                {
                    icon: "jstree-file",
                    text: "Displayed load time: " + parseInt(t1 - t0) + "ms",
                },
                {
                    icon: "jstree-file",
                    text: "Displayed node: " + data.nodes.length,
                },
                {
                    icon: "jstree-file",
                    text: "Displayed link: " + data.edges.length,
                },
            ],
        };

        this.showNetworkInfo(null);
    }

    showNetworkInfo(displayInfo) {
        if (displayInfo == null)
            this.setState({ treeData: [this.networkInfo, this.displayInfo] });
        else
            this.setState({ treeData: displayInfo });
    }

    render() {
        const {
            settings,
            selectedView,
            views,
            treeData,
            treeConfig,
        } = this.state;

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
                    <div className="split split-left" ref={this.visNetworkRef}></div>
                    <TreeView
                        className="split split-right"
                        treeConfig={treeConfig}
                        treeData={treeData}
                    />
                </Split>
            </div>
        );
    }
}

export default Mapper;
