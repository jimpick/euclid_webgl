﻿/*
Copyright (c) 2003-2009, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.html or http://ckeditor.com/license
*/

CKEDITOR.dialog.add('anchor',function(a){var b=function(c,d,e,f){var h=this;h.saveSelection();h.editMode=true;h.editObj=f;var g=h.editObj.getAttribute('name');if(g==null)h.setValueOf('info','txtName','');else h.setValueOf('info','txtName',g);};return{title:a.lang.anchor.title,minWidth:350,minHeight:150,onOk:function(){var f=this;var c=f.getValueOf('info','txtName'),d=CKEDITOR.env.ie?a.document.createElement('<a name="'+CKEDITOR.tools.htmlEncode(c)+'">'):a.document.createElement('a');if(f.editMode){f.editObj.copyAttributes(d,{name:1});f.editObj.moveChildren(d);}d.setAttribute('name',c);var e=a.createFakeElement(d,'cke_anchor','anchor');if(!f.editMode){f.restoreSelection();f.clearSavedSelection();a.insertElement(e);}else e.replace(f.fakeObj);return true;},onShow:function(){var g=this;g.editObj=false;g.fakeObj=false;g.editMode=false;g.restoreSelection();var c=g.getParentEditor(),d=c.getSelection(),e=d.getRanges();if(e.length==1){e[0].enlarge(CKEDITOR.ENLARGE_ELEMENT);rangeRoot=e[0].getCommonAncestor(true);var f=rangeRoot.getAscendant('img',true);if(f&&f.getAttribute('_cke_real_element_type')&&f.getAttribute('_cke_real_element_type')=='anchor'){g.fakeObj=f;f=c.restoreRealElement(g.fakeObj);b.apply(g,[c,d,e,f]);d.selectElement(g.fakeObj);g.saveSelection();}}g.getContentElement('info','txtName').focus();},contents:[{id:'info',label:a.lang.anchor.title,accessKey:'I',elements:[{type:'text',id:'txtName',label:a.lang.anchor.name,validate:function(){if(this.getValue()==''){alert(a.lang.anchor.errorName);return false;}return true;}}]}]};});
