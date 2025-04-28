import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true } // new field
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);