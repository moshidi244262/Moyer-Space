import { createClient } from '@vercel/kv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ==========================================
// 安全配置：CORS 来源锁定
// ==========================================
const ALLOWED_ORIGIN = 'https://moyer-space.vercel.app';

// ==========================================
// 核心环境配置 (读取所有层级的 Hash)
// ==========================================
const ENV = {
    SALT: (process.env.APP_SALT || '').trim(), 
    PEPPER: (process.env.APP_PEPPER || '').trim(),
    JWT_SECRET: (process.env.JWT_SECRET || 'default-secret').trim(),
    
    // 各层级校验 Hash
    HASH_MAP: {
        'login': (process.env.APP_VERIFY_HASH || '').trim(),
        'vault': (process.env.VAULT_VERIFY_HASH || '').trim(),
        'abyss': (process.env.ABYSS_VERIFY_HASH || '').trim(),
        'export': (process.env.EXPORT_VERIFY_HASH || '').trim(),
    }
};

const kv = createClient({
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const RATE_LIMIT = {
    MAX_ATTEMPTS: 5,
    WINDOW_SECONDS: 300, 
    BLOCK_SECONDS: 600 // 10分钟
};

// ==========================================
// 辅助函数
// ==========================================

function serverVerifyPassword(transmissionPassword, saltHex, targetHash) {
    if (!saltHex || !ENV.PEPPER || !targetHash) {
        throw new Error("Server Configuration Error: Missing Salt/Pepper/Hash");
    }
    
    // 1. 混合 Pepper 
    const saltedPassword = transmissionPassword + ENV.PEPPER;
    
    // 2. PBKDF2
    const derivedKey = crypto.pbkdf2Sync(
        saltedPassword, 
        Buffer.from(saltHex, 'hex'), 
        200000, 
        32, 
        'sha256'
    );

    // 3. SHA256
    const computedHash = crypto.createHash('sha256').update(derivedKey).digest('hex');
    
    return computedHash === targetHash;
}

function generateToken(payload) {
    return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '1h' });
}

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.socket?.remoteAddress || 'unknown_ip';
}

