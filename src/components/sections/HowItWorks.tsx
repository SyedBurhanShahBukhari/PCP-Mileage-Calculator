import { Icon, type IconName } from '../ui/Icon';

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'calendar',
    title: 'Add your agreement',
    body: 'Enter your allowance, contract length and the odometer reading when the agreement started.',
  },
  {
    icon: 'gauge',
    title: 'Add your current mileage',
    body: "We'll compare it with where your mileage would ideally be today.",
  },
  {
    icon: 'chart',
    title: 'See your forecast',
    body: 'Get your projected mileage, a safe monthly driving target and an estimated excess charge.',
  },
];

export function HowItWorks() {
  return (
    <section className="section" id="how-it-works" aria-labelledby="how-it-works-title">
      <div className="container">
        <h2 className="section-heading" id="how-it-works-title">
          How the PCP mileage calculator works
        </h2>
        <ol className="steps">
          {STEPS.map((step, index) => (
            <li className="step" key={step.title}>
              <span className="step__index" aria-hidden="true">
                {index + 1}
              </span>
              <span className="step__icon" aria-hidden="true">
                <Icon name={step.icon} size={22} />
              </span>
              <h3 className="step__title">{step.title}</h3>
              <p className="step__body">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
