import Client from './client';
import debugLog from './debugLog';
import jsWebrtc from './jswebrtc.js';

const noop = () => {};

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

const init = (
    {
        publicKey,
        privateKey,
        projectId
    }: {
        publicKey: string;
        privateKey: string;
        projectId: string;
    },
    {
        debug
    }: {
        debug?: boolean;
    } = {}
) => {
    const client = Client(
        {
            publicKey,
            privateKey
        },
        debug
    );
    let cachedList = [];
    const checkData = data => {
        if (data.RetCode !== 0) {
            debugLog(`Wrong RetCode: ${data.RetCode}`, data);
            throw new Error(`RetCode - ${data.RetCode}, Message - ${data.Message}`);
        }
    };

    const getSdnboxCameraList = async () => {
        const data = (await client.request({ ProjectId: projectId, Action: 'GetSdnboxCameraList' })).data;
        checkData(data);
        const list = data.SdnboxCamera;
        return (cachedList = list);
    };

    const startSdnboxCameraPushing = async ({ sdnboxId, cameraId }: { sdnboxId: string; cameraId: string }) => {
        const data = (
            await client.request({
                ProjectId: projectId,
                Action: 'StartSdnboxCameraPushing',
                SdnboxId: sdnboxId,
                CameraId: cameraId
            })
        ).data;
        checkData(data);
        return;
    };

    const stopSdnboxCameraPushing = async ({ sdnboxId, cameraId }: { sdnboxId: string; cameraId: string }) => {
        const data = (
            await client.request({
                ProjectId: projectId,
                Action: 'StopSdnboxCameraPushing',
                SdnboxId: sdnboxId,
                CameraId: cameraId
            })
        ).data;
        checkData(data);
        return;
    };

    const play = (containerElement: HTMLDivElement, playInfo, options) => {
        let { sdnboxId, cameraId, url, width, height } = playInfo || {};
        const { autoplay, onError = noop, onRestore = noop } = options || {};
        if (!containerElement) {
            debugLog('Need container element', containerElement);
            throw new Error('Missing container element');
        }
        if (!url) {
            if (!sdnboxId || !cameraId) {
                debugLog('Invalid sdnboxId or cameraId', playInfo);
                throw new Error('Check your sdnboxId and cameraId');
            }
            const sdnbox = cachedList.find(box => box.ID === sdnboxId);
            const camera = sdnbox.Camera.find(camera => camera.ID === cameraId);
            url = camera.PullRTMPAddress.webrtc;
        }
        if (!url) {
            debugLog('Invalid url', playInfo, cachedList);
            throw new Error("Can't find valid url");
        }
        let player;
        let running = false;
        let timer;
        let latestErrorState = false;
        let latestPoster = null;
        const videoElement = document.createElement('video');
        containerElement.style.position = 'relative';
        const maskElement = document.createElement('div');
        maskElement.hidden = true;
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
            maskElement.hidden = false;
        };
        const hideMaskImage = () => {
            maskElement.hidden = true;
        };
        // 重新播放时会触发此事件，由于此时有播放时间，而导致隐藏 mask 被隐藏，延迟检测
        const onTimeUpdate = () => {
            setTimeout(() => {
                if (videoElement.currentTime > 0) {
                    hideMaskImage();
                }
            }, 100);
        };

        containerElement.appendChild(videoElement);
        containerElement.appendChild(maskElement);

        // 开始播放移除遮挡
        videoElement.addEventListener('timeupdate', onTimeUpdate);

        const start = () => {
            if (running) return console.error('Has been started');
            running = true;
            let latestBytesReceived = 0;
            player = new jsWebrtc.Player(url, {
                video: videoElement,
                autoplay: true,
                onPlay: noop
            });

            timer = setInterval(async () => {
                if (!running) return;
                let errorType: string = null;
                // 可播放时强制播放
                if (videoElement.paused && videoElement.readyState > videoElement.HAVE_CURRENT_DATA) {
                    videoElement.play();
                    return;
                }
                // 定时检测播放状态，如果状态异常则重试播放
                if (
                    videoElement.ended ||
                    videoElement.seeking ||
                    videoElement.readyState < videoElement.HAVE_FUTURE_DATA
                ) {
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
                    const error = new Error(`Video play fail, retrying`);
                    error.name = errorType;
                    debugLog('Play error', error);
                    if (!latestPoster) {
                        const dataUrl = captureScreen(videoElement);
                        latestPoster = videoElement.poster = dataUrl;
                        showMaskImage(latestPoster);
                    }
                    onError(error);
                    latestErrorState = true;
                    stop();
                    start();
                } else {
                    // 变为无异常 调用
                    if (latestErrorState) {
                        debugLog('Play restore');
                        latestPoster = null;
                        onRestore();
                    }
                    latestErrorState = false;
                }
            }, 10000);
        };
        const stop = () => {
            if (!running) return console.error('Has been stopped');
            player.destroy();
            running = false;
            clearInterval(timer);
        };
        const stats = async () => {
            if (!player) return console.error('Player is not playing');
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
        };
        autoplay && start();
        return {
            start,
            stop,
            destroy,
            stats
        };
    };

    return {
        getSdnboxCameraList,
        startSdnboxCameraPushing,
        stopSdnboxCameraPushing,
        play
    };
};

export default init;
