import swaggerJsDoc from "swagger-jsdoc";
import dotenv from "dotenv";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: apiKey
 *       in: header
 *       name: Authorization
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - binusian_id
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         _id:
 *           type: object
 *           properties:
 *             $oid:
 *               type: string
 *               description: Unique identifier for the user
 *         personal_info:
 *           type: object
 *           properties:
 *             binusian_id:
 *               type: string
 *               description: User's Binusian ID or Personal ID Number
 *             name:
 *               type: string
 *               description: Full name of the user
 *             email:
 *               type: string
 *               format: email
 *               description: Email address of the user
 *             password:
 *               type: string
 *               description: Hashed password of the user
 *             program:
 *               type: string
 *               description: User's academic program or If the user is not a Binusian, then they do not need to fill in the program
 *             address:
 *               type: string
 *               description: User's address
 *             phone:
 *               type: string
 *               description: User's phone number
 *             bio:
 *               type: string
 *               description: Short biography of the user
 *             role:
 *               type: array
 *               items:
 *                  type: integer
 *               description: Role of the user (e.g., 0 for user, 1 for admin, 2 for staff, etc)
 *             avatar:
 *               type: string
 *               description: URL or base64 format to the user's avatar or image
 *             status:
 *               type: string
 *               description: Change user status (active or inactive)
 *         socialLinks:
 *           type: object
 *           properties:
 *             youtube:
 *               type: string
 *               description: YouTube link of the user
 *             instagram:
 *               type: string
 *               description: Instagram link of the user
 *             facebook:
 *               type: string
 *               description: Facebook link of the user
 *             twitter:
 *               type: string
 *               description: Twitter link of the user
 *             github:
 *               type: string
 *               description: GitHub link of the user
 *             website:
 *               type: string
 *               description: Personal website of the user
 *         joinedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the user joined
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last date when the user's information was updated
 *       example:
 *         _id:
 *           $oid: "uniqueKeyUser"
 *         personal_info:
 *           address: "FX Campus, Senayan, Jakarta"
 *           phone: "089123456789"
 *           bio: "Test my bio updated with hello world. This is awesome bio!"
 *           role: [0]
 *           binusian_id: "BN123456"
 *           name: "john doe"
 *           email: "johndoe@gmail.com"
 *           password: "securePassword"
 *           avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Toby"
 *           program: "Computer Science"
 *           status: "active"
 *         social_links:
 *           youtube: https://youtube.com/johndoe
 *           instagram: https://instagram.com/johndoe
 *           facebook: https://facebook.com/johndoe
 *           twitter: https://twitter.com/johndoe
 *           github: https://github.com/johndoe
 *           website: https://johndoe.com
 *         joinedAt: "2024-08-07T07:20:10.250Z"
 *         updatedAt: "2024-09-10T16:27:44.578Z"
 *
 */

const swaggerSpec = swaggerJsDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User Management API",
      version: "1.0.0",
      description:
        "API for managing users, including registration, login, and profile updates. This API is only used for internal application of the Computer Science program, Binus University International.",
    },
    servers: [
      {
        url: "http://localhost:5000/api/user",
        description: "Development",
      },
      {
        url: "https://portproject.my.id/api/user",
        description: "Production",
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, "..", "routes", "*.js"),
    path.join(__dirname, "..", "routes", "*.ts"),
    path.join(__dirname, "swagger.js"),
    path.join(__dirname, "swagger.ts"),
  ],
});

export default swaggerSpec;
