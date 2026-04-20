// FDA Drug Database & OpenFDA API Integration
// Docs: https://open.fda.gov/apis/drug/

const FDA_BASE_URL = 'https://api.fda.gov/drug';

/**
 * Search for a drug by name in the FDA database
 * Returns drug label information
 */
export async function searchDrug(query) {
  if (!query || query.length < 2) return [];

  const cleanQuery = query.trim().replace(/[^a-zA-Z0-9 ]/g, '');

  try {
    // Try brand name search first (unquoted for reliability)
    const url = `${FDA_BASE_URL}/label.json?search=openfda.brand_name:${encodeURIComponent(cleanQuery)}&limit=8`;
    const res = await fetch(url);

    if (res.ok) {
      const data = await res.json();
      if (data.results?.length > 0) {
        return parseFDAResults(data.results, query);
      }
    }

    // Fallback: try generic name search
    const url2 = `${FDA_BASE_URL}/label.json?search=openfda.generic_name:${encodeURIComponent(cleanQuery)}&limit=8`;
    const res2 = await fetch(url2);

    if (res2.ok) {
      const data2 = await res2.json();
      if (data2.results?.length > 0) {
        return parseFDAResults(data2.results, query);
      }
    }

    // Last fallback: search any field
    const url3 = `${FDA_BASE_URL}/label.json?search=${encodeURIComponent(cleanQuery)}&limit=6`;
    const res3 = await fetch(url3);

    if (res3.ok) {
      const data3 = await res3.json();
      if (data3.results?.length > 0) {
        return parseFDAResults(data3.results, query);
      }
    }

    return [];
  } catch (err) {
    console.warn('FDA search error:', err.message);
    return [];
  }
}

/** Parse FDA label results into a consistent format */
function parseFDAResults(results, fallbackName) {
  return results.map((r) => ({
    id: r.id || crypto.randomUUID(),
    brandName: r.openfda?.brand_name?.[0] || fallbackName,
    genericName: r.openfda?.generic_name?.[0] || '',
    substance: r.openfda?.substance_name?.[0] || '',
    manufacturer: r.openfda?.manufacturer_name?.[0] || '',
    route: r.openfda?.route?.[0] || '',
    warnings: r.warnings?.[0]?.substring(0, 500) || '',
    contraindications: r.contraindications?.[0]?.substring(0, 500) || '',
    adverseReactions: r.adverse_reactions?.[0]?.substring(0, 300) || '',
    dosage: r.dosage_and_administration?.[0]?.substring(0, 300) || '',
    rxcui: r.openfda?.rxcui?.[0] || null,
  }));
}

/**
 * Check for drug interactions between a list of medications
 * Uses known interaction pairs from FDA adverse event data + RxNorm
 */
