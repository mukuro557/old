//<=========== Import packages ==========>
const express = require("express");
const path = require("path");
const body_parser = require("body-parser");
const multer = require("multer");
const mysql = require("mysql");
const bcrypt = require('bcryptjs');
const config = require("./dbConfig.js");

const app = express();
const con = mysql.createConnection(config);
const multerOption = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "_" + file.originalname);
    }
});
const upload = multer({ storage: multerOption }).single("fileUpload");

//<=========== Middleware ==========>

app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());


// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<service>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//------------------------------- Login ----------------------------------
app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    const sql = "SELECT password, role FROM login WHERE username=?";
    con.query(sql, [username], function (err, result, fields) {
        if (err) {
            res.status(500).send("Server error");
        }
        else {
            const numrows = result.length;
            console.log(numrows)

            if (numrows != 1) {

                res.status(401).send("Wrong username");
            }
            else {
                bcrypt.compare(password, result[0].password, function (err, resp) {
                    if (err) {
                        res.status(503).send("Authentication Server error");
                    }
                    else if (resp == true) {

                        if (result[0].role == 1) {

                            res.send("/admin");
                        }
                        else {

                            res.send("/welcome");
                        }
                    }
                    else {
                        //wrong password
                        res.status(403).send("Wrong password");
                    }
                });
            }
        }
    });
});




// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< signup >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//------------------------------- Sign up a new user -------------------------
app.post("/signUp", function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    //encrypt password
    const saltRounds = 10;    //the cost of encrypting

    bcrypt.hash(password, saltRounds, function (err, hash) {
        if (err) {
            console.error(err.message);
            res.status(500).send("Server error");
            return;
        }

        //hash OK, do the rest here because of async hashing process!
        // insert new user (role is 2)
        const sql = "INSERT INTO login(username, password, role) VALUES(?,?,2)";
        con.query(sql, [username, hash], function (err, result, fields) {
            if (err) {
                console.error(err.message);
                res.status(503).send("Database server error");
                return;
            }

            // get inserted rows
            const numrows = result.affectedRows;
            if (numrows != 1) {
                console.error("Insert to DB failed");
                res.status(503).send("Database server error");
            }
            else {
                res.send("Sign up Complete!");
            }
        });
    });
});


// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< saveaddhealth >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

app.post("/save_add_health", function (req, res) {
    const date = req.body.date;
    const information = req.body.information;

    const sql = "INSERT INTO announcement(date, information) VALUES (?,?)";
    con.query(sql, [date, information], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        // get inserted rows
        const numrows = result.affectedRows;
        if (numrows != 1) {
            console.error("Insert to DB failed");
            res.status(503).send("Database server error");
        }
        else {
            res.send("Sign up Complete!");
        }

    });
});


// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< save_edit_anoucement >>>>>>>>>>>>>>>>>>>>>>>>>>

app.put("/save_edit_announce", function (req, res) {
    const date = req.body.date;
    const img = req.body.img;
    const title = req.body.title;
    const information = req.body.information;

    const sql = "INSERT INTO cardinfo(information, img, date, title) VALUES(?,?,?,?)";
    con.query(sql, [information, img, date, title], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        // get inserted rows
        const numrows = result.affectedRows;
        if (numrows != 1) {
            console.error("Insert to DB failed");
            res.status(503).send("Database server error");
        }
        else {
            res.send("Sign up Complete!");
        }

    });
});



