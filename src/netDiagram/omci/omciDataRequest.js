import requestData from "../netDataRequest";

function OmciDataRequest(dataReadyHandler, errorHandler) {
  requestData({ name: "OMCI dump", url: "/omcidump.cmd" })
    .then((response) => {
      requestData({ name: "OMCI data", url: "/omcimib.xml", delay: 800 });
    })
    .then((response) => {
      dataReadyHandler && dataReadyHandler("omcimib.xml", response);
    })
    .catch((errInfo) => {
      errorHandler && errorHandler("OmciDataRequest failed: " + errInfo);
    });
}

export default OmciDataRequest;
