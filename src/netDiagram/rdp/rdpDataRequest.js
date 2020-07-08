import requestData from "../netDataRequest";
import djson from "dirty-json";

function RdpDataRequest(dataReadyHandler, errorHandler) {
  requestData({ name: "RDP data", url: "np/dumpNP.cmd?cmd=num_dsl_ports" })
    .then((response) => JSON.parse(response))
    .then((portInfo) => {
        let requests = [];

        console.log(portInfo);
        let portNum = portInfo["V_NUM_DSL_PORTS"];
        requests.push(portNum);

        for (let i = 0; i < portNum; i++) {
            requests.push(requestData({
                name: "Config Port " + i,
                url: "np/dumpNP.cmd?cmd=config_port_" + i
            }));
        }

        requests.push(requestData({name: "GEM", url: "np/dumpNP.cmd?cmd=gem"}));
        requests.push(requestData({name: "TCONT", url: "np/dumpNP.cmd?cmd=tcont"}));
        requests.push(requestData({name: "EGRESS_TM", url: "np/dumpNP.cmd?cmd=egress_tm"}));
        requests.push(requestData({name: "INGRESS_CLASS", url: "np/dumpNP.cmd?cmd=ingress_class"}));

        return Promise.all(requests);
    })
    .then((responses) => {
        console.log(responses);
        console.log(responses[0]);
        if (responses && responses[0]) {
            let jsonData = '{';

            jsonData += '"port":{';
            let i = 1;
            for (; i <= responses[0]; i++) {
                let start = responses[i].indexOf('{');
                let end = responses[i].lastIndexOf('}');

                if (start >= 0 && end >= 0 && start < end)
                    jsonData += responses[i].slice(start + 1, end - start - 1).replace('"lanport"', '"lanport\\/index=lan' + (i-1) + '"') + ',';
            }
            jsonData += "},";

            jsonData += '"gem":' + responses[i++] + ",";
            jsonData += '"tcont":' + responses[i++] + ",";
            jsonData += '"egress_tm":' + responses[i++] + ",";
            jsonData += '"ingress_class":' + responses[i++] + ",";

            jsonData += '}';

            console.log(jsonData);

            dataReadyHandler && dataReadyHandler("rdp_data.json", "json", jsonData);
        }
    })
    .catch((errInfo) => {
        errorHandler && errorHandler("RdpDataRequest failed: " + errInfo);
    });
}

export default RdpDataRequest;
