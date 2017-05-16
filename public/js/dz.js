$(document).ready(function () {
	var postId = $(".post-favorite").attr('postId');
	$(".post-favorite").on('click', function(e){
		e.preventDefault();
		$.ajax({
			url: '/posts/ajaxFavourite/' + postId,
			type: 'get',
			dataType: 'json',
			success: function(data){
				$(".dzNumber").html(data.dzNumber);
			},
			error: function(data){
				console.log('error' + data);
			}
		})
	})
});