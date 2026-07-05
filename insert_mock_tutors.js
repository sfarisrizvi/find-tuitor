const fs = require('fs');
const { Client } = require('pg');
const crypto = require('crypto');

const DATABASE_URL = 'postgresql://postgres.qlhcavfyllfcwifxbtbu:2Xy8IkpeFkVOE6qf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const CITIES = ['Islamabad', 'Lahore', 'Karachi', 'Rawalpindi', 'Peshawar'];
const AREAS = {
  'Islamabad': ['Sector G-11', 'Sector F-7', 'DHA Phase 2', 'Bahria Town', 'I-8'],
  'Lahore': ['DHA Phase 5', 'Johar Town', 'Gulberg', 'Model Town', 'Wapda Town'],
  'Karachi': ['Clifton', 'DHA Phase 6', 'Gulshan-e-Iqbal', 'North Nazimabad', 'Tariq Road'],
  'Rawalpindi': ['Saddar', 'Bahria Town Phase 7', 'Westridge', 'Satellite Town'],
  'Peshawar': ['Hayatabad', 'University Town', 'Defence Colony']
};
const GENDERS = ['Male', 'Female'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer', 'Urdu'];
const LEVELS = ['Class 9', 'Class 10', 'O Levels', 'A Levels', 'FSc Pre-Engineering', 'FSc Pre-Medical'];
const LANGUAGES = ['English', 'Urdu', 'Punjabi', 'Pashto'];
const MODES = ['online', 'home_tuition', 'tutor_home'];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomItems = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);

async function seed() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected. Starting seed...');

    for (let i = 0; i < 100; i++) {
      const id = crypto.randomUUID();
      const city = randomItem(CITIES);
      const area = randomItem(AREAS[city]);
      const gender = randomItem(GENDERS);
      const name = gender === 'Male' ? `Mr. Tutor ${i}` : `Miss Tutor ${i}`;
      
      const hourlyRate = randomInt(1, 10) * 500;
      const experience = randomInt(1, 15);
      const isVerified = Math.random() > 0.3; // 70% verified
      const isImmediate = Math.random() > 0.5; // 50% immediate
      const rating = isVerified ? randomFloat(3.5, 5.0) : randomFloat(0.0, 4.0);
      const reviewsCount = randomInt(0, 100);
      
      const myModes = randomItems(MODES, randomInt(1, 3));
      const myLanguages = randomItems(LANGUAGES, randomInt(1, 3));
      
      // Insert profile
      await client.query(`
        INSERT INTO public.profiles 
        (id, role, full_name, city, area, gender, hourly_rate, experience_years, verified, immediate_hiring, rating, reviews_count, teaching_modes, languages, bio)
        VALUES ($1, 'tutor', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        id, name, city, area, gender, hourlyRate, experience, isVerified, isImmediate, rating, reviewsCount, 
        myModes, myLanguages, `Experienced tutor offering tailored sessions.`
      ]);

      // Insert categories/subjects
      const mySubjects = randomItems(SUBJECTS, randomInt(1, 4));
      for (const subj of mySubjects) {
        const myLevels = randomItems(LEVELS, randomInt(1, 3));
        for (const lvl of myLevels) {
          await client.query(`
            INSERT INTO public.tutor_categories (tutor_id, level, category, subject)
            VALUES ($1, $2, 'Academic', $3)
            ON CONFLICT DO NOTHING
          `, [id, lvl, subj]);
        }
      }
    }

    console.log('Successfully inserted 100 tutors and categories!');
    
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await client.end();
  }
}

seed();
