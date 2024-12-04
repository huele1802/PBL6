const account_Controller = require("../app/controllers/account_Controller");
const require_Auth = require("../middleware/require_Auth");

const jwt = require("jsonwebtoken");

const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer().none();
const { upload_image, uploadPDF } = require("../middleware/multer");

router.post("/login", account_Controller.acc_Login);
router.post("/signup", uploadPDF.single("proof"), account_Controller.acc_Signup);
router.post("/acc-list", account_Controller.get_Account_List);
router.post("/get-acc-mail", account_Controller.get_Account_By_Mail);
router.post("/get-acc/:id", account_Controller.get_Account_By_Id);
router.post(
  "/update-acc-info/:id",
  upload_image.single("profile_image"),
  account_Controller.update_Acc_Info
);
router.post("/soft-delete-acc", account_Controller.soft_Delete_Account);
router.post("/perma-delete-acc", account_Controller.perma_Delete_Account);
router.post("/restore-acc", account_Controller.restore_Deleted_Account);
router.post("/change-pass", account_Controller.change_password);
router.post(
  "/update-doc-info/:id",
  upload,
  account_Controller.update_Doctor_Info
);
router.post("/upload-proof/:id", uploadPDF.single("proof"), (req, res) => {
  // Log để xác minh middleware đúng được gọi
  console.log("Middleware uploadPDF được kích hoạt");
  if (!req.file) {
    return res
      .status(400)
      .json({ error: "No file uploaded or invalid file type" });
  }
  account_Controller.upload_Doctor_Proof(req, res);
});

router.get(
  "/active-hour-list/:id",
  account_Controller.get_Doctor_Active_Hour_List
);
router.post("/add-active-hour/:id", account_Controller.add_Doctor_Active_Hour);
router.post(
  "/update-active-hour/:id",
  account_Controller.update_Doctor_Active_Hour
);
router.post(
  "/delete-active-hour/:id",
  account_Controller.delete_Doctor_Active_Hour
);
router.post("/filter-doctor-list", account_Controller.get_Filtered_Doctor_List);
router.post(
  "/change-doc-verified-status",
  account_Controller.change_Doctor_Verified_Status
);
router.post("/change-acc-role", account_Controller.change_Account_Role);
router.post("/forgot-pass", account_Controller.forgot_password);
router.get("/reset-password/:token", account_Controller.reset_password);
router.post("/search-doc-name", account_Controller.search_Doctor_By_Name);
router.get(
  "/get-admin-profile",
  require_Auth.Auth_Admin,
  account_Controller.getProfileAdmin
);
router.get(
  "/get-doctor-profile",
  require_Auth.Auth_Doctor,
  account_Controller.doctorProfile
);

router.get("/top-doctor", account_Controller.getTopDoctors);

module.exports = router;
