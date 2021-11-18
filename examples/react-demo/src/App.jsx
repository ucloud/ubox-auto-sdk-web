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
    const videoRef = useRef(null);
    useEffect(() => {
        if (!videoRef.current) return;
        const player = client.play(videoRef.current, { cameraId: camera.ID, sdnboxId });
        console.log(player);
        player.start();
        player.stats().then(console.log);
        return () => {
            player.stop();
        };
    }, []);
    return (
        <Box container alignItems="center" justifyContent="center" padding="lg">
            <video ref={videoRef} width="480" height="320" />
        </Box>
    );
};

const PlayModal = ({ camera, sdnboxId, onClose }) => {
    return (
        <Modal visible={true} onClose={onClose}>
            <Player camera={camera} sdnboxId={sdnboxId} />
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
        setClient(UBoxAuto(data));
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
