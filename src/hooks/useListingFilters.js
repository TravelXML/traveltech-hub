import { useMemo, useState } from 'react'

const SORT_OPTIONS = {
  NAME_ASC: 'name-asc',
  FOUNDED_ASC: 'founded-asc',
}

/**
 * Reusable filter/search/sort logic for a list of listings. Shared between
 * category pages (and reusable for a future "all listings" view).
 */
export function useListingFilters(listings) {
  const [search, setSearch] = useState('')
  const [selectedMarkets, setSelectedMarkets] = useState([])
  const [selectedPricingModels, setSelectedPricingModels] = useState([])
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.NAME_ASC)

  const facets = useMemo(() => {
    const markets = new Set()
    const pricingModels = new Set()
    const priceRanges = new Set()
    const products = new Set()

    for (const listing of listings) {
      listing.targetMarkets?.forEach((m) => markets.add(m))
      if (listing.pricingModel) pricingModels.add(listing.pricingModel)
      if (listing.priceRange) priceRanges.add(listing.priceRange)
      listing.products?.forEach((p) => products.add(p))
    }

    return {
      markets: [...markets].sort(),
      pricingModels: [...pricingModels].sort(),
      priceRanges: [...priceRanges].sort((a, b) => a.length - b.length),
      products: [...products].sort(),
    }
  }, [listings])

  function toggle(list, setList, value) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  const toggleMarket = (value) => toggle(selectedMarkets, setSelectedMarkets, value)
  const togglePricingModel = (value) =>
    toggle(selectedPricingModels, setSelectedPricingModels, value)
  const togglePriceRange = (value) => toggle(selectedPriceRanges, setSelectedPriceRanges, value)
  const toggleProduct = (value) => toggle(selectedProducts, setSelectedProducts, value)

  const clearAll = () => {
    setSearch('')
    setSelectedMarkets([])
    setSelectedPricingModels([])
    setSelectedPriceRanges([])
    setSelectedProducts([])
  }

  const activeFilters = useMemo(() => {
    const chips = []
    selectedMarkets.forEach((v) => chips.push({ type: 'market', value: v, onRemove: () => toggleMarket(v) }))
    selectedPricingModels.forEach((v) =>
      chips.push({ type: 'pricingModel', value: v, onRemove: () => togglePricingModel(v) })
    )
    selectedPriceRanges.forEach((v) =>
      chips.push({ type: 'priceRange', value: v, onRemove: () => togglePriceRange(v) })
    )
    selectedProducts.forEach((v) => chips.push({ type: 'product', value: v, onRemove: () => toggleProduct(v) }))
    if (search.trim()) chips.push({ type: 'search', value: search, onRemove: () => setSearch('') })
    return chips
  }, [selectedMarkets, selectedPricingModels, selectedPriceRanges, selectedProducts, search])

  const filteredListings = useMemo(() => {
    const q = search.trim().toLowerCase()

    let result = listings.filter((listing) => {
      if (q) {
        const haystack = [listing.name, listing.description, ...(listing.products ?? [])]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (selectedMarkets.length && !selectedMarkets.some((m) => listing.targetMarkets?.includes(m)))
        return false
      if (selectedPricingModels.length && !selectedPricingModels.includes(listing.pricingModel))
        return false
      if (selectedPriceRanges.length && !selectedPriceRanges.includes(listing.priceRange)) return false
      if (selectedProducts.length && !selectedProducts.some((p) => listing.products?.includes(p)))
        return false
      return true
    })

    result = [...result].sort((a, b) => {
      if (sortBy === SORT_OPTIONS.FOUNDED_ASC) return a.founded - b.founded
      return a.name.localeCompare(b.name)
    })

    return result
  }, [listings, search, selectedMarkets, selectedPricingModels, selectedPriceRanges, selectedProducts, sortBy])

  return {
    search,
    setSearch,
    sortBy,
    setSortBy,
    sortOptions: SORT_OPTIONS,
    facets,
    selectedMarkets,
    selectedPricingModels,
    selectedPriceRanges,
    selectedProducts,
    toggleMarket,
    togglePricingModel,
    togglePriceRange,
    toggleProduct,
    activeFilters,
    clearAll,
    filteredListings,
    resultCount: filteredListings.length,
  }
}
