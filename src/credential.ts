const sha1 = require('crypto-js/sha1');
const hex = require('crypto-js/enc-hex');

type argsT = { [index: string]: any };

export type CredentialOptions = {
    publicKey: string;
    privateKey: string;
};

export default class Credential {
    publicKey: string;

    privateKey: string;

    constructor({ publicKey, privateKey }: CredentialOptions) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }

    verifyAc(args: argsT) {
        const obj = { ...args };
        obj['PublicKey'] = this.publicKey;

        // key sorting
        const keys = Object.keys(obj);
        keys.sort();

        // concat string
        let s = '';
        keys.forEach(key => {
            const value = obj[key];
            if (value == null) {
                return;
            }
            s += key;
            s += value.toString();
        });
        s += this.privateKey;

        // hash by sha1
        return hex.stringify(sha1(s));
    }

    sign(args: argsT): argsT {
        const obj = { ...args };
        obj['Signature'] = this.verifyAc(obj);
        obj['PublicKey'] = this.publicKey;
        return obj;
    }
}
