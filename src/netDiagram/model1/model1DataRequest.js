import requestData from "../netDataRequest";

function Model1DataRequest(dataReadyHandler, errorHandler) {
  requestData({ name: "Model1 data", url: "dumppmadata.cmd" })
    .then((response) => {
      dataReadyHandler && dataReadyHandler("pma_data.xml", response);
    })
    .catch((errInfo) => {
      errorHandler && errorHandler("Model1DataRequest failed: " + errInfo);
    });
}

export default Model1DataRequest;
