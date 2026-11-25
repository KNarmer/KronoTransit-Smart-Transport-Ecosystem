const figures = [
  ['$75–95', 'per pod, per month', 'Device-as-a-service from the lab’s operating budget, so no capital committee.'],
  ['≈ 2 mo', 'hardware payback', 'At a production cost near $135 per pod.'],
  ['$3–4.50', 'per cartridge', 'For high-value specimens: oncology tissue, frozen sections, trial and biobank samples.'],
  ['≈ $50M', 'per year, US, bottom-up', '1,000 hospitals with surgical pathology × 20 pods, plus tissue cartridges.'],
];

export default function Business() {
  return (
    <section className="section" id="plan">
      <div className="sec-head head-split">
        <h2 className="h-xl">Start with the tubes.</h2>
        <p className="lede">
          The first customer doesn’t need cartridges or hospital IT. Pneumatic-tube forces change route by route and after every repair, so labs need to re-validate them. A few pods per hospital, run as a recurring audit, is the fastest path to a paying lab.
        </p>
      </div>
      <div className="figures">
        {figures.map(([n, k, p]) => (
          <article key={k} className="figure">
            <div className="figure-n">{n}</div>
            <div className="figure-k">{k}</div>
            <p>{p}</p>
          </article>
        ))}
      </div>
      <p className="fine figures-note">Specimen transport containers are FDA Class I and 510(k)-exempt. Software that flags a specimen may need its own determination, which we’ll get in writing.</p>
    </section>
  );
}
