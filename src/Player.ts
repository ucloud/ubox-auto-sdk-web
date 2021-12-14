import WebRTCPlayer from './WebRTCPlayer';
import { createDebugLogger } from './debugLog';
import { noop } from './utils';

export interface Options {
    /** 自动播放 */
    autoplay?: boolean;
    /** 错误回调 */
    onError?: (e: Error) => void;
    /** 恢复回调 */
    onRestore?: () => void;
    /** 打印 log 信息 */
    debug?: boolean;
}

export interface PlayInfo {
    url: string;
    width?: number;
    height?: number;
}
const PlayerError = (message: string | Error, type = 'PLAYER_ERROR') => {
    let error: Error;
    if (typeof message === 'string') {
        error = new Error(message);
    } else {
        error = message;
    }
    error.name = type;
    return error;
};

const captureScreen = (video: HTMLVideoElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL();
};

const getVideoInbound = stats => {
    let result = null;
    stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
            result = report;
        }
    });
    return result;
};

/**
 * 封装断流重连、截屏遮挡黑屏等
 * @param containerElement 播放器容器
 * @param playInfo 播放流信息、宽高
 * @param options 自定义选项
 * @returns 播放器实例
 */
const Player = (containerElement: HTMLDivElement, playInfo: PlayInfo, options: Options) => {
    let { url, width, height } = playInfo || {};
    const { autoplay, onError = noop, onRestore = noop, debug } = options || {};
    const debugLog = createDebugLogger(debug);
    if (!containerElement) {
        throw PlayerError('Missing container element');
    }
    if (!url) {
        throw PlayerError("Can't find valid url");
    }
    let player: ReturnType<typeof WebRTCPlayer>;
    let running = false;
    let timer;
    let latestErrorState = false;
    let latestPoster = null;

    // video 标签
    const videoElement = document.createElement('video');
    containerElement.style.position = 'relative';
    // 黑屏遮挡用
    const maskElement = document.createElement('div');
    // 减少 dom 引用
    let maskHidden = maskElement.hidden = true;
    const maskStyle = maskElement.style;
    videoElement.width = width || containerElement.clientWidth || 640;
    videoElement.height = height || containerElement.clientHeight || 480;
    videoElement.style.backgroundColor = maskStyle.backgroundColor = 'black';
    maskStyle.width = videoElement.width + 'px';
    maskStyle.height = videoElement.height + 'px';
    maskStyle.backgroundSize = 'contain';
    maskStyle.backgroundPosition = 'center';
    maskStyle.backgroundRepeat = 'no-repeat';
    maskStyle.position = 'absolute';
    maskStyle.zIndex = '10';
    maskStyle.top = '0';
    maskStyle.left = '0';

    const showMaskImage = (url: string) => {
        maskStyle.backgroundImage = `url(${url})`;
        maskHidden = maskElement.hidden = false;
        debugLog('Show the video mask');
    };
    const hideMaskImage = () => {
        maskHidden = maskElement.hidden = true;
        debugLog('Hide the video mask');
    };
    // 重新播放时会触发此事件，由于此时有播放时间，而导致隐藏 mask 被隐藏，延迟检测
    const onTimeUpdate = () => {
        if (!maskHidden) {
            setTimeout(() => {
                if (videoElement.currentTime > 0) {
                    hideMaskImage();
                }
            }, 100);
        }
    };

    containerElement.appendChild(videoElement);
    containerElement.appendChild(maskElement);

    // 开始播放移除遮挡
    videoElement.addEventListener('timeupdate', onTimeUpdate);

    const play = () => {
        if (running) return console.error('Is playing');
        running = true;
        let latestBytesReceived = 0;
        player = WebRTCPlayer(url, videoElement, {
            autoplay: true,
            onError: (e: Error) => {
                console.error(PlayerError(e, 'WEBRTC_PLAYER_ERROR'));
            },
            debug
        });
        debugLog('Create the webRTC player');

        timer = setInterval(async () => {
            if (!running) return;
            let errorType: string = null;
            // 可播放时强制播放
            if (videoElement.paused && videoElement.readyState > videoElement.HAVE_CURRENT_DATA) {
                videoElement.play();
                debugLog('Force play the video');
                return;
            }
            // 定时检测播放状态，如果状态异常则重试播放
            if (videoElement.ended || videoElement.seeking || videoElement.readyState < videoElement.HAVE_FUTURE_DATA) {
                errorType = videoElement.ended
                    ? 'ENDED_ERROR'
                    : videoElement.seeking
                    ? 'SEEKING_ERROR'
                    : videoElement.readyState < videoElement.HAVE_FUTURE_DATA
                    ? 'NO_FUTURE_DATA_ERROR'
                    : 'UNKNOWN_ERROR';
            } else {
                // 检测流状态，流数据不变则认定为拉取不到数据进行重新播放
                const currentBytesReceived = await getBytesReceived();
                if (currentBytesReceived === latestBytesReceived) {
                    errorType = 'NO_MORE_RECEIVED_DATA';
                } else {
                    latestBytesReceived = currentBytesReceived;
                }
            }
            if (errorType) {
                const error = PlayerError(`Video play fail, retrying`, errorType);
                if (!latestPoster) {
                    const dataUrl = captureScreen(videoElement);
                    latestPoster = videoElement.poster = dataUrl;
                    showMaskImage(latestPoster);
                }
                onError(error);
                latestErrorState = true;
                stop();
                play();
                debugLog('onError triggered', error);
            } else {
                // 变为无异常 调用
                if (latestErrorState) {
                    latestPoster = null;
                    onRestore();
                    debugLog('onRestore triggered');
                }
                latestErrorState = false;
            }
        }, 10000);
    };
    const stop = () => {
        if (!running) return console.error('Player is not running');
        player.destroy();
        running = false;
        clearInterval(timer);
        debugLog('player stopped');
    };
    const stats = async () => {
        if (!player) throw PlayerError('Player is not playing');
        const stats = await player.getStats();
        return stats;
    };
    const getBytesReceived = async () => {
        const statsInfo = await stats();
        const videoInBound = getVideoInbound(statsInfo);
        return videoInBound.bytesReceived;
    };
    const destroy = () => {
        videoElement?.removeEventListener('timeupdate', onTimeUpdate);
        containerElement?.removeChild(videoElement);
        containerElement?.removeChild(maskElement);
        debugLog('player destroyed');
    };
    autoplay && play();
    return {
        play,
        start: play,
        stop,
        destroy,
        stats
    };
};

export default Player;
