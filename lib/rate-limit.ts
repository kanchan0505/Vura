type AttemptRecord = {
    count: number;
    firstAttempt: number;
    blockedUntil?: number;
};

const loginAttempts = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

export function isBlocked(key: string) {
    const record = loginAttempts.get(key);

    if (!record) {
        return {
            blocked: false,
        };
    }

    const now = Date.now();

    if (record.blockedUntil && record.blockedUntil > now) {
        return {
            blocked: true,
            retryAfter: Math.ceil(
                (record.blockedUntil - now) / 1000
            ),
        };
    }

    if (record.blockedUntil && record.blockedUntil <= now) {
        loginAttempts.delete(key);

        return {
            blocked: false,
        };
    }

    return {
        blocked: false,
    };
}

export function recordFailedAttempt(key: string) {
    const now = Date.now();

    const existingRecord = loginAttempts.get(key);

    if (!existingRecord) {
        loginAttempts.set(key, {
            count: 1,
            firstAttempt: now,
        });

        return;
    }

    if (now - existingRecord.firstAttempt > WINDOW_MS) {
        loginAttempts.set(key, {
            count: 1,
            firstAttempt: now,
        });

        return;
    }

    existingRecord.count += 1;

    if (existingRecord.count >= MAX_ATTEMPTS) {
        existingRecord.blockedUntil =
            now + BLOCK_DURATION_MS;
    }

    loginAttempts.set(key, existingRecord);
}

export function clearFailedAttempts(key: string) {
    loginAttempts.delete(key);
}