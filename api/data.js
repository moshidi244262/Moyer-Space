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
// Moyer 安全数据 (Generated: 2026/3/15 10:50:00)
// ==========================================
// 架构: Split Auth + Shared IP Lock (v8.1 Fix)

export const ENCRYPTED_DATA = {
    mainCipher: "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",
    vaultCipher: "IJv/f/SrRt3wVzyX9xq7FstV+ift+tbz4+eN7PYTLxs3hY8gybjBKSN91V5+aICUOiT8gJUSPHeu9SUWIQ8rwvoPArUdU+Xt4Og79v7sLK3Wuk5RQ8ap8ZbRL17+/Zgx2BsG3RacNUsaKjkQnRJqk2FhF7WtesvNpT0gV7bwn//zVG2jyP2WfHA68WUXz+U=",
    abyssCipher: "DE/ffLHb+sAgKjV1vC8Qb2nyP9pmhuFihV49LHDrWJdK/b72TcnZNtnUmZnwOuziRKL4n7mgxSbOI63Eucc3bbnafv97/E4vNoGWfbhV4Q3VeNqRoLqoPj5t3qXYSuiT2Zto8aTFQOoYAWf9WUyyBDz3mTx1ByOdtx8jVF7G00WePDCY4E1YxOfmzFasppVwQgEqJxg62U5TCd1L2QPPthD+OtmORr/axQuJQ4FXF2Ye97fDiRpWby4Fl4+RQ8ZtuRt/NdNB4dIQYA3/mzdbOUOM2nGYyDjy/0JRUYklR8Z4KBXonMkL1xCyT4N7LizFNTQIIDfMI5YWljoOvtTdTacJ+g+X2bntd+v6Dc0WwUyHNRfpthF8FB8EjO577v2x+UwY8jDOUhZyBElVaI2C2NWcml84Ldo="
};
