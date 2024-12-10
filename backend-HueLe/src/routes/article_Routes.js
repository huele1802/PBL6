const article_Controller = require('../app/controllers/article_Controller')
const require_Auth = require('../middleware/require_Auth')

const { upload_image } = require('../middleware/multer')

const express = require('express')
const router = express.Router()

router.post(
    '/create-article', 
    upload_image.single('article_image'), 
    article_Controller.add_Article
)
router.get('/get-article/:id', article_Controller.get_Article)
router.post('/get-all-article', article_Controller.get_All_Article)
router.post('/get-all-article-by-doctor', article_Controller.get_all_Article_By_Email)
router.post('/get-all-article-by-speciality', article_Controller.get_all_Article_by_Doctor_Speciality)
router.post(
    '/update-article/:id',
    upload_image.single('article_image'), 
    article_Controller.update_Article)
router.post('/soft-del-article', article_Controller.soft_Delete_Article)
router.post('/restore-article', article_Controller.restore_Article)
router.post('/perma-del-article', article_Controller.perma_Delete_Article)
router.post('/search-article', article_Controller.search_Article_By_Title_and_Content)
router.post('/get-article-by-month', article_Controller.getArticlesByMonth)
router.get('/get-article-by-speciality', article_Controller.getTop5ArticleBySpeciality)

module.exports = router