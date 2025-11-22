const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Load environment variables if we are working locally (optional, but good practice)
// require('dotenv').config(); 

const app = express();
const port = process.env.PORT || 3000; // Let Vercel decide the port

// Enable CORS so your Vercel Frontend can talk to this Vercel Backend
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
}));

app.use(express.json());

// --- DATABASE CONNECTION ---
// Vercel will inject MONGO_URI automatically from the dashboard settings.
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fiambond_v3'; 

if (!process.env.MONGO_URI) {
    console.log("⚠️  Running on Local Database. If deploying, check Vercel Environment Variables.");
}

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ==========================================
//               SCHEMAS
// ==========================================

const UserSchema = new mongoose.Schema({
  _id: String, 
  full_name: String,
  email: String,
  family_id: String
}, { _id: false });
const User = mongoose.model('User', UserSchema);

const TransactionSchema = new mongoose.Schema({
  user_id: String,
  family_id: { type: String, default: null },
  description: String,
  amount: Number,
  type: String,
  created_at: { type: Date, default: Date.now },
  attachment_url: String
});
const Transaction = mongoose.model('Transaction', TransactionSchema);

const GoalSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  family_id: { type: String, default: null },
  name: { type: String, required: true },
  target_amount: { type: Number, required: true },
  target_date: { type: Date, required: true },
  status: { type: String, default: 'active', enum: ['active', 'completed'] },
  created_at: { type: Date, default: Date.now },
  completed_at: { type: Date, default: null },
  completed_by_user_id: { type: String, default: null },
  achievement_url: { type: String, default: null }
});
const Goal = mongoose.model('Goal', GoalSchema);

const LoanSchema = new mongoose.Schema({
  family_id: { type: String, default: null },
  creditor_id: { type: String, required: true },
  debtor_id: { type: String, default: null },
  debtor_name: { type: String, default: null },
  amount: { type: Number, required: true },
  interest_amount: { type: Number, default: 0 },
  total_owed: { type: Number, required: true },
  repaid_amount: { type: Number, default: 0 },
  description: String,
  deadline: Date,
  status: { 
    type: String, 
    enum: ['pending_confirmation', 'outstanding', 'repaid', 'paid', 'rejected'], 
    default: 'pending_confirmation' 
  },
  created_at: { type: Date, default: Date.now },
  confirmed_at: { type: Date, default: null },
  attachment_url: String,
  pending_repayment: {
    amount: Number,
    submitted_by: String,
    submitted_at: Date,
    receipt_url: String
  },
  repayment_receipts: [{
    url: String,
    amount: Number,
    recorded_at: Date
  }]
});
const Loan = mongoose.model('Loan', LoanSchema);

const FamilySchema = new mongoose.Schema({
  family_name: { type: String, required: true },
  owner_id: { type: String, required: true },
  member_ids: [String],
  created_at: { type: Date, default: Date.now }
});
const Family = mongoose.model('Family', FamilySchema);


// ==========================================
//                ROUTES
// ==========================================

app.get('/', (req, res) => res.send('FiamBond V3 API is Online 🚀'));

// --- TRANSACTION ROUTES ---
app.get('/api/transactions', async (req, res) => {
  try {
    const { user_id, family_id, startDate } = req.query;
    
    let query = {};

    // Robust check: Handle "undefined" string literal which fetch sometimes sends
    if (family_id && family_id !== 'undefined' && family_id !== 'null') {
        query.family_id = family_id;
    } else if (user_id && user_id !== 'undefined' && user_id !== 'null') {
        query.user_id = user_id;
    } else {
        return res.status(400).json({ error: "User ID or Family ID required" });
    }

    if (startDate && startDate !== 'undefined') {
        const dateObj = new Date(startDate);
        if (!isNaN(dateObj.getTime())) {
            query.created_at = { $gte: dateObj };
        }
    }

    const transactions = await Transaction.find(query).sort({ created_at: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const newTransaction = new Transaction(req.body);
    const savedTx = await newTransaction.save();
    res.json(savedTx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- LOAN ROUTES ---
app.get('/api/loans', async (req, res) => {
  try {
    const { user_id, family_id } = req.query;
    let query = {};

    if (family_id && family_id !== 'undefined' && family_id !== 'null') {
        query.family_id = family_id;
    } else if (user_id && user_id !== 'undefined' && user_id !== 'null') {
        query.$or = [{ creditor_id: user_id }, { debtor_id: user_id }];
    } else {
        return res.status(400).json({ error: "User ID or Family ID required" });
    }

    const loans = await Loan.find(query).sort({ created_at: -1 });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/loans', async (req, res) => {
  try {
    const newLoan = new Loan(req.body);
    const savedLoan = await newLoan.save();
    res.status(201).json(savedLoan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/loans/:id', async (req, res) => {
  try {
    const updatedLoan = await Loan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedLoan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GOAL ROUTES ---
app.get('/api/goals', async (req, res) => {
  try {
    const { user_id, family_id } = req.query;
    let query = {};
    
    if (family_id && family_id !== 'undefined' && family_id !== 'null') {
      query = { family_id: family_id };
    } else if (user_id && user_id !== 'undefined') {
      query = { user_id: user_id, family_id: null };
    } else {
      return res.status(400).json({ error: "user_id or family_id required" });
    }

    const goals = await Goal.find(query).sort({ created_at: -1 });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/goals', async (req, res) => {
  try {
    const newGoal = new Goal(req.body);
    const savedGoal = await newGoal.save();
    res.status(201).json(savedGoal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/goals/:id', async (req, res) => {
  try {
    const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedGoal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/goals/:id', async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ message: "Goal deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- FAMILY ROUTES ---
app.get('/api/families', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: "User ID required" });
    const families = await Family.find({ member_ids: user_id });
    res.json(families);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/families/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ error: "Invalid Family ID format" });
    }
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ error: "Family not found" });
    res.json(family);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/families', async (req, res) => {
  try {
    const { family_name, owner_id, member_ids } = req.body;
    let finalMembers = member_ids || [];
    if (owner_id && !finalMembers.includes(owner_id)) {
        finalMembers.push(owner_id);
    }
    const newFamily = new Family({
        family_name,
        owner_id,
        member_ids: finalMembers
    });
    const savedFamily = await newFamily.save();
    res.status(201).json(savedFamily);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/families/:id', async (req, res) => {
  try {
    const { family_name } = req.body;
    const updatedFamily = await Family.findByIdAndUpdate(req.params.id, { family_name }, { new: true });
    res.json(updatedFamily);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/families/:id', async (req, res) => {
  try {
    await Family.findByIdAndDelete(req.params.id);
    res.json({ message: "Family deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/families/:id/members', async (req, res) => {
  try {
    const { newMemberId } = req.body; 
    const familyId = req.params.id;
    if (!newMemberId) return res.status(400).json({ error: "Member ID required" });

    const family = await Family.findById(familyId);
    if (!family) return res.status(404).json({ error: "Family not found" });

    if (family.member_ids.includes(newMemberId)) {
        return res.status(409).json({ error: "User is already a member" });
    }

    family.member_ids.push(newMemberId);
    await family.save();
    res.json(family);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- USER ROUTES ---
app.get('/api/users', async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) return res.status(400).json({ error: "IDs required" });
    const idList = ids.split(',');
    const users = await User.find({ _id: { $in: idList } });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});