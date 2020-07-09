import requestData from "../netDataRequest";

function RdpDataRequest(dataReadyHandler, errorHandler) {
    let requests = [];

    requests.push(requestData({name: "PORT", url: "np/dumpNP.cmd?cmd=port"}));
    requests.push(requestData({name: "GEM", url: "np/dumpNP.cmd?cmd=gem"}));
    requests.push(requestData({name: "TCONT", url: "np/dumpNP.cmd?cmd=tcont"}));
    requests.push(requestData({name: "EGRESS_TM", url: "np/dumpNP.cmd?cmd=egress_tm"}));
    requests.push(requestData({name: "INGRESS_CLASS", url: "np/dumpNP.cmd?cmd=ingress_class"}));
    requests.push(requestData({name: "VLAN_ACTION", url: "np/dumpNP.cmd?cmd=vlan_action"}));
    requests.push(requestData({name: "PBIT_TO_QUEUE", url: "np/dumpNP.cmd?cmd=pbit_to_queue"}));
    requests.push(requestData({name: "PBIT_TO_GEM", url: "np/dumpNP.cmd?cmd=pbit_to_gem"}));

    Promise.all(requests).then((responses) => {
        if (responses) {
            let i = 0;
            let jsonData = '{';
            jsonData += '"port":' + responses[i++] + ",";
            jsonData += '"gem":' + responses[i++] + ",";
            jsonData += '"tcont":' + responses[i++] + ",";
            jsonData += '"egress_tm":' + responses[i++] + ",";
            jsonData += '"ingress_class":' + responses[i++] + ",";
            jsonData += '"vlan_action":' + responses[i++] + ",";
            jsonData += '"pbit_to_queue":' + responses[i++] + ",";
            jsonData += '"pbit_to_gem":' + responses[i++] + ",";
            jsonData += '}';

            dataReadyHandler && dataReadyHandler("rdp_data.json", "json", jsonData);
        }
    })
    .catch((errInfo) => {
        errorHandler && errorHandler("RdpDataRequest failed: " + errInfo);
    });
}

export default RdpDataRequest;
