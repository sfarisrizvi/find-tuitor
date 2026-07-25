require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function runMigration() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();

    // 1. Add 'area' to jobs if not exists
    await client.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS area text;
    `);
    console.log("Added 'area' to jobs table");

    // 2. Find tutor ID
    const res = await client.query(`SELECT id FROM tutor_profiles WHERE email = $1`, ['nafeesrizvi4@gmail.com']);
    if (res.rows.length === 0) {
      console.log("Could not find nafeesrizvi4@gmail.com in tutor_profiles");
      return;
    }
    const tutorId = res.rows[0].id;

    // 3. Find some existing clients to create mock jobs for
    const clientRes = await client.query(`SELECT id FROM client_profiles LIMIT 3`);
    if (clientRes.rows.length === 0) {
      console.log("No client profiles found to create jobs for");
      return;
    }

    // 4. Create Mock Jobs
    const jobsToInsert = [
      {
        client_id: clientRes.rows[0].id,
        title: 'A-Level Computer Science Coding Specialist',
        subject: 'Computer Science',
        mode: 'online',
        budget_type: 'hourly',
        budget_amount: 3000,
        status: 'hired', // Active contract status
        description: 'Looking for a teacher who can explain Python sorting algorithms, SQL queries, and networking topologies. Student is appearing for Cambridge A-Levels in the upcoming session.',
        city: 'Rawalpindi',
        area: 'Bahria Town',
        gender_preference: 'Any Gender',
        grade_level: 'A-Level',
        duration: '1-3 months',
        hours_per_week: 10
      },
      {
        client_id: clientRes.rows.length > 1 ? clientRes.rows[1].id : clientRes.rows[0].id,
        title: 'O-Level Mathematics Crash Course',
        subject: 'Mathematics',
        mode: 'home',
        budget_type: 'fixed',
        budget_amount: 15000,
        status: 'hired',
        description: 'Need a strict tutor who can complete the syllabus in 2 months. Must have past paper practice materials.',
        city: 'Lahore',
        area: 'DHA Phase 5',
        gender_preference: 'Female Only',
        grade_level: 'O-Level',
        duration: '1-3 months',
        hours_per_week: 15
      }
    ];

    for (const j of jobsToInsert) {
      const insertJobRes = await client.query(`
        INSERT INTO jobs (
          client_id, title, subject, mode, budget_type, budget_amount, 
          status, description, city, area, gender_preference, grade_level, 
          duration, hours_per_week
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) RETURNING id
      `, [
        j.client_id, j.title, j.subject, j.mode, j.budget_type, j.budget_amount,
        j.status, j.description, j.city, j.area, j.gender_preference, j.grade_level,
        j.duration, j.hours_per_week
      ]);
      const jobId = insertJobRes.rows[0].id;

      // Create accepted proposal
      await client.query(`
        INSERT INTO proposals (job_id, tutor_id, cover_letter, bid_amount, status)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        jobId, 
        tutorId, 
        'Hi, I am an experienced tutor and I can help your child achieve an A* grade.', 
        j.budget_amount, 
        'accepted'
      ]);
    }

    console.log("Successfully inserted mock active contracts for nafeesrizvi4@gmail.com");

  } catch (err) {
    console.error("Error running migration:", err);
  } finally {
    await client.end();
  }
}

runMigration();
