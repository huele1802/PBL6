const Speciality = require("../models/Speciality");
const Doctor = require("../models/Doctor");
const cloudinary = require("../utils/cloudinary");

const fs = require("fs");
const mongoose = require("mongoose");

require("dotenv").config();

class speciality_Controller {
  add_Speciality = async (req, res) => {
    try {
      // get info from body
      const { name, description } = req.body;

      const exists_spec = await Speciality.findOne({ name });

      if (exists_spec) {
        throw new Error("Speciality already exits");
      }

      if (req.fileValidationError) throw new Error(req.fileValidationError);

      //create
      let speciality = await Speciality.create({ name, description });

      let speciality_image = null;

      if (req.file) {
        const image_name = `${speciality._id}_${Date.now()}`;

        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "PBL6/specialities",
          public_id: speciality._id,
          overwrite: true, // Replace any existing file with the same name
        });

        speciality_image = uploadResult.secure_url;
        fs.unlinkSync(req.file.path); // Delete temporary file
      }

      if (speciality_image) {
        speciality.speciality_image = speciality_image;
        await speciality.save();
      }

      res.status(201).json(speciality);
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  get_Speciality_By_ID = async (req, res) => {
    try {
      // Get _id from req.body
      const id = req.params.id;

      // Find speciality by ID
      const speciality = await Speciality.findById(id);

      // If not found
      if (!speciality) {
        return res.status(404).json({ error: "Speciality not found" });
      }

      res.status(200).json(speciality);
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  get_Speciality_List = async (req, res) => {
    try {
      let specialities;
      const { hidden_state } = req.body;

      // find list of speciality
      if (hidden_state == "true") {
        specialities = await Speciality.find({ is_deleted: true });
      } else {
        specialities = await Speciality.find({ is_deleted: false });
      }

      res.status(200).json(specialities);
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  update_Speciality = async (req, res) => {
    try {
      // get info from body
      const { name, description } = req.body;

      // get id
      const speciality_Id = req.params.id;

      // find speciality
      let speciality = await Speciality.findById(speciality_Id);

      if (!speciality) {
        return res.status(404).json({ error: "Speciality not found" });
      }

      if (req.fileValidationError) throw new Error(req.fileValidationError);

      let speciality_image = speciality.speciality_image;

      if (req.file) {
        // const image_name = `${speciality._id}_${Date.now()}`;

        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "PBL6/specialities",
          public_id: speciality._id,
          overwrite: true, // Replace any existing file with the same name
        });

        speciality_image = uploadResult.secure_url;
        fs.unlinkSync(req.file.path); // Delete temporary file
      }

      // update
      if (name) {
        const existingSpeciality = await Speciality.findOne({
          name,
          _id: { $ne: speciality_Id },
        });
        if (existingSpeciality) {
          throw new Error("Speciality already exits");
        }
        speciality.name = name;
      }
      if (description) {
        speciality.description = description;
      }

      speciality.speciality_image = speciality_image;

      await speciality.save();

      res.status(200).json(speciality);
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  soft_Delete_Specialty = async (req, res) => {
    try {
      // get id list
      const { speciality_Ids } = req.body;

      // if no ids
      if (
        !speciality_Ids ||
        !Array.isArray(speciality_Ids) ||
        speciality_Ids.length === 0
      ) {
        return res.status(400).json({ error: "No IDs provided" });
      }

      // update
      const result = await Speciality.updateMany(
        { _id: { $in: speciality_Ids } },
        { is_deleted: true }
      );

      res.status(200).json({
        message: "Speciality soft deleted",
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  restore_Deleted_Specialty = async (req, res) => {
    try {
      // get id list
      const { speciality_Ids } = req.body;

      // if no ids
      if (
        !speciality_Ids ||
        !Array.isArray(speciality_Ids) ||
        speciality_Ids.length === 0
      ) {
        return res.status(400).json({ error: "No IDs provided" });
      }

      // update
      const result = await Speciality.updateMany(
        { _id: { $in: speciality_Ids } },
        { is_deleted: false }
      );

      res.status(200).json({
        message: "Speciality restored",
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  perma_Delete_Specialty = async (req, res) => {
    try {
      // get id list
      const { speciality_Ids } = req.body;

      // if no ids
      if (
        !speciality_Ids ||
        !Array.isArray(speciality_Ids) ||
        speciality_Ids.length === 0
      ) {
        return res.status(400).json({ error: "No IDs provided" });
      }

      // Find the specialities to delete and retrieve their image public_ids
      const specialities = await Speciality.find(
        { _id: { $in: speciality_Ids } },
        "speciality_image"
      );

      // Prepare an array of public_ids to delete from Cloudinary
      const public_Ids = specialities
        .map((speciality) => {
          const image_Url = speciality.speciality_image;

          if (!image_Url) return null;

          // Extract public_id from URL
          const public_Id = image_Url
            .split("/")
            .slice(-3)
            .join("/")
            .replace(/\.\w+$/, "");

          return public_Id; //public_Id
        })
        .filter((public_Id) => public_Id);

      // Delete images from Cloudinary
      if (public_Ids.length > 0) {
        const cloudinary_Delete_Promises = public_Ids.map((public_Id) => {
          return new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(public_Id, (error, result) => {
              console.log({ error, result });
              if (error) {
                console.error(`Failed to delete ${public_Id}:`, error.message);
                return resolve(null);
              }
              resolve(result);
            });
          });
        });

        await Promise.all(cloudinary_Delete_Promises); // Wait for all deletions to complete
      }

      // delete
      const result = await Speciality.deleteMany({
        _id: { $in: speciality_Ids },
      });

      res.status(200).json({
        message: "Speciality deleted",
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  getSpecData = async (req, res) => {
    try {
      const speciality_Id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(speciality_Id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Speciality ID format" });
      }
      const specData = await Speciality.findById(speciality_Id);
      res.json({ success: true, specData });
    } catch (error) {
      console.log(error);
      res.json({ success: false, message: error.message });
    }
  };

  getDoctorsCountPerSpeciality = async (req, res) => {
    try {
      const result = await Doctor.aggregate([
        {
          $group: {
            _id: "$speciality_id",
            doctorCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "specialities",
            localField: "_id",
            foreignField: "_id",
            as: "specialityDetails",
          },
        },
        {
          $unwind: "$specialityDetails",
        },
        {
          $match: {
            "specialityDetails.is_deleted": false,
          },
        },
        {
          $project: {
            _id: 0,
            speciality: "$specialityDetails.name",
            doctorCount: 1,
          },
        },
        {
          $sort: { doctorCount: -1 },
        },
        {
          $limit: 5,
        },
      ]);

      if (!result.length) {
        return res
          .status(404)
          .json({ message: "No specialties with doctors found." });
      }

      return res.status(200).json({ data: result });
    } catch (err) {
      console.error("Error :", err);
      return res.status(500).json({
        error: "An error occurred .",
      });
    }
  };
}

module.exports = new speciality_Controller();