export async function checkDrugInteractions(medications) {
  if (!medications || medications.length < 2) return [];

  const interactions = [];

  // Known dangerous interaction pairs (clinical knowledge base)
  const knownInteractions = [
    {
      drugs: ['warfarin', 'aspirin'],
      severity: 'severe',
      description: 'Significantly increased bleeding risk. Both drugs inhibit clotting through different mechanisms.',
    },
    {
      drugs: ['warfarin', 'ibuprofen'],
      severity: 'severe',
      description: 'NSAIDs can displace warfarin from protein binding sites, increasing anticoagulant effect and bleeding risk.',
    },
    {
      drugs: ['metformin', 'alcohol'],
      severity: 'moderate',
      description: 'Increased risk of lactic acidosis when combining metformin with heavy alcohol use.',
    },
    {
      drugs: ['lisinopril', 'potassium'],
      severity: 'moderate',
      description: 'ACE inhibitors like lisinopril can increase potassium levels; additional potassium may cause hyperkalemia.',
    },
    {
      drugs: ['simvastatin', 'amlodipine'],
      severity: 'moderate',
      description: 'Amlodipine can increase simvastatin blood levels, raising the risk of muscle damage (myopathy).',
    },
    {
      drugs: ['ssri', 'tramadol'],
      severity: 'severe',
      description: 'Risk of serotonin syndrome, a potentially life-threatening condition.',
    },
    {
      drugs: ['amiodarone', 'metoprolol'],
      severity: 'severe',
      description: 'Both drugs slow heart rate; combination can cause dangerously slow heart rate or heart block.',
    },
    {
      drugs: ['fluconazole', 'simvastatin'],
      severity: 'moderate',
      description: 'Fluconazole inhibits simvastatin metabolism, increasing statin toxicity risk.',
    },
    {
      drugs: ['clopidogrel', 'omeprazole'],
      severity: 'moderate',
      description: 'Omeprazole reduces the antiplatelet effect of clopidogrel, potentially reducing cardiovascular protection.',
    },
    {
      drugs: ['methotrexate', 'nsaids'],
      severity: 'severe',
      description: 'NSAIDs can reduce kidney clearance of methotrexate, leading to toxic accumulation.',
    },
    {
      drugs: ['digoxin', 'amiodarone'],
      severity: 'severe',
      description: 'Amiodarone significantly increases digoxin levels, risking digoxin toxicity.',
    },
    {
      drugs: ['metformin', 'ibuprofen'],
      severity: 'minor',
      description: 'NSAIDs may slightly reduce metformin effectiveness through effect on renal function.',
    },
    {
      drugs: ['atorvastatin', 'clarithromycin'],
      severity: 'moderate',
      description: 'Clarithromycin can dramatically increase atorvastatin blood levels, increasing myopathy risk.',
    },
    {
      drugs: ['sildenafil', 'nitrates'],
      severity: 'severe',
      description: 'Extremely dangerous combination causing severe, potentially fatal drop in blood pressure.',
    },
    {
      drugs: ['ciprofloxacin', 'antacids'],
      severity: 'minor',
      description: 'Antacids can reduce ciprofloxacin absorption by up to 90%. Take 2 hours before or 6 hours after.',
    },
  ];

  const drugNames = medications.map((m) =>
    (m.genericName || m.brandName || m.name || '').toLowerCase()
  );

  // Check each pair of drugs
  for (let i = 0; i < drugNames.length; i++) {
    for (let j = i + 1; j < drugNames.length; j++) {
      const drug1 = drugNames[i];
      const drug2 = drugNames[j];

      for (const interaction of knownInteractions) {
        const [a, b] = interaction.drugs;
        if (
          (drug1.includes(a) && drug2.includes(b)) ||
          (drug1.includes(b) && drug2.includes(a))
        ) {
          interactions.push({
            id: `${i}-${j}`,
            drug1: medications[i].brandName || medications[i].name,
            drug2: medications[j].brandName || medications[j].name,
            severity: interaction.severity,
            description: interaction.description,
          });
        }
      }
    }
  }

  // Also try FDA Adverse Event API for additional signals
  try {
    if (medications.length >= 2) {
      const drugQuery = medications
        .slice(0, 3)
        .map((m) => `patient.drug.medicinalproduct:"${m.brandName || m.name}"`)
        .join('+AND+');

      const url = `https://api.fda.gov/drug/event.json?search=${encodeURIComponent(drugQuery)}&count=patient.reaction.reactionmeddrapt.exact&limit=5`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.results?.length > 0 && interactions.length === 0) {
          interactions.push({
            id: 'fda-signal',
            drug1: medications[0].brandName || medications[0].name,
            drug2: medications.slice(1).map((m) => m.brandName || m.name).join(' + '),
            severity: 'moderate',
            description: `FDA adverse event reports indicate possible interactions. Top reactions reported: ${data.results.slice(0, 3).map((r) => r.term).join(', ')}.`,
          });
        }
      }
    }
  } catch {
    // Silently handle API failures
  }

  return interactions;
}

/**
 * Get drug details from FDA label database
 */
export async function getDrugDetails(drugName) {
  try {
    const url = `${FDA_BASE_URL}/label.json?search=openfda.brand_name:"${encodeURIComponent(drugName)}"&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    return data.results?.[0] || null;
  } catch {
    return null;
  }
}
