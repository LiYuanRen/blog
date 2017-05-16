var express = require('express'),
    router = express.Router(),
    slug = require('slug'),
    pinyin = require('pinyin'),
    mongoose = require('mongoose'),
    auth = require('./user'),
    Post = mongoose.model('Post'),
    User = mongoose.model('User'),
    Category = mongoose.model('Category');

module.exports = function (app) {
    app.use('/admin/posts', router);
}

router.get('/', auth.requireLogin, function (req, res, next) {
    // sort
    var sortby = req.query.sortby ? req.query.sortby : 'created';
    var sortdir = req.query.sortdir ? req.query.sortdir : 'desc';

    if (['title', 'category', 'author', 'created', 'published'].indexOf(sortby) === -1) {
        sortby = 'created';
    }
    if (['desc', 'asc'].indexOf(sortdir) === -1) {
        sortdir = 'desc';
    }

    var sortObj = {};
    sortObj[sortby] = sortdir;

    // condition
    var conditions = {};
    conditions.delete = false;
    if (req.query.category) {
        conditions.category = req.query.category.trim();
    }
    if (req.query.author) {
        conditions.author = req.query.author.trim();
    }
    if (req.query.keyword) {
        conditions.title = new RegExp(req.query.keyword.trim(), 'i');
        conditions.content = new RegExp(req.query.keyword.trim(), 'i');
    }

    User.find({}, function (err, authors) {
        if (err) return next(err);
        
        Post.find(conditions)
            .sort(sortObj)
            .populate('author')
            .populate('category')
            .exec(function (err, posts) {
                if (err) return next(err);
                // return res.send(posts);

                var pageNum = Math.abs(parseInt(req.query.page || 1, 10));
                var pageSize = 10;

                var totalCount = posts.length;
                var pageCount = Math.ceil(totalCount / pageSize);

                if (pageNum > pageCount) {
                    pageNum = pageCount;
                }

                res.render('admin/post/index', {
                    posts: posts.slice((pageNum - 1) * pageSize, pageNum * pageSize),
                    pageNum: pageNum,
                    pageCount: pageCount,
                    authors: authors,
                    sortdir: sortdir,
                    sortby: sortby,
                    pretty: true,
                    filter: {
                        category: req.query.category || "",
                        author: req.query.author || "",
                        keyword: req.query.keyword || "",
                    }
                });
            });
    });
});
router.get('/recycle', auth.requireLogin, function (req, res, next) {
    // sort
    var sortby = req.query.sortby ? req.query.sortby : 'created';
    var sortdir = req.query.sortdir ? req.query.sortdir : 'desc';

    if (['title', 'category', 'author', 'created', 'published'].indexOf(sortby) === -1) {
        sortby = 'created';
    }
    if (['desc', 'asc'].indexOf(sortdir) === -1) {
        sortdir = 'desc';
    }

    var sortObj = {};
    sortObj[sortby] = sortdir;

    // condition
    var conditions = {};
    if (req.query.category) {
        conditions.category = req.query.category.trim();
    }
    if (req.query.author) {
        conditions.author = req.query.author.trim();
    }
    if (req.query.keyword) {
        conditions.title = new RegExp(req.query.keyword.trim(), 'i');
        conditions.content = new RegExp(req.query.keyword.trim(), 'i');
    }
    conditions.delete = true;

    User.find({}, function (err, authors) {
        if (err) return next(err);
        
        Post.find(conditions)
            .sort(sortObj)
            .populate('author')
            .populate('category')
            .exec(function (err, posts) {
                if (err) return next(err);
                // return res.send(posts);

                var pageNum = Math.abs(parseInt(req.query.page || 1, 10));
                var pageSize = 10;

                var totalCount = posts.length;
                var pageCount = Math.ceil(totalCount / pageSize);

                if (pageNum > pageCount) {
                    pageNum = pageCount;
                }

                res.render('admin/post/recycle', {
                    posts: posts.slice((pageNum - 1) * pageSize, pageNum * pageSize),
                    pageNum: pageNum,
                    pageCount: pageCount,
                    authors: authors,
                    sortdir: sortdir,
                    sortby: sortby,
                    pretty: true,
                    filter: {
                        category: req.query.category || "",
                        author: req.query.author || "",
                        keyword: req.query.keyword || "",
                    }
                });
            });
    });
});

