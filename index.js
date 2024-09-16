const express = require('express');
const cors = require("cors");
const app = express();
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const port = 4000;

// for handling cors
const cors_options = {
    // origin: "http://127.0.0.1:3000", // public URL
    origin: "https://tth.000.pe/", // public URL
    // origin: "*",
    methods: "GET, POST, PUT, DELETE, PATCH, HEAD",
    methods: "POST",
    credentials: true,
}
app.use(cors(cors_options));

//handling Database :-
const connect_db = async () => {
    try {
        // await mongoose.connect('mongodb://localhost:27017/Tarini_tent_house'); // for local database
        await mongoose.connect('mongodb+srv://tth_admin:TTH98570@tth-cluster.jc6u3.mongodb.net/Tarini_tent_house?retryWrites=true&w=majority&appName=tth-cluster'); // for internet database
        console.log("db is connected", mongoose.connection.host)
    }
    catch (error) {
        console.log(error)
    }
}

connect_db();

const temp_user_schema = new mongoose.Schema({
    email: String,
    otp: String,
})

const users_schema = new mongoose.Schema({
    first_name: String,
    middle_name: String,
    last_name: String,
    email: String,
    phone_number: String,
    password: String,
    user_cookie_id: String,
    country: String,
    state: String,
    district: String,
    block: String,
    gram_panchayat: String,
    village: String,
    postal_zip_code: String
})

const comment_schema = new mongoose.Schema({
    user_cookie_id: String,
    date: String,
    name: String,
    email: String,
    phone: String,
    subject: String,
    description: String,
    reply: String
})

const Temp_user = mongoose.model("temp User", temp_user_schema);
const User = mongoose.model("user", users_schema);
const Comment = mongoose.model("comment", comment_schema);

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
    res.send('Hello Welcome to my Server ?')
})

app.post('/api/post/:slug', async (req, res) => {
    if (req.params.slug == "send_otp") {
        const user_data = await req.body;
        const email_id = await user_data.email;
        const user_existence = await User.find({ email: email_id });

        if (user_existence.length < 1 || user_data.forget_password_status == "true") {
            const otp = get_random_number(1000000);
            let email_status;
            if (user_data.forget_password_status == "true") {
                email_status = await send_mail(email_id, "Verify email address for reset password on Tarini Tent House", `Hello,
                 To reset the account password on Tarini Tent House,
                  Please verify your email address By providing this OTP (${otp}) in our website https://tth.000.pe.
                If you are not doing this, please contact us as soon possible, or else no further action is required, your email address will be deleted automatically after a few minutes.`)
            } else {
                email_status = await send_mail(email_id, "Verify email address for Tarini Tent House", `Hello,
                 Thank you for signing up! To able to create your first account on Tarini Tent House,
                  Please verify your email address By providing this OTP (${otp}) in our website https://tth.000.pe.
                If you did not sign up, no further action is required, your email address will be deleted automatically after a few minutes.`)
            }

            if (email_status == 200) {
                await Temp_user.deleteMany({ email: email_id });
                const temp_user = new Temp_user({
                    email: email_id,
                    otp: otp
                })
                await temp_user.save();
                res.send({ status: "otp_send" });
            }
            else if (email_status == 400) {
                res.send({ status: "otp_doesn't_send" });
            }
        }
        else if (user_existence.length >= 1) {
            res.send({ status: "user_already_exist" });
        }
    }
    else if (req.params.slug == "sign_up") {
        const user_data = await req.body;
        const email_id = user_data.email;
        const server_otp = await Temp_user.find({ email: email_id });
        if (server_otp.length >= 1) { // if there is any temp user exist or not
            if (server_otp[0].otp == user_data.otp) {
                console.log("Otp matched successfully");
                await Temp_user.deleteMany({ email: email_id });
                if (user_data.forget_password_status == "true") {
                    const user_all_data = await User.findOneAndUpdate({ email: email_id }, { password: user_data.password });
                    res.send({ status: "otp_matched", user_cookie_id: user_all_data.user_cookie_id });
                }
                else {
                    await User.deleteMany({ email: email_id });
                    const user = new User({
                        email: email_id,
                        password: user_data.password,
                        user_cookie_id: get_random_number(1000000)
                    })
                    await user.save();
                    res.send({ status: "otp_matched", user_cookie_id: user.user_cookie_id });
                }
            }
            else {
                console.log("Enter otp doesn't matched ???");
                res.send({ status: "otp_doesn't_matched" });
            }
        }

    }
    else if (req.params.slug == "login") {
        const user_data = await req.body;
        const user_email = await User.find({ email: user_data.email });
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
                user_cookie_id: user_email[0].user_cookie_id,
                status: "email_and_password_matched"
            }
            res.send(data)
        }
    }
    else if (req.params.slug == "post_comment") {
        const user_data = await req.body;
        const user_details = await User.find({ user_cookie_id: user_data.user_cookie_id }); // return a array which contain the user_cookie_id value 
        if (user_details.length >= 1) {
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
    }
    else if (req.params.slug == "user_existence") {
        const user_data = await req.body;
        const user_details = await User.find({ user_cookie_id: user_data.user_cookie_id }); // return a array which contain the user_cookie_id value 
        if (user_details.length >= 1) {
            res.send({ status: "user_cookie_id_matched", name: user_details[0].email });
        }
    }
    else if (req.params.slug == "user_details") {
        const user_data = await req.body;
        const user_details = await User.find({ user_cookie_id: user_data.user_cookie_id }); // return a array which contain the user_cookie_id value 
        if (user_details.length >= 1) {
            res.send({ status: "user_details_send", user_details: user_details[0] });
        }
    }
    else if (req.params.slug == "get_user_all_request") {
        const user_data = await req.body;
        const user_requests = await Comment.find({ user_cookie_id: user_data.user_cookie_id }); // return a array which contain the user_cookie_id value 
        if (user_requests.length >= 1) {
            res.send({ status: "user_all_request_send", user_requests: user_requests });
        }
    }
    else if (req.params.slug == "update_user_details") {
        const user_data = await req.body;
        const user_before_details = await User.find({ user_cookie_id: user_data.user_cookie_id })
        if (user_before_details.length >= 1) {
            const user_details = new User({
                first_name: user_data.first_name,
                middle_name: user_data.middle_name,
                last_name: user_data.last_name,
                email: user_data.email,
                phone_number: user_data.phone_number,
                password: user_before_details[0].password,
                user_cookie_id: user_before_details[0].user_cookie_id,
                country: user_data.country,
                state: user_data.state,
                district: user_data.district,
                block: user_data.block,
                gram_panchayat: user_data.gram_panchayat,
                village: user_data.village,
                postal_zip_code: user_data.postal_zip_code
            })
            await User.deleteMany({ user_cookie_id: user_data.user_cookie_id });
            await user_details.save();
            res.send({ status: "user_details_updated" });
        }
    }
});

app.listen(port, () => {
    console.log(`App listening port is ${port}`);
})