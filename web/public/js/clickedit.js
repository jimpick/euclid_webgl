$(document).ready(function() {

  $('input.clickedit').focus( function() {
    $(this).addClass("focused");
  });

  $('input.clickedit').blur( function() {
    $(this).removeClass('focused');
  });

});
