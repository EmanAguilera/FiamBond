const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 1. LOAD ENVIRONMENT VARIABLES (For Localhost)
// This allows your laptop to read .env. Vercel ignores this if file is missing.
require('dotenv').config(); 

const app = express();
const port = process.env.PORT || 3000;

// 2. CORS CONFIGURATION (The "Open Door" Policy)
// This allows your Frontend to talk to this Backend
app.use(cors({
    origin: true, 
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.options(/.*/, cors()); // Enable pre-flight across-the-board
app.use(express.json());

// 3. DATABASE CONNECTION (The "Serverless Brain")
// This section is special. It keeps the database connection open 
// so Vercel doesn't crash/timeout on every request.
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fiambond_v3';

if (!process.env.MONGO_URI) {
    console.warn("⚠️  Warning: MONGO_URI not found. Falling back to Localhost.");
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        const opts = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            bufferCommands: false, // Important: Fail fast if DB is down
            serverSelectionTimeoutMS: 5000, // Don't hang forever
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

// 4. MIDDLEWARE (The Guard)
// This stops any request from processing until the Database is 100% ready.
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        console.error("Database Middleware Error:", error);
        res.status(500).json({ error: "Database connection failed. Check server logs." });
    }
});

// ==========================================
// 5. SCHEMAS (The Blueprints)
// We use "mongoose.models.X || ..." to prevent "OverwriteModelError" in Vercel
// ==========================================

const UserSchema = new mongoose.Schema({ _id: String, full_name: String, email: String, family_id: String }, { _id: false });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

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


// ==========================================
// 6. ROUTES (The Logic)
// ==========================================

app.get('/', (req, res) => {
    res.status(200).send(`FiamBond V3 API is Online 🚀 (${new Date().toISOString()})`);
});

// --- TRANSACTIONS ---
app.get('/api/transactions', async (req, res) => {
    try {
        const { user_id, family_id, company_id, startDate } = req.query;
        let query = {};

        // STRICT FILTERING LOGIC
        if (company_id && company_id !== 'undefined') {
            query.company_id = company_id;
        } 
        else if (family_id && family_id !== 'undefined') {
            query.family_id = family_id;
        } 
        else if (user_id) {
            // PERSONAL REALM: Must NOT have family_id OR company_id
            query.user_id = user_id;
            query.family_id = null;
            query.company_id = null; 
        } 
        else {
            return res.status(400).json({ error: "ID required" });
        }

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
        console.error("POST /transactions Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- LOANS ---
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
        console.error("GET /loans Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/loans', async (req, res) => {
    try {
        const newLoan = new Loan(req.body);
        const savedLoan = await newLoan.save();
        res.status(201).json(savedLoan);
    } catch (err) {
        console.error("POST /loans Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/loans/:id', async (req, res) => {
    try {
        const updatedLoan = await Loan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedLoan);
    } catch (err) {
        console.error("PATCH /loans Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- GOALS ---
app.get('/api/goals', async (req, res) => {
    try {
        const { user_id, family_id, company_id } = req.query;
        let query = {};
        
        if (company_id && company_id !== 'undefined') {
            query = { company_id: company_id };
        } 
        else if (family_id && family_id !== 'undefined') {
            query = { family_id: family_id };
        } 
        else if (user_id) {
            // PERSONAL REALM: Strict Check
            query = { user_id: user_id, family_id: null, company_id: null };
        } 
        else {
            return res.status(400).json({ error: "ID required" });
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
        console.error("POST /goals Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/goals/:id', async (req, res) => {
    try {
        const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedGoal);
    } catch (err) {
        console.error("PATCH /goals Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/goals/:id', async (req, res) => {
    try {
        await Goal.findByIdAndDelete(req.params.id);
        res.json({ message: "Goal deleted" });
    } catch (err) {
        console.error("DELETE /goals Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- FAMILIES ---
app.get('/api/families', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: "User ID required" });
        const families = await Family.find({ member_ids: user_id });
        res.json(families);
    } catch (err) {
        console.error("GET /families Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/families/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: "Invalid Family ID format" });
        const family = await Family.findById(req.params.id);
        if (!family) return res.status(404).json({ error: "Family not found" });
        res.json(family);
    } catch (err) {
        console.error("GET /families/:id Error:", err);
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
        console.error("POST /families Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/families/:id', async (req, res) => {
    try {
        const updatedFamily = await Family.findByIdAndUpdate(req.params.id, { family_name: req.body.family_name }, { new: true });
        res.json(updatedFamily);
    } catch (err) {
        console.error("PATCH /families Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/families/:id', async (req, res) => {
    try {
        await Family.findByIdAndDelete(req.params.id);
        res.json({ message: "Family deleted" });
    } catch (err) {
        console.error("DELETE /families Error:", err);
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

        if (family.member_ids.includes(newMemberId)) return res.status(409).json({ error: "User is already a member" });

        family.member_ids.push(newMemberId);
        await family.save();
        res.json(family);
    } catch (err) {
        console.error("POST /families/members Error:", err);
        res.status(500).json({ error: err.message });
    }
});


// 3. Get User (For Member Lists)
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

// --- USERS ---
app.get('/api/users', async (req, res) => {
    try {
        const { ids } = req.query;
        if (!ids) return res.status(400).json({ error: "IDs required" });
        const idList = ids.split(',');
        const users = await User.find({ _id: { $in: idList } });
        res.json(users);
    } catch (err) {
        console.error("GET /users Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- NEW COMPANY ROUTES ---

// 1. Get Company by ID (The one fixing your error)
app.get('/api/companies/:id', async (req, res) => {
    try {
        // Allow searching by _id OR by owner_id (user uid)
        // This handles the case where frontend passes user.uid as company.id
        const company = await Company.findOne({ 
            $or: [
                { _id: (mongoose.Types.ObjectId.isValid(req.params.id) ? req.params.id : null) },
                { owner_id: req.params.id }
            ]
        });

        if (!company) return res.status(404).json({ error: "Company not found" });
        res.json(company);
    } catch (err) {
        console.error("GET /companies/:id Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Create Company
app.post('/api/companies', async (req, res) => {
    try {
        const { name, owner_id } = req.body;
        // Check if user already has a company
        const existing = await Company.findOne({ owner_id });
        if(existing) return res.status(400).json({ error: "User already owns a company" });

        const newCompany = new Company({ 
            name, 
            owner_id, 
            member_ids: [owner_id] // Owner is first member
        });
        const savedCompany = await newCompany.save();
        res.status(201).json(savedCompany);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/companies/:id/members', async (req, res) => {
    try {
        const { newMemberId } = req.body; // The Firebase UID of the employee
        const companyId = req.params.id;

        if (!newMemberId) return res.status(400).json({ error: "Member ID required" });

        const company = await Company.findOne({ 
            $or: [{ _id: companyId }, { owner_id: companyId }] 
        });

        if (!company) return res.status(404).json({ error: "Company not found" });

        if (company.member_ids.includes(newMemberId)) {
            return res.status(409).json({ error: "User is already an employee" });
        }

        company.member_ids.push(newMemberId);
        await company.save();
        
        res.json(company);
    } catch (err) {
        console.error("POST /companies/members Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 7. EXPORT (for Vercel) & LISTEN (for Local)
// ==========================================

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`🚀 Server running locally on port ${port}`);
    });
}

module.exports = app;