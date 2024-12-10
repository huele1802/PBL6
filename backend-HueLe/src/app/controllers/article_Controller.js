const Article = require("../models/Article");
const Doctor = require("../models/Doctor");
const Speciality = require("../models/Speciality");
const cloudinary = require("../utils/cloudinary");

const fs = require("fs")
require("dotenv").config();

class article_Controller {
  add_Article = async (req, res) => {
    try {
      const { email, article_title, article_content } = req.body;

      if (req.fileValidationError) throw new Error(req.fileValidationError);

      const doctor = await Doctor.findOne({ email }, { _id: 1 });
      if (!doctor) return res.status(404).json({ error: "Doctor not found" });

      let article = await Article.create({
        doctor_id: doctor._id,
        article_title,
        article_content,
      });

      let article_image = null;

      if (req.file) {
        const image_name = `${article._id}_${Date.now()}`;

        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "PBL6/articles/",
          public_id: article._id,
          overwrite: true, // Replace any existing file with the same name
        });

        article_image = uploadResult.secure_url;
        fs.unlinkSync(req.file.path); // Delete temporary file
      }

      if (article_image) article.article_image = article_image;

      await article.save();

      res.status(201).json(article);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  get_Article = async (req, res) => {
    try {
      const article_id = req.params.id;

      const article = await Article.findById(article_id).populate({
        path: "doctor_id",
        select: "email username",
        populate: {
          path: "speciality_id",
          select: "name _id", // name and _id fields
        },
      });

      res.status(200).json(article);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  get_all_Article_By_Email = async (req, res) => {
    try {
      const { email } = req.body;
      const doctor = await Doctor.findOne({ email }, { _id: 1 });

      const articles = await Article.find({ doctor_id: doctor._id }).populate({
        path: "doctor_id",
        select: "email",
        populate: {
          path: "speciality_id",
          select: "name _id", // name and _id fields
        },
      });

      res.status(200).json(articles);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  get_all_Article_by_Doctor_Speciality = async (req, res) => {
    try {
      const { speciality_name } = req.body;

      const speciality = await Speciality.findOne(
        { name: speciality_name },
        { _id: 1 }
      );
      if (!speciality) {
        return res.status(404).json({ error: "Speciality not found" });
      }

      const doctors = await Doctor.find(
        { speciality_id: speciality._id },
        { _id: 1 }
      );
      if (doctors.length === 0) {
        return res
          .status(404)
          .json({ error: "No doctors found for this speciality" });
      }

      const doctor_ids = doctors.map((doctor) => doctor._id);

      const articles = await Article.find({
        doctor_id: { $in: doctor_ids },
      }).populate({
        path: "doctor_id",
        select: "email",
        populate: {
          path: "speciality_id",
          select: "name _id", // name and _id fields
        },
      });

      res.status(200).json(articles);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  get_All_Article = async (req, res) => {
    try {
      let articles;
      const { hidden_state } = req.body;

      if (hidden_state == "true") {
        articles = await Article.find({ is_deleted: true }).populate({
          path: "doctor_id",
          select: "email username",
          populate: {
            path: "speciality_id",
            select: "name _id", // name and _id fields
          },
        });
      } else {
        articles = await Article.find({ is_deleted: false }).populate({
          path: "doctor_id",
          select: "email username",
          populate: {
            path: "speciality_id",
            select: "name _id", // name and _id fields
          },
        });
      }
      res.status(200).json(articles);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  update_Article = async (req, res) => {
    try {
      const article_id = req.params.id;
      const { article_title, article_content } = req.body;
      // const article_image = req.file ? req.file.buffer : null

      let article = await Article.findById(article_id);
      if (!article) return res.status(404).json({ error: "Article not found" });

      if (req.fileValidationError) throw new Error(req.fileValidationError);

      let article_image = null;

      if (req.file) {
        const image_name = `${article._id}_${Date.now()}`;

        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "PBL6/articles/",
          public_id: article._id,
          overwrite: true, // Replace any existing file with the same name
        });

        article_image = uploadResult.secure_url;
        fs.unlinkSync(req.file.path); // Delete temporary file
      }

      if (article_title) {
        article.article_title = article_title;
      }

      if (article_content) {
        article.article_content = article_content;
      }

      if (article_image) article.article_image = article_image;

      await article.save();

      article = await Article.findById(article_id).populate({
        path: "doctor_id",
        select: "email",
        populate: {
          path: "speciality_id",
          select: "name _id", // name and _id fields
        },
      });

      res.status(200).json(article);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  soft_Delete_Article = async (req, res) => {
    try {
      // get id list
      const { article_ids } = req.body;

      // if no ids
      if (
        !article_ids ||
        !Array.isArray(article_ids) ||
        article_ids.length === 0
      ) {
        return res.status(400).json({ error: "No IDs provided" });
      }

      const result = await Article.updateMany(
        { _id: { $in: article_ids } },
        { is_deleted: true }
      );

      res.status(200).json({
        message: "Articles soft deleted",
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  restore_Article = async (req, res) => {
    try {
      // get id list
      const { article_ids } = req.body;

      // if no ids
      if (
        !article_ids ||
        !Array.isArray(article_ids) ||
        article_ids.length === 0
      ) {
        return res.status(400).json({ error: "No IDs provided" });
      }

      const result = await Article.updateMany(
        { _id: { $in: article_ids } },
        { is_deleted: false }
      );

      res.status(200).json({
        message: "Articles restored",
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  perma_Delete_Article = async (req, res) => {
    try {
      // get id list
      const { article_Ids } = req.body;

      // if no ids
      if (
        !article_Ids ||
        !Array.isArray(article_Ids) ||
        article_Ids.length === 0
      ) {
        return res.status(400).json({ error: "No IDs provided" });
      }

      // Find the articles to delete and retrieve their image public_ids
      const articles = await Article.find(
        { _id: { $in: article_Ids } },
        "article_image"
      );

      // Prepare an array of public_ids to delete from Cloudinary
      const public_Ids = articles
        .map((article) => {
          const image_Url = article.article_image;

          if (!image_Url) return null;

          const public_Id = image_Url
            .split("/")
            .slice(-3)
            .join("/")
            .replace(/\.\w+$/, ""); // Remove file extension

          return public_Id;
        })
        .filter((public_Id) => public_Id);

      // Delete images from Cloudinary
      if (public_Ids.length > 0) {
        const cloudinary_Delete_Promises = public_Ids.map((public_Id) => {
          return new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(public_Id, (error, result) => {
              if (error) {
                console.error(`Failed to delete ${public_Id}:`, error.message)
                return resolve(null)
            }
              resolve(result);
            });
          });
        });

        await Promise.all(cloudinary_Delete_Promises); // Wait for all deletions to complete
      }

      const result = await Article.deleteMany({ _id: { $in: article_Ids } });

      res.status(200).json({
        message: "Articles deleted",
        modifiedCount: result.deletedCount,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // search article by title or content
  search_Article_By_Title_and_Content = async (req, res) => {
    try {
      const { search_query } = req.body;

      const query = {};

      if (search_query) {
        // create a regular expression for case-insensitive search
        const regex = { $regex: search_query, $options: "i" };

        // Search in multiple fields: article title, and content
        query.$or = [
          { article_title: regex }, // Search by article title
          { article_content: regex }, // Search by article content
        ];
      }

      const articles = await Article.find(query).populate({
        path: "doctor_id",
        select: "email username",
        populate: {
          path: "speciality_id",
          select: "name _id", // name and _id fields
        },
      });

      res.status(200).json(articles);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  getArticlesByMonth = async (req, res) => {
    try {
      const { year } = req.body;

      const articlesByMonth = await Article.aggregate([
        {
          $match: {
            date_published: {
              $gte: new Date(year, 0, 1),
              $lt: new Date(year + 1, 0, 1),
            },
            is_deleted: false,
          },
        },
        {
          $group: {
            _id: { month: { $month: "$date_published" } },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.month": 1 },
        },
      ]);

      const result = Array.from({ length: 12 }, (_, i) => {
        const monthData = articlesByMonth.find(
          (item) => item._id.month === i + 1
        );
        return { month: i + 1, count: monthData ? monthData.count : 0 };
      });

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  getTop5ArticleBySpeciality = async (req, res) => {
    try {
      const result = await Article.aggregate([
        { $match: { is_deleted: false } },

        {
          $lookup: {
            from: "users",
            localField: "doctor_id",
            foreignField: "_id",
            as: "doctorDetails",
          },
        },
        { $unwind: "$doctorDetails" },

        {
          $lookup: {
            from: "specialities",
            localField: "doctorDetails.speciality_id",
            foreignField: "_id",
            as: "specialityDetails",
          },
        },
        { $unwind: "$specialityDetails" },

        {
          $group: {
            _id: "$doctorDetails.speciality_id",
            specialityName: { $first: "$specialityDetails.name" },
            articleCount: { $sum: 1 },
          },
        },

        { $sort: { articleCount: -1 } },

        { $limit: 5 },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "No specialities found with associated articles.",
        });
      }

      res.status(200).json({
        success: true,
        data: result,
        message: "Top 5 specialities by article count retrieved successfully",
      });
    } catch (error) {
      console.error("Error fetching top specialities:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch top specialities.",
      });
    }
  };
}

module.exports = new article_Controller();
