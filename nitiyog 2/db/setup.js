// =============================================
// NITIYOG — Database Setup + Real Seed Data
// Run once: node db/setup.js
// =============================================
require('dotenv').config();
const pool = require('./index');
const bcrypt = require('bcryptjs');

async function setup() {
  const client = await pool.connect();
  try {
    console.log('🔧 Setting up Nitiyog database...\n');

    // ── 1. USERS TABLE ──────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id           SERIAL PRIMARY KEY,
        fname        VARCHAR(100) NOT NULL,
        lname        VARCHAR(100) NOT NULL,
        phone        VARCHAR(15) UNIQUE,
        email        VARCHAR(200) UNIQUE,
        password     TEXT NOT NULL,
        state        VARCHAR(100),
        category     VARCHAR(50),
        business     VARCHAR(100),
        annual_income NUMERIC(12,2),
        gender       VARCHAR(20),
        age          INTEGER,
        is_admin     BOOLEAN DEFAULT FALSE,
        created_at   TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ users table ready');

    // ── 2. SCHEMES TABLE ────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS schemes (
        id              SERIAL PRIMARY KEY,
        scheme_code     VARCHAR(50) UNIQUE,
        title           TEXT NOT NULL,
        ministry        VARCHAR(200),
        department      VARCHAR(200),
        category        TEXT[],
        state           TEXT[],
        gender          TEXT[],
        max_age         INTEGER,
        min_age         INTEGER,
        business_type   TEXT[],
        max_income      NUMERIC(12,2),
        benefit_type    VARCHAR(100),
        benefit_amount  TEXT,
        description     TEXT,
        eligibility     TEXT,
        how_to_apply    TEXT,
        documents       TEXT[],
        deadline        DATE,
        scheme_url      TEXT,
        is_active       BOOLEAN DEFAULT TRUE,
        source          VARCHAR(50) DEFAULT 'seed',
        created_at      TIMESTAMP DEFAULT NOW(),
        updated_at      TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ schemes table ready');

    // ── 3. APPLICATIONS TABLE ───────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
        scheme_id   INTEGER REFERENCES schemes(id) ON DELETE CASCADE,
        status      VARCHAR(50) DEFAULT 'Draft',
        notes       TEXT,
        applied_at  TIMESTAMP DEFAULT NOW(),
        updated_at  TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, scheme_id)
      );
    `);
    console.log('✅ applications table ready');

    // ── 4. ADMIN USER ────────────────────────────
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@nitiyog.in';
    const adminPass  = process.env.ADMIN_PASSWORD || 'Admin@1234';
    const hash = await bcrypt.hash(adminPass, 10);
    await client.query(`
      INSERT INTO users (fname, lname, phone, email, password, is_admin)
      VALUES ('Admin', 'Nitiyog', '9999999999', $1, $2, TRUE)
      ON CONFLICT (email) DO NOTHING;
    `, [adminEmail, hash]);
    console.log('✅ Admin user ready →', adminEmail, '/', adminPass);

    // ── 5. REAL SCHEME SEED DATA ─────────────────
    const schemes = [
      {
        code: 'PM-VISHWAKARMA-2023',
        title: 'PM Vishwakarma Yojana',
        ministry: 'Ministry of Micro, Small and Medium Enterprises (MoMSME)',
        department: 'Office of DC (MSME)',
        category: ['SC','OBC','General'],
        state: ['All India'],
        gender: ['Male','Female','Transgender'],
        min_age: 18, max_age: 60,
        business: ['Handicraft','Artisan','Manufacturing'],
        max_income: 300000,
        benefit_type: 'Grant + Loan',
        benefit_amount: '₹3,00,000 credit support + ₹15,000 toolkit grant',
        description: 'PM Vishwakarma is a Central Sector Scheme to support traditional artisans and craftspeople who work with their hands and tools. The scheme aims to strengthen and nurture the Guru-Shishya tradition of these craftspeople.',
        eligibility: 'Artisan/craftsperson working with hands and tools in one of 18 family-based traditional trades. Age 18+. Only one member per family eligible.',
        how_to_apply: '1. Register on pmvishwakarma.gov.in via CSC center\n2. Get PM Vishwakarma Certificate & ID card\n3. Avail Credit Support through bank\n4. Enroll for skill training',
        documents: ['Aadhaar Card','Caste Certificate','Bank Passbook','Mobile linked to Aadhaar','Trade Proof (photos/tools)'],
        deadline: null,
        url: 'https://pmvishwakarma.gov.in'
      },
      {
        code: 'STANDUP-INDIA-2016',
        title: 'Stand-Up India Scheme',
        ministry: 'Ministry of Finance',
        department: 'Department of Financial Services',
        category: ['SC','ST'],
        state: ['All India'],
        gender: ['Male','Female'],
        min_age: 18, max_age: null,
        business: ['Manufacturing','Services','Trade'],
        max_income: null,
        benefit_type: 'Bank Loan',
        benefit_amount: '₹10 Lakh to ₹1 Crore composite loan',
        description: 'Stand-Up India scheme facilitates bank loans between ₹10 lakh and ₹1 Crore to at least one Scheduled Caste (SC) or Scheduled Tribe (ST) borrower and at least one woman borrower per bank branch for setting up a greenfield enterprise.',
        eligibility: 'SC/ST borrower OR Woman borrower. Age 18+. For greenfield enterprise (first-time business). The enterprise must be in manufacturing, services, or trading sector. In case of non-individual enterprises, 51% shareholding should be held by SC/ST/Woman entrepreneur.',
        how_to_apply: '1. Apply through standupmitra.in portal\n2. Contact nearest bank branch (PSB)\n3. Submit business plan + documents\n4. Bank processes within 30-90 days',
        documents: ['Aadhaar Card','PAN Card','Caste Certificate','Bank Statement (6 months)','Business Plan','Property Documents (if any)','Photographs'],
        deadline: null,
        url: 'https://www.standupmitra.in'
      },
      {
        code: 'MUDRA-TARUN-2015',
        title: 'MUDRA Yojana – Tarun',
        ministry: 'Ministry of Finance',
        department: 'Micro Units Development & Refinance Agency (MUDRA)',
        category: ['SC','ST','OBC','Minority','General'],
        state: ['All India'],
        gender: ['Male','Female','Transgender'],
        min_age: 18, max_age: null,
        business: ['Manufacturing','Trade','Services','Agriculture Allied'],
        max_income: null,
        benefit_type: 'Collateral-free Loan',
        benefit_amount: '₹5 Lakh to ₹10 Lakh',
        description: 'MUDRA (Micro Units Development and Refinance Agency) provides loans up to ₹10 lakh to non-corporate, non-farm small/micro enterprises. Tarun category covers loans from ₹5L to ₹10L. No collateral required.',
        eligibility: 'Any Indian citizen planning business activities in manufacturing, processing, trading or service sector. Loan for non-farm income generating activities. Existing businesses can also apply for expansion.',
        how_to_apply: '1. Approach any bank/MFI/NBFC\n2. Fill Mudra loan application form\n3. Submit business plan + documents\n4. No processing fee charged',
        documents: ['Aadhaar Card','PAN Card','Proof of Business Address','Bank Statement (6 months)','Business Plan','2 Passport Photos'],
        deadline: null,
        url: 'https://www.mudra.org.in'
      },
      {
        code: 'NSTFDC-MICRO-2020',
        title: 'NSTFDC Micro Credit Finance',
        ministry: 'Ministry of Social Justice and Empowerment (MoSJE)',
        department: 'National Scheduled Tribes Finance and Development Corporation',
        category: ['ST'],
        state: ['All India'],
        gender: ['Male','Female'],
        min_age: 18, max_age: 55,
        business: ['Trade','Agriculture','Handicraft','Services'],
        max_income: 300000,
        benefit_type: 'Micro Loan',
        benefit_amount: 'Up to ₹1,50,000 at 5% per annum',
        description: 'NSTFDC provides micro-credit to Scheduled Tribes for income-generating activities through State Channelising Agencies (SCAs), NGOs and Women SHGs. Very low interest rate of 5% per annum.',
        eligibility: 'Scheduled Tribe member. Age 18-55. Annual family income below ₹3 Lakh. Loan for genuine income-generating activity.',
        how_to_apply: '1. Contact State Channelising Agency (SCA) in your state\n2. Or approach nearby NSTFDC-empanelled NGO\n3. Submit application with documents\n4. Loan disbursed within 60 days',
        documents: ['ST Certificate','Aadhaar Card','Income Certificate','Bank Passbook','Photographs'],
        deadline: null,
        url: 'https://www.nstfdc.nic.in'
      },
      {
        code: 'NBCFDC-GENERAL-2019',
        title: 'NBCFDC General Loan Scheme',
        ministry: 'Ministry of Social Justice and Empowerment (MoSJE)',
        department: 'National Backward Classes Finance & Development Corporation',
        category: ['OBC'],
        state: ['All India'],
        gender: ['Male','Female'],
        min_age: 18, max_age: 55,
        business: ['Manufacturing','Trade','Services','Agriculture'],
        max_income: 300000,
        benefit_type: 'Term Loan',
        benefit_amount: 'Up to ₹20 Lakh at 6% per annum',
        description: 'NBCFDC provides financial assistance for any viable income generating activity to persons belonging to Other Backward Classes (OBC) through State Channelising Agencies.',
        eligibility: 'OBC category member. Annual family income below ₹3 Lakh. Age 18-55. For any income-generating activity.',
        how_to_apply: '1. Contact State Channelising Agency (SCA)\n2. Submit application form + documents\n3. SCA forwards to NBCFDC\n4. Loan disbursed in 60-90 days',
        documents: ['OBC Certificate','Aadhaar Card','Income Certificate','Bank Passbook','Project Report','Photographs'],
        deadline: null,
        url: 'https://nbcfdc.gov.in'
      },
      {
        code: 'PMEGP-KVIC-2008',
        title: 'PMEGP – Prime Minister Employment Generation Programme',
        ministry: 'Ministry of MSME',
        department: 'Khadi and Village Industries Commission (KVIC)',
        category: ['SC','ST','OBC','Minority','General','Women'],
        state: ['All India'],
        gender: ['Male','Female'],
        min_age: 18, max_age: null,
        business: ['Manufacturing','Food Processing','Handicraft'],
        max_income: null,
        benefit_type: 'Subsidy + Bank Loan',
        benefit_amount: '25–35% margin money subsidy on projects up to ₹50L (manufacturing) / ₹20L (service)',
        description: 'PMEGP is a credit-linked subsidy scheme for generating employment through establishment of micro enterprises in rural and urban areas. SC/ST/OBC/Women/Minorities get 35% subsidy in rural areas.',
        eligibility: 'Any individual above 18 years. Education qualification: VIII standard pass for projects above ₹10L. Existing Units and units already under Govt subsidy not eligible. One family one unit.',
        how_to_apply: '1. Apply online on kviconline.gov.in\n2. Fill application with project report\n3. Shortlisting by KVIC/KVIB/DIC\n4. EDP Training (mandatory)\n5. Bank loan sanctioned',
        documents: ['Aadhaar Card','PAN Card','Caste/Category Certificate','Education Certificate','Project Report','Bank Account Details','Photographs'],
        deadline: '2026-03-31',
        url: 'https://www.kviconline.gov.in/pmegpeportal'
      },
      {
        code: 'NMDFC-MAHILA-2018',
        title: 'NMDFC Mahila Samridhi Yojana',
        ministry: 'Ministry of Minority Affairs',
        department: 'National Minorities Development Finance Corporation',
        category: ['Minority'],
        state: ['All India'],
        gender: ['Female'],
        min_age: 18, max_age: 55,
        business: ['Trade','Handicraft','Services','Small Business'],
        max_income: 600000,
        benefit_type: 'Micro Loan',
        benefit_amount: 'Up to ₹1,40,000 at 2% per annum for women',
        description: 'Mahila Samridhi Yojana provides micro-financing to minority community women through SHGs and NGOs at very concessional rate of interest of 2% per annum for income-generating activities.',
        eligibility: 'Women belonging to minority communities (Muslim, Christian, Sikh, Buddhist, Jain, Parsi). Annual income below ₹6 Lakh. Through SHG or NGO. Age 18-55.',
        how_to_apply: '1. Join a SHG (Self Help Group) in your area\n2. SHG applies through NMDFC-empanelled NGO\n3. Submit group and individual documents\n4. Loan disbursed to SHG account',
        documents: ['Minority Community Certificate','Aadhaar Card','Income Certificate','SHG Membership Proof','Bank Passbook','Photographs'],
        deadline: null,
        url: 'https://www.nmdfc.org'
      },
      {
        code: 'DEDS-SC-2020',
        title: 'Dalit Entrepreneur Development Scheme (UP)',
        ministry: 'Government of Uttar Pradesh',
        department: 'UP Scheduled Castes Finance Corporation',
        category: ['SC'],
        state: ['Uttar Pradesh'],
        gender: ['Male','Female'],
        min_age: 18, max_age: 50,
        business: ['Manufacturing','Trade','Services'],
        max_income: 200000,
        benefit_type: 'Loan + Subsidy',
        benefit_amount: '50% subsidy up to ₹50,000 + term loan up to ₹5 Lakh',
        description: 'State scheme by UP government to provide financial assistance to SC entrepreneurs in Uttar Pradesh for setting up small enterprises. Administered by UP Scheduled Castes Finance Corporation (UPSCFC).',
        eligibility: 'SC category member domiciled in Uttar Pradesh. Age 18-50. Annual family income below ₹2 Lakh. For new enterprise or expansion of existing micro unit.',
        how_to_apply: '1. Visit nearest UPSCFC district office\n2. Fill application form\n3. Submit with documents + project report\n4. Verification and loan sanction in 45 days',
        documents: ['SC Certificate (UP)','Domicile Certificate','Aadhaar Card','Income Certificate','Bank Passbook','Project Report','Photographs'],
        deadline: null,
        url: 'https://www.upscfc.in'
      },
      {
        code: 'WDCSC-2021',
        title: 'Venture Capital Fund for SC Entrepreneurs',
        ministry: 'Ministry of Social Justice and Empowerment',
        department: 'National Scheduled Castes Finance & Development Corporation (NSFDC)',
        category: ['SC'],
        state: ['All India'],
        gender: ['Male','Female'],
        min_age: 18, max_age: null,
        business: ['Manufacturing','IT','Services','Trade'],
        max_income: null,
        benefit_type: 'Venture Capital / Equity Support',
        benefit_amount: 'Up to ₹15 Lakh at 4% per annum',
        description: 'NSFDC provides term loans at concessional rate for income-generating activities to persons belonging to Scheduled Castes. Projects must be economically viable.',
        eligibility: 'SC category. Annual family income below ₹3 Lakh (urban) / ₹2.5 Lakh (rural). Valid SC Certificate from competent authority.',
        how_to_apply: '1. Apply through State Channelising Agency\n2. Submit project report\n3. Bank/SCA evaluation\n4. NSFDC approval and disbursement',
        documents: ['SC Certificate','Aadhaar Card','PAN Card','Income Certificate','Project Report','Bank Statement'],
        deadline: null,
        url: 'https://nsfdc.nic.in'
      },
      {
        code: 'SJSRY-URBAN-2009',
        title: 'DAY-NULM – Self Employment Programme',
        ministry: 'Ministry of Housing and Urban Affairs',
        department: 'Deendayal Antyodaya Yojana – National Urban Livelihoods Mission',
        category: ['SC','ST','OBC','Minority','General'],
        state: ['All India'],
        gender: ['Male','Female'],
        min_age: 18, max_age: 45,
        business: ['Trade','Services','Manufacturing','Food'],
        max_income: null,
        benefit_type: 'Loan + Subsidy + Training',
        benefit_amount: 'Interest subvention of 5–7% on loans up to ₹2 Lakh (Individual) / ₹10 Lakh (Group)',
        description: 'DAY-NULM supports urban poor in setting up self-employment ventures. Provides interest subsidy, skill training, and capacity building for establishing micro enterprises in urban areas.',
        eligibility: 'Urban poor. Beneficiary should be urban resident. For individual micro-enterprise. Preference to SC/ST/women/disabled/minorities.',
        how_to_apply: '1. Contact Urban Local Body (Nagar Palika/Nagar Nigam)\n2. Apply through ULB NULM cell\n3. SHG formation (for group enterprises)\n4. Bank loan + interest subsidy processed by ULB',
        documents: ['Urban Resident Proof','Aadhaar Card','Caste Certificate','Income Proof','Bank Passbook','Project Proposal'],
        deadline: null,
        url: 'https://nulm.gov.in'
      }
    ];

    // Insert schemes
    let inserted = 0;
    for (const s of schemes) {
      await client.query(`
        INSERT INTO schemes (
          scheme_code, title, ministry, department,
          category, state, gender, min_age, max_age,
          business_type, max_income, benefit_type, benefit_amount,
          description, eligibility, how_to_apply, documents,
          deadline, scheme_url, source
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'seed')
        ON CONFLICT (scheme_code) DO NOTHING;
      `, [
        s.code, s.title, s.ministry, s.department,
        s.category, s.state, s.gender, s.min_age, s.max_age,
        s.business, s.max_income, s.benefit_type, s.benefit_amount,
        s.description, s.eligibility, s.how_to_apply, s.documents,
        s.deadline || null, s.url
      ]);
      inserted++;
      process.stdout.write('  → ' + s.title + '\n');
    }

    console.log(`\n✅ ${inserted} real government schemes seeded`);
    console.log('\n🎉 Database setup complete!');
    console.log('━'.repeat(50));
    console.log('Now run: node app.js');
    console.log('Admin login:', process.env.ADMIN_EMAIL || 'admin@nitiyog.in');
    console.log('Password:  ', process.env.ADMIN_PASSWORD || 'Admin@1234');
    console.log('━'.repeat(50));

  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    console.error('Hint: Make sure PostgreSQL is running and DB credentials in .env are correct');
  } finally {
    client.release();
    process.exit(0);
  }
}

setup();
