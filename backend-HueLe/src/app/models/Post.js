const User = require('./User')

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Post = new Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    speciality_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Speciality', 
        required: true 
    },
    post_title: { 
        type: String, 
        required: true 
    },
    post_content: { 
        type: String, 
        required: true },
    post_comments: [{ 
        replier: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User'
        },
        comment_content: String,
        // like: {type: Number, default: 0},
        // dislike: {type: Number, default: 0}
    }],
    is_deleted: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true })

Post.path('post_comments').default(() => [])

module.exports = mongoose.model('Post', Post)