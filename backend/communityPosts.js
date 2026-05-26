const posts = [];

function addPost(text) {

    const newPost = {
        id: Date.now(),
        text,
        time: new Date()
    };

    posts.unshift(newPost);

    return newPost;
}

function getPosts() {
    return posts;
}

module.exports = {
    addPost,
    getPosts
};