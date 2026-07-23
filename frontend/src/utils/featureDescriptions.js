export function describeFeature(featureName, value) {
  switch (featureName) {
    case 'Foot traffic score': {
      const v = Number(value)
      const level = v >= 8 ? 'Very high' : v >= 6 ? 'High' : v >= 4 ? 'Moderate' : 'Low'
      const tip   = v >= 8 ? 'Premium footfall — lots of passing customers'
                  : v >= 6 ? 'Good pedestrian activity for a new business'
                  : v >= 4 ? 'Decent footfall — may need marketing support'
                  : 'Limited passing trade — depends on destination customers'
      return { display: `${v.toFixed(1)} / 10`, level, tip }
    }
    case 'Competitor density': {
      const v = Math.round(Number(value))
      const level = v <= 5 ? 'Low competition' : v <= 15 ? 'Moderate' : v <= 25 ? 'High competition' : 'Saturated'
      const tip   = v <= 5  ? `Only ${v} similar businesses within 500m — untapped market`
                  : v <= 15 ? `${v} similar businesses nearby — competitive but viable`
                  : v <= 25 ? `${v} similar businesses — strong differentiation needed`
                  :           `${v} competitors within 500m — very saturated`
      return { display: `${v} nearby`, level, tip }
    }
    case 'Infrastructure quality': {
      const v = Number(value)
      const level = v >= 8 ? 'Excellent' : v >= 6 ? 'Good' : v >= 4 ? 'Fair' : 'Poor'
      const tip   = v >= 8 ? 'Great road access, utilities and connectivity'
                  : v >= 6 ? 'Good basic infrastructure — accessible to customers'
                  : v >= 4 ? 'Adequate but some access challenges'
                  : 'Limited road access — may deter customers'
      return { display: `${v.toFixed(1)} / 10`, level, tip }
    }
    case 'Area income level (RWF)': {
      const v = Number(value)
      const formatted = v >= 1_000_000 ? `RWF ${(v/1_000_000).toFixed(1)}M` : `RWF ${Math.round(v/1000)}K`
      const level = v >= 900_000 ? 'High income' : v >= 600_000 ? 'Upper-middle' : v >= 350_000 ? 'Middle income' : 'Lower income'
      const tip   = v >= 900_000 ? 'High purchasing power — supports premium pricing'
                  : v >= 600_000 ? 'Good disposable income — solid customer base'
                  : v >= 350_000 ? 'Moderate spending power — value-for-money positioning works best'
                  : 'Lower income area — affordable pricing is key'
      return { display: formatted, level, tip }
    }
    case 'Transit accessibility': {
      const v = Math.round(Number(value))
      const level = v >= 8 ? 'Excellent' : v >= 5 ? 'Good' : v >= 3 ? 'Fair' : 'Poor'
      const tip   = v >= 8 ? `${v} bus stops nearby — very easy for customers to reach`
                  : v >= 5 ? `${v} bus stops — good public transport access`
                  : v >= 3 ? `${v} nearby stops — mainly walkable catchment`
                  : `${v} transit stop(s) — customers mostly arrive by private transport`
      return { display: `${v} bus stops`, level, tip }
    }
    case 'Google rating': {
      const v = Number(value)
      const level = v >= 4.3 ? 'Excellent area' : v >= 3.8 ? 'Good area' : v >= 3.3 ? 'Average' : 'Weak area'
      const tip   = v >= 4.3 ? 'Nearby businesses rate very highly — quality neighbourhood'
                  : v >= 3.8 ? 'Solid ratings nearby — healthy competitive standard'
                  : v >= 3.3 ? 'Average quality — room to stand out'
                  : 'Low ratings nearby — area needs quality entrants'
      return { display: `${v.toFixed(1)} ★ avg`, level, tip }
    }
    case 'Review volume': {
      const v = Math.round(Number(value))
      const level = v >= 200 ? 'Very active' : v >= 50 ? 'Active' : v >= 15 ? 'Moderate' : 'Low'
      const tip   = v >= 200 ? `${v} avg reviews — high online engagement, busy area`
                  : v >= 50  ? `${v} avg reviews — good customer engagement`
                  : v >= 15  ? `${v} avg reviews — moderate activity`
                  : `${v} avg reviews — limited online presence`
      return { display: `${v} avg reviews`, level, tip }
    }
    case 'Price level (0–4)': {
      const v = Math.round(Number(value))
      const labels = ['Budget (₣)', 'Affordable (₣)', 'Mid-range (₣₣)', 'Premium (₣₣₣)', 'Luxury (₣₣₣₣)']
      const tips   = [
        'Budget market — high volume, low margin',
        'Affordable — large accessible customer base',
        'Mid-range — good balance of volume and margin',
        'Premium — smaller but high-value customer base',
        'Luxury — very selective, high margin',
      ]
      return { display: labels[v] || `Level ${v}`, level: labels[v], tip: tips[v] || '' }
    }
    case 'Years in operation': {
      const v = Number(value)
      const level = v >= 4 ? 'Mature market' : v >= 2 ? 'Established' : v >= 1 ? 'Growing' : 'Emerging'
      const tip   = v >= 4 ? 'Long-established businesses nearby — stable proven market'
                  : v >= 2 ? 'Maturing market with proven demand'
                  : v >= 1 ? 'Growing market — early opportunity'
                  : 'Very new businesses nearby — emerging area, higher risk and reward'
      return { display: `~${v.toFixed(1)} yrs avg`, level, tip }
    }
    case 'Chain vs independent': {
      const v = Number(value)
      return {
        display: v >= 0.5 ? 'Chains present' : 'Independent-led',
        level:   v >= 0.5 ? 'Chain presence' : 'Independent market',
        tip:     v >= 0.5 ? 'Chain brands active here — validates market but raises bar'
                          : 'Independent businesses dominate — open field for new local entrants',
      }
    }
    case 'Has photo presence': {
      const v = Number(value)
      return {
        display: v >= 0.5 ? 'Photos common' : 'Photos rare',
        level:   v >= 0.5 ? 'High visibility' : 'Low visibility',
        tip:     v >= 0.5 ? 'Businesses here have strong online photo presence'
                          : 'Low photo presence — opportunity to stand out online',
      }
    }
    default:
      return { display: String(value), level: '', tip: '' }
  }
}

export const BUSINESS_TYPES = [
  { value: 'restaurant',  label: 'Restaurant',        icon: '🍽️', tips: 'Needs foot traffic ≥6, income ≥RWF 400K, moderate competition.' },
  { value: 'cafe',        label: 'Café / Coffee shop', icon: '☕',  tips: 'Thrives near offices, universities, and morning commuter routes.' },
  { value: 'pharmacy',    label: 'Pharmacy',           icon: '💊',  tips: 'Best in residential areas with low existing pharmacy density.' },
  { value: 'salon',       label: 'Salon / Barbershop', icon: '✂️',  tips: 'Needs residential foot traffic and disposable income — repeat customers.' },
  { value: 'hotel',       label: 'Hotel / Lodging',    icon: '🏨',  tips: 'Benefits from transit access, tourism, and higher income areas.' },
  { value: 'supermarket', label: 'Supermarket / Shop', icon: '🛒',  tips: 'Needs high residential density and low existing supermarket coverage.' },
  { value: 'gym',         label: 'Gym / Fitness',      icon: '🏋️',  tips: 'Best in upper-income areas (RWF 600K+) with younger demographics.' },
  { value: 'school',      label: 'School / Tutoring',  icon: '📚',  tips: 'Needs residential density, safe infrastructure, and transit access.' },
]