import URL from "../models/url.model.js";
import { nanoid } from "nanoid";

const createUrl = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
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
