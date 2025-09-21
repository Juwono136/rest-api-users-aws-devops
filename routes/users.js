import express from "express";
import {
  activateEmail,
  addUserByAdmin,
  forgotPassword,
  getAccessToken,
  getAllUsersInfor,
  getUserById,
  getUserInfor,
  getUserStaff,
  logout,
  resetPassword,
  selectRole,
  signIn,
  signUp,
  updateUser,
  updateUserRole,
  updateUserStatus,
} from "../controllers/users.js";
import { auth } from "../middleware/auth.js";
import { authAdmin } from "../middleware/authAdmin.js";
import { authAdminOrStaff } from "../middleware/authAdminOrStaff.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: User related operations
 */

/**
 * @openapi
 * /signup:
 *   post:
 *     tags:
 *       - Users
 *     summary: Sign up a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               binusian_id:
 *                 type: string
 *                 example: "123456"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john.doe@example.com"
 *               address:
 *                 type: string
 *                 example: "FX Campus, Senayan, Jakarta"
 *               phone:
 *                 type: string
 *                 example: "+62896322873830"
 *               password:
 *                 type: string
 *                 example: "Password123"
 *               confirmPassword:
 *                 type: string
 *                 example: "Password123"
 *     responses:
 *       '200':
 *         description: Registration successful
 *       '403':
 *         description: Requested resource is forbidden
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Internal server error
 */
router.post("/signup", signUp);

/**
 * @openapi
 * /activation:
 *   post:
 *     tags:
 *       - Users
 *     summary: Activate user email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activation_token:
 *                 type: string
 *                 example: "your_activation_token"
 *     responses:
 *       '200':
 *         description: Activation successful
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Internal server error
 */
router.post("/activation", activateEmail);

/**
 * @openapi
 * /signin:
 *   post:
 *     tags:
 *       - Users
 *     summary: Sign in a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 example: "Password123"
 *     responses:
 *       '200':
 *         description: Sign in successful
 *       '403':
 *         description: Requested resource is forbidden
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Internal server error
 */
router.post("/signin", signIn);

/**
 * @openapi
 * /select-role:
 *   post:
 *     tags:
 *       - Users
 *     summary: Select user role after login (if user has more than 1 roles)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               selectedRole:
 *                 type: integer
 *     responses:
 *       '200':
 *         description: Role selected successful
 *       '404':
 *         description: Not Found
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Internal server error
 */
router.post("/select-role", selectRole);

/**
 * @openapi
 * /refresh_token:
 *   post:
 *     tags:
 *       - Users
 *     summary: Refresh access token
 *     responses:
 *       '200':
 *         description: Token refreshed
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Internal server error
 */
router.post("/refresh_token", getAccessToken);

/**
 * @openapi
 * /forgot:
 *   post:
 *     tags:
 *       - Users
 *     summary: Request password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john.doe@example.com"
 *     responses:
 *       '200':
 *         description: Password reset email sent
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Internal server error
 */
router.post("/forgot", forgotPassword);

/**
 * @openapi
 * /reset:
 *   post:
 *     tags:
 *       - Users
 *     summary: Reset user password (need auth)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 example: "NewPassword123"
 *               confirmPassword:
 *                 type: string
 *                 example: "NewPassword123"
 *     responses:
 *       '200':
 *         description: Password reset successful
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Internal server error
 */
router.post("/reset", auth, resetPassword);

/**
 * @openapi
 * /add_user_by_admin:
 *   post:
 *     tags:
 *       - Users
 *     summary: Add new user by admin (need auth)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               binusian_id:
 *                 type: string
 *                 example: "123456"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john.doe@example.com"
 *               address:
 *                 type: string
 *                 example: "FX Campus, Senayan, Jakarta"
 *               phone:
 *                 type: string
 *                 example: "+62896322873830"
 *               program:
 *                 type: string
 *                 example: "Computer Science"
 *               role:
 *                 type: array
 *                 example: [0, 2]
 *     responses:
 *       '200':
 *         description: New User successful added by Admin
 *       '403':
 *         description: Requested resource is forbidden
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Internal server error
 */
router.post("/add_user_by_admin", auth, authAdmin, addUserByAdmin);

/**
 * @openapi
 * /user_infor:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user information (need auth)
 *     responses:
 *       '200':
 *         description: User information retrieved
 *       '403':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */
router.get("/user_infor", auth, getUserInfor);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user information by user ID (need auth)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: User information retrieved By ID
 *       '404':
 *         description: User Not Found
 *       '500':
 *         description: Internal server error
 */
router.get("/users/:id", auth, getUserById);

/**
 * @openapi
 * /get_staffs:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users staff (need auth)
 *     responses:
 *       '200':
 *         description: get all users staff successfully
 *       '404':
 *         description: User Not Found
 *       '500':
 *         description: Internal server error
 */
router.get("/get_staffs", auth, getUserStaff);

/**
 * @openapi
 * /all_infor:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users information (need auth)
 *     responses:
 *       '200':
 *         description: All users information retrieved
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */
router.get("/all_infor", auth, authAdminOrStaff, getAllUsersInfor);

/**
 * @openapi
 * /logout:
 *   get:
 *     tags:
 *       - Users
 *     summary: Logout user
 *     responses:
 *       '200':
 *         description: User logged out
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */
router.get("/logout", logout);

/**
 * @openapi
 * /update_user:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update user information (need auth)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               program:
 *                 type: string
 *                 example: "Computer Science"
 *               address:
 *                 type: string
 *                 example: "Senayan Campus"
 *               phone:
 *                 type: string
 *                 example: "089123456789"
 *               bio:
 *                 type: string
 *                 example: "Your bio"
 *               avatar:
 *                 type: string
 *                 example: "URL link for user's image"
 *               password:
 *                 type: string
 *                 example: "NewPassword123"
 *               confirm_password:
 *                 type: string
 *                 example: "NewPassword123"
 *               youtube:
 *                 type: string
 *               instagram:
 *                 type: string
 *               facebook:
 *                 type: string
 *               twitter:
 *                 type: string
 *               github:
 *                 type: string
 *               website:
 *                 type: string
 *     responses:
 *       '200':
 *         description: User information updated
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Internal server error
 */
router.patch("/update_user", auth, updateUser);

/**
 * @openapi
 * /update_role/{id}:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update user role (need auth)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       '200':
 *         description: User role updated
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Internal server error
 */
router.patch("/update_role/:id", auth, authAdmin, updateUserRole);

/**
 * @openapi
 * /update_user_status/{id}:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Change the status of a user (e.g., active, inactive)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: "active or inactive"
 *     responses:
 *       '200':
 *         description: User status updated successfully
 *       '400':
 *         description: Bad request
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
 */
router.patch("/update_user_status/:id", auth, authAdmin, updateUserStatus);

// /**
//  * @openapi
//  * /delete/{id}:
//  *   delete:
//  *     tags:
//  *       - Users
//  *     summary: Delete a user
//  *     parameters:
//  *       - name: id
//  *         in: path
//  *         required: true
//  *         description: User ID
//  *         schema:
//  *           type: string
//  *     responses:
//  *       '200':
//  *         description: User deleted
//  *       '400':
//  *         description: Bad request
//  *       '500':
//  *         description: Internal server error
//  */
// router.delete("/delete/:id", auth, authAdmin, deleteUser)

export default router;
