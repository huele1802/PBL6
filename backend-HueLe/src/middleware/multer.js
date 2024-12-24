const multer = require("multer")
const path = require("path")

// Cấu hình lưu file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/")
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)) // Đặt tên file theo timestamp
    },
})

// Bộ lọc file (chỉ nhận ảnh)
const imageFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|bmp/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
        return cb(null, true)
    } else {
        req.fileValidationError = "Only image files are allowed!"
        cb(null, false)
    }
}

// Bộ lọc file (chỉ nhận PDF)
const pdfFilter = (req, file, cb) => {
    const filetypes = /pdf/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
        return cb(null, true)
    } else {
        req.fileValidationError = "Only PDF files are allowed!"
        cb(null, false) // Từ chối file nhưng không ném lỗi
        // return cb(new Error("Only PDF files are allowed!"), false);
    }
}

// Hàm upload file PDF
const uploadPDF = multer({
    storage: storage,
    fileFilter: pdfFilter,
})

// Middleware Multer cho upload ảnh
const upload_image = multer({
    storage: storage,
    fileFilter: imageFilter,
})

module.exports = { upload_image, uploadPDF }
