const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
const User = require('../models/User');

const AuthController = {
	// [POST] /api/auth/register
	async register(req, res) {
		const errors = validationResult(req);
		// Validate user input
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				errors: errors.array(),
			});
		}

		const { firstName, lastName, email, password } = req.body;
		const user = await User.findOne({ email: email });

		// Validate if user already exist
		if (user) {
			return res
				.status(409)
				.json({ success: false, errors: [{ email: user.email, msg: 'The user already exist' }] });
		}

		// Hash password before saving to database
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const data = {
			firstName,
			lastName,
			email,
			password: hashedPassword,
			refreshToken: '',
			avatar: '',
			address: '',
			phoneNumber: '',
			region: '',
		};

		// Save user info to database
		try {
			const newUser = new User(data);
			await newUser.save();

			const {
				_id,
				firstName,
				lastName,
				isAdmin,
				isInstructor,
				emailVerified,
				avatar,
				address,
				phoneNumber,
				region,
			} = newUser;
			// Do not include sensitive information in JWT
			const accessToken = await JWT.sign(
				{ _id, firstName, lastName, email, isAdmin, isInstructor },
				process.env.ACCESS_TOKEN_SECRET,
				{ expiresIn: '12h' }
			);

			return res.json({
				success: true,
				user: {
					_id,
					firstName,
					lastName,
					isAdmin,
					isInstructor,
					email,
					emailVerified,
					avatar,
					address,
					phoneNumber,
					region,
				},
				accessToken,
			});
		} catch (error) {
			console.log(error);
			return res.status(500).json({ success: false, errors: [{ msg: 'Internal server error' }] });
		}
	},

	// [POST] /api/auth/login
	async login(req, res) {
		const errors = validationResult(req);
		// Validate user input
		if (!errors.isEmpty())
			return res.status(400).json({
				success: false,
				errors: errors.array(),
			});

		try {
			const { email, password } = req.body;
			const user = await User.findOne({ email: email });

			// user not found
			if (!user)
				return res.status(400).json({ success: false, errors: [{ msg: 'User do not exist' }] });

			// Compare hased password with user password to see if they are valid
			const isMatch = await bcrypt.compareSync(password, user.password);

			if (!isMatch)
				return res
					.status(401)
					.json({ success: false, errors: [{ msg: 'Email or password is invalid.' }] });

			const {
				_id,
				firstName,
				lastName,
				isAdmin,
				isInstructor,
				emailVerified,
				avatar,
				address,
				phoneNumber,
				region,
			} = user;

			// Send JWT access token
			const accessToken = await JWT.sign(
				{ _id, firstName, lastName, email, isAdmin, isInstructor },
				process.env.ACCESS_TOKEN_SECRET,
				{ expiresIn: '12h' }
			);

			return res.json({
				success: true,
				user: {
					_id,
					firstName,
					lastName,
					isAdmin,
					isInstructor,
					email,
					emailVerified,
					avatar,
					address,
					phoneNumber,
					region,
				},
				accessToken,
			});
		} catch (error) {
			console.log(error);
			return res.status(500).json({ success: false, errors: [{ msg: 'Internal server error' }] });
		}
	},

	// [GET] /api/users/my-account
	async myAccount(req, res) {
		const {
			user: { _id },
		} = req;
		try {
			const user = await User.findById(_id);

			// user not found
			if (!user)
				return res.status(400).json({ success: false, errors: [{ msg: 'User do not exist' }] });

			const { firstName, lastName, email, isAdmin, isInstructor, emailVerified } = user;

			return res.json({
				success: true,
				user: {
					_id,
					firstName,
					lastName,
					isAdmin,
					isInstructor,
					email,
					emailVerified,
				},
			});
		} catch (error) {
			console.log(error);
			return res.status(500).json({ success: false, errors: [{ msg: 'Internal server error' }] });
		}
	},
};

module.exports = AuthController;
