import { z } from "zod";

export interface Channel3Product {
  id: string;
  sku: string;
  title: string;
  brand: string;
  category: string;
  description: string;
  priceCents: number; // Stored strictly as integer minor units per AGENTS.md
  priceDisplay: string;
  currency: string;
  imageUrl: string;
  retailer: string;
  inStock: boolean;
  attributes: Record<string, string | number>;
}

export interface Channel3SearchParams {
  query: string;
  category?: string;
  limit?: number;
}

export interface Channel3SearchResult {
  success: boolean;
  count: number;
  provider: "CHANNEL3_LIVE" | "CHANNEL3_FIXTURE";
  products: Channel3Product[];
}

// Built-in high-fidelity reference catalog fixtures for offline/demo reliability
const SAMPLE_CHANNEL3_PRODUCTS: Channel3Product[] = [
  {
    id: "c3_prod_001",
    sku: "SNK-NIKE-AIR-MAX-270",
    title: "Nike Air Max 270 React Running Shoes",
    brand: "Nike",
    category: "Footwear",
    description: "Breathable mesh upper with dual-density foam midsole and large Max Air heel unit.",
    priceCents: 15000,
    priceDisplay: "$150.00 USD",
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    retailer: "Foot Locker",
    inStock: true,
    attributes: { color: "Black/White/Solar Red", size: "US 10.5", weightGrams: 310 },
  },
  {
    id: "c3_prod_002",
    sku: "ELC-APPL-AIRPODS-PRO-2",
    title: "Apple AirPods Pro (2nd Generation) with MagSafe Case (USB-C)",
    brand: "Apple",
    category: "Electronics",
    description: "Up to 2x more Active Noise Cancellation, Adaptive Audio, and Transparency mode.",
    priceCents: 24900,
    priceDisplay: "$249.00 USD",
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=80",
    retailer: "Best Buy",
    inStock: true,
    attributes: { chip: "Apple H2", batteryHours: 30, connectivity: "Bluetooth 5.3" },
  },
  {
    id: "c3_prod_003",
    sku: "IOT-SENS-SEISMIC-GEO-X4",
    title: "TerraSens Micro-Seismic Vibration Sensor (Industrial IoT)",
    brand: "GeoTelemetry Systems",
    category: "Hardware",
    description: "Tri-axial MEMS accelerometer for early earthquake and landslide ground motion detection.",
    priceCents: 38900,
    priceDisplay: "$389.00 USD",
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80",
    retailer: "DigiKey",
    inStock: true,
    attributes: { range: "±16g", sampleRateHz: 1000, ingressProtection: "IP68" },
  },
  {
    id: "c3_prod_004",
    sku: "IOT-DRONE-DJI-MATRICE-300",
    title: "DJI Matrice 300 RTK Commercial Disaster Inspection Drone",
    brand: "DJI",
    category: "Hardware",
    description: "High-end multi-hazard surveying drone with 55 min flight time and 15 km transmission.",
    priceCents: 1250000,
    priceDisplay: "$12,500.00 USD",
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=400&q=80",
    retailer: "B&H Photo",
    inStock: true,
    attributes: { maxPayloadKg: 2.7, windResistanceMs: 15, operationalTemp: "-20C to 50C" },
  },
  {
    id: "c3_prod_005",
    sku: "APP-PATAGONIA-TORRENTSHELL",
    title: "Patagonia Torrentshell 3L Waterproof Rain Jacket",
    brand: "Patagonia",
    category: "Apparel",
    description: "3-layer H2No Performance Standard waterproof/breathable shell with 100% recycled nylon face.",
    priceCents: 17900,
    priceDisplay: "$179.00 USD",
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1544441893-675973e31985?w=400&q=80",
    retailer: "REI",
    inStock: true,
    attributes: { material: "100% Recycled Nylon", waterproofRatingMm: 20000 },
  },
];

export class Channel3Service {
  private apiKey: string;
  private apiBaseUrl: string;

  constructor() {
    this.apiKey = process.env.CHANNEL3_API_KEY || "";
    this.apiBaseUrl = process.env.CHANNEL3_API_URL || "https://api.trychannel3.com/v1";
  }

  /**
   * Search universal product catalogs via Channel 3 API
   * Automatically falls back to high-fidelity reference catalog when offline or demo key
   */
  async searchProducts(params: Channel3SearchParams): Promise<Channel3SearchResult> {
    const query = params.query.trim().toLowerCase();
    const limit = Math.min(Math.max(params.limit || 10, 1), 50);

    if (this.apiKey && this.apiKey !== "mock_key") {
      try {
        const url = `${this.apiBaseUrl}/search`;
        const postBody: Record<string, any> = {
          query: params.query || "product",
          limit,
        };

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "x-api-key": this.apiKey,
            "content-type": "application/json",
            "accept": "application/json",
          },
          body: JSON.stringify(postBody),
          signal: AbortSignal.timeout(8000),
        });

