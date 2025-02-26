/** @format */
//importing mongoose schema for campgrounds
const Campground = require('../models/campground');
const { cloudinary } = require('../utils/cloudinary');

//setting mapbox geocoding
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geoCoder = mbxGeocoding({ accessToken: mapBoxToken });

//modules are imported in /routes/campgrouds.js

module.exports.renderCampListPage = async (req, res) => {
	//finding all campground in db
	const campgrounds = await Campground.find({});

	//render page with all campgrounds
	res.render('campgrounds/index', { campgrounds });
};

module.exports.renderNewCampForm = (req, res) => {
	res.render('campgrounds/new');
};

module.exports.createNewCamp = async (req, res, next) => {
	//sending request for lon and lat for camp location
	const geoData = await geoCoder
		.forwardGeocode({
			query: req.body.campground.location,
			limit: 1,
		})
		.send();

	//new campground with data from from
	const camp = new Campground(req.body.campground);

	//adding geocoding data to campground
	camp.geometry = geoData.body.features[0].geometry;

	//adding images data from cloudinary through multer
	camp.images = req.files.map((file) => ({
		url: file.path,
		filename: file.filename,
	}));
	//assigning logged in user as a creator of campground (req.user added by passport.authenticate() in routes users.js)
	camp.author = req.user._id;
	console.log(camp);
	//saving new camp to db
	await camp.save();

	//flash msq
	req.flash('success', 'New Campground Added');
	res.redirect(`/campgrounds/${camp._id}`);
};

module.exports.renderCampDetailsPage = async (req, res) => {
	const { id } = req.params;

	//finding campground in db by it id - id come from url (req.params)
	//populating reviews data and author
	const camp = await Campground.findById(id)
		.populate({
			path: 'reviews',
			populate: {
				path: 'author',
			},
		})
		.populate('author');

	//show flash error msg when campground not found
	if (!camp) {
		req.flash('error', 'Campground Not Found');
		return res.redirect('/campgrounds');
	}

	//rendering page with camp details
	res.render('campgrounds/show', { camp });
};

module.exports.renderCampEditForm = async (req, res) => {
	const { id } = req.params;
	//opening camp page by camp id
	const camp = await Campground.findById(id);

	//show flash error msg when campground not found
	if (!camp) {
		req.flash('error', 'Campground Not Found');
		return res.redirect('/campgrounds');
	}
	res.render('campgrounds/edit', { camp });
};

module.exports.editCamp = async (req, res) => {
	const { id } = req.params;
	//collecting imgs data from multer
	const images = req.files.map((file) => ({
		url: file.path,
		filename: file.filename,
	}));
	//finding and updating camp with new data from edit form
	const camp = await Campground.findByIdAndUpdate(id, {
		...req.body.campground,
	});
	//adding new imgs to existing in camp
	camp.images.push(...images);
	await camp.save();

	//use cloudinary method for deleting files from cloud
	//mongoose method for removing data from mongo db
	if (req.body.deleteImages) {
		for (let filename of req.body.deleteImages) {
			await cloudinary.uploader.destroy(filename);
		}
		await camp.updateOne({
			$pull: { images: { filename: { $in: req.body.deleteImages } } },
		});
	}

	//flash msq
	req.flash('success', 'Campground Edited Successfully');
	res.redirect(`/campgrounds/${camp._id}`);
};

module.exports.deleteCamp = async (req, res) => {
	//camp by id
	const { id } = req.params;
	//find and delete from db
	const camp = await Campground.findByIdAndDelete(id);

	//flash msq
	req.flash('success', 'Campground Successfully Deleted');
	res.redirect('/campgrounds');
};
