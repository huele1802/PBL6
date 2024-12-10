const speciality_Controller = require('../app/controllers/speciality_Controller')
const {upload_image} = require('../middleware/multer')

const express = require('express')
const router = express.Router()

router.post('/get-speciality-list', speciality_Controller.get_Speciality_List)
router.get('/get-speciality/:id', speciality_Controller.get_Speciality_By_ID)
router.post(
    '/add-speciality',
    upload_image.single('speciality_image'), 
    speciality_Controller.add_Speciality
)
router.post(
    '/update-speciality/:id', 
    upload_image.single('speciality_image'),  
    speciality_Controller.update_Speciality
)
router.post(
    '/soft-delete-speciality',
    speciality_Controller.soft_Delete_Specialty
)
router.post('/delete-speciality', speciality_Controller.perma_Delete_Specialty)
router.post(
    '/restore-speciality',
    speciality_Controller.restore_Deleted_Specialty
)
router.get('/get-spec/:id', speciality_Controller.getSpecData)

router.get(
    '/get-doc-count',
    speciality_Controller.getDoctorsCountPerSpeciality
)

module.exports = router