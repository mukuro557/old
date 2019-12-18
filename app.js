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
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
        }
        else {
            const numrows = result.length;
            console.log(numrows)

            if (numrows != 1) {

                res.status(401).send("เข้าสู่ระบบไม่สำเร็จ");
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
                        else if (result[0].role == 2) {

                            res.send("/");
                        } else {
                            res.send("/Loginforhospital");
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
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
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
                res.send("สมัครสำเร็จ");
            }
        });
    });
});


// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< saveaddhealth >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

app.post("/save_add_health", function (req, res) {
    const date = req.body.date;
    const information = req.body.information;
    const img = req.body.img;
    const title = req.body.title;

    const sql = "INSERT INTO announcement(date, information,img.title) VALUES (?,?,?,?)";
    con.query(sql, [date, information.img, title], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(401).send("บันทึกไม่สำเร็จ");
        }
        else {
            //return json of recordset
            res.send("บันทึกสำเร็จ");
        }
    });
});


// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< save_edit_anoucement >>>>>>>>>>>>>>>>>>>>>>>>>>

app.put("/save_edit_announce", function (req, res) {
    const date = req.body.date;
    const information = req.body.information;

    const sql = "Update announcement SET information = ? ,date= ?";
    con.query(sql, [information, date], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(401).send("บันทึกไม่สำเร็จ");
        }
        else {
            //return json of recordset
            res.send("บันทึกสำเร็จ");
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
    con.query(sql,  function (err, result, fields) {
        if (err) {

        } else {
            res.send(result);
        }
    });
});



//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< visit activity >>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/activity", function (req, res) {
    res.sendFile(path.join(__dirname, "activity.html"));
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< show information >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_activity", function (req, res) {
    let sql = "SELECT `activity_name`, `organizer`, `information`, `limit_join`, `date`, `number_join`  FROM `activity` "
    con.query(sql, [information, img, date, title], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }

        else {
            //return json of recordset
            res.send("บันทึกสำเร็จ");
        }
    });
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< visit profile  >>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_profile", function (req, res) {
    const id = req.body.id
    let sql = "SELECT l.name,l.img,l.email,o.address,o.tel FROM login l, old_info o WHERE l.id_login =?"
    con.query(sql, [id], function (err, result, fields) {

        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        else {
            //return json of recordset
            res.send(result);
        }
    });
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< visit user profile >>>>>>>>>>>>>>>>>>>>>>>
app.get("/user_profile", function (req, res) {
    res.sendFile(path.join(__dirname, "user_profile.html"));
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< oldinfo page >>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/confirmad", function (req, res) {
    res.sendFile(path.join(__dirname, "oldinfo.html"));
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Login for hospital >>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/Loginforhospital", function (req, res) {
    res.sendFile(path.join(__dirname, "oldinfo.html"));
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Login for hospital >>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/admin", function (req, res) {
    res.sendFile(path.join(__dirname, "mainpage_admin.html"));
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< display carousel >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/carouselEdit", function (req, res) {
    res.sendFile(path.join(__dirname, "carouselEdit.html"))
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< return name of each activity >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/name", function (req, res) {
    res.sendFile(path.join(__dirname, "name.html"))
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Return oldinfo page >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/oldinfo", function (req, res) {
    res.sendFile(path.join(__dirname, "oldinfo.html"))
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<Return static page >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/static", function (req, res) {
    res.sendFile(path.join(__dirname, "static.html"))
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Return adminactivity page >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/adminactivity", function (req, res) {
    res.sendFile(path.join(__dirname, "adminactivity.html"))
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Return oldinfo for hospital page >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/oldinfo_hospital", function (req, res) {
    res.sendFile(path.join(__dirname, "oldinfo_hospital.html"))
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Return QR code page >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/QRcode", function (req, res) {
    res.sendFile(path.join(__dirname, "QRcode.html"))
});


//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< visit health page >>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/health", function (req, res) {
    res.sendFile(path.join(__dirname, "health.html"));
});


//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< mainpage admin >>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/mainpage_admin", function (req, res) {
    res.sendFile(path.join(__dirname, "mainpage_admin.html"));
});


//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<   editoldinfo   >>>>>>>>>>>>>>>>>>>>>>>>>>>
app.put("/edit_oldinfo", function (req, res) {
    const name = req.body.name;
    const IDcard = req.body.IDcard;
    const Address = req.body.Address;
    const Emergencycall = req.body.Emergencycall;
    const Mobilephone = req.body.Mobilephone;
    const Symptom = req.body.Symptom;
    const Allergic = req.body.Allergic;
    const id = req.body.id;
    const surname = req.body.surname;

    const sql = "update user set name = ?,surname = ?,IDcard = ?,Address = ?,Emergencycall = ?,Mobilephone =?,Symptom =?,Allergic = ? where id_old= ?";

    con.query(sql, [name, surname, IDcard, Address, Emergencycall, Mobilephone, Symptom, Allergic, id], function () {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(401).send("บันทึกไม่สำเร็จ");
        }
        else {
            //return json of recordset
            res.send("บันทึกสำเร็จ");
        }
    });
});


//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<  joinactivity  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.put("/joinactivity", function (req, res) {
    const id_old = req.body.id_old;
    const id_activity = req.body.id_activity;

    const sql = "update user set id_old = ?,id_activity = ? where = ?";

    con.query(sql, [id_old, id_activity], function () {
        
            if (err) {
                console.error(err.message);
                res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
                return;
            }
            const numrows = result.length;

            if (numrows == 0) {
                res.status(401).send("เข้าร่วมไม่สำเร็จ");
            }
            else {
                //return json of recordset
                res.send("เข้าร่วมสำเร็จ");
            }
        });
});
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<  uploading_profile  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.put("/uploadimg_profile", function (req, res) {
    const img = req.body.img;

    const spl = "update user set img = ? where = ?";

    con.query(sql, [img], function () {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(401).send("อัพโหลดไม่สำเร็จ");
        }
        else {
            //return json of recordset
            res.send("อัพโหลดสำเร็จ");
        }
    });

});
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<  Edit_information_of_profile  >>>>>>>>>>>>>>>>>>>
app.put("/edit_pofileinfo", function (req, res) {
    const name = req.body.name;
    const tel = req.body.tel;
    const email = req.body.email;
    const address = req.body.address;
    const id = req.body.id;

    const spl = "update user set name = ?, tel = ?, email = ?, address = ? where id_login = ?";

    con.query(sql, [name, tel, email, address, id], function () {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(401).send("บันทึกไม่สำเร็จ");
        }
        else {
            //return json of recordset
            res.send("บันทึกสำเร็จ");
        }
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
    const id = req.body.id
    const spl = "update old_info set date = ?,name = ?,surname = ?,id_card = ?,address = ?,id_login =? where id_old =? ";

    con.query(sql, [date, name, surname, id_card, address, id_login, id], function () {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(401).send("บันทึกไม่สำเร็จ");
        }
        else {
            //return json of recordset
            res.send("บันทึกสำเร็จ");
        }
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

    const spl = "update old_info set date = ?,name = ?,surname = ?,id_card = ?,address = ?,id_login =:? ";

    con.query(sql, [date, name, surname, id_card, address, id_login], function () {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(401).send("บันทึกไม่สำเร็จ");
        }
        else {
            //return json of recordset
            res.send("บันทึกสำเร็จ");
        }
    });
});



//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< canceljoin activity >>>>>>>>>>>>>>>>>>>>>>>>>>>
app.put("/cancel_joinactivity", function (req, res) {
    const id_join = req.body.id_join
    const join_status = req.body.join_status

    const sql = "UPDATE oldactive.join SET join_status = ? WHERE id_join = ? "
    con.query(sql, [join_status, id_join], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(401).send("ยกเลิกไม่สำเร็จ");
        }
        else {
            //return json of recordset
            res.send("ยกเลิกสำเร็จ");
        }
    });
});





//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< cancel approve >>>>>>>>>>>>>>>>>>>>>>>>>>>
app.put("/cancel_approveinfo", function (req, res) {
    const approve_status = req.body.approve_status;
    const old_id = req.body.old_id;
    const sql = "UPDATE oldactive.old_info SET Approve_status = ? WHERE `id_old` = ?"
    con.query(sql, [approve_status, old_id], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(401).send("ยกเลิกไม่สำเร็จ");
        }
        else {
            //return json of recordset
            res.send("ยกเลิกสำเร็จ")
        }
    });
});



// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<   admin mainpage       >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_mainpage_admin", function (req, res) {

    let sql = "SELECT `information`,date FROM `annoucement`"
    con.query(sql, function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        else {
            //return json of recordset
            res.send(result);
        }
    });
});

// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<   Static       >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_static", function (req, res) {

    let sql = "SELECT `date`, `activity_name`, 'number_join' FROM `activity` "
    con.query(sql, function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }

        else {
            //return json of recordset
            res.send(result);
        }
    });
});

// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<   admin activity       >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_admin_activity", function (req, res) {

    let sql = "SELECT `date`,activity_name,'organizer',`information`,'number_join',limit_join FROM `activity`"
    con.query(sql, function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }

        else {
            //return json of recordset
            res.send(result);
        }
    });
});


// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<   display QrCode       >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_Qrcode", function (req, res) {

    const Id = req.body.Id
    let sql = "SELECT `name`, `surname`, 'address','tel' FROM `old_info` where id_old = ? "
    con.query(sql, [Id], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(503).send("No data");
        }
        else {
            //return json of recordset
            res.json(result);
        }
    });
});

// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<   display confirmad       >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_confirmad", function (req, res) {

    let sql = "SELECT 'date',`name`, `surname`, 'id_card','address','id_old' FROM `old_info` where Approve_status = 0 "
    con.query(sql, function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(401).send("ไม่มีข้อมูล");
        }
        else {
            //return json of recordset
            res.json(result);
        }
    });
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< show information of carousel edit page >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_carouselEdit", function (req, res) {

    const Id = req.body.Id;

    let sql = "SELECT `img`, `information` FROM `activity` where id_activity = ?";
    con.query(sql, [Id], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(401).send("ไม่มีข้อมูล");
        }
        else {
            //return json of recordset
            res.json(result);
        }
    });
});



//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< show information of health page >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_health", function (req, res) {

    const Id = req.body.Id;

    let sql = "SELECT `img` , `title` , `date` , `information` FROM `cardinfo` where Id_healthcard = ?"
    con.query(sql, [Id], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(401).send("ไม่มีข้อมูล");
        }
        else {
            //return json of recordset
            res.json(result);
        }
    });
});



//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< show information of elder page >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_oldinfo", function (req, res) {

    const Id = req.body.Id;


    let sql = "SELECT `name` , `surname` , `id_card` , `address`, `tel`, `emergency_call`, `symptoms`, `Approve_status`, `allergic medicatation` FROM `old_info` where Id_old = ?"
    con.query(sql, [Id], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(401).send("ไม่มีข้อมูล");
        }
        else {
            //return json of recordset
            res.json(result);
        }
    });
});



// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< update information of carousel edit page >>>>>>>>>>>>>>>>>>>>>>>>>>
app.put("/save_carouselEdit", function (req, res) {
    const img = req.body.img;
    const information = req.body.information;
    const Id = req.body.Id;

    const sql = "UPDATE `activity` SET img = ?, information = ? WHERE id_activity = ?";
    con.query(sql, [img, information, Id], function (err, result, fields) {
        if (err) {
            console.log(err)
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
        }
        else {
            res.send("บันทึกสำเร็จ");
        }
    });
});


//<<<<<<<<<<<<<<<<<<<<<< save activity >>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/save_add_adminactivity", function (req, res) {
    const date = req.body.date;
    const activity_name = req.body.activity_name;
    const organizer = req.body.organizer;
    const information = req.body.information;
    const limit_join = req.body.limit_join;
    const Id_login = req.body.Id;


    const sql = "INSERT INTO activity (date,activity_name,organizer,information,limit_join,id_login,number_join) VALUES(?,?,?,?,?,?,?)";

    con.query(sql, [date, activity_name, organizer, information, limit_join, Id_login, 0], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(401).send("บันทึกไม่สำเร็จ");
        }
        else {
            //return json of recordset
            res.send("บันทึกสำเร็จ");
        }
    });
});
//<<<<<<<<<<<<<<<<<<<<<<<<<<< edit button >>>>>>>>>>>>>>>>>>>>>>>>>>
app.put("/save_edit_adminactivity", function (req, res) {
    const date = req.body.date;
    const activity_name = req.body.activity_name;
    const organizer = req.body.organizer;
    const information = req.body.information;
    const limit_join = req.body.limit_join;
    const Id = req.body.Id


    const sql = "update activity set date = ?,activity_name=?,organizer=?,information=?,limit_join = ? where id_activity = ?";

    con.query(sql, [date, activity_name, organizer, information, limit_join, Id], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(401).send("บันทึกไม่สำเร็จ");
        }
        else {
            //return json of recordset
            res.send("บันทึกสำเร็จ");
        }
    });
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<< add old information >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/add_oldinfo", function (req, res) {
    const Name = req.body.Name;
    const ID_card = req.body.ID_card;
    const Address = req.body.Address;
    const Emergency_call = req.body.Emergency_call;
    const Mobile_phone = req.body.Mobile_phone;
    const Symptom = req.body.Symptom;
    const Allergic = req.body.Allergic;
    const surname = req.body.surname;
    const Id_login = req.body.Id_login;

    const sql = "INSERT INTO `old_info`( `id_card`, `name`, `surname`, `address`, `tel`, `emergency_call`, `symptoms`,  `id_login`, `allergic medicatation`) VALUES (?,?,?,?,?,?,?,?,?)";

    con.query(sql, [ID_card, Name, surname, Address, Mobile_phone, Emergency_call, Symptom, Id_login, Allergic], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        else {
            //return json of recordset
            res.send("บันทึกสำเร็จ");
        }
    });
});


//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< add note >>>>>>>>>>>>>>>>>
app.get("/add_note", function (req, res) {
    const date = req.body.date;
    const note = req.body.note;
    const Id = req.body.Id
    const Id_login = req.body.Id_login


    const sql = "INSERT INTO note (`date`,`note`,`id_old`,`id_login`) VALUES(?,?,?,?)";

    con.query(sql, [date, note, Id, Id_login], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(401).send("บันทึกไม่สำเร็จ");
        }
        else {
            //return json of recordset
            res.send("บันทึกสำเร็จ");
        }
    });
});



//<<<<<<<<<<<<<<<<<<<<<<<<<< add anoucement >>>>>>>>>>>>>>>>>>>>>>
app.get("/save_add_announce", function (req, res) {
    const date = req.body.date;
    const information = req.body.information;
    const Id_login = req.body.Id_login


    const sql = "INSERT INTO annoucement (`date`,`information`,`id_login`) VALUES(?,?,?)";

    con.query(sql, [date, information, Id_login], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(401).send("บันทึกไม่สำเร็จ");
        }
        else {
            //return json of recordset
            res.send("บันทึกสำเร็จ");
        }
    });
});




// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< update information of edit health page >>>>>>>>>>>>>>>>>>>>>>>>>>
app.put("/save_edit_health", function (req, res) {
    const img = req.body.img;
    const title = req.body.title;
    const date = req.body.date;
    const information = req.body.information;
    const Id = req.body.Id;

    const sql = "UPDATE `cardinfo` SET img = '?', title = '?', date = '?', information = '?' WHERE id_healthcard = ?";
    con.query(sql, [img, title, date, information, Id], function (err, result, fields) {
        if (err) {
            console.log(err)
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
        }
        else {
            res.send("บันทึกสำเร็จ");
        }
    });
});

// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< start port >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const PORT = 50000
app.listen(PORT, function () {
    console.log("Sever is running at " + PORT);
});