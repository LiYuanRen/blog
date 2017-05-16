var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

//rootpath:D:\学习乐园\前端学习\projectForWork\blog

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'blog'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/nodeBlog'
  },

  test: {
    root: rootPath,
    app: {
      name: 'blog'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/blog-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'blog'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/blog-production'
  }
};

module.exports = config[env];
