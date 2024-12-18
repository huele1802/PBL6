const Appointment = require('../models/Appointment')
const Doctor = require('../models/Doctor')
const User = require('../models/User')

const ical = require('ical-generator').default
const nodemailer = require('nodemailer')
const mongoose = require('mongoose')
const path = require('path')
const ejs = require('ejs')

class appointment_Controller {

    send_Appointment_Notice_Mail = async(
        appointment_day, appointment_time_start, appointment_time_end, 
        email, doctor
    ) =>{
        try{
            // Create a transporter for sending email using Gmail
            const transporter = nodemailer.createTransport({
                service: process.env.EMAIL_HOST,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            })

            // Remove the day of the week
            const date = appointment_day.split(' ').slice(1).join(' ')

            // Reformat the date to a recognized format (YYYY-MM-DD)
            const [day, month, year] = date.split('/')
            const reformatted_Date = `${year}-${month}-${day}`

            // Create date object
            const utc_Time_Start = new Date(`${reformatted_Date} ${appointment_time_start}`)

            // UTC off-set
            const timeZoneOffset = 7 * 60 * 60 * 1000 // UTC+7 offset in milliseconds
            const local_Time = new Date(utc_Time_Start.getTime() + timeZoneOffset)

            const appointment_Date = `${local_Time.getDate()} - ${local_Time.getMonth() + 1} - ${local_Time.getFullYear()}`

            // Render the ejs content
            const email_Content = await ejs.renderFile(
                path.join(__dirname, '../views', 'appointment-notice.ejs'),
                {
                    doctor,
                    appointment_Date,
                    appointment_time_start: appointment_time_start,
                    appointment_time_end: appointment_time_end,
                }
            )
            
            // Send the email
            let mail_Options = {
                from: process.env.EMAIL,
                to: email,
                subject: 'Nhắc lịch hẹn khám',
                html: email_Content
            }
            
            await transporter.sendMail(mail_Options)
        }catch (error) {
            console.error('Error while sending email:', error.message)
            throw new Error('Can not send email')
        }
    }
  
    check_Appointment_time = async(doctor_id, appointment_day, appointment_time_start, appointment_time_end) =>{
        const existing_appointments = await Appointment.find({
            doctor_id,
            appointment_day,
            appointment_time_start,
            appointment_time_end
        })

        const counter = existing_appointments.length
        
        const doctor = await Doctor.findById(doctor_id).select('active_hours')

        if (!doctor) {
            throw new Error('Doctor schedule not found')
        }

        const day_Of_Week = appointment_day.split(' ')[0]

        const doctor_active_hour = doctor.active_hours.find(
            (active_Hour) =>
                active_Hour.day === day_Of_Week &&
                active_Hour.start_time === appointment_time_start &&
                active_Hour.end_time === appointment_time_end
        )

        if (!doctor_active_hour) {
            throw new Error('Doctor is not available at this time')
        }

        if (counter >= doctor_active_hour.appointment_limit){
            throw new Error('This schedule is fully booked')
        }
    }

    add_Appointment = async(req, res) =>{
        try{
            const {
                user_id,
                doctor_id,
                appointment_day,
                appointment_time_start,
                appointment_time_end,
                health_issue,
                type_service
            } = req.body

            if(!user_id || !doctor_id 
                || !appointment_day 
                || !appointment_time_start 
                || !appointment_time_end
            ){
                throw new Error('Missing information')
            }

            await this.check_Appointment_time(
                doctor_id, 
                appointment_day, 
                appointment_time_start, 
                appointment_time_end
            )

            const appointment = await Appointment.create({
                user_id,
                doctor_id,
                appointment_day,
                appointment_time_start,
                appointment_time_end,
                health_issue,
                type_service
            })
            
            const populated_Appointment = await Appointment.findById(appointment._id)
              .populate('user_id', 'username date_of_birth profile_image email')
              .populate('doctor_id', 'username')

            this.send_Appointment_Notice_Mail(
                appointment_day, 
                appointment_time_start,
                appointment_time_end, 
                populated_Appointment.user_id.email, 
                populated_Appointment.doctor_id.username
            ).catch(error => console.error('Failed to send email:', error))

            res.status(201).json(populated_Appointment)
        }catch(error){
            res.status(400).json({error: error.message})
        }
    }

