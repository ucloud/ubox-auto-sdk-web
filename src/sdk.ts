import Client from './client';
import Player, { Options } from './Player';
import { createDebugLogger } from './debugLog';

const init = (
    { publicKey, privateKey, projectId }: { publicKey: string; privateKey: string; projectId: string },
    { debug }: { debug?: boolean } = {}
) => {
    const debugLog = createDebugLogger(debug);
    const client = Client(
        {
            publicKey,
            privateKey
        },
        debug
    );
    debugLog('Create SDK client');
    let cachedList = [];
    const checkData = data => {
        if (data.RetCode !== 0) {
            throw new Error(`RetCode - ${data.RetCode}, Message - ${data.Message}`);
        }
    };

    const getSdnboxCameraList = async () => {
        const data = (await client.request({ ProjectId: projectId, Action: 'GetSdnboxCameraList' })).data;
        checkData(data);
        const list = data.SdnboxCamera;
        debugLog('Get sdnbox camera list', list);
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
        debugLog(`Start camera pushing of sdnboxId: ${sdnboxId}, cameraId: ${cameraId}`);
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
        debugLog(`Stop camera pushing of sdnboxId: ${sdnboxId}, cameraId: ${cameraId}`);
        return;
    };

    const play = (
        containerElement: HTMLDivElement,
        playInfo: {
            sdnboxId?: string;
            cameraId?: string;
            url: string;
            width?: number;
            height?: number;
            fill?: boolean;
        },
        options?: Options
    ) => {
        let { sdnboxId, cameraId, url, ...rest } = playInfo || {};
        if (!containerElement) {
            throw new Error('Missing container element');
        }
        if (!url) {
            if (!sdnboxId || !cameraId) {
                throw new Error('Check your sdnboxId and cameraId');
            }
            const sdnbox = cachedList.find(box => box.ID === sdnboxId);
            const camera = sdnbox.Camera.find(camera => camera.ID === cameraId);
            url = camera.PullRTMPAddress.Webrtc || camera.PullRTMPAddress.webrtc;
        }
        const player = Player(containerElement, { url, ...rest }, { ...options, debug });
        debugLog('Create player of', url);
        return player;
    };

    return {
        getSdnboxCameraList,
        startSdnboxCameraPushing,
        stopSdnboxCameraPushing,
        play
    };
};

export default init;