router.get('/add', auth.requireLogin, function (req, res, next) {
    res.render('admin/post/add', {
        action: "/admin/posts/add",
        pretty: true,
        post: {
            category: { _id: '' },
        },
    });
});

router.post('/add', auth.requireLogin, function (req, res, next) {

    req.checkBody('title', '文章标题不能为空').notEmpty();
    req.checkBody('category', '必须指定文章分类').notEmpty();
    req.checkBody('content', '文章内容至少写几句').notEmpty();

    var errors = req.validationErrors();
    if (errors) {
        // console.log(errors);
        return res.render('admin/post/add', {
            errors: errors,
            title: req.body.title,
            content: req.body.content,
        });
    }

    var title = req.body.title.trim();
    var category = req.body.category.trim();
    var content = req.body.content;

    User.findOne({}, function (err, author) {
        if (err) {
            return next(err);
        }

        var py = pinyin(title, {
            style: pinyin.STYLE_NORMAL,
            heteronym: false
        }).map(function (item) {
            return item[0];
        }).join(' ');

        var post = new Post({
            title: title,
            slug: slug(py),
            category: category,
            content: content,
            author: author,
            published: true,
            meta: { favorite: 0 },
            comments: [],
            created: new Date(),
        });

        post.save(function (err, post) {
            // res.send(post);//返回刚才保存到数据库的数据
            if (err) {
                console.log('post/add error:', err);
                req.flash('error', '文章保存失败');
                res.redirect('/admin/posts/add');
            } else {
                req.flash('info', '文章保存成功');
                res.redirect('/admin/posts');
            }
        });
    })
});

router.get('/edit/:id', auth.requireLogin, getPostById, getReqestQuery, function (req, res, next) {
    res.render('admin/post/add', {
        action: "/admin/posts/edit/" + req.post._id + "?page=" + req.reqQuery.page +
                "&category=" + req.reqQuery.category +"&authors=" + 
                req.reqQuery.authors + "&sortby=" + req.reqQuery.sortby + 
                "&sortdir=" + req.reqQuery.sortdir,
        post: req.post,
    });
});

router.post('/edit/:id', auth.requireLogin, getPostById, getReqestQuery,function (req, res, next) {
    var post = req.post;
    
    var title = req.body.title.trim();
    var category = req.body.category.trim();
    var content = req.body.content;

    var py = pinyin(title, {
        style: pinyin.STYLE_NORMAL,
        heteronym: false
    }).map(function (item) {
        return item[0];
    }).join(' ');

    post.title = title;
    post.category = category;
    post.content = content;
    post.slug = slug(py);

    Category.find().exec(function(err, categories) {
        var categoryId = [];
        categories.forEach(function(item){
            categoryId.push(item._id.toString());
        });
        // return res.send(categoryId.indexOf(post.category));
        if(categoryId.indexOf(post.category) != -1){//按理是没找到返回-1为什么找到了还返回-1
            return res.send(post.category);
            req.flash('error', '请选择正确的文章分类，文章编辑失败！');
            res.redirect('/admin/posts/edit/' + post._id);        
        }else{
            post.save(function (err, post) {
                if (err) {
                    console.log('post/edit error:', err);
                    req.flash('error', '文章编辑失败');
                    res.redirect('/admin/posts/edit/' + post._id);
                } else {
                    req.flash('info', '文章编辑成功');
                    res.redirect("/admin/posts?page=" + req.reqQuery.page +
                        "&category=" + req.reqQuery.category +"&authors=" + 
                        req.reqQuery.authors + "&sortby=" + req.reqQuery.sortby + 
                        "&sortdir=" + req.reqQuery.sortdir);
                    // res.redirect('/admin/posts');
                }
            });            
        } 
    })

});


router.get('/delete/:id', auth.requireLogin, getReqestQuery, function (req, res, next) {
    if (!req.params.id) {
        return next(new Error('no post id provided'));
    }
    Post.findOne({ _id: req.params.id })
        .exec(function (err, post) {
            if (err) return next(err);
            // return res.send(posts);

            post.delete = true;
            post.save(function (err, post) {
                if(err) {
                    req.flash('fail', '文章删除失败');
                } else{
                    req.flash('success', '文章删除成功');
                }
                // return res.send(req.query);
                res.redirect("/admin/posts?page=" + req.reqQuery.page +
                    "&category=" + req.reqQuery.category +"&authors=" + 
                    req.reqQuery.authors + "&sortby=" + req.reqQuery.sortby + 
                    "&sortdir=" + req.reqQuery.sortdir);
                // res.redirect('/admin/posts');
            })
        })
});

router.get('/recover/:id', auth.requireLogin, getReqestQuery, function (req, res, next) {
    if (!req.params.id) {
        return next(new Error('no post id provided'));
    }
    // return res.send(req.reqQuery);
    Post.findOne({ _id: req.params.id })
        .exec(function (err, post) {
            if (err) return next(err);
            Category.findOne({_id: post.category})
                .exec(function (err, category) {
                    // return res.send(category);
                    if(!category.delete){
                        post.delete = false;
                        post.save(function (err, post) {
                            if(err) {
                                req.flash('fail', '文章恢复失败');
                            } else{
                                req.flash('success', '文章恢复成功');
                            }
                            res.redirect("/admin/posts/recycle?page=" + req.reqQuery.page +
                                "&category=" + req.reqQuery.category +"&authors=" + 
                                req.reqQuery.authors + "&sortby=" + req.reqQuery.sortby + 
                                "&sortdir=" + req.reqQuery.sortdir);
                            // res.redirect('/admin/posts');
                        });
                    } else{
                        req.flash('fail', '没有找到该文章的分类，请先添加文章的分类再恢复文章');
                        res.redirect("/admin/posts/recycle?page=" + req.reqQuery.page +
                            "&category=" + req.reqQuery.category +"&authors=" + 
                            req.reqQuery.authors + "&sortby=" + req.reqQuery.sortby + 
                            "&sortdir=" + req.reqQuery.sortdir);
                    }
                });
        });
});


router.get('/deleteforever/:id', auth.requireLogin, getReqestQuery, function (req, res, next) {
    if (!req.params.id) {
        return next(new Error('no post id provided'));
    }

    Post.remove({ _id: req.params.id }).exec(function (err, rowsRemoved) {
        if (err) {
            return next(err);
        }

        if (rowsRemoved) {
            req.flash('success', '文章删除成功');
        } else {
            req.flash('success', '文章删除失败');
        }
        res.redirect("/admin/posts?page=" + req.reqQuery.page +
            "&category=" + req.reqQuery.category +"&authors=" + 
            req.reqQuery.authors + "&sortby=" + req.reqQuery.sortby + 
            "&sortdir=" + req.reqQuery.sortdir);
        // res.redirect('/admin/posts');
    });
});

function getPostById(req, res, next) {
    if (!req.params.id) {
        return next(new Error('no post id provided'));
    }

    Post.findOne({ _id: req.params.id })
        .populate('category')
        .populate('author')
        .exec(function (err, post) {
            if (err) {
                return next(err);
            }
            if (!post) {
                return next(new Error('post not found: ', req.params.id));
            }

            req.post = post;
            next();
       });
}

function getReqestQuery(req, res, next){
    // sort
    var page = req.query.page ? req.query.page : '';
    var sortby = req.query.sortby ? req.query.sortby : 'created';
    var sortdir = req.query.sortdir ? req.query.sortdir : 'desc';

    if (['title', 'category', 'author', 'created', 'published'].indexOf(sortby) === -1) {
        sortby = 'created';
    }
    if (['desc', 'asc'].indexOf(sortdir) === -1) {
        sortdir = 'desc';
    }

    var category = req.query.category ? req.query.category.trim() : '';
    var authors = req.query.suthor ? req.query.suthor.trim() : '';

    req.reqQuery = {
        page: page,
        sortby: sortby,
        sortdir: sortdir,
        category: category,
        authors: authors,
    };
    next();
}