//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Root >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "mainpage.html"));
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< visitmainpage>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/mainpage", function (req, res) {
    let sql = "SELECT a.information,a.date,y.img,y.information,c.img, c.title,c.information FROM annoucement a, activity y,cardinfo c"
    con
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<  readmore >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/readmore", function (req, res) {
    let sql = "SELECT information,img, title FROM cardinfo "
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< visit activity >>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/activity", function (req, res) {
    res.sendFile(path.join(__dirname, "activity.html"));
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< show information >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_activity", function (req, res) {
    let sql = "SELECT `activity_name`, `organizer`, `information`, `limit_join`, `date`, `number_join`  FROM `activity` "
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< visit profile  >>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_profile", function (req, res) {
    let sql = "SELECT l.username,l.img,l.email,o.address,o.tel FROM login l, old_info o WHERE l.id_login =o.id_login"
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< visit user profile >>>>>>>>>>>>>>>>>>>>>>>
app.get("/user_profile", function (req, res) {
    res.sendFile(path.join(__dirname, "user_profile.html"));
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< oldinfo page >>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/confirmad", function (req, res) {
    res.sendFile(path.join(__dirname, "oldinfo.html"));
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< display info in>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_confirmad", function (req, res) {

});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< display carousel >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_carouselEdit", function (req, res) {

});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< visit health page >>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/health", function (req, res) {
    res.sendFile(path.join(__dirname, "health.html"));
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< display_health >>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_health", function (req, res) {

});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< mainpage admin >>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/mainpage_admin", function (req, res) {
    res.sendFile(path.join(__dirname, "mainpage_admin.html"));
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< display mainpage admin>>>>>>>>>>>>>>>>>>>>
app.get("/display_mainpage_admin", function (req, res) {

});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<   editoldinfo   >>>>>>>>>>>>>>>>>>>>>>>>>>>
app.put("/editoldinfo", function (req, res) {
    const name = req.body.name;
    const IDcard = req.body.IDcard;
    const Address = req.body.Address;
    const Emergencycall = req.body.Emergencycall;
    const Mobilephone = req.body.Mobilephone;
    const Symptom = req.body.Symptom;
    const Allergic = req.body.Allergic;
    const id = req.body.id;

    const sql = "update user set name = ?,IDcard = ?,Address = ?,Emergencycall = ?,Mobilephone =?,Symptom =?,Allergic = ? where id_old= ?";

    con.query(sql, [name, IDcard, Address, Emergencycall, Mobilephone, Symptom, Allergic,id], function () {
    });
});
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<  joinactivity  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.put("/joinactivity", function (req, res) {
    const id_old = req.body.id_old;
    const id_activity = req.body.id_activity;

    const spl = "update user set id_old = ?,id_activity = ? where = ?";

    con.query(sql, [id_old, id_activity], function () {
    });
});
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<  uploading_profile  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.put("/uploadimg_profile", function (req, res) {
    const img = req.body.img;

    const spl = "update user set img = ? where = ?";

    con.query(sql, [img], function () {
    });
});
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<  Edit_information_of_profile  >>>>>>>>>>>>>>>>>>>
app.put("/Edit_pofileinfo", function (req, res) {
    const name = req.body.name;
    const tel = req.body.tel;
    const email = req.body.email;
    const address = req.body.address;

    const spl = "update user set name = ?, tel = ?, email = ?, address = ? where = ?";

    con.query(sql, [name, tel, email, address], function () {
    });
});
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<  approveinfo  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.put("/approveinfo", function (req, res) {
    const date = req.body.date;
    const name = req.body.name;
    const surname = req.body.surname;
    const id_card = req.body.id_card;
    const address = req.body.address;
    const id_login = req.body.id_login;

    const spl = "update user set date = ?,name = ?,surname = ?,id_card = ?,address = ?,id_login =:? ";

    con.query(sql, [date, name, surname, id_card, address, id_login], function () {
    });
});
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<  save_approveinfo  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.put("/save_approveinfo", function (req, res) {
    const date = req.body.date;
    const name = req.body.name;
    const surname = req.body.surname;
    const id_card = req.body.id_card;
    const address = req.body.address;
    const id_login = req.body.id_loginl;

    const spl = "update user set date = ?,name = ?,surname = ?,id_card = ?,address = ?,id_login =:? ";

    con.query(sql, [date, name, surname, id_card, address, id_login], function () {
    });
});


// const date = req.body.date;
// const information = req.body.information;
// const id_login = req.body.id_login ;
// const type = req.body.type;

// const sql = "INSERT INTO `annoucement`( `information`, `id_login`, `type`, `date`) VALUES (?,?,?,?)";
// con.query(sql, [,information,id_login,type,date,], function (err, result, fields) {
// });

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< canceljoin activity >>>>>>>>>>>>>>>>>>>>>>>>>>>
app.put("/cancel_joinactivity", function (req, res) {
    const id_join = req.body.id_join
    const join_status = req.body.join_status

    const sql = "UPDATE oldactive.join SET join_status = ? WHERE id_join = ? "
    con.query(sql, [join_status,id_join ], function (err, result, fields) {
    });


});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< cancel approve >>>>>>>>>>>>>>>>>>>>>>>>>>>
app.put("/cancel_approveinfo", function (req, res) {
    const approve_status = req.body.approve_status;
    const old_id = req.body.old_id;
    const sql = "UPDATE oldactive.old_info SET Approve_status = ? WHERE `id_old` = ?"
    con.query(sql, [approve_status,old_id],function(err,result, fields){

    });
});

// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< start port >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const PORT = 50000
app.listen(PORT, function () {
    console.log("Sever is running at " + PORT);
});