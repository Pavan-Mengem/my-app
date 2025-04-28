import mongoose from 'mongoose';

const BudgetSchema = new mongoose.Schema({
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  month: { type: String, required: true } // for example "Apr-2025"
}, { timestamps: true });

module.exports = mongoose.model('Budget', BudgetSchema);