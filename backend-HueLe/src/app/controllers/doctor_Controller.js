const Doctor = require('../models/Doctor')
const Region = require('../models/Region')
const Speciality = require('../models/Speciality')
const Appointment = require('../models/Appointment')
const cloudinary = require('../utils/cloudinary')

const fs = require('fs')
const mongoose = require('mongoose')

require('dotenv').config()

class doctor_Controller{
    update_Doctor_Info = async(req, res) =>{
        try{
            // get info from body
            const {speciality, region, bio} = req.body

            // get id
            const account_Id = req.params.id

            // find account
            let account = await Doctor.findById(account_Id)

            

            if(!account){
                return res.status(404).json({error: 'Account not found'})
            }


            // update
            if(speciality){
                const speciality_id = await Speciality.findOne({name: speciality }, {_id: 1})
                account.speciality_id = speciality_id._id
            }

            if(region){
                const region_id = await Region.findOne({name: region}, {_id: 1})
                account.region_id = region_id._id
            }

            if(bio){
                account.bio = bio
            }

            await account.save()

            account = await Doctor.findById(account_Id)
            .populate('speciality_id', 'name')
            .populate('region_id', 'name')
            
            res.status(200).json(account)
        }catch(error){
            console.log(error.message)
            res.status(400).json({error: error.message})
        }
    }

