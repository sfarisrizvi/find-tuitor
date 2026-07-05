const { Client } = require('pg');
const crypto = require('crypto');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.qlhcavfyllfcwifxbtbu:2Xy8IkpeFkVOE6qf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const CITIES = ['Islamabad', 'Rawalpindi', 'Attock', 'Lahore', 'Karachi'];
const AREAS = {
  'Islamabad': ['Sector G-11', 'Sector F-7', 'DHA Phase 2', 'Bahria Town', 'I-8'],
  'Lahore': ['DHA Phase 5', 'Johar Town', 'Gulberg', 'Model Town', 'Wapda Town'],
  'Karachi': ['Clifton', 'DHA Phase 6', 'Gulshan-e-Iqbal', 'North Nazimabad', 'Tariq Road'],
  'Rawalpindi': ['Saddar', 'Bahria Town Phase 7', 'Westridge', 'Satellite Town'],
  'Attock': ['Pleasure Park', 'Cantt Area', 'People Colony']
};
const GENDERS = ['Male', 'Female'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer', 'Urdu', 'AI', 'Digital Marketing'];
const LEVELS = ['Class 9', 'Class 10', 'O Levels', 'A Levels', 'MDCAT', 'ECAT'];
const LANGUAGES = ['English', 'Urdu', 'Punjabi', 'Pashto'];
const MODES = ['online', 'home_tuition', 'tutor_home'];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomItems = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);

const FIRST_NAMES = {
  'Male': ['Ahmad', 'Ali', 'Bilal', 'Hamza', 'Usman', 'Mustafa', 'Zain', 'Omer', 'Fahad', 'Saad'],
  'Female': ['Ayesha', 'Sana', 'Fatima', 'Zainab', 'Mariam', 'Hina', 'Sara', 'Amna', 'Khadija', 'Sadia']
};
const LAST_NAMES = ['Khan', 'Ahmed', 'Tariq', 'Shah', 'Rizvi', 'Naim', 'Malik', 'Butt', 'Sheikh', 'Dar'];

async function seed() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase database. Starting mock tutor seeding...');

    // Generate 100 tutors
    for (let i = 1; i <= 100; i++) {
      const id = crypto.randomUUID();
      const email = `mock.tutor.${i}@findtutor.test`;
      const gender = randomItem(GENDERS);
      const firstName = randomItem(FIRST_NAMES[gender]);
      const lastName = randomItem(LAST_NAMES);
      const fullName = `${gender === 'Male' ? 'Sir' : 'Miss'} ${firstName} ${lastName}`;
      
      const city = randomItem(CITIES);
      const area = randomItem(AREAS[city]);
      const hourlyRate = randomInt(500, 6000);
      const experience = randomInt(1, 15);
      const isVerified = Math.random() > 0.3; // 70% verified
      const isImmediate = Math.random() > 0.6; // 40% immediate
      const rating = isVerified ? randomFloat(4.0, 5.0) : randomFloat(0.0, 4.2);
      const reviewsCount = randomInt(0, 50);
      const myModes = randomItems(MODES, randomInt(1, 2));
      const myLanguages = randomItems(LANGUAGES, randomInt(1, 2));
      const bio = `Hi, I am ${fullName}, a dedicated tutor specializing in ${randomItem(SUBJECTS)}. I offer home and online coaching with customized worksheets.`;

      // 1. Insert into auth.users (so profiles trigger fires and creates profile correctly)
      const rawUserMetaData = JSON.stringify({
        full_name: fullName,
        role: 'tutor'
      });

      await client.query(`
        INSERT INTO auth.users (
          id, instance_id, aud, role, email, encrypted_password, 
          email_confirmed_at, recovery_sent_at, last_sign_in_at, 
          raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
          $1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
          $2, '$2a$10$wS2CqD6N6b9zBebx2sC8q.fUaKk8i5QZUp.QJ1b0l/2G.uC02lEJu', -- bcrypt for 'password123'
          NOW(), NOW(), NOW(), 
          '{"provider":"email","providers":["email"]}'::jsonb, 
          $3::jsonb, NOW(), NOW()
        )
      `, [id, email, rawUserMetaData]);

      // 2. Update the public.profiles record with tutor specific search fields
      await client.query(`
        UPDATE public.profiles
        SET 
          city = $2,
          area = $3,
          gender = $4,
          hourly_rate = $5,
          experience_years = $6,
          verified = $7,
          immediate_hiring = $8,
          rating = $9,
          reviews_count = $10,
          teaching_modes = $11,
          languages = $12,
          bio = $13,
          onboarding_complete = true,
          onboarding_step = 4
        WHERE id = $1
      `, [
        id, city, area, gender, hourlyRate, experience, isVerified, isImmediate, 
        rating, reviewsCount, myModes, myLanguages, bio
      ]);

      // 3. Insert random levels & subjects in tutor_categories
      const tutorSubjects = randomItems(SUBJECTS, randomInt(1, 3));
      for (const subject of tutorSubjects) {
        const tutorLevels = randomItems(LEVELS, randomInt(1, 2));
        for (const level of tutorLevels) {
          await client.query(`
            INSERT INTO public.tutor_categories (tutor_id, level, category, subject)
            VALUES ($1, $2, 'Academic', $3)
            ON CONFLICT DO NOTHING
          `, [id, level, subject]);
        }
      }

      if (i % 20 === 0) {
        console.log(`Generated and inserted ${i}/100 mock tutors...`);
      }
    }

    console.log('Seeding complete! 100 highly diversified mock tutors are now live.');

  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await client.end();
  }
}

seed();
