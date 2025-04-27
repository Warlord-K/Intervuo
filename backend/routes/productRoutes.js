import express from 'express';
import { getKey, paymentVerification, processPayment } from '../controllers/productControllers.js';
const router = express.Router();
router.route("/payment/process").post(processPayment)
router.route("/getKey").get(getKey)
router.route("/paymentVerification").post(paymentVerification)
export default router;