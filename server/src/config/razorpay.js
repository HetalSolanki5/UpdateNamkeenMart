import Razorpay from 'razorpay';
import { env } from './env.js';

/**
 * Configured Razorpay SDK instance (test mode).
 *
 * key_id   → public key, used by the frontend to open the Razorpay checkout widget.
 * key_secret → private key, used ONLY here on the server for signature verification and
 *              creating Razorpay orders. It must never leave the backend.
 *
 * By importing this instance wherever we need Razorpay (e.g. in order.service.js),
 * we avoid recreating the client multiple times and keep credentials in one place.
 */
const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export default razorpay;
