$(document).ready( function() {

  $('a.delete').click( function() {
    var theAnchor = this;
    if ( confirm('Are you sure you want to delete this?' ) )
      $.ajax({
	type: 'delete',
	url: $(this).attr('href'),
	success: function() {
	  var toRemove = $(theAnchor).attr('data-remove');
	  $("#" + toRemove).remove();
	}
      });
    return false;
  });

});