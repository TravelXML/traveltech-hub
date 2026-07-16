function FilterGroup({ title, options, selected, onToggle }) {
  if (!options.length) return null
  return (
    <div className="border-b border-slate-100 py-4 first:pt-0 last:border-0">
      <h4 className="mb-2 text-sm font-semibold text-slate-900">{title}</h4>
      <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
        {options.map((option) => (
          <label key={option} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  )
}

export default function FilterSidebar({ filters }) {
  const {
    facets,
    selectedMarkets,
    selectedPricingModels,
    selectedPriceRanges,
    selectedProducts,
    selectedFeatures,
  } = filters

  return (
    <div>
      <FilterGroup
        title="Products"
        options={facets.products}
        selected={selectedProducts}
        onToggle={filters.toggleProduct}
      />
      <FilterGroup
        title="Features"
        options={facets.features}
        selected={selectedFeatures}
        onToggle={filters.toggleFeature}
      />
      <FilterGroup
        title="Target Market / Geography"
        options={facets.markets}
        selected={selectedMarkets}
        onToggle={filters.toggleMarket}
      />
      <FilterGroup
        title="Pricing Model"
        options={facets.pricingModels}
        selected={selectedPricingModels}
        onToggle={filters.togglePricingModel}
      />
      <FilterGroup
        title="Price Range"
        options={facets.priceRanges}
        selected={selectedPriceRanges}
        onToggle={filters.togglePriceRange}
      />
    </div>
  )
}
