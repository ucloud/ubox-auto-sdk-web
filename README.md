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
    privateKey: 'xxx', // 在 API 密钥中查看管理自己的密钥： https://console.ucloud.cn/uaccount/api_manage
    projectId: 'xxx' // 在项目管理中查看需要管理的项目 id： https://console.ucloud.cn/uaccount/iam/project_manage
});
```

<i style="color: red;">**请注意管理好自己的公私钥，不要直接暴露在页面中，建议通过 api 从服务端获取公私钥**</i>

debug

可通过传入 debug 参数，开始 debug，会在某些环节打印出一些 log 帮助调试

```js
const client = new UBoxAuto(
    {
        publicKey: 'xxx',
        privateKey: 'xxx',
        projectId: 'xxx'
    },
    { debug: true }
);
```

#### 调用 client 获取数据

Promise 类错误请统一通过 catch 获取，或使用 await 通过 try/catch 获取

```js
client
    .getSdnboxCameraList()
    .then(list => {})
    .catch(console.error);
client
    .startSdnboxCameraPushing()
    .then(() => {
        console.log('start success');
    })
    .catch(console.error);

try {
    const player = client.play(
        document.querySelector('#videoContainer'),
        // 也可自行提供对应地址的流进行播放，url 为 webrtc 地址
        { url: 'webrtc://xxxxxx' }
    );
} catch (e) {
    console.error('play fail', e);
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

-   播放器基本功能

    -   播放器会自动播放流的最新桢，网络差可能会出现跳帧
    -   播放器会在出错时自动重试直到播放成功

-   play 创建播放器实例

```js
// 播放对应盒子对应摄像头的流，需要调用 getSdnboxCameraList 才可采用这种方式，会从返回结果中获取对应的流地址
// video 元素样式自定义，建议背景设计为黑色，否则重试播放时会出现闪烁
const player = client.play(
    // 播放器实例化应用的容器标签元素 <div id="videoContainer"></div>
    document.querySelector('#videoContainer'),
    // 通过传入 sdnboxId 和 cameraId 可快速从之前调用过的 getSdnboxCameraList 缓存数据中获取到对应的流地址
    { cameraId, sdnboxId }
);

const player = client.play(
    document.querySelector('#videoContainer'),
    // 也可自行提供对应地址的流进行播放，url 为 webrtc 地址
    { url: 'webrtc://xxxxxx' }
);
```

播放器大小

-   播放器默认大小为容器的大小
-   可通过传入 width、height 来自定义
-   如果容器宽高和参数都没有则默认使用 `640*480`
-   也可直接使用 fill 参数来让播放器充满容器（自适应，需要注意容器设置宽高，不然视频自适应可能会导致容器抖动）

```js
const player = client.play(
    // 播放器实例化应用的容器标签元素 <div id="videoContainer"></div>
    document.querySelector('#videoContainer'),
    // 通过传入 sdnboxId 和 cameraId 可快速从之前调用过的 getSdnboxCameraList 缓存数据中获取到对应的流地址
    { cameraId, sdnboxId, width: 800, height: 600 }
);
```

fill demo

```js
const player = client.play(
    // 播放器实例化应用的容器标签元素 <div id="videoContainer" style="width: 100%;height: 400px;"></div>
    document.querySelector('#videoContainer'),
    // 通过传入 sdnboxId 和 cameraId 可快速从之前调用过的 getSdnboxCameraList 缓存数据中获取到对应的流地址
    { cameraId, sdnboxId, fill: true }
);
```

options

播放时可传入 options 参数

```js
client.play(document.querySelector('#videoContainer'), info, options);
```

接口定义如下

```ts
{
    // 是否自动播放，为 true 时会在调用 play 后自动开始播放，不需要再调用 start
    autoplay?: boolean;
    // 播放过程中出错时会触发，可监听来做一些错误处理、日志等
    // 错误触发时播放器会自动重试播放
    // 错误类型可通过 error.name 获取
    onError?: (error: Error) => void;
    // 错误后重连成功时触发，触发时机会存在一定延时
    onRestore?: () => void;
}
```

-   开始播放

```js
// 调用 start 开始播放
player.start();
```

-   停止播放

```js
// 终止播放
player.stop();
```

-   销毁播放器 - 卸载播放器时注意销毁，避免内存泄漏

```js
player.destroy();
```

-   获取播放信息

```js
// 获取播放信息，stats 内容参考 https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats#example
player.stats().then(stats => stats.forEach(console.log));
```

#### 错误类型列表

-   ENDED_ERROR

播放器终止了（播放结束，理论不会出现）

-   SEEKING_ERROR

播放器一直在寻找资源而没播放

-   NO_FUTURE_DATA_ERROR

播放器接受不到更多数据，无法继续播放

-   NO_MORE_RECEIVED_DATA

拉流未拉到数据（一般是推流端中断推流，或网络断开）

-   GET_BYTES_RECEIVED_FAIL

无法获取到拉流的信息（一般是连接建立失败触发）
