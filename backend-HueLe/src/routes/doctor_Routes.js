const doctor_Controller = require("../app/controllers/doctor_Controller")
const require_Auth = require("../middleware/require_Auth")

const express = require("express")
const router = express.Router()
const { uploadPDF } = require("../middleware/multer")

router.post("/update-doc-info/:id", doctor_Controller.update_Doctor_Info)
router.post("/upload-proof/:id", uploadPDF.single("proof"), (req, res) => {
    // Log để xác minh middleware đúng được gọi
    console.log("Middleware uploadPDF được kích hoạt")
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded or invalid file type" })
    }
    doctor_Controller.upload_Doctor_Proof(req, res)
})
router.get("/active-hour-list/:id", doctor_Controller.get_Doctor_Active_Hour_List)
router.post("/add-active-hour/:id", doctor_Controller.add_Doctor_Active_Hour)
router.post("/update-active-hour/:id", doctor_Controller.update_Doctor_Active_Hour)
router.post("/delete-active-hour/:id", doctor_Controller.delete_Doctor_Active_Hour)
router.post("/filter-doctor-list", doctor_Controller.get_Filtered_Doctor_List)
router.post("/change-doc-verified-status", doctor_Controller.change_Doctor_Verified_Status)
router.post("/search-doc-name", doctor_Controller.search_Doctor_By_Name)
router.get("/get-doctor-profile", require_Auth.Auth_Doctor, doctor_Controller.doctorProfile)
router.get("/top-doctor", doctor_Controller.getTopDoctors)

router.post("/stat-doctor", doctor_Controller.getDoctorStat)
router.post("/filter-doctor-list-main", doctor_Controller.get_Filtered_Doctor_List_Main_Info_Only)

module.exports = router
