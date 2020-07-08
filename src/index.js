import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

var path = require('path');
var basename = path.basename(window.location.pathname);

/* Use OMCI by default */
var app_mode = "OMCI";

if (basename.includes("omci"))
    app_mode = "OMCI";
else if (basename.includes("model1"))
    app_mode = "Model1";
else if (basename.includes("rdp"))
    app_mode = "RDP";

ReactDOM.render(
  <React.StrictMode>
    <App mode={app_mode}/>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
