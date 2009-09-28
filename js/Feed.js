Date.prototype.toISO8601String = function (format, offset) {
    /* accepted values for the format [1-6]:
     1 Year:
       YYYY (eg 1997)
     2 Year and month:
       YYYY-MM (eg 1997-07)
     3 Complete date:
       YYYY-MM-DD (eg 1997-07-16)
     4 Complete date plus hours and minutes:
       YYYY-MM-DDThh:mmTZD (eg 1997-07-16T19:20+01:00)
     5 Complete date plus hours, minutes and seconds:
       YYYY-MM-DDThh:mm:ssTZD (eg 1997-07-16T19:20:30+01:00)
     6 Complete date plus hours, minutes, seconds and a decimal
       fraction of a second
       YYYY-MM-DDThh:mm:ss.sTZD (eg 1997-07-16T19:20:30.45+01:00)
    */
    if (!format) { var format = 6; }
    if (!offset) {
        var offset = 'Z';
        var date = this;
    } else {
        var d = offset.match(/([-+])([0-9]{2}):([0-9]{2})/);
        var offsetnum = (Number(d[2]) * 60) + Number(d[3]);
        offsetnum *= ((d[1] == '-') ? -1 : 1);
        var date = new Date(Number(Number(this) + (offsetnum * 60000)));
    }

    var zeropad = function (num) { return ((num < 10) ? '0' : '') + num; }

    var str = "";
    str += date.getUTCFullYear();
    if (format > 1) { str += "-" + zeropad(date.getUTCMonth() + 1); }
    if (format > 2) { str += "-" + zeropad(date.getUTCDate()); }
    if (format > 3) {
        str += "T" + zeropad(date.getUTCHours()) +
               ":" + zeropad(date.getUTCMinutes());
    }
    if (format > 5) {
        var secs = Number(date.getUTCSeconds() + "." +
                   ((date.getUTCMilliseconds() < 100) ? '0' : '') +
                   zeropad(date.getUTCMilliseconds()));
        str += ":" + zeropad(secs);
    } else if (format > 4) { str += ":" + zeropad(date.getUTCSeconds()); }

    if (format > 3) { str += offset; }
    return str;
}

Array.prototype.toFeed = function( feedOptions, propertyMap ) {
  var year = new Date().getFullYear();
  var newest = this[ this.length - 1 ].updated;
  var feed = <feed xmlns="http://www.w3.org/2005/Atom">
    <title type="text">{feedOptions.title}</title>
    <updated>{newest.toISO8601String()}</updated>
    <id>{feedOptions.tag}</id>
    <link rel="alternate" type="text/html" hreflang="en" href={feedOptions.uri}/>
    <link rel="self" type="application/atom+xml" href={feedOptions.self}/>
    <rights>Copyright (c) {year} {feedOptions.owner}</rights>
    <generator uri="http://docs.smart.joyent.es/docs/com/joyent/Feed.html" version="1.0">Smart Platform</generator>
  </feed>;

  var myList = new XMLList();
  for each ( var elem in this ) {
    var mapped;
    if ( propertyMap ) {
      if ( propertyMap instanceof Function )
	mapped = propertyMap.apply( elem, [] );
      else if ( propertyMap instanceof Object ) {
	var tmpObject = {};
	var props = ['title', 'uri', 'tag', 'updated', 'created', 'owner', 'email', 'body'];
        for each ( var key in props ) {
	  if ( propertyMap[key] ) {
	    if ( propertyMap[key] instanceof Function )
	      tmpObject[key] = propertyMap[key].apply(elem, []);
	    else
	      tmpObject[key] = elem[ propertyMap[key] ];
	  } else {
	    tmpObject[key] = elem[key];
	  }
	}
        mapped = tmpObject;
      }
    }
    else
      mapped = elem;
    if ( mapped.title ) {
      var body = new XML([
	"<div xmlns=\"http://www.w3.org/1999/xhtml\">",
	mapped.body.replace(/&nbsp;/g, " "),
	"</div>"
      ].join(""));
      myList += <entry>
	<title>{mapped.title}</title>
	  <link rel="alternate" type="text/html" href={mapped.uri}/>
	  <id>{mapped.tag||mapped.id}</id>
	  <updated>{mapped.updated.toISO8601String()}</updated>
	  <published>{mapped.created.toISO8601String()}</published>
	  <author>
	    <name>{feedOptions.owner}</name>
	    <uri>{feedOptions.uri}</uri>
	    <email>{mapped.email||"jim@jimpick.com"}</email>
	  </author>
	  <content type="xhtml" xml:lang="en" xml:base="http://diveintomark.org/">
	    {body}
	  </content>
      </entry>;
    }
  }
  feed.entry = myList;
  // return ["<?xml version=\"1.0\" encoding=\"utf-8\"?>", feed.toXMLString()].join("\n");
  return uneval(feed);
};


