$(document).ready(function() {

  $('input.clickedit').focus( function() {
    $(this).addClass("focused");
  });

  $('input.clickedit').blur( function() {
    $(this).removeClass('focused');
    if ( $(this).val() == "" ) {
      $(this).val("Untitled");
      $(this).addClass('untitled');
    }
  });

  $('input.untitled').focus( function() {
    if ( $(this).hasClass('untitled') ) {
      $(this).val('');
      $(this).removeClass('untitled');
    }
  });

});
