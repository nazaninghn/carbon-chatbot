/**
 * CarbonIQ MCP Server
 * Exposes carbon calculation tools via Model Context Protocol
 */
const logger = require('../utils/logger');

// Emission factor database (DEFRA 2023 subset)
const EMISSION_FACTORS = {
  // Stationary combustion (kg CO2e per unit)
  stationary: {
    natural_gas: { factor: 0.2023, unit: 'kWh', source: 'DEFRA 2023' },
    diesel: { factor: 2.5131, unit: 'litre', source: 'DEFRA 2023' },
    lpg: { factor: 1.5226, unit: 'litre', source: 'DEFRA 2023' },
    fuel_oil: { factor: 2.9600, unit: 'litre', source: 'DEFRA 2023' },
    coal: { factor: 2449.0, unit: 'tonne', source: 'DEFRA 2023' },
    biomass_wood: { factor: 0.01539, unit: 'kWh', source: 'DEFRA 2023' },
  },
  // Mobile combustion (kg CO2e per km or litre)
  mobile: {
    car_small_petrol: { factor: 0.14895, unit: 'km', source: 'DEFRA 2023' },
    car_medium_petrol: { factor: 0.17888, unit: 'km', source: 'DEFRA 2023' },
    car_large_petrol: { factor: 0.22228, unit: 'km', source: 'DEFRA 2023' },
    car_small_diesel: { factor: 0.13879, unit: 'km', source: 'DEFRA 2023' },
    car_medium_diesel: { factor: 0.16637, unit: 'km', source: 'DEFRA 2023' },
    car_large_diesel: { factor: 0.20904, unit: 'km', source: 'DEFRA 2023' },
    van_diesel: { factor: 0.24013, unit: 'km', source: 'DEFRA 2023' },
    hgv_rigid_7_5t: { factor: 0.48819, unit: 'km', source: 'DEFRA 2023' },
    hgv_artic_33t: { factor: 0.90283, unit: 'km', source: 'DEFRA 2023' },
    diesel_litre: { factor: 2.5131, unit: 'litre', source: 'DEFRA 2023' },
    petrol_litre: { factor: 2.1634, unit: 'litre', source: 'DEFRA 2023' },
  },
  // Electricity grid factors (kg CO2e per kWh)
  electricity: {
    TR: { factor: 0.4312, source: 'DEFRA/TÜİK 2023' },
    GB: { factor: 0.2072, source: 'DEFRA 2023' },
    DE: { factor: 0.3640, source: 'IEA 2023' },
    FR: { factor: 0.0561, source: 'IEA 2023' },
    US: { factor: 0.3710, source: 'EPA 2023' },
    DEFAULT: { factor: 0.4500, source: 'IPCC AR6 Global Average' },
  },
  // Refrigerant GWP values (IPCC AR6)
  refrigerants: {
    'R-410A': { gwp: 2088, source: 'IPCC AR6' },
    'R-32': { gwp: 675, source: 'IPCC AR6' },
    'R-22': { gwp: 1810, source: 'IPCC AR6' },
    'R-134a': { gwp: 1430, source: 'IPCC AR6' },
    'R-404A': { gwp: 3922, source: 'IPCC AR6' },
    'R-1234yf': { gwp: 4, source: 'IPCC AR6' },
    'SF6': { gwp: 23500, source: 'IPCC AR6' },
  },
};

// MCP Tool definitions
const TOOLS = [
  {
    name: 'calculate_stationary_combustion',
    description: 'Calculate Scope 1 emissions from stationary combustion (boilers, generators, furnaces)',
    inputSchema: {
      type: 'object',
      properties: {
        fuel_type: { type: 'string', enum: Object.keys(EMISSION_FACTORS.stationary) },
        quantity: { type: 'number', description: 'Fuel consumption quantity' },
        unit: { type: 'string', description: 'Unit of measurement' },
      },
      required: ['fuel_type', 'quantity'],
    },
  },
  {
    name: 'calculate_mobile_combustion',
    description: 'Calculate Scope 1 emissions from mobile sources (vehicles, machinery)',
    inputSchema: {
      type: 'object',
      properties: {
        vehicle_type: { type: 'string', enum: Object.keys(EMISSION_FACTORS.mobile) },
        quantity: { type: 'number', description: 'Distance (km) or fuel (litres)' },
        count: { type: 'number', description: 'Number of vehicles', default: 1 },
      },
      required: ['vehicle_type', 'quantity'],
    },
  },
  {
    name: 'calculate_electricity',
    description: 'Calculate Scope 2 emissions from purchased electricity',
    inputSchema: {
      type: 'object',
      properties: {
        kwh: { type: 'number', description: 'Annual electricity consumption in kWh' },
        country: { type: 'string', description: 'ISO 3166-1 alpha-2 country code', default: 'TR' },
      },
      required: ['kwh'],
    },
  },
  {
    name: 'calculate_fugitive_emissions',
    description: 'Calculate Scope 1 fugitive emissions from refrigerant leaks',
    inputSchema: {
      type: 'object',
      properties: {
        refrigerant: { type: 'string', enum: Object.keys(EMISSION_FACTORS.refrigerants) },
        refill_kg: { type: 'number', description: 'Annual refill quantity in kg' },
      },
      required: ['refrigerant', 'refill_kg'],
    },
  },
  {
    name: 'get_emission_factor',
    description: 'Get emission factor for a specific fuel, vehicle, or energy type',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['stationary', 'mobile', 'electricity', 'refrigerants'] },
        type: { type: 'string', description: 'Specific type within category' },
      },
      required: ['category', 'type'],
    },
  },
  {
    name: 'get_question_guidance',
    description: 'Get guidance for a specific CarbonIQ question',
    inputSchema: {
      type: 'object',
      properties: {
        question_id: { type: 'string', description: 'Question ID (e.g., A1, B1, 3A-1)' },
      },
      required: ['question_id'],
    },
  },
];

