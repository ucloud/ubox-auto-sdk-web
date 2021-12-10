// 修改 jswebrtc 一些逻辑

/*! jswebrtc v1.0 | (c) Derek Chan | MIT license */

// This sets up the JSWebrtc "Namespace". The object is empty apart from the Now()
// utility function and the automatic CreateVideoElements() after DOMReady.
var JSWebrtc = {
    // The Player sets up the connections between source, demuxer, decoders,
    // renderer and audio output. It ties everything together, is responsible
    // of scheduling decoding and provides some convenience methods for
    // external users.
    Player: null,

    FillQuery: function (query_string, obj) {
        // pure user query object.
        obj.user_query = {};

        if (query_string.length == 0) return;

        // split again for angularjs.
        if (query_string.indexOf('?') >= 0) query_string = query_string.split('?')[1];

        var queries = query_string.split('&');
        for (var i = 0; i < queries.length; i++) {
            var query = queries[i].split('=');
            obj[query[0]] = query[1];
            obj.user_query[query[0]] = query[1];
        }

        // alias domain for vhost.
        if (obj.domain) obj.vhost = obj.domain;
    },

    ParseUrl: function (rtmp_url) {
        // @see: http://stackoverflow.com/questions/10469575/how-to-use-location-object-to-parse-url-without-redirecting-the-page-in-javascri
        var a = document.createElement('a');
        a.href = rtmp_url.replace('rtmp://', 'http://').replace('webrtc://', 'http://').replace('rtc://', 'http://');

        var vhost = a.hostname;
        var app = a.pathname.substr(1, a.pathname.lastIndexOf('/') - 1);
        var stream = a.pathname.substr(a.pathname.lastIndexOf('/') + 1);

        // parse the vhost in the params of app, that srs supports.
        app = app.replace('...vhost...', '?vhost=');
        if (app.indexOf('?') >= 0) {
            var params = app.substr(app.indexOf('?'));
            app = app.substr(0, app.indexOf('?'));

            if (params.indexOf('vhost=') > 0) {
                vhost = params.substr(params.indexOf('vhost=') + 'vhost='.length);
                if (vhost.indexOf('&') > 0) {
                    vhost = vhost.substr(0, vhost.indexOf('&'));
                }
            }
        }

        // when vhost equals to server, and server is ip,
        // the vhost is __defaultVhost__
        if (a.hostname == vhost) {
            var re = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
            if (re.test(a.hostname)) vhost = '__defaultVhost__';
        }

        // parse the schema
        var schema = 'rtmp';
        if (rtmp_url.indexOf('://') > 0) schema = rtmp_url.substr(0, rtmp_url.indexOf('://'));

        var port = a.port;
        if (!port) {
            if (schema === 'http') {
                port = 80;
            } else if (schema === 'https') {
                port = 443;
            } else if (schema === 'rtmp') {
                port = 1935;
            } else if (schema === 'webrtc' || schema === 'rtc') {
                port = 1985;
            }
        }

        var ret = {
            url: rtmp_url,
            schema: schema,
            server: a.hostname,
            port: port,
            vhost: vhost,
            app: app,
            stream: stream
        };

        JSWebrtc.FillQuery(a.search, ret);

        return ret;
    },

    HttpPost: function (url, data) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
                    var respone = JSON.parse(xhr.responseText);
                    xhr.onreadystatechange = new Function();
                    xhr = null;
                    resolve(respone);
                }
            };

            xhr.open('POST', url, true);

            // note: In Internet Explorer, the timeout property may be set only after calling the open()
            // method and before calling the send() method.
            xhr.timeout = 5000; // 5 seconds for timeout
            xhr.responseType = 'text';
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(data);
        });
    }
};

