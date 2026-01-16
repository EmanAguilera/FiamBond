const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 1. LOAD ENVIRONMENT VARIABLES
require('dotenv').config(); 

const app = express();
const port = process.env.PORT || 3000;

// 2. CORS CONFIGURATION (FIXED: Explicitly allowing production domain)
const allowedOrigins = [
    'https://fiambond.web.app', // <--- YOUR PRODUCTION DOMAIN
    'https://fiam-bond.vercel.app', // Vercel domain
    'http://localhost:5173', // Common local dev ports
    'http://localhost:3000',
    /\.vercel\.app$/, // Vercel preview domains
    /\.github\.dev$/ // Codespace domain
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
        if (!origin) return callback(null, true);
        
        // Check if the origin is explicitly allowed or matches a RegExp pattern
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(rx => rx instanceof RegExp && rx.test(origin))) {
            callback(null, true);
        } else {
            // Block the request and log the attempted origin
            console.error('CORS Blocked Origin:', origin);
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));

// Enable pre-flight for all routes
app.options(/.*/, cors()); 

app.use(express.json());

// 3. DATABASE CONNECTION
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fiambond_v3';

let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        const opts = {
            bufferCommands: false, 
            serverSelectionTimeoutMS: 5000,
        };
        cached.promise = mongoose.connect(mongoURI, opts).then((mongoose) => {
            console.log('✅ MongoDB Connected Successfully!');
            return mongoose;
        });
    }
    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error('❌ MongoDB Connection Failed:', e);
        throw e;
    }
    return cached.conn;
}

// 4. MIDDLEWARE (Simplified - only handles DB connection/error response)
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        console.error("Database Middleware Error:", error);
        res.status(500).json({ error: "Database connection failed." });
    }
});

// ==========================================
// 5. SCHEMAS
// ==========================================

const UserSchema = new mongoose.Schema({ 
    _id: String, 
    full_name: String, 
    first_name: String,
    last_name: String,
    email: String, 
    role: { type: String, default: 'user' },
    is_premium: { type: Boolean, default: false },
    subscription_status: { type: String, default: 'inactive' },
    active_company_premium_id: { type: String, default: "" },
    is_family_premium: { type: Boolean, default: false },
    family_subscription_status: { type: String, default: 'inactive' },
    active_family_premium_id: { type: String, default: "" },
    family_id: String,
    created_at: { type: Date, default: Date.now }
}, { _id: false });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const PremiumSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    access_type: { type: String, enum: ['company', 'family'], required: true },
    amount: { type: Number, required: true },
    plan_cycle: { type: String, default: 'monthly' },
    status: { type: String, default: 'active' },
    granted_at: { type: Date, default: Date.now },
    expires_at: { type: Date },
    payment_method: { type: String, default: 'Admin Manual' },
    payment_ref: { type: String, default: 'N/A' }
});
const Premium = mongoose.models.Premium || mongoose.model('Premium', PremiumSchema);

const TransactionSchema = new mongoose.Schema({
    user_id: String,
    family_id: { type: String, default: null },
    company_id: { type: String, default: null }, 
    description: String,
    amount: Number,
    type: String,
    created_at: { type: Date, default: Date.now },
    attachment_url: String
});
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

const GoalSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    family_id: { type: String, default: null },
    company_id: { type: String, default: null },
    name: { type: String, required: true },
    target_amount: { type: Number, required: true },
    target_date: { type: Date, required: true },
    status: { type: String, default: 'active', enum: ['active', 'completed'] },
    created_at: { type: Date, default: Date.now },
    completed_at: { type: Date, default: null },
    completed_by_user_id: { type: String, default: null },
    achievement_url: { type: String, default: null }
});
const Goal = mongoose.models.Goal || mongoose.model('Goal', GoalSchema);

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
    status: { type: String, enum: ['pending_confirmation', 'outstanding', 'repaid', 'paid', 'rejected'], default: 'pending_confirmation' },
    created_at: { type: Date, default: Date.now },
    confirmed_at: { type: Date, default: null },
    attachment_url: String,
    pending_repayment: { amount: Number, submitted_by: String, submitted_at: Date, receipt_url: String },
    repayment_receipts: [{ url: String, amount: Number, recorded_at: Date }]
});
const Loan = mongoose.models.Loan || mongoose.model('Loan', LoanSchema);

const FamilySchema = new mongoose.Schema({
    family_name: { type: String, required: true },
    owner_id: { type: String, required: true },
    member_ids: [String],
    created_at: { type: Date, default: Date.now }
});
const Family = mongoose.models.Family || mongoose.model('Family', FamilySchema);

const CompanySchema = new mongoose.Schema({
    name: { type: String, required: true },
    owner_id: { type: String, required: true },
    member_ids: [String],
    created_at: { type: Date, default: Date.now }
});
const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema);

// ==========================================
// 6. ROUTES
// ==========================================

app.get('/', (req, res) => {
    res.status(200).send(`FiamBond V3 API Online 🚀`);
});

