var express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  Post = mongoose.model('Post'),
  Category = mongoose.model('Category');

module.exports = function (app) {
  app.use('/posts', router);
};

router.get('/', function (req, res, next) {

    var conditions = { published: true , delete: false};

    if (req.query.keyword) {
        conditions.title = new RegExp(req.query.keyword.trim(), 'i');
        conditions.content = new RegExp(req.query.keyword.trim(), 'i');
    }


    Post.find(conditions)
        .sort('created')
        .populate('author')
        .populate('category')
        .exec(function (err, posts) {
            // return res.json(posts);
            if (err) return next(err);

            var pageNum = Math.abs(parseInt(req.query.page || 1, 10));
            var pageSize = 10;

            var totalCount = posts.length;
            var pageCount = Math.ceil(totalCount / pageSize);

            if (pageNum > pageCount) {
                pageNum = pageCount;
            }
            if(pageNum < 1){
                pageNum = 1;
            }
            
            res.render('blog/index', {
                posts: posts.slice((pageNum - 1) * pageSize, pageNum * pageSize),
                pageNum: pageNum,
                pageCount: pageCount,
                pretty: true,
                filter: {
                        category: req.query.category || "",
                        keyword: req.query.keyword || "",
                    }
            });
        });
      
});

router.get('/category/:name', function (req, res, next) {
    Category.findOne({name: req.params.name}).exec(function(err, category){
         if(err){
            return next(err);
         }

        var conditions = { published: true , delete: false};
        if (req.query.keyword) {
            conditions.title = new RegExp(req.query.keyword.trim(), 'i');
            conditions.content = new RegExp(req.query.keyword.trim(), 'i');
        }
        conditions.category = category;

        Post.find(conditions)
            .sort('created')
            .populate('category')
            .populate('author')
            .exec(function (err, posts) {
                if (err) {
                    return next(err);
                }

                var pageNum = Math.abs(parseInt(req.query.page || 1, 10));
                var pageSize = 10;

                var totalCount = posts.length;
                var pageCount = Math.ceil(totalCount / pageSize);

                if (pageNum > pageCount) {
                    pageNum = pageCount;
                }
                if(pageNum < 1){
                    pageNum = 1;
                }

                res.render('blog/category', {
                    posts: posts.slice((pageNum - 1) * pageSize, pageNum * pageSize),
                    pageNum: pageNum,
                    pageCount: pageCount,
                    length: posts.length,
                    category: category,
                    filter: {
                        category: req.query.category || "",
                        keyword: req.query.keyword || "",
                    },
                    action: "/posts/category/" + req.params.name,
                    pretty: true,
                });

        });
    })
});

router.get('/view/:id', function (req, res, next) {
    if(!req.params.id){
        return next(new Error('no post id provided'));
    }
    var conditions = {};
    try{
        conditions._id = mongoose.Types.ObjectId(req.params.id);
    } catch (err) {
        conditions.slug = req.params.id;
    }

    Post.findOne(conditions)
        .populate('category')
        .populate('author')
        .exec(function(err, post){
            if (err) {
                return next(err);
            }
            res.render('blog/view', {
                post: post
            });
        });
});

router.get('/favourite/:id', function (req, res, next) {
   if (!req.params.id) {
        return next(new Error('no post id provided'));
    }

    var conditions = {};
    try {
        conditions._id = mongoose.Types.ObjectId(req.params.id);
    } catch (err) {
        conditions.slug = req.params.id;
    }

    Post.findOne(conditions)
        .populate('category')
        .populate('author')
        .exec(function (err, post) {
            if (err) {
                return next(err);
            }
            // return res.json(post);
            post.meta.favorite = post.meta.favorite ? post.meta.favorite + 1 : 1;
            post.markModified('meta');
            post.save(function (err) {
                res.redirect('/posts/view/' + post.slug);
            });
        });
});

router.get('/ajaxFavourite/:id', function (req, res, next) {
   if (!req.params.id) {
        return next(new Error('no post id provided'));
    }
    var conditions = {};
    try {
        conditions._id = mongoose.Types.ObjectId(req.params.id);//把字符串转换成ObjectId
    } catch (err) {
        conditions.slug = req.params.id;
    }

    Post.findOne(conditions)
        .populate('category')
        .populate('author')
        .exec(function (err, post) {
            if (err) {
                return next(err);
            }
            // return res.json(post);
            post.meta.favorite = post.meta.favorite ? post.meta.favorite + 1 : 1;
            post.markModified('meta');
            post.save(function (err) {
                // res.redirect('/posts/view/' + post.slug);
                res.send({dzNumber: post.meta.favorite});
            });

        });
});

router.post('/comment/:id', function (req, res, next) {
   // return res.jsonp(req.body);

    var conditions = {};
    try {
        conditions._id = mongoose.Types.ObjectId(req.params.id);
    } catch (err) {
        conditions.slug = req.params.id;
    }

    Post.findOne(conditions)
        .populate('category')
        .populate('author')
        .exec(function (err, post) {
            if (err) {
                return next(err);
            }

           var reg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/;
           if (!reg.test(req.body.email)) {
                req.flash("info", "请输入正确的邮箱格式");
                res.redirect('/posts/view/' + post.slug);
            }else{
                var comment = {
                    name: req.body.name,
                    email: req.body.email,
                    content: req.body.content,
                    created: new Date()
                }
                post.comments.unshift(comment);
                post.markModified('comments');

                post.save(function (err) {
                    req.flash("info", "评论添加成功");
                    res.redirect('/posts/view/' + post.slug);
                });
            }

        });
});
