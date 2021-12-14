import axios from 'axios';

import Credential from './credential';
import { createDebugLogger } from './debugLog';

type argsT = { [index: string]: any };

const encode = (args: argsT) => {
    const result: argsT = {};
    for (const k in args) {
        if (args.hasOwnProperty(k)) {
            const v: any = args[k];
            if (v == null) {
                continue;
            }

            if (Object.prototype.toString.call(v) === '[object Array]') {
                v.forEach((value: any, index: number) => {
                    if (value instanceof Object) {
                        Object.entries(encode(value)).forEach(([key, value]) => {
                            result[`${k}.${index}.${key}`] = value;
                        });
                    } else {
                        result[`${k}.${index}`] = value;
                    }
                });
            } else if (Object.prototype.toString.call(v) === '[object Object]') {
                Object.entries(encode(v)).forEach(([key, value]) => {
                    result[`${k}.${key}`] = value;
                });
            } else {
                result[k] = v;
            }
        }
    }
    return result;
};

export default class Request {
    credential: Credential;
    log: ReturnType<typeof createDebugLogger>;
    constructor(credential: Credential, debug?: boolean) {
        this.credential = credential;
        this.log = createDebugLogger(debug);
    }
    request = async data => {
        this.log('API request', data);
        const res = await axios({
            method: 'post',
            baseURL: 'https://ubox-api.ucloud.cn',
            // baseURL: 'https://api.ucloud.cn',
            // baseURL: 'http://ubox-api.ucloud.cn',
            // baseURL: 'http://117.50.0.138',
            headers: {
                'Content-Type': 'application/json'
            },
            data: this.credential.sign(encode(data))
        });
        this.log('API response', res);
        return res;
    };
}
