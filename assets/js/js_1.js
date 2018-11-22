
var app = new Framework7({
    // App root element
    //root: '#app',
    // App Name
    name: 'My App',
    // App id
    id: 'com.myapp.test',
    routes: [
        {
            path: '/next/',
            url: 'assets/pages/next.html',
        },{
            path: '/prev/',
            url: 'assets/pages/prev.html',
        },
    ]
     //*/
    // Add default routes
    
    // ... other parameters
});
var fdom = Dom7;
var mainView = app.views.create('.view-main',{routes: [
        {
            path: '/next/',
            url: 'assets/pages/next.html',
        },{
            path: '/prev/',
            url: 'assets/pages/prev.html',
        },
    ]});
app.panel.open("left",true);
/*
 var app = function(){
 this.initialize = function(){
 //var mv = f7.addView(".view-main");
 var hv = f7.views.create(".view-main",{url: '/assets/pages/next.html'});
 fdom(".x-next").on("click",function(e){
 e.preventDefault();
 //console.log("home");
 hv.mainView.router.load({url:"assets/pages/next.html"});
 //f7.router.load({url:"assets/pages/next.html"});
 });
 };
 };
 
 var a = new app();
 a.initialize();
 //*/