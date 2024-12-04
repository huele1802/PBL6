const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Region = require("../models/Region");
const Speciality = require("../models/Speciality");
const Appointment = require("../models/Appointment");
const cloudinary = require("../utils/cloudinary");

const fs = require("fs");
const path = require('path')
// const crypto = require('crypto')
const multer = require("multer");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

require("dotenv").config();

// const default_profile_img = process.env.DEFAULT_PROFILE_IMG
const storage = multer.memoryStorage();

const upload_pdf = multer({
  storage: storage,
  fileFilter: (res, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
}).single("proof");

// const upload_img = multer({
//     storage: storage,
//     fileFilter: (res, file, cb) =>{
//         if(file.mimetype === 'image/jpeg'){
//             cb(null, true)
//         }else{
//             cb(new Error('Only JPG image files are allowed'))
//         }
//     }
// }).single('profile_image')

const upload_Promise_pdf = promisify(upload_pdf);
// const upload_Promise_img = promisify(upload_img)

class account_Controller {
  create_Token = (_id, expiresIn = "1d") => {
    return jwt.sign({ _id }, process.env.JWTSecret, { expiresIn });
  };

  acc_Login = async (req, res) => {
    // get info from body
    const { email, password } = req.body;
    console.log(req.headers["content-type"]);
    // get account
    try {
      let acc;
      acc = await User.login(email, password);

      if (acc.is_deleted) {
        // console.log("Login failed. Account has been soft-deleted: ", email);
        return res.status(403).json({
          error:
            "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.",
        });
      }

      const token = this.create_Token(acc._id);
      const role = acc.role;

      if (acc instanceof Doctor) {
        const verified = acc.verified;
        res.status(200).json({ email, token, role, verified });
      } else {
        res.status(200).json({ email, token, role });
      }
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  acc_Signup = async (req, res) => {
    try {
      if (req.fileValidationError) {
        return res.status(400).json({ error: req.fileValidationError });
      }
      // get info from body
      const { email, password, username, phone, is_doc } = req.body;
      const role = "user";
      let acc;

      // add account
      if (is_doc == "1") {
        let proof = null;
        if (req.file) {
          // Upload file to Cloudinary
          const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: "PBL6/proofs",
            overwrite: true,
          });

          // Extract proof URL and delete temporary file
          proof = uploadResult.secure_url;

          try {
            await fs.promises.unlink(req.file.path);
          } catch (err) {
            console.error("Failed to delete temp file: ", err.message);
          }
        }

        acc = await Doctor.add_Doctor(email, password, username, phone, proof);
      } else {
        // console.log('not doc')
        acc = await User.add_User(email, password, username, phone);
      }
      // create token and respone
      const token = this.create_Token(acc._id);
      res.status(201).json({ email, token, role });
    } catch (error) {
      //if user account
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  get_Account_List = async (req, res) => {
    try {
      let accounts, query;
      const { user, hidden_state, verified } = req.body;

      query = { is_deleted: hidden_state };

      if (user === true) {
        // Handle users

        query.__t = { $ne: "Doctor" };

        accounts = await User.find(query);
      } else {
        // Handle doctors
        query = { is_deleted: hidden_state };

        if (verified !== undefined) {
          query.verified = verified;
        }

        accounts = await Doctor.find(query)
          .populate("speciality_id", "name")
          .populate("region_id", "name");
      }

      // const accounts_With_Png_Images = accounts.map((account) => {
      //     const accountObject = account.toObject() // Convert Mongoose document to plain object

      //     if (accountObject.profile_image && Buffer.isBuffer(accountObject.profile_image)) {
      //         // Convert buffer to base64 string
      //         accountObject.profile_image = `data:image/png;base64,${accountObject.profile_image.toString('base64')}`
      //     }

      //     return accountObject
      // })

      res.status(200).json(accounts);
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  get_Account_By_Mail = async (req, res) => {
    try {
      // get id
      const { email } = req.body;

      let account = await User.findOne({ email })
        .populate("speciality_id", "name")
        .populate("region_id", "name");

      // const accountObject = account.toObject()

      // // Convert profile image buffer to base64 if it exists
      // if (accountObject.profile_image && Buffer.isBuffer(accountObject.profile_image)) {
      //     accountObject.profile_image = `data:image/png;base64,${accountObject.profile_image.toString('base64')}`
      // }

      res.status(200).json(account);
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  get_Account_By_Id = async (req, res) => {
    try {
      // get id
      const account_Id = req.params.id;

      let account = await User.findById(account_Id)
        .populate("speciality_id", "name")
        .populate("region_id", "name");

      // const accountObject = account.toObject()

      // // Convert profile image buffer to base64 if it exists
      // if (accountObject.profile_image && Buffer.isBuffer(accountObject.profile_image)) {
      //     accountObject.profile_image = `data:image/png;base64,${accountObject.profile_image.toString('base64')}`
      // }

      res.status(200).json(account);
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  update_Acc_Info = async (req, res) => {
    try {
      // get info from body
      const { username, phone, underlying_condition, date_of_birth, address } =
        req.body;

      // get id
      const account_Id = req.params.id;

      // find account
      let account = await User.findById(account_Id);

      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      if (req.fileValidationError) {
        return res.status(400).json({ error: req.fileValidationError });
      }

      let profile_image = account.profile_image;

      if (req.file) {
        const image_name = `${account_Id}_${Date.now()}`;

        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "PBL6/profiles",
          public_id: account_Id,
          overwrite: true, // Replace any existing file with the same name
        });

        profile_image = uploadResult.secure_url;
        fs.unlinkSync(req.file.path); // Delete temporary file
      }

      // update
      if (username) {
        account.username = username;
      }
      if (phone) {
        account.phone = phone;
      }
      if (underlying_condition) {
        account.underlying_condition = underlying_condition;
      }
      if (date_of_birth) {
        account.date_of_birth = date_of_birth;
      }
      if (address) {
        account.address = address;
      }
      account.profile_image = profile_image;

      await account.save();

      res.status(200).json(account);
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  soft_Delete_Account = async (req, res) => {
    try {
      // get id list
      const { account_Ids } = req.body;

      // if no ids
      if (
        !account_Ids ||
        !Array.isArray(account_Ids) ||
        account_Ids.length === 0
      ) {
        return res.status(400).json({ error: "No IDs provided" });
      }

      // update
      const result = await User.updateMany(
        { _id: { $in: account_Ids } },
        { is_deleted: true }
      );

      res.status(200).json({
        message: "Account soft deleted",
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  restore_Deleted_Account = async (req, res) => {
    try {
      // get id list
      const { account_Ids } = req.body;

      // if no ids
      if (
        !account_Ids ||
        !Array.isArray(account_Ids) ||
        account_Ids.length === 0
      ) {
        return res.status(400).json({ error: "No IDs provided" });
      }

      // update
      const result = await User.updateMany(
        { _id: { $in: account_Ids } },
        { is_deleted: false }
      );

      res.status(200).json({
        message: "Account restored",
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  perma_Delete_Account = async (req, res) => {
    try {
      // get id list
      const { account_Ids } = req.body;

      // if no ids
      if (
        !account_Ids ||
        !Array.isArray(account_Ids) ||
        account_Ids.length === 0
      ) {
        return res.status(400).json({ error: "No IDs provided" });
      }

      // Find the accounts to delete and retrieve their profile image public_ids
      const accounts = await User.find(
        { _id: { $in: account_Ids } },
        "profile_image"
      );

      // Prepare an array of public_ids to delete from Cloudinary
      const public_Ids = accounts
        .map((account) => {
          const image_Url = account.profile_image;

          if (!image_Url) return null;

          const public_Id = image_Url
            .split("/")
            .slice(-3)
            .join("/")
            .replace(/\.\w+$/, ""); // Extract public_id from URL

          return public_Id;
        })
        .filter((public_Id) => public_Id);

      const public_Proofs = accounts
        .map((account) => {
          const image_Url = account.proof;

          if (!image_Url) return null;

          const public_Id = image_Url
            .split("/")
            .slice(-3)
            .join("/")
            .replace(/\.\w+$/, ""); // Extract public_id from URL

          return public_Id;
        })
        .filter((public_Id) => public_Id);

      // Delete images from Cloudinary
      if (public_Ids.length > 0) {
        const cloudinary_Delete_Promises = public_Ids.map((public_Id) => {
          return new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(public_Id, (error, result) => {
              if (error) return reject(error);
              resolve(result);
            });
          });
        });

        await Promise.all(cloudinary_Delete_Promises); // Wait for all deletions to complete
      }

      if (public_Proofs.length > 0) {
        const cloudinary_Delete_Promises = public_Proofs.map((public_Id) => {
          return new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(public_Id, (error, result) => {
              if (error) return reject(error);
              resolve(result);
            });
          });
        });

        await Promise.all(cloudinary_Delete_Promises); // Wait for all deletions to complete
      }

      // delete
      const result = await User.deleteMany({ _id: { $in: account_Ids } });

      res.status(200).json({
        message: "Account deleted",
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  // forgot_password = async (req, res) => {
  //   try {
  //     const { email } = req.body;
  //     const account = await User.findOne({ email });

  //     if (!account) {
  //       return res.status(404).json({ error: "Account not found" });
  //     }

  //     // Generate a reset token
  //     const reset_Token = this.create_Token(account._id, "10m");

  //     const transporter = nodemailer.createTransport({
  //       service: process.env.EMAIL_HOST,
  //       auth: {
  //         user: process.env.EMAIL_USER,
  //         pass: process.env.EMAIL_PASS,
  //       },
  //     });

  //     const reset_URL = `${req.protocol}://${req.get(
  //       "host"
  //     )}/acc/reset-password/${reset_Token}`;
  //     const mail_Options = {
  //       from: process.env.EMAIL,
  //       to: email,
  //       subject: "Password Reset",
  //       html: `
  //                       <p>Please click on the following link to reset your password:</p>
  //                       <a href="${reset_URL}">Reset Password</a>
  //                       <p>This link will expire in 10 minutes</p>
  //                   `,
  //     };

  //     await transporter.sendMail(mail_Options);

  //     res
  //       .status(200)
  //       .json({ message: "Password reset link sent to your email" });
  //   } catch (error) {
  //     console.log(error.message);
  //     res.status(500).json({ error: error.message });
  //   }
  // };

  // reset_password = async (req, res) => {
  //   try {
  //     const token = req.params.token;

  //     // Verify the token
  //     const decoded = jwt.verify(token, process.env.JWTSecret);
  //     const user = await User.findById(decoded._id);

  //     if (!user) {
  //       return res.status(400).json({ error: "Invalid or expired token" });
  //     }

  //     const updated_user = await User.change_pass(
  //       user.email,
  //       process.env.DEFAULT_PASS,
  //       true
  //     );

  //     res.status(200).json({
  //       message: "Password changed successfully",
  //     });
  //   } catch (error) {
  //     if (error.name === "TokenExpiredError") {
  //       return res.status(400).json({
  //         error: "Token has expired. Please request a new password reset.",
  //       });
  //     }
  //     res.status(400).json({ error: error.message });
  //   }
  // };

  forgot_password = async (req, res) => {
    try {
      const { email } = req.body;
      const account = await User.findOne({ email });

      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      // Generate a reset token
      const reset_Token = this.create_Token(account._id, "10m");

      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_HOST,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const reset_URL = `${req.protocol}://${req.get(
        "host"
      )}/acc/reset-password/${reset_Token}`;
      const mail_Options = {
        from: process.env.EMAIL,
        to: email,
        subject: "Password Reset",
        html: `
                    <p>Please click on the following link to reset your password:</p>
                    <a href="${reset_URL}">Reset Password</a>
                    <p>This link will expire in 10 minutes</p>
                `,
      };

      await transporter.sendMail(mail_Options);

      res
        .status(200)
        .json({ message: "Password reset link sent to your email" });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: error.message });
    }
  };

  reset_password = async (req, res) => {
    try {
      const token = req.params.token;

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWTSecret);
      const user = await User.findById(decoded._id);

      if (!user) {
        throw new Error("Invalid or expired token");
      }

      const updated_user = await User.change_pass(
        user.email,
        process.env.DEFAULT_PASS,
        true
      );

      res.sendFile(
        path.join(
          __dirname,
          "../utils/landing_html",
          "reset-password-success.html"
        )
      );
    } catch (error) {
      const errorMessage =
        error.name === "TokenExpiredError"
          ? "Đường dẫn xác nhận đã hết hạn. Xin thử lại đường dẫn mới sau."
          : "Đã xảy ra sự cố. Xin thử lại sau.";

      // Read the error HTML file
      const filePath = path.join(
        __dirname,
        "../utils/landing_html/reset-password-error.html"
      );
      fs.readFile(filePath, "utf-8", (err, html) => {
        if (err) {
          return res.status(500).send("Server error");
        }

        // Replace the placeholder in the HTML with the error message
        const updatedHtml = html.replace("{{ERROR_MESSAGE}}", errorMessage);

        // Send the updated HTML
        res.send(updatedHtml);
      });
    }
  };

  change_password = async (req, res) => {
    try {
      // const {email} = req.user
      const { email, new_password } = req.body;
      const user = await User.change_pass(email, new_password);

      console.log(user);
      res.status(200).json({ email, user });
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  update_Doctor_Info = async (req, res) => {
    try {
      // get info from body
      const { speciality, region, bio } = req.body;

      // get id
      const account_Id = req.params.id;

      // find account
      let account = await Doctor.findById(account_Id);

      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      // update
      if (speciality) {
        const speciality_id = await Speciality.findOne(
          { name: speciality },
          { _id: 1 }
        );
        account.speciality_id = speciality_id._id;
      }

      if (region) {
        const region_id = await Region.findOne({ name: region }, { _id: 1 });
        account.region_id = region_id._id;
      }

      if (bio) {
        account.bio = bio;
      }

      await account.save();

      account = await Doctor.findById(account_Id)
        .populate("speciality_id", "name")
        .populate("region_id", "name");

      res.status(200).json(account);
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  upload_Doctor_Proof = async (req, res) => {
    try {
      // Check if file exists
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const account_Id = req.params.id;
      const pdf_name = `${account_Id}_${Date.now()}`;

      // Upload file to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "PBL6/proofs",
        public_id: account_Id,
        overwrite: true,
      });

      // Extract proof URL and delete temporary file
      const proof = uploadResult.secure_url;
      try {
        await fs.promises.unlink(req.file.path);
      } catch (err) {
        console.error("Failed to delete temp file: ", err.message);
      }

      // Update database
      const account = await Doctor.findByIdAndUpdate(
        account_Id,
        { proof },
        { new: true }
      );

      if (!account) {
        return res.status(404).json({ error: "Doctor not found" });
      }

      res.status(200).json(account);
    } catch (error) {
      console.error("Error: ", error.message);
      res.status(500).json({ error: error.message });
    }
  };

  get_Doctor_Active_Hour_List = async (req, res) => {
    try {
      // get id
      const account_Id = req.params.id;

      // find doctor
      const doctor = await Doctor.findById(account_Id);

      // find doctor existing appointments
      const appointments = await Appointment.aggregate([
        {
          // by the same doctor
          $match: { doctor_id: new mongoose.Types.ObjectId(account_Id) },
        },
        {
          // group up appointments with similar appointment date, start and end time as one
          // count the sum of similar appointments forming each group
          $group: {
            _id: {
              appointment_day: "$appointment_day",
              appointment_time_start: "$appointment_time_start",
              appointment_time_end: "$appointment_time_end",
            },
            count: { $sum: 1 },
          },
        },
      ]);

      // time that are fully booked
      let fully_Booked_Hour = [];

      // time that are not fully booked
      let booked_Hour = [];

      // go through each appointment
      doctor.active_hours.forEach((active_Hour) => {
        // go through each active hour
        appointments.forEach((appointment) => {
          // day format: Day-of-Week specific-date
          const day_Of_Week = appointment._id.appointment_day.split(" ")[0];
          if (
            active_Hour.day === day_Of_Week &&
            active_Hour.start_time === appointment._id.appointment_time_start &&
            active_Hour.end_time === appointment._id.appointment_time_end &&
            appointment.count >= active_Hour.appointment_limit
          ) {
            fully_Booked_Hour.push({
              date: appointment._id.appointment_day,
              start_time: active_Hour.start_time,
              end_time: active_Hour.end_time,
              appointment_count: appointment.count,
              appointment_limit: active_Hour.appointment_limit,
            });
          } else if (
            active_Hour.day === day_Of_Week &&
            active_Hour.start_time === appointment._id.appointment_time_start &&
            active_Hour.end_time === appointment._id.appointment_time_end &&
            appointment.count < active_Hour.appointment_limit
          ) {
            booked_Hour.push({
              date: appointment._id.appointment_day,
              start_time: active_Hour.start_time,
              end_time: active_Hour.end_time,
              appointment_count: appointment.count,
              appointment_limit: active_Hour.appointment_limit,
            });
          }
        });
      });

      res.status(201).json({
        active_hours: doctor.active_hours,
        booked: booked_Hour,
        fully_booked: fully_Booked_Hour,
      });
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  add_Doctor_Active_Hour = async (req, res) => {
    try {
      const { day, start_time, end_time, hour_type, appointment_limit } =
        req.body;

      if (
        !day ||
        !start_time ||
        !end_time ||
        !hour_type ||
        !appointment_limit
      ) {
        throw new Error("Missing information");
      }

      // get id
      const account_Id = req.params.id;

      // check overlap
      const new_Active_Hour = {
        day,
        start_time,
        end_time,
        hour_type,
        appointment_limit,
      };

      const is_overlap = await Doctor.Is_Time_Overlap(
        new_Active_Hour,
        account_Id
      );

      if (is_overlap) {
        throw new Error("Overlapping time frame");
      }

      // add
      const doctor = await Doctor.findByIdAndUpdate(
        account_Id,
        { $push: { active_hours: new_Active_Hour } },
        { new: true }
      );

      res.status(201).json(doctor.active_hours);
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  update_Doctor_Active_Hour = async (req, res) => {
    try {
      const {
        day,
        start_time,
        end_time,
        hour_type,
        appointment_limit,
        old_day,
        old_start_time,
        old_end_time,
        old_hour_type,
      } = req.body;

      if (!day || !start_time || !end_time || !hour_type) {
        throw new Error("Missing information");
      }

      // get id
      const account_Id = req.params.id;

      // check overlap
      const excluded_time = {
        day: old_day,
        start_time: old_start_time,
        end_time: old_end_time,
        hour_type: old_hour_type,
      };
      const new_Active_Hour = {
        day,
        start_time,
        end_time,
        hour_type,
        appointment_limit,
      };

      const is_overlap = await Doctor.Is_Time_Overlap(
        new_Active_Hour,
        account_Id,
        excluded_time
      );

      if (is_overlap) {
        throw new Error("Overlapping time frame");
      }

      // find doctor
      const doctor = await Doctor.findById(account_Id);

      // find old active hour
      const index = doctor.active_hours.findIndex(
        (time_frame) =>
          time_frame.day === old_day &&
          time_frame.start_time === old_start_time &&
          time_frame.end_time === old_end_time &&
          time_frame.hour_type === old_hour_type
      );

      // update
      doctor.active_hours[index] = new_Active_Hour;

      await doctor.save();

      res.status(200).json({
        change: doctor.active_hours[index],
        active_hours: doctor.active_hours,
      });
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  delete_Doctor_Active_Hour = async (req, res) => {
    try {
      const { day, start_time, end_time, hour_type } = req.body;

      if (!day || !start_time || !end_time || !hour_type) {
        throw new Error("Missing information");
      }

      // get id
      const account_Id = req.params.id;

      // find doctor
      const doctor = await Doctor.findById(account_Id);

      // find old active hour
      const index = doctor.active_hours.findIndex(
        (time_frame) =>
          time_frame.day === day &&
          time_frame.start_time === start_time &&
          time_frame.end_time === end_time &&
          time_frame.hour_type === hour_type
      );

      //delete
      doctor.active_hours.splice(index, 1);
      await doctor.save();

      res.status(200).json({
        message: "Item deleted succesfully",
        active_hours: doctor.active_hours,
      });
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  get_Filtered_Doctor_List = async (req, res) => {
    try {
      const { speciality, region } = req.body;

      let query = {};

      if (speciality) {
        const speciality_id = await Speciality.findOne(
          { name: speciality },
          { _id: 1 }
        );
        query.speciality_id = speciality_id._id;
      }

      if (region) {
        const region_id = await Region.findOne({ name: region }, { _id: 1 });
        query.region_id = region_id._id;
      }

      const doctors = await Doctor.find(query)
        .populate("speciality_id", "name")
        .populate("region_id", "name");

      res.status(200).json(doctors);
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  change_Doctor_Verified_Status = async (req, res) => {
    try {
      const { email, verified } = req.body;

      const doctor = await Doctor.findOneAndUpdate(
        { email },
        { verified },
        { new: true }
      )
        .populate("speciality_id", "name")
        .populate("region_id", "name");

      res.status(200).json(doctor);
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  change_Account_Role = async (req, res) => {
    try {
      const { email, role } = req.body;

      const account = await User.findOneAndUpdate(
        { email },
        { role },
        { new: true }
      )
        .populate("speciality_id", "name")
        .populate("region_id", "name");

      res.status(200).json(account);
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  search_Doctor_By_Name = async (req, res) => {
    try {
      const { name } = req.body;

      const doctors = await Doctor.find({
        name: { $regex: name, $options: "i" },
      })
        .populate("speciality_id", "name")
        .populate("region_id", "name");

      res.status(200).json(doctors);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  getProfileAdmin = async (req, res) => {
    try {
      const adminEmail = req.user;
      const adminData = await User.findOne({ email: adminEmail }).select(
        "-password"
      );

      if (!adminData) {
        return res.status(404).json({ error: "Admin profile not found" });
      }

      res.json({ success: true, adminData });
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };

  doctorProfile = async (req, res) => {
    try {
      const doctorEmail = req.user;

      const profileData = await Doctor.findOne({ email: doctorEmail })
        .select("-password")
        .populate("speciality_id", "name")
        .populate("region_id", "name");

      if (!profileData) {
        return res
          .status(404)
          .json({ success: false, message: "Doctor not found" });
      }

      res.json({ success: true, profileData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };

  getTopDoctors = async (req, res) => {
    try {
      const result = await Appointment.aggregate([
        {
          $group: {
            _id: "$doctor_id", // Group by doctor_id
            appointmentCount: { $sum: 1 }, // Count the appointments
          },
        },
        {
          $sort: { appointmentCount: -1 },
        },
        {
          $limit: 5,
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "doctorDetails",
          },
        },
        {
          $project: {
            doctorId: "$_id",
            appointmentCount: 1,
            doctorDetails: { $arrayElemAt: ["$doctorDetails", 0] },
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({ message: "No appointments found." });
      }

      return res.status(200).json({ data: result });
    } catch (err) {
      console.error("Error:", err);
      return res.status(500).json({
        error: "An error occurred.",
      });
    }
  };
}

module.exports = new account_Controller();
