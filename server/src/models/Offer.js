import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    offerName: {
      type: String,
      required: [true, 'Offer name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      required: [true, 'Discount type is required']
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      validate: {
        validator: function (val) {
          if (typeof val !== 'number' || isNaN(val)) return false;
          if (this.discountType === 'percentage') {
            return val >= 1 && val <= 90;
          }
          if (this.discountType === 'flat') {
            return val > 0;
          }
          return false;
        },
        message: 'Invalid discount value for chosen discount type'
      }
    },
    /**
     * PHASE 10E & 10G - Offer Category:
     * - "product_discount": Phase 10A per-product offer (uses applicableTo, categoryId, productIds).
     * - "cart_threshold": Phase 10E cart-total bulk order discount (unlocked when subtotal >= minCartValue).
     * - "loyalty_customer": Phase 10G loyalty/regular customer discount based on order history.
     */
    offerCategory: {
      type: String,
      enum: ['product_discount', 'cart_threshold', 'loyalty_customer'],
      required: true,
      default: 'product_discount'
    },
    /**
     * Minimum cart subtotal required to qualify for cart-threshold discount.
     * Required ONLY when offerCategory is "cart_threshold".
     * NOT used for "product_discount" or "loyalty_customer".
     */
    minCartValue: {
      type: Number,
      required: function () {
        return this.offerCategory === 'cart_threshold';
      },
      validate: {
        validator: function (val) {
          if (this.offerCategory !== 'cart_threshold') return true;
          return typeof val === 'number' && !isNaN(val) && val > 0;
        },
        message: 'minCartValue must be a positive number for cart_threshold offers.'
      }
    },
    /**
     * PHASE 10G - Loyalty criteria type:
     * - "min_delivered_orders": Customer has completed N delivered orders.
     * - "min_total_spend": Customer has lifetime total spend of Rs N.
     * Required ONLY when offerCategory is "loyalty_customer".
     */
    loyaltyCriteriaType: {
      type: String,
      enum: ['min_delivered_orders', 'min_total_spend'],
      required: function () {
        return this.offerCategory === 'loyalty_customer';
      }
    },
    /**
     * PHASE 10G - Target threshold value for loyaltyCriteriaType:
     * e.g., 3 (for 3 delivered orders) or 2000 (for Rs 2000 lifetime spend).
     * Required ONLY when offerCategory is "loyalty_customer".
     */
    loyaltyCriteriaValue: {
      type: Number,
      required: function () {
        return this.offerCategory === 'loyalty_customer';
      },
      validate: {
        validator: function (val) {
          if (this.offerCategory !== 'loyalty_customer') return true;
          return typeof val === 'number' && !isNaN(val) && val > 0;
        },
        message: 'loyaltyCriteriaValue must be a positive number for loyalty_customer offers.'
      }
    },
    /**
     * applicableTo, categoryId, and productIds apply ONLY to "product_discount" offers.
     * When offerCategory is "cart_threshold" or "loyalty_customer", they are NOT required or used.
     */
    applicableTo: {
      type: String,
      enum: ['all_products', 'category', 'specific_products'],
      required: function () {
        return this.offerCategory === 'product_discount';
      }
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: function () {
        return this.offerCategory === 'product_discount' && this.applicableTo === 'category';
      }
    },
    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (val) {
          if (!this.startDate || !val) return false;
          return new Date(val).getTime() > new Date(this.startDate).getTime();
        },
        message: 'End date must be after start date'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Index on startDate and endDate for fast date-range filtering of active offers
offerSchema.index({ startDate: 1, endDate: 1, isActive: 1 });

export default mongoose.model('Offer', offerSchema);
