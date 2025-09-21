# User Management API
![users-rest-api](https://github.com/user-attachments/assets/9523d3ec-3f15-47d3-b4fd-61ffa90cd328)

API for managing users including registration, login, profile updates, and role-based access, etc. Built with Node.js, Express.js, MongoDB/Mongoose, and documented via Swagger. Designed for internal usage (Computer Science program, BINUS University International), but portable to any environment.

- **Production base URL**: https://csbi-users.csbihub.id/api/user
- **Development base URL**: http://localhost:5000/api/user

> *Swagger is configured in `utils/swagger.js` and points at the base paths above.*

## 🧑‍💻 Tech Stack
- Runtime: Node.js
- Framework: Express.js
- Database & ODM: MongoDB with Mongoose
- Auth: JSON Web Tokens (JWT), bcrypt
- Docs: Swagger (OpenAPI 3) via swagger-jsdoc + swagger-ui-express
- Security: helmet, cors, cookie-parser, dompurify + jsdom
- Email: nodemailer
- Dev Tooling: nodemon, dotenv
- CI/CD and Deployment: GitHub Actions and Cloudflare Tunnel
- Containerization: Docker

> See package.json for full dependency list.

## ✨ Features
- User registration & authentication
  - Passwords hashed with `bcrypt`
  - JWT-based authentication (Bearer tokens)
- Role-based access with flexible role array:
  - 0 = user
  - 1 = admin
  - 2 = staff
  - etc...
- Profile management
  - Personal Info: binusian_id, name, email, password, address, phone, bio, role, avatar, status
  - Social Links: YouTube, Instagram, Facebook, Twitter, GitHub, Website
- Security
  - `helmet` for HTTP headers
  - `cors` with configurable origins
  - `cookie-parser` for cookie usage
  - Input sanitization via `dompurify` + `jsdom`
- Email Support
  - Verification & notification emails via `nodemailer`
- API Documentation
  - OpenAPI 3 with `swagger-jsdoc` + `swagger-ui-express`
- Developer Friendly
  - .env config via `dotenv`
  - Hot reload with `nodemon`
  - Docker-ready
  - CI/CD via GitHub Actions

## 🏗️ System Architecture
<img width="3840" height="2660" alt="user rest api flowchart _ Mermaid Chart-2025-08-20-121535" src="https://github.com/user-attachments/assets/b3eb4fb7-8694-489e-9311-fbbc31c6499b" />

### UML (Unified Modelling Language) Diagram
- **Use Case Diagram**:
![primary-use-case](https://github.com/user-attachments/assets/196c5457-6615-4c95-b15e-51a8705b63ab)

- **Class Diagram**:
<img width="3689" height="3840" alt="class diagram - user rest api _ Mermaid Chart-2025-08-20-151030" src="https://github.com/user-attachments/assets/b01d25a7-e39d-4988-b7be-1216f170e1d4" />

- **Activity and Sequence Diagram**: [Click here](https://github.com/Juwono136/REST_API_BUI_users_auth/tree/master/docs/use-case-model-images)
- **Use Case Model Document Report**: [Click here](https://github.com/Juwono136/REST_API_BUI_users_auth/blob/master/docs/user-management-api_use-case-model-report.pdf)

## 📍 API Endpoint
<img width="1920" height="1823" alt="image" src="https://github.com/user-attachments/assets/9fbe15fd-71ac-48f9-baf1-e2967d12b225" />

## 💻 System Requirements
- NodeJS v18 or above
- npm v9 or above
- MongoDB v6 or above

## 📥 Installation and Setup
### 1. Clone Repository
```bash
git clone https://github.com/Juwono136/REST_API_BUI_users_auth
cd user-management-api
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment
Create `.env` file in project root:
```bash
PORT = 5000
CONNECTION_URL = MONGODB_URI
DB_NAME = YOUR_DABATASE_NAME
DEFAULT_CLIENT_URL = http://localhost:5173 #DEFAULT PORT (VITE)
INTERNET_SERVER =  http://localhost:SERVER_PORT
NODE_ENV = production # OR DEVELOPMENT

REFRESH_TOKEN_SECRET = YOUR_REFRESH_TOKEN_SECRET
ACCESS_TOKEN_SECRET = YOUR_ACCESS_TOKEN_SECRET
ACTIVATION_TOKEN_SECRET = YOUR_ACTIVATION_TOKEN_SECRET
DOCKER_USERNAME = YOUR_DOCKER_HUB_USERNAME
DOCKER_PASSWORD = YOUR_DOCKER_HUB_PASSWORD
TUNNEL_NAME = YOUR_TUNNEL_NAME #CLOUDFLARE

EMAIL_USER = YOUR_EMAIL_HOST
EMAIL_PASSWORD = YOUR_GENERATE_TOKEN_PASSWORD
```

### 4. CI/CD Pipeline for Deployment
<img width="758" height="318" alt="Users Rest API - CICD Pipeline" src="https://github.com/user-attachments/assets/f82fdc30-fd96-42c1-abb6-ee87d96dea28" />

- Setting up GitHub Actions Runner on a remote server as a [self-hosted](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/configure-the-application)
- Deploy application using Docker (Dockerfile)
```bash
# Base image
FROM node:alpine3.20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install

# Copy application files
COPY . .

# Expose the application port (server_port)
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]
```
- Save all secret variables from the .env file into GitHub Actions "Secrets and variables".
- Create a CI/CD Pipeline in the project folder (`.github/workflows/cicd.yml`)
```bash
name: CI/CD Pipeline RestAPI Users

on:
  push:
    branches:
      - master
    paths-ignore:
      - "README.md"
  pull_request:
    branches:
      - master

jobs:
  continuous-integration:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Login to Docker Hub
        run: docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}

      - name: Build Docker Image
        run: docker build -t juwono136/restapi-users  .

      - name: Publish Image to Docker Hub
        run: docker push juwono136/restapi-users:latest

  continuous-deployment:
    needs: continuous-integration
    runs-on: self-hosted
    steps:
      - name: Pull image from docker hub
        run: docker pull juwono136/restapi-users:latest

      - name: Stop and Delete Old Container
        run: |
          docker stop restapi-users-container || true
          docker rm restapi-users-container || true

      - name: Run Docker Container
        run: |
          docker run -d \
            -p 5000:5000 \
            --name restapi-users-container \
            --restart always \
            -e PORT=${{ secrets.PORT }} \
            -e CONNECTION_URL='${{ secrets.CONNECTION_URL }}' \
            -e DB_NAME='${{ secrets.DB_NAME }}' \
            -e DEFAULT_CLIENT_URL='${{ secrets.DEFAULT_CLIENT_URL }}' \
            -e INTERNET_SERVER='${{ secrets.INTERNET_SERVER }}' \
            -e NODE_ENV='${{ secrets.NODE_ENV }}' \
            -e REFRESH_TOKEN_SECRET='${{ secrets.REFRESH_TOKEN_SECRET }}' \
            -e ACCESS_TOKEN_SECRET='${{ secrets.ACCESS_TOKEN_SECRET }}' \
            -e ACTIVATION_TOKEN_SECRET='${{ secrets.ACTIVATION_TOKEN_SECRET }}' \
            -e EMAIL_USER='${{ secrets.EMAIL_USER }}' \
            -e EMAIL_PASSWORD='${{ secrets.EMAIL_PASSWORD }}' \
            juwono136/restapi-users

      - name: Add Container to Tunnel
        run: docker network connect ${{secrets.TUNNEL_NAME}} restapi-users-container
```
- Push the project to Github repository as usual.
- Check the Actions tab in the GitHub repository to see the deployment process.

## 🌐 Swagger API Docs
API Documentation is available at: https://csbi-users.csbihub.id/users/api-docs/

## 🔐 Security Best Practices
- Strong password hashing with bcrypt
- JWT expiration & refresh token flow
- Input sanitization to prevent XSS
- CORS configured for trusted domains only
- Helmet middleware for secure HTTP headers

## 📂 Project Structure
<img width="252" height="761" alt="image" src="https://github.com/user-attachments/assets/afb9438a-fef5-4c82-8c43-cc9db6dfd961" />

## 🚀 Future Improvements
- Two-factor authentication (2FA)
- Refresh token rotation & revocation
- GraphQL support

## 🤝 Contributing
This project his open to contributions! (especially for Binusian Students)  

- Found a bug? [Open an issue](https://github.com/Juwono136/REST_API_BUI_users_auth/issues).  
- Have an idea? [Suggest it here](https://github.com/Juwono136/REST_API_BUI_users_auth/issues).  
- Want to help with code? See the [Contributing Guide](CONTRIBUTING.md).  

Every little bit helps — thanks for supporting this project 💜

## 🖖 Project Members
- Juwono (https://github.com/Juwono136)
- Ida Bagus Kerthyayana Manuaba (https://github.com/bagzcode)



