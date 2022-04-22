import Credential from './credential';
import Request from './request';

const Client = ({ publicKey, privateKey }: { publicKey; privateKey }, debug?: boolean) => {
    const credential = new Credential({ publicKey, privateKey });
    const request = new Request(credential, debug);
    return {
        request: request.request
    };
};

export default Client;
