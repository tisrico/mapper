import React, { Component } from "react";
import $ from "jquery";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";

import "./css/modalSpinner.css";

class ModalSpinner extends Component {
    componentDidMount() {
        $("#modalSpinner").modal(this.props.show ? "show" : "hide");
    }

    componentDidUpdate() {
        if (!this.props.show)
        {
            $("#modalSpinner").on('shown.bs.modal', function (e) {
              setTimeout(function () {
                    $('#modalSpinner').off('shown.bs.modal');
                    $("#modalSpinner").modal('hide');
              }, 200)
            })
        }
        else
        {
            $('#modalSpinner').off('shown.bs.modal');
            $("#modalSpinner").modal('show');
        }

        $("#modalSpinner").modal(this.props.show ? "show" : "hide");
    }

    render() {
        return (
            <div>
                <div
                    className="modal fade"
                    id="modalSpinner"
                    data-backdrop="static"
                    data-keyboard="false"
                    tabIndex="-1"
                    role="dialog"
                    aria-labelledby="staticBackdropLabel"
                    aria-hidden="true"
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content-spinner">
                            <div className="spinner-border" role="status">
                                <span className="sr-only">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default ModalSpinner;
