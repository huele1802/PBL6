const Post = require('../models/Post')
const Speciality = require('../models/Speciality')
const User = require('../models/User')

class post_Controller{
    add_Post = async(req, res) =>{
        try{
            const {email, post_title, post_content, speciality_name} = req.body

            const account = await User.findOne({email}, {_id: 1})
            if (!account){
                return res.status(404).json({error: 'Account not found'})
            }

            const speciality = await Speciality.findOne({name: speciality_name}, {_id: 1})
            if (!speciality) {
                return res.status(404).json({error: 'Speciality not found'})
            }

            const post = await Post.create({
                user_id: account._id, 
                speciality_id: speciality.id, 
                post_title, 
                post_content
            })
            .populate('user_id', 'email username __t profile_image')
            .populate('speciality_id', 'name')

            res.status(200).json(post)
        }catch(error){
            res.status(400).json({error: error.message})
        }
    }

    get_Post = async(req, res) =>{
        try{
            const post_id = req.params.id

            const post = await Post.findById(post_id)
                .populate('user_id', 'email username __t profile_image')
                .populate('speciality_id', 'name')
                .populate('post_comments.replier', 'email username __t profile_image')

            res.status(200).json(post)
        }catch(error){
            res.status(400).json({error: error.message})
        }
    }

    get_all_Post_By_Email = async(req, res) =>{
        try{
            const {email} = req.body
            const user = await User.findOne({email}, {_id: 1})
                .populate('user_id', 'email username __t profile_image')
                .populate('speciality_id', 'name')
                .populate('post_comments.replier', 'email username __t profile_image')
            
            const posts = await Post.find({user_id: user._id})

            res.status(200).json(posts)
        }catch(error){
            res.status(400).json({error: error.message})
        }
    }

    get_all_Post_by_Speciality = async(req, res) =>{
        try{
            const {speciality_name} = req.body
           
     
            const speciality = await Speciality.findOne({name: speciality_name}, {_id: 1})
            if (!speciality) {
                return res.status(404).json({error: 'Speciality not found'})
            }
            
            const posts = await Post.find({speciality_id: speciality._id})

                .populate('user_id', 'email username __t profile_image')
                .populate('speciality_id', 'name')
                .populate('post_comments.replier', 'email username __t profile_image')

            res.status(200).json(posts)
        }catch(error){
            res.status(400).json({error: error.message})
        }
    }

    get_All_Post = async(req, res) =>{
        try{
            
            const posts = await Post.find()
                .populate('user_id', 'email username __t profile_image')
                .populate('speciality_id', 'name')
                .populate('post_comments.replier', 'email username __t profile_image')

            res.status(200).json(posts)
        }catch(error){
            res.status(400).json({error: error.message})
        }
    }

    update_Post = async(req, res) =>{
        try{
            const post_id = req.params.id
            const {post_title, post_content, speciality_name} = req.body

            const query = {post_title, post_content}

            const speciality = await Speciality.findOne({name: speciality_name}, {_id: 1})

            if(speciality){
                query.speciality_id = speciality._id
            }

            let post = await Post.findByIdAndUpdate(
                post_id,
                query,
                {new: true}
            )
            .populate('user_id', 'email username __t profile_image')
            .populate('speciality_id', 'name')
            .populate('post_comments.replier', 'email username __t profile_image')

            if (!post) {
                return res.status(404).json({error: 'Post not found'})
            }

            res.status(200).json(post)
        }catch(error){
            res.status(400).json({error: error.message})
        }
    }

    soft_Delete_Post = async(req, res) =>{
        try{
            const post_id = req.params.id

            const result = await Article.findByIdAndUpdate(
                post_id,
                {is_deleted: true},
                {new: true}
            )
            .populate('user_id', 'email username __t profile_image')
            .populate('speciality_id', 'name')
            .populate('post_comments.replier', 'email username __t profile_image')

            res.status(200).json({
                message: 'Post soft deleted',
                post: result
            }) 

        }catch(error){
            res.status(400).json({error: error.message})
        }
    }

    restore_Post = async(req, res) =>{
        try{
            const post_id = req.params.id

            const result = await Article.findByIdAndUpdate(
                post_id,
                {is_deleted: true},
                {new: true}
            )
            .populate('user_id', 'email username __t profile_image')
            .populate('speciality_id', 'name')
            .populate('post_comments.replier', 'email username __t profile_image')

            res.status(200).json({
                message: 'Post restored',
                post: result
            }) 

        }catch(error){
            res.status(400).json({error: error.message})
        }
    }

    perma_Delete_Post = async(req, res) =>{
        try{
            // get id list
            const post_id = req.params.id

            const result = await Post.findByIdAndDelete(post_id)

            if (!result) {
                return res.status(404).json({ error: 'Post not found' })
            }

            res.status(200).json({
                message: 'Post deleted'
            })

        }catch(error){
            res.status(400).json({error: error.message})
        }
    }

    add_Comment = async(req, res) =>{
        try{
            const post_id = req.params.id
            const{comment_email, comment_content} = req.body
            
            if(!comment_content){
                throw Error('No content')
            }

            const replier = await User.findOne({email: comment_email}, {_id: 1})

            const new_comment = {replier: replier._id, comment_content}

            const post = await Post.findByIdAndUpdate(
                post_id,
                {$push: {post_comments: new_comment}},
                {new: true}
            )
            .populate('user_id', 'email username __t profile_image')
            .populate('speciality_id', 'name')
            .populate('post_comments.replier', 'email username __t profile_image')

            res.status(201).json(post)

        }catch(error){
            res.status(400).json({error: error.message})
        }
    }

    update_Comment = async(req, res) =>{
        try{
            const {post_id, comment_id} = req.params
            const{comment_content} = req.body

            if(!comment_content){
                throw new Error('No content')
            }

            let post = await Post.findById(post_id)

            if (!post) {
                return res.status(404).json({ error: 'Post not found' })
            }

            const comment = post.post_comments.id(comment_id)

            if (!comment) {
                throw new Error('Comment not found')
            }

            comment.comment_content = comment_content

            await post.save()

            post = await Post.findById(post_id)
            .populate('user_id', 'email username __t profile_image')
            .populate('speciality_id', 'name')
            .populate('post_comments.replier', 'email username __t profile_image')

            res.status(200).json(post)

        }catch(error){
            res.status(400).json({error: error.message})
        }
    }

    del_Comment = async(req, res) =>{
        try{
            const {post_id, comment_id} = req.params

            const post = await Post.findById(post_id)

            if (!post) {
                return res.status(404).json({ error: 'Post not found' })
            }

            post.post_comments.pull({_id: comment_id})

            await post.save()

            res.status(200).json({
                message: 'Comment deleted successfully',
                post
            })
            
        }catch(error){
            res.status(400).json({error: error.message})
        }
    }

    // search post by title or content
    search_Post_By_Title_and_Content = async(req, res) =>{
        try{
            const {search_query} = req.body

            const query = {}
            
            if (search_query) {
                // create a regular expression for case-insensitive search
                const regex = {$regex: search_query, $options: 'i'}
    
                // Search in multiple fields: post title, and content
                query.$or = [
                    { post_title: regex },        // Search by post title
                    { post_content: regex }       // Search by post content
                ]
            }

            const posts = await Post.find(query)
            .populate('user_id', 'email username __t profile_image')
            .populate('speciality_id', 'name')
            .populate('post_comments.replier', 'email username __t profile_image')

            res.status(200).json(posts)
        }catch(error){
            res.status(400).json({error: error.message})
        }
    }
}

module.exports = new post_Controller