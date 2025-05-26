// data/physics_constants.ts

export interface PhysicsConstant {
    value: number | string;
    unit: string;
    symbol: string;
    description: string;
  }
  
  export const physicsConstantsData: Record<string, PhysicsConstant> = {
    "speed of light": {
      value: 299792458,
      unit: "m/s",
      symbol: "c",
      description: "The speed at which light travels in a vacuum.",
    },
    "planck constant": {
      value: 6.62607015e-34,
      unit: "J·s",
      symbol: "h",
      description: "A fundamental physical constant relating the energy of a photon to its frequency.",
    },
    "gravitational constant": {
      value: 6.67430e-11,
      unit: "N·m²/kg²",
      symbol: "G",
      description: "An empirical physical constant involved in the calculation of gravitational effects.",
    },
    "electron mass": {
      value: 9.1093837e-31,
      unit: "kg",
      symbol: "m_e",
      description: "The rest mass of an electron."
    },
    "avogadro number": {
      value: 6.02214076e23,
      unit: "mol⁻¹",
      symbol: "N_A",
      description: "The number of constituent particles per mole of a given substance."
    }
  };