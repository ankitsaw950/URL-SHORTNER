import UrlModel from "../models/url.model.js";
import { nanoid } from "nanoid";

const createUrl = async (req, res) => {
  try {
    const { url, customCode } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    // Basic Url validation
    try {
      const normalizedUrl = new URL(url).href;
      // to avoid the trailing slash in the url 

    } catch (error) {
      return res.status(400).json({ message: "Invalid URL" });
    }

    // Decide about the slug

    const shortCode = customCode || nanoid(6);

    try {
      const newUrl = await UrlModel.create({
        full_url: normalizedUrl,
        short_url: shortCode,
      });

      return res.status(201).json({
        message: "URL created successfully",
        shortURL: `${process.env.BASE_URL}/${shortCode}`,
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
    const url = await UrlModel.findOne(
      { short_url: code },
      { full_url: 1, _id: 0 }
    )
      .lean()
      .exec();

    if (!url) return res.status(404).json({ message: "URL not found" });

    return res.redirect(url.full_url);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export { createUrl, redirectUrl };
