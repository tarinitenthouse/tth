const express = require('express');
const cors = require("cors");
const app = express();
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const port = 4000;

// for handling cors
const cors_options = {
    // origin: "http://tth.000.pe",
    origin: "*",
    methods: "GET, POST, PUT, DELETE, PATCH, HEAD",
    methods: "POST",
    credentials: true,
}
app.use(cors(cors_options));

//handling Database :-
const connect_db = async () => {
    try {
        // await mongoose.connect('mongodb://localhost:27017/Tarini_tent_house');
        await mongoose.connect('mongodb+srv://tth_admin:TTH98570@tth-cluster.jc6u3.mongodb.net/Tarini_tent_house?retryWrites=true&w=majority&appName=tth-cluster');
        console.log("db is connected", mongoose.connection.host)
    }
    catch (error) {
        console.log(error)
    }
}

connect_db();

const users_schema = new mongoose.Schema({
    name: String,
    otp: Number,
    password: String,
    cookie_user_id: String
})

const comment_schema = new mongoose.Schema({
    name: String,
    email: String,
    phone: Number,
    subject: String,
    description: String
})

const User = mongoose.model("User", users_schema);
const Comment = mongoose.model("Comment", comment_schema);

app.use(express.json()); // for use Json file

const get_random_number = (value) => {
    return Math.floor(Math.random() * value);
}

const send_mail = async (email_id, subject, text) => {
    const auth = nodemailer.createTransport({
        service: "gmail",
        secure: true,
        port: 465,
        auth: {
            user: "tarinitenthouse.in@gmail.com",
            pass: "fakh dgdu pbtf giac"

        }
    })

    const receiver = {
        from: "tarinitenthouse.in@gmail.com",
        to: email_id,
        subject: subject,
        text: text
    }

    const result = new Promise((resolve, reject) => {
        auth.sendMail(receiver, async (error, info) => {
            if (error) {
                resolve(400);
                console.log("Error: " + error)
            }
            else {
                console.log("Email send successfully.");
                resolve(200);
            }
        })
    })
    return await result;
}

app.get('/', (req, res) => {
    res.send('Hello Welcome to my Server !')
})

app.post('/api/post/:slug', async (req, res) => {
    if (req.params.slug == "email") {
        const data = await req.body;
        const email_id = await data.email;
        const otp = get_random_number(1000000);

        const email_status = await send_mail(email_id, "Verify email address for Tarini Tent House", `Hello,
             Thank you for signing up! To able to create your first account on Tarini Tent House,
              Please verify your email address By providing this OTP (${otp}) in our website https://tth.000.pe.
            If you did not sign up, no further action is required, your email address will be deleted automatically after a few days.`)

        if (email_status == 200) {
            await User.deleteMany({ name: email_id });
            const user = new User({
                name: email_id,
                otp: otp
            })
            await user.save();
            res.send({ status: "otp_send" });
        }
        else if (email_status == 400) {
            res.send({ status: "otp_doesn't_send" });
        }
    }
    else if (req.params.slug == "sign_up") {
        const user_data = await req.body;
        const email_id = user_data.email;
        const server_otp = await User.find({ name: email_id });
        if (server_otp[0].otp == user_data.otp) {
            console.log("Otp matched successfully");
            await User.deleteMany({ name: email_id });
            const user = new User({
                name: email_id,
                otp: user_data.otp,
                password: user_data.password,
                cookie_user_id: get_random_number(1000000)
            })
            await user.save();
            console.log(user.cookie_user_id);
            res.send({ status: "otp_matched", cookie_user_id: user.cookie_user_id });
        }
        else {
            console.log("Enter otp doesn't matched ???");
            res.send({ status: "otp_doesn't_matched" });
        }
    }
    else if (req.params.slug == "login") {
        const user_data = await req.body;
        const user_email = await User.find({ name: user_data.email });
        const user_password = await User.find({ password: user_data.password });
        if (!user_email.length >= 1) {
            res.send({ status: "user_does_not_exist" })
        }
        else if (!user_password.length >= 1) {
            res.send({ status: "wrong_password" })
        }
        else if (user_email.length >= 1 && user_password.length >= 1) {
            const data = {
                name: user_email[0].name,
                cookie_user_id: user_email[0].cookie_user_id,
                status: "email_and_password_matched"
            }
            res.send(data)
        }
    }
    else if (req.params.slug == "comment") {
        const user_data = await req.body;
        const email_status = await send_mail(user_data.email, "Your request status of Tarini Tent House", `Hello,
            Thank you for requesting TTH(Tarini Tent House)! Your request submited successfully. As soon possible your request will be resolve by our team member. Please Login or Singn Up to modify your request .`)

        if (email_status == 200) {
            await Comment.deleteMany({ description: user_data.description });
            const comment = new Comment(user_data);
            await comment.save();
            res.send({ status: "comment_saved" });
        }
        else if (email_status == 400) {
            res.send({ status: "comment_saved_failed" });
        }
    }
    else if (req.params.slug == "user_existence") {
        const user_data = await req.body;
        const user_id = await User.find({ cookie_user_id: user_data.cookie_user_id }); // return a array which contain the cookie_user_id value 
        if (user_id.length >= 1) {
            res.send({ status: "cookie_user_id_matched", name: user_id[0].name });
        }
    }
});

app.listen(port, () => {
    console.log(`App listening port is ${port}`);
})
