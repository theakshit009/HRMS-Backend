import AttendanceConfig from "../models/AttendanceConfig.model.js";
import "dotenv/config";

// In-memory cache for high-throughput attendance checks
let cachedConfig = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute auto-refresh

/**
 * Extracts and normalizes client IP address from request
 */
export const getClientIp = (req) => {
    let clientIp = "";
    
    // Check X-Forwarded-For header first (populated behind proxies / reverse proxies)
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
        // May contain a comma-separated list of IPs; first one is the client
        clientIp = forwarded.split(",")[0].trim();
    }
    
    if (!clientIp) {
        clientIp = req.ip || req.socket?.remoteAddress || "";
    }

    // Normalize IPv6 localhost
    if (clientIp === "::1") clientIp = "127.0.0.1";
    // Strip IPv6 prefix for IPv4-mapped addresses
    if (clientIp && clientIp.startsWith("::ffff:")) {
        clientIp = clientIp.replace("::ffff:", "");
    }

    return clientIp.trim();
};

/**
 * Retrieves environment variable defaults
 */
export const getEnvDefaults = () => {
    const rawOfficeIps = process.env.OFFICE_IP || "";
    const officeIps = rawOfficeIps
        .split(",")
        .map(ip => ip.trim())
        .filter(Boolean);
    const startTime = process.env.START_TIME || "09:00";
    const endTime = process.env.END_TIME || "18:00";

    return { officeIps, startTime, endTime };
};

/**
 * Retrieves active attendance configuration with fallback to environment variables
 */
export const getAttendanceConfig = async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && cachedConfig && (now - lastCacheTime < CACHE_TTL_MS)) {
        return cachedConfig;
    }

    const envDefaults = getEnvDefaults();

    try {
        const configDoc = await AttendanceConfig.findOne().sort({ updatedAt: -1 });

        if (!configDoc) {
            cachedConfig = {
                id: null,
                officeIps: envDefaults.officeIps,
                startTime: envDefaults.startTime,
                endTime: envDefaults.endTime,
                isCustomConfigured: false,
                updatedAt: null,
                updatedByName: "Environment Default",
                updatedByEmail: "",
                envDefaults
            };
        } else {
            // If officeIps is configured in DB, use it; otherwise fallback to env
            const effectiveIps = (Array.isArray(configDoc.officeIps) && configDoc.officeIps.length > 0)
                ? configDoc.officeIps
                : envDefaults.officeIps;

            const effectiveStartTime = configDoc.startTime || envDefaults.startTime;
            const effectiveEndTime = configDoc.endTime || envDefaults.endTime;

            cachedConfig = {
                id: configDoc._id,
                officeIps: effectiveIps,
                startTime: effectiveStartTime,
                endTime: effectiveEndTime,
                isCustomConfigured: true,
                updatedAt: configDoc.updatedAt,
                updatedByName: configDoc.updatedByName || "HR Admin",
                updatedByEmail: configDoc.updatedByEmail || "",
                envDefaults
            };
        }

        lastCacheTime = now;
        return cachedConfig;
    } catch (error) {
        console.error("Failed to read AttendanceConfig from database, using env defaults:", error.message);
        return {
            id: null,
            officeIps: envDefaults.officeIps,
            startTime: envDefaults.startTime,
            endTime: envDefaults.endTime,
            isCustomConfigured: false,
            updatedAt: null,
            updatedByName: "Environment Default (Fallback)",
            updatedByEmail: "",
            envDefaults
        };
    }
};

/**
 * Updates attendance configuration and syncs runtime environment variables
 */
export const updateAttendanceConfig = async ({ officeIps, startTime, endTime, user }) => {
    // Sanitize office IPs
    let parsedIps = [];
    if (Array.isArray(officeIps)) {
        parsedIps = officeIps.map(ip => String(ip).trim()).filter(Boolean);
    } else if (typeof officeIps === "string") {
        parsedIps = officeIps
            .split(/[\n,]+/)
            .map(ip => ip.trim())
            .filter(Boolean);
    }

    // Deduplicate
    parsedIps = Array.from(new Set(parsedIps));

    let configDoc = await AttendanceConfig.findOne().sort({ updatedAt: -1 });

    if (!configDoc) {
        configDoc = new AttendanceConfig({
            officeIps: parsedIps,
            startTime: startTime || "09:00",
            endTime: endTime || "18:00",
            updatedBy: user?.id || null,
            updatedByName: user?.fullName || user?.employeeId || "HR Admin",
            updatedByEmail: user?.email || ""
        });
    } else {
        configDoc.officeIps = parsedIps;
        configDoc.startTime = startTime;
        configDoc.endTime = endTime;
        configDoc.updatedBy = user?.id || null;
        configDoc.updatedByName = user?.fullName || user?.employeeId || "HR Admin";
        configDoc.updatedByEmail = user?.email || "";
    }

    await configDoc.save();

    // Sync process.env in-memory so any external script/middleware accessing process.env directly also sees the latest values
    process.env.OFFICE_IP = parsedIps.join(",");
    process.env.START_TIME = configDoc.startTime;
    process.env.END_TIME = configDoc.endTime;

    // Refresh memory cache
    return await getAttendanceConfig(true);
};

/**
 * Resets custom database config and reverts to environment variables
 */
export const resetAttendanceConfigToEnv = async () => {
    await AttendanceConfig.deleteMany({});
    cachedConfig = null;
    lastCacheTime = 0;
    return await getAttendanceConfig(true);
};

/**
 * Helper to parse "HH:MM" into total minutes from start of day
 */
export const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
};

/**
 * Gets current minutes of the day in the configured office timezone (default: Asia/Kolkata)
 * Fixes timezone mismatch when deployed on cloud providers running in UTC (e.g. Render, AWS)
 */
export const getCurrentTimeInMinutes = (timeZone = process.env.TIMEZONE || "Asia/Kolkata") => {
    try {
        const formatter = new Intl.DateTimeFormat("en-GB", {
            timeZone,
            hour: "numeric",
            minute: "numeric",
            hourCycle: "h23"
        });
        const parts = formatter.formatToParts(new Date());
        let hours = 0;
        let minutes = 0;
        for (const part of parts) {
            if (part.type === "hour") hours = parseInt(part.value, 10);
            if (part.type === "minute") minutes = parseInt(part.value, 10);
        }
        return hours * 60 + minutes;
    } catch (e) {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    }
};

/**
 * Gets current date formatted as YYYY-MM-DD in the configured office timezone (default: Asia/Kolkata)
 */
export const getTodayDateInTimezone = (timeZone = process.env.TIMEZONE || "Asia/Kolkata") => {
    try {
        const formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });
        return formatter.format(new Date());
    } catch (e) {
        return new Date().toISOString().split("T")[0];
    }
};
