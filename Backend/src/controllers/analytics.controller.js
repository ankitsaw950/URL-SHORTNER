import redisClient from "../config/redis.js";

export const getAnalytics = async (req, res) => {
  try {
    const { code } = req.params;

    // Redis keys for analytics
    const countKey = `stats:count:${code}`;
    const firstKey = `stats:firstClick:${code}`;
    const lastKey = `stats:lastClick:${code}`;
    const logsKey = `stats:logs:${code}`;

    // Fetch data from Redis in parallel for performance
    const [count, firstClick, lastClick, logs] = await Promise.all([
      redisClient.get(countKey),
      redisClient.get(firstKey),
      redisClient.get(lastKey),
      redisClient.lRange(logsKey, 0, 49), // last 50 records
    ]);

    // Check if this short code has any analytics
    const nothingExists = !count && !firstClick && !lastClick;
    if (nothingExists) {
      return res.status(404).json({
        message: "No analytics found for this short code",
      });
    }

    // Parse logs (Redis stores them as string)
    const parsedLogs = logs.map((entry) => JSON.parse(entry));

    return res.status(200).json({
      shortCode: code,
      totalClicks: Number(count) || 0,
      firstClick: firstClick ? Number(firstClick) : null,
      lastClick: lastClick ? Number(lastClick) : null,
      recentLogs: parsedLogs,
    });
  } catch (error) {
    console.error("Analytics Fetch Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
