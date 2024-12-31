const account_Controller = require("../app/controllers/account_Controller")
const require_Auth = require("../middleware/require_Auth")

const express = require("express")
const router = express.Router()
const { upload_image, uploadPDF } = require("../middleware/multer")

router.post("/login", account_Controller.acc_Login)
router.post("/signup", uploadPDF.single("proof"), account_Controller.acc_Signup)
router.post("/acc-list", account_Controller.get_Account_List)
router.post("/get-acc-mail", account_Controller.get_Account_By_Mail)
router.post("/get-acc/:id", account_Controller.get_Account_By_Id)
router.post(
    "/update-acc-info/:id",
    upload_image.single("profile_image"),
    account_Controller.update_Acc_Info
)
router.post("/soft-delete-acc", account_Controller.soft_Delete_Account)
router.post("/perma-delete-acc", account_Controller.perma_Delete_Account)
router.post("/restore-acc", account_Controller.restore_Deleted_Account)
router.post("/change-pass", account_Controller.change_password)
router.post("/forgot-pass", account_Controller.forgot_password)
router.get("/reset-password/:token", account_Controller.reset_password)
router.get("/get-admin-profile", require_Auth.Auth_Admin, account_Controller.getProfileAdmin)
router.get("/top-users", account_Controller.getTopUsers)
router.get("/confirm-acc/:token", account_Controller.confirm_Account)
router.get("/get-user-profile", require_Auth.Auth_User, account_Controller.userProfile)

module.exports = router
