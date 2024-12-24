const Client = require("../models/Client")
const Appointment = require("../models/Appointment")

class client_Controller {
    add_Client = async (req, res) => {
        try {
            const {
                user_id,
                insurance_name,
                insurance_number,
                insurance_location,
                insurance_exp_date,
            } = req.body
            console.log(
                user_id,
                insurance_name,
                insurance_number,
                insurance_location,
                insurance_exp_date
            )

            const client = await Client.create({
                user_id: user_id,
                insurance: [
                    {
                        name: insurance_name,
                        number: insurance_number,
                        location: insurance_location,
                        exp_date: insurance_exp_date,
                    },
                ],
            })

            res.status(201).json(client)
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }

    add_Insurance = async (req, res) => {
        try {
            const client_id = req.params.id
            const { name, number, location, exp_date } = req.body

            const new_Insurance = { name, number, location, exp_date }

            const client = await Client.findByIdAndUpdate(
                client_id,
                { $push: { insurance: new_Insurance } },
                { new: true }
            )

            res.status(201).json(client.insurance)
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }

    delete_Insurance = async (req, res) => {
        try {
            const { client_id, insurance_id } = req.body

            const client = await Client.findById(client_id)

            client.insurance.pull({ _id: insurance_id })

            await client.save()

            res.status(201).json(client.insurance)
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }

    update_Insurance = async (req, res) => {
        try {
            const { client_id, insurance_id, name, number, location, exp_date } = req.body

            const client = await Client.findById(client_id)

            const insurance = await client.insurance.id(insurance_id)

            insurance.name = name
            insurance.number = number
            insurance.location = location
            insurance.exp_date = exp_date

            await client.save()

            res.status(200).json(client)
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }

    get_All_Client = async (req, res) => {
        try {
            const { is_deleted } = req.body

            let query = {}

            if (is_deleted !== undefined) {
                query.is_deleted = is_deleted
            }

            const clients = await Client.find(query)

            res.status(200).json(clients)
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }

    get_Client_By_User_Id = async (req, res) => {
        try {
            const { is_deleted } = req.body
            const user_id = req.params.id

            let query = { user_id }

            if (is_deleted !== undefined) {
                query.is_deleted = is_deleted
            }

            const client = await Client.findOne(query)

            res.status(200).json(client)
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }

    soft_Delete_Client = async (req, res) => {
        try {
            const client_id = req.params.id

            const client = await Client.findByIdAndUpdate(
                client_id,
                { is_deleted: true },
                { new: true }
            )

            res.status(200).json(client)
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }

    restore_Client = async (req, res) => {
        try {
            const client_id = req.params.id

            const client = await Client.findByIdAndUpdate(
                client_id,
                { is_deleted: false },
                { new: true }
            )

            res.status(200).json(client)
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }

    perma_Delete_Client = async (req, res) => {
        try {
            const client_id = req.params.id

            const appointment = await Appointment.deleteMany({ client_id })

            const client = await Client.findByIdAndDelete(client_id)

            res.status(200).json({
                message: "Client permanently deleted",
                notice: `${appointment.deletedCount} appointment(s) deleted`,
            })
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }

    get_Client_Appointment = async (req, res) => {
        try {
            const client_id = req.params.id

            const appointment = await Appointment.find({ client_id })

            res.status(200).json(appointment)
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }

    get_Client_Insurance = async (req, res) => {
        try {
            const client_id = req.params.id

            const client = await Client.findById(client_id, "insurance")

            res.status(200).json(client.insurance)
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }
}

module.exports = new client_Controller()
