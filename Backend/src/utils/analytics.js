import redisClient from "../config/redis.js";
import { UAParser } from "ua-parser-js";

export const recordBasicAnalytics = async (code) => {
  try {
    const countKey = `stats:count:${code}`;
    const lastkey = `stats:lastClick:${code}`;
    const firstKey = `stats:firstClick:${code}`;

    const time = Date.now();

    // Increment total clicks
    redisClient.incr(countKey).catch(() => {});

    redisClient.set(lastkey, time).catch(() => {});

    redisClient.set(firstKey, time, { NX: true }).catch(() => {});
  } catch (error) {
    console.error("Analytics Error:", err.message);
  }
};

export const recordIntermediateAnalytics = async (req, code) => {
  try {
    const parser = new UAParser(req.headers["user-agent"]);

    const uaResult = parser.getResult();

    const ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unkown";

    const referrer = req.headers["referrer"] || "direct";

    const logData = {
      timeStamp: Date.now(),
      ip,
      browser: uaResult.browser.name || "Unknown",
      os: uaResult.os.name || "Unknown",
      device: uaResult.device.type || "desktop",
      referrer,
    };

    // Push into Redis log list

    await redisClient.LPUSH(`stats:logs:${code}`, JSON.stringify(logData));

    await redisClient.LTRIM(`stats:logs:${code}`, 0, 199);
  } catch (error) {
    console.error("Intermediate Analytics Error:", error);
  }
};

/*

export const analytics = async(code) =>{

    try{
    
    const countKey = `stats:count:${code};
    const firstKey  = `stats:firstClick:${code};
    const lastKey = `stats:lastClick:${code};

    const time = Date.now();

    redisClient.incr(countKey).catch(()=>{})
    
    redisClient.set(lastKey,time).catch(()=>{})

    redisClient.set(firstKey,time,{NX:true}).catch(()=>{})

    }
}

*/
