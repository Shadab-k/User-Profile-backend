const express = require('express')
const router = express.Router()
const User = require('../models/User')
const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
var jwt = require('jsonwebtoken')
var fetchuser=require('../middleware/fetchuser')
const JWT_SECRET = 'The User is identified'
const multer = require('multer');



// Multer configuration for handling file uploads


//Route :1 Create a User using POST "/api/auth/register".No login required


// Multer configuration for handling file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB file size limit
    }
}).single('profilePicture'); // Specify the field name for the file upload


// Route to register a user
router.post('/register', upload, [
    body('name', 'Please enter a valid name').isLength({ min: 3 }),
    body('email', 'Please enter a valid email address').isEmail(),
    body('password', 'Password must be at least 5 characters').isLength({ min: 5 }),
], async (req, res) => {
    let success = false;
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success, errors: errors.array() });
        }

        // Check if user with this email already exists
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({ success, error: 'A user with this email already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // Create a new user object
        user = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            // Save profile picture data if uploaded
            profilePicture: req.file ? {
                data: req.file.buffer,
                contentType: req.file.mimetype
            } : null
        });

        // Save the user to the database
        await user.save();

        // Generate JWT token
        const authToken = jwt.sign({ user: { id: user.id } }, JWT_SECRET);

        success = true;
        res.json({ success, authToken });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});

//Route:2 Authenticate a User using POST "/api/auth/login".No login required

router.post('/login', [
    body("email", 'Enter a valid Email Address').isEmail(),
    body("password", 'Password cannot be blank').exists()


], async (req, res) => {
    let success=false
    //if there are error return bad request and the errors

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body
    try {
        let user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ error: "Please try to Login with current credentials " })
        }

        const passwordCompare= await bcrypt.compare(password, user.password)
        if(!passwordCompare){
            success=false
            return res.status(400).json({ success, error: "Please try to Login with current credentials " })

        }

        const data={
            user:{
                id: user.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET)
        success=true
        res.json({success,authToken})

    } catch (error) {
        console.error(error.message)
        res.status(500).send("Internal Server Error ")
    }
})

////Route:3 Get loggedIn user details using POST "/api/auth/getuser". login required
router.get('/getuser', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password');

        // Check if the user has uploaded a profile picture
        let userProfilePicture;
        if (user.profilePicture && user.profilePicture.data) {
            userProfilePicture = {
                data: user.profilePicture.data.toString('base64'),
                contentType: user.profilePicture.contentType
            };
        }

        // Return user data along with profile picture, if available
        res.json({
            user: user,
            profilePicture: userProfilePicture
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});


// Route handler to upload user profile photo
router.post('/profile/photo', upload, async (req, res) => {
    try {
        // Check if file was uploaded successfully
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        // Get the user ID from request (assuming you're using some form of authentication)
        const userId = req.userId; // You should implement this

        // Save the file information to the user profile in MongoDB
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Save image data to user profile
        user.profilePicture = {
            data: req.file.buffer,
            contentType: req.file.mimetype
        };
        await user.save();

        // Send the image along with success message
        res.status(200).json({
            message: 'Profile picture uploaded successfully',
            profilePicture: {
                data: req.file.buffer.toString('base64'),
                contentType: req.file.mimetype
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;

