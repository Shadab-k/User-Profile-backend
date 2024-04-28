const express = require('express')
const router = express.Router()
const User = require('../models/User')
const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
var jwt = require('jsonwebtoken')
var fetchuser = require('../middleware/fetchuser')
const JWT_SECRET = 'The User is identified'
const multer = require('multer');
// Configure multer storage
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });
const Image = require('../models/Image')


// const upload = multer({.
//     storage: multer.memoryStorage(),
//     limits: {
//         fileSize: 5 * 1024 * 1024 // 5MB file size limit
//     }
// }).single('profilePicture'); // Specify the field name for the file upload
// const Storage = multer.diskStorage({
//     destination: 'uploads',
//     filename: (req, file, cb) => {
//         cb(null, file.originalname)
//     }
// })

// const upload = multer({
//     storage: Storage
// }).single('testImage')

// Route to register a user
router.post('/register', [
    body('name', 'Please enter a valid name').isLength({ min: 3 }),
    body('email', 'Please enter a valid email address').isEmail(),
    body('password', 'Password must be at least 5 characters').isLength({ min: 5 }),
], async (req, res) => {
    try {
        // Check for validation errors
        console.log('req bnody', req.body)
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // Check if user with this email already exists

        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({ success: false, error: 'A user with this email already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // Create a new user object
        user = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
        });

        // Save the user to the database
        await user.save();

        // Generate JWT token
        const authToken = jwt.sign({ user: { id: user.id } }, JWT_SECRET);

        res.json({ success: true, authToken });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

//Route:2 Authenticate a User using POST "/api/auth/login".No login required

router.post('/login', [
    body("email", 'Enter a valid Email Address').isEmail(),
    body("password", 'Password cannot be blank').exists()


], async (req, res) => {
    let success = false
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

        const passwordCompare = await bcrypt.compare(password, user.password)
        if (!passwordCompare) {
            success = false
            return res.status(400).json({ success, error: "Please try to Login with current credentials " })

        }

        const data = {
            user: {
                id: user.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET)
        success = true
        res.json({ success, authToken })

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

        const image = await Image.findById(user.image)
        console.log('images', image)

        // Check if the user has uploaded a profile picture
        let userProfilePicture;
        if (user.image) {
            userProfilePicture = {
                data: image.toString('base64'),
                contentType: image.contentType
            };
        }
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

// Configure multer storage
const storage = multer.diskStorage({
    destination: 'uploads',
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

// Adjust the limits for field sizes
const upload = multer({
    storage: storage,
    limits: {
        // Increase the field size limit as needed
        fieldSize: 1024 * 1024 * 5 // 5MB limit
    }
}).single('testImage'); // Specify the field name for the file upload

router.post('/profile/photo', async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error uploading profile photo' });
        }

        // Check if file is uploaded
        // if (!req.file) {
        //     return res.status(400).json({ message: 'No file uploaded or invalid field name' });
        // }

        const newImage = new Image({
            // name: req.body.name,
            image: {
                data: req.file,
                contentType: 'image/png',
            }
        });
        console.log('NEW IMAGES', newImage)

        await newImage.save()
            .then(async () => {
                // const userId = req.user.id;
                // const user = await User.findByIdAndUpdate(userId, { $set: { image: newImage._id } }, { new: true })
                // note = await Note.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true })
                res.send("Successfully uploaded profile photo")
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json({ message: 'Error saving profile photo to database' });
            });
    });
});

module.exports = router;

