const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Client = new Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    insurance:[{ 
        name: String,
        number: String,
        location: String,
        exp_date: String
    }], 
    is_deleted: { 
        type: Boolean, default: false 
    }
}, { timestamps: true })

Client.path('insurance').default(() => [])

module.exports = mongoose.model('Client', Client)