const cards = [
  ['Damage you can’t see', 'Heat, cold and hard knocks can burst blood cells or degrade tissue. A sample that sat in a hot car looks exactly like one that didn’t.'],
  ['Every tube route is different', 'One lab found a single pneumatic-tube route delivered 70% more shock than any other. Studies say each system needs its own validation.'],
  ['So labs guess', 'Without a record, a lab either runs a compromised sample or rejects it and asks the patient for another draw.'],
];

export default function Problem() {
  return (
    <section className="section" id="problem">
      <div className="problem-head">
        <div className="big-stat">46–68%</div>
        <div>
          <h2 className="h-xl">of lab errors happen <em>before</em> the sample is analysed.</h2>
          <p className="lede">Collection, labelling, handling and transport. Hospitals invest in analyzers and software; the trip in between is still a paper label and a courier.</p>
        </div>
      </div>
      <div className="rows">
        {cards.map(([h, p], i) => (
          <article key={h} className="row">
            <span className="panel-n">0{i + 1}</span>
            <h3>{h}</h3>
            <p>{p}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
