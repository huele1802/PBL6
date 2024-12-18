const post_Controller = require('../app/controllers/post_Controller')
const require_Auth = require('../middleware/require_Auth')

const express = require('express')
const router = express.Router()

router.post(
    '/create-post', 
    post_Controller.add_Post
)
router.get(
    '/get-post/:id', 
    post_Controller.get_Post
)
router.get(
    '/get-all-post', 
    post_Controller.get_All_Post
)
router.post(
    '/get-all-post-by-user', 
    require_Auth.Auth_Doctor, 
    post_Controller.get_all_Post_By_Email
)
router.post(
    '/get-all-post-by-speciality', 
    post_Controller.get_all_Post_by_Speciality
)
router.post(
    '/update-post/:id', 
    post_Controller.update_Post
)
router.post(
    '/soft-del-post/:id', 
    post_Controller.soft_Delete_Post
)
router.post(
    '/restore-post/:id', 
    post_Controller.restore_Post
)
router.post(
    '/perma-del-post/:id', 
    post_Controller.perma_Delete_Post
)
router.post(
    '/add-comment/:id', 
    post_Controller.add_Comment
)
router.post(
    '/:post_id/comment/:comment_id/update', 
    post_Controller.update_Comment
)
router.post(
    '/:post_id/comment/:comment_id/del', 
    post_Controller.del_Comment
)
router.post(
    '/search-post', 
    post_Controller.search_Post_By_Title_and_Content
)
router.get(
    '/get-top-post', 
    post_Controller.getTop5MostCommentedPosts
)
router.get(
    '/get-top-user-comment', 
    post_Controller.getUserWithMostComments
)



module.exports = router