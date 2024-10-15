import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();
const port = 4000;
const app = express();

app.use(cors());
app.use(express.static("public"));

const endpointSecret = process.env.WEBHOOK_SECRET_KEY;

// WebHook Start

// app.post("/callback", express.raw({ type: "application/json" }), (req, res) => {
//   const sig = req.headers["stripe-signature"];

//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
//   } catch (err) {
//     response.status(400).send(`Webhook Error: ${err.message}`);
//     return;
//   }

//   // Handle the event
//   switch (event.type) {
//     case "checkout.session.async_payment_failed":
//       const checkoutSessionAsyncPaymentFailed = event.data.object;
//       // Then define and call a function to handle the event checkout.session.async_payment_failed
//       break;
//     case "checkout.session.async_payment_succeeded":
//       const checkoutSessionAsyncPaymentSucceeded = event.data.object;
//       // Then define and call a function to handle the event checkout.session.async_payment_succeeded
//       break;
//     case "checkout.session.completed":
//       const checkoutSessionCompleted = event.data.object;
//       // Then define and call a function to handle the event checkout.session.completed
//       break;
//     // ... handle other event types
//     default:
//       console.log(`Unhandled event type ${event.type}`);

//       console.log(checkoutSessionAsyncPaymentFailed);
//       console.log(checkoutSessionAsyncPaymentSucceeded);
//       console.log(checkoutSessionCompleted);
//   }

//   // Return a 200 response to acknowledge receipt of the event
//   res.send().end();
// });

// Subscriber Schema

const Subscriber = mongoose.model("Subscriber", {
  InvoiceID: String,
  CustomerEmail: String,
  subscriptionID: String,
  TotalPaidAmount: Number,
  PaymentStatus: String,
  StartTime: Date,
  EndTime: Date,
  InvoicePDF: String,
});

// subscriptionID: id,
// const InvoiceID = event.data.object.id;
// const CustomerEmail = event.data.object.customer_email;
// const TotalPaidAmount = event.data.object.amount_paid;
// const SubscriptionID = event.data.object.subscription;
// const PaymentStatus = event.data.object.status;
// StartTime: new Date(current_period_start * 1000),
// EndTime: new Date(current_period_end * 1000),

app.post(
  "/callback",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    // console.log("reqqq", req.body);
    // console.log(req.body.data.object.customer, " ==> Customer");
    // console.log(req.body.data.object.subscription, " ==> SubscriptionID");
    // console.log(req.body.data.object.subtotal, " ==> Amount Paid");
    // console.log(req.body.data.object.id, " ==> ID");
    // console.log(req.body.data.object.period_start, " ==> Start Time");
    // console.log(req.body.data.object.period_end, " ==> End Time");
    const sig = req.headers["stripe-signature"];
    // console.log("sign", sig);

    const endpointSecret = process.env.WEBHOOK_SECRET_KEY; // Make sure you have defined this
    // console.log("endpointSecret", endpointSecret);
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      // console.log(event);
    } catch (err) {
      // console.log("ërorr", err);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    // console.log("ËVent---", event);

    // console.log("event.type :>> ", event.type);

    // Handle the event
    switch (event.type) {
      case "checkout.session.async_payment_failed":
        const checkoutSessionAsyncPaymentFailed = event.data.object;
        // console.log(checkoutSessionAsyncPaymentFailed);

        // Handle the event
        break;

      case "checkout.session.async_payment_succeeded":
        const checkoutSessionAsyncPaymentSucceeded = event.data.object;
        console.log(checkoutSessionAsyncPaymentSucceeded);
        // console.log(checkoutSessionAsyncPaymentSucceeded);

        // const CustomerID = req.body.data.object.customer;
        // console.log(CustomerID, "==> CustomerID");
        // Handle the event
        break;
      // case "checkout.session.completed":

      case "customer.subscription.created":
        const subscriptionCreated = event.data.object;
        const { id, current_period_start, current_period_end } =
          subscriptionCreated;

        const newSubscriber = new Subscriber({
          subscriptionID: id,
          StartTime: new Date(current_period_start * 1000),
          EndTime: new Date(current_period_end * 1000),
        });

        try {
          await newSubscriber.save();
          console.log("Subscriber saved:", newSubscriber);
        } catch (error) {
          console.error("Error saving subscriber:", error);
        }

        break;

      // const checkoutSessionCompleted = event.data;
      // const ID = event.data.object.id;
      // const amount_subtotal = event.data.object.amount_subtotal;
      // const Customer_Email = event.data.object.customer_details.email;
      // const subscriptionID = event.data.object.subscription;
      // const paymentStatus = event.data.object.payment_status;
      // const StartTime = new Date(event.data.object.created * 1000);
      // const EndTime = new Date(event.data.object.expires_at * 1000);

      // try {
      //   await Subscriber.save();
      //   console.log("Subscriber saved:", Subscriber);
      // } catch (error) {
      //   console.error("Error saving subscriber:", error);
      // }

      // console.log(id, "ID");
      // console.log(customer_details.email, "Customer_Email");
      // console.log(subscription, "subscriptionID");
      // console.log(payment_status, "paymentStatus");
      // console.log(amount_subtotal / 100, "Total Amount");
      // console.log(new Date(created * 1000), "Subscription StartTime");
      // console.log(new Date(expires_at * 1000), "Subscription EndTime");
      // console.log(checkoutSessionCompleted);
      // const checkoutSessionCompleted = event.data.object;
      // const customerID = checkoutSessionCompleted.customer;
      // console.log(customerID, "==> Customer ID");
      // Handle the event

      case "invoice.payment_succeeded":
        const invoicePaymentSucceeded = event.data.object;
        const InvoiceID = invoicePaymentSucceeded.id;
        const CustomerEmail = invoicePaymentSucceeded.customer_email;
        const TotalPaidAmount = invoicePaymentSucceeded.amount_paid;
        const SubscriptionID = invoicePaymentSucceeded.subscription;
        const PaymentStatus = invoicePaymentSucceeded.status;

        try {
          const updatedSubscriber = await Subscriber.findOneAndUpdate(
            { subscriptionID: SubscriptionID },
            {
              InvoiceID: InvoiceID,
              CustomerEmail: CustomerEmail,
              TotalPaidAmount: TotalPaidAmount / 100, // Convert amount to dollars
              PaymentStatus: PaymentStatus,
            },
            { new: true, upsert: true } // Create if doesn't exist
          );

          if (updatedSubscriber) {
            console.log(
              "Subscriber updated with invoice details:",
              updatedSubscriber
            );
          } else {
            console.log(
              "No subscriber found with subscriptionID:",
              SubscriptionID
            );
          }
        } catch (error) {
          console.error(
            "Error updating subscriber with invoice details:",
            error
          );
        }

        break;

      case "invoice.created":
        // const invoiceCreated = event.data.object;
        // const subscriptionID = invoiceCreated.subscription;

        // console.log(subscriptionID, "SubID in Invoice");
        // const InvoicePDF = invoiceCreated.invoice_pdf;
        // console.log(InvoicePDF);
        // try {
        //   const updatedSubscriber = await Subscriber.findOneAndUpdate(
        //     { subscriptionID: invoiceCreated.subscription },
        //     { InvoicePDF: InvoicePDF },
        //     { new: true }
        //   );

        //   if (updatedSubscriber) {
        //     console.log(
        //       "Invoice PDF saved for subscription:",
        //       invoiceCreated.subscription
        //     );
        //   } else {
        //     console.log(
        //       "No subscriber found with subscriptionID:",
        //       invoiceCreated.subscription
        //     );
        //   }
        // } catch (error) {
        //   console.error("Error updating subscriber with invoice PDF:", error);
        // }
        // Then define and call a function to handle the event invoice.created

        const invoiceCreated = event.data.object;
        const subscriptionID = invoiceCreated.subscription;
        x;
        const InvoicePDF = invoiceCreated.invoice_pdf;

        async () => {
          try {
            const updatedSubscriber = await Subscriber.findOneAndUpdate(
              { subscriptionID: subscriptionID },
              { InvoicePDF: InvoicePDF },
              { new: true, upsert: true } // Create if doesn't exist
            );

            if (updatedSubscriber) {
              console.log(
                "Invoice PDF saved for subscription:",
                subscriptionID
              );
            } else {
              console.log(
                "No subscriber found with subscriptionID:",
                subscriptionID
              );
            }
          } catch (error) {
            console.error("Error updating subscriber with invoice PDF:", error);
          }
        };

        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
      // No need to log undefined variables
      // console.log(checkoutSessionAsyncPaymentSucceeded);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).send().end();
  }
);

app.use(express.json());

// WebHook End

//Database connection with MongoDB
mongoose.connect(
  "mongodb+srv://USER_NAME:Password@cluster0.2vziuad.mongodb.net/Database_Name?retryWrites=true&w=majority&appName=Cluster0"
);

app.use(express.json());

// Payment Gateway Start
const stripe = new Stripe("Stripe_Secret_Key");

// const YOUR_DOMAIN = "http://localhost:4000";

app.post("/create-checkout-session", async (req, res) => {
  const { priceId } = req.body;
  // const plan = req.body;
  // console.log(plan);
  // console.log(priceId);
  // console.log(req.body);
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      line_items: [
        {
          price: priceId,
          email: req.body.customer_email,
          quantity: 1,
          // email: "motivedrive123@gmail.com",
        },
      ],
      mode: "subscription",
      customer_email: req.body.email,
      success_url: `http://localhost:3000/success`,
      cancel_url: `http://localhost:3000/cancel`,
    });

    // console.log(session);
    // res.redirect(303, session.url);

    // const response = await stripe.subscriptions.list({ limit: 100 });

    // console.log(response.data.map((item) => item.customer));

    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: plan,
    //   currency: "usd",
    //   automatic_payment_methods: { enabled: true },
    // });

    // console.log(paymentIntent);
    // const events = await stripe.events.list({
    //   limit: 100,
    // });
    // console.log(events);

    res.json({ id: session });
  } catch (error) {
    // res.status(500).json({ error: error.message });
    console.log(error);
  }
});

// Payment Gateway end

// API Creation

app.get("/", (req, res) => {
  res.send("Express App is Running");
});

// Image Storage Engine

const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage: storage });

// Creating Upload Endpoint for images

app.use("/images", express.static("upload/images"));

app.post("/upload", upload.single("product"), (req, res) => {
  res.json({
    success: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`,
  });
});

// Payment Schema

const Payment = mongoose.model("Payment", {
  email: {
    type: String,
    required: true,
  },
  paymentId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  planDuration: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Payment Details Store End

// Schema for Creating Products

const Product = mongoose.model("Product", {
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

app.post("/addproduct", async (req, res) => {
  let products = await Product.find({});
  let id;
  if (products.length > 0) {
    let last_product_array = products.slice(-1);
    let last_product = last_product_array[0];
    id = last_product.id + 1;
  } else {
    id = 1;
  }
  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });
  console.log(product);
  await product.save();
  console.log("Saved");
  res.json({
    success: true,
    name: req.body.name,
  });
});

// Creating API For deleting Products

app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("Removed");
  res.json({
    success: true,
    name: req.body.name,
  });
});

// Creating API for getting all products
app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  console.log("All Products Fetched");
  res.send(products);
});

// Get All Subscriber Data
app.get("/subscriptiondetails", async (req, res) => {
  let subscriber = await Subscriber.find({});
  console.log("All Subscriber Detail");
  res.send(subscriber);
});

// Shema creating for User model

const Users = mongoose.model("Users", {
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  cartData: {
    type: Object,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// Creating Endpoint for registering the user

app.post("/signup", async (req, res) => {
  let check = await Users.findOne({ email: req.body.email });
  if (check) {
    return res.status(400).json({
      success: false,
      errors: "existing user found with same email address",
    });
  }
  let cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }
  const user = new Users({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  });

  await user.save();

  const data = {
    user: {
      id: user.id,
    },
  };

  const token = jwt.sign(data, "secret_ecom");
  res.json({ success: true, token });
});

// Ceating endpoint for user login

app.post("/login", async (req, res) => {
  let user = await Users.findOne({ email: req.body.email });
  if (user) {
    const passCompare = req.body.password === user.password;
    if (passCompare) {
      const data = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
      const token = jwt.sign(data, "secret_ecom");
      res.json({ success: true, token, user: data.user.email });
    } else {
      res.json({ success: false, errors: "Wrong Password" });
    }
  } else {
    res.json({ success: false, errors: "Wrong Email Id" });
  }
});

// Creating end Point for new Collection Data
app.get("/newcollections", async (req, res) => {
  let products = await Product.find({});
  let newcollection = products.slice(1).slice(-8);
  console.log("New Collection fetched");
  res.send(newcollection);
});

// Creating endpoint for popular in women section
app.get("/popularinwomen", async (req, res) => {
  let products = await Product.find({ category: "women" });
  let popular_in_women = products.slice(0, 4);
  console.log("Popular in women fetched");
  res.send(popular_in_women);
});

// Creating middleware to fetch user

const fetchUser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    res.status(401).send({ errors: "Please authenticate using valid token" });
  } else {
    try {
      const data = jwt.verify(token, "secret_ecom");
      req.user = data.user;
      next();
    } catch (error) {
      res
        .status(401)
        .send({ errors: "please authenticate using a valid token" });
    }
  }
};

// Creating Endpoint for adding products in cartdata
app.post("/addtocart", fetchUser, async (req, res) => {
  console.log("Added", req.body.itemId);
  let userData = await Users.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await Users.findOneAndUpdate(
    { _id: req.user.id },
    { cartData: userData.cartData }
  );
  res.send("Added");
});

// Creating endpoint to remove product from cartdata

app.post("/removefromcart", fetchUser, async (req, res) => {
  console.log("removed", req.body.itemId);
  let userData = await Users.findOne({ _id: req.user.id });
  if (userData.cartData[req.body.itemId] > 0)
    userData.cartData[req.body.itemId] -= 1;
  await Users.findOneAndUpdate(
    { _id: req.user.id },
    { cartData: userData.cartData }
  );
  res.send("Removed");
});

// Creating endpoint to get cartdata

app.post("/getcart", fetchUser, async (req, res) => {
  console.log("GetCart");
  let userData = await Users.findOne({ _id: req.user.id });
  res.json(userData.cartData);
});

app.listen(port, (error) => {
  if (!error) {
    console.log("Server Running on Port : " + port);
  } else {
    console.log("Error : " + error);
  }
});
