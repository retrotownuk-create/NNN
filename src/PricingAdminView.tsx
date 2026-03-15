import React, { useState, useEffect } from 'react';
import { DollarSign, Save, RefreshCw } from 'lucide-react';
import { getDefaultPricing, getPricingConfig } from './OrderDetailsView';

export const PricingAdminView = () => {
  const [pricing, setPricing] = useState(getPricingConfig());
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('rackbuilder_pricing', JSON.stringify(pricing));
    setTimeout(() => {
      setIsSaving(false);
      setShowSavedMsg(true);
      setTimeout(() => setShowSavedMsg(false), 3000);
    }, 600);
  };

  const handleReset = () => {
    if (window.confirm('Reset all prices to default settings?')) {
      const defaults = getDefaultPricing();
      setPricing(defaults);
      localStorage.setItem('rackbuilder_pricing', JSON.stringify(defaults));
    }
  };

  const handleChange = (field: string, val: string) => {
    setPricing((prev: any) => {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: parsed };
    });
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 max-w-5xl mx-auto mt-4 md:mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            Global Pricing Catalog
          </h2>
          <p className="text-sm font-bold text-gray-400 mt-2">Adjust base prices for pipes, wood, and fittings. Changes apply instantly to all new calculations.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <button 
            onClick={handleReset}
            className="w-full sm:w-auto px-4 py-3 md:py-2 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Defaults
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-3 md:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-200"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </div>
      </div>

      {showSavedMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 font-bold text-sm flex items-center gap-2">
          Pricing catalog updated successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Core Materials */}
        <div className="space-y-6">
          <h3 className="text-lg font-black text-gray-800 border-b pb-2">Core Materials</h3>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Round / Square Pipe (per meter Fallback)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-bold">$</span>
                </div>
                <input 
                  type="number"
                  step="0.50"
                  value={pricing.pipePerMeter ?? (pricing.pipePerCm ? pricing.pipePerCm * 100 : 10.00)}
                  onChange={(e) => handleChange('pipePerMeter', e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-gray-800"
                />
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Individual Pipe Lengths</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    5, 8, 10, 12, 15, 17, 20, 23, 25, 30, 35, 40,
                    45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
                    105, 110, 120, 125
                  ].map(size => {
                    const id = `pipe${size}`;
                    const meterPrice = pricing.pipePerMeter ?? (pricing.pipePerCm ? pricing.pipePerCm * 100 : 10.00);
                    return (
                      <div key={id} className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm flex flex-col group hover:border-emerald-300 transition-colors">
                        <label className="text-[9px] font-black text-gray-400 uppercase mb-1">{size} cm</label>
                        <div className="relative">
                           <span className="absolute left-1.5 top-1.5 text-gray-400 font-bold text-xs">$</span>
                           <input
                             type="number"
                             step="0.10"
                             value={pricing[id] !== undefined && pricing[id] !== '' ? pricing[id] : ''}
                             onChange={(e) => handleChange(id, e.target.value)}
                             placeholder={(size * (meterPrice / 100)).toFixed(2)}
                             className="w-full pl-4 pr-1 py-1 bg-transparent focus:outline-none focus:ring-0 font-bold text-gray-800 text-xs placeholder:text-gray-300"
                           />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <label className="block text-xs font-black text-amber-700 uppercase tracking-widest mb-2">Solid Wood Shelves (per meter)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-amber-700 font-bold">$</span>
                </div>
                <input 
                  type="number"
                  step="0.50"
                  value={pricing.woodPerMeter ?? pricing.wood ?? 4.00}
                  onChange={(e) => handleChange('woodPerMeter', e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold text-gray-800"
                />
              </div>
            </div>

            <div className="bg-cyan-50 p-4 rounded-2xl border border-cyan-100">
              <label className="block text-xs font-black text-cyan-700 uppercase tracking-widest mb-2">Lucite Acrylic Rods (per meter)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-cyan-700 font-bold">$</span>
                </div>
                <input 
                  type="number"
                  step="0.01"
                  value={pricing.acrylic}
                  onChange={(e) => handleChange('acrylic', e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-white border border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-500 font-bold text-gray-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Components & Fittings */}
        <div className="space-y-6">
          <h3 className="text-lg font-black text-gray-800 border-b pb-2">Components & Fittings</h3>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Hairpin Legs (86cm)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-bold">$</span>
                </div>
                <input 
                  type="number"
                  step="1.00"
                  value={pricing.hairpinLegs}
                  onChange={(e) => handleChange('hairpinLegs', e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-gray-800"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Standard L-Brackets</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-bold">$</span>
                </div>
                <input 
                  type="number"
                  step="0.50"
                  value={pricing.lBrackets}
                  onChange={(e) => handleChange('lBrackets', e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-gray-800"
                />
              </div>
            </div>

            <h4 className="font-bold text-sm text-gray-600 mt-4 border-b pb-2">Individual Fittings</h4>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'flange', label: 'Flange' },
                { id: 'tee', label: 'T-Fitting' },
                { id: 'elbow90', label: '90° Elbow' },
                { id: 'elbow45', label: '45° Elbow' },
                { id: 'cornerElbow3way', label: '3-Way Corner Elbow' },
                { id: 'cross', label: 'Cross Fitting' },
                { id: 'way5', label: '5-Way Fitting' },
                { id: 'way4', label: '4-Way Fitting' },
                { id: 'reducer', label: 'Reducer' },
                { id: 'connectorBracket', label: 'Connector Bracket' },
                { id: 'straightHandrailBracket', label: 'Str. Handrail Bracket' },
                { id: 'handrailBracket', label: 'Angled Handrail Bracket' },
                { id: 'union', label: 'Union' },
                { id: 'coupling', label: 'Coupling' },
                { id: 'hexNipple', label: 'Hex Nipple' },
                { id: 'redValve', label: 'Red Valve' },
                { id: 'luciteEndCap', label: 'Lucite End Cap' },
                { id: 'pipeEndCap', label: 'Pipe End Cap' },
                { id: 'inCap', label: 'In Cap' },
              ].map(fitting => (
                <div key={fitting.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 truncate" title={fitting.label}>{fitting.label}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-bold text-sm">$</span>
                    </div>
                    <input 
                      type="number"
                      step="0.10"
                      value={pricing[fitting.id] ?? pricing.baseFitting}
                      onChange={(e) => handleChange(fitting.id, e.target.value)}
                      className="w-full pl-7 pr-2 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold text-gray-800 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