app.get('/api/premiums', async (req, res) => {
    try {
        const premiums = await Premium.find().sort({ granted_at: -1 });
        res.json(premiums);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/toggle-premium', async (req, res) => {
    try {
        const { userId, action, type, amount, plan, paymentRef } = req.body;
        
        if (action === 'approve' || action === 'grant') {
            const newPremium = new Premium({
                user_id: userId,
                access_type: type,
                amount: amount,
                plan_cycle: plan || 'monthly',
                payment_ref: paymentRef || 'ADMIN_GRANTED',
                granted_at: new Date(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });
            await newPremium.save();

            const userUpdate = type === 'company' ? 
                { is_premium: true, subscription_status: 'active', active_company_premium_id: newPremium._id } :
                { is_family_premium: true, family_subscription_status: 'active', active_family_premium_id: newPremium._id };
            
            await User.findByIdAndUpdate(userId, userUpdate);
        } else {
            const revokeUpdate = type === 'company' ? 
                { is_premium: false, subscription_status: 'inactive', active_company_premium_id: "" } :
                { is_family_premium: false, family_subscription_status: 'inactive', active_family_premium_id: "" };
            
            await User.findByIdAndUpdate(userId, revokeUpdate);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/transactions', async (req, res) => {
    try {
        const { user_id, family_id, company_id, startDate } = req.query;
        let query = {};
        if (company_id && company_id !== 'undefined') query.company_id = company_id;
        else if (family_id && family_id !== 'undefined') query.family_id = family_id;
        else if (user_id) query = { user_id, family_id: null, company_id: null }; 
        else return res.status(400).json({ error: "ID required" });

        if (startDate && startDate !== 'undefined') {
            const dateObj = new Date(startDate);
            if (!isNaN(dateObj.getTime())) query.created_at = { $gte: dateObj };
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

app.get('/api/loans', async (req, res) => {
    try {
        const { user_id, family_id } = req.query;
        let query = {};
        const hasFamily = family_id && family_id !== 'undefined' && family_id !== 'null';
        const hasUser = user_id && user_id !== 'undefined' && user_id !== 'null';

        if (hasFamily) query.family_id = family_id;
        else if (hasUser) query.$or = [{ creditor_id: user_id }, { debtor_id: user_id }];
        else return res.status(400).json({ error: "User ID or Family ID required" });

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

app.get('/api/goals', async (req, res) => {
    try {
        const { user_id, family_id, company_id } = req.query;
        let query = {};
        if (company_id && company_id !== 'undefined') query = { company_id };
        else if (family_id && family_id !== 'undefined') query = { family_id };
        else if (user_id) query = { user_id, family_id: null, company_id: null };
        else return res.status(400).json({ error: "ID required" });

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
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: "Invalid Family ID" });
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
        if (owner_id && !finalMembers.includes(owner_id)) finalMembers.push(owner_id);
        const newFamily = new Family({ family_name, owner_id, member_ids: finalMembers });
        const savedFamily = await newFamily.save();
        res.status(201).json(savedFamily);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/families/:id', async (req, res) => {
    try {
        const updatedFamily = await Family.findByIdAndUpdate(req.params.id, { family_name: req.body.family_name }, { new: true });
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
        const family = await Family.findById(req.params.id);
        if (!family) return res.status(404).json({ error: "Family not found" });
        if (family.member_ids.includes(newMemberId)) return res.status(409).json({ error: "Member already exists" });
        family.member_ids.push(newMemberId);
        await family.save();
        res.json(family);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

app.patch('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/companies', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: "User ID query parameter required." });
        const companies = await Company.find({ member_ids: user_id });
        res.json(companies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/companies/:id', async (req, res) => {
    try {
        const companyIdentifier = req.params.id;
        let query = mongoose.Types.ObjectId.isValid(companyIdentifier) 
            ? { $or: [{ _id: companyIdentifier }, { owner_id: companyIdentifier }] }
            : { owner_id: companyIdentifier };

        const company = await Company.findOne(query);
        if (!company) return res.status(404).json({ error: "Company not found" });
        res.json(company);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/companies/:id/members', async (req, res) => {
    try {
        const { newMemberId } = req.body;
        const companyIdentifier = req.params.id;
        let query = mongoose.Types.ObjectId.isValid(companyIdentifier) 
            ? { $or: [{ _id: companyIdentifier }, { owner_id: companyIdentifier }] }
            : { owner_id: companyIdentifier };

        const company = await Company.findOne(query);
        if (!company) return res.status(404).json({ error: "Company not found" });
        if (company.member_ids.includes(newMemberId)) return res.status(409).json({ error: "Already an employee" });

        company.member_ids.push(newMemberId);
        await company.save();
        res.json(company);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reports/personal/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const { period } = req.query;
        const now = new Date();
        let startDate;

        if (period === 'weekly') {
            startDate = new Date(now.setDate(now.getDate() - 7));
        } else if (period === 'yearly') {
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        } else {
            startDate = new Date(now.setMonth(now.getMonth() - 1));
        }
        
        const periodTxs = await Transaction.find({ 
            user_id, 
            family_id: null, 
            company_id: null,
            created_at: { $gte: startDate } 
        });

        const periodIncome = periodTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
        const periodExpense = periodTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
        
        const totalAllTimeTxs = await Transaction.find({ user_id, family_id: null, company_id: null });
        const totalIncome = totalAllTimeTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
        const totalExpense = totalAllTimeTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
        const balance = totalIncome - totalExpense;

        res.json({
            period: period,
            balance: balance,       
            periodIncome: periodIncome,   
            periodExpense: periodExpense, 
            transactions: periodTxs.length
        });
    } catch (err) {
        console.error("Report generation failed:", err);
        res.status(500).json({ error: err.message || "Failed to generate report." });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});