system.use("com.joyent.Sammy");
system.use("com.joyent.Resource");

enable("Sessions");

/* wipe users...
before(function() {
  User.search({}).forEach( function( e ) {
    e.remove();
  });
});
*/

var User = new Resource('user', {

  '@constructor': function( aUsername ) {
    if (!aUsername) throw new Error("no username");
    try {
      var checkUser = User.get(aUsername);
    } catch(e) {
      this.id = aUsername;
    } finally {
      if ( checkUser ) throw new Error("user " + aUsername + " already exists");
    }
  },

  'password': function(id, oldval, newval) {
    return system.digest.sha1.hex( newval );
  }

});

User.prototype.validatePassword = function( aPassword ) {
  var sha1  = system.digest.sha1.hex( aPassword );
  return this.password == sha1;
};

User.prototype.authenticate = function( aPassword, theStack ) {
  this.validatePassword( aPassword );
  theStack.session.userid = this.id;
  theStack.user = this;
  theStack.session.save();
};

User.authenticate = function( aUsername, aPassword, theStack ) {
  var theUser = User.get( aUsername );
  theUser.authenticate( aPassword, theStack );
};

var Post = new Resource('post', {
  '@constructor': function( aTitle, aBody ) {
    this.title = aTitle;
    this.id    = Post.titleToSlug( aTitle );
    this.draft = true;
    this.body  = aBody;
  }
});

