import React, { Component } from "react";
import Split from "react-split";
import vis from "vis";
import "vis/dist/vis-network.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import { Toast } from "react-bootstrap";

import TreeView from "./treeView";
import Menu from "./menu";
import ModalSpinner from "./modalSpinner";
import "./css/mapper.css";

class Mapper extends Component {
    state = {
        settings: {
            physics: this.props.configVisDisplay.physics.enabled,
            show_all: false,
        },

        showMsg: false,
        msgData: "",

        showSpinner: false,

        views: [],
        selectedView: null,

        avoidableNodes: [],
        avoidedNodes: [],

        treeData: [],
        treeConfig: { ...this.props.configJsTreeDisplay },
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

        if (this.diagram && settings.show_all) this.showSpinner(true);

        this.state.settings.show_all = settings.show_all;
        this.setState({ settings });

        this.showNetwork();
    };

    handleLoadedData = (xmlFilename, xmlData) => {
        if (this.loadedXmlData(xmlFilename, xmlData)) {
            this.showNetwork();
            this.showMsg("Loaded XML data from " + xmlFilename + ".");
        }
    };

    handleViewXml = () => {
        const tagsToReplace = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
        };

        var reference = window.open("Booking.xml", "Booking XML");
        reference.document.write(
            "<pre>" +
                (this.xmlData ? this.xmlData : "").replace(/[&<>]/g, (tag) => {
                    return tagsToReplace[tag] || tag;
                }) +
                "</pre>"
        );
        reference.document.close();
    };

    handleSaveXml = () => {
        var element = document.createElement("a");
        element.setAttribute(
            "href",
            "data:text/xml;charset=utf-8," +
                encodeURIComponent(this.xmlData ? this.xmlData : "")
        );
        element.setAttribute(
            "download",
            this.xmlFilename ? this.xmlFilename : "data.xml"
        );

        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    handleSelectView = (view) => {
        this.state.selectedView = view;
        this.setState({ selectedView: view });
        this.showNetwork();
    };

    handleToggleAvoidNode = (node) => {
        let avoidedNodes = [...this.state.avoidedNodes];
        if (avoidedNodes.includes(node)) {
            const idx = avoidedNodes.indexOf(node);
            if (idx > -1) avoidedNodes.splice(idx, 1);
        } else {
            avoidedNodes.push(node);
        }

        if (this.diagram && this.state.settings.show_all) this.showSpinner(true);

        this.state.avoidedNodes = avoidedNodes;
        this.setState({ avoidedNodes });
        this.showNetwork();
    };

    handleSelectNode = (visNetworkObj) => {
        let selected = this.diagram.getNode(visNetworkObj.nodes[0]);
        if (selected) this.showNetworkInfo([selected.drawAttr()]);
    };

    showMsg(message) {
        this.setState({ showMsg: true, msgData: message });
    }

    showSpinner(newState) {
        if (newState === this.state.showSpinner) return;

        this.setState({ showSpinner: newState });
    }

    loadedXmlData(xmlFilename, xmlData) {
        this.showSpinner(true);
        let t0 = performance.now();

        this.xmlFilename = xmlFilename;
        this.xmlData = xmlData;
        this.diagram = new this.props.diagramClass();
        if (!this.diagram.parseXml(xmlData)) {
            this.showSpinner(false);
            this.showMsg("Failed to parse XML data in " + this.xmlFilename);
            return false;
        }

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

    updateAvoidableNodes(newAvoidableNodes) {
        let array1 = newAvoidableNodes;
        let array2 = this.state.avoidableNodes;

        if (
            !(
                array1.length === array2.length &&
                array1.sort().every(function (value, index) {
                    return value === array2.sort()[index];
                })
            )
        ) {
            this.state.avoidableNodes = newAvoidableNodes;
            this.state.avoidedNodes = [];
            this.setState({ avoidableNodes: newAvoidableNodes, avoidedNodes: [] });
        }
    }

    showNetwork() {
        if (!this.diagram) return;

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
            this.updateAvoidableNodes(Object.keys(this.diagram.nodes));
            data = this.diagram.draw(this.state.avoidedNodes);
        } else {
            this.updateAvoidableNodes(
                this.props.configDiagramDisplay[displayTreeRoot.type]["AvoidableNode"]);
            data = this.diagram.drawNodeTree(
                displayTreeRoot.type,
                displayTreeRoot.key,
                this.state.avoidedNodes,
                this.props.configDiagramDisplay[displayTreeRoot.type][
                    "AvoidLink"
                ]
            );
        }

        const container = this.visNetworkRef.current;
        if (!container) {
            return;
        }

        let config = { ...this.props.configVisDisplay };
        config.physics.enabled = this.state.settings.physics;

        this.visNetwork = new vis.Network(container, data, config);
        this.visNetwork.on("selectNode", (visNetworkObj) => {
            let selected = this.diagram.getNode(visNetworkObj.nodes[0]);
            if (selected) this.showNetworkInfo([selected.drawAttr()]);
        });
        this.visNetwork.on("deselectNode", (visNetworkObj) => {
            this.showNetworkInfo(null);
        });
        this.visNetwork.on("afterDrawing", () => {
            this.showSpinner(false);
        });

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
        else this.setState({ treeData: displayInfo });
    }

    render() {
        const {
            settings,
            showMsg,
            msgData,
            showSpinner,
            selectedView,
            views,
            treeData,
            treeConfig,
            avoidableNodes,
            avoidedNodes,
        } = this.state;

        return (
            <div>
                <ModalSpinner show={showSpinner} />
                <Menu
                    title={this.props.mode + " Mapper"}
                    settings={settings}
                    dataAvailable={this.xmlData ? true : false}
                    onLoadedData={this.handleLoadedData}
                    onViewXml={this.handleViewXml}
                    onSaveXml={this.handleSaveXml}
                    onTogglePhysics={this.handleTogglePhysics}
                    onToggleShowAll={this.handleToggleShowAll}
                    views={views}
                    selectedView={selectedView}
                    onSelectView={this.handleSelectView}
                    avoidableNodes={avoidableNodes}
                    avoidedNodes={avoidedNodes}
                    onToggleAvoidNode={this.handleToggleAvoidNode}
                />
                <div className="m-2"></div>
                <Toast
                    onClose={() => {
                        this.setState({ showMsg: false });
                    }}
                    show={showMsg}
                    delay={3000}
                    autohide
                    style={{
                        position: "absolute",
                        top: "30px",
                        left: "50%",
                        marginRight: "-50%",
                        transform: "translate(-50%, 0)",
                    }}
                >
                    <Toast.Header>
                        <strong className="mr-auto">
                            {this.props.mode + " Mapper"}
                        </strong>
                    </Toast.Header>
                    <Toast.Body>{msgData}</Toast.Body>
                </Toast>
                <Split
                    sizes={[75, 25]}
                    minSize={[480, 240]}
                    expandToMin={false}
                    gutterSize={10}
                    gutterAlign="center"
                    direction="horizontal"
                    cursor="col-resize"
                >
                    <div
                        className="split split-left"
                        ref={this.visNetworkRef}
                    ></div>
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