JSWebrtc.Player = (function () {
    var Player = function (url, options) {
        this.options = options || {};

        if (!url.match(/^webrtc?:\/\//)) {
            throw 'JSWebrtc just work with webrtc';
        }

        if (!this.options.video) {
            throw 'VideoElement is null';
        }

        this.urlParams = JSWebrtc.ParseUrl(url);

        this.pc = null;
        this.autoplay = !!options.autoplay || false;
        this.paused = true;

        // set muted for autoplay
        if (this.autoplay) this.options.video.muted = true;

        this.startLoading();
    };

    Player.prototype.startLoading = function () {
        var _self = this;
        if (_self.pc) {
            _self.pc.close();
        }

        _self.pc = new RTCPeerConnection(null);
        _self.pc.ontrack = function (event) {
            _self.options.video['srcObject'] = event.streams[0];
        };

        _self.pc.addTransceiver('audio', { direction: 'recvonly' });
        _self.pc.addTransceiver('video', { direction: 'recvonly' });

        _self.pc
            .createOffer({ iceRestart: true })
            .then(function (offer) {
                return _self.pc.setLocalDescription(offer).then(function () {
                    return offer;
                });
            })
            .then(function (offer) {
                return new Promise(function (resolve, reject) {
                    var port = _self.urlParams.port || 1985;

                    // @see https://github.com/rtcdn/rtcdn-draft
                    var api = _self.urlParams.user_query.play || '/rtc/v1/play/';
                    if (api.lastIndexOf('/') != api.length - 1) {
                        api += '/';
                    }

                    var url = 'http://' + _self.urlParams.server + ':' + port + api;
                    for (var key in _self.urlParams.user_query) {
                        if (key != 'api' && key != 'play') {
                            url += '&' + key + '=' + _self.urlParams.user_query[key];
                        }
                    }

                    // @see https://github.com/rtcdn/rtcdn-draft
                    var data = {
                        api: url,
                        streamurl: _self.urlParams.url,
                        clientip: null,
                        sdp: offer.sdp
                    };

                    JSWebrtc.HttpPost(url, JSON.stringify(data)).then(
                        function (res) {
                            resolve(res.sdp);
                        },
                        function (rej) {
                            reject(rej);
                        }
                    );
                });
            })
            .then(function (answer) {
                if (_self.pc.signalingState !== 'closed') {
                    return _self.pc?.setRemoteDescription({ type: 'answer', sdp: answer });
                } else {
                    // 流关闭抛出错误
                    throw new Error('Remote RTCPeerConnection has been closed');
                }
            })
            .catch(function (reason) {
                throw reason;
            });

        if (this.autoplay) {
            this.play();
        }
    };

    Player.prototype.play = function (ev) {
        if (this.animationId) {
            return;
        }
        this.animationId = requestAnimationFrame(this.update.bind(this));
        this.paused = false;
    };

    Player.prototype.pause = function (ev) {
        if (this.paused) {
            return;
        }

        cancelAnimationFrame(this.animationId);
        this.animationId = null;
        this.isPlaying = false;
        this.paused = true;

        this.options.video.pause();

        if (this.options.onPause) {
            this.options.onPause(this);
        }
    };

    Player.prototype.stop = function (ev) {
        this.pause();
    };

    Player.prototype.destroy = function () {
        this.pause();
        this.pc && this.pc.close() && this.pc.destroy();
        this.audioOut && this.audioOut.destroy();
    };

    Player.prototype.getStats = function (selector) {
        return new Promise((resolve, reject) => {
            this.pc
                .getStats(
                    selector,
                    stats => {
                        resolve(stats);
                    },
                    e => {
                        reject(e);
                    }
                )
                .then(stats => resolve(stats))
                .catch(reject);
        });
    };

    Player.prototype.update = function () {
        this.animationId = requestAnimationFrame(this.update.bind(this));

        if (this.options.video.readyState < 4) {
            return;
        }

        if (!this.isPlaying) {
            this.isPlaying = true;

            this.options.video.play();
            if (this.options.onPlay) {
                this.options.onPlay(this);
            }
        }
    };

    return Player;
})();

export default JSWebrtc;