        if (res.ok) {
          const raw = (await res.json()) as any;
          const rawProducts = Array.isArray(raw.products) ? raw.products : (Array.isArray(raw.items) ? raw.items : []);
          
          if (rawProducts.length > 0) {
            const items: Channel3Product[] = rawProducts.map((item: any) => {
              // Extract primary offer and price
              const primaryOffer = Array.isArray(item.offers) && item.offers.length > 0 ? item.offers[0] : null;
              const rawPrice = primaryOffer?.price?.price ?? item.price;
              const priceVal = typeof rawPrice === "number" ? Math.round(rawPrice * 100) : 0;
              const currency = primaryOffer?.price?.currency || item.currency || "USD";

              // Extract image (cleaned_url or url)
              const primaryImage = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null;
              const imgUrl = primaryImage?.cleaned_url || primaryImage?.url || item.image || item.imageUrl || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80";

              // Extract brand
              const brandName = Array.isArray(item.brands) && item.brands.length > 0
                ? item.brands[0].name
                : (item.brand || "Retail Brand");

              // Extract category
              let catTitle = item.category?.title || item.category?.slug || "General";
              if (params.category && params.category !== "ALL") {
                catTitle = params.category;
              }

              // Flatten structured attributes if present
              const flatAttrs: Record<string, string | number> = {};
              if (item.structured_attributes && typeof item.structured_attributes === "object") {
                for (const [k, v] of Object.entries(item.structured_attributes)) {
                  flatAttrs[k] = Array.isArray(v) ? (v as string[]).join(", ") : String(v);
                }
              }

              return {
                id: item.id || `c3_${Math.random().toString(36).substring(2, 9)}`,
                sku: `C3-${(brandName || "GEN").slice(0, 4).toUpperCase()}-${item.id || "SKU"}`,
                title: item.title || item.name || "Product",
                brand: brandName,
                category: catTitle,
                description: item.description || (item.key_features ? item.key_features.join(". ") : ""),
                priceCents: priceVal,
                priceDisplay: `$${(priceVal / 100).toFixed(2)} ${currency}`,
                currency,
                imageUrl: imgUrl,
                retailer: primaryOffer?.domain || "Channel 3 Verified",
                inStock: primaryOffer ? primaryOffer.availability === "InStock" : (item.inStock !== false),
                attributes: flatAttrs,
              };
            });

            // Filter by category if requested
            let filteredItems = items;
            if (params.category && params.category !== "ALL") {
              const catLower = params.category.toLowerCase();
              filteredItems = items.filter((p) =>
                p.category.toLowerCase().includes(catLower) ||
                (catLower === "footwear" && (p.category.toLowerCase().includes("shoe") || p.category.toLowerCase().includes("sneaker"))) ||
                (catLower === "apparel" && (p.category.toLowerCase().includes("clothing") || p.category.toLowerCase().includes("jacket")))
              );
              // If category filter was too aggressive and returned 0, return all fetched items rather than empty
              if (filteredItems.length === 0) {
                filteredItems = items;
              }
            }

            return {
              success: true,
              count: filteredItems.length,
              provider: "CHANNEL3_LIVE",
              products: filteredItems.slice(0, limit),
            };
          }
        }
      } catch (err) {
        console.warn("Channel 3 live API query failed, falling back to reference fixtures:", err);
      }
    }

    // Local deterministic filter over reference fixtures
    let matched = SAMPLE_CHANNEL3_PRODUCTS.filter((p) => {
      if (params.category && params.category !== "ALL") {
        const catL = params.category.toLowerCase();
        const pCatL = p.category.toLowerCase();
        if (pCatL !== catL && !pCatL.includes(catL)) return false;
      }
      if (!query || query === "*") return true;
      const q = query.replace(/s$/, ""); // singularize (e.g. shoes -> shoe)
      return (
        p.title.toLowerCase().includes(query) ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    });

    if (matched.length === 0) {
      if (params.category && params.category !== "ALL") {
        matched = SAMPLE_CHANNEL3_PRODUCTS.filter(
          (p) => p.category.toLowerCase() === params.category!.toLowerCase()
        );
      }
      if (matched.length === 0) {
        matched = SAMPLE_CHANNEL3_PRODUCTS;
      }
    }

    return {
      success: true,
      count: matched.length,
      provider: "CHANNEL3_FIXTURE",
      products: matched.slice(0, limit),
    };
  }

  /**
   * Tool Definition for Nexum AI (Gemini / Groq mediation tool execution)
   */
  getMediatorToolDefinition() {
    return {
      name: "search_product_catalog",
      description: "Query Channel 3 universal product discovery API to retrieve real SKUs, pricing baselines, and catalog structures for e-commerce, retail, and hardware projects.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search keywords (e.g., 'running shoes', 'sensors', 'electronics')",
          },
          category: {
            type: "string",
            description: "Optional product category filter (Footwear, Electronics, Hardware, Apparel)",
          },
          limit: {
            type: "integer",
            description: "Maximum number of sample SKUs to return (1-20)",
          },
        },
        required: ["query"],
      },
      execute: async (args: { query: string; category?: string; limit?: number }) => {
        return this.searchProducts(args);
      },
    };
  }
}

export const channel3Service = new Channel3Service();

