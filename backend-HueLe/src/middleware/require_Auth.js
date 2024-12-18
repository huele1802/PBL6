// <<<<<<< Headers
// =======
const jwt = require("jsonwebtoken");
const User = require("../app/models/User");
const Doctor = require("../app/models/Doctor");
const Admin_Access = require("../app/models/Admin_Access");
require("dotenv").config();

class requireAuth {
  Auth_Admin = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
      return res
        .status(404)
        .json({ error: "Authorization token is required", logout: true });
    }

    const token = authorization.split(" ")[1];

    try {
      const { _id } = jwt.verify(token, process.env.JWTSecret);

      //find user by _id in admin_access
      const info = await Admin_Access.findOne({ user_id: _id }).populate(
        "user_id",
        "email"
      );

      if (!info) {
        return res
          .status(401)
          .json({ error: "Not authorized. Admin access required." });
      }

      req.user = {
        email: info.user_id.email,
        read_access: info.read_access,
        write_access: info.write_access,
        admin_write_access: info.admin_write_access,
      };

      next();
    } catch (error) {
      console.log(error);
      return res.status(401).json({ error: "Request not authorized" });
    }
  };

  Auth_Doctor = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
      return res
        .status(401)
        .json({ error: "Authorization token is required", logout: true });
    }

    const token = authorization.split(" ")[1];

    try {
      const { _id } = jwt.verify(token, process.env.JWTSecret);

      //find doctor by _id
      const info = await Doctor.findOne({ _id }).select("email");
      req.user = info.email;
      next();
    } catch (error) {
      console.log(error);
      return res.status(401).json({ error: "Request not authorized" });
    }
  };

  Auth_User = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(401).json({ error: "Authorization token is required" });
    }

    const token = authorization.split(" ")[1];

    try {
      const { _id } = jwt.verify(token, process.env.JWTSecret);

      //find user by _id
      const info = await User.findOne({ _id })
        .populate("speciality_id", "name")
        .populate("region_id", "name");
      req.user = info;
      next();
    } catch (error) {
      console.log(error);
      return res.status(401).json({ error: "Request not authorized" });
    }
  };
}
// >>>>>>> main

//   if (!authorization) {
//     return res
//       .status(404)
//       .json({ error: "Authorization token is required", logout: true });
//   }

//   const token = authorization.split(" ")[1];

//   try {
//     const { _id } = jwt.verify(token, process.env.JWTSecret);

//     //find user by _id
//     const info = await User.findOne({ _id }).select("email role");
//     if (info.role == "admin") {
//       // check if admin
//       req.user = info.email; // attach email to request through req.user
//       next();
//     } else {
//       res.status(401).json({ error: null });
//     }
//   } catch (error) {
//     console.log(error);
//     return res.status(404).json({ error: "Request not authorized" });
//   }
// };

//   Auth_Doctor = async (req, res, next) => {
//     const { authorization } = req.headers;

//     if (!authorization) {
//       return res
//         .status(401)
//         .json({ error: "Authorization token is required", logout: true });
//     }

//     const token = authorization.split(" ")[1];

//     try {
//       const { _id } = jwt.verify(token, process.env.JWTSecret);

//       //find doctor by _id
//       const info = await Doctor.findOne({ _id }).select("email");
//       req.user = info.email;
//       next();
//     } catch (error) {
//       console.log(error);
//       return res.status(404).json({ error: "Request not authorized" });
//     }
//   };

//   Auth_User = async (req, res, next) => {
//     const { authorization } = req.headers;

//     if (!authorization) {
//       return res.status(404).json({ error: "Authorization token is required" });
//     }

//     const token = authorization.split(" ")[1];

//     try {
//       const { _id } = jwt.verify(token, process.env.JWTSecret);

//       //find user by _id
//       const info = await User.findOne({ _id })
//         .populate("speciality_id", "name")
//         .populate("region_id", "name");

//       req.user = info;
//       next();
//     } catch (error) {
//       console.log(error);
//       return res.status(404).json({ error: "Request not authorized" });
//     }
//   };
// }

module.exports = new requireAuth();
