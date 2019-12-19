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

//1...<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Root >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "mainpage.html"));
});

//2...<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< visitmainpage show annouce>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/mainpage_anouce", function (req, res) {
    let sql = "SELECT information FROM annoucement WHERE date =(SELECT MAX(date) FROM annoucement)"
    con.query(sql,  function (err, result, fields) {
        if (err) {

        } else {
            
            res.send(result);
        }
    });
});

//3..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< visit mainpage show carousel>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/mainpage_carousel", function (req, res) {
    let sql = "SELECT information,img FROM activity WHERE img != '' AND img IS NOT null AND activity_status = 1"
    con.query(sql,  function (err, result, fields) {
        if (err) {

        } else {
            
            res.send(result[0],result[1],result[2]);
        }
    });
});


//4..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< visitmainpage show health>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/mainpage_healthcard", function (req, res) {
    let sql = "SELECT information,img,title FROM cardinfo ORDER BY date DESC"
    con.query(sql,  function (err, result, fields) {
        if (err) {

        } else {
            
            res.send(result[0],result[1],result[2]);
        }
    });
});


//5..------------------------------- Login ----------------------------------
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
                        res.status(503).send("การรับรองเซิร์ฟเวอร์ผิดพลาด");
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
                        res.status(403).send("รหัสไม่ถูกต้อง");
                    }
                });
            }
        }
    });
});




//6.. <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< signup >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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
                res.status(503).send("ฐานข้อมูลเซิร์ฟเวอร์ผิดพลาด");
                return;
            }

            // get inserted rows
            const numrows = result.affectedRows;
            if (numrows != 1) {
                console.error("แทรกข้อมูลสู่ฐานข้อมูลไม่สำเร็จ");
                res.status(503).send("ฐานข้อมูลเซิร์ฟเวอร์ผิดพลาด");
            }
            else {
                res.send("สมัครสำเร็จ");
            }
        });
    });
});

//7..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< visitmainpage show name on nave>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/mainpage_nav", function (req, res) {
    let sql = "SELECT username FROM login WHERE id_login =?"
    con.query(sql,  function (err, result, fields) {
        if (err) {

        } else {
            
            res.send(result);
        }
    });
});


//8..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< visit user profile >>>>>>>>>>>>>>>>>>>>>>>
app.get("/user_profile", function (req, res) {
    res.sendFile(path.join(__dirname, "user_profile.html"));
});


//9..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< visit profile show infomation >>>>>>>>>>>>>>>>>>>>>>>>>>
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


//10..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Return oldinfo page >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/oldinfo", function (req, res) {
    res.sendFile(path.join(__dirname, "oldinfo.html"))
});


//11..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< show information of elder page >>>>>>>>>>>>>>>>>>>>>>>>
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


//12..<<<<<<<<<<<<<<<<<<<<<<<<<<< add old information >>>>>>>>>>>>>>>>>>>>>>>>
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


//13..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Return QR code page >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/QRcode", function (req, res) {
    res.sendFile(path.join(__dirname, "QRcode.html"))
});


//14..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<   display QrCode >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_Qrcode", function (req, res) {

    const Id = req.body.Id
    let sql = "SELECT `name`, `surname`, 'address','tel' FROM `old_info` where id_old = ? "
    con.query(sql, [Id], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        const numrows = result.length;

        if (numrows == 0) {
            res.status(503).send("ไม่มีข้อมูล");
        }
        else {
            //return json of recordset
            res.json(result);
        }
    });
});

//15..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< visit treatment >>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/treatment", function (req, res) {
    res.sendFile(path.join(__dirname, "treatment.html"));
});

//16..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< show note >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_note", function (req, res) {

    const Id  = req.body.Id;

    let sql = "SELECT n.`date`,n.`note`,l.username FROM note n join login l where n.`id_old` = ? AND n.id_login = l.id_login"
    con.query(sql,[Id], function (err, result, fields) {
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

//17..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<   editoldinfo   >>>>>>>>>>>>>>>>>>>>>>>>>>>
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
        
        else {
            //return json of recordset
            res.send("บันทึกสำเร็จ");
        }
    });
});

//18..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< visit activity >>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/activity", function (req, res) {
    res.sendFile(path.join(__dirname, "activity.html"));
});

//19..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Show activity user  >>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_activityuser", function (req, res) {
    let sql = "SELECT `activity_name`, `organizer`, `information`, `limit_join`, `date`, `number_join`  FROM `activity` WHERE `activity_status` = 1"
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

//20..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< canceljoin activity >>>>>>>>>>>>>>>>>>>>>>>>>>>
app.put("/status_joinactivity", function (req, res) {
    const id_old = req.body.id_old
    const join_status = req.body.join_status

    const sql = "UPDATE join SET join_status = ? WHERE id_old = ? "
    con.query(sql, [join_status, id_old], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        if (join_status == 1) {
            res.status(401).send("เข้าร่วมสำเร็จ");
        }
        else {
            //return json of recordset
            res.send("ยกเลิกสำเร็จ");
        }
    });
});

//21..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< confirm page >>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/confirmad", function (req, res) {
    res.sendFile(path.join(__dirname, "oldinfo.html"));
});

//22..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< display confirmad >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_confirmad", function (req, res) {

    let sql = "SELECT 'date',`name`, `surname`, id_card,address ,id_old FROM `old_info` ORDER BY Approve_status "
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

//23..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< update confirmad page >>>>>>>>>>>>>>>>>>>>>>>>>>
app.put("/confirm_oldinformation", function (req, res) {
    const Id = req.body.Id;
    const status =req.body.status;

    const sql = "UPDATE `old_info` SET Approve_status = ? WHERE id_old = ?";
    con.query(sql, [ status,Id], function (err, result, fields) {
        if (err) {
            console.log(err)
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
        }
        else {
            res.send("บันทึกสำเร็จ");
        }
    });
});

//24..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< visit health page >>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/health", function (req, res) {
    res.sendFile(path.join(__dirname, "health.html"));
});

//25..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< show information of health page >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_health", function (req, res) {


    let sql = "SELECT `img` , `title` , `date` , `information` FROM `cardinfo` ORDER BY date DESC"
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

//26..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< update information of edit health page >>>>>>>>>>>>>>>>>>>>>>>>>>
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

//27..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< saveaddhealth >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

app.post("/save_add_health", function (req, res) {
    const date = req.body.date;
    const information = req.body.information;
    const img = req.body.img;
    const title = req.body.title;

    const sql = "INSERT INTO cardinfo(date, information,img,title) VALUES (?,?,?,?)";
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


//28..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Return edit announcement page >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/annoucementEdit", function (req, res) {
    res.sendFile(path.join(__dirname, "mainpage_admin.html"))
});

//29..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<  anouncement admin    >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_mainpage_admin", function (req, res) {

    let sql = "SELECT `information`,date FROM `annoucement` WHERE status = 1"
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

//30..<<<<<<<<<<<<<<<<<<<<<<<<<< add anoucement >>>>>>>>>>>>>>>>>>>>>>
app.get("/save_add_announce", function (req, res) {
    const date = req.body.date;
    const information = req.body.information;
    const Id_login = req.body.Id_login


    const sql = "INSERT INTO annoucement (`date`,`information`,`id_login`,status) VALUES(?,?,?,1)";

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

//31..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< delete_edit_anoucement >>>>>>>>>>>>>>>>>>>>>>>>>>

app.put("/delete_announce", function (req, res) {
    const date = req.body.date;
    const information = req.body.information;
    const Id = req.body.Id

    const sql = "Update announcement SET  status = 0 WHERE id_annoucement = ?";
    con.query(sql, [information, date,Id], function (err, result, fields) {
        if (err) {
            console.error(err.message);
            res.status(500).send("เซิร์ฟเวอร์ไม่ตอบสนอง");
            return;
        }
        
        else {
            //return json of recordset
            res.send("ลบสำเร็จ");
        }
    });
});

//32..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< save_edit_anoucement >>>>>>>>>>>>>>>>>>>>>>>>>>

app.put("/save_edit_announce", function (req, res) {
    const date = req.body.date;
    const information = req.body.information;
    const Id = req.body.Id

    const sql = "Update annoucement SET information = ?, status = 1 ,date= ? WHERE id_annoucement = ?";
    con.query(sql, [information, date,Id], function (err, result, fields) {
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

//33..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<Return static page >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/static", function (req, res) {
    res.sendFile(path.join(__dirname, "static.html"))
});

//34..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Static  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
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

//35..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< return name of each activity >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/name", function (req, res) {
    res.sendFile(path.join(__dirname, "name.html"))
});

//36..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< name display >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_name", function (req, res) {


    const Idjoin = req.body.Idjoin

    let sql = "SELECT o.name,o.surname FROM old_info o JOIN `join` j WHERE j.join_status = 3 AND o.id_card = j.id_card AND j.id_activity = ?  "
    con.query(sql,[Idjoin], function (err, result, fields) {
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

//37..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Return adminactivity page >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/adminactivity", function (req, res) {
    res.sendFile(path.join(__dirname, "adminactivity.html"))
});

//38..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Show activity admin  >>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_activityadmin", function (req, res) {
    let sql = "SELECT `activity_name`, `organizer`, `information`, `limit_join`, `date`, `number_join`, `activity_status` FROM `activity`"
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

//39..<<<<<<<<<<<<<<<<<<<<<< save activity >>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/save_add_adminactivity", function (req, res) {
    const date = req.body.date;
    const activity_name = req.body.activity_name;
    const organizer = req.body.organizer;
    const information = req.body.information;
    const limit_join = req.body.limit_join;
    const Id_login = req.body.Id;


    const sql = "INSERT INTO activity (date,activity_name,organizer,information,limit_join,id_login,number_join,activity_status) VALUES(?,?,?,?,?,?,0,1)";

    con.query(sql, [date, activity_name, organizer, information, limit_join, Id_login], function (err, result, fields) {
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

//40..<<<<<<<<<<<<<<<<<<<<<<<<<<< edit button >>>>>>>>>>>>>>>>>>>>>>>>>>
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
        
        else {
            //return json of recordset
            res.send("บันทึกสำเร็จ");
        }
    });
});

//41..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< CHECK activity >>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/Checkactivity", function (req, res) {
    res.sendFile(path.join(__dirname, "checkactivity.html"));
});

//42..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<  checkactivity show    >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_checkactivity", function (req, res) {

    const Id = req.body.Id;
    let sql = "SELECT o.name,o.surname FROM old_info o JOIN `join` j WHERE j.join_status = 1 AND o.id_card = j.id_card AND j.id_activity = ?  "
    con.query(sql,[Id], function (err, result, fields) {
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

//43..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<  checkactivity confirm    >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/checkactivityconfirm", function (req, res) {

    const Idac = req.body.Idac;
    const Idol = req.body.Idol;

    let sql = "UPDATE `join` SET `join_status`=3 WHERE `id_activity`= ? AND `id_card`=(SELECT id_card FROM old_info WHERE id_old = ?)"
    con.query(sql,[Idac,Idol], function (err, result, fields) {
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

//44..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Login for hospital >>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/Loginforhospital", function (req, res) {
    res.sendFile(path.join(__dirname, "Loginforhospital.html"));
});

//45..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Return oldinfo for hospital page >>>>>>>>>>>>>>>>>>>>>>>>
app.get("/oldinfo_hospital", function (req, res) {
    res.sendFile(path.join(__dirname, "oldinfo_hospital.html"))
});

//46..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<  Show oldinfo_hospital  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get("/display_oldinfo_hospitalinfo", function (req, res) {

    const Id = req.body.Id;
    let sql = "SELECT `id_card`, `name`, `surname`, `address`, `emergency_call`, `symptoms`, `allergic medicatation` FROM `old_info` WHERE `id_old`= ?"
    con.query(sql,[Id], function (err, result, fields) {
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

//47..<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< add note >>>>>>>>>>>>>>>>>
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

// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< start port >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const PORT = 50000
app.listen(PORT, function () {
    console.log("Sever is running at " + PORT);
});