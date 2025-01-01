const Doctor = require("../models/Doctor")
const Region = require("../models/Region")
const Speciality = require("../models/Speciality")
const Appointment = require("../models/Appointment")
const Article = require("../models/Article")
const Post = require("../models/Post")

const cloudinary = require("../utils/cloudinary")

const Moment = require("moment")
const MomentRange = require("moment-range")
const moment = MomentRange.extendMoment(Moment)

const fs = require("fs")
const mongoose = require("mongoose")

require("dotenv").config()

class doctor_Controller {
    update_Doctor_Info = async (req, res) => {
        try {
            // get info from body
            const { speciality, region, bio } = req.body

            // get id
            const account_Id = req.params.id

            // find account
            let account = await Doctor.findById(account_Id)

            if (!account) {
                return res.status(404).json({ error: "Account not found" })
            }

            // update
            if (speciality) {
                const speciality_id = await Speciality.findOne({ name: speciality }, { _id: 1 })
                account.speciality_id = speciality_id._id
            }

            if (region) {
                const region_id = await Region.findOne({ name: region }, { _id: 1 })
                account.region_id = region_id._id
            }

            if (bio) {
                account.bio = bio
            }

            await account.save()

            account = await Doctor.findById(account_Id)
                .populate("speciality_id", "name")
                .populate("region_id", "name")

            res.status(200).json(account)
        } catch (error) {
            console.log(error.message)
            res.status(400).json({ error: error.message })
        }
    }

