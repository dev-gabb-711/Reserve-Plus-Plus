# Reserve++ Laboratory Reservation System

## Overview
Reserve++ is an application that allows students to reserve seats at available computer laboratories at De La Salle University. This implements role-based access, allowing students to view seat availability and reserve a workstation in different computer laboratories in various buildings in campus. While administrator access supports features such as monitoring reservations, reviewing submitted tickets, and publishing global announcements. 

Currently, the application supports reservations in the Br. Andrew Gonzales Hall, Gokongwei Hall, Velasco Hall, and St. La Salle Hall.

Reserve++ is built using Node.js, Express.js, MongoDB, Mongoose, and Handlebars, following an MVC-style architecture to separate application logic, database interaction, and user interface components.

## Setup Instructions

1. **Clone the repository**
    ```bash
    git clone https://github.com/dev-gabb-711/Reserve-Plus-Plus
    cd Reserve-Plus-Plus
    ```

2. **Install dependencies**
    ```bash
    npm install express 
    npm install express-handlebars 
    npm install mongoose
    npm install multer
    ```
3. Ensure MongoDB is running

    - Make sure that MongoDB is installed and running locally before starting the application.
        Example connection used by the application:

        mongodb://localhost:27017/ReserveDB

## Running the Application

1. **Start the server**
    ```bash
    npm start
    ```

2. **Access the application**
    - Open your browser and go to `http://localhost:3000`

