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

/**
 * Send order notification email to the admin when a new order is placed.
 */
export const sendOrderNotificationEmail = async (order) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (!adminEmail) {
      console.warn("No ADMIN_EMAIL configured, skipping order notification");
      return false;
    }

    const itemsHtml = order.items
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.title}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">₹${item.price}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">₹${item.price * item.quantity}</td>
          </tr>`
      )
      .join("");

    const addr = order.shippingAddress;
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: adminEmail,
      subject: `🕯️ New Order #${order._id} — ₹${order.totalAmount}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;border:1px solid #e0d6cc;border-radius:8px;background:#fffdf9;">
          <h2 style="color:#b8860b;margin-bottom:4px;">New Order Received!</h2>
          <p style="color:#555;margin-bottom:20px;">Order <strong>#${order._id}</strong> placed on ${new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>

          <h3 style="color:#333;border-bottom:2px solid #b8860b;padding-bottom:6px;">Customer Details</h3>
          <table style="width:100%;margin-bottom:20px;">
            <tr><td style="padding:4px 0;color:#777;width:120px;">Name</td><td>${addr.firstName} ${addr.lastName}</td></tr>
            <tr><td style="padding:4px 0;color:#777;">Email</td><td>${order.email}</td></tr>
            <tr><td style="padding:4px 0;color:#777;">Phone</td><td>${addr.phone}</td></tr>
          </table>

          <h3 style="color:#333;border-bottom:2px solid #b8860b;padding-bottom:6px;">Shipping Address</h3>
          <p style="margin:8px 0 20px;line-height:1.6;">${addr.address}<br/>${addr.city}, ${addr.state} — ${addr.zipCode}</p>

          <h3 style="color:#333;border-bottom:2px solid #b8860b;padding-bottom:6px;">Order Items</h3>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <thead>
              <tr style="background:#f5f0eb;">
                <th style="padding:8px 12px;text-align:left;">Item</th>
                <th style="padding:8px 12px;text-align:center;">Qty</th>
                <th style="padding:8px 12px;text-align:right;">Price</th>
                <th style="padding:8px 12px;text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <div style="text-align:right;font-size:1.2rem;font-weight:700;color:#b8860b;padding:12px;background:#f5f0eb;border-radius:6px;">
            Total: ₹${order.totalAmount}
          </div>

          <table style="width:100%;margin-top:20px;">
            <tr><td style="padding:4px 0;color:#777;width:140px;">Payment Method</td><td style="font-weight:600;">${order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod}</td></tr>
            <tr><td style="padding:4px 0;color:#777;">Status</td><td><span style="background:#fff3cd;color:#856404;padding:3px 10px;border-radius:12px;font-size:0.85rem;">${order.status}</span></td></tr>
          </table>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Order notification email sent to admin: ${adminEmail}`);
    return true;
  } catch (err) {
    console.error("Failed to send order notification email:", err);
    // Don't throw — order was already saved, email failure shouldn't break the flow
    return false;
  }
};

/**
 * Send order confirmation email to the customer after placing an order.
 */
export const sendOrderConfirmationEmail = async (order) => {
  try {
    const customerEmail = order.email;
    if (!customerEmail) {
      console.warn("No customer email on order, skipping confirmation email");
      return false;
    }

    const itemsHtml = order.items
      .map(
        (item) =>
          `<tr>
            <td style="padding:10px 14px;border-bottom:1px solid #f0ebe4;font-size:14px;">${item.title}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #f0ebe4;text-align:center;font-size:14px;">${item.quantity}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #f0ebe4;text-align:right;font-size:14px;">₹${item.price}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #f0ebe4;text-align:right;font-size:14px;font-weight:600;">₹${item.price * item.quantity}</td>
          </tr>`
      )
      .join("");

    const addr = order.shippingAddress;
    const orderDate = new Date(order.createdAt).toLocaleString("en-IN", {
      dateStyle: "long",
      timeStyle: "short",
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: customerEmail,
      subject: `Order Confirmed! 🕯️ Your Saan Candles Order #${order._id.toString().slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;background:#fffdf9;">
          <!-- Header Banner -->
          <div style="background:linear-gradient(135deg,#b8860b,#d4a843);padding:32px 24px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">🕯️ Saan Candles</h1>
            <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:15px;">Thank you for your order!</p>
          </div>

          <div style="padding:28px 24px;border:1px solid #e0d6cc;border-top:none;border-radius:0 0 8px 8px;">
            <!-- Greeting -->
            <p style="font-size:16px;color:#333;margin:0 0 6px;">Hi <strong>${addr.firstName}</strong>,</p>
            <p style="font-size:14px;color:#555;margin:0 0 24px;line-height:1.6;">We've received your order and it's being processed. Here's a summary of what you ordered:</p>

            <!-- Order Info Bar -->
            <div style="background:#f5f0eb;border-radius:8px;padding:14px 18px;display:flex;margin-bottom:24px;">
              <table style="width:100%;">
                <tr>
                  <td style="padding:2px 0;font-size:13px;color:#777;">Order ID</td>
                  <td style="padding:2px 0;font-size:13px;font-weight:700;color:#b8860b;text-align:right;font-family:monospace;">#${order._id.toString().slice(-8).toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding:2px 0;font-size:13px;color:#777;">Date</td>
                  <td style="padding:2px 0;font-size:13px;text-align:right;">${orderDate}</td>
                </tr>
                <tr>
                  <td style="padding:2px 0;font-size:13px;color:#777;">Payment</td>
                  <td style="padding:2px 0;font-size:13px;text-align:right;">${order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod}</td>
                </tr>
              </table>
            </div>

            <!-- Items Table -->
            <h3 style="color:#b8860b;font-size:15px;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #f0ebe4;">Order Items</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
              <thead>
                <tr>
                  <th style="padding:10px 14px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#999;border-bottom:2px solid #f0ebe4;">Item</th>
                  <th style="padding:10px 14px;text-align:center;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#999;border-bottom:2px solid #f0ebe4;">Qty</th>
                  <th style="padding:10px 14px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#999;border-bottom:2px solid #f0ebe4;">Price</th>
                  <th style="padding:10px 14px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#999;border-bottom:2px solid #f0ebe4;">Total</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>

            <!-- Total -->
            <div style="text-align:right;padding:16px 18px;background:#f5f0eb;border-radius:8px;margin-bottom:24px;">
              <span style="font-size:18px;font-weight:800;color:#b8860b;">Total: ₹${order.totalAmount.toLocaleString("en-IN")}</span>
            </div>

            <!-- Shipping Address -->
            <h3 style="color:#b8860b;font-size:15px;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #f0ebe4;">📍 Delivering To</h3>
            <div style="background:#f9f7f4;border-radius:8px;padding:14px 18px;margin-bottom:24px;font-size:14px;line-height:1.7;color:#444;">
              <strong>${addr.firstName} ${addr.lastName}</strong><br/>
              ${addr.address}<br/>
              ${addr.city}, ${addr.state} — ${addr.zipCode}<br/>
              📞 ${addr.phone}
            </div>

            <!-- Status -->
            <div style="text-align:center;padding:16px;background:#fff3cd;border-radius:8px;margin-bottom:24px;">
              <p style="margin:0;font-size:14px;color:#856404;">📦 Order Status: <strong>${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</strong></p>
            </div>

            <!-- Footer -->
            <div style="text-align:center;padding-top:20px;border-top:1px solid #f0ebe4;">
              <p style="font-size:13px;color:#999;margin:0 0 4px;">If you have any questions, reply to this email or reach out to us.</p>
              <p style="font-size:13px;color:#999;margin:0;">With warmth, <strong style="color:#b8860b;">Saan Candles</strong> 🕯️</p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to customer: ${customerEmail}`);
    return true;
  } catch (err) {
    console.error("Failed to send order confirmation email:", err);
    return false;
  }
};
