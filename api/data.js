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

