const client_Controller = require("../app/controllers/client_Controller")
const require_Auth = require("../middleware/require_Auth")

const express = require("express")
const router = express.Router()

router.post("/add-client", require_Auth.Auth_Admin, client_Controller.add_Client)
router.post("/add-insurance/:id", client_Controller.add_Insurance)
router.post("/del-insurance", client_Controller.delete_Insurance)
router.post("/update-insurance", client_Controller.update_Insurance)
router.get("/get-all-client", client_Controller.get_All_Client)
router.get("/get-client-by-userid/:id", client_Controller.get_Client_By_User_Id)
router.post("/soft-delete-client/:id", client_Controller.soft_Delete_Client)
router.post("/restore-client/:id", client_Controller.restore_Client)
router.post("/perma-delete-client/:id", client_Controller.perma_Delete_Client)
router.get("/get-client-appointment/:id", client_Controller.get_Client_Appointment)
router.get("/get-client-insr/:id", client_Controller.get_Client_Insurance)

module.exports = router
