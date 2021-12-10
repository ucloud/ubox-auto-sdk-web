import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import {
    Loading,
    Collapse,
    Combine,
    Badge,
    Box,
    Switch,
    Message,
    Button,
    Modal,
    Form,
    Input
} from '@ucloud-fe/react-components';

import './App.css';

const BoxContext = React.createContext();
const ClientContext = React.createContext();

const BoxTitle = ({ open, box }) => {
    return (
        <Box container justifyContent="space-between" alignItems="center" className="box-title">
            <Combine>
                {box.ID}
                <Badge dot color={box.SdnboxState === 1 ? 'primary' : 'red'} />
            </Combine>
            <div style={{ float: 'right' }}>{open ? '收起' : '展开'}</div>
        </Box>
    );
};

const Player = ({ camera, sdnboxId }) => {
    const client = useContext(ClientContext);
    const videoContainerRef = useRef(null);
    const [error, setError] = useState(null);
    const [errorCount, setErrorCount] = useState(0);
    const playerRef = useRef(null);
    const [playInfo, setPlayInfo] = useState(() => ({ cameraId: camera.ID, sdnboxId }));
    useEffect(() => {
        if (!videoContainerRef.current) return;
        try {
            playerRef.current = client.play(
                videoContainerRef.current,
                // 目前摄像头流无法正常播放，播放测试地址
                playInfo,
                {
                    onError: e => {
                        setError(e);
                        setErrorCount(count => count + 1);
                    },
                    onRestore: () => {
                        setError(null);
                        setErrorCount(0);
                    }
                }
            );
            playerRef.current.start();
        } catch (e) {
            Message.error(e + '');
            console.error(e);
        }
        return () => {
            playerRef.current?.stop();
            playerRef.current?.destroy();
            playerRef.current = null;
        };
    }, [playInfo]);
    const getStats = useCallback(() => {
        playerRef.current?.stats().then(stats => {
            console.log(stats);
            stats.forEach(console.log);
        });
    }, []);
    const playUrl = () => {
        const url = document.getElementById('urlInput').value;
        setPlayInfo({ url });
        // setPlayInfo({ url: 'webrtc://106.75.8.231/50913519/uaccessbox-0kmdj1yl__dev_video0_stream' });
    };
    return (
        <Box container direction="column" alignItems="center" justifyContent="center" spacing="lg">
            <div
                ref={videoContainerRef}
                style={{
                    width: '600px',
                    height: '400px',
                    boxShadow: error ? 'red 0px 0px 5px 1px' : 'green 0px 0px 5px 1px'
                }}
            />
            <Combine>
                <Button onClick={getStats}>Stats</Button>
                <Input id="urlInput" style={{ width: '200px' }} />
                <Button onClick={playUrl} styleType="primary">
                    Play URL
                </Button>
            </Combine>
            {error && (
                <p>
                    {error + ''}, 重试第 {errorCount} 次
                </p>
            )}
        </Box>
    );
};

const PlayModal = ({ camera, sdnboxId, onClose }) => {
    return (
        <Modal visible={true} onClose={onClose}>
            <Modal.Content>
                <Player camera={camera} sdnboxId={sdnboxId} />
            </Modal.Content>
        </Modal>
    );
};

const Camera = ({ camera, sdnboxId }) => {
    const client = useContext(ClientContext);
    const [loading, setLoading] = useState(false);
    const { onUpdate } = useContext(BoxContext);
    const [modal, setModal] = useState(false);
    const toggleCamera = useCallback(async checked => {
        setLoading(true);
        try {
            if (checked) {
                await client.startSdnboxCameraPushing({ sdnboxId, cameraId: camera.ID });
            } else {
                await client.stopSdnboxCameraPushing({ sdnboxId, cameraId: camera.ID });
            }
            onUpdate();
        } catch (error) {
            Message.error(error + '');
        } finally {
            setLoading(false);
        }
    }, []);
    const handleClose = useCallback(() => {
        setModal(false);
    }, []);
    const play = useCallback(() => {
        setModal(true);
    }, []);
    return (
        <>
            <Loading loading={loading}>
                <Box container justifyContent="space-between" alignItems="center" className="camera">
                    <div>{camera.ID}</div>
                    <Combine>
                        <Button onClick={play}>播放</Button>
                        <Switch checked={camera.Status === 1} onChange={toggleCamera} />
                    </Combine>
                </Box>
            </Loading>
            {modal && <PlayModal onClose={handleClose} camera={camera} sdnboxId={sdnboxId} />}
        </>
    );
};

