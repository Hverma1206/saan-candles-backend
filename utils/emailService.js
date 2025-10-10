import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  }
});

export const sendOtpEmail = async (email, otp) => {
  try {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.error(`Invalid email address: "${email}"`);
      throw new Error('Invalid email address');
    }

    console.log(`Attempting to send email to: ${email}`);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email.trim(),
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Verification Code</h2>
          <p style="font-size: 16px;">Your OTP code is:</p>
          <h1 style="font-size: 32px; background-color: #f5f5f5; padding: 10px; text-align: center; letter-spacing: 5px;">${otp}</h1>
          <p style="font-size: 14px; color: #777;">This code will expire in ${process.env.OTP_EXPIRY_MINUTES} minutes.</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to: ${email}`);
    return true;
  } catch (err) {
    console.error("Nodemailer error:", err);
    throw err;
  }
};
