"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kv = void 0;
const kv_1 = require("@vercel/kv");
class VercelKVAdapter {
    async get(key) {
        return kv_1.kv.get(key);
    }
    async set(key, value, expiresIn) {
        if (expiresIn) {
            await kv_1.kv.set(key, value, { ex: expiresIn });
        }
        else {
            await kv_1.kv.set(key, value);
        }
    }
    async delete(key) {
        await kv_1.kv.del(key);
    }
    async keys(pattern) {
        return kv_1.kv.keys(pattern);
    }
    async exists(key) {
        const result = await kv_1.kv.exists(key);
        return result === 1;
    }
}
exports.kv = new VercelKVAdapter();
exports.default = exports.kv;
