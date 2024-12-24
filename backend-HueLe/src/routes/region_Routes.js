const region_Controller = require("../app/controllers/region_Controller")

const express = require("express")
const router = express.Router()

router.post("/get-region-list", region_Controller.get_Region_List)
router.post("/add-region", region_Controller.add_Region)
router.post("/update-region/:id", region_Controller.update_Region)
router.post("/soft-delete-region", region_Controller.soft_Delete_Region)
router.post("/delete-region", region_Controller.perma_Delete_Region)
router.post("/restore-region", region_Controller.restore_Deleted_Region)
router.post("/get-region", region_Controller.get_Region)
router.get("/region-doctor", region_Controller.countDoctorsByRegion)

router.get("/region-appointment", region_Controller.countAppointmentsByDoctorWithDetails)

module.exports = router
