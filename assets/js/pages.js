
/** Payment method */
var paymentMethod = null;

/** Service provider */
var serviceProvider = null;

/**
 * Sign up page; signup.html This is called when the page is initialized.
 * 
 * @param {type} ev event
 * @param {type} pd page data
 * @returns
 */
//<editor-fold defaultstate="collapsed" desc="signup(ev,pd)">
var signup = function (ev, pd) {
    $(pd.el).find("#signup-form").on("submit", function (e) {
        e.preventDefault();
        var self = $(this);
        var pass1 = self.find("[name=password]").val();
        var pass2 = self.find("[name=cpass]").val();
        if (pass1 !== pass2) {
            merror("Passwords do not match.");
            return false;
        }

        var loader = mwait("Connecting...");
        $.post(getURL("register"), self.serialize(), function (r) {
            if (r.r === "s") {
                loader.close(true);
                malert("Successfully registered.");
                self.find("input[type=text],[type=password]").val("");
                getPage();
            } else {
                loader.close(true);
                merror(r.text);
            }
        }, "json").fail(function (r) {
            loader.close(true);
            merror(window.jsonError);
        });
    });
};
//</editor-fold>


/**
 * Login page; login.html, represented by '/' in routes. This is called when the
 * page is initialized
 * 
 * @param {type} ev
 * @param {type} pd
 * @returns {undefined}
 */
//<editor-fold defaultstate="collapsed" desc="login(ev,pd)">
var login = function (ev, pd) {
    $("#main-nav").hide(1);
    $(pd.el).find("#login-form").on("submit", function (e) {
        e.preventDefault();
        //submitting a form
        var self = $(this);
        var phone = self.find("[name=phone]");
        var pass = self.find("[name=pass]");
        if (phone.val() === "") {
            merror("Please enter phone number");
            return;
        }

        if (pass.val() === "") {
            merror("Please enter password");
            return;
        }

        var loader = mwait("Logging in...");

        $.post(getURL("login"), self.serialize(), function (r) {
            if (r.r === "e") {
                loader.close(true);
                merror(r.text);
            } else {
                setData(window.token, r.token);
                setData(window.username, r.username);
                setData(window.lname, r.lname);
                setData(window.fname, r.fname);
                setData(window.lad, r.lad);
                setData(window.groups, JSON.stringify(r.groups));
                setData(window.names, r.fname + " " + r.lname);
                setData(window.notesUnread, r.notifications.unread);

                //update notifications
                var notes = r.notifications;
                var allNotes = "";
                for (i = 0; i < notes.notes.length; i++) {
                    var note = notes.notes[i];
                    var msg = note.message;
                    if (!note.seen) {
                        msg = "<b>" + msg + "</b>";
                    }
                    var html = '<li class="list-item border bottom x-note-item" data-id=' + note.code + ' data-seen=' + note.seen + '>';
                    html += '<a href="/joins/" class="media-hover p-15"><div class="media-img"><div class="icon-avatar bg-success"><i class="ti-user"></i></div></div>';
                    html += '<div class="info"><span class="title">' + msg + '</span><span class="sub-title">' + note.date + '</span></div></a></li>';
                    allNotes += html;
                }
                setData(window.notes, allNotes);
                setData(window.notesCount, notes.notes.length);
                loader.close(true);
                app.router.navigate("/groups/");
            }
        }, "json").fail(function (r) {
            loader.close(true);
            merror(window.jsonError);
        });

    });
};
//</editor-fold>


/**
 * Home page; home.html
 * 
 * @param {type} ev
 * @param {type} pd
 * @returns {undefined}
 */
//<editor-fold defaultstate="collapsed" desc="home(ev,pd)">
var home = function (ev, pd) {
    //write notes
    userNotifications();
    userSettings(pd);
    menuIcon(true);
    //title();

    var self = $(pd.el);
    //get this home data [total revenue, current users,
    $.post(getURL("data"), currentUser(), function (r) {
        if (r.r === "e") {
            merror(r.text);
        } else {
            //populate
            $("#home-revenue").text("M" + numeral(r.data.cgroup.revenue).format('0,0.00'));
            $("#home-members").text(numeral(r.data.cgroup.members).format('0,0'));
            $("#home-requests").text(numeral(r.data.cgroup.requests).format('0,0'));
        }
    }, "json").fail(function () {
        merror(window.jsonError);
    });
};
//</editor-fold>


