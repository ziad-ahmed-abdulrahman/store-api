import nodemailer from 'nodemailer';

const createTransporter = () =>
    nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

const sendEmail = async (email, subject, message) => {
    const transporter = createTransporter();

    await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        text: message
    });
};

export default sendEmail;