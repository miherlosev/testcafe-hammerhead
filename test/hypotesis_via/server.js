var express  = require('express');
var http     = require('http');
var Path     = require('path');
var process  = require('child_process');
var readSync = require('read-file-relative').readSync;
var Proxy    = require('testcafe-hammerhead').Proxy;
var Session  = require('testcafe-hammerhead').Session;

//Const
var PROXY_PORT_1 = 1401;
var PROXY_PORT_2 = 1402;
var SERVER_PORT  = 1400;

var CONTROL_PANEL_JS_PATH  = '/control-panel.js';
var CONTROL_PANLE_CSS_PATH = '/control-panel.css';

var CONTROL_PANEL_JS_CONTENT  = readSync('./control_panel_assets/control-panel.js');
var CONTROL_PANEL_CSS_CONTENT = readSync('./control_panel_assets/control-panel.css');

function createSession () {
    var session = new Session('uploadRoot');

    session._getIframePayloadScript = function () { return ''; };
    session._getPayloadScript = function () { return ''; };
    session.getAuthCredentials = function () { return {}; };
    session.handleFileDownload = function () { };
    session.handlePageError = function () { };
    session.injectable.scripts.push(CONTROL_PANEL_JS_PATH);
    session.injectable.styles.push(CONTROL_PANLE_CSS_PATH);

    return session;
}

function registerAssets (proxy) {
    proxy.GET(CONTROL_PANLE_CSS_PATH, { content: CONTROL_PANEL_CSS_CONTENT, contentType: 'text/css', isShadowUIStylesheet: true });
    proxy.GET(CONTROL_PANEL_JS_PATH, { content: CONTROL_PANEL_JS_CONTENT, contentType: 'application/x-javascript' });
}

exports.start = function () {
    var app       = express();
    var proxy     = new Proxy('localhost', PROXY_PORT_1, PROXY_PORT_2);
    var appServer = http.createServer(app);

    registerAssets(proxy);

    app
        .use(express.bodyParser())
        .set('view engine', 'ejs')
        .set('view options', { layout: false })
        .set('views', Path.join(__dirname, './views'));

    app.get('*', function (req, res) {
        res.render('index');
    });

    app.post('*', function (req, res) {
        var url = req.param('url');

        if (!url) {
            res.status(403);
            res.render('403');
        }
        else {
            if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0)
                url = 'http://' + url;

            res.statusCode = 301;

            res.setHeader('location', proxy.openSession(url, createSession()));
            res.end();
        }
    });

    appServer.listen(SERVER_PORT);
    console.log('Server listens on port ' + SERVER_PORT);
    process.exec('start http://localhost:' + SERVER_PORT);
};