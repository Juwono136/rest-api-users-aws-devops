import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import User from "../models/user.js";
import { userSendMail } from "./userSendMail.js";

const { DEFAULT_CLIENT_URL } = process.env;

// signup
export const signUp = async (req, res) => {
  try {
    const {
      binusian_id,
      name,
      email,
      program,
      address,
      phone,
      password,
      confirmPassword,
      client_url,
    } = req.body;

    if (!binusian_id || !name || !email || !address || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    if (name.length < 3) {
      return res.status(400).json({ message: "Your name must be at least 3 letters long" });
    }

    if (address.length < 6) {
      return res
        .status(400)
        .json({ message: "Your address is too short (at least 6 letters long)." });
    }

    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({
        message: "Invalid phone number format. Only digits and symbols like + - ( ) are allowed.",
      });
    }

    if (!isMatch(password, confirmPassword)) {
      return res.status(400).json({ message: "Password did not match" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message:
          "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letter",
      });
    }

    const isBinusEmail = validateBinusEmail(email);

    if (isBinusEmail) {
      // BINUS email must have both binusian_id and program
      if (!binusian_id || !program || program.trim() === "") {
        return res.status(400).json({
          message: "Please fill in all fields",
        });
      }
    } else {
      // Non-BINUS email must have binusian_id (can be other ID), and must NOT fill in program
      if (!binusian_id) {
        return res.status(400).json({
          message: "Please fill in all fields",
        });
      }

      if (program && program.trim() !== "") {
        return res.status(400).json({
          message: "Invalid Credentials",
        });
      }
    }

    const user = await User.findOne({
      $or: [{ "personal_info.email": email }, { "personal_info.binusian_id": binusian_id }],
    });

    if (user && user.personal_info.role.includes(0)) {
      return res.status(400).json({ message: "This account already exists." });
    }

    if (user && user.personal_info.status === "inactive") {
      return res
        .status(403)
        .json({ message: "Your account is inactive. Please contact admin to reactivate." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = {
      personal_info: {
        binusian_id,
        name,
        email,
        address,
        phone,
        program: program || null,
        password: passwordHash,
      },
    };

    const activation_token = createActivationToken(newUser);

    const url = `${client_url || DEFAULT_CLIENT_URL}/user/activate/${activation_token}`;

    userSendMail(email, url, "Verify your email address", "Confirm Email");

    res.json({ message: "Register Success! Please activate your email to start" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// email activation
export const activateEmail = async (req, res) => {
  try {
    const { activation_token } = req.body;
    const user = jwt.verify(activation_token, process.env.ACTIVATION_TOKEN_SECRET);

    const { binusian_id, name, email, address, phone, program, password } = user.personal_info;

    const existingUser = await User.findOne({ "personal_info.email": email });
    // if (check) return res.status(400).json({ message: "This email already exists" })

    if (existingUser && existingUser.personal_info.role.includes(0)) {
      return res.status(400).json({ message: "This email already exists." });
    }

    if (existingUser) {
      if (!existingUser.personal_info.role.includes(0)) {
        existingUser.personal_info.role.push(0);
        await existingUser.save();
      }
      return res.json({ message: "Account has been activated. Please login now!" });
    }

    const newUser = new User({
      "personal_info.binusian_id": binusian_id,
      "personal_info.name": name,
      "personal_info.email": email,
      "personal_info.address": address,
      "personal_info.phone": phone,
      "personal_info.program": program,
      "personal_info.password": password,
      "personal_info.role": [0],
    });

    await newUser.save();

    res.json({ message: "Account has been activated. Please login now!" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// singin
export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ "personal_info.email": email });

    if (!email || !password) return res.status(400).json({ message: "Please fill in all fields" });

    if (!user) return res.status(400).json({ message: "Invalid Credentials" });

    if (user.personal_info.status === "inactive") {
      return res
        .status(403)
        .json({ message: "Your account is inactive. Please contact admin to reactivate." });
    }

    const isMatch = await bcrypt.compare(password, user.personal_info.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

    const roles = user.personal_info.role;

    const refresh_token = createRefreshToken({ id: user._id });
    const expiry = 24 * 60 * 60 * 1000; // 1 day

    res.cookie("refreshtoken", refresh_token, {
      httpOnly: true,
      path: "/api/user/refresh_token",
      maxAge: expiry,
      expires: new Date(Date.now() + expiry),
    });

    // if user only has 1 role
    if (roles.length === 1) {
      res.json({
        message: `🖖Welcome, ${user.personal_info.name.split(" ").slice(0, 2).join(" ")}`,
        selectedRole: roles[0],
        userRoles: roles,
      });
    } else {
      // if user has more than 1 roles
      res.json({
        message: "Please select your role.",
        roleSelectionRequired: true,
        role: roles,
        id: user._id,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// add new user by Admin
export const addUserByAdmin = async (req, res) => {
  try {
    const { binusian_id, name, email, program, address, phone, role, client_url } = req.body;

    if (!binusian_id || !name || !email || !address || !phone || !role) {
      return res.status(400).json({ message: "Please fill in all required fields" });
    }

    if (name.length < 3) {
      return res.status(400).json({ message: "Name must be at least 3 letters long" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({
        message: "Invalid phone number format. Only digits and symbols like + - ( ) are allowed.",
      });
    }

    if (address.length < 6) {
      return res
        .status(400)
        .json({ message: "Your address is too short (at least 6 letters long)." });
    }

    if (!Array.isArray(role) || role.length === 0) {
      return res.status(400).json({ message: "Role must be a non-empty array." });
    }

    const isBinusEmail = validateBinusEmail(email);

    if (isBinusEmail) {
      // BINUS email must have both binusian_id and program
      if (!binusian_id || !program || program.trim() === "") {
        return res.status(400).json({
          message: "Please fill in all fields",
        });
      }
    } else {
      // Non-BINUS email must have binusian_id (can be other ID), and must NOT fill in program
      if (!binusian_id) {
        return res.status(400).json({
          message: "Please fill in all fields",
        });
      }

      if (program && program.trim() !== "") {
        return res.status(400).json({
          message: "Invalid Credentials",
        });
      }
    }

    const user = await User.findOne({
      $or: [{ "personal_info.email": email }, { "personal_info.binusian_id": binusian_id }],
    });

    if (user) {
      return res.status(400).json({ message: "This account already exists." });
    }

    const randomPassword = nanoid(16);
    const passwordHash = await bcrypt.hash(randomPassword, 12);

    const newUser = new User({
      personal_info: {
        binusian_id,
        name,
        email,
        address,
        phone,
        program: program || null,
        password: passwordHash,
        role,
        status: "active",
      },
    });

    await newUser.save();

    const access_token = createAccessToken({ id: newUser._id });
    const url = `${client_url || DEFAULT_CLIENT_URL}/user/reset/${access_token}`;

    userSendMail(
      email,
      url,
      "Admin of InventorCS has created an account for you",
      "Register my account"
    );

    res.json({
      message: `A new user with name '${name}' created successfully. An email registration has been sent to the user.`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// select role
export const selectRole = async (req, res) => {
  try {
    const { userId, selectedRole } = req.body;

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found." });

    if (!user.personal_info.role.includes(selectedRole)) {
      return res.status(400).json({ message: "Invalid role selection" });
    }

    res.json({
      message: `🖖Welcome, ${user.personal_info.name}`,
      selectedRole,
      userRoles: user.personal_info.role,
      id: user.id,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// get access token
export const getAccessToken = async (req, res) => {
  try {
    const rf_token = req.cookies.refreshtoken;

    if (!rf_token) return res.status(400).json({ message: "Please login now!" });

    jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) return res.status(400).json({ message: "Please login now!" });

      const access_token = createAccessToken({ id: user.id });
      res.json({ access_token });
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email, client_url } = req.body;
    const user = await User.findOne({ "personal_info.email": email });

    if (!email) return res.status(400).json({ message: "Please fill your email" });

    if (!validateEmail(email)) return res.status(400).json({ message: "Invalid emails" });
    if (!user) return res.status(400).json({ message: "This email doesn't exist" });

    const access_token = createAccessToken({ id: user._id });
    const url = `${client_url || DEFAULT_CLIENT_URL}/user/reset/${access_token}`;

    userSendMail(email, url, "Reset your account", "Reset Password");
    res.json({ message: "Please check your email for reset" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// reset password
export const resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!validatePassword(password))
      return res.status(400).json({
        message:
          "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters",
      });

    if (!isMatch(password, confirmPassword))
      return res.status(400).json({ message: "Password did not match" });

    const passwordHash = await bcrypt.hash(password, 12);

    await User.findOneAndUpdate(
      { _id: req.user.id },
      {
        "personal_info.password": passwordHash,
      }
    );

    res.json({ message: "Password successfully changed. Please login" });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

// get user infor
export const getUserInfor = async (req, res) => {
  try {
    const userInfor = await User.findById(req.user.id).select("-personal_info.password");

    res.json(userInfor);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// get user infor by Id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-personal_info.password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// get staff id for notification
export const getUserStaff = async (req, res) => {
  try {
    const staffUsers = await User.find(
      { "personal_info.role": { $in: [2] } },
      "_id personal_info.email personal_info.program"
    ).exec();

    if (!staffUsers || staffUsers.length === 0) {
      return res.status(404).json({ message: "No staff found." });
    }

    return res.status(200).json(staffUsers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// get all user info
export const getAllUsersInfor = async (req, res) => {
  try {
    const page = parseInt(req.query.page) - 1 || 0;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    let sort = req.query.sort || "personal_info.name";
    let program = req.query.program || "All";
    const all = req.query.all === "true";

    const programOptions = [
      "Business Information Systems",
      "Business Management & Marketing",
      "Communications",
      "Computer Science",
      "Finance International Program",
      "International Business",
      "Graphic Design and New Media",
      "Digital Business",
      "Overseas Program",
      "Other Program",
    ];

    program === "All" ? (program = [...programOptions]) : (program = req.query.program.split(","));

    // Sort by field and order
    req.query.sort ? (sort = req.query.sort.split(",")) : (sort = [sort]);

    let sortBy = {};
    if (sort[1]) {
      sortBy[sort[0]] = sort[1];
    } else {
      sortBy[sort[0]] = "asc";
    }

    // Define a mapping for role strings to role numbers
    const roleMapping = {
      user: [0, 5],
      admin: [1, 3],
      staff: [2, 4],
    };

    let searchQuery = {
      "personal_info.program": { $in: [...program] },
    };

    // Check if search matches role strings
    const roleSearch = roleMapping[search.toLowerCase()];
    if (roleSearch !== undefined) {
      searchQuery["personal_info.role"] = { $in: roleSearch };
    } else {
      searchQuery.$or = [
        { "personal_info.name": { $regex: search, $options: "i" } },
        { "personal_info.email": { $regex: search, $options: "i" } },
        { "personal_info.program": { $regex: search, $options: "i" } },
        { "personal_info.binusian_id": { $regex: search, $options: "i" } },
      ];
    }

    // Fetch all users if `all` is true
    let users;
    if (all) {
      users = await User.find(searchQuery).select("-personal_info.password").lean();
    } else {
      users = await User.find(searchQuery)
        .select("-personal_info.password")
        .sort(sortBy)
        .skip(page * limit)
        .limit(limit)
        .lean();
    }

    const totalUsers = await User.countDocuments(searchQuery);
    const totalPage = all ? 1 : Math.ceil(totalUsers / limit);

    const response = {
      totalUsers,
      totalPage,
      page: all ? 1 : page + 1,
      limit: all ? totalUsers : limit,
      program: programOptions,
      users,
    };

    res.json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// update user info
export const updateUser = async (req, res) => {
  try {
    const {
      address,
      phone,
      bio,
      program,
      name,
      avatar,
      password,
      confirm_password,
      youtube,
      instagram,
      facebook,
      twitter,
      github,
      website,
    } = req.body;

    if (password) {
      if (password && password !== confirm_password)
        return res.status(400).json({ message: "Password did not match" });

      if (!validatePassword(password))
        return res.status(400).json({
          message:
            "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters",
        });
    }

    if (name.length < 3)
      return res.status(400).json({ message: "Your name must be at least 3 letters long" });

    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({
        message: "Invalid phone number format. Only digits and symbols like + - ( ) are allowed.",
      });
    }

    if (name === "") return res.status(400).json({ message: "Name cannot be empty" });

    const updateFields = {
      "personal_info.address": address,
      "personal_info.phone": phone,
      "personal_info.name": name,
      "personal_info.bio": bio,
      "personal_info.program": program,
      "personal_info.avatar": avatar,
      "social_links.youtube": youtube,
      "social_links.instagram": instagram,
      "social_links.facebook": facebook,
      "social_links.twitter": twitter,
      "social_links.github": github,
      "social_links.website": website,
    };

    if (password) {
      const passwordHash = await bcrypt.hash(password, 12);
      updateFields["personal_info.password"] = passwordHash;
    }

    const updatedUser = await User.findOneAndUpdate({ _id: req.user.id }, updateFields, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      updatedUser,
      message: "Update user success",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// update user role
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    // input role validation
    if (!Array.isArray(role)) {
      return res.status(400).json({ message: "Role must be an array" });
    }

    const validRoles = [0, 1, 2];
    if (role.some((r) => !validRoles.includes(r))) {
      return res.status(400).json({ message: "Invalid user role found in the array" });
    }

    if (role.length < 1) {
      return res.status(400).json({ message: "Invalid user role" });
    }

    if (role.length > 3) {
      return res.status(400).json({ message: "User can only have a maximum of 3 roles" });
    }

    // search and update the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // replace the old role array with the new one
    user.personal_info.role = Array.from(new Set(role));

    const updatedUser = await user.save();

    res.json({
      message: "User roles updated",
      role: updatedUser.personal_info.role,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// update user status
export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ["active", "inactive"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid user status" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.params.id },
      {
        "personal_info.status": status,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User status updated" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// User logout
export const logout = async (req, res) => {
  try {
    res.clearCookie("refreshtoken", { path: "api/user/refresh_token" });
    return res.json({ message: "Logged out success" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// delete user permanently
// export const deleteUser = async (req, res) => {
//     try {
//         const user = await User.findByIdAndDelete(req.params.id)

//         if (!user) {
//             return res.status(404).json({ message: "User not found" })
//         }

//         res.json({ message: "Delete user success" })
//     } catch (error) {
//         return res.status(500).json({ message: error.message })
//     }
// }

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

function validateBinusEmail(email) {
  const re = /@binus\.edu$|@binus\.ac\.id$/;
  return re.test(email);
}

function validatePassword(password) {
  const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
  return re.test(password);
}

function isMatch(password, confirm_password) {
  if (password === confirm_password) return true;
  return false;
}

function validatePhoneNumber(phone) {
  const re = /^[0-9+\-\s()]+$/;
  return re.test(phone);
}

function createRefreshToken(payload) {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "1d" });
}

function createAccessToken(payload) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
}

function createActivationToken(payload) {
  return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, { expiresIn: "15m" });
}
