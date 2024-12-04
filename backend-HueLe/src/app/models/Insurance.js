const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Insurance = new Schema({
    name: {
        type: String,
        required: true 
    },
    number: {
        type: String,
        required: true 
    },
    location: {
        type: String,
        required: true
    },
    exp_date: {
        type: String,
        required: true
    },
    is_deleted: { 
        type: Boolean, 
        default: false 
    }
}) 