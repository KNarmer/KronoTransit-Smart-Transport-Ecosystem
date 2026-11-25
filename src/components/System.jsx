const steps = [
  ['Seal', 'The specimen goes into a Verity cartridge. The pod reads its NFC tag and starts the log.'],
  ['Travel', 'Couriers, hallways, tube systems, vans. The pod keeps recording and scoring with no signal.'],
  ['Dock', 'On the KronoDock at the lab, the pod hands over a signed log and a standard FHIR record. Then it charges.'],
];

export default function System() {
  return (
    <section className="section" id="system">
      <div className="sec-head head-center">
        <h2 className="h-xl">Two parts.<br />One clicks into the other.</h2>
        <p className="lede">Electronics in every vial would be far too expensive. So the expensive part is reusable, and the part that touches the sample is nearly free.</p>
      </div>

      <div className="duo">
        <article className="block">
          <div className="block-top"><span className="chip">Reusable</span><span className="mono">190 × 130 × 160 mm</span></div>
          <h3>KronoTransit pod</h3>
          <p>A sealed, insulated carrier with every sensor, a Nordic nRF5340 processor, a rechargeable battery and a status light. It goes back into service after every trip.</p>
          <ul className="specs">
            <li><span>Insulation</span>XPS foam + cold packs</li>
            <li><span>Mounting</span>Shock-damped cradle</li>
            <li><span>Build cost at scale</span>≈ $135</li>
          </ul>
        </article>
        <article className="block block-cart">
          <div className="block-top"><span className="chip chip-lime">Consumable</span><span className="mono">≈ $0.85 to make</span></div>
          <h3>Verity cartridge</h3>
          <p>A clear vial with a keyed collar, an NFC tag and a colour-changing indicator. The pod reads it through the wall, so nothing is ever opened in transit.</p>
          <ul className="specs">
            <li><span>Holds</span>Blood, tissue, biobank samples</li>
            <li><span>Identity</span>NFC tag, serialised</li>
            <li><span>Indicator</span>Dry-chemistry colour disc</li>
          </ul>
        </article>
      </div>

      <ol className="journey">
        {steps.map(([h, p], i) => (
          <li key={h}>
            <span className="journey-n">{i + 1}</span>
            <div><h4>{h}</h4><p>{p}</p></div>
          </li>
        ))}
      </ol>
    </section>
  );
}
