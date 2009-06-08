system.use("com.joyent.Sammy");
system.use("com.joyent.Resource");

enable("Sessions");

system.hostname = "127.0.0.1:8080";

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

var Post = new Resource('post', {
  '@constructor': function( aTitle, aBody ) {
    this.title = aTitle;
    this.id    = Post.titleToSlug( aTitle );
    this.draft = true;
    this.body  = aBody;
  }
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
  this.posts = Post.search({}).sort(function(a,b) {
    if ( b.created > a.created ) return 1;
    else if ( a.created > b.created ) return -1;
    return 0;
  }).splice(0,10);
  return template("/index.html");
});

GET("/posts/blank", function() {
  this.post_to = "/posts";
  return template("/edit.html");
});

GET(/\/posts\/(.+)/, function( aSlug ) {
  this.post = Post.get( aSlug );
  return template("/viewone.html");
});

GET(/\/edit(\/(.+)|)$/, function( throwAway, aSlug ) {
  this.post = Post.get( aSlug );
  this.post_to = "/posts/" + aSlug;
  return template("/edit.html");
});

GET("/posts", function() {
  this.posts = Post.search({}, { sort: 'created' }).reverse();
  return template("/list.html");
});

POST("/posts", function() {
  var title  = this.request.body.title;
  var body   = this.request.body.body;

  var thePost = new Post( title, body );
  thePost.save();

  return redirect("/");
});

POST(/\/posts\/(.+)/, function( aSlug ) {
  var thePost = Post.get( aSlug );
  thePost.title = this.request.body.title;
  thePost.body  = this.request.body.body;
  thePost.save();
  return redirect("/");
});

DELETE(/posts\/(.+)/, function( aSlug ) {
  var thePost = Post.get( aSlug );
  thePost.remove();
  this.response.code = 200;
  system.use("org.json.json2");
  this.response.body = JSON.stringify({ status: "ok" });
  throw this.response;
});

GET("/settings", function() {
  return template("/settings.html");
});

POST("/settings", function() {
  var keys = ['name', 'author'];
  for each ( var key in keys ) {
    if ( this.request.body[key] )
      this.blog[key] = this.request.body[key];
  }
  this.blog.save();
  redirect("/");
});

POST("/admin", function() {
  var username = this.request.body.username;
  var password = this.request.body.password;
  if ( User.authenticate( username, password, this ) )
    return template("/admin.html");
  else
    return redirect("/");

});