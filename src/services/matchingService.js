/**
 * NitiYog Scheme Matching Engine
 */

function matchSchemesForUser(
  userProfile,
  schemes
) {

  if (!userProfile) {
    return [];
  }


  return schemes
    .map(scheme => {

      let matches = true;

      const reasons = [];


      // =========================
      // AGE
      // =========================

      if (
        scheme.minAge !== null &&
        scheme.minAge !== undefined &&
        userProfile.age !== null &&
        userProfile.age < scheme.minAge
      ) {

        matches = false;

        reasons.push(
          `Minimum age is ${scheme.minAge}`
        );
      }


      if (
        scheme.maxAge !== null &&
        scheme.maxAge !== undefined &&
        userProfile.age !== null &&
        userProfile.age > scheme.maxAge
      ) {

        matches = false;

        reasons.push(
          `Maximum age is ${scheme.maxAge}`
        );
      }


      // =========================
      // INCOME
      // =========================

      if (
        scheme.maxIncome !== null &&
        scheme.maxIncome !== undefined &&
        userProfile.annualIncome !== null &&
        userProfile.annualIncome >
          scheme.maxIncome
      ) {

        matches = false;

        reasons.push(
          `Income exceeds ₹${scheme.maxIncome.toLocaleString()}`
        );
      }


      // =========================
      // TURNOVER
      // =========================

      if (
        scheme.maxTurnover !== null &&
        scheme.maxTurnover !== undefined &&
        userProfile.turnover !== null &&
        userProfile.turnover >
          scheme.maxTurnover
      ) {

        matches = false;

        reasons.push(
          `Turnover exceeds ₹${scheme.maxTurnover.toLocaleString()}`
        );
      }


      // =========================
      // CATEGORY
      // =========================

      const categories =
        scheme.targetCategory || ['ALL'];

      if (
        !categories.includes('ALL') &&
        userProfile.category &&
        !categories.includes(
          userProfile.category
        )
      ) {

        matches = false;

        reasons.push(
          `Eligible categories: ${categories.join(', ')}`
        );
      }


      // =========================
      // GENDER
      // =========================

      if (
        scheme.targetGender &&
        scheme.targetGender !== 'ALL' &&
        userProfile.gender &&
        userProfile.gender !==
          scheme.targetGender
      ) {

        matches = false;

        reasons.push(
          `Eligible gender: ${scheme.targetGender}`
        );
      }


      // =========================
      // STATE
      // =========================

      const states =
        scheme.targetState || ['ALL'];

      if (
        !states.includes('ALL') &&
        userProfile.state
      ) {

        const stateMatches =
          states.some(
            state =>
              state.toLowerCase() ===
              userProfile.state.toLowerCase()
          );

        if (!stateMatches) {

          matches = false;

          reasons.push(
            `Eligible states: ${states.join(', ')}`
          );
        }
      }


      // =========================
      // ENTERPRISE TYPE
      // =========================

      const enterpriseTypes =
        scheme.targetEnterpriseType ||
        ['ALL'];

      if (
        !enterpriseTypes.includes('ALL') &&
        userProfile.enterpriseType &&
        !enterpriseTypes.includes(
          userProfile.enterpriseType
        )
      ) {

        matches = false;

        reasons.push(
          `Eligible enterprise types: ${enterpriseTypes.join(', ')}`
        );
      }


      return {
        scheme,
        isEligible: matches,
        reasons
      };

    })

    .filter(
      result => result.isEligible
    );
}


module.exports = {
  matchSchemesForUser
};
