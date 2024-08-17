const express = require('express');
const cors = require("cors");
const app = express();
const fs = require("fs");
const nodemailer = require("nodemailer");
const port = 3000;

// for handling cors
const cors_options = {
    // origin: "http://127.0.0.1:3000",
    origin: "*",
    methods: "GET, POST, PUT, DELETE, PATCH, HEAD",
    methods: "POST",
    credentials: true,
}
app.use(cors(cors_options));

app.use(express.json()); // for use Json file

const get_random_number = () => {
    return Math.floor(Math.random() * 10);
}

const create_otp = () => {
    return `${get_random_number()}${get_random_number()}${get_random_number()}${get_random_number()}${get_random_number()}${get_random_number()}`;
}

app.get('/', (req, res) => {
    res.send('Hello Welcome to my Server !!!')
})

app.post('/api/post/:slug', async (req, res) => {
    if (req.params.slug == "email") {
        const data = await req.body;
        const email_id = await data.email;
        const otp = create_otp();

        const auth = nodemailer.createTransport({
            service: "gmail",
            secure: true,
            port: 465,
            auth: {
                user: "tarinitenthouse.in@gmail.com",
                pass: "fakh dgdu pbtf giac"

            }
        });

        const receiver = {
            from: "tarinitenthouse.in@gmail.com",
            to: email_id,
            subject: "Verify email address for Tarini Tent House",
            text: `Hello,
             Thank you for signing up! To able to create your first account on Tarini Tent House,
              Please verify your email address By providing this OTP (${otp}) in our website https://tth.000.pe.
            If you did not sign up, no further action is required, your email address will be deleted automatically after a few days.`
        };

        auth.sendMail(receiver, (error, emailResponse) => {
            if (error)
                throw error;
            else {
                console.log("Email send successfully.");
                fs.writeFileSync(`Users/${email_id}.txt`, `${otp}`);
            }
            response.end();
        });
    }
    else if (req.params.slug == "otp") {
        const user_data = await req.body;
        let server_otp;
        fs.readFile(`Users/${user_data.email}.txt`, (error, data) => { // read OTP from Users file
            if (error) throw error;
            else server_otp = data.toString();
            console.log(server_otp);
            if (user_data.otp == server_otp) {
                console.log("good boy");
                fs.writeFileSync(`Users/${user_data.email}.txt`, `${user_data.password}`);
            };
        });
    };
});

app.listen(port, () => {
    console.log(`App listening port is ${port}`);
})