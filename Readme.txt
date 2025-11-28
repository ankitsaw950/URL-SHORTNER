making the basic setup of folders and file

make the two controller 
- create url
- redirect url

-Now provide the feature of adding custom slug

if (customCode) {
  const existingUrl = await URL.findOne({ short_url: customCode });
  if (existingUrl) {
    return res.status(400).json({ message: "Custom code already exists" });
  }
}


This creates the race condition ..

If two users send the  same custom slug at the same time.

- Both calls run findOne()
- Both thinks that slug does not exist.
- Both try  to create the document
- One user able to create and the other fails.

Also this adds ,
- one extra DB read everytime , when the user sends the custom code
- this slows down the api

After checking the slug ,  I am creating the document , this means that i am not trusting the db uniquness feature


this code is not scalable if multiple server instances run


================

const createUrl = async (req, res) => {
  try {
    const { url, customCode } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    //  Now add a check whether there is a custom code existing  or not

    if (customCode) {
      const existingUrl = await URL.findOne({ short_url: customCode });

      if (existingUrl) {
        return res.status(400).json({ message: "Custom code already exists" });
      }

      const newUrl = await URL.create({
        full_url: url,
        short_url: customCode,
      });

      return res
        .status(201)
        .json({ message: "URL created successfully", customCode });
    }

    const shortCode = nanoid(6);
    console.log(shortCode);

    const newUrl = await URL.create({
      full_url: url,
      short_url: shortCode,
    });

    return res
      .status(201)
      .json({ message: "URL created successfully", shortCode });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

------------

In this I am not checking the format of the URL 

So first i need to validate whether the url is in the valid format or not



---------------------------

const redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;
    const url = await URL.findOne({ short_url: code });

    if (!url) return res.status(404).json({ message: "URL not found" });

    return res.redirect(url.full_url);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export { createUrl, redirectUrl };
 

 => .lean()

This is VERY important.

Normal Mongoose query returns a heavy Mongoose document

includes getters, setters

virtual properties

internal metadata

prototype chain

This is unnecessary for a simple redirect.

.lean() returns a plain JS object

=====================================================

Now adding the redis for caching
==========================================================

1. Check Redis cache
     ↓
2. If found → redirect immediately (2ms)
     ↓
3. If NOT found → query MongoDB
     ↓
4. Save result to Redis (cache)
     ↓
5. Redirect


===============================

Now adding the analytics features : 

Analytics is divided into 3 phases :
1. Basic Analytics (These are must-have metrics)
    - Click Count
    - Last Click Timestamp
    - First Click Timestamp
    - Store analytics per short URL

2. Intermediate Analytics (These tell you more about the user)

✔ IP Address
✔ User-Agent
✔ Device Type (mobile/desktop/tablet)
✔ Browser Name
✔ Operating System
✔ Referrer (where the user came from)
✔ Store logs in Redis (fast, scalable)



3. Advanced Analytics
   - Geolocation
   - Browser Breakdown
   - OS Breakdown
   - Hourly Click Graph
   - Unique Visitors
   - Heatmaps, charts, dashboards


   -------------------------------------------

   Implementing the phase 1 :

   First of all create 3 variables to store the values :
   - countKey
   - firstKey
   - lastkey


   redisclient.incr(countKey).catch(()=>{})

   redisclient.set(lastkey,time).catch(()=>{})

   redisclient.set(firstKey,time,{NX : true}).catch(()=>{})    NX => this is used , if it is set once then it is being ignored the rest of the time

   --------------------------------------------

   Implementing phase 2:

   For this we install the package :
   
   npm install ua-parser-js


 

