/*********************************************************************************
*  WEB322 – Assignment 04
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Aryan Rakeshbhai Rathod Student ID:129796215 Date: 17-03-2023
*
*  Cyclic Web App URL: 
*
*  GitHub Repository URL: 
*
********************************************************************************/ 
var HTTP_PORT = process.env.PORT || 8080;
var express = require('express');
var app = express();
const stripJs = require('strip-js');

var path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');
var blogService = require(__dirname + '/blog-service.js');

onHttpStart = () => {
	console.log('Express http server listening on port ' + HTTP_PORT);
};

app.use(express.static('public'));
app.use(function (req, res, next) {
	let route = req.path.substring(1);
	app.locals.activeRoute =
		'/' +
		(isNaN(route.split('/')[1])
			? route.replace(/\/(?!.*)/, '')
			: route.replace(/\/(.*)/, ''));
	app.locals.viewingCategory = req.query.category;
	next();
});
app.engine(
	'.hbs',
	exphbs.engine({
		extname: '.hbs',
		helpers: {
			navLink: function (url, options) {
				return `<a class="nav-link ${
					url == app.locals.activeRoute ? 'active' : ''
				}" href="${url}">${options.fn(this)}</a>`;
			},
			equal: function (lvalue, rvalue, options) {
				if (arguments.length < 3)
					throw new Error('Handlebars Helper equal needs 2 parameters');
				if (lvalue != rvalue) {
					return options.inverse(this);
				} else {
					return options.fn(this);
				}
			},
			safeHTML: function (context) {
				return stripJs(context);
			},
		},
	}),
);
app.set('view engine', '.hbs');
cloudinary.config({
	cloud_name: 'dsr2a9uyf',
	api_key: '754293634516759',
	api_secret: 'rmMmc3pKrXA5WjOoKnI-Bc-3fnk',
	secure: true,
});
const upload = multer();
app.get('/', (req, res) => {
	res.redirect('/about');
});

app.get('/about', (req, res) => {
	res.render('about');
});

app.get('/blog', async (req, res) => {
	const { category: categoryId } = req.query;
	if (categoryId) {
		const posts = await blogService.getPublishedPosts();
		const categories = await blogService.getCategories();
		const data = categories.map((category) => {
			return {
				...category,
				posts: posts.filter((post) => post.category === category.id),
			};
		});
		const currentPosts = posts
			.filter((post) => post.category === Number(categoryId))
			.map((post, index) => ({
				...post,
				index: index + 1,
				currentCategory: categoryId,
			}));
		console.log(currentPosts, categoryId, posts);
		return res.render('blog', {
			categories: data,
			post: currentPosts[0],
			next: currentPosts[1]?.id,
			prev: currentPosts[currentPosts.length - 1]?.id,
			currentPosts,
		});
	}
	const posts = await blogService.getPublishedPosts();
	const categories = await blogService.getCategories();
	const data = categories.map((category, index) => {
		return {
			...category,
			posts: posts.filter((post) => post.category === category.id),
		};
	});
	res.render('blog', {
		categories: data,
		post: posts[0],
		next: posts[1].id,
		prev: posts[posts.length - 1].id,
		currentPosts: posts.map((post, index) => ({ ...post, index: index + 1 })),
	});
});

app.get('/posts', async (req, res) => {
	if (req.query.category) {
		try {
			const posts = await blogService.getPostsByCategory(req.query.category);

			res.render('posts', { posts });
		} catch (err) {
			res.render('posts', { message: err });
		}
	} else if (req.query.minDate) {
		try {
			const posts = await blogService.getPostsByMinDate(req.query.minDate);
			res.render('posts', { posts });
		} catch (err) {
			res.render({ message: err });
		}
	} else {
		try {
			const posts = await blogService.getAllPosts();

			res.render('posts', { posts });
		} catch (err) {
			res.render('posts', { message: err });
		}
	}
});

app.get('/post/:value', async (req, res) => {
  const { value } = req.params;
  const { category } = req.query;
	const posts = await blogService.getPublishedPosts();
	const categories = await blogService.getCategories();
	const data = categories.map((category) => {
		return {
			...category,
			posts: posts.filter((post) => post.category === category.id),
		};
	});
	const currentPost = posts.filter((post) => post.id === Number(value))[0];
	
	const currentPosts = category
		? posts
				.filter((post) => post.category === Number(category))
				.map((post, index) => ({ ...post, index: index + 1,currentCategory:category }))
		: posts.map((post, index) => ({ ...post, index: index + 1 }));
	res.render('blog', {
		categories: data,
		post: currentPost,
		next: currentPosts[1]?.id,
		prev: currentPosts[currentPosts.length - 1]?.id,
		currentPosts,
	});
});
app.get('/categories', async (req, res) => {
	try {
		const categories = await blogService.getCategories();
		res.render('categories', { categories });
	} catch (err) {
		res.render('categories', { message: err });
	}
});
app.get('/posts/add', (req, res) => {
	res.render('addPost');
});
app.post('/posts/add', upload.single('featureImage'), (req, res) => {
	let streamUpload = (req) => {
		return new Promise((resolve, reject) => {
			let stream = cloudinary.uploader.upload_stream((error, result) => {
				if (result) {
					resolve(result);
				} else {
					reject(error);
				}
			});

			streamifier.createReadStream(req.file.buffer).pipe(stream);
		});
	};

	async function upload(req) {
		let result = await streamUpload(req);
		return result;
	}
	function processPost(imageUrl) {
		req.body.featureImage = imageUrl;
		let post = {};
		post.body = req.body.body;
		post.title = req.body.title;
		post.postDate = new Date().toISOString().slice(0, 10);
		post.category = req.body.category;
		post.featureImage = req.body.featureImage;
		post.published = req.body.published;

		if (post.title) {
			blogService.addPost(post);
		}
		res.redirect('/posts');
	}
	upload(req)
		.then((uploaded) => {
			processPost(uploaded.url);
		})
		.catch((err) => {
			res.send(err);
		});
});

app.use((req, res) => {
	res.status(404).render('404');
});

blogService
	.initialize()
	.then(() => {
		app.listen(HTTP_PORT, onHttpStart());
	})
	.catch((err) => {
		console.log(err);
	});
