import mongoose from 'mongoose';
import { Stock, Variant } from '../../models/index.js';
import { logAudit } from '../../utils/auditLogger.js';
import { computeStockStatus } from '../product.controller.js';

/**
 * @desc    List all Stock docs with variant and product info populated,
 *          computed status (in_stock/low_stock/out_of_stock), optional lowStockOnly filter
 * @route   GET /api/admin/stock
 * @access  Private (Admin only)
 */
export const getStockList = async (req, res, next) => {
  try {
    const { lowStockOnly } = req.query;

    const stocks = await Stock.find()
      .populate({
        path: 'variantId',
        select: 'weight unit displayName sellingPrice wholesalePrice sku isActive productId',
        populate: {
          path: 'productId',
          select: 'productName categoryId isActive'
        }
      })
      .lean();

    const formattedList = stocks.map((s) => {
      const status = computeStockStatus(s);
      return {
        ...s,
        stockStatus: status
      };
    });

    // Filter if lowStockOnly is requested (low_stock or out_of_stock)
    const result = lowStockOnly === 'true'
      ? formattedList.filter((item) => item.stockStatus === 'low_stock' || item.stockStatus === 'out_of_stock')
      : formattedList;

    return res.status(200).json({
      stockCount: result.length,
      stock: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update availableQuantity and/or lowStockThreshold for a variant
 * @route   PUT /api/admin/stock/:variantId
 * @access  Private (Admin only)
 */
export const updateStock = async (req, res, next) => {
  try {
    const { variantId } = req.params;
    const { availableQuantity, lowStockThreshold } = req.body;

    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({ message: 'Invalid variant ID' });
    }

    let stock = await Stock.findOne({ variantId });
    if (!stock) {
      // Check if variant exists
      const variant = await Variant.findById(variantId);
      if (!variant) {
        return res.status(404).json({ message: 'Variant not found' });
      }
      // Create stock if missing
      stock = await Stock.create({
        variantId,
        availableQuantity: 0,
        reservedQuantity: 0,
        lowStockThreshold: 10
      });
    }

    const oldQuantity = stock.availableQuantity;

    if (availableQuantity !== undefined) {
      const qtyNum = Number(availableQuantity);
      if (isNaN(qtyNum) || qtyNum < 0) {
        return res.status(400).json({ message: 'availableQuantity must be a non-negative number' });
      }
      stock.availableQuantity = qtyNum;
    }

    if (lowStockThreshold !== undefined) {
      const thresholdNum = Number(lowStockThreshold);
      if (isNaN(thresholdNum) || thresholdNum < 0) {
        return res.status(400).json({ message: 'lowStockThreshold must be a non-negative number' });
      }
      stock.lowStockThreshold = thresholdNum;
    }

    stock.updatedAt = new Date();
    await stock.save();

    await logAudit({
      userId: req.user._id,
      action: 'Updated stock',
      module: 'Stock',
      description: `Updated stock for variant ${variantId}: availableQuantity changed from ${oldQuantity} to ${stock.availableQuantity}`
    });

    return res.status(200).json({
      message: 'Stock updated successfully',
      stock,
      stockStatus: computeStockStatus(stock)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reserve stock (increases reservedQuantity by quantity, cannot exceed availableQuantity)
 * @route   PUT /api/admin/stock/:variantId/reserve
 * @access  Private (Admin only)
 */
export const reserveStock = async (req, res, next) => {
  try {
    const { variantId } = req.params;
    const { quantity } = req.body;

    const qtyToReserve = Number(quantity);
    if (!qtyToReserve || qtyToReserve <= 0) {
      return res.status(400).json({ message: 'Quantity to reserve must be greater than 0' });
    }

    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({ message: 'Invalid variant ID' });
    }

    const stock = await Stock.findOne({ variantId });
    if (!stock) {
      return res.status(404).json({ message: 'Stock record not found for variant' });
    }

    if (stock.reservedQuantity + qtyToReserve > stock.availableQuantity) {
      return res.status(400).json({
        message: `Cannot reserve ${qtyToReserve}. Available: ${stock.availableQuantity}, currently reserved: ${stock.reservedQuantity}`
      });
    }

    stock.reservedQuantity += qtyToReserve;
    stock.updatedAt = new Date();
    await stock.save();

    await logAudit({
      userId: req.user._id,
      action: 'Reserved stock',
      module: 'Stock',
      description: `Reserved ${qtyToReserve} units for variant ${variantId} (total reserved: ${stock.reservedQuantity})`
    });

    return res.status(200).json({
      message: 'Stock reserved successfully',
      stock,
      stockStatus: computeStockStatus(stock)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Release reserved stock (decreases reservedQuantity, cannot drop below 0)
 * @route   PUT /api/admin/stock/:variantId/release
 * @access  Private (Admin only)
 */
export const releaseStock = async (req, res, next) => {
  try {
    const { variantId } = req.params;
    const { quantity } = req.body;

    const qtyToRelease = Number(quantity);
    if (!qtyToRelease || qtyToRelease <= 0) {
      return res.status(400).json({ message: 'Quantity to release must be greater than 0' });
    }

    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({ message: 'Invalid variant ID' });
    }

    const stock = await Stock.findOne({ variantId });
    if (!stock) {
      return res.status(404).json({ message: 'Stock record not found for variant' });
    }

    stock.reservedQuantity = Math.max(0, stock.reservedQuantity - qtyToRelease);
    stock.updatedAt = new Date();
    await stock.save();

    await logAudit({
      userId: req.user._id,
      action: 'Released stock',
      module: 'Stock',
      description: `Released ${qtyToRelease} reserved units for variant ${variantId} (remaining reserved: ${stock.reservedQuantity})`
    });

    return res.status(200).json({
      message: 'Stock released successfully',
      stock,
      stockStatus: computeStockStatus(stock)
    });
  } catch (error) {
    next(error);
  }
};
