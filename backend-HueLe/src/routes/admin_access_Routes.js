const admin_access_Controller = require("../app/controllers/admin_access_Controller")
const require_Auth = require("../middleware/require_Auth")

const express = require("express")
const router = express.Router()

router.post("/add-admin", require_Auth.Auth_Admin, admin_access_Controller.add_Admin)
router.post("/update-access", require_Auth.Auth_Admin, admin_access_Controller.update_Access)
router.post("/del-admin", require_Auth.Auth_Admin, admin_access_Controller.remove_Admin)
router.get("/list-admin", require_Auth.Auth_Admin, admin_access_Controller.admin_List)
router.get("/detail-admin/:id", require_Auth.Auth_Admin, admin_access_Controller.admin_Detail)

module.exports = router
