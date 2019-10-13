const cors = require("cors");
const express = require("express");
const stripe = require("stripe")("sk_test_wVHa6wxTvO6kp0egAWuSi5t200ivZlJdTV");
const uuid = require("uuid/v4");
const bodyParser = require('body-parser');
const prettyjson = require('prettyjson');

const options = {
  noColor: true
};
const app = express();

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
  res.send("Add your Stripe Secret Key to the .require('stripe') statement!");
});

app.post("/checkout", async (req, res) => {
  console.log("Request:", req.body);



  let error;
  let status;
  try {
    const { product, token } = req.body;

    const customer = await stripe.customers.create({
      email: token.email,
      source: token.id
    });

    const idempotency_key = uuid();
    const charge = await stripe.charges.create(
      {
        amount: product.price * 100,
        currency: "usd",
        customer: customer.id,
        receipt_email: token.email,
        description: `Purchased the ${product.name}`,
        shipping: {
          name: token.card.name,
          address: {
            line1: token.card.address_line1,
            line2: token.card.address_line2,
            city: token.card.address_city,
            country: token.card.address_country,
            postal_code: token.card.address_zip
          }
        }
      },
      {
        idempotency_key
      }
    );
    console.log("Charge:", { charge });
    status = "success";
  } catch (error) {
    console.error("Error:", error);
    status = "failure";
  }

  res.json({ error, status });
});

app.post('/hooks/mpesa', (req, res) => {
  console.log('-----------Received M-Pesa webhook-----------');
	
  // format and dump the request payload recieved from safaricom in the terminal
  console.log(prettyjson.render(req.body, options));
  console.log('-----------------------');
	
  let message = {
	  "ResponseCode": "00000000",
	  "ResponseDesc": "success"
	};
	
  // respond to safaricom servers with a success message
  res.json(message);
});

const server = app.listen(8080, () =>{
  let host = server.address().address;
  let port = server.address().port;
  console.log(`server listening on port ${port}`);
});
