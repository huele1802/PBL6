const User = require("./User")

const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Admin_Access = new Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        read_access: {
            type: Boolean,
            default: false,
        },
        write_access: {
            type: Boolean,
            default: false,
        },
        admin_write_access: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model("Admin_Access", Admin_Access)
