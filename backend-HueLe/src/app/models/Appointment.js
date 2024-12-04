const Client = require('./Client')
const Doctor = require('./Doctor')

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Appointment = Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    doctor_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Doctor', 
        required: true 
    },
    insurance:[{ 
        name: String,
        number: String,
        location: String,
        exp_date: String
    }], 
    appointment_day: { 
        type: String, 
        required: true 
    },
    appointment_time_start: { 
        type: String, 
        required: true 
    },
    appointment_time_end: { 
        type: String, 
        required: true 
    },
    health_issue: { 
        type: String 
    },
    type_service: { 
        type: String,
        default: null
    },
    is_deleted: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true })

Appointment.path('insurance').default(() => [])

module.exports = mongoose.model('Appointment', Appointment)