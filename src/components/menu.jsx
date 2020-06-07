import React, { Component } from "react";
import {
    Navbar,
    Nav,
    NavDropdown,
    DropdownButton,
    Dropdown,
} from "react-bootstrap";
import FileLoader from "./fileLoader";
import "./css/menu.css";

class Menu extends Component {
    state = {
        showFileLoader: false,
        fileDomId: "xml-file",
    };

    render_title() {
        if (this.props.title === undefined) return null;
        return <Navbar.Brand>{this.props.title}</Navbar.Brand>;
    }

    render_checkbox(checked) {
        if (checked)
            return (
                <svg
                    className="bi bi-check-square-fill"
                    width="1em"
                    height="1em"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fillRule="evenodd"
                        d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm10.03 4.97a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"
                    />
                </svg>
            );
        else
            return (
                <svg
                    className="bi bi-square"
                    width="1em"
                    height="1em"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fillRule="evenodd"
                        d="M14 1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"
                    />
                </svg>
            );
    }

    onSelectFile() {
        this.setState({showFileLoader: true});
    }

    handleFileLoaderClose = () => {
        this.setState({showFileLoader: false});
    };

    handleFileLoaderSelect = (selectedFile) => {
        this.setState({showFileLoader: false});

        const fileDOM = this.fileLoaderRef.current;
        if (!fileDOM) return;

        let selected = fileDOM.files[0];
        if (!selected) return;

        let reader = new FileReader();
        reader.onprocess = this.props.onLoadedData;
        reader.onload = function(evt) {
            console.log("Loaded data from file " + selected.name);
            this.onprocess(evt.target.result);
        };
        reader.onerror = function(evt) {
            console.error("Failed to load data from file" + selected.name + ":" + evt.target.error.name);
        };
        reader.readAsText(selected);
    };

    componentDidMount() {
        this.fileLoaderRef = React.createRef();
    }

    render() {
        const {
            settings,
            onTogglePhysics,
            onToggleShowAll,
            views,
            selectedView,
            onSelectView,
        } = this.props;

        return (
            <React.Fragment>
                <Navbar expand="lg" className="nav">
                    {this.render_title()}
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="mr-auto">
                            <NavDropdown title="Load" id="basic-nav-dropdown">
                                <NavDropdown.Item>Refresh</NavDropdown.Item>
                                <NavDropdown.Item>View XML</NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item onClick={() => this.onSelectFile()} disabled={this.state.showFileLoader}>
                                    From file...
                                </NavDropdown.Item>
                            </NavDropdown>
                            <NavDropdown
                                title="Display"
                                id="basic-nav-dropdown"
                            >
                                <NavDropdown.Item
                                    id="togglePhysics"
                                    onClick={() => onTogglePhysics()}
                                >
                                    {this.render_checkbox(settings.physics)}
                                    <span>&nbsp; Physics</span>
                                </NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item
                                    id="toggleShowAll"
                                    onClick={() => onToggleShowAll()}
                                >
                                    {this.render_checkbox(settings.show_all)}
                                    <span>&nbsp; Show All</span>
                                </NavDropdown.Item>
                            </NavDropdown>
                        </Nav>
                        <DropdownButton
                            id="dropdown-basic-button"
                            title={
                                settings.show_all
                                    ? "Showing All Objects"
                                    : selectedView === undefined ||
                                      !views.includes(selectedView)
                                    ? "Please Select..."
                                    : selectedView
                            }
                            disabled={settings.show_all || views.length < 1}
                        >
                            {views.map((view) => (
                                <Dropdown.Item
                                    key={view}
                                    id={view}
                                    onSelect={() => onSelectView(view)}
                                >
                                    {view}
                                </Dropdown.Item>
                            ))}
                        </DropdownButton>
                    </Navbar.Collapse>
                </Navbar>
                <FileLoader
                    fileLoaderRef={this.fileLoaderRef}
                    show={this.state.showFileLoader}
                    onClose={this.handleFileLoaderClose}
                    onSelect={this.handleFileLoaderSelect}
                />
            </React.Fragment>
        );
    }
}

export default Menu;