// Tool execution handlers
function executeCalculateStationary({ fuel_type, quantity }) {
  const ef = EMISSION_FACTORS.stationary[fuel_type];
  if (!ef) return { error: `Unknown fuel type: ${fuel_type}` };

  const emissions_kg = quantity * ef.factor;
  const emissions_tco2e = emissions_kg / 1000;

  return {
    fuel_type,
    quantity,
    unit: ef.unit,
    emission_factor: ef.factor,
    ef_unit: `kg CO₂e/${ef.unit}`,
    ef_source: ef.source,
    emissions_kg_co2e: Math.round(emissions_kg * 100) / 100,
    emissions_tco2e: Math.round(emissions_tco2e * 1000) / 1000,
    scope: 'Scope 1 - Stationary Combustion',
  };
}

function executeCalculateMobile({ vehicle_type, quantity, count = 1 }) {
  const ef = EMISSION_FACTORS.mobile[vehicle_type];
  if (!ef) return { error: `Unknown vehicle type: ${vehicle_type}` };

  const emissions_kg = quantity * ef.factor * count;
  const emissions_tco2e = emissions_kg / 1000;

  return {
    vehicle_type,
    quantity,
    count,
    unit: ef.unit,
    emission_factor: ef.factor,
    ef_unit: `kg CO₂e/${ef.unit}`,
    ef_source: ef.source,
    emissions_kg_co2e: Math.round(emissions_kg * 100) / 100,
    emissions_tco2e: Math.round(emissions_tco2e * 1000) / 1000,
    scope: 'Scope 1 - Mobile Combustion',
  };
}

function executeCalculateElectricity({ kwh, country = 'TR' }) {
  const ef = EMISSION_FACTORS.electricity[country] || EMISSION_FACTORS.electricity.DEFAULT;

  const emissions_kg = kwh * ef.factor;
  const emissions_tco2e = emissions_kg / 1000;

  return {
    kwh,
    country,
    emission_factor: ef.factor,
    ef_unit: 'kg CO₂e/kWh',
    ef_source: ef.source,
    methodology: 'Location-based',
    emissions_kg_co2e: Math.round(emissions_kg * 100) / 100,
    emissions_tco2e: Math.round(emissions_tco2e * 1000) / 1000,
    scope: 'Scope 2 - Purchased Electricity',
  };
}

function executeCalculateFugitive({ refrigerant, refill_kg }) {
  const ref = EMISSION_FACTORS.refrigerants[refrigerant];
  if (!ref) return { error: `Unknown refrigerant: ${refrigerant}` };

  const emissions_kg = refill_kg * ref.gwp;
  const emissions_tco2e = emissions_kg / 1000;

  return {
    refrigerant,
    refill_kg,
    gwp: ref.gwp,
    gwp_source: ref.source,
    emissions_kg_co2e: Math.round(emissions_kg * 100) / 100,
    emissions_tco2e: Math.round(emissions_tco2e * 1000) / 1000,
    scope: 'Scope 1 - Fugitive Emissions',
    note: emissions_tco2e > 10 ? '⚠ High emission source - verify refill data' : null,
  };
}

function executeGetEmissionFactor({ category, type }) {
  const categoryData = EMISSION_FACTORS[category];
  if (!categoryData) return { error: `Unknown category: ${category}` };

  const factor = categoryData[type];
  if (!factor) return { error: `Unknown type: ${type} in category ${category}`, available: Object.keys(categoryData) };

  return { category, type, ...factor };
}

function executeGetQuestionGuidance({ question_id }) {
  // This would normally query the knowledge base
  return {
    question_id,
    message: `Guidance for question ${question_id} - use the knowledge base for detailed information.`,
  };
}

// Start MCP Server
async function startMCPServer() {
  try {
    // MCP SDK integration - only load if available
    let Server, StdioServerTransport;
    try {
      Server = require('@modelcontextprotocol/sdk/server/index.js').Server;
      StdioServerTransport = require('@modelcontextprotocol/sdk/server/stdio.js').StdioServerTransport;
    } catch {
      logger.info('MCP SDK not available, running calculation tools in standalone mode');
      return;
    }

    const server = new Server(
      { name: 'carboniq-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    // List tools
    server.setRequestHandler('tools/list', async () => ({
      tools: TOOLS,
    }));

    // Execute tool
    server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      let result;
      switch (name) {
        case 'calculate_stationary_combustion':
          result = executeCalculateStationary(args);
          break;
        case 'calculate_mobile_combustion':
          result = executeCalculateMobile(args);
          break;
        case 'calculate_electricity':
          result = executeCalculateElectricity(args);
          break;
        case 'calculate_fugitive_emissions':
          result = executeCalculateFugitive(args);
          break;
        case 'get_emission_factor':
          result = executeGetEmissionFactor(args);
          break;
        case 'get_question_guidance':
          result = executeGetQuestionGuidance(args);
          break;
        default:
          result = { error: `Unknown tool: ${name}` };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    });

    // For standalone MCP mode, use stdio transport
    if (process.env.MCP_STANDALONE === 'true') {
      const transport = new StdioServerTransport();
      await server.connect(transport);
    }

    logger.info('CarbonIQ MCP Server initialized with calculation tools');
    return server;
  } catch (error) {
    logger.warn('MCP Server initialization skipped:', error.message);
  }
}

// Export for use in calculations within the app
module.exports = {
  startMCPServer,
  EMISSION_FACTORS,
  calculateStationary: executeCalculateStationary,
  calculateMobile: executeCalculateMobile,
  calculateElectricity: executeCalculateElectricity,
  calculateFugitive: executeCalculateFugitive,
};
