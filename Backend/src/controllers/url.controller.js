import UrlModel from "../models/url.model.js";
import { nanoid } from "nanoid";
import redisClient from "../config/redis.js";


/*
@ Helper : safe redis  get ( Returns proper msg on error)
*/

async function safeRedisGet(key){
  try {
    
    return await redisClient.get(key);

  } catch (error) {
    console.error("Redis GET error : ",err?.message || error)
    return null
  }
}

// Safe redis set
async function safeRedisSet(key,value ,ttlSeconds =86400){
  try {
 // if ttlSeconds is falsy, set without expiry
    if (ttlSeconds) {
      await redisClient.set(key, value, { EX: ttlSeconds });
    } else {
      await redisClient.set(key, value);
    }

  } catch (error) {
    console.error("Redis SET error : ",err?.message || error)
    return null
  }
}

const createUrl = async (req, res) => {
  try {
    const { url, customCode } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

      let normalizedUrl;
    // Basic Url validation
    try {
       const parsed = new URL(url);
      // allow only http/https
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return res.status(400).json({ message: "Only http/https URLs are allowed" });
      }

       normalizedUrl = parsed.href;
      // to avoid the trailing slash in the url 

    } catch (error) {
      return res.status(400).json({ message: "Invalid URL" });
    }

    // Decide about the slug

    const shortCode = customCode || nanoid(6);
    const cacheKey = `short:${shortCode}`;

    try {
      const newUrl = await UrlModel.create({
        full_url: normalizedUrl,
        short_url: shortCode,
      });

      // populate cache so first redirect is fast
      safeRedisSet(cacheKey, normalizedUrl, 60 * 60 * 24); // 24h TTL

      return res.status(201).json({
        message: "URL created successfully",
        shortURL: `${process.env.BASE_URL}/${shortCode}`,
        shortCode
      });
    } catch (dBError) {
      // handle duplicate slug
      if (dBError.code === 11000) {
        return res
          .status(400)
          .json({ message: "Custom code already exists,choose another" });
      }

      throw dBError;
    }
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;

    // STEP 1 : Check the redis cache first

    const cachekey = `short:${code}`;
    const cachedUrl = await redisClient.get(cachekey);

    if(cachedUrl){
      console.log("🟢 Redis cache hit");
      return res.redirect(cachedUrl);
    }

    console.log("🟠 Redis cache miss");

    // STEP 2 : Check the DB
    const url = await UrlModel.findOne(
      { short_url: code },
      { full_url: 1, _id: 0 }
    )
      .lean()
      .exec();

    if (!url) return res.status(404).json({ message: "URL not found" });

    // STEP 3 : Add to the redis cache
    await redisClient.set(cachekey,url.full_url,{EX:60*60})

    return res.redirect(url.full_url);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export { createUrl, redirectUrl };
