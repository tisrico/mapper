import requestData from "../netDataRequest";

function Model1DataRequest(dataReadyHandler, errorHandler) {
  requestData({"url": "dumppmadata.cmd"})
  .then(response => {
      if (dataReadyHandler)
        dataReadyHandler("omcimib.xml", response);
    }, errInfo => {
      if (errorHandler)
        errorHandler("Failed to dump Model1 data: " + errInfo);
    });
}

export default Model1DataRequest;