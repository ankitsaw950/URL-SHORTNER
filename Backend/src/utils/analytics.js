import redisClient from "../config/redis.js";

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