/**
 * User groups page; groups.html
 * 
 * @param {type} ev
 * @returns {undefined}
 */
//<editor-fold defaultstate="collapsed" desc="userGroups(ev)">
var userGroups = function (ev) {
    var whichGroup = null;
    var grups = JSON.parse(getData(window.groups));
    for (i = 0; i < grups.length; i++) {
        var group = grups[i];
        var gruphtml = '<li><a href="#" class="item-link item-content x-user-grup" data-code="' + group.code + '"><div class="item-media"><i class="fa fa-group"></i></div>';
        gruphtml += '<div class="item-inner"><div class="item-title"><div class="item-header">' + group.code + ' | ' + group.name + '</div>';
        gruphtml += '</div><div class="item-after">More</div></div></a></li>';
        $(gruphtml).insertBefore("#user-group-list .spacer");
    }

    var userGrups = app.actions.create({
        buttons: [
            {
                text: 'Load',
                bold: true,
                color: "color-blue",
                onClick: function (e) {
                    setData(window.currentGroup, JSON.stringify(findGroup(whichGroup)));
                    app.router.navigate("/home/");
                }
            },
            {
                text: 'Remove',
                color: "#f00"
            }
        ]
    });
    $(ev.detail.el).find(".x-user-grup").on("click", function (e) {
        e.preventDefault();
        whichGroup = $(this).data("code");
        userGrups.open();
    });

    //*
    if ((getData(window.currentGroup) === undefined) || (getData(window.currentGroup) === null)) {
        $(".navbar-inner .left a").hide(1);
        $(".navbar-inner .right").hide(1);
    }
    //*/

    userNotifications();
    userSettings(ev.detail);

    //join group request
    $(ev.detail.el).find("#join-group-form").on("submit", function (e) {
        e.preventDefault();
        var self = $(this);
        self.find("input[name=phone]").val(getData(window.username));
        $.post(getURL("joingroup"), self.serialize(), function (r) {
            if (r.r === "e") {
                if (r.text === "not_logged") {
                    merror("Please login to continue");
                    getPage("/login/");
                } else {
                    merror(r.text);
                }
            } else {
                malert(r.text);
            }
        }, "json").fail(function (r) {
            merror(window.jsonError);
        });
    });
};
//</editor-fold>


/**
 * Join requests page; joins.html
 * @param {type} ev
 * @returns {undefined}
 */
//<editor-fold defaultstate="collapsed" desc="joins(ev)">
var joins = function (ev) {
    var whichRequest = null;
    menuIcon();
    title("Sesiu");
    //page init
    mwait();
    $.post(getURL("joingroup"), {phone: getData(window.username), action: "read"}, function (r) {
        if (r.r === "e") {
            mwait(null, false);
            merror(r.text);
        } else {
            var html = '';
            for (i = 0; i < r.requests.length; i++) {
                var req = r.requests[i];
                var html = '<li><a href="javascript:void(0);" class="item-link item-content x-request-btn" data-phone="' + req.member.phone + '" data-id=' + req.id + '>' +
                        //'<div class="item-media"><i class="fa fa-group"></i></div>' +
                        '<div class="item-inner"><div class="item-title">' +
                        '<div class="item-header">' + req.date + '</div>| <label>' + req.msg + '</label></div>' +
                        '<div class="item-after">More</div></div></a></li>';
            }
            $(html).insertBefore("#join-group .spacer");
            $("#join-group .x-request-btn").on("click", function (e) {
                e.preventDefault();
                var self = $(this);
                whichRequest = self.data("id");
                //userJoinRequests.open();
                joinsDialog(self.find("label").text(), whichRequest);
            });
            loader.close(true);
        }
    }, "json").fail(function () {
        merror(window.jsonError);
    });

    var userJoinRequests = app.actions.create({
        buttons: [
            {
                text: 'Accept',
                bold: true,
                color: "color-blue",
                onClick: function (e) {
                    malert(whichRequest);
                }
            },
            {
                text: 'Reject',
                color: "#f00"
            }
        ]
    });
};
//</editor-fold>


/**
 * To view join requests in joins.html in a dialog window. The dialog contains
 * button to cancel, reject, or accept the request. Each of these buttons
 * requests closes the dialog after serving its purpose
 * 
 * @param {String} text the dialog body
 * @param {String} id join request ID
 */
