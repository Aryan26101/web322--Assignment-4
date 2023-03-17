const fs = require('fs');     //to use file system module
var posts = [];
var categories = [];

exports.initialize = () => {
    return new Promise ((resolve, reject) => {
        fs.readFile('./data/posts.json','utf8', (err,data) => {
            if (err) {
                reject ('unable to read file');
            }
            else {
                posts = JSON.parse(data);
            }
        });

        fs.readFile('./data/categories.json','utf8', (err,data)=> {
            if (err) {
                reject ('unable to read file');
            }
            else {
                categories = JSON.parse(data);
            }
        })
        resolve();
    })
};


exports.getAllPosts = () => {
    return new Promise ((resolve,reject) => {
        if (posts.length == 0) {
            reject('no results returned');
        }
        else {
            resolve(posts);
        }
    })
};


exports.getPublishedPosts = () => {
    return new Promise ((resolve, reject) => {
        var publishedPosts = posts.filter(post => post.published == true);
        if (publishedPosts.length == 0) {
            reject('no results returned');
        }
        resolve(publishedPosts);
    })
};

exports.getCategories = () => {
    return new Promise((resolve,reject) => {
        if (categories.length == 0) {
            reject ('no results returned');
        }
        else {
            resolve (categories);
        }
    })
};

exports.addPost = (postData) => {
    return new Promise((resolve, reject) => {
        if (postData.published === undefined) {
            postData.published = false;
        } else {
            postData.published = true;
        }
        postData.id = posts.length + 1;
        posts.push(postData);

        resolve(postData);
    })  
};

exports.getPostById = (id) => {
    return new Promise((resolve, reject) => {
        const idPosts = posts.filter((post) => post.id == id);
        if (idPosts.length === 0 ) {
            reject("no result returned");
        }
        else {
            resolve(idPosts);
        }
    })
};

exports.getPostsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        const categoryPosts = posts.filter((post) => post.category == category);
        if (categoryPosts.length === 0) {
            reject("no results returned");
        } else {
            resolve(categoryPosts);
        }
    })
};

exports.getPostsByMinDate = (minDate) => {
    return new Promise((resolve, reject) => {
        const datePosts = posts.filter((post) => new Date(post.postDate) >= new Date(minDate));
        if (datePosts.length === 0) {
            reject("no results returned");
        } else {
            resolve(datePosts);
        }
    })
}