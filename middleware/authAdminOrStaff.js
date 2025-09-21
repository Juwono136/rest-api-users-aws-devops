import User from "../models/user.js";

export const authAdminOrStaff = async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.user.id })
        // console.log(user)

        if (!user.personal_info.role.includes(1) && !user.personal_info.role.includes(2)) {
            return res.status(403).json({ message: "Access denied." });
        }

        next()
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
};