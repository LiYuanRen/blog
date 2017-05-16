var express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  Post = mongoose.model('Post'),
  User = mongoose.model('User'),
  slug = require('slug'),
  pinyin = require('pinyin'),
  Category = mongoose.model('Category');

module.exports = function (app) {
  app.use('/admin/categories', router);
};

router.get('/', function (req, res, next) {
    res.render('admin/category/index', {
        pretty: true,
    });
});

router.get('/add', function (req, res, next) {
    res.render('admin/category/add', {
        action: "/admin/categories/add",
        pretty: true,
        category: { _id: '' },
    });
});

router.post('/add', function (req, res, next) {

    req.checkBody('name', '分类名称不能为空').notEmpty();

    var errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        return res.render('admin/category/add', {
            errors: errors,
            name: req.body.name,
        });
    }
    var name = req.body.name.trim();

    var py = pinyin(name, {
        style: pinyin.STYLE_NORMAL,
        heteronym: false
    }).map(function (item) {
        return item[0];
    }).join(' ');

    var category = new Category({
        name: name,
        slug: slug(py),
        created: new Date(),
        delete: false
    });

    category.save(function (err, category) {
        if (err) {
            console.log('category/add error:', err);
            // req.flash('error', '分类保存失败');
            res.redirect('/admin/categories/add');
        } else {
            // req.flash('info', '分类保存成功');
            res.redirect('/admin/categories');
        }
    });
});

router.get('/edit/:id', getCategoryById, function (req, res, next) {
    res.render('admin/category/add', {
        action: "/admin/categories/edit/" + req.category._id,
        category: req.category
    }); 
});

router.post('/edit/:id', getCategoryById, function (req, res, next) {
   
    var category = req.category;

    var name = req.body.name.trim();

    var py = pinyin(name, {
        style: pinyin.STYLE_NORMAL,
        heteronym: false
    }).map(function (item) {
        return item[0];
    }).join(' ');

    category.name = name;
    category.category = category;
    category.slug = slug(py);

    category.save(function(err, category){
        if(err) {
            console.log('category/edit error:', err);
            // req.flash('error', '分类编辑失败');
            res.redirect('/admin/categories/edit/' + category._id);
        }else{
            // req.flash('info', "分类编辑成功");
            res.redirect('/admin/categories');
        }
    })

});

router.get('/delete/:id', getCategoryById, function (req, res, next) {
    //删除分类及分类下的文章
    if(!req.params.id){
        return next(new Error('no category id provided'));
    }
    Post.find({"category": req.params.id}).exec(function(err, posts){
        if(err) {
            return next(err);
        }
        posts.forEach(function (post){
            post.delete = true;
            post.save(function (err, post) {
                if(err) {
                    return next(err);
                }
            });
        });

    });
    Category.findOne({_id: req.params.id}).exec(function(err, category){
        // return res.send(req.params.id);
        if(err) {
            return next(err);
        }
        category.delete = true;
        category.save(function (err, category) {
            if(err) {
                req.flash('fail', '分类删除失败');
            } else{
                req.flash('success', '分类删除成功');
            }
            res.redirect('/admin/categories');
        })
    });    
});

router.get('/recover/:id', getCategoryById, function (req, res, next) {
    //删除分类及分类下的文章
    if(!req.params.id){
        return next(new Error('no category id provided'));
    }
    Category.findOne({_id: req.params.id}).exec(function(err, category){
        // return res.send(req.params.id);
        if(err) {
            return next(err);
        }
        category.delete = false;
        category.save(function (err, category) {
            if(err) {
                return next(err);
            } 
        })
    });

    Post.find({"category": req.params.id}).exec(function(err, posts){
        if(err) {
            return next(err);
        }
        posts.forEach(function (post){
            post.delete = false;
            post.save(function (err, post) {
                if(err) {
                    req.flash('fail', '分类恢复失败');
                } else{
                    req.flash('success', '分类恢复成功');
                }
            });
        });
        req.flash('success', '分类恢复成功');
        res.redirect('/admin/categories');
    });
});

router.get('/deleteforever/:id', getCategoryById, function (req, res, next) {
    //删除分类及分类下的文章
    if(!req.params.id){
        return next(new Error('no category id provided'));
    }
    Post.remove({"category": req.params.id}).exec(function(err, rowsRemoved){
        if(err) {
            return next(err);
        }
        if(rowsRemoved) {
            req.flash('success', '分类下的文章及分类删除成功');
            Category.remove({_id: req.params.id}).exec(function(err, rowsRemoved){
                if(err) {
                    return next(err);
                }
                if(rowsRemoved) {
                    req.flash('success', '分类下的文章及分类删除成功');
                } else {
                    req.flash('fail', '分类删除失败');
                }
            });
        } else {
            req.flash('fail', '分类删除失败');
        }
        res.redirect('/admin/categories');
    })
    //只删除分类
    // Category.remove({_id: req.params.id}).exec(function(err, rowsRemoved){
    //     return res.jsonp(rowsRemoved);
    //     if(err) {
    //         return next(err);
    //     }
    //     if(rowsRemoved) {
    //         req.flash('success', '分类删除成功');
    //         // Post.remove({"categories": })
    //     } else {
    //         req.flash('fail', '分类删除失败');
    //     }
    //     res.redirect('/admin/categories')
    // })
});

function getCategoryById(req, res, next) {
    if (!req.params.id) {
        return next(new Error('no category id provided'));
    }

    Category.findOne({ _id: req.params.id }).exec(function (err, category) {
            if (err) {
                return next(err);
            }
            if (!category) {
                return next(new Error('category not found: ', req.params.id));
            }

            req.category = category;
            next();
       });

}
