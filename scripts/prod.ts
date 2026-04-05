import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema";

const sql = neon(process.env.DATABASE_URL);

const db = drizzle(sql, { schema });

const main = async () => {
  try {
    console.log("Seeding database");

    // Delete all existing data
   await Promise.all([
  db.delete(schema.challengeProgress),
  db.delete(schema.challengeOptions),
  db.delete(schema.challenges),
  db.delete(schema.lessons),
  db.delete(schema.units),
  db.delete(schema.courses),
  db.delete(schema.userProgress),
  db.delete(schema.userSubscription),
]);

    // Insert courses
    const courses = await db
      .insert(schema.courses)
      .values([{ title: "Indian Sign Language", imageSrc: "/isl.svg" }])
      .returning();

    // For each course, insert units
    for (const course of courses) {
      const units = await db
        .insert(schema.units)
        .values([
          {
            courseId: course.id,
            title: "Unit 1",
            description: `Learn the basics of ${course.title}`,
            order: 1,
          },
          {
            courseId: course.id,
            title: "Unit 2",
            description: `Learn intermediate ${course.title}`,
            order: 2,
          },
        ])
        .returning();

      // For each unit, insert lessons
      for (const unit of units) {
        const lessons = await db
          .insert(schema.lessons)
          .values([
           { unitId: unit.id, title: "Basics", order: 1 },
           { unitId: unit.id, title: "People", order: 2 },
           { unitId: unit.id, title: "Actions", order: 3 },
           { unitId: unit.id, title: "Objects", order: 4 },
           { unitId: unit.id, title: "Expressions", order: 5 },
          ])
          .returning();

        // For each lesson, insert challenges
        for (const lesson of lessons) {
           if (lesson.order === 1) {
          const challenges = await db
            .insert(schema.challenges)
            .values([
              {
                lessonId: lesson.id,
                type: "SELECT",
               question: "What does this sign mean?",
                 imageSrc: "/signs/hello.gif",
                order: 1,
              },
            /*   {
                lessonId: lesson.id,
                type: "SELECT",
                 question: "Try to guess what this sign means?",
                   imageSrc: "/signs/indian.gif",
                order: 2,
              },
              {
                lessonId: lesson.id,
                type: "SELECT",
               question: "What do you think this sign means?",
                 imageSrc: "/signs/bye.gif",
                order: 3,
              },
              {
                lessonId: lesson.id,
                type: "ASSIST",
                question: "How should you get the attention of a deaf person from behind?",
                order: 4,
              }, */
           
             
            ])
            .returning();

          // For each challenge, insert challenge options
          for (const challenge of challenges) {
            if (challenge.order === 1) {
              await db.insert(schema.challengeOptions).values([
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "Goodbye",
               
                
                },
                {
                  challengeId: challenge.id,
                  correct: true,
                  text: "Hello",
          
                 
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "Welcome",
        
            
                },
              ]);
            }

            if (challenge.order === 2) {
              await db.insert(schema.challengeOptions).values([
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "Marriage"
                
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "Bindhi",
                
               
                },
                {
                  challengeId: challenge.id,
                  correct: true,
                  text: "India",
                
                
                },
              ]);
            }

            if (challenge.order === 3) {
              await db.insert(schema.challengeOptions).values([
                {
                  challengeId: challenge.id,
                  correct: true,
                  text: "Goodbye",
         
                 
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "hello",
                
                
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "Good night",
                
              
                },
              ]);
            }

            if (challenge.order === 4) {
  await db.insert(schema.challengeOptions).values([
    {
      challengeId: challenge.id,
      correct: false,
      text: "Throw something at them",
      imageSrc: "/signs/throw.gif",
    },
    {
      challengeId: challenge.id,
      correct: true,
      text: "Tap their shoulder gently",
      imageSrc: "/signs/tap.gif",
    },
    {
      challengeId: challenge.id,
      correct: false,
      text: "Make Loud noise",
      imageSrc: "/signs/loud-clap.gif",
    },
  ]);
}
          }
        }
     if (lesson.order === 2) {

const challenges = await db.insert(schema.challenges).values([
{
lessonId: lesson.id,
type: "SELECT",
question: "Which number matches this sign?",
imageSrc: "/gestures/eight.png",
order: 1,
},
{
lessonId: lesson.id,
type: "GESTURE",
question: "Show the ISL gesture for the Number 8",
order: 2,
},
 {
    lessonId: lesson.id,
    type: "GESTURE",
    question: "Show the ISL gesture for the Number 0",
    order: 3, // 👈 IMPORTANT
  }
]).returning();

await db.insert(schema.challengeOptions).values([
{ challengeId: challenges[0].id, text: "6", correct: false },
{ challengeId: challenges[0].id, text: "8", correct: true },
{ challengeId: challenges[0].id, text: "10", correct: false },
]);

await db.insert(schema.challengeOptions).values([
{
challengeId: challenges[1].id,
text: "8",
correct: true
}
]);

await db.insert(schema.challengeOptions).values([
  {
    challengeId: challenges[2].id, 
    text: "0",
    correct: true
  }
]);

}
      }
    }
  }
    console.log("Database seeded successfully");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to seed database");
  }
};

void main();
