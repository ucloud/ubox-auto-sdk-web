import axios from 'axios';
import { createDebugLogger } from './debugLog';

import { noop } from './utils';

// 取出 query 参数
const fillQuery = (query_string: string, obj) => {
    if (query_string.length == 0) return;
    // split again for angularjs.
    if (query_string.indexOf('?') >= 0) query_string = query_string.split('?')[1];

    const queries = query_string.split('&');
    for (let i = 0; i < queries.length; i++) {
        const query = queries[i].split('=');
        obj[query[0]] = query[1];
        obj.user_query[query[0]] = query[1];
    }
    // alias domain for vhost.
    if (obj.domain) obj.vhost = obj.domain;
};

// 取出 url 信息
const parseUrl = function (rtmp_url: string) {
    // @see: http://stackoverflow.com/questions/10469575/how-to-use-location-object-to-parse-url-without-redirecting-the-page-in-javascri
    const a = document.createElement('a');
    a.href = rtmp_url.replace('rtmp://', 'http://').replace('webrtc://', 'http://').replace('rtc://', 'http://');

    let vhost = a.hostname;
    let app = a.pathname.substring(1, a.pathname.lastIndexOf('/') - 1);
    const stream = a.pathname.substring(a.pathname.lastIndexOf('/') + 1);

    // parse the vhost in the params of app, that srs supports.
    app = app.replace('...vhost...', '?vhost=');
    if (app.indexOf('?') >= 0) {
        const params = app.substring(app.indexOf('?'));
        app = app.substring(0, app.indexOf('?'));

        if (params.indexOf('vhost=') > 0) {
            vhost = params.substring(params.indexOf('vhost=') + 'vhost='.length);
            if (vhost.indexOf('&') > 0) {
                vhost = vhost.substring(0, vhost.indexOf('&'));
            }
        }
    }

    // when vhost equals to server, and server is ip,
    // the vhost is __defaultVhost__
    if (a.hostname == vhost) {
        const re = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
        if (re.test(a.hostname)) vhost = '__defaultVhost__';
    }

    // parse the schema
    let schema = 'rtmp';
    if (rtmp_url.indexOf('://') > 0) schema = rtmp_url.substring(0, rtmp_url.indexOf('://'));

    let port: number | string = a.port;
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

    const ret = {
        url: rtmp_url,
        schema: schema,
        server: a.hostname,
        port: port,
        vhost: vhost,
        app: app,
        stream: stream,
        user_query: {} as Record<string, string>
    };

    fillQuery(a.search, ret);
    return ret;
};

interface Options {
    /** 自动播放 */
    autoplay?: boolean;
    /** pause 调用回调 */
    onPause?: () => void;
    /** play 调用回调 */
    onPlay?: () => void;
    /** 错误回调 */
    onError?: (e: Error) => void;
    /** 是否打印日志 */
    debug?: boolean;
}

/**
 * 创建播放器实例
 * @param url webrtc 拉流地址
 * @param video video 标签
 * @param options options 参数
 * @returns 播放器实例
 */
const WebRTCPlayer = (url: string, video: HTMLVideoElement, options?: Options) => {
    if (!url.match(/^webrtc?:\/\//)) throw new Error('Just work with webrtc');
    if (!video) throw new Error('VideoElement is required');

    const { onPause = noop, onPlay = noop, onError = noop, autoplay, debug } = options || {};
    const debugLog = createDebugLogger(debug);
    const urlParams = parseUrl(url);

    let pc: RTCPeerConnection;
    let audioTransceiver: RTCRtpTransceiver;
    let videoTransceiver: RTCRtpTransceiver;
    let paused = true;
    let animationId: number;
    let isPlaying: boolean;

    // set muted for autoplay
    if (autoplay) video.muted = true;

    // 清理连接
    const cleanPC = () => {
        audioTransceiver?.stop();
        videoTransceiver?.stop();
        pc?.close();
        pc && debugLog('clean the pc');
    };

    const startLoading = function () {
        cleanPC();

        pc = new RTCPeerConnection(null);
        pc.ontrack = function (event) {
            video['srcObject'] = event.streams[0];
            debugLog('add streams to the video');
        };
        audioTransceiver = pc.addTransceiver('audio', { direction: 'recvonly' });
        videoTransceiver = pc.addTransceiver('video', { direction: 'recvonly' });

        pc.createOffer()
            .then(offer => {
                debugLog('offer created');
                return pc.setLocalDescription(offer).then(() => {
                    debugLog('local description set');
                    const port = urlParams.port || 1985;
                    // @see https://github.com/rtcdn/rtcdn-draft
                    let api = urlParams.user_query.play || '/rtc/v1/play/';
                    if (api.lastIndexOf('/') != api.length - 1) api += '/';

                    let url = 'http://' + urlParams.server + ':' + port + api;
                    for (const key in urlParams.user_query) {
                        if (key != 'api' && key != 'play') {
                            url += '&' + key + '=' + urlParams.user_query[key];
                        }
                    }

                    // @see https://github.com/rtcdn/rtcdn-draft
                    const data = {
                        api: url,
                        streamurl: urlParams.url,
                        clientip: null,
                        sdp: offer.sdp
                    };

                    return axios.post<{ sdp: string }>(url, data).then(function (res) {
                        debugLog(`get the sdp from ${url}`, res.data.sdp);
                        return res.data.sdp;
                    });
                });
            })
            .then(function (answer) {
                if (pc.signalingState !== 'closed') {
                    return pc
                        .setRemoteDescription({ type: 'answer', sdp: answer })
                        .then(() => debugLog('remote description set'));
                } else {
                    // 流关闭抛出错误
                    throw new Error('Remote RTCPeerConnection has been closed');
                }
            })
            .catch(e => {
                onError(e);
                debugLog('WEBRTC_PLAYER_ERROR', e);
            });

        if (autoplay) play();
    };
    /** 开始播放 */
    const play = function () {
        if (animationId) return;
        animationId = requestAnimationFrame(update);
        paused = false;
    };
    /** 暂停播放 */
    const stop = function () {
        if (paused) return;

        cancelAnimationFrame(animationId);
        animationId = null;
        isPlaying = false;
        paused = true;
        video.pause();

        if (onPause) onPause();
    };
    /** 销毁实例 */
    const destroy = function () {
        stop();
        cleanPC();
    };
    const getStats = function (selector?: MediaStreamTrack) {
        return new Promise((resolve, reject) => {
            pc.getStats(
                selector,
                // 为了兼容老浏览器的 API https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats#browser_compatibility
                // @ts-expect-error
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
    const update = function () {
        animationId = requestAnimationFrame(update);
        if (video.readyState < 4) return;
        if (!isPlaying) {
            isPlaying = true;
            video.play();
            if (onPlay) onPlay();
        }
    };
    startLoading();
    return {
        pause: stop,
        play,
        stop,
        destroy,
        getStats
    };
};

export default WebRTCPlayer;
