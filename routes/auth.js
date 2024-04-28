const express = require('express')
const router = express.Router()
const User = require('../models/User')
const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
var jwt = require('jsonwebtoken')
var fetchuser = require('../middleware/fetchuser')
const JWT_SECRET = 'The User is identified'
const multer = require('multer');

const Image = require('../models/Image')

router.post('/register', [
    body('name', 'Please enter a valid name').isLength({ min: 3 }),
    body('email', 'Please enter a valid email address').isEmail(),
    body('password', 'Password must be at least 5 characters').isLength({ min: 5 }),
], async (req, res) => {
    try {
        
        console.log('req bnody', req.body)
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        

        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({ success: false, error: 'A user with this email already exists' });
        }

        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        
        user = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
        });

        
        await user.save();

        
        const authToken = jwt.sign({ user: { id: user.id } }, JWT_SECRET);

        res.json({ success: true, authToken });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});



router.post('/login', [
    body("email", 'Enter a valid Email Address').isEmail(),
    body("password", 'Password cannot be blank').exists()


], async (req, res) => {
    let success = false


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


router.get('/getuser', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password');

        const image = await Image.findById(user.image)
        console.log('images', image)

        
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


const storage = multer.diskStorage({
    destination: 'uploads',
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});


const upload = multer({
    storage: storage,
    limits: {
        
        fieldSize: 1024 * 1024 * 5 
    }
}).single('testImage');

router.post('/profile/photo', async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error uploading profile photo' });
        }

        const newImage = new Image({
            
            image: {
                data: req.file,
                contentType: 'image/png',
            }
        });
        console.log('NEW IMAGES', newImage)

        await newImage.save()
            .then(async () => {
                res.send("Successfully uploaded profile photo")
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json({ message: 'Error saving profile photo to database' });
            });
    });
});

module.exports = router;