    update_Appointment_Info = async (req, res) => {
        try {
            const appointment_id = req.params.id
            const { health_issue, type_service } = req.body

            // Find and update the appointment
            const appointment = await Appointment.findByIdAndUpdate(
                appointment_id,
                {health_issue, type_service},
                {new: true}
            )
            .populate('user_id', 'username date_of_birth profile_image')
            .populate('doctor_id', 'username')

            res.status(200).json(appointment)
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }

    change_Appointment_Time = async (req, res) => {
        try {
            const appointment_id = req.params.id
            const {
                doctor_id,
                appointment_day,
                appointment_time_start,
                appointment_time_end,
            } = req.body

            if (
                !appointment_time_start ||
                !appointment_time_end ||
                !appointment_day ||
                !doctor_id
            ) {
                throw new Error('Missing information')
            }

            await this.check_Appointment_time(
                doctor_id,
                appointment_day,
                appointment_time_start,
                appointment_time_end
            )

            console.log(appointment_time_start, appointment_time_end)

            const appointment = await Appointment.findByIdAndUpdate(
                appointment_id,
                {appointment_time_start, appointment_time_end},
                {new: true}
            )
            .populate('user_id', 'username date_of_birth profile_image')
            .populate('doctor_id', 'username')

            res.status(200).json(appointment)
        } catch (error) {
            res.status(400).json({error: error.message})
        }
    }

    cancel_Appointment = async (req, res) => {
        try {
            const appointment_id = req.params.id

            await Appointment.findByIdAndDelete(appointment_id)

            res.status(200).json({message: 'Appointment is cancelled'})
        } catch (error) {
            res.status(400).json({error: error.message})
        }
    }

    add_Insurance = async (req, res) => {
        try {
            const appointment_id = req.params.id
            const {name, number, location, exp_date} = req.body

            const new_Insurance = {name, number, location, exp_date}

            const appointment = await Appointment.findByIdAndUpdate(
                appointment_id,
                {$push: {insurance: new_Insurance}},
                {new: true}
            )

            res.status(201).json(appointment.insurance)
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }

    delete_Insurance = async (req, res) => {
        try {
            const {appointment_id, insurance_id} = req.body

            const appointment = await Appointment.findById(appointment_id)

            appointment.insurance.pull({_id: insurance_id})

            await appointment.save()

            res.status(201).json(appointment.insurance)
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }

    update_Insurance = async (req, res) => {
        try {
            const {appointment_id, insurance_id, name, number, location, exp_date} = req.body

            const appointment = await Appointment.findById(appointment_id)

            const insurance = await appointment.insurance.id(insurance_id)

            insurance.name = name
            insurance.number = number
            insurance.location = location
            insurance.exp_date = exp_date

            await appointment.save()
            
            const populated_Appointment = await Appointment.findById(appointment._id)
                .populate('user_id', 'username date_of_birth profile_image')
                .populate('doctor_id', 'username')

            res.status(200).json(populated_Appointment)
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }

    get_All_Appointment = async (req, res) => {
        try {
            const {is_deleted} = req.body
            let query = {}

            if (is_deleted !== undefined) {
                query.is_deleted = is_deleted
            }

            const appointments = await Appointment.find(query)
                .populate('user_id', 'username date_of_birth profile_image')
                .populate('doctor_id', 'username')

            res.status(200).json(appointments)
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }

    get_Appointment_By_User_Id = async (req, res) => {
        try {
            const {is_deleted} = req.body
            const user_id = req.params.id

            let query = { user_id };

            if (is_deleted !== undefined) {
                query.is_deleted = is_deleted
            }

            const appointment = await Appointment.findOne(query)
                .populate('user_id', 'username date_of_birth profile_image')
                .populate('doctor_id', 'username')

            res.status(200).json(appointment)
        } catch (error) {
            res.status(400).json({error: error.message})
        }
    }

    get_Appointment_Insurance = async (req, res) => {
        try {
            const appointment_id = req.params.id

            const appointment = await Appointment.findById(
                appointment_id,
                'insurance'
            )

            res.status(200).json(appointment.insurance)
        } catch (error) {
            res.status(400).json({error: error.message})
        }
    }

    soft_Delete_Appointment = async (req, res) => {
        try {
            const appointment_id = req.params.id

            const appointment = await Appointment.findByIdAndUpdate(
                appointment_id,
                { is_deleted: true },
                { new: true }
            )

            res.status(200).json(appointment)
        } catch (error) {
            res.status(400).json({error: error.message})
        }
    }

    restore_Appointment = async (req, res) => {
        try {
            const appointment_id = req.params.id

            const appointment = await Appointment.findByIdAndUpdate(
                appointment_id,
                {is_deleted: false},
                {new: true}
            )
            .populate('user_id', 'username date_of_birth profile_image')
            .populate('doctor_id', 'username')

            res.status(200).json(appointment)
        } catch (error) {
            res.status(400).json({error: error.message})
        }
    }

    get_Appointments_By_Doctor = async(req, res) =>{
        try{
            const {is_deleted} = req.body
            const doctor_id = req.params.id

            let query = {doctor_id}

            if(is_deleted !== undefined){
                query.is_deleted = is_deleted
            }

            const appointment = await Appointment.find(query)
            .populate('user_id', 'username date_of_birth profile_image')
            .populate('doctor_id', 'username')


            res.status(200).json(appointment)

        }catch(error){
            res.status(400).json({error: error.message})
        }
    }

    getAppointmentInfo = async (req, res) => {
        try {
            const appointment_id = req.params.id
            if (!mongoose.Types.ObjectId.isValid(appointment_id)) {
                return res
                .status(400)
                .json({success: false, message: 'Invalid Appointment ID format'})
            }

            const appointmentData = await Appointment.findById(appointment_id)
            res.json({ success: true, appointmentData })
        } catch (error) {
            console.log(error)
            res.json({success: false, message: error.message})
        }
    }

    getAppointmentCountByMonth = async (req, res) => {
        try {
            const result = await Appointment.aggregate([
                {
                $addFields: {
                    formattedDate: {
                        $trim: {
                            input: {
                                $arrayElemAt: [
                                    { $split: ["$appointment_day", " "] }, // Split on the first space
                                    1,
                                ],
                            },
                        },
                    },
                },
                },
                {
                // Convert the modified string (now in YYYY-MM-DD format) to a Date object
                $addFields: {
                    date: {
                        $dateFromString: {
                            dateString: "$formattedDate",
                            format: "%Y-%m-%d",
                        },
                    },
                },
                },
                {
                $addFields: {
                    yearMonth: { $dateToString: { format: "%Y-%m", date: "$date" } },
                },
                },
                {
                // Group by year and month
                $group: {
                    _id: "$yearMonth",
                    appointmentCount: { $sum: 1 },
                },
                },
                {
                // Sort by year and month (ascending)
                $sort: { _id: 1 },
                },
                {
                // Project the result to include only the formatted date and count
                $project: {
                    _id: 0,
                    month: "$_id",
                    appointmentCount: 1,
                },
                },
            ])

            if (!result.length) {
                return res.status(404).json({ message: "No appointments found." })
            }

            return res.status(200).json({ data: result })
        } catch (err) {
            console.error("Error:", err)
            return res.status(500).json({
                error: "An error occurred.",
            })
        }
    }

    getAllUserAppointments = async (req, res) => {
        try {
            const user_id = req.params.id; 
    
            let query = { user_id };
    
            const appointments = await Appointment.find(query)
                .populate('user_id', 'username date_of_birth profile_image')
                .populate('doctor_id', 'username profile_image speciality_id address')
                .populate('doctor_id.speciality_id', '_id name');
    
            res.status(200).json(appointments);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
  
}

module.exports = new appointment_Controller()