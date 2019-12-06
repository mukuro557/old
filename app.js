//<=========== Import packages ==========>
const express = require("express");
const path = require("path");
const body_parser = require("body-parser");
const multer = require("multer");
const mysql = require("mysql");
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

    const sql = "SELECT password, role FROM user WHERE username=?";
    con.query(sql, [username], function (err, result, fields) {
        if (err) {
            res.status(500).send("Server error");
        }
        else {
            const numrows = result.length;
            //if that user is not unique
            if (numrows != 1) {
                //login failed
                res.status(401).send("Wrong username");
            }
            else {
                // console.log(result[0].password);
                //verify password, async method
                bcrypt.compare(password, result[0].password, function (err, resp) {
                    if (err) {
                        res.status(503).send("Authentication Server error");
                    }
                    else if (resp == true) {
                        //correct login send destination URL to client
                        if (result[0].role == 1) {
                            //admin
                            res.send("/admin");
                        }
                        else {
                            //users
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