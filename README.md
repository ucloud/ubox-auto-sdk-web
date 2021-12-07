# ubox-auto-sdk-web

UCloud 智能盒子 web 端 SDK

## How ot use

### 安装

```sh
npm install ubox-auto-sdk-web
```

### 使用

#### 初始化实例

```js
// 引用包
const UBoxAuto = require('ubox-auto-sdk-web');
// 实例化调用端
const client = new UBoxAuto({
    publicKey: 'xxx', // 在 API 密钥中查看管理自己的密钥： https://console.ucloud.cn/uaccount/api_manage
    privateKey: 'xxx',
    projectId: 'xxx' // 在项目管理中查看需要管理的项目 id： https://console.ucloud.cn/uaccount/iam/project_manage
});
```

#### 调用 client 获取数据

错误请统一通过 try/catch 获取

```js
try {
    client.getSdnboxCameraList().then(list => {});
    client.startSdnboxCameraPushing().then(() => {
        console.log('start success');
    });
} catch (e) {
    console.error(e);
}
```

1. 获取盒子和摄像头列表

```js
// 获取盒子，摄像头的列表数据
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
// 开启对应摄像头的推流
client.startSdnboxCameraPushing({ cameraId, sdnboxId }).then(() => {
    console.log('start success');
});
```

```js
// 关闭对应摄像头的推流
client.stopSdnboxCameraPushing({ cameraId, sdnboxId }).then(() => {
    console.log('stop success');
});
```

#### 播放对应摄像头 webrtc 流

```js
// 播放对应盒子对应摄像头的流，需要调用 getSdnboxCameraList 才可采用这种方式，会从返回结果中获取对应的流地址
const player = client.play(document.querySelector('#video'), { cameraId, sdnboxId });
// 或播放对应地址的流，url 为 webrtc 地址
// const player = client.play(document.querySelector('#video'), { url: 'webrtc://xxxxxx' });
// 开始播放
player.start();
// 终止播放
player.stop();
// 获取播放信息
player.stats().then(console.log);
```