    upload_Doctor_Proof = async (req, res) => {
        try {
            // Check if file exists
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" })
            }
        
            const account_Id = req.params.id;
            const pdf_name = `${account_Id}_${Date.now()}`;
        
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
            const account = await Doctor.findByIdAndUpdate(
                account_Id,
                { proof },
                { new: true }
            )
        
            if (!account) {
                return res.status(404).json({ error: "Doctor not found" })
            }
        
            res.status(200).json(account);
        } catch (error) {
            console.error("Error: ", error.message)
            res.status(500).json({ error: error.message })
        }
    }
    
    get_Doctor_Active_Hour_List = async(req, res) =>{
        try{
            // get id
            const account_Id = req.params.id

            // find doctor
            const doctor = await Doctor.findById(account_Id)

            // find doctor existing appointments
            const appointments = await Appointment.aggregate([
                {   // by the same doctor
                    $match: {doctor_id: new mongoose.Types.ObjectId(account_Id)}
                },
                {
                    // group up appointments with similar appointment date, start and end time as one
                    // count the sum of similar appointments forming each group
                    $group: {
                        _id: {
                            appointment_day: "$appointment_day",
                            appointment_time_start: "$appointment_time_start",
                            appointment_time_end: "$appointment_time_end"
                        },
                        count: {$sum: 1}
                    }
                }
            ])

            // time that are fully booked
            let fully_Booked_Hour = []

            // time that are not fully booked
            let booked_Hour = []

            // go through each appointment
            doctor.active_hours.forEach((active_Hour) =>{
                // go through each active hour
                appointments.forEach((appointment) =>{
                    // day format: Day-of-Week specific-date 
                    const day_Of_Week = appointment._id.appointment_day.split(' ')[0]
                    if (
                        active_Hour.day === day_Of_Week &&
                        active_Hour.start_time === appointment._id.appointment_time_start &&
                        active_Hour.end_time === appointment._id.appointment_time_end &&
                        appointment.count >= active_Hour.appointment_limit
                    ){
                        fully_Booked_Hour.push({
                            date: appointment._id.appointment_day,
                            start_time: active_Hour.start_time,
                            end_time: active_Hour.end_time,
                            appointment_count: appointment.count,
                            appointment_limit: active_Hour.appointment_limit
                        })
                    } else if (
                        active_Hour.day === day_Of_Week &&
                        active_Hour.start_time === appointment._id.appointment_time_start &&
                        active_Hour.end_time === appointment._id.appointment_time_end &&
                        appointment.count < active_Hour.appointment_limit
                    ){
                        booked_Hour.push({
                            date: appointment._id.appointment_day,
                            start_time: active_Hour.start_time,
                            end_time: active_Hour.end_time,
                            appointment_count: appointment.count,
                            appointment_limit: active_Hour.appointment_limit
                        })
                    }
                })
            })

            res.status(201).json({
                active_hours: doctor.active_hours,
                booked: booked_Hour,
                fully_booked: fully_Booked_Hour
            })

        }catch(error){
            console.log(error.message)
            res.status(400).json({error: error.message})
        }
    }

    add_Doctor_Active_Hour = async(req, res) =>{
        try{
            const {day, start_time, end_time, hour_type, appointment_limit} = req.body

            if(!day || !start_time || !end_time || !hour_type || !appointment_limit){
                throw new Error('Missing information')
            }

            // get id
            const account_Id = req.params.id

            // check overlap
            const new_Active_Hour = {day, start_time, end_time, hour_type, appointment_limit}

            const is_overlap = await Doctor.Is_Time_Overlap(new_Active_Hour, account_Id)
            
            if(is_overlap){
                throw new Error('Overlapping time frame')
            }

            // add
            const doctor = await Doctor.findByIdAndUpdate(
                account_Id,
                {$push: {active_hours: new_Active_Hour}},
                {new: true}
            )

            res.status(201).json(doctor.active_hours)

        }catch(error){
            console.log(error.message)
            res.status(400).json({error: error.message})
        }
    }

    update_Doctor_Active_Hour = async(req, res) =>{
        try{
            const {
                day, start_time, end_time, hour_type, appointment_limit, 
                old_day, old_start_time, old_end_time, old_hour_type
            } = req.body

            if(!day || !start_time || !end_time || !hour_type){
                throw new Error('Missing information')
            }

            // get id
            const account_Id = req.params.id

            // check overlap
            const excluded_time = {
                day: old_day, 
                start_time: old_start_time, 
                end_time: old_end_time, 
                hour_type: old_hour_type
            }
            const new_Active_Hour = {day, start_time, end_time, hour_type, appointment_limit}

            const is_overlap = await Doctor.Is_Time_Overlap(new_Active_Hour, account_Id, excluded_time)
            
            if(is_overlap){
                throw new Error('Overlapping time frame')
            }

            // find doctor
            const doctor = await Doctor.findById(account_Id)

            // find old active hour
            const index = doctor.active_hours.findIndex(time_frame =>
                time_frame.day === old_day &&
                time_frame.start_time === old_start_time &&
                time_frame.end_time === old_end_time &&
                time_frame.hour_type === old_hour_type
            )

            // update
            doctor.active_hours[index] = new_Active_Hour

            await doctor.save()

            res.status(200).json({change: doctor.active_hours[index], 
                active_hours: doctor.active_hours})

        }catch(error){
            console.log(error.message)
            res.status(400).json({error: error.message})
        }
    }

    delete_Doctor_Active_Hour = async(req, res) =>{
        try{
            const {day, start_time, end_time, hour_type} = req.body

            if(!day || !start_time || !end_time || !hour_type){
                throw new Error('Missing information')
            }

            // get id
            const account_Id = req.params.id

            // find doctor
            const doctor = await Doctor.findById(account_Id)

            // find old active hour
            const index = doctor.active_hours.findIndex(time_frame =>
                time_frame.day === day &&
                time_frame.start_time === start_time &&
                time_frame.end_time === end_time &&
                time_frame.hour_type === hour_type
            )

            //delete
            doctor.active_hours.splice(index, 1)
            await doctor.save()

            res.status(200).json({message: 'Item deleted succesfully', 
                active_hours: doctor.active_hours})

        }catch(error){
            console.log(error.message)
            res.status(400).json({error: error.message})
        }
    }

    get_Filtered_Doctor_List = async(req, res) =>{
        try{
            const {speciality, region} = req.body

            let query = {}

            if(speciality){
                const speciality_id = await Speciality.findOne({name: speciality }, {_id: 1})
                query.speciality_id = speciality_id._id
            }

            if(region){
                const region_id = await Region.findOne({name: region}, {_id: 1})
                query.region_id = region_id._id
            }

            const doctors = await Doctor.find(query)
            .populate('speciality_id', 'name')
            .populate('region_id', 'name')

            res.status(200).json(doctors)
        }catch(error){
            console.log(error.message)
            res.status(400).json({error: error.message})
        }
    }

    change_Doctor_Verified_Status = async(req, res) =>{
        try{
            const {email, verified} = req.body
            console.log(email, verified);
            

            const doctor = await Doctor.findOneAndUpdate(
                {email}, 
                {verified},
                {new: true}
            ).populate('speciality_id', 'name')
            .populate('region_id', 'name')
            console.log("Updated Doctor:", doctor);

            res.status(200).json(doctor)
        }catch(error){
            console.log(error.message)
            res.status(400).json({error: error.message})
        }
    }

    search_Doctor_By_Name = async(req, res) =>{
        try {
            const {name} = req.body
    
            const doctors = await Doctor.find({
                name: {$regex: name, $options: 'i'}
            }).populate('speciality_id', 'name')
            .populate('region_id', 'name')
    
            res.status(200).json(doctors)
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }

    doctorProfile = async (req, res) => {
        try {
        
            const doctorEmail = req.user;
            
            const profileData = await Doctor.findOne({ email: doctorEmail }).populate("speciality_id", "name").populate("region_id", "name"); 
        
            if (!profileData) {
                return res.status(404).json({ success: false, message: "Doctor not found" });
            }
        
            res.json({ success: true, profileData });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server error" }); 
        }
    };

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
            ]);
        
            if (!result.length) {
                return res.status(404).json({ message: "No appointments found." });
            }
        
            return res.status(200).json({ data: result });
        } catch (err) {
            console.error("Error:", err);
            return res.status(500).json({
                error: "An error occurred.",
            });
        }
    };
}

module.exports = new doctor_Controller