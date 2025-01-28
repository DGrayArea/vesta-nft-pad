import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const question1 = await prisma.questionary.create({
    data: {
      questionHeader: "loss of money",
      question:
        "Which of the following statements best describes the inherent risk of investing in startups or new business models?",
      answers: JSON.stringify({
        a: " All investments guarantee a return on capital.",
        b: "Business models may fail or risk running out of financing before creating returns.",
        c: "Investing in startups is a guaranteed way to double your money.",
        d: "Startups always provide dividends to their investors.",
      }),
    },
  });

  const question2 = await prisma.questionary.create({
    data: {
      questionHeader: "liquidity",
      question: "What does illiquidity in investments mean?",
      answers: JSON.stringify({
        a: "You can easily sell your investment at any time.",
        b: "The investment will always increase in value.",
        c: "You might not be able to sell your investment quickly or at a desired price.",
        d: "The investment is always in liquid form, like cash.",
      }),
    },
  });

  const question3 = await prisma.questionary.create({
    data: {
      questionHeader: "rare returns",
      question: "How often do startup investments provide substantial returns?",
      answers: JSON.stringify({
        a: "Almost always, as startups are guaranteed to succeed.",
        b: "Rarely, as many startups fail and only a few succeed.",
        c: "Returns are guaranteed after a year of investment.",
        d: "Startups provide monthly dividends.",
      }),
    },
  });

  const question4 = await prisma.questionary.create({
    data: {
      questionHeader: "dilution",
      question: `What can happen if a company you've invested in raises more capital at a valuation lower than the previous round (a "down round")?`,
      answers: JSON.stringify({
        a: "Your shares will always increase in value.",
        b: "The company will return your initial investment.",
        c: "Your stake in the company can get diluted, decreasing its value.",
        d: "Down rounds are illegal and cannot happen.",
      }),
    },
  });

  const question5 = await prisma.questionary.create({
    data: {
      questionHeader: "lack of control",
      question:
        "As a minority shareholder in a startup, what level of control can you expect over the company's daily operations?",
      answers: JSON.stringify({
        a: "Your shares will always increase in value.",
        b: "The company will return your initial investment.",
        c: "Your stake in the company can get diluted, decreasing its value.",
        d: "Down rounds are illegal and cannot happen.",
      }),
    },
  });

  const question6 = await prisma.questionary.create({
    data: {
      questionHeader: "risk of fraud",
      question:
        "What is a potential risk when investing in companies without thorough due diligence?",
      answers: JSON.stringify({
        a: "Guaranteed profits within a month.",
        b: "Risk of the company being fraudulent or misrepresenting information.",
        c: "Receiving company merchandise as a thank-you gift.",
        d: "Getting a position on the company's board.",
      }),
    },
  });

  console.log({
    question1,
    question2,
    question3,
    question4,
    question5,
    question6,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