const Main = () => {
    const client = useContext(ClientContext);
    const [loading, setLoading] = useState(false);
    const [list, setList] = useState([]);
    const updateList = useCallback(async () => {
        setLoading(true);
        try {
            const list = await client.getSdnboxCameraList();
            setList(list);
        } catch (error) {
            Message.error(error + '');
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        updateList();
    }, []);
    const onUpdate = useCallback(() => {
        updateList();
    }, []);

    return (
        <BoxContext.Provider value={{ onUpdate }}>
            <Loading loading={loading} style={{ minHeight: '300px' }}>
                <Collapse multiple={false}>
                    <div className="box-list">
                        {list.map(box => {
                            return (
                                <Collapse.Panel
                                    key={box.ID}
                                    panelKey={box.ID}
                                    className="box-item"
                                    title={props => <BoxTitle {...props} box={box} />}
                                >
                                    <div>
                                        {box.Camera.map(camera => {
                                            return <Camera key={camera.ID} sdnboxId={box.ID} camera={camera} />;
                                        })}
                                    </div>
                                </Collapse.Panel>
                            );
                        })}
                    </div>
                </Collapse>
            </Loading>
        </BoxContext.Provider>
    );
};

const StartForm = ({ onSubmit }) => {
    // load input from local
    useEffect(() => {
        const lastInput = localStorage.getItem('lastInput');
        const setValue = (id, value) => {
            return (document.querySelector(`#${id}`).value = value);
        };
        if (lastInput) {
            const { publicKey, privateKey, projectId } = JSON.parse(lastInput);
            setValue('publicKey', publicKey);
            setValue('privateKey', privateKey);
            setValue('projectId', projectId);
        }
    }, []);
    const handleSubmit = useCallback(e => {
        const getValue = id => {
            return document.querySelector(`#${id}`).value;
        };
        const data = {
            publicKey: getValue('publicKey'),
            privateKey: getValue('privateKey'),
            projectId: getValue('projectId')
        };
        localStorage.setItem('lastInput', JSON.stringify(data));
        onSubmit(data);
    }, []);
    return (
        <Form id="form" onSubmit={handleSubmit}>
            <Form.Item label="publicKey">
                <Input required block id="publicKey" />
            </Form.Item>
            <Form.Item label="privateKey">
                <Input required block id="privateKey" />
            </Form.Item>
            <Form.Item label="projectId">
                <Input required block id="projectId" />
            </Form.Item>
        </Form>
    );
};

const StartModal = ({ onSubmit }) => {
    const handleOK = useCallback(() => {
        document.querySelector('#form').requestSubmit();
    }, []);
    const handleSubmit = useCallback(e => {
        const getValue = id => {
            return document.querySelector(`#${id}`).value;
        };
        const data = {
            publicKey: getValue('publicKey'),
            privateKey: getValue('privateKey'),
            projectId: getValue('projectId')
        };
        localStorage.setItem('lastInput', JSON.stringify(data));
        onSubmit(data);
    }, []);
    return (
        <Modal
            visible
            footer={
                <Button styleType="primary" onClick={handleOK}>
                    确定
                </Button>
            }
            closable={false}
        >
            <Modal.Content>
                <StartForm onSubmit={handleSubmit} />
            </Modal.Content>
        </Modal>
    );
};

function App() {
    const [start, setStart] = useState(true);
    const [client, setClient] = useState(null);
    const handleSubmit = useCallback(data => {
        setClient(UBoxAuto(data, { debug: true }));
        setStart(false);
    }, []);
    return start ? (
        <StartModal onSubmit={handleSubmit} />
    ) : (
        <ClientContext.Provider value={client}>
            <Main />
        </ClientContext.Provider>
    );
}

export default App;
