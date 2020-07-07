var requestData = (obj) => {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open(obj.method || "GET", obj.url);
        if (obj.headers) {
            Object.keys(obj.headers).forEach((key) => {
                xhr.setRequestHeader(key, obj.headers[key]);
            });
        }
        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(xhr.response);
            } else {
                reject(xhr.statusText);
            }
        };
        xhr.onerror = () =>
            reject(
                (obj.method || "GET") + " " + (obj.name || obj.url) + " failed"
            );
        xhr.ontimeout = () =>
            reject(
                (obj.method || "GET") + " " + (obj.name || obj.url) + " timeout"
            );

        if (obj.delay)
            setTimeout(() => {
                xhr.send(obj.body);
            }, obj.delay);
        else
            xhr.send(obj.body);
    });
};

export default requestData;
