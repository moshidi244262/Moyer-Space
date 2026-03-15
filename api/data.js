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
// Moyer 安全数据 (Generated: 2026/3/15 16:43:26)
// ==========================================
// 架构: Split Auth + Shared IP Lock (v8.1 Fix)

export const ENCRYPTED_DATA = {
    mainCipher: "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",
    vaultCipher: "0v8xZSw0BsbqKaLQoYfh6iHpY/GvVySBaTEywDaOdc/fFv00PmXX5uEvU6fnzD7ynSlodeJ5nrRpVKIzFzmCnBDhKk06u9tyNsO9339CBof/UxU1L2zqDZt3h0eJ50iqyyvzgnnLC3na4Gb6GIoz9/k8tZfah8xAspYjSoed/KOC69BMZe/Rl7ECXVZrw5cFax/T1B5VVcnlhIKTemkjmfxrWyVva1JJtLF5ZcFVxy92gJmVo4iLVaEfwlpJYW/jJ6nqnRSa4SqnVh+E0KU4mv0WPkDP8L2cpLmCXQCxN+cpNRaiypjNtjA/q1rwdI+u91Nj1O6wGUfGTWVNpWAyJHm4/jQG+tWHC/GKpjpTrOimAC+Qhj76/GEUaUf7Q8ogomng4Ch+xlXQRLA331NEmlEgHryqfudZXPY/orFs5nZsD357R+c568AIrE5VGLd4ibvPqzy/t2dzKvOlfOAFqe0vLuzX/WYSHjqmsoGpp93hIUrVQHziFEuqTHXUx1LVA9Xe9I7Gcy4/6nkveuMPQQHnUSXNjgBxAlslMml3XNXd91h4xOPl0uNUQroPcF4CV+RNmdznbIQvfd51sh6k1wSAbqiCDjc7S8oc7+Gd8f0lmDJlDHwqQzcxDqFKQggYIK9fxazOt/2aFiyocSgyeSQBtfbVog==",
    abyssCipher: "X6mLlA92Sl2RbReSvNfrWmKSvxtc8tgqeychp9DI0zUfdj+SXSiZqkWLpgPXRwk70uipkbw6cnj9v4rxNfVVu5In1Q0VVBZ7kwxhVsXbxQ9iynBQ+AFhMgrrjAQ09bnUK014wqFbw7ia8d5RYC2cnisXn0tvC2AUx8iXx0gLGyQYWd4eMyaEDWsL/61SucFTdwcEqBg0YmnZftzQjXanl3T/YaAkxEDGSFX04i8UTmEduhvDNjylg4R1yrQ95OFW+QFQp5Vgzr4Aoo6MFmF1asP3bG65jtQR2MJ8iaa+71A6J/cBEyf/dFKf/S3AbEA96LRAF5sjxFZBvNI301Xl4eof+7xk+HZS40ONb1NDw1qyhqG2gXgJqxCtTP+5HW8GdLywzWI63KrO36JCRD8PjD1j+p8="
};