    upload_Doctor_Proof = async (req, res) => {
        try {
            // Check if file exists
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" })
            }

            const account_Id = req.params.id
            const pdf_name = `${account_Id}_${Date.now()}`

            // Upload file to Cloudinary
            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: "PBL6/proofs",
                public_id: pdf_name,
                overwrite: true,
            })

            // Extract proof URL and delete temporary file
            const proof = uploadResult.secure_url
            try {
                await fs.promises.unlink(req.file.path)
            } catch (err) {
                console.error("Failed to delete temp file: ", err.message)
            }

            // Update database
            const account = await Doctor.findByIdAndUpdate(account_Id, { proof }, { new: true })

            if (!account) {
                return res.status(404).json({ error: "Doctor not found" })
            }

            res.status(200).json(account)
        } catch (error) {
            console.error("Error: ", error.message)
            res.status(500).json({ error: error.message })
        }
    }

    get_Doctor_Active_Hour_List = async (req, res) => {
        try {
            // get id
            const account_Id = req.params.id

            // find doctor
            const doctor = await Doctor.findById(account_Id)

            // find doctor existing appointments
            const appointments = await Appointment.aggregate([
                {
                    // by the same doctor
                    $match: { doctor_id: new mongoose.Types.ObjectId(account_Id) },
                },
                {
                    // group up appointments with similar appointment date, start and end time as one
                    // count the sum of similar appointments forming each group
                    $group: {
                        _id: {
                            appointment_day: "$appointment_day",
                            appointment_time_start: "$appointment_time_start",
                            appointment_time_end: "$appointment_time_end",
                        },
                        count: { $sum: 1 },
                    },
                },
            ])

            // time that are fully booked
            let fully_Booked_Hour = []

            // time that are not fully booked
            let booked_Hour = []

            // go through each appointment
            doctor.active_hours.forEach((active_Hour) => {
                // go through each active hour
                appointments.forEach((appointment) => {
                    // day format: Day-of-Week specific-date
                    const day_Of_Week = appointment._id.appointment_day.split(" ")[0]
                    if (
                        active_Hour.day === day_Of_Week &&
                        active_Hour.start_time === appointment._id.appointment_time_start &&
                        active_Hour.end_time === appointment._id.appointment_time_end &&
                        appointment.count >= active_Hour.appointment_limit
                    ) {
                        fully_Booked_Hour.push({
                            date: appointment._id.appointment_day,
                            start_time: active_Hour.start_time,
                            end_time: active_Hour.end_time,
                            appointment_count: appointment.count,
                            appointment_limit: active_Hour.appointment_limit,
                        })
                    } else if (
                        active_Hour.day === day_Of_Week &&
                        active_Hour.start_time === appointment._id.appointment_time_start &&
                        active_Hour.end_time === appointment._id.appointment_time_end &&
                        appointment.count < active_Hour.appointment_limit
                    ) {
                        booked_Hour.push({
                            date: appointment._id.appointment_day,
                            start_time: active_Hour.start_time,
                            end_time: active_Hour.end_time,
                            appointment_count: appointment.count,
                            appointment_limit: active_Hour.appointment_limit,
                        })
                    }
                })
            })

            res.status(201).json({
                active_hours: doctor.active_hours,
                booked: booked_Hour,
                fully_booked: fully_Booked_Hour,
            })
        } catch (error) {
            console.log(error.message)
            res.status(400).json({ error: error.message })
        }
    }

    add_Doctor_Active_Hour = async (req, res) => {
        try {
            const { day, start_time, end_time, hour_type, appointment_limit } = req.body

            if (!day || !start_time || !end_time || !hour_type || !appointment_limit) {
                throw new Error("Missing information")
            }

            // get id
            const account_Id = req.params.id

            // check overlap
            const new_Active_Hour = { day, start_time, end_time, hour_type, appointment_limit }

            const is_overlap = await Doctor.Is_Time_Overlap(new_Active_Hour, account_Id)

            if (is_overlap) {
                throw new Error("Overlapping time frame")
            }

            // add
            const doctor = await Doctor.findByIdAndUpdate(
                account_Id,
                { $push: { active_hours: new_Active_Hour } },
                { new: true }
            )

            res.status(201).json(doctor.active_hours)
        } catch (error) {
            console.log(error.message)
            res.status(400).json({ error: error.message })
        }
    }

    // update_Doctor_Active_Hour = async(req, res) =>{
    //     try{
    //         const {
    //             day, start_time, end_time, hour_type, appointment_limit,
    //             old_day, old_start_time, old_end_time, old_hour_type
    //         } = req.body

    //         if(!day || !start_time || !end_time || !hour_type){
    //             throw new Error('Missing information')
    //         }

    //         // get id
    //         const account_Id = req.params.id

    //         // check overlap
    //         const excluded_time = {
    //             day: old_day,
    //             start_time: old_start_time,
    //             end_time: old_end_time,
    //             hour_type: old_hour_type
    //         }
    //         const new_Active_Hour = {day, start_time, end_time, hour_type, appointment_limit}

    //         const is_overlap = await Doctor.Is_Time_Overlap(new_Active_Hour, account_Id, excluded_time)

    //         if(is_overlap){
    //             throw new Error('Overlapping time frame')
    //         }

    //         // find doctor
    //         const doctor = await Doctor.findById(account_Id)

    //         // find old active hour
    //         const index = doctor.active_hours.findIndex(time_frame =>
    //             time_frame.day === old_day &&
    //             time_frame.start_time === old_start_time &&
    //             time_frame.end_time === old_end_time &&
    //             time_frame.hour_type === old_hour_type
    //         )

    //         // update
    //         doctor.active_hours[index] = new_Active_Hour

    //         await doctor.save()

    //         res.status(200).json({change: doctor.active_hours[index],
    //             active_hours: doctor.active_hours})

    //     }catch(error){
    //         console.log(error.message)
    //         res.status(400).json({error: error.message})
    //     }
    // }

    update_Doctor_Active_Hour = async (req, res) => {
        try {
            const {
                day,
                start_time,
                end_time,
                hour_type,
                appointment_limit,
                old_day,
                old_start_time,
                old_end_time,
                old_hour_type,
            } = req.body

            if (!day || !start_time || !end_time || !hour_type) {
                throw new Error("Missing information")
            }

            console.log(old_day)

            // Get doctor ID
            const account_Id = req.params.id

            // Check for overlapping active hours
            const excluded_time = {
                day: old_day,
                start_time: old_start_time,
                end_time: old_end_time,
                hour_type: old_hour_type,
            }
            const new_Active_Hour = { day, start_time, end_time, hour_type, appointment_limit }

            const is_overlap = await Doctor.Is_Time_Overlap(
                new_Active_Hour,
                account_Id,
                excluded_time
            )

            if (is_overlap) {
                throw new Error("Overlapping time frame")
            }

            // Find doctor
            const doctor = await Doctor.findById(account_Id)

            // Find the index of the old active hour
            const index = doctor.active_hours.findIndex(
                (time_frame) =>
                    time_frame.day === old_day &&
                    time_frame.start_time === old_start_time &&
                    time_frame.end_time === old_end_time &&
                    time_frame.hour_type === old_hour_type
            )

            if (index === -1) {
                throw new Error("Old active hour not found")
            }

            // Update the active hour
            doctor.active_hours[index] = new_Active_Hour

            // Save updated doctor active hours
            await doctor.save()

            const today = moment()

            const todayFormatted = today.format("YYYY-MM-DD") // Today's date in 'YYYY-MM-DD' format

            // Find matching appointments based on old time slots
            const matchingAppointments = await Appointment.find({
                doctor_id: account_Id,
                appointment_time_start: old_start_time.trim(),
                appointment_time_end: old_end_time.trim(),
                is_deleted: false,
                appointment_day: { $regex: `^${old_day}`, $options: "i" }, // Match the old day (case insensitive)
            })

            const updatedAppointments = []
            for (const appointment of matchingAppointments) {
                // Extract the date part of the appointment (i.e., 'Monday 2024-12-12' -> '2024-12-12')
                const appointmentDate = moment(
                    appointment.appointment_day,
                    "dddd YYYY-MM-DD"
                ).format("YYYY-MM-DD")

                // If the appointment day is in the past (before today), skip it
                if (appointmentDate < todayFormatted) {
                    console.log(
                        `Skipping appointment on ${appointment.appointment_day} because it's in the past.`
                    )
                    continue
                }

                // If the appointment's day matches the old day, update the appointment
                const oldDate = moment(appointment.appointment_day, "dddd YYYY-MM-DD")
                const newDate = oldDate.clone().day(moment().day(day).isoWeekday()) // Update to new day

                // Update the appointment fields
                appointment.appointment_day = `${day} ${newDate.format("YYYY-MM-DD")}`
                appointment.appointment_time_start = start_time.trim()
                appointment.appointment_time_end = end_time.trim()

                // Save the updated appointment
                await appointment.save()
                updatedAppointments.push(appointment)
            }

            res.status(200).json({
                message: "Active hour updated successfully",
                updated_active_hour: { day, start_time, end_time, hour_type },
                updated_appointments: updatedAppointments.length,
            })
        } catch (error) {
            console.log(error.message)
            res.status(400).json({ error: error.message })
        }
    }

    delete_Doctor_Active_Hour = async (req, res) => {
        try {
            const { day, start_time, end_time, hour_type } = req.body

            if (!day || !start_time || !end_time || !hour_type) {
                throw new Error("Missing information")
            }

            // Get doctor ID
            const account_Id = req.params.id

            // Find the doctor
            const doctor = await Doctor.findById(account_Id)

            // Find index of the active hour to be deleted
            const index = doctor.active_hours.findIndex(
                (time_frame) =>
                    time_frame.day === day &&
                    time_frame.start_time === start_time &&
                    time_frame.end_time === end_time &&
                    time_frame.hour_type === hour_type
            )

            if (index === -1) {
                throw new Error("Active hour not found")
            }

            // Delete the active hour
            doctor.active_hours.splice(index, 1)
            await doctor.save()

            const matchingAppointments = await Appointment.find({
                doctor_id: account_Id,
                appointment_day: { $regex: `^${day}`, $options: "i" },
                appointment_time_start: start_time.trim(),
                appointment_time_end: end_time.trim(),
            })

            const deletedAppointments = []

            for (const appointment of matchingAppointments) {
                // Delete the appointment
                await Appointment.deleteOne({ _id: appointment._id })
                deletedAppointments.push(appointment)
            }

            res.status(200).json({
                message: "Active hour and matching appointments deleted successfully",
                active_hours: doctor.active_hours,
                deleted_appointments: deletedAppointments.length,
            })
        } catch (error) {
            console.log(error.message)
            res.status(400).json({ error: error.message })
        }
    }

    get_Filtered_Doctor_List = async (req, res) => {
        try {
            const { speciality, region, verified } = req.body

            let query = {}

            // Ensure `verified` is either true or false
            if (verified === true || verified === false) {
                query.verified = verified
            }
            // Find speciality
            if (speciality) {
                const speciality_id = await Speciality.findOne({ name: speciality }, { _id: 1 })
                query.speciality_id = speciality_id._id
            }
            // Find region
            if (region) {
                const region_id = await Region.findOne({ name: region }, { _id: 1 })
                query.region_id = region_id._id
            }

            const doctors = await Doctor.find(query)
                .populate("speciality_id", "name")
                .populate("region_id", "name")

            res.status(200).json(doctors)
        } catch (error) {
            console.log(error.message)
            res.status(400).json({ error: error.message })
        }
    }

    change_Doctor_Verified_Status = async (req, res) => {
        try {
            const { email, verified } = req.body
            console.log(email, verified)

            const doctor = await Doctor.findOneAndUpdate({ email }, { verified }, { new: true })
                .populate("speciality_id", "name")
                .populate("region_id", "name")
            console.log("Updated Doctor:", doctor)

            res.status(200).json(doctor)
        } catch (error) {
            console.log(error.message)
            res.status(400).json({ error: error.message })
        }
    }

    search_Doctor_By_Name = async (req, res) => {
        try {
            const { name } = req.body

            const doctors = await Doctor.find({
                username: { $regex: name, $options: "i" },
            })
                .populate("speciality_id", "name")
                .populate("region_id", "name")

            res.status(200).json(doctors)
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }

    doctorProfile = async (req, res) => {
        try {
            const doctorEmail = req.user

            const profileData = await Doctor.findOne({ email: doctorEmail })
                .populate("speciality_id", "name")
                .populate("region_id", "name")

            if (!profileData) {
                return res.status(404).json({ success: false, message: "Doctor not found" })
            }

            res.json({ success: true, profileData })
        } catch (error) {
            console.error(error)
            res.status(500).json({ success: false, message: "Server error" })
        }
    }

    getTopDoctors = async (req, res) => {
        try {
            const result = await Appointment.aggregate([
                {
                    $group: {
                        _id: "$doctor_id", // Group by doctor_id
                        appointmentCount: { $sum: 1 }, // Count the appointments
                    },
                },
                {
                    $sort: { appointmentCount: -1 },
                },
                {
                    $limit: 5,
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "doctorDetails",
                    },
                },
                {
                    $project: {
                        doctorId: "$_id",
                        appointmentCount: 1,
                        doctorDetails: { $arrayElemAt: ["$doctorDetails", 0] },
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

    getDoctorStat = async (req, res) => {
        try {
            const { year, doctorId } = req.body
            const selectedYear = year || new Date().getFullYear()

            // Check if doctorId is provided
            if (!doctorId) {
                return res.status(400).json({ message: "Doctor ID is required." })
            }

            const appointmentsResult = await Appointment.aggregate([
                {
                    $addFields: {
                        // Remove the weekday part (e.g., "Thursday ") to leave only the date part
                        formattedDate: {
                            $trim: {
                                input: {
                                    $arrayElemAt: [
                                        { $split: ["$appointment_day", " "] },
                                        1, // Only take the second part (the date)
                                    ],
                                },
                            },
                        },
                    },
                },
                {
                    $addFields: {
                        // Convert formatted date string to date object
                        date: {
                            $dateFromString: {
                                dateString: "$formattedDate",
                                format: "%Y-%m-%d", // The date format (YYYY-MM-DD)
                            },
                        },
                    },
                },
                {
                    $addFields: {
                        // Extract the year from the date
                        year: { $year: "$date" },
                        // Extract year and month as a string (YYYY-MM)
                        yearMonth: { $dateToString: { format: "%Y-%m", date: "$date" } },
                    },
                },
                {
                    // Match the selected year and doctor ID
                    $match: {
                        year: parseInt(selectedYear, 10),
                        doctor_id: new mongoose.Types.ObjectId(doctorId), // Match the doctor by ObjectId
                        is_deleted: false,
                    },
                },
                {
                    $group: {
                        _id: "$yearMonth", // Group by year-month
                        appointmentCount: { $sum: 1 }, // Count the number of appointments
                    },
                },
                {
                    $sort: { _id: 1 }, // Sort by year-month
                },
                {
                    $project: {
                        _id: 0,
                        month: "$_id", // Output month as year-month
                        appointmentCount: 1, // Include the appointment count
                    },
                },
            ])

            const articlesResult = await Article.aggregate([
                {
                    $addFields: {
                        yearMonth: { $dateToString: { format: "%Y-%m", date: "$date_published" } },
                    },
                },
                {
                    // Match the selected year and doctor ID
                    $match: {
                        doctor_id: new mongoose.Types.ObjectId(doctorId),
                        is_deleted: false,
                    },
                },
                {
                    $group: {
                        _id: "$yearMonth", // Group by year-month
                        articleCount: { $sum: 1 }, // Count the number of articles
                    },
                },
                {
                    $sort: { _id: 1 }, // Sort by year-month
                },
                {
                    $project: {
                        _id: 0,
                        month: "$_id", // Output month as year-month
                        articleCount: 1, // Include the article count
                    },
                },
            ])

            const postsResult = await Post.aggregate([
                {
                    $addFields: {
                        yearMonth: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    },
                },
                {
                    $match: {
                        user_id: new mongoose.Types.ObjectId(doctorId),
                        is_deleted: false,
                    },
                },
                {
                    $group: {
                        _id: "$yearMonth",
                        postCount: { $sum: 1 },
                    },
                },
                {
                    $sort: { _id: 1 },
                },
                {
                    $project: {
                        _id: 0,
                        month: "$_id",
                        postCount: 1,
                    },
                },
            ])

            // Combine the appointment, article, and post counts
            const stats = []
            for (let i = 1; i <= 12; i++) {
                const monthString = `${selectedYear}-${i.toString().padStart(2, "0")}` // Format "YYYY-MM"

                const appointmentData = appointmentsResult.find(
                    (item) => item.month === monthString
                )
                const articleData = articlesResult.find((item) => item.month === monthString)
                const postData = postsResult.find((item) => item.month === monthString)

                stats.push({
                    month: i,
                    appointmentCount: appointmentData ? appointmentData.appointmentCount : 0,
                    articleCount: articleData ? articleData.articleCount : 0,
                    postCount: postData ? postData.postCount : 0,
                })
            }

            return res.status(200).json({
                success: true,
                data: stats,
                message: "Monthly appointment and article stats retrieved successfully.",
            })
        } catch (err) {
            console.error("Error:", err)
            return res.status(500).json({
                error: "An error occurred.",
            })
        }
    }

    get_Filtered_Doctor_List_Main_Info_Only = async (req, res) => {
        try {
            const { speciality, region, verified } = req.body

            let query = {}

            // Ensure `verified` is either true or false
            if (verified === true || verified === false) {
                query.verified = verified
            }
            // Find speciality
            if (speciality) {
                const speciality_id = await Speciality.findOne({ name: speciality }, { _id: 1 })
                query.speciality_id = speciality_id._id
            }
            // Find region
            if (region) {
                const region_id = await Region.findOne({ name: region }, { _id: 1 })
                query.region_id = region_id._id
            }

            const doctors = await Doctor.find(query)
                .select("_id username profile_image bio email is_deleted")
                .populate("speciality_id", "name")
                .populate("region_id", "name")

            res.status(200).json(doctors)
        } catch (error) {
            console.log(error.message)
            res.status(400).json({ error: error.message })
        }
    }
}

module.exports = new doctor_Controller()
