const appointment_Controller = require("../app/controllers/appointment_Controller")
const require_Auth = require("../middleware/require_Auth")

const express = require("express")
const router = express.Router()

router.post("/add-appointment", appointment_Controller.add_Appointment)
router.post("/update-appointment-info/:id", appointment_Controller.update_Appointment_Info)
router.post("/update-appointment-date/:id", appointment_Controller.change_Appointment_Time)
router.post("/cancel-appointment/:id", appointment_Controller.cancel_Appointment)
router.post("/add-insurance/:id", appointment_Controller.add_Insurance)
router.post("/del-insurance", appointment_Controller.delete_Insurance)
router.post("/update-insurance", appointment_Controller.update_Insurance)
router.post("/get-all-appointment", appointment_Controller.get_All_Appointment)
router.post("/get-appointment-by-userid/:id", appointment_Controller.get_Appointment_By_User_Id)
router.get("/get-appointment-insr/:id", appointment_Controller.get_Appointment_Insurance)
router.post("/soft-delete-appointment/:id", appointment_Controller.soft_Delete_Appointment)
router.post("/restore-appointment/:id", appointment_Controller.restore_Appointment)
router.post("/get-appointment-by-doctor/:id", appointment_Controller.get_Appointments_By_Doctor)

router.get("/get-appointment-by-month", appointment_Controller.getAppointmentCountByMonth)

router.get("/get-appointment-info/:id", appointment_Controller.getAppointmentInfo)

router.get("/get-user-appointments/:id", appointment_Controller.getAllUserAppointments)

module.exports = router
