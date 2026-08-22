const BASIC_COMPONENT = "Basic Salary";

const DEFAULT_COMPONENTS = [
  { name: BASIC_COMPONENT, computationType: "percentOfWage", value: 50 },
  { name: "House Rent Allowance", computationType: "percentOfBasic", value: 50 },
  { name: "Standard Allowance", computationType: "fixed", value: 4167 },
  { name: "Performance Bonus", computationType: "percentOfBasic", value: 8.33 },
  { name: "Leave Travel Allowance", computationType: "percentOfBasic", value: 8.33 },
  { name: "Fixed Allowance", computationType: "balance", value: 0 },
];

function round2(value) {
  return Math.round(value * 100) / 100;
}

function resolveBasic(wage, components) {
  const basic = components.find((component) => component.name === BASIC_COMPONENT) || components[0];

  if (!basic) {
    return 0;
  }

  const value = Number(basic.value) || 0;

  return basic.computationType === "fixed" ? round2(value) : round2((wage * value) / 100);
}

function computeSalary(monthlyWage, components = DEFAULT_COMPONENTS, config = {}) {
  const wage = Math.max(0, Number(monthlyWage) || 0);
  const pfPercent = config.pfPercent === undefined ? 12 : Number(config.pfPercent);
  const professionalTax =
    config.professionalTax === undefined ? 200 : Number(config.professionalTax);

  const basic = resolveBasic(wage, components);

  const computed = components.map((component) => {
    const value = Number(component.value) || 0;
    let amount = 0;

    if (component.computationType === "percentOfWage") {
      amount = (wage * value) / 100;
    } else if (component.computationType === "percentOfBasic") {
      amount = (basic * value) / 100;
    } else if (component.computationType === "fixed") {
      amount = value;
    }

    return {
      name: component.name,
      computationType: component.computationType,
      value,
      amount: round2(amount),
    };
  });

  const balanceIndex = computed.findIndex(
    (component) => component.computationType === "balance"
  );

  if (balanceIndex !== -1) {
    const allocated = computed.reduce(
      (total, component, index) => (index === balanceIndex ? total : total + component.amount),
      0
    );

    computed[balanceIndex].amount = round2(Math.max(0, wage - allocated));
  }

  const componentTotal = round2(
    computed.reduce((total, component) => total + component.amount, 0)
  );
  const pfAmount = round2((basic * pfPercent) / 100);

  return {
    monthlyWage: round2(wage),
    yearlyWage: round2(wage * 12),
    basic,
    components: computed,
    componentTotal,
    pf: {
      employeePercent: pfPercent,
      employerPercent: pfPercent,
      employeeAmount: pfAmount,
      employerAmount: pfAmount,
    },
    professionalTax,
    grossMonthly: componentTotal,
    netMonthly: round2(componentTotal - pfAmount - professionalTax),
  };
}

module.exports = { computeSalary, DEFAULT_COMPONENTS, BASIC_COMPONENT };
