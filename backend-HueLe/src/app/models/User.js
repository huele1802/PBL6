const bcrypt = require("bcrypt")
const validator = require("validator")
const mongoose = require("mongoose")
const Schema = mongoose.Schema

require("dotenv").config()

const default_profile_img = process.env.DEFAULT_PROFILE_IMG

const User = new Schema(
    {
        email: {
            type: String,
            unique: true,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        username: {
            type: String,
        },
        phone: {
            type: String,
        },
        profile_image: {
            type: String,
            default: null,
        },
        underlying_condition: {
            type: String,
            default: "none",
        },
        date_of_birth: {
            type: Date,
            default: Date.now,
        },
        address: {
            type: String,
            default: "none",
        },
        is_deleted: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
)

// sign up
User.statics.add_User = async function (email, password, username, phone) {
    //validation
    if (!email || !password) {
        throw new Error("Cần phải có email và mật khẩu!")
    }

    if (!validator.isEmail(email)) {
        throw new Error("Email không hợp lệ!")
    }

    if (!validator.isStrongPassword(password)) {
        throw new Error("Mật khẩu không đủ mạnh!")
    }

    // if(!validator.isMobilePhone(phone, 'vi-VN')){
    //     throw new Error('Invalid phone number!')
    // }

    const exists = await this.findOne({ email })

    if (exists) {
        throw new Error("Email đã tồn tại!")
    }
    //hassing password
    const salt = await bcrypt.genSalt(10)
    const hass = await bcrypt.hash(password, salt)

    const user = await this.create({
        email,
        password: hass,
        username,
        phone,
    })

    return user
}
// login method
User.statics.login = async function (email, password) {
    //validation
    if (!email || !password) {
        throw new Error("Thiếu email hoặc mật khẩu")
    }

    const user = await this.findOne({ email })

    if (!user) {
        throw new Error("Không tìm thấy người dùng")
    }

    const match = await bcrypt.compare(password, user.password)

    if (!match) {
        throw new Error("Sai mật khẩu!")
    }

    return user
}
// change password
User.statics.change_pass = async function (email, password, is_reset = false) {
    const user = await this.findOne({ email })

    // if(!validator.isStrongPassword(password)){
    //     throw new Error("Password not strong enough!")
    // }

    let match = false

    if (!is_reset) {
        match = await bcrypt.compare(password, user.password)
    }

    if (match) {
        throw new Error("Mật khẩu mới phải khác mật khẩu cũ")
    }

    //hassing password
    const salt = await bcrypt.genSalt(10)
    const hass = await bcrypt.hash(password, salt)

    const updated_user = await this.findOneAndUpdate({ email }, { password: hass }, { new: true })

    return updated_user
}

module.exports = mongoose.model("User", User)