Post.prototype.__defineGetter__("bodyAsXML", function() {
  var table = {
    "&quot"  : "&#34",
    "&amp"   : "&#38",
    "&lt"    : "&#60",
    "&gt"    : "&#62",
    "&nbsp"  : "&#160",
    "&iexcl" : "&#161",
    "&cent"  : "&#162",
    "&pound" : "&#163",
    "&curren": "&#164",
    "&yen"   : "&#165",
    "&brvbar": "&#166",
    "&sect"  : "&#167"
  };
  var cleanbody = this.body;
  for ( var key in table ) {
    cleanbody = cleanbody.replace(new RegExp(key, "g"), table[key]);
  }
  return cleanbody.replace(/&[^#]/g, "&#38");
});

before(function() {
  // get this set up so that when we need to we can generate
  // permalinks for articles without too much hassle.
  system.hostname = this.request.headers['Host'];
});

before(function() {
  this.blog = (function() {
    var b = new Resource('blog_data');
    try {
      return b.get('settings');
    } catch(e) {
      var b = new b();
      b.id = "settings";
      b.save();
      return b;
    }
  })();
});

before(function() {

  this.assertAuth = function() {
    if (!this.user) return redirect("/");
  };

  if ( this.session.userid ) {
    try {
      this.user = User.get( this.session.userid );
    } catch(e) {
      delete this.session.userid;
      this.session.save();
    }
  }
});

Post.prototype.__defineGetter__("uri", function() {
  return system.sprintf("http://%s/posts/%s", system.hostname, this.id);
});

Post.titleToSlug = function( aTitle ) {
  if (!aTitle) throw new Error("no title to convert");
  return aTitle.toLowerCase().replace(/\s/g, '_').substr(0, 25);
};

GET("/", function() {
  this.posts = Post.search({}, { sort: 'created', limit: 10, reverse: true } ).sort(function(a,b) {
    if ( b.created > a.created ) return 1;
    else if ( a.created > b.created ) return -1;
    return 0;
  });
  return template("/index.html");
});

GET("/posts/blank", function() {
  this.assertAuth();
  this.post_to = "/posts";
  return template("/edit.html");
});

GET(/\/posts\/(.+)/, function( aSlug ) {
  this.post = Post.get( aSlug );
  return template("/viewone.html");
});

GET(/\/edit(\/(.+)|)$/, function( throwAway, aSlug ) {
  this.assertAuth();
  this.post = Post.get( aSlug );
  this.post_to = "/posts/" + aSlug;
  return template("/edit.html");
});

GET("/posts", function() {
  this.assertAuth();
  this.posts = Post.search({}, { sort: 'created' }).reverse();
  return template("/list.html");
});

POST("/posts", function() {
  this.assertAuth();
  var title  = this.request.body.title;
  var body   = this.request.body.body;

  var thePost = new Post( title, body );
  thePost.save();

  return redirect("/");
});

POST(/\/posts\/(.+)/, function( aSlug ) {
  this.assertAuth();
  var thePost = Post.get( aSlug );
  thePost.title = this.request.body.title;
  thePost.body  = this.request.body.body;
  thePost.save();
  return redirect("/");
});

DELETE(/posts\/(.+)/, function( aSlug ) {
  this.assertAuth();
  var thePost = Post.get( aSlug );
  thePost.remove();
  this.response.code = 200;
  system.use("org.json.json2");
  this.response.body = JSON.stringify({ status: "ok" });
  throw this.response;
});

GET("/settings", function() {
  this.assertAuth();
  return template("/settings.html");
});

POST("/settings", function() {
  this.assertAuth();
  var keys = ['name', 'author'];
  for each ( var key in keys ) {
    if ( this.request.body[key] )
      this.blog[key] = this.request.body[key];
  }
  this.blog.save();
  redirect("/");
});

GET("/admin", function() {
  if ( this.user ) return template("/admin.html");
  else return template("/signin.html");
});

POST("/admin", function() {
  var username = this.request.body.username;
  var password = this.request.body.password;
  try {
    User.authenticate( username, password, this );
    return template("/admin.html");
  } catch(e) {
    this.error = true;
    return template("/signin.html");
  }
});

GET("/setup", function() {
  if ( User.search({}).length ) throw new Error("Not Found");
  return template("/setup.html");
});

POST("/setup", function() {

  return uneval(this.request.body);g

  if (!this.error) this.error = {};
  if ( User.search({}).length ) throw new Error("Not Found");
  var rbody = this.request.body;
  if ( ! rbody['user.password'] instanceof Array ) {
    this.error.password = true;
    return template("/setup.html");
  }

  var pw1 = rbody['user.password'][0];
  var pw2 = rbody['user.password'][1];
  if (pw1 != pw2) {
    this.error.password = true;
    return template("/setup.html");
  }

  var theUser = new User( rbody['user.name'] );
  theUser.password = pw1;
  theUser.save();
  theUser.authenticate( pw1, this );

  this.blog.name = rbody['blog.name'];
  this.blog.save();

  return template("/admin.html");
});

GET("/signout", function() {
  delete this.session.userid;
  delete this.user;
  this.session.save();
  return redirect("/");
});

GET("/users", function() {
  this.users = User.search({});
  return template("/users.html");
});

POST("/users", function() {
  this.users = User.search({});

  var rbody = this.request.body;
  if ( ! rbody['user.password'] instanceof Array ) {
    this.error.password = true;
    return template("/users.html");
  }

  var pw1 = rbody['user.password'][0];
  var pw2 = rbody['user.password'][1];
  if (pw1 != pw2) {
    this.error.password = true;
    return template("/users.html");
  }

  var theUser =	new User( rbody['user.name'] );
  theUser.password = rbody['user.password'][0];
  theUser.save();

  // add the user to the list, but don't need to search completely again
  this.users.push( theUser );

  return template("/users.html");
});

DELETE(/\/users\/(.+)/, function( aUsername ) {
  this.assertAuth();
  var theUser = User.get( aUsername );
  theUser.remove();

  this.response.code = 200;
  system.use("org.json.json2");
  this.response.body = JSON.stringify({ status: "ok" });
  throw this.response;
});

GET('/feed.atom', function(){
  system.use("com.joyent.Feed");
  return Post.search({}, { sort: 'created',  limit: 10, reverse: true }).toFeed({
    title:   this.blog.name,
    tag:     system.digest.sha1.hex( this.blog.name ),
    uri:     system.sprintf("http://%s/", this.request.headers.Host),
    self:    system.sprintf("http://%s/feed.atom", this.request.headers.Host),
    owner:   this.blog.author
  }, {
    'tag': function() {
      if ( this.id )
	return system.digest.sha1.hex( this.id );
    }
  });
});

GET("/feed.json", function() {
  system.use("org.json.json2");
  JSON.stringify( Post.search({},{sort: 'created', reverse: true}) );
});
