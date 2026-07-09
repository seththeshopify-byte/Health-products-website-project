import { db } from "@workspace/db";
import { shippingZonesTable } from "@workspace/db";

export interface ShippingAddress {
  country: string;
  province?: string;
  postalCode?: string;
  line1?: string;
  city?: string;
}

/**
 * Calculate shipping fee for a given address.
 *
 * Ruth Health ships within Nigeria only, from Lagos. Zones are matched
 * most-specific-first:
 *   1. country + region/state match (e.g. Nigeria + Lagos — usually free,
 *      since that's where the office is)
 *   2. country-only match (flat fee for the rest of Nigeria)
 *   3. default fallback fee
 *
 * This function is isolated here so zones/fees can be edited in one place
 * (see the shipping-zones admin screen).
 */
export async function calculateShipping(address: ShippingAddress): Promise<number> {
  const zones = await db.select().from(shippingZonesTable);

  const country = address.country?.toUpperCase().trim() ?? "";
  const region = (address.province ?? "").toUpperCase().trim();
  const postalPrefix = (address.postalCode ?? "").substring(0, 3).toUpperCase();

  // Most specific: country + state/region match (e.g. NG + Lagos)
  if (region) {
    const specific = zones.find(
      (z) => z.country.toUpperCase() === country && z.regionOrPostalPrefix?.toUpperCase() === region,
    );
    if (specific) {
      return specific.isFree ? 0 : Number(specific.feeAmount);
    }
  }

  // Fall back to postal-code-prefix match for addresses without a clean region
  if (postalPrefix) {
    const specific = zones.find(
      (z) =>
        z.country.toUpperCase() === country &&
        z.regionOrPostalPrefix?.toUpperCase() === postalPrefix,
    );
    if (specific) {
      return specific.isFree ? 0 : Number(specific.feeAmount);
    }
  }

  // Country-level match (flat fee for the rest of the country)
  const countryZone = zones.find(
    (z) => z.country.toUpperCase() === country && !z.regionOrPostalPrefix,
  );
  if (countryZone) {
    return countryZone.isFree ? 0 : Number(countryZone.feeAmount);
  }

  // Default fallback fee
  return 3000;
}
