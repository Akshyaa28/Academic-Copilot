import React from "react";

const features = [
  {
    title: "Syllabus analysis",
    desc: "Subjects → topics → subtopics, in the right learning order.",
  },
  {
    title: "Personalised plan",
    desc: "Daily focus & revision slots that fit your schedule.",
  },
  {
    title: "Curated resources",
    desc: "Videos, notes & practice — basic to advanced, no noise.",
  },
  {
    title: "Quizzes + report card",
    desc: "MCQs and concept questions with scored feedback.",
  },
  {
    title: "Doubt solving",
    desc: "Step-by-step answers, grounded in your syllabus.",
  },
  {
    title: "Personalised growth",
    desc: "Improves with you — weak topics get extra love.",
  },
];

function Features() {
  return (
    <section className="features" id="features">
      <div className="grid">
        {features.map((f, i) => (
          <div className="card" key={i}>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;