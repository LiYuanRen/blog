$(document).ready(function () {
	// var delete = $(".post-delete").attr("delete");
	$(".post-delete").on('click', function () {
	    var click = confirm("确认删除这篇文章？");
	    if (click == true) {
	        return true;
	    } else {
	        return false;
	    }
	});

	$(".post-recover").on('click', function () {
	    var click = confirm("确认恢复这篇文章？");
	    if (click == true) {
	        return true;
	    } else {
	        return false;
	    }
	});

	$(".post-delete-forever").on('click', function () {
	    var click = confirm("确认彻底删除这篇文章？");
	    if (click == true) {
	        return true;
	    } else {
	        return false;
	    }
	});

	$(".category-delete").on('click', function () {
	    var click = confirm("确认删除分类和分类下的所有文章？");
	    if (click == true) {
	        return true;
	    } else {
	        return false;
	    }
	});

	$(".category-recover").on('click', function () {
	    var click = confirm("确认恢复分类和分类下的所有文章？");
	    if (click == true) {
	        return true;
	    } else {
	        return false;
	    }
	});

	$(".category-delete-forever").on('click', function () {
	    var click = confirm("确认彻底删除分类和分类下的所有文章？");
	    if (click == true) {
	        return true;
	    } else {
	        return false;
	    }
	});

});

// function myconfirm(item) {
// 	var s = item === post ? "确认删除这篇文章？" : "确认删除分类和分类下的所有文章？"
//     var click = confirm("确认删除这篇文章？");
//     if (click == true) {
//         return true;
//     } else {
//         return false;
//     }
// }