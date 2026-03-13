var express = require('express');
var router = express.Router();
let userController = require('../controllers/users')
//let { RegisterValidator, handleResultValidator } = require('../utils/validatorHandler')
let { RegisterValidator, handleResultValidator, ChangePasswordValidator } = require('../utils/validatorHandler')
let bcrypt = require('bcrypt')
let jwt = require('jsonwebtoken')
let {checkLogin} = require('../utils/authHandler')

// Thêm thư viện đọc file và đường dẫn
const fs = require('fs');
const path = require('path');

// Đọc private.key một lần duy nhất khi khởi động file này
const privateKey = fs.readFileSync(path.join(__dirname, '../keys/private.key'), 'utf8');

/* GET home page. */
router.post('/register', RegisterValidator, handleResultValidator, async function (req, res, next) {
    let newUser = userController.CreateAnUser(
        req.body.username,
        req.body.password,
        req.body.email,
        "69aa8360450df994c1ce6c4c"
    );
    await newUser.save()
    res.send({
        message: "dang ki thanh cong"
    })
});
router.post('/login', async function (req, res, next) {
    let { username, password } = req.body;
    let getUser = await userController.FindByUsername(username);
    if (!getUser) {
        res.status(403).send("tai khoan khong ton tai");
    } else {
        if (getUser.lockTime && getUser.lockTime > Date.now()) {
            res.status(403).send("tai khoan dang bi ban");
            return;
        }
        if (bcrypt.compareSync(password, getUser.password)) {
            await userController.SuccessLogin(getUser);
            
            let token = jwt.sign({
                id: getUser._id
            }, privateKey, {
                algorithm: 'RS256', 
                expiresIn: '30d'
            });
            
            res.send(token); 
        } else {
            await userController.FailLogin(getUser);
            res.status(403).send("thong tin dang nhap khong dung");
        }
    }
});

router.get('/me', checkLogin, function(req,res,next){
    res.send(req.user);
});

router.post('/changepassword', checkLogin, ChangePasswordValidator, handleResultValidator, async function (req, res, next) {
    // req.user đã được gán từ middleware checkLogin
    let user = req.user; 
    let { oldpassword, newpassword } = req.body;

    // 1. Kiểm tra mật khẩu cũ có khớp không
    if (!bcrypt.compareSync(oldpassword, user.password)) {
        return res.status(400).send("Mat khau cu khong dung");
    }

    // 2. Kiểm tra mật khẩu mới không được trùng mật khẩu cũ
    if (oldpassword === newpassword) {
        return res.status(400).send("Mat khau moi phai khac mat khau cu");
    }

    // 3. Cập nhật mật khẩu mới
    // Lưu ý: Middleware pre('save') trong file models/users.js sẽ TỰ ĐỘNG mã hóa bcrypt mật khẩu này trước khi lưu vào DB.
    user.password = newpassword;
    await user.save();

    res.send({
        success: true,
        message: "Doi mat khau thanh cong"
    });
});

module.exports = router;
