Array.prototype.toFeed = function( feedOptions, withElement ) {
  var year = new Date().getFullYear();
  var newest = this[ this.length - 1 ].updated;
  var feed = <feed xmlns="http://www.w3.org/2005/Atom">
    <title type="text">{feedOptions.title}</title>
    <updated>{newest}</updated>
    <id>{feedOptions.tag}</id>
    <link rel="alternate" type="text/html" hreflang="en" href={feedOptions.uri}/>
    <link rel="self" type="application/atom+xml" href={feedOptions.self}/>
    <rights>Copyright (c) {year} {feedOptions.owner}</rights>
    <generator uri="http://docs.smart.joyent.es/api/Feed.js" version="1.0">Smart Platform</generator>
  </feed>;

  var myList = new XMLList();
  for each ( var elem in this ) {
    var mapped;
    if ( withElement )
      mapped = withElement.apply( elem, [] );
    else
      mapped = elem;
    myList += <entry>
      <title>{mapped.title}</title>
      <link rel="alternate" type="text/html" href={mapped.uri}/>
      <id>{mapped.tag||mapped.id}</id>
      <updated>{mapped.updated}</updated>
      <published>{mapped.published}</published>
      <author>
	<name>{feedOptions.owner}</name>
	<uri>{feedOptions.uri}</uri>
	<email>{mapped.email||"nospam@kthnx"}</email>
      </author>
      <content type="xhtml" xml:lang="en" xml:base="http://diveintomark.org/">
	<div xmlns="http://www.w3.org/1999/xhtml">{mapped.body}</div>
      </content>
    </entry>;
  }
  feed.entry = myList;
  return ["<?xml version=\"1.0\" encoding=\"utf-8\"?>", feed.toXMLString()].join("\n");
};

