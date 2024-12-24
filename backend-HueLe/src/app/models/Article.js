const Doctor = require("./Doctor")

const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Article = new Schema({
    doctor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true,
    },
    article_title: {
        type: String,
        required: true,
    },
    article_image: {
        type: String,
        default: null,
    },
    article_content: {
        type: String,
        required: true,
    },
    date_published: {
        type: Date,
        default: Date.now,
    },
    is_deleted: {
        type: Boolean,
        default: false,
    },
})

module.exports = mongoose.model("Article", Article)
