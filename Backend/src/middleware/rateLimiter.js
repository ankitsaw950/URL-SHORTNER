import redisClient from "../config/redis.js"

 const rateLimiter = (limit = 50, windowSec = 60) => {
  return async (req, res, next) => {
    try {
      const ip =
        req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unkown";

      const key = `rate:${ip}`;

      const current = await redisClient.incr(key);

      if (current === 1) {
        await redisClient.expire(key, windowSec);
      }

      if (current > limit) {
        return res.status(429).json({ message: "Too many requests" });
      }

      next();
    } catch (error) {
      console.error("Rate Limiter Error:", error);

      next();
    }
  };
};


export default rateLimiter