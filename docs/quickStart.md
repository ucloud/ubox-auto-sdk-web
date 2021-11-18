# ubox-auto-sdk-web

Web sdk for ubox auto

## How ot use

### 安装

```sh
npm install ubox-auto-sdk-web
```

### 使用

第一步，初始化实例

```js
const UBoxAuto = require('ubox-auto-sdk-web');
const client = new UBoxAuto({
    publicKey: 'xxx', // 在 API 密钥中查看管理自己的密钥： https://console.ucloud.cn/uaccount/api_manage
    privateKey: 'xxx',
    projectId: 'xxx' // 在项目管理中查看需要管理的项目 id： https://console.ucloud.cn/uaccount/iam/project_manage
});
```

第二步，调用 client 获取数据

错误请统一通过 try/catch 获取

```js
try {
    client.getSdnboxCameraList().then(list => {})
    client.startSdnboxCameraPushing().then(() => {console.log('start success');});
}
```

1. 获取盒子和摄像头列表

```js
client.getSdnboxCameraList().then(list => {
    console.log(list);
});
```

返回数据格式参考

```json
[
    {
        "ID": "uaccessbox-jtjy2rx2",
        "Name": "middle-1",
        "Camera": [
            {
                "ID": "01",
                "Name": "01",
                "Status": 1,
                "VideoParams": "{\"pixel_format\":\"YUYV\",\"resolution\":\"1080*720;640*480\"}",
                "PushRTMPAddress": "rtmp://113.31.163.86:1935/50913519/uaccessbox-jtjy2rx2_01_stream",
                "SmallPullRTMPAddress": null,
                "PullRTMPAddress": {
                    "dash": "http://113.31.163.86:8080/dash/uaccessbox-jtjy2rx2_01_stream/index.mpd",
                    "flv": "http://113.31.163.86:8080/live?app=50913519&stream=uaccessbox-jtjy2rx2_01_stream",
                    "hls": "http://113.31.163.86:8080/hls/uaccessbox-jtjy2rx2_01_stream/index.m3u8",
                    "rtmp": "rtmp://113.31.163.86:1935/50913519/uaccessbox-jtjy2rx2_01_stream"
                }
            },
            {
                "ID": "02",
                "Name": "02",
                "Status": 1,
                "VideoParams": "{\"pixel_format\":\"YUYV\",\"resolution\":\"640*480\"}",
                "PushRTMPAddress": "rtmp://113.31.163.86:1935/50913519/uaccessbox-jtjy2rx2_02_stream",
                "SmallPullRTMPAddress": null,
                "PullRTMPAddress": {
                    "dash": "http://113.31.163.86:8080/dash/uaccessbox-jtjy2rx2_02_stream/index.mpd",
                    "flv": "http://113.31.163.86:8080/live?app=50913519&stream=uaccessbox-jtjy2rx2_02_stream",
                    "hls": "http://113.31.163.86:8080/hls/uaccessbox-jtjy2rx2_02_stream/index.m3u8",
                    "rtmp": "rtmp://113.31.163.86:1935/50913519/uaccessbox-jtjy2rx2_02_stream"
                }
            }
        ]
    }
]
```

2. 开启/关闭摄像头推流

```js
client.startSdnboxCameraPushing().then(() => {
    console.log('start success');
});
```

```js
client.stopSdnboxCameraPushing().then(() => {
    console.log('stop success');
});
```

3. 播放对应摄像头 webrtc 流

```js
const player = client.play(document.querySelector('#video'), { cameraId: cameraId, sdnboxId });
player.start();
player.stop();
player.stats().then(console.log);
```
