function Model1DataRequest(dataReadyHandler, errorHandler) {
  let request = new XMLHttpRequest();
  request.open('GET', 'dumppmadata.cmd', true);
  request.send(null);
  request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status === 200) {
        if (dataReadyHandler)
          dataReadyHandler("model1.xml", request.responseText);
    } else if (request.readyState === 4) {
        if (errorHandler)
          errorHandler("Model1 nodes failed to load.");
    }
  }
}
export default Model1DataRequest;