const Admin_Access = require('../models/Admin_Access')

class admin_access_Controller{

    add_Admin = async(req, res) =>{
        try{
            const {user_id, read_access, write_access, admin_write_access} = req.body

            if (!user_id) {
                throw new Error('User ID is required')
            }

            const exists_admin = await Admin_Access.findOne({user_id})

            if (exists_admin) {
                throw new Error('This account is already an admin')
            }

            const admin = await Admin_Access.create({user_id, read_access, write_access, admin_write_access})

            const new_Admin = await Admin_Access.findById(admin._id)
                             .populate('user_id', 'email username profile_image')

            res.status(201).json(new_Admin)
        }catch(error){
            console.log(error.message)
            res.status(400).json({error: error.message})
        }
    }

    update_Access = async(req, res) =>{
        try{
            const {access_id, read_access, write_access, admin_write_access} = req.body

            const admin_Access = await Admin_Access.findByIdAndUpdate(
                access_id,
                {read_access, write_access, admin_write_access},
                {new: true}
            )
            .populate('user_id', 'email username profile_image')
            
            res.status(200).json(admin_Access)
        }catch(error){
            console.log(error.message)
            res.status(400).json({error: error.message})
        }
    }

    remove_Admin = async(req, res) =>{
        try{
            // get id list
            const {access_Ids} = req.body

            // if no ids
            if (
                !access_Ids ||
                !Array.isArray(access_Ids) ||
                access_Ids.length === 0
            ) {
                return res.status(400).json({error: 'No IDs provided'})
            }

            // delete
            const result = await Admin_Access.deleteMany({_id: {$in: access_Ids}})

            res.status(200).json({
                message: 'Access revoked',
                deletedCount: result.deletedCount,
            })
        }catch(error){
            console.log(error.message)
            res.status(400).json({error: error.message})
        }
    }

    admin_List = async(req, res) =>{
        try{
            const admin_Access = await Admin_Access.find({})
                                .populate('user_id', 'email username profile_image')

            res.status(200).json(admin_Access)
        }catch(error){
            console.log(error.message)
            res.status(400).json({error: error.message})
        }
    }

    admin_Detail = async(req, res) =>{
        try{
            const access_id = req.params.id
            const admin_Access = await Admin_Access.findById(access_id)
                                .populate('user_id', 'email username profile_image')

            res.status(200).json(admin_Access)
        }catch(error){
            console.log(error.message)
            res.status(400).json({error: error.message})
        }
    }
}

module.exports = new admin_access_Controller