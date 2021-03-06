﻿/*
Copyright (c) 2003-2009, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.html or http://ckeditor.com/license
*/

/**
 * @file Horizontal Page Break
 */

// Register a plugin named "newpage".
CKEDITOR.plugins.add( 'newpage',
{
	init : function( editor )
	{
		editor.addCommand( 'newpage',
			{
				modes : { wysiwyg:1, source:1 },

				exec : function( editor )
				{
					editor.setData( editor.config.newpage_html );
					editor.focus();
				}
			});

		editor.ui.addButton( 'NewPage',
			{
				label : editor.lang.newPage,
				command : 'newpage'
			});
	}
});

CKEDITOR.config.newpage_html = '';
