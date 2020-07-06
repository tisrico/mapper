import requestData from "../netDataRequest";

function OmciDataRequest(dataReadyHandler, errorHandler) {
  requestData({"url": "/omcidump.cmd"})
  .then(response => {
    setTimeout(() => {
      requestData({"url": "/omcimib.xml"})
      .then(response => {
        if (dataReadyHandler)
          dataReadyHandler("omcimib.xml", response);
      }, errInfo => {
        if (errorHandler)
          errorHandler("Failed to retrieve OMCI MIB data: " + errInfo);
      });
    }, 800);
  }, errInfo => {
    if (errorHandler)
      errorHandler("Failed to dump OMCI MIB: " + errInfo);
  });
}

export default OmciDataRequest;