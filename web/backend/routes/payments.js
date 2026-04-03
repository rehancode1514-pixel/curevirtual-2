const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prismaClient");
const Stripe = require("stripe");

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const { verifyToken } = require("../middleware/rbac");

/**
 * POST /api/payments/create-appointment-intent
 * Input: { appointmentId, amount, currency }
 * Description: Creates a PaymentIntent for a specific appointment.
 */
router.post("/create-appointment-intent", verifyToken, async (req, res) => {
  try {
    const { appointmentId, amount, currency = "usd" } = req.body;

    if (!appointmentId || !amount) {
      return res.status(400).json({ error: "appointmentId and amount are required" });
    }

    // 1. Fetch appointment to ensure it exists and belongs to the user (if patient)
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { 
        patient: { include: { user: true } },
        doctor: { include: { user: true } }
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // 2. Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency,
      metadata: {
        appointmentId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        type: "APPOINTMENT_PAYMENT"
      },
      description: `Appointment with Dr. ${appointment.doctor.user.lastName}`,
      receipt_email: appointment.patient.user.email
    });

    // 3. Record the transaction in our database as PENDING
    await prisma.transaction.create({
      data: {
        userId: req.user.id,
        appointmentId,
        type: "APPOINTMENT_PAYMENT",
        amount,
        currency,
        status: "PENDING",
        provider: "STRIPE",
        providerTxId: paymentIntent.id,
        description: `Payment intent created for appointment ${appointmentId}`
      }
    });

    // 4. Update appointment status to reflect payment is in progress
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "PENDING_PAYMENT", paymentId: paymentIntent.id }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (err) {
    console.error("❌ create-appointment-intent error:", err);
    res.status(500).json({ error: err.message || "Failed to create payment intent" });
  }
});

/**
 * POST /api/payments/create-subscription
 * Input: { planType, userId }
 * Description: Sets up a recurring subscription.
 */
router.post("/create-subscription", verifyToken, async (req, res) => {
  try {
    const { planType } = req.body; // "MONTHLY" or "YEARLY"
    const userId = req.user.id;

    if (!["MONTHLY", "YEARLY"].includes(planType)) {
      return res.status(400).json({ error: "Invalid planType. Use MONTHLY or YEARLY." });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // 1. Ensure Stripe Customer exists for this user
    let customerId = user.stripeCustomerId;
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            metadata: { userId }
        });
        customerId = customer.id;
        await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customerId }
        });
    }

    // 2. Resolve Price based on user role and plan
    // In a real app, these would be pre-created in Stripe. 
    // Here we'll check SubscriptionSetting or use defaults.
    const settings = await prisma.subscriptionSetting.findFirst();
    let amount = 0;
    if (user.role === "DOCTOR") {
        amount = planType === "MONTHLY" ? (settings?.doctorMonthlyUsd || 50) : (settings?.doctorYearlyUsd || 500);
    } else {
        amount = planType === "MONTHLY" ? (settings?.patientMonthlyUsd || 20) : (settings?.patientYearlyUsd || 200);
    }

    // 3. Check for existing Price in Stripe or create dynamic one (simplified for demo)
    const price = await stripe.prices.create({
      unit_amount: Math.round(amount * 100),
      currency: "usd",
      recurring: { interval: planType === "MONTHLY" ? "month" : "year" },
      product_data: { name: `${user.role} ${planType} Plan` },
    });

    // 4. Create the Subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata: { userId, planType }
    });

    // 5. Record the subscription in our database
    await prisma.subscription.create({
      data: {
        userId,
        plan: planType,
        status: "PENDING",
        provider: "STRIPE",
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });

    res.json({
      success: true,
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (err) {
    console.error("❌ create-subscription error:", err);
    res.status(500).json({ error: err.message || "Failed to create subscription" });
  }
});

/**
 * GET /api/payments/transactions
 * Description: Retrieves transaction history for the admin dashboard.
 */
router.get("/transactions", verifyToken, async (req, res) => {
  try {
    // Add superadmin/admin check here if needed via RBAC, currently verifyToken guarantees logged in
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, role: true } },
        appointment: { select: { id: true, appointmentDate: true, doctor: { include: { user: { select: { firstName: true, lastName: true } } } } } }
      }
    });
    
    res.json({ success: true, data: transactions });
  } catch (err) {
    console.error("❌ GET /transactions error:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

/**
 * POST /api/payments/webhook
 * Description: Unified webhook handler for Stripe events.
 * This is mounted in server.js with express.raw() to handle signature verification.
 */
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // req.body must be the raw buffer here
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook Signature Verification Failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const dataObject = event.data.object;

    switch (event.type) {
      // One-time Payment (Appointment)
      case "payment_intent.succeeded": {
        const { appointmentId, type } = dataObject.metadata;
        if (type === "APPOINTMENT_PAYMENT" && appointmentId) {
          await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: "APPROVED", paymentStatus: "PAID" }
          });
          await prisma.transaction.update({
            where: { providerTxId: dataObject.id },
            data: { status: "SUCCESS" }
          });
          console.log(`✅ Appointment ${appointmentId} confirmed via Stripe.`);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const { appointmentId } = dataObject.metadata;
        if (appointmentId) {
          await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: "PAYMENT_FAILED", paymentStatus: "FAILED" }
          });
          console.log(`❌ Payment failed for appointment ${appointmentId}.`);
        }
        break;
      }

      // Subscriptions
      case "invoice.payment_succeeded": {
        const subscriptionId = dataObject.subscription;
        if (subscriptionId) {
          const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
          const updatedSub = await prisma.subscription.update({
            where: { stripeSubscriptionId: subscriptionId },
            data: { 
              status: "ACTIVE", 
              startDate: new Date(stripeSub.current_period_start * 1000),
              endDate: new Date(stripeSub.current_period_end * 1000)
            }
          });

          // Snapshot status on User
          await prisma.user.update({
            where: { id: updatedSub.userId },
            data: { subscriptionState: "ACTIVE" }
          });
          console.log(`🚀 Subscription ${subscriptionId} activated/renewed.`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const subscriptionId = dataObject.subscription;
        if (subscriptionId) {
          const sub = await prisma.subscription.update({
            where: { stripeSubscriptionId: subscriptionId },
            data: { status: "FAILED" }
          });
          await prisma.user.update({
            where: { id: sub.userId },
            data: { subscriptionState: "FAILED" }
          });
          console.log(`⚠️ Subscription payment failed for ${subscriptionId}.`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscriptionId = dataObject.id;
        const sub = await prisma.subscription.update({
          where: { stripeSubscriptionId: subscriptionId },
          data: { status: "DEACTIVATED" }
        });
        await prisma.user.update({
          where: { id: sub.userId },
          data: { subscriptionState: "DEACTIVATED" }
        });
        console.log(`🛑 Subscription ${subscriptionId} canceled.`);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook Handling Error:", err);
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

module.exports = router;
