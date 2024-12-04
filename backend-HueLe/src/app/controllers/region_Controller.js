const Region = require('../models/Region')
const mongoose = require('mongoose')

class region_Controller {
    add_Region = async (req, res) => {
        try {
            // get info from body
            const {name} = req.body

            const exists_reg = await Region.findOne({name})

            if (exists_reg) {
                throw new Error('Region already exits')
            }

            // create
            const region = await Region.create({name})

            res.status(201).json(region)
        } catch (error) {
            console.log(error.message)
            res.status(400).json({error: error.message})
        }
    }

    get_Region_List = async (req, res) => {
        try {
            let regions
            const {hidden_state} = req.body

            // find list of region
            if (hidden_state == 'true') {
                regions = await Region.find({is_deleted: true})
            } else {
                regions = await Region.find({is_deleted: false})
            }

            res.status(200).json(regions)
        } catch (error) {
            console.log(error.message)
            res.status(400).json({error: error.message})
        }
    }

    update_Region = async (req, res) => {
        try {
            // get info from body
            const {name} = req.body

            // get id
            const region_Id = req.params.id

            // update
            if (!name) {
                throw new Error('Missing information')
            }

            const existing_Region = await Region.findOne({
                name,
                _id: { $ne: region_Id },
            })
            if (existing_Region) {
                throw new Error('Region already exits')
            }

            const region = await Region.findByIdAndUpdate(
                region_Id,
                {name},
                {new: true}
            )

            res.status(200).json(region)
        } catch (error) {
            console.log(error.message)
            res.status(400).json({error: error.message})
        }
    }

    soft_Delete_Region = async (req, res) => {
        try {
            // get id list
            const { region_Ids } = req.body

            // if no ids
            if (
                !region_Ids ||
                !Array.isArray(region_Ids) ||
                region_Ids.length === 0
            ) {
                return res.status(400).json({ error: "No IDs provided" })
            }

            // update
            const result = await Region.updateMany(
            {_id: {$in: region_Ids}},
            {is_deleted: true}
            )

            res.status(200).json({
                message: 'Region soft deleted',
                modifiedCount: result.modifiedCount,
            })
        } catch (error) {
            console.log(error.message)
            res.status(400).json({error: error.message})
        }
    }

    restore_Deleted_Region = async (req, res) => {
        try {
            // get id list
            const { region_Ids } = req.body

            // if no ids
            if (
                !region_Ids ||
                !Array.isArray(region_Ids) ||
                region_Ids.length === 0
            ) {
                return res.status(400).json({error: 'No IDs provided'})
            }

            // update
            const result = await Region.updateMany(
                {_id: { $in: region_Ids}},
                {is_deleted: false}
            )

            res.status(200).json({
                message: 'Region restored',
                modifiedCount: result.modifiedCount,
            })
        } catch (error) {
            console.log(error.message)
            res.status(400).json({error: error.message})
        }
    }

    perma_Delete_Region = async (req, res) => {
        try {
            // get id list
            const {region_Ids} = req.body

            // if no ids
            if (
                !region_Ids ||
                !Array.isArray(region_Ids) ||
                region_Ids.length === 0
            ) {
                return res.status(400).json({error: 'No IDs provided'})
            }

            // delete
            const result = await Region.deleteMany({_id: {$in: region_Ids}})

            res.status(200).json({
                message: 'Region deleted',
                deletedCount: result.deletedCount,
            })
        } catch (error) {
            console.log(error.message)
            res.status(400).json({error: error.message})
        }
    }

    get_Region = async (req, res) => {
        try {
            const {region_Id} = req.body

            //   console.log("Received region_Id:", region_Id)

            if (!mongoose.Types.ObjectId.isValid(region_Id)) {
            return res
                .status(400)
                .json({success: false, message: 'Invalid region ID format'})
            }

            const region = await Region.findById(region_Id)

            if (!region) {
            return res
                .status(404)
                .json({success: false, message: 'Region not found'})
            }

            res.status(200).json({success: true, data: region })
        } catch (error) {
            console.log('Error:', error.message)
            res.status(500).json({success: false, error: error.message})
        }
    }
}

module.exports = new region_Controller()