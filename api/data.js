import { createClient } from '@vercel/kv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ==========================================
// 安全配置：CORS 来源锁定
// ==========================================
const ALLOWED_ORIGIN = 'https://moyer.vercel.app';

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
// Moyer 安全数据 (Generated: 2026/3/15 11:11:20)
// ==========================================
// 架构: Split Auth + Shared IP Lock (v8.1 Fix)

export const ENCRYPTED_DATA = {
    mainCipher: "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",
    vaultCipher: "vHb//bq/eG+NVd6ntN4SWZpcgHW+RTXsHkV5Q8ZJttU5AvD3RqWejdvC9jGR4MroW827H0eKf/p+/tdXTtLRSgjUPkqZpCo2ibrdOw8Oadw6Fo2Le/pf1R1aVWhxOccc+oRajqIozNC9pxVZzTz5APvoaQ0Yu1MkiGJJ4GodsdJOJe+i0rIq5mYpA12U1Xg=",
    abyssCipher: "WeXK1SUFGNqCGSRcMwFIHoa0ofLTtrP3GbJ2BnO4mJ6/kHCmN+2Q17swRUL//rtJobDnSsUvUfkF8kj+PNeocSUkT9jIcgH4nxmk6er5GVGgc0ABN1+0HMg9F11jNVJRx/rT46thMb0y3Rmg8pcdcUgfYS0vcwxIiGXO39GXz3uaLjq+DZ2ldd+A2aOxLK2vc8oRai1wtiVu+LOBwWwD5dWuR0XrmcOmgodVHnmnBaxz8eE/STIOqi5O7MwI7PLYSrRQZ+dCgYvPe+2+FJLfqEWps4cYkkfD8xOybkMQU3kY46k5DjcLg1uyrPI1mu0qgSegYqdOGevmfkhSC78jMELYdfpbZOqDedokgNG32hhDymojqetYsprzr4pVwjpDBz/ohwJvrjJLFrF2tIK3Lgi/kHNoDWg="
};