// ==========================================
// 主 Handler
// ==========================================
export default async function handler(request, response) {
    const origin = request.headers.origin;
    if (origin && origin !== ALLOWED_ORIGIN) {
        return response.status(403).json({ error: "Forbidden Origin" });
    }

    response.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (request.method === 'OPTIONS') return response.status(200).end();

    const clientIp = getClientIp(request);
    const rateKey = `rate:${clientIp}`; // 所有密码验证共用这一个 Key

    try {
        // --- 1. 全局限流检查 ---
        let attempts = 0;
        let isKvConnected = true;

        try {
            if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) {
                isKvConnected = false;
            } else {
                attempts = await kv.get(rateKey) || 0;
            }
        } catch (kvError) {
            isKvConnected = false;
        }

        if (isKvConnected && attempts >= RATE_LIMIT.MAX_ATTEMPTS) {
            const ttl = await kv.ttl(rateKey);
            return response.status(429).json({
                error: "Locked",
                message: `安全警告：错误次数过多，IP 已锁定。请等待 ${Math.ceil(ttl / 60)} 分钟。`,
                unlockTime: Date.now() + (ttl * 1000)
            });
        }

        // --- 2. 处理验证请求 (POST) ---
        if (request.method === 'POST') {
            // type: 'login' | 'vault' | 'abyss' | 'export'
            const { password, timestamp, type = 'login' } = request.body;
            
            if (!password) return response.status(400).json({ error: "Missing Password" });
            const now = Date.now();
            if (!timestamp || Math.abs(now - timestamp) > 60000) { 
                return response.status(400).json({ error: "Request Expired", message: "请求已过期" });
            }

            // 获取对应类型的正确 Hash
            const targetHash = ENV.HASH_MAP[type];
            if (!targetHash) {
                // 如果用户试图验证不存在的类型
                return response.status(400).json({ error: "Invalid Type" });
            }

            try {
                // 验证密码
                const isValid = serverVerifyPassword(password, ENV.SALT, targetHash);

                if (isValid) {
                    // 登录成功不一定要清空计数器，防止爆破探测，但为了体验可以清空
                    // 这里选择不清空，或者只在 main login 时清空。
                    // 为了最严格的安全，我们这里不清空，只让它自然过期，或者你可以选择清空。
                    // 策略：Main Login 成功清空，其他成功不清空（防止撞库）。
                    if (type === 'login' && isKvConnected) {
                        try { await kv.del(rateKey); } catch(e) {}
                    }
                    
                    const token = generateToken({ role: 'admin', scope: type });
                    
                    // 构建响应
                    const resData = {
                        success: true,
                        token: token,
                        salt: ENV.SALT // 始终返回 Salt 供前端派生密钥
                    };

                    // 只有主登录才返回加密数据包，其他只返回 success 信号
                    if (type === 'login') {
                        resData.mainCipher = ENCRYPTED_DATA.mainCipher;
                        resData.vaultCipher = ENCRYPTED_DATA.vaultCipher;
                        resData.abyssCipher = ENCRYPTED_DATA.abyssCipher;
                    }

                    return response.status(200).json(resData);

                } else {
                    // 验证失败：增加计数
                    if (isKvConnected) {
                        try {
                            const newAttempts = await kv.incr(rateKey);
                            if (newAttempts === 1) await kv.expire(rateKey, RATE_LIMIT.WINDOW_SECONDS);
                            if (newAttempts >= RATE_LIMIT.MAX_ATTEMPTS) await kv.expire(rateKey, RATE_LIMIT.BLOCK_SECONDS);
                        } catch(e) {}
                    }

                    return response.status(401).json({
                        error: "Unauthorized",
                        message: "密码错误" 
                    });
                }
            } catch (err) {
                console.error("Crypto Error:", err);
                return response.status(500).json({ error: "Server Crypto Error" });
            }
        }

        // --- 3. GET 请求 (保持不变，用于 Token 检查) ---
        if (request.method === 'GET') {
             // ... 现有逻辑 ...
             return response.status(200).json({ status: "online" });
        }

        return response.status(405).json({ error: "Method not allowed" });

    } catch (error) {
        console.error("Server Handler Error:", error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
}


// ==========================================
// Moyer 安全数据 (Generated: 2026/3/15 12:12:33)
// ==========================================
// 架构: Split Auth + Shared IP Lock (v8.1 Fix)

export const ENCRYPTED_DATA = {
    mainCipher: "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",
    vaultCipher: "AOhqxqt3UGfjsO7sb+qRoxEvz5f49F/ilo6Cb4LQ/bm9vEM35ub11MVVWP4igpigbA+F28H/6IuJlkKLjG9tZkBoXj1hDkck7dQWL4e9u0zlln2eTKgzACVQpL/qBwRP26iUTW4XCsZEiAspVorud1x6tAfpOTmIzF0EKqTEH8uHyiocGN5L1PxWKjMQpEs=",
    abyssCipher: "fA/toUObEZGyh/p0gIKFqj6MX9UXAuM837bFC8Jb6UV4uNwJEOtRnFaM7erGYFBN1lhBMljbssp3mNcuWToli2AC/d/uOS+ZDfvLQVKtR0x9AM8DGIptzO72R+IGT8BqTIDFurPuca1F1UD6LpqGMtya1uVKgGRt0f2mJ6mblKQxNVy3azjGzwXsmf69Nyync/jk7LKmfFivzIf+f9OX9josAYFzJOYwyvvOoq9Q4aKnT/JDPMgGaFmHCE/gBUTJSZIPw1eaijTyzdAk+iVuns+3UZvcqhIrZ7X+GAj7QP6wiHSPpOvwVDw02aDh9TyPFIFaf0l7pMqoMVGMuXExXCyq+xE6sHZPMuBiXj2uaesJfXDkpe0woueSFkD6egVVZETLen3bQMh9jtzLlqPMNASyQH9lTnI="
};