//<editor-fold defaultstate="collapsed" desc="joinsDialog(text,id)">
var joinsDialog = function (text, id) {
    var dialog = app.dialog.create({
        text: text,
        buttons: [
            {
                text: "Cancel", cssClass: "button", onClick: function () {
                    dialog.close();
                }
            },
            {
                text: "Reject", onClick: function () {
                    mwait(null, false);
                    $.post(getURL("joingroup"), {username: getData(window.username), phone: getData(window.username), token: getData(window.token), action: "reply", reply: "reject", note: id}, function (r) {
                        if (r === "e") {
                            merror(r.text);
                        } else {
                            malert(r.text);
                        }
                    }, "json");
                }
            },
            {
                text: "Accept", onClick: function () {
                    //malert("Accepted " + id);
                    mwait(null, false);
                    $.post(getURL("joingroup"), {username: getData(window.username), phone: getData(window.username), token: getData(window.token), action: "reply", reply: "accept", note: id}, function (r) {
                        if (r === "e") {
                            merror(r.text);
                        } else {
                            malert(r.text);
                        }
                    }, "json");
                }
            }
        ]
    });
    dialog.open();
};
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="payments(ev)">
var payments = function (ev) {

    userNotifications();

    userSettings(ev.detail);

    var self = $(ev.detail.el);
    if (self.is("#pay-type")) {
        var pro = ev.detail.route.params.provider;
        self.find(".login-screen-title").html(pro + " - type");
        /* BELONG TO HOME; TEMPORARY HERE....PLEASE REMOVE */
        self.find(".x-method-btn").on("click", function (e) {
            e.preventDefault();
            var button = $(this);

            var met = button.data("method");
            app.router.navigate("/pay-amount/" + met + "/" + pro + "/");
        });
    } else if (self.is("#pay-amount")) {
        var met = ev.detail.route.params.payType;
        var pro = ev.detail.route.params.provider;
        self.find(".login-screen-title").html(met + " - amount");
        if (met !== "manual") {
            self.find("[name=reference]").attr("readonly", "readonly").attr("disabled", "disabled");
        } else {
            self.find("[name=reference]").removeAttr("readonly").removeAttr("disabled");
        }

        var inapp = ("inapp" === met);
        self.find("[name=provider]").val(pro);
        self.find("[name=method]").val(met);
        self.find("[name=username]").val(getData("username"));
        self.find("[name=token]").val(getData("token"));
        self.find("[name=mokhatlo]").val(JSON.parse(getData("cgroup")).code);
        var dform = self.find("form");
        dform.off("submit").on("submit", function (e) {
            e.preventDefault();
            var amount = dform.find("[name=amount]").val();
            var ref = dform.find("[name=reference]").val();

            if (amount == "" || isNaN(amount)) {
                merror("Please enter a correct amount");
                return;
            }

            if (!dform.find("[name=reference]").is("[disabled]")) {
                if (ref.trim() === "") {
                    merror("Please enter correct reference");
                    return;
                }
            }

            /*
             var met = dform.find("[name=method]").val();
             var pro = dform.find("[name=provider]").val();
             //*/
            $.post(getURL("payment"), dform.serialize(), function (r) {
                if (r.r === "e") {
                    merror(r.text);
                } else {
                    malert("Payment successfully made.");
                    //go back home
                    app.router.navigate("/home/");
                }
            }, "json").fail(function () {
                merror(window.jsonError);
            });
            //malert("This function is not yet implemented!");
        });
    }
};
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="provider(ev)">
var provider = function (ev) {
    userNotifications();

    userSettings(ev.detail);

    var self = $(ev.detail.el);
    //*
    self.find(".x-tab-link").on("click", function (e) {
        e.preventDefault();
        var button = $(this);
        var met = button.data("provider");
        app.router.navigate("/pay-type/" + met + "/");
    });
};
//</editor-fold>


/**
 * Notifications page; notifications.html
 * 
 * @param {type} ev
 * @param {type} pd
 * @returns {undefined}
 */
//<editor-fold defaultstate="collapsed" desc="notifications(ev,pd)">
var notifications = function (ev, pd) {
    //write notes

    //userNotifications();
    $("#note-notes").html(getData(window.notes));
    //alert($("#note-notes").html());

    userSettings(pd);

    /*listener for Payment Methods
     var self = $(pd.el);
     self.find(".x-method-btn").on("click", function (e) {
     e.preventDefault();
     app.tab.show($(this).attr("href"), true);
     paymentMethod = $(this).data(paymentMethod);
     });*/
};
//</editor-fold>