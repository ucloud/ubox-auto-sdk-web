import Client from './client';

import jsWebrtc from './jswebrtc.js';

const init = ({ publicKey, privateKey, projectId }: { publicKey: string; privateKey: string; projectId }) => {
    const client = Client({
        publicKey,
        privateKey
    });
    let cachedList = [];

    const getSdnboxCameraList = async () => {
        const list = (await client.request({ ProjectId: projectId, Action: 'GetSdnboxCameraList' })).data.SdnboxCamera;
        return (cachedList = list);
    };

    const startSdnboxCameraPushing = async ({ sdnboxId, cameraId }: { sdnboxId: string; cameraId: string }) => {
        return (
            (
                await client.request({
                    ProjectId: projectId,
                    Action: 'StartSdnboxCameraPushing',
                    SdnboxId: sdnboxId,
                    CameraId: cameraId
                })
            ).data.RetCode === 0
        );
    };

    const stopSdnboxCameraPushing = async ({ sdnboxId, cameraId }: { sdnboxId: string; cameraId: string }) => {
        return (
            (
                await client.request({
                    ProjectId: projectId,
                    Action: 'StopSdnboxCameraPushing',
                    SdnboxId: sdnboxId,
                    CameraId: cameraId
                })
            ).data.RetCode === 0
        );
    };

    const play = (videoElement, { sdnboxId, cameraId, url }, options) => {
        const { autoplay } = options || {};
        if (!videoElement) {
            throw new Error('Missing video element');
        }
        if (!url) {
            if (!sdnboxId || !cameraId) {
                throw new Error('Check your sdnboxId and cameraId');
            }
            const sdnbox = cachedList.find(box => box.ID === sdnboxId);
            const camera = sdnbox.Camera.find(camera => camera.ID === cameraId);
            url = camera.PullRTMPAddress.webrtc;
        }
        if (!url) {
            throw new Error("Can't find valid url");
        }
        let player;
        let running = false;
        let timer;
        const start = () => {
            if (running) return console.error('Has been started');
            running = true;
            let num = 0;
            let bytesReceived = Number.MAX_SAFE_INTEGER;
            player = new jsWebrtc.Player(url, {
                video: videoElement,
                autoplay: true,
                onPlay: () => {
                    console.log('play');
                }
            });
            timer = setInterval(async () => {
                if (
                    videoElement.paused ||
                    videoElement.ended ||
                    videoElement.seeking ||
                    videoElement.readyState < videoElement.HAVE_FUTURE_DATA
                ) {
                    stop();
                    start();
                    return;
                }

                const _info = await stats();

                if (_info.bytesReceived === bytesReceived && running && url) {
                    num++;
                    if (num > 3) {
                        num = 0;
                        stop();
                        start();
                    }
                } else {
                    num = 0;
                    bytesReceived = _info?.bytesReceived || Number.MAX_SAFE_INTEGER;
                }
            }, 3000);
        };
        const stop = () => {
            if (!running) return console.error('Has been stoped');
            player.destroy();
            running = false;
            clearInterval(timer);
        };
        const stats = async () => {
            if (!player) return console.error('Player is not playing');
            const stats = await player.getStats();
            console.log(stats);
            return stats;
        };
        autoplay && start();
        return {
            start,
            stop,
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
