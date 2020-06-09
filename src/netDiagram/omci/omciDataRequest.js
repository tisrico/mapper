function OmciDataRequest(dataReadyHandler, errorHandler) {
  // request DPU to dump XML
  let request = new XMLHttpRequest();
  request.open('GET', '/omcidump.cmd', true);

  request.onreadystatechange = async function () {
    if (request.readyState == 4 && request.status == 200) {
      if (request.responseText == "OK") {
        await new Promise(resolve => setTimeout(resolve, 800));

        // read xml from DPU
        let request1 = new XMLHttpRequest();
        request1.open('GET', '/omcimib.xml', true);
        request1.send(null);

        request1.onreadystatechange = function () {
          if (request1.readyState === 4 && request1.status === 200) {
            if (dataReadyHandler)
                dataReadyHandler("omcimib.xml", request1.responseText);
          } else if (request1.readyState === 4) {
            if (errorHandler)
                errorHandler("Failed to retrieve omcimib.xml")
          }
        }
      } else {
        if (errorHandler)
            errorHandler("OMCI mibs dump request failed!");
      }
    } else if (request.readyState == 4) {
        if (errorHandler)
            errorHandler("OMCI mibs dump request failed...");
    }
  }
  request.ontimeout = async function () {
    if (errorHandler)
        errorHandler("OMCI mibs dump request timeout...");
  }

  request.send(null);
}
export default OmciDataRequest